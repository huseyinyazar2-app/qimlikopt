const axios = require('axios');
const db = require('./db');

// Ters-OTP dış webhook teslim kuyrugu.
// Mesaj alindi/dogrulandi olayi (logs.status='success') ile musteriye webhook teslimi
// AYRI tutulur: musterinin sunucusu dusse bile dogrulama calisir, teslim kuyrukta yeniden denenir.

// Basarisiz denemeler icin artan bekleme (dakika). attempts sirasina gore.
const BACKOFF_MINUTES = [1, 5, 15, 60, 180, 360];
const DEFAULT_MAX_ATTEMPTS = 6;
const BATCH_SIZE = 20;
const REQUEST_TIMEOUT_MS = 8000;

let processing = false;
let timer = null;

// Bir teslim kaydini kuyruga ekler ve hemen bir islem turu tetikler (dusuk gecikme).
async function enqueueWebhook({ client, logId, payload }) {
    if (!client || !client.webhook_url) return null;
    const body = JSON.stringify(payload);
    const result = await db.query(
        `INSERT INTO webhook_deliveries (client_id, prefix, log_id, target_url, payload_json, status, max_attempts, next_attempt_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
        [client.id, client.prefix, logId || null, client.webhook_url, body, DEFAULT_MAX_ATTEMPTS]
    );
    const id = result.lastInsertRowid != null ? Number(result.lastInsertRowid) : null;
    // Beklemeden isle (fire-and-forget). Re-entrancy guard cift teslimi onler.
    setImmediate(() => { processQueue().catch(() => {}); });
    return id;
}

// Tek bir teslimi dener. 2xx -> teslim edildi.
async function deliverOne(row) {
    let payload;
    try {
        payload = JSON.parse(row.payload_json);
    } catch (e) {
        payload = {};
    }
    // Idempotency: musteri tekrarlari ayirt edebilsin
    const headers = {
        'Content-Type': 'application/json',
        'x-qimlik-key': payload._api_key || undefined,
        'x-qimlik-delivery-id': String(row.id),
        'x-qimlik-event-id': String(row.log_id || ''),
    };
    // _api_key'i govdeden cikar (header'da gonderiliyor)
    const sendBody = { ...payload };
    delete sendBody._api_key;

    const resp = await axios.post(row.target_url, sendBody, { headers, timeout: REQUEST_TIMEOUT_MS });
    return resp.status;
}

async function markDelivered(row, statusCode) {
    await db.query(
        `UPDATE webhook_deliveries SET status='delivered', attempts=attempts+1, last_status_code=?,
                last_error=NULL, delivered_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [statusCode || 200, row.id]
    );
}

async function markFailed(row, statusCode, errorMsg) {
    const nextAttempts = (row.attempts || 0) + 1;
    const max = row.max_attempts || DEFAULT_MAX_ATTEMPTS;
    if (nextAttempts >= max) {
        await db.query(
            `UPDATE webhook_deliveries SET status='dead', attempts=?, last_status_code=?, last_error=?,
                    updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [nextAttempts, statusCode || null, String(errorMsg || '').slice(0, 500), row.id]
        );
    } else {
        const delay = BACKOFF_MINUTES[Math.min(nextAttempts - 1, BACKOFF_MINUTES.length - 1)];
        await db.query(
            `UPDATE webhook_deliveries SET status='failed', attempts=?, last_status_code=?, last_error=?,
                    next_attempt_at=datetime('now', '+' || ? || ' minutes'), updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [nextAttempts, statusCode || null, String(errorMsg || '').slice(0, 500), delay, row.id]
        );
    }
}

// Zamani gelmis bekleyen/basarisiz teslimleri isler. Tek seferde re-entrant degil.
async function processQueue() {
    if (processing) return;
    processing = true;
    try {
        const { rows } = await db.query(
            `SELECT * FROM webhook_deliveries
             WHERE status IN ('pending','failed') AND attempts < max_attempts
               AND next_attempt_at <= datetime('now')
             ORDER BY next_attempt_at ASC LIMIT ?`,
            [BATCH_SIZE]
        );
        for (const row of rows) {
            try {
                const statusCode = await deliverOne(row);
                await markDelivered(row, statusCode);
            } catch (err) {
                const statusCode = err.response ? err.response.status : null;
                // 4xx (401/404/422 vb.) kalici hata sayilabilir ama basit tutup yeniden deniyoruz;
                // yalnizca 400/401/403/404 icin daha hizli olecek sekilde ilerlet.
                await markFailed(row, statusCode, err.message);
            }
        }
    } catch (err) {
        console.error('[webhook] processQueue hata:', err.message);
    } finally {
        processing = false;
    }
}

// Periyodik arka plan islemcisi (yeniden deneme zamanlayicisi).
function startWebhookProcessor(intervalMs = 30000) {
    if (timer) return;
    timer = setInterval(() => { processQueue().catch(() => {}); }, intervalMs);
    if (timer.unref) timer.unref();
    console.log('[webhook] Yeniden deneme islemcisi baslatildi (' + Math.round(intervalMs / 1000) + 's).');
}

module.exports = { enqueueWebhook, processQueue, startWebhookProcessor };

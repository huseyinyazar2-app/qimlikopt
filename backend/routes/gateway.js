const express = require('express');
const db = require('../db');
const { enqueueWebhook } = require('../webhook');

const router = express.Router();

// Middleware to verify Gateway API Key (Security)
const authenticateGateway = (req, res, next) => {
    const apiKey = req.headers['x-gateway-key'];
    const validKey = process.env.GATEWAY_API_KEY;
    
    if (!apiKey || apiKey !== validKey) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Gateway Key' });
    }
    next();
};

/**
 * POST /api/gateway/receive
 * Payload from Android APK: { phone: "+90555...", message: "AKTAS 12345" }
 */
router.post('/receive', authenticateGateway, async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ error: 'Phone and message are required' });
        }

        // Parse Prefix (first word)
        const parts = message.trim().split(/\s+/);
        const prefix = parts[0].toUpperCase();
        const code = parts.slice(1).join(' ');

        // Find Client by Prefix
        const { rows } = await db.query('SELECT * FROM clients WHERE prefix = ? AND is_active = TRUE', [prefix]);
        const client = rows[0];

        if (!client) {
            // Log failed attempt (Invalid prefix)
            await db.query(
                'INSERT INTO logs (phone_number, message_body, status, error_details) VALUES (?, ?, ?, ?)',
                [phone, message, 'invalid_prefix', `No active client found for prefix: ${prefix}`]
            );
            return res.status(404).json({ error: 'Client not found or inactive' });
        }

        // Mesaj alindi ve musteri eslesti -> ters-OTP dogrulamasi BASARILI.
        // Bu, dis webhook tesliminden BAGIMSIZDIR: musterinin sunucusu dusse bile
        // dogrulama (verify-status / verifyOtp) calisir. Teslim ayri kuyrukta yeniden denenir.
        const logResult = await db.query(
            'INSERT INTO logs (client_id, phone_number, message_body, status, error_details) VALUES (?, ?, ?, ?, ?)',
            [client.id, phone, message, 'success', null]
        );
        const logId = logResult.lastInsertRowid != null ? Number(logResult.lastInsertRowid) : null;

        // Dis webhook teslimini kuyruga al (idempotent yeniden deneme). Gateway'i bekletmez.
        try {
            await enqueueWebhook({
                client,
                logId,
                payload: {
                    prefix: client.prefix,
                    user_phone: phone,
                    code: code,
                    full_message: message,
                    status: 'verified',
                    _api_secret: client.api_secret,
                },
            });
        } catch (queueErr) {
            console.error('[gateway] webhook kuyruga alinamadi:', queueErr.message);
        }

        // Gateway'e her zaman 200 don ki yerel kuyrugundan SMS'i silebilsin.
        res.status(200).json({ success: true, status: 'success' });

    } catch (error) {
        console.error('Error processing gateway request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * POST /api/gateway/heartbeat
 * Payload from Android APK to report it's alive
 */
router.post('/heartbeat', authenticateGateway, async (req, res) => {
    const { device_id, device_name, battery, network } = req.body;
    
    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    try {
        // Upsert device info in Turso (SQLite)
        await db.query(`
            INSERT INTO gateway_devices (device_id, device_name, battery_level, network_status, last_seen)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT (device_id) DO UPDATE SET
                device_name = excluded.device_name,
                battery_level = excluded.battery_level,
                network_status = excluded.network_status,
                last_seen = CURRENT_TIMESTAMP
        `, [device_id, device_name || 'Unknown Device', battery || 0, network || 'Unknown']);

        // Faz 6: saglik gecmisi. Heartbeat sik gelir; her birini yazmak tabloyu sisirir.
        // Son kayittan >= ~10 dk geçtiyse yeni bir gecmis satiri ekle, sonra 7 gunden
        // eskisini buda. Budama nadiren is yapar (mevcut degilse hizli doner).
        try {
            const { rows: last } = await db.query(
                'SELECT created_at FROM gateway_heartbeats WHERE device_id = ? ORDER BY id DESC LIMIT 1',
                [device_id]
            );
            const stale = !last.length ||
                (await db.query(
                    "SELECT (julianday('now') - julianday(?)) * 24 * 60 AS mins",
                    [last[0].created_at]
                )).rows[0].mins >= 10;
            if (stale) {
                await db.query(
                    'INSERT INTO gateway_heartbeats (device_id, battery_level, network_status) VALUES (?, ?, ?)',
                    [device_id, battery ?? null, network || null]
                );
                await db.query(
                    "DELETE FROM gateway_heartbeats WHERE created_at < datetime('now','-7 days')"
                );
            }
        } catch (histErr) {
            // Gecmis kaydi kritik degil; heartbeat'i basarisiz sayma.
            console.warn('[Heartbeat] gecmis kaydi atlandi:', histErr.message);
        }

        console.log(`[Heartbeat] Device: ${device_id}, Battery: ${battery}%, Network: ${network}`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating heartbeat:', error);
        res.status(500).json({ error: 'Failed to update heartbeat' });
    }
});

module.exports = router;

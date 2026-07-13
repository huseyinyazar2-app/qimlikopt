const express = require('express');
const db = require('../db');
const { signToken, companyGuard } = require('../auth');
const { samePhone } = require('../otp');

const router = express.Router();

// Not: client.api_key hem panel girişinde hem de gateway webhook imzasında (x-qimlik-key)
// kullanılan paylaşılan bir sırdır; webhook tarafı düz metne ihtiyaç duyduğu için hash'lenmez.
// Panel erişimi girişten sonra ayrı bir JWT ile korunur; api_key her istekte gönderilmez.

// --- CLIENT LOGIN ---
router.post('/login', async (req, res) => {
    const { phone_number } = req.body;
    const apiKey = req.body.api_key || req.body.password;

    if (!phone_number || !apiKey) {
        return res.status(400).json({ error: 'Telefon numarası ve şifre zorunludur.' });
    }

    try {
        const { rows } = await db.query(
            'SELECT id, company_name, prefix, webhook_url, api_key, phone_number, is_active FROM clients WHERE api_key = ?',
            [apiKey]
        );

        const cleanInputPhone = phone_number.replace(/\D/g, '');
        const client = rows.find(r => {
            const cleanDbPhone = (r.phone_number || '').replace(/\D/g, '');
            if (cleanInputPhone.length >= 9 && cleanDbPhone.length >= 9) {
                return cleanInputPhone.endsWith(cleanDbPhone.slice(-9)) || cleanDbPhone.endsWith(cleanInputPhone.slice(-9));
            }
            return cleanDbPhone === cleanInputPhone || r.phone_number === phone_number;
        });

        if (!client) {
            return res.status(401).json({ error: 'Hatalı telefon numarası veya şifre.' });
        }

        if (!client.is_active) {
            return res.status(403).json({ error: 'Hesap askıya alınmıştır.' });
        }

        const token = signToken({ role: 'company', module: 'client', id: client.id });
        res.json({ message: 'Login successful', client, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CLIENT REGISTRATION (PUBLIC) ---
router.post('/register', async (req, res) => {
    const { company_name, password, phone_number, contact_name, contact_surname } = req.body;

    if (!company_name || !password) {
        return res.status(400).json({ error: 'Şirket adı ve şifre zorunludur.' });
    }

    let cleanName = company_name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    let prefix = cleanName.substring(0, 4);
    if (prefix.length < 3) {
        prefix = 'QMLK' + Math.floor(100 + Math.random() * 900);
    }

    try {
        let finalPrefix = prefix;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            const { rows } = await db.query('SELECT id FROM clients WHERE prefix = ?', [finalPrefix]);
            if (rows.length === 0) {
                isUnique = true;
            } else {
                attempts++;
                finalPrefix = prefix + Math.floor(Math.random() * 90);
                if (finalPrefix.length > 8) {
                    finalPrefix = finalPrefix.substring(0, 8);
                }
            }
        }

        if (!isUnique) {
            return res.status(400).json({ error: 'Benzersiz bir firma kodu oluşturulamadı. Lütfen farklı bir şirket adı deneyin.' });
        }

        const host = req.headers.host || 'localhost:3303';
        const defaultWebhook = host.includes('qimlik.com')
            ? `https://api.qimlik.com/api/client/webhook/${finalPrefix}`
            : `http://${host}/api/client/webhook/${finalPrefix}`;

        await db.query(
            'INSERT INTO clients (company_name, prefix, webhook_url, api_key, phone_number, contact_name, contact_surname) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [company_name, finalPrefix, defaultWebhook, password, phone_number || '', contact_name || '', contact_surname || '']
        );

        const { rows } = await db.query(
            'SELECT id, company_name, prefix, webhook_url, api_key, phone_number, contact_name, contact_surname, is_active FROM clients WHERE prefix = ?',
            [finalPrefix]
        );

        const client = rows[0];
        const token = signToken({ role: 'company', module: 'client', id: client.id });
        res.status(201).json({ message: 'Registration successful', client, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CLIENT WEBHOOK (PUBLIC) ---
router.post('/webhook', (req, res) => {
    console.log('[Webhook Received Payload]:', req.body);
    res.status(200).json({ status: 'received', message: 'Webhook received OTP details successfully.' });
});

router.post('/webhook/:prefix', (req, res) => {
    const { prefix } = req.params;
    console.log(`[Webhook Received for ${prefix}]:`, req.body);
    res.status(200).json({ status: 'received', prefix, message: 'Webhook received OTP details successfully.' });
});


// --- PUBLIC VERIFICATION STATUS CHECK (FOR POPUPS / POLLING) ---
// Opsiyonel `phone`: verilirse, kodu GÖNDEREN numaranın da bu numarayla (son 9
// hane) eşleşmesi gerekir. Böylece "bu koda sahip biri" yerine "bu telefonun
// sahibi" doğrulanır (gerçek telefon-sahipliği). Geriye uyumlu: phone yoksa
// eski davranış (yalnız kod eşleşmesi) korunur.
router.get('/verify-status', async (req, res) => {
    const { prefix, code, phone } = req.query;

    if (!prefix || !code) {
        return res.status(400).json({ error: 'Prefix ve doğrulama kodu zorunludur.' });
    }

    try {
        const targetMessage = `${prefix.trim().toUpperCase()} ${code.trim()}`;

        const { rows } = await db.query(
            "SELECT phone_number FROM logs WHERE UPPER(message_body) = ? AND status = 'success' AND created_at >= datetime('now', '-5 minutes') ORDER BY id DESC LIMIT 10",
            [targetMessage]
        );

        let verified = rows.length > 0;
        if (verified && phone) {
            verified = rows.some(r => samePhone(r.phone_number, phone));
        }

        res.json({ verified });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- CLIENT AUTH MIDDLEWARE (JWT) ---
const clientGuard = companyGuard('client', 'clients');

// clientId param'ının token'daki id ile eşleştiğini de doğrula
const authMiddleware = async (req, res, next) => {
    clientGuard(req, res, () => {
        if (String(req.company.id) !== String(req.params.clientId)) {
            return res.status(403).json({ error: 'Yetkisiz erişim.' });
        }
        next();
    });
};

router.use('/:clientId', authMiddleware);

// --- CLIENT PASSWORD / API KEY UPDATE ---
router.put('/:clientId/api-key', async (req, res) => {
    const { clientId } = req.params;
    const { current_api_key, new_api_key } = req.body;

    if (!current_api_key || !new_api_key) {
        return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre alanları zorunludur.' });
    }

    try {
        const { rows } = await db.query('SELECT api_key FROM clients WHERE id = ?', [clientId]);
        if (rows.length === 0 || rows[0].api_key !== current_api_key) {
            return res.status(400).json({ error: 'Mevcut şifre hatalı.' });
        }

        await db.query('UPDATE clients SET api_key = ? WHERE id = ?', [new_api_key, clientId]);
        res.json({ message: 'Şifreniz başarıyla değiştirildi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CLIENT PREFIX (ÖN EK) UPDATE ---
// Ön ek, ters-OTP akışının anahtarıdır (kullanıcı "ÖNEK kod" gönderir; gateway.js buradan firmayı bulur).
// Sahiplik kanıtı: mevcut api_key. Değiştirmeden ÖNCE çakışma kontrol edilir; clients.prefix'teki
// UNIQUE kısıtı da yarış durumuna (aynı anda iki değişiklik) karşı backstop görevi görür.
router.put('/:clientId/prefix', async (req, res) => {
    const { clientId } = req.params;
    const { current_api_key } = req.body;

    // Normalize: büyük harf + yalnızca A-Z0-9 (gateway.js gelen mesajı upper'a çevirip eşler).
    const newPrefix = (req.body.prefix || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (newPrefix.length < 3 || newPrefix.length > 8) {
        return res.status(400).json({ error: 'Ön ek 3-8 karakter olmalı ve yalnızca harf/rakam içermelidir.' });
    }

    try {
        const { rows } = await db.query('SELECT api_key, prefix FROM clients WHERE id = ?', [clientId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Firma bulunamadı.' });
        }
        if (!current_api_key || rows[0].api_key !== current_api_key) {
            return res.status(403).json({ error: 'Mevcut şifre (API Key) hatalı.' });
        }
        if (rows[0].prefix === newPrefix) {
            return res.json({ message: 'Ön ek zaten bu değerde.', prefix: newPrefix });
        }

        // Çakışma kontrolü (kendisi hariç tüm firmalar).
        const taken = await db.query('SELECT id FROM clients WHERE prefix = ? AND id != ?', [newPrefix, clientId]);
        if (taken.rows.length > 0) {
            return res.status(409).json({ error: `"${newPrefix}" ön eki başka bir firma tarafından kullanılıyor. Lütfen farklı bir ön ek seçin.` });
        }

        await db.query('UPDATE clients SET prefix = ? WHERE id = ?', [newPrefix, clientId]);
        res.json({ message: 'Ön ek güncellendi.', prefix: newPrefix });
    } catch (err) {
        // SELECT ile UPDATE arasındaki yarışta UNIQUE kısıtı devreye girer.
        if (/UNIQUE constraint failed/i.test(err.message || '')) {
            return res.status(409).json({ error: `"${newPrefix}" ön eki kullanımda. Lütfen farklı bir ön ek seçin.` });
        }
        res.status(500).json({ error: err.message });
    }
});

// --- CLIENT WEBHOOK URL UPDATE ---
// Doğrulama olunca qimlik'in POST atacağı adres. Boş bırakılırsa webhook gönderilmez.
router.put('/:clientId/webhook', async (req, res) => {
    const { clientId } = req.params;
    let { webhook_url } = req.body;
    webhook_url = (webhook_url || '').trim();

    if (webhook_url && !/^https?:\/\/.+/i.test(webhook_url)) {
        return res.status(400).json({ error: 'Geçerli bir http(s) webhook adresi giriniz.' });
    }

    try {
        await db.query('UPDATE clients SET webhook_url = ? WHERE id = ?', [webhook_url, clientId]);
        res.json({ message: 'Webhook adresi güncellendi.', webhook_url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CLIENT LOGS ---
router.get('/:clientId/logs', async (req, res) => {
    const { clientId } = req.params;
    try {
        const { rows } = await db.query(
            'SELECT * FROM logs WHERE client_id = ? ORDER BY created_at DESC LIMIT 200',
            [clientId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CLIENT STATS ---
router.get('/:clientId/stats', async (req, res) => {
    const { clientId } = req.params;
    try {
        const { rows: logs } = await db.query(
            'SELECT status FROM logs WHERE client_id = ?',
            [clientId]
        );

        const total = logs.length;
        const successful = logs.filter(l => l.status === 'success').length;
        const failed = total - successful;

        res.json({ total, successful, failed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CLIENT ANALYTICS (doğrulama hacmi/başarı grafikleri) ---
router.get('/:clientId/analytics', async (req, res) => {
    const { clientId } = req.params;
    try {
        // Son 30 gün günlük toplam/başarılı doğrulama — trend + başarı oranı
        const { rows: daily } = await db.query(
            `SELECT date(created_at) as day, COUNT(*) as total,
                    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success
             FROM logs WHERE client_id = ? AND created_at >= date('now','-29 days')
             GROUP BY date(created_at) ORDER BY day ASC`, [clientId]);
        // Son 7 günün saatlik dağılımı — yoğunluk analizi
        const { rows: hourly } = await db.query(
            `SELECT strftime('%H', created_at) as hour, COUNT(*) as count
             FROM logs WHERE client_id = ? AND created_at >= date('now','-6 days')
             GROUP BY hour ORDER BY hour ASC`, [clientId]);
        res.json({ daily, hourly });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CLIENT WEBHOOK TESLİM DURUMU (kendi teslimleri) ---
router.get('/:clientId/webhook-deliveries', async (req, res) => {
    const { clientId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 100, 300);
    try {
        const { rows } = await db.query(
            `SELECT id, prefix, log_id, status, attempts, max_attempts, next_attempt_at,
                    last_status_code, last_error, delivered_at, created_at, updated_at
             FROM webhook_deliveries WHERE client_id = ? ORDER BY updated_at DESC LIMIT ?`,
            [clientId, limit]
        );
        const { rows: summ } = await db.query(
            'SELECT status, COUNT(*) as count FROM webhook_deliveries WHERE client_id = ? GROUP BY status', [clientId]);
        const summary = {};
        summ.forEach(s => { summary[s.status] = s.count; });
        res.json({ deliveries: rows, summary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

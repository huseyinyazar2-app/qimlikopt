const express = require('express');
const db = require('../db');

const router = express.Router();

// --- CLIENT AUTHENTICATION ---
// Real applications should return a JWT here. 
// For this prototype, we'll return the client data if Prefix and API Key match.
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

        res.json({ message: 'Login successful', client });
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

    // Auto-generate prefix from company name
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

        res.status(201).json({ message: 'Registration successful', client: rows[0] });
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


// --- PUBLIC VERIFICATION STATUS CHECK (FOR POPUPS) ---
router.get('/verify-status', async (req, res) => {
    const { prefix, code } = req.query;

    if (!prefix || !code) {
        return res.status(400).json({ error: 'Prefix ve doğrulama kodu zorunludur.' });
    }

    try {
        const targetMessage = `${prefix.trim().toUpperCase()} ${code.trim()}`;
        
        const { rows } = await db.query(
            "SELECT id FROM logs WHERE UPPER(message_body) = ? AND status = 'success' LIMIT 1",
            [targetMessage]
        );

        res.json({ verified: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- CLIENT AUTH MIDDLEWARE ---
const authMiddleware = async (req, res, next) => {
    const { clientId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Yetkisiz erişim. Şifre doğrulaması yapılamadı.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { rows } = await db.query('SELECT api_key, is_active FROM clients WHERE id = ?', [clientId]);
        const client = rows[0];

        if (!client || client.api_key !== token) {
            return res.status(401).json({ error: 'Yetkisiz erişim. Geçersiz şifre.' });
        }

        if (!client.is_active) {
            return res.status(403).json({ error: 'Hesap askıya alınmıştır.' });
        }

        next();
    } catch (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
    }
};

// Apply auth middleware to all routes starting with /:clientId
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

// --- CLIENT LOGS ---
// Fetch logs specifically for this client
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
// Fetch Dashboard stats for this client
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

module.exports = router;


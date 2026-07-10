const express = require('express');
const db = require('../db');
const { signToken, verifyPassword, hashPassword, readBearer, JWT_SECRET } = require('../auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Admin token doğrulaması (login hariç)
const authMiddleware = (req, res, next) => {
    if (req.path === '/login') {
        return next();
    }
    const token = readBearer(req);
    if (!token) {
        return res.status(401).json({ error: 'Yetkisiz erişim. Token bulunamadı.' });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload.role !== 'admin') {
            return res.status(403).json({ error: 'Yetkisiz erişim.' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Yetkisiz erişim. Geçersiz veya süresi dolmuş token.' });
    }
};

router.use(authMiddleware);

// Login endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur' });
    }

    try {
        const { rows: userRows } = await db.query("SELECT value FROM global_settings WHERE key = 'ADMIN_USERNAME'");
        const { rows: passRows } = await db.query("SELECT value FROM global_settings WHERE key = 'ADMIN_PASSWORD'");

        const dbUsername = userRows[0]?.value || 'admin';
        const storedPassword = passRows[0]?.value || 'admin123';

        const okUser = username === dbUsername;
        const okPass = await verifyPassword(password, storedPassword);

        if (okUser && okPass) {
            const token = signToken({ role: 'admin', username: dbUsername });
            res.json({ message: 'Login successful', token, username: dbUsername });
        } else {
            res.status(401).json({ error: 'Hatalı kullanıcı adı veya şifre' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- 1. CLIENTS (MÜŞTERİ YÖNETİMİ) ---

// Get all clients
router.get('/clients', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, company_name, prefix, webhook_url, phone_number, contact_name, contact_surname, hourly_wage, is_active, created_at FROM clients ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new client
router.post('/clients', async (req, res) => {
    const { company_name, prefix, webhook_url, api_key, phone_number, contact_name, contact_surname } = req.body;
    try {
        await db.query(
            'INSERT INTO clients (company_name, prefix, webhook_url, api_key, phone_number, contact_name, contact_surname) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [company_name, prefix, webhook_url, api_key, phone_number || '', contact_name || '', contact_surname || '']
        );
        res.status(201).json({ message: 'Client created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle client status (Suspend/Activate)
router.put('/clients/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    try {
        await db.query('UPDATE clients SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
        res.json({ message: 'Client status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 2. LOGS (İŞLEM HACMİ VE RAPORLAMA) ---

// Get all logs with client details
router.get('/logs', async (req, res) => {
    try {
        const query = `
            SELECT logs.*, clients.company_name, clients.prefix
            FROM logs
            LEFT JOIN clients ON logs.client_id = clients.id
            ORDER BY logs.created_at DESC
            LIMIT 500
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. DEVICES (GATEWAY FİLOSU) ---

// Get all gateway devices
router.get('/devices', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM gateway_devices ORDER BY last_seen DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. GLOBAL SETTINGS ---

// Get all settings (excluding credentials)
router.get('/settings', async (req, res) => {
    try {
        const { rows } = await db.query("SELECT * FROM global_settings WHERE key NOT IN ('ADMIN_USERNAME', 'ADMIN_PASSWORD')");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a setting
router.put('/settings/:key', async (req, res) => {
    const { key } = req.params;
    let { value } = req.body;
    try {
        // Admin şifresi her zaman hash'lenerek saklanır
        if (key === 'ADMIN_PASSWORD') {
            if (!value || String(value).length < 4) {
                return res.status(400).json({ error: 'Şifre en az 4 karakter olmalıdır.' });
            }
            value = await hashPassword(value);
        }
        await db.query(
            'UPDATE global_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
            [value, key]
        );
        res.json({ message: 'Setting updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN ANALYTICS (genel sistem panosu) ---
router.get('/analytics', async (req, res) => {
    try {
        // Son 30 gün günlük toplam/başarılı işlem — sistem geneli trend
        const { rows: daily } = await db.query(
            `SELECT date(created_at) as day, COUNT(*) as total,
                    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success
             FROM logs WHERE created_at >= date('now','-29 days')
             GROUP BY date(created_at) ORDER BY day ASC`);
        // En yüksek hacimli müşteriler
        const { rows: topClients } = await db.query(
            `SELECT cl.company_name, cl.prefix, COUNT(lg.id) as count
             FROM clients cl LEFT JOIN logs lg ON lg.client_id = cl.id
             GROUP BY cl.id ORDER BY count DESC LIMIT 10`);
        const { rows: cl } = await db.query('SELECT COUNT(*) as total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active FROM clients');
        const { rows: dev } = await db.query('SELECT COUNT(*) as total FROM gateway_devices');
        const { rows: lg } = await db.query('SELECT COUNT(*) as total FROM logs');

        res.json({
            daily,
            top_clients: topClients,
            summary: {
                clients: cl[0]?.total || 0,
                active_clients: cl[0]?.active || 0,
                devices: dev[0]?.total || 0,
                total_logs: lg[0]?.total || 0,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

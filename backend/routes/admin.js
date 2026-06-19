const express = require('express');
const db = require('../db');

const router = express.Router();

// Auth middleware for admin routes
const authMiddleware = async (req, res, next) => {
    // Skip auth for /login
    if (req.path === '/login') {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Yetkisiz erişim. Token bulunamadı.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const { rows } = await db.query("SELECT value FROM global_settings WHERE key = 'ADMIN_PASSWORD'");
        const adminPassword = rows[0]?.value || 'admin123';

        if (token !== adminPassword) {
            return res.status(401).json({ error: 'Yetkisiz erişim. Geçersiz token.' });
        }
        next();
    } catch (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
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
        const dbPassword = passRows[0]?.value || 'admin123';

        if (username === dbUsername && password === dbPassword) {
            res.json({ message: 'Login successful', token: dbPassword, username: dbUsername });
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
        const { rows } = await db.query('SELECT * FROM clients ORDER BY created_at DESC');
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
        await db.query('UPDATE clients SET is_active = ? WHERE id = ?', [is_active, id]);
        res.json({ message: 'Client status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 2. LOGS (İŞLEM HACMİ VE RAPORLAMA) ---

// Get all logs with client details
router.get('/logs', async (req, res) => {
    try {
        // Using JOIN to get company_name. 
        // Turso/SQLite supports standard joins.
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
    const { value } = req.body;
    try {
        await db.query(
            'UPDATE global_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
            [value, key]
        );
        res.json({ message: 'Setting updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

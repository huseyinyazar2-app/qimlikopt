const express = require('express');
const db = require('../db');

const router = express.Router();

// NOTE: In a real app, add authentication middleware here (e.g., JWT)
// to ensure only the SuperAdmin can access these routes.

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
    const { company_name, prefix, webhook_url, api_key } = req.body;
    try {
        await db.query(
            'INSERT INTO clients (company_name, prefix, webhook_url, api_key) VALUES (?, ?, ?, ?)',
            [company_name, prefix, webhook_url, api_key]
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

// Get all settings
router.get('/settings', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM global_settings');
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

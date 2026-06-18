const express = require('express');
const db = require('../db');

const router = express.Router();

// --- CLIENT AUTHENTICATION ---
// Real applications should return a JWT here. 
// For this prototype, we'll return the client data if Prefix and API Key match.
router.post('/login', async (req, res) => {
    const { prefix, api_key } = req.body;
    
    if (!prefix || !api_key) {
        return res.status(400).json({ error: 'Prefix and API Key are required' });
    }

    try {
        const { rows } = await db.query(
            'SELECT id, company_name, prefix, webhook_url, is_active FROM clients WHERE prefix = ? AND api_key = ?', 
            [prefix, api_key]
        );
        
        const client = rows[0];
        
        if (!client) {
            return res.status(401).json({ error: 'Invalid Prefix or API Key' });
        }
        
        if (!client.is_active) {
            return res.status(403).json({ error: 'Account is suspended' });
        }

        res.json({ message: 'Login successful', client });
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

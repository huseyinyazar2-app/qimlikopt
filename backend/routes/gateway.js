const express = require('express');
const axios = require('axios');
const db = require('../db');

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

        // Client found, fire webhook
        let webhookStatus = 'success';
        let errorDetails = null;

        try {
            await axios.post(client.webhook_url, {
                prefix: client.prefix,
                user_phone: phone,
                code: code,
                full_message: message,
                status: 'verified'
            }, {
                headers: { 'x-qimlik-key': client.api_key },
                timeout: 5000 // 5 seconds timeout
            });
        } catch (webhookError) {
            webhookStatus = 'failed_to_send_webhook';
            errorDetails = webhookError.message;
            console.error(`Webhook failed for client ${client.prefix}:`, webhookError.message);
        }

        // Log the transaction
        await db.query(
            'INSERT INTO logs (client_id, phone_number, message_body, status, error_details) VALUES (?, ?, ?, ?, ?)',
            [client.id, phone, message, webhookStatus, errorDetails]
        );

        // Always return 200 to Gateway so it can delete the SMS from its local queue
        // Even if webhook fails, we don't want the gateway to keep retrying forever unless we implement a robust queue
        res.status(200).json({ success: true, status: webhookStatus });

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

        console.log(`[Heartbeat] Device: ${device_id}, Battery: ${battery}%, Network: ${network}`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating heartbeat:', error);
        res.status(500).json({ error: 'Failed to update heartbeat' });
    }
});

module.exports = router;

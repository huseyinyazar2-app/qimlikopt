const express = require('express');
const db = require('../db');

const router = express.Router();

// --- COMPANY AUTH MIDDLEWARE ---
const companyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Yetkisiz erişim. Token bulunamadı.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const { rows } = await db.query('SELECT * FROM dijital_companies WHERE password = ? AND is_active = TRUE', [token]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Yetkisiz erişim. Geçersiz token.' });
        }
        req.company = rows[0];
        next();
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// --- 1. COMPANY REGISTER & LOGIN ---
router.post('/company/register', async (req, res) => {
    const { company_name, phone_number, password } = req.body;
    if (!company_name || !phone_number || !password) {
        return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
    }
    try {
        // Check if phone_number is already registered
        const check = await db.query('SELECT id FROM dijital_companies WHERE phone_number = ?', [phone_number]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Bu telefon numarası zaten kayıtlı.' });
        }

        await db.query(
            'INSERT INTO dijital_companies (company_name, phone_number, password) VALUES (?, ?, ?)',
            [company_name, phone_number, password]
        );

        const { rows } = await db.query('SELECT * FROM dijital_companies WHERE phone_number = ?', [phone_number]);
        res.status(201).json({ message: 'Şirket başarıyla oluşturuldu.', company: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/company/login', async (req, res) => {
    const { phone_number, password } = req.body;
    if (!phone_number || !password) {
        return res.status(400).json({ error: 'Telefon numarası ve şifre zorunludur.' });
    }
    try {
        const { rows } = await db.query(
            'SELECT * FROM dijital_companies WHERE phone_number = ? AND password = ?',
            [phone_number, password]
        );
        const company = rows[0];
        if (!company) {
            return res.status(401).json({ error: 'Hatalı telefon numarası veya şifre.' });
        }
        if (!company.is_active) {
            return res.status(403).json({ error: 'Hesap askıya alınmıştır.' });
        }
        res.json({ message: 'Giriş başarılı.', company });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 2. TECHNICIANS MANAGEMENT (COMPANY ACCESS) ---
router.post('/technicians', companyAuth, async (req, res) => {
    const { name, surname, phone_number } = req.body;
    if (!name || !surname || !phone_number) {
        return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
    }
    try {
        await db.query(
            'INSERT INTO dijital_technicians (company_id, name, surname, phone_number) VALUES (?, ?, ?, ?)',
            [req.company.id, name, surname, phone_number]
        );
        res.status(201).json({ message: 'Teknisyen başarıyla eklendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/technicians', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM dijital_technicians WHERE company_id = ? ORDER BY created_at DESC',
            [req.company.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle technician status (Suspend/Activate)
router.put('/technicians/:id/toggle', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    try {
        await db.query('UPDATE dijital_technicians SET is_active = ? WHERE id = ? AND company_id = ?', [is_active, id, req.company.id]);
        res.json({ message: 'Teknisyen durumu güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. DYNAMIC FORMS MANAGEMENT (COMPANY ACCESS) ---
router.post('/forms', companyAuth, async (req, res) => {
    const { title, fields } = req.body; // fields is an array of objects
    if (!title || !fields) {
        return res.status(400).json({ error: 'Başlık ve dinamik alanlar zorunludur.' });
    }
    try {
        await db.query(
            'INSERT INTO dijital_forms (company_id, title, fields_json) VALUES (?, ?, ?)',
            [req.company.id, title, JSON.stringify(fields)]
        );
        res.status(201).json({ message: 'Dinamik kontrol şablonu başarıyla oluşturuldu.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/forms', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM dijital_forms WHERE company_id = ? ORDER BY created_at DESC',
            [req.company.id]
        );
        // Parse JSON for safety
        const parsed = rows.map(r => ({
            ...r,
            fields: JSON.parse(r.fields_json)
        }));
        res.json(parsed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. MACHINES MANAGEMENT (COMPANY ACCESS) ---
router.post('/machines', companyAuth, async (req, res) => {
    const { machine_code, machine_name, model, serial_number, location, form_template_id } = req.body;
    if (!machine_code || !machine_name || !form_template_id) {
        return res.status(400).json({ error: 'Makine kodu, adı ve atanacak form zorunludur.' });
    }
    try {
        const check = await db.query('SELECT id FROM dijital_machines WHERE machine_code = ?', [machine_code]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Bu makine kodu zaten kullanılıyor.' });
        }

        await db.query(
            'INSERT INTO dijital_machines (company_id, machine_code, machine_name, model, serial_number, location, form_template_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.company.id, machine_code.toUpperCase(), machine_name, model || '', serial_number || '', location || '', form_template_id]
        );
        res.status(201).json({ message: 'Makine başarıyla eklendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/machines', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT m.*, f.title as form_title 
             FROM dijital_machines m
             LEFT JOIN dijital_forms f ON m.form_template_id = f.id
             WHERE m.company_id = ? ORDER BY m.created_at DESC`,
            [req.company.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET ALL MAINTENANCE LOGS FOR COMPANY ---
router.get('/company/logs', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT l.*, m.machine_name, m.machine_code, t.name || ' ' || t.surname as technician_name
             FROM dijital_maintenance_logs l
             JOIN dijital_machines m ON l.machine_id = m.id
             JOIN dijital_technicians t ON l.technician_id = t.id
             WHERE m.company_id = ? ORDER BY l.created_at DESC`,
            [req.company.id]
        );
        const parsed = rows.map(r => ({
            ...r,
            form_data: JSON.parse(r.form_data_json)
        }));
        res.json(parsed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 5. PUBLIC & TECHNICIAN MACHINE DETAILS (SCANNING QR) ---
router.get('/public/machine/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const { rows: machineRows } = await db.query(
            `SELECT m.*, f.title as form_title, f.fields_json, c.company_name
             FROM dijital_machines m
             JOIN dijital_forms f ON m.form_template_id = f.id
             JOIN dijital_companies c ON m.company_id = c.id
             WHERE m.machine_code = ?`,
            [code.toUpperCase()]
        );
        
        const machine = machineRows[0];
        if (!machine) {
            return res.status(404).json({ error: 'Makine bulunamadı.' });
        }

        res.json({
            machine: {
                id: machine.id,
                machine_code: machine.machine_code,
                machine_name: machine.machine_name,
                model: machine.model,
                serial_number: machine.serial_number,
                location: machine.location,
                status: machine.status,
                company_name: machine.company_name
            },
            form: {
                id: machine.form_template_id,
                title: machine.form_title,
                fields: JSON.parse(machine.fields_json)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/public/machine/:code/history', async (req, res) => {
    const { code } = req.params;
    try {
        const { rows: machineRows } = await db.query('SELECT id FROM dijital_machines WHERE machine_code = ?', [code.toUpperCase()]);
        const machine = machineRows[0];
        if (!machine) {
            return res.status(404).json({ error: 'Makine bulunamadı.' });
        }

        const { rows: logs } = await db.query(
            `SELECT l.*, t.name || ' ' || t.surname as technician_name
             FROM dijital_maintenance_logs l
             JOIN dijital_technicians t ON l.technician_id = t.id
             WHERE l.machine_id = ? ORDER BY l.created_at DESC`,
            [machine.id]
        );

        const parsed = logs.map(l => ({
            ...l,
            form_data: JSON.parse(l.form_data_json)
        }));

        res.json(parsed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 6. TECHNICIAN REVERSE OTP LOGIN FLOW ---
router.post('/technician/login/request', async (req, res) => {
    const { phone_number } = req.body;
    if (!phone_number) {
        return res.status(400).json({ error: 'Telefon numarası zorunludur.' });
    }

    try {
        // Verify technician exists and is active
        const { rows } = await db.query('SELECT * FROM dijital_technicians WHERE phone_number = ? AND is_active = TRUE', [phone_number]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Sistemde kayıtlı veya aktif böyle bir teknisyen bulunamadı.' });
        }

        // Ensure "DJTL" prefix is registered in system clients so gateway logs messages correctly
        const checkClient = await db.query("SELECT id FROM clients WHERE prefix = 'DJTL'");
        if (checkClient.rows.length === 0) {
            // Register DJTL system client
            await db.query(
                "INSERT INTO clients (company_name, prefix, webhook_url, api_key, phone_number, is_active) VALUES (?, ?, ?, ?, ?, ?)",
                ['Qimlik Digital System', 'DJTL', 'http://localhost:3303/api/client/webhook', 'djtlsystemkey123', '905303700589', 1]
            );
        }

        // Generate a random 6-digit login code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Return verification link details
        res.json({
            prefix: 'DJTL',
            code,
            gateway_phone: '905303700589' // Active simulator/gateway phone
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/technician/login/status', async (req, res) => {
    const { phone_number, code } = req.query;
    if (!phone_number || !code) {
        return res.status(400).json({ error: 'Telefon ve kod zorunludur.' });
    }

    try {
        const targetMessage = `DJTL ${code}`;
        const { rows } = await db.query(
            "SELECT phone_number FROM logs WHERE UPPER(message_body) = ? LIMIT 1",
            [targetMessage]
        );

        if (rows.length === 0) {
            return res.json({ verified: false });
        }

        const logPhone = rows[0].phone_number.replace(/\D/g, '');
        const cleanInputPhone = phone_number.replace(/\D/g, '');

        // Verify if it ends with same digits
        const isMatched = cleanInputPhone.length >= 9 && logPhone.length >= 9
            ? logPhone.endsWith(cleanInputPhone.slice(-9)) || cleanInputPhone.endsWith(logPhone.slice(-9))
            : logPhone === cleanInputPhone;

        if (!isMatched) {
            return res.json({ verified: false });
        }

        // Retrieve technician details
        const { rows: techRows } = await db.query('SELECT * FROM dijital_technicians WHERE phone_number = ?', [phone_number]);
        res.json({ verified: true, technician: techRows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 7. MAINTENANCE LOG SUBMIT (TECHNICIAN AUTHORIZED) ---
router.post('/maintenance/submit', async (req, res) => {
    const { machine_id, technician_id, form_data, status_after, notes, photo_base64 } = req.body;
    if (!machine_id || !technician_id || !form_data || !status_after) {
        return res.status(400).json({ error: 'Makine, teknisyen, form verisi ve durum bilgileri zorunludur.' });
    }

    try {
        // Insert report
        await db.query(
            `INSERT INTO dijital_maintenance_logs (machine_id, technician_id, form_data_json, status_after, notes, photo_base64) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [machine_id, technician_id, JSON.stringify(form_data), status_after, notes || '', photo_base64 || null]
        );

        // Update current machine status
        await db.query('UPDATE dijital_machines SET status = ? WHERE id = ?', [status_after, machine_id]);

        res.status(201).json({ message: 'Bakım/arıza raporu başarıyla kaydedildi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET ALL LOGS FOR TECHNICIAN ---
router.get('/technician/:id/logs', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query(
            `SELECT l.*, m.machine_name, m.machine_code
             FROM dijital_maintenance_logs l
             JOIN dijital_machines m ON l.machine_id = m.id
             WHERE l.technician_id = ? ORDER BY l.created_at DESC LIMIT 100`,
            [id]
        );
        const parsed = rows.map(r => ({
            ...r,
            form_data: JSON.parse(r.form_data_json)
        }));
        res.json(parsed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

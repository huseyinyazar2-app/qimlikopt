const express = require('express');
const db = require('../db');


// Haversine formula for distance calculation (in meters)
function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

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
    const { company_name, contact_name, contact_surname, phone_number, password } = req.body;
    if (!company_name || !contact_name || !contact_surname || !phone_number || !password) {
        return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
    }
    try {
        // Check if phone_number is already registered
        const check = await db.query('SELECT id FROM dijital_companies WHERE phone_number = ?', [phone_number]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Bu telefon numarası zaten kayıtlı.' });
        }

        await db.query(
            'INSERT INTO dijital_companies (company_name, contact_name, contact_surname, phone_number, password) VALUES (?, ?, ?, ?, ?)',
            [company_name, contact_name, contact_surname, phone_number, password]
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

router.put('/forms/:id', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { title, fields } = req.body;
    if (!title || !fields) {
        return res.status(400).json({ error: 'Başlık ve dinamik alanlar zorunludur.' });
    }
    try {
        await db.query(
            'UPDATE dijital_forms SET title = ?, fields_json = ? WHERE id = ? AND company_id = ?',
            [title, JSON.stringify(fields), id, req.company.id]
        );
        res.json({ message: 'Dinamik kontrol şablonu güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/forms/:id', companyAuth, async (req, res) => {
    const { id } = req.params;
    try {
        // Form kullanımda mı diye kontrol edilebilir, ama basit tutalım
        await db.query('DELETE FROM dijital_forms WHERE id = ? AND company_id = ?', [id, req.company.id]);
        res.json({ message: 'Şablon silindi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. MACHINES MANAGEMENT (COMPANY ACCESS) ---
router.post('/machines', companyAuth, async (req, res) => {
    const { machine_code, machine_name, model, serial_number, location, form_template_id, gps_latitude, gps_longitude, require_location_match, allowed_radius, maintenance_interval_days } = req.body;
    if (!machine_code || !machine_name || !form_template_id) {
        return res.status(400).json({ error: 'Makine kodu, adı ve atanacak form zorunludur.' });
    }
    try {
        const check = await db.query('SELECT id FROM dijital_machines WHERE machine_code = ?', [machine_code]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Bu makine kodu zaten kullanılıyor.' });
        }

        await db.query(
            'INSERT INTO dijital_machines (company_id, machine_code, machine_name, model, serial_number, location, form_template_id, gps_latitude, gps_longitude, require_location_match, allowed_radius, maintenance_interval_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.company.id, machine_code.toUpperCase(), machine_name, model || '', serial_number || '', location || '', form_template_id, gps_latitude || null, gps_longitude || null, require_location_match ? 1 : 0, allowed_radius || 50, maintenance_interval_days || null]
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

        const { rows: parts } = await db.query('SELECT * FROM dijital_spare_parts WHERE company_id = ? AND stock_quantity > 0', [machineRows[0].company_id]);
        
        res.json({
            machine: {
                id: machine.id,
                machine_code: machine.machine_code,
                machine_name: machine.machine_name,
                model: machine.model,
                serial_number: machine.serial_number,
                location: machine.location,
                status: machine.status,
                company_name: machine.company_name,
                gps_latitude: machine.gps_latitude,
                gps_longitude: machine.gps_longitude,
                require_location_match: !!machine.require_location_match,
                allowed_radius: machine.allowed_radius
            },
            form: {
                id: machine.form_template_id,
                title: machine.form_title,
                fields: JSON.parse(machine.fields_json)
            },
            spare_parts: parts
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
            "SELECT phone_number FROM logs WHERE UPPER(message_body) = ? AND created_at >= datetime('now', '-5 minutes') LIMIT 1",
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
    const { machine_id, technician_id, form_data, status_after, notes, photo_base64, technician_latitude, technician_longitude, used_parts } = req.body;
    if (!machine_id || !technician_id || !form_data || !status_after) {
        return res.status(400).json({ error: 'Makine, teknisyen, form verisi ve durum bilgileri zorunludur.' });
    }

    try {
        // Get machine gps coordinates to calculate distance
        const machineCheck = await db.query('SELECT gps_latitude, gps_longitude FROM dijital_machines WHERE id = ?', [machine_id]);
        let calc_distance = null;
        if (machineCheck.rows.length > 0) {
            const m = machineCheck.rows[0];
            if (technician_latitude && technician_longitude && m.gps_latitude && m.gps_longitude) {
                calc_distance = getDistance(technician_latitude, technician_longitude, m.gps_latitude, m.gps_longitude);
            }
        }

        // Insert report
        const logRes = await db.query(
            `INSERT INTO dijital_maintenance_logs (machine_id, technician_id, form_data_json, status_after, notes, photo_base64, technician_latitude, technician_longitude, calculated_distance) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [machine_id, technician_id, JSON.stringify(form_data), status_after, notes || '', photo_base64 || null, technician_latitude || null, technician_longitude || null, calc_distance]
        );
        const logId = logRes.rows[0].id;

        // Process used parts if any
        if (used_parts && Array.isArray(used_parts) && used_parts.length > 0) {
            for (let part of used_parts) {
                if (part.part_id && part.quantity > 0) {
                    await db.query('INSERT INTO dijital_maintenance_parts (log_id, part_id, quantity_used) VALUES (?, ?, ?)', [logId, part.part_id, part.quantity]);
                    await db.query('UPDATE dijital_spare_parts SET stock_quantity = stock_quantity - ? WHERE id = ?', [part.quantity, part.part_id]);
                }
            }
        }

        // Update current machine status and last_maintenance_date
        await db.query('UPDATE dijital_machines SET status = ?, last_maintenance_date = CURRENT_TIMESTAMP WHERE id = ?', [status_after, machine_id]);

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


// --- 8. INCIDENTS (ARIZA BİLDİRİMLERİ) ---
router.post('/public/incident', async (req, res) => {
    const { machine_code, reporter_name, reporter_phone, description } = req.body;
    if (!machine_code || !reporter_name || !reporter_phone || !description) {
        return res.status(400).json({ error: 'Makine kodu, ad, telefon ve arıza detayı zorunludur.' });
    }
    try {
        const check = await db.query('SELECT id FROM dijital_machines WHERE machine_code = ?', [machine_code.toUpperCase()]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Makine bulunamadı.' });
        }
        await db.query(
            'INSERT INTO dijital_incidents (machine_id, reporter_name, reporter_phone, description) VALUES (?, ?, ?, ?)',
            [check.rows[0].id, reporter_name, reporter_phone, description]
        );
        res.status(201).json({ message: 'Arıza bildiriminiz başarıyla alındı. Teşekkür ederiz.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/company/incidents', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT i.*, m.machine_name, m.machine_code 
             FROM dijital_incidents i
             JOIN dijital_machines m ON i.machine_id = m.id
             WHERE m.company_id = ? ORDER BY i.created_at DESC`,
            [req.company.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/company/incidents/:id/resolve', companyAuth, async (req, res) => {
    try {
        // verify ownership implicitly by checking machine
        await db.query(`UPDATE dijital_incidents SET status = 'resolved' WHERE id = ? AND machine_id IN (SELECT id FROM dijital_machines WHERE company_id = ?)`, [req.params.id, req.company.id]);
        res.json({ message: 'Arıza çözüldü olarak işaretlendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- 9. SPARE PARTS (YEDEK PARÇA STOK) ---
router.get('/spare-parts', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM dijital_spare_parts WHERE company_id = ? ORDER BY part_name ASC', [req.company.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/spare-parts', companyAuth, async (req, res) => {
    const { part_name, stock_quantity } = req.body;
    try {
        await db.query(
            'INSERT INTO dijital_spare_parts (company_id, part_name, stock_quantity) VALUES (?, ?, ?)',
            [req.company.id, part_name, stock_quantity || 0]
        );
        res.status(201).json({ message: 'Yedek parça eklendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/spare-parts/:id/add-stock', companyAuth, async (req, res) => {
    const { quantity } = req.body;
    try {
        await db.query('UPDATE dijital_spare_parts SET stock_quantity = stock_quantity + ? WHERE id = ? AND company_id = ?', [quantity, req.params.id, req.company.id]);
        res.json({ message: 'Stok güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

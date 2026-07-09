const express = require('express');
const db = require('../db');
const { signToken, hashPassword, verifyPassword, companyGuard, workerGuard } = require('../auth');
const { createOtp, verifyOtp } = require('../otp');

// Haversine formula for distance calculation (in meters)
function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371e3;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const router = express.Router();

const companyAuth = companyGuard('dijital', 'dijital_companies');
const technicianAuth = workerGuard('dijital');

function sanitizeCompany(company) {
    if (!company) return company;
    const { password, ...safe } = company;
    return safe;
}

// --- 1. COMPANY REGISTER & LOGIN ---
router.post('/company/register', async (req, res) => {
    const { company_name, contact_name, contact_surname, phone_number, password } = req.body;
    if (!company_name || !contact_name || !contact_surname || !phone_number || !password) {
        return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
    }
    try {
        const check = await db.query('SELECT id FROM dijital_companies WHERE phone_number = ?', [phone_number]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Bu telefon numarası zaten kayıtlı.' });
        }

        const hashed = await hashPassword(password);
        await db.query(
            'INSERT INTO dijital_companies (company_name, contact_name, contact_surname, phone_number, password) VALUES (?, ?, ?, ?, ?)',
            [company_name, contact_name, contact_surname, phone_number, hashed]
        );

        const { rows } = await db.query('SELECT * FROM dijital_companies WHERE phone_number = ?', [phone_number]);
        const company = rows[0];
        const token = signToken({ role: 'company', module: 'dijital', id: company.id });
        res.status(201).json({ message: 'Şirket başarıyla oluşturuldu.', company: sanitizeCompany(company), token });
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
        const { rows } = await db.query('SELECT * FROM dijital_companies WHERE phone_number = ?', [phone_number]);
        const company = rows[0];
        if (!company || !(await verifyPassword(password, company.password))) {
            return res.status(401).json({ error: 'Hatalı telefon numarası veya şifre.' });
        }
        if (!company.is_active) {
            return res.status(403).json({ error: 'Hesap askıya alınmıştır.' });
        }
        const token = signToken({ role: 'company', module: 'dijital', id: company.id });
        res.json({ message: 'Giriş başarılı.', company: sanitizeCompany(company), token });
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

router.put('/technicians/:id/toggle', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    try {
        await db.query('UPDATE dijital_technicians SET is_active = ? WHERE id = ? AND company_id = ?', [is_active ? 1 : 0, id, req.company.id]);
        res.json({ message: 'Teknisyen durumu güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. DYNAMIC FORMS MANAGEMENT (COMPANY ACCESS) ---
router.post('/forms', companyAuth, async (req, res) => {
    const { title, fields } = req.body;
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
        const check = await db.query('SELECT id FROM dijital_machines WHERE machine_code = ?', [machine_code.toUpperCase()]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Bu makine kodu zaten kullanılıyor.' });
        }
        // Form da bu firmaya ait olmalı
        const { rows: fr } = await db.query('SELECT id FROM dijital_forms WHERE id = ? AND company_id = ?', [form_template_id, req.company.id]);
        if (fr.length === 0) {
            return res.status(400).json({ error: 'Geçersiz form şablonu.' });
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
            form_data: r.form_data_json ? JSON.parse(r.form_data_json) : {}
        }));
        res.json(parsed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 5. TECHNICIAN MACHINE DETAILS (SCANNING QR) — TECHNICIAN AUTH ---
router.get('/machine/:code', technicianAuth, async (req, res) => {
    const { code } = req.params;
    try {
        const { rows: machineRows } = await db.query(
            `SELECT m.*, f.title as form_title, f.fields_json, c.company_name
             FROM dijital_machines m
             JOIN dijital_forms f ON m.form_template_id = f.id
             JOIN dijital_companies c ON m.company_id = c.id
             WHERE m.machine_code = ? AND m.company_id = ?`,
            [code.toUpperCase(), req.worker.company_id]
        );

        const machine = machineRows[0];
        if (!machine) {
            return res.status(404).json({ error: 'Makine bulunamadı.' });
        }

        const { rows: parts } = await db.query('SELECT * FROM dijital_spare_parts WHERE company_id = ? AND stock_quantity > 0', [machine.company_id]);

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

router.get('/machine/:code/history', technicianAuth, async (req, res) => {
    const { code } = req.params;
    try {
        const { rows: machineRows } = await db.query('SELECT id FROM dijital_machines WHERE machine_code = ? AND company_id = ?', [code.toUpperCase(), req.worker.company_id]);
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
            form_data: l.form_data_json ? JSON.parse(l.form_data_json) : {}
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
        const { rows } = await db.query('SELECT * FROM dijital_technicians WHERE phone_number = ? AND is_active = TRUE', [phone_number]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Sistemde kayıtlı veya aktif böyle bir teknisyen bulunamadı.' });
        }

        const checkClient = await db.query("SELECT id FROM clients WHERE prefix = 'DJTL'");
        if (checkClient.rows.length === 0) {
            await db.query(
                "INSERT INTO clients (company_name, prefix, webhook_url, api_key, phone_number, is_active) VALUES (?, ?, ?, ?, ?, ?)",
                ['Qimlik Digital System', 'DJTL', 'http://localhost:3303/api/client/webhook', 'djtlsystemkey123', '905303700589', 1]
            );
        }

        const code = await createOtp('dijital', 'login', phone_number);
        res.json({
            prefix: 'DJTL',
            code,
            gateway_phone: '905303700589'
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
        const result = await verifyOtp('dijital', 'login', phone_number, code, 'DJTL');
        if (!result.verified) {
            return res.json({ verified: false });
        }

        const { rows: techRows } = await db.query('SELECT * FROM dijital_technicians WHERE phone_number = ? AND is_active = TRUE', [phone_number]);
        const technician = techRows[0];
        if (!technician) {
            return res.json({ verified: false });
        }
        const token = signToken({ role: 'worker', module: 'dijital', id: technician.id, company_id: technician.company_id });
        res.json({ verified: true, technician, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 7. MAINTENANCE LOG SUBMIT (TECHNICIAN AUTH) ---
router.post('/maintenance/submit', technicianAuth, async (req, res) => {
    const { machine_id, form_data, status_after, notes, photo_base64, technician_latitude, technician_longitude, used_parts } = req.body;
    if (!machine_id || !form_data || !status_after) {
        return res.status(400).json({ error: 'Makine, form verisi ve durum bilgileri zorunludur.' });
    }

    try {
        // Makine teknisyenin firmasına ait olmalı
        const machineCheck = await db.query('SELECT gps_latitude, gps_longitude, company_id FROM dijital_machines WHERE id = ?', [machine_id]);
        const machine = machineCheck.rows[0];
        if (!machine || machine.company_id !== req.worker.company_id) {
            return res.status(403).json({ error: 'Bu makineye işlem yapma yetkiniz yok.' });
        }

        let calc_distance = null;
        if (technician_latitude && technician_longitude && machine.gps_latitude && machine.gps_longitude) {
            calc_distance = getDistance(technician_latitude, technician_longitude, machine.gps_latitude, machine.gps_longitude);
        }

        const logRes = await db.query(
            `INSERT INTO dijital_maintenance_logs (machine_id, technician_id, form_data_json, status_after, notes, photo_base64, technician_latitude, technician_longitude, calculated_distance)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [machine_id, req.worker.id, JSON.stringify(form_data), status_after, notes || '', photo_base64 || null, technician_latitude || null, technician_longitude || null, calc_distance]
        );
        const logId = logRes.rows[0].id;

        if (used_parts && Array.isArray(used_parts) && used_parts.length > 0) {
            for (let part of used_parts) {
                if (part.part_id && part.quantity > 0) {
                    // Parça da aynı firmaya ait olmalı
                    const { rows: pr } = await db.query('SELECT id FROM dijital_spare_parts WHERE id = ? AND company_id = ?', [part.part_id, req.worker.company_id]);
                    if (pr.length > 0) {
                        await db.query('INSERT INTO dijital_maintenance_parts (log_id, part_id, quantity_used) VALUES (?, ?, ?)', [logId, part.part_id, part.quantity]);
                        await db.query('UPDATE dijital_spare_parts SET stock_quantity = stock_quantity - ? WHERE id = ?', [part.quantity, part.part_id]);
                    }
                }
            }
        }

        await db.query('UPDATE dijital_machines SET status = ?, last_maintenance_date = CURRENT_TIMESTAMP WHERE id = ?', [status_after, machine_id]);

        res.status(201).json({ message: 'Bakım/arıza raporu başarıyla kaydedildi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TECHNICIAN OWN LOGS (TECHNICIAN AUTH) ---
router.get('/technician/logs', technicianAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT l.*, m.machine_name, m.machine_code
             FROM dijital_maintenance_logs l
             JOIN dijital_machines m ON l.machine_id = m.id
             WHERE l.technician_id = ? ORDER BY l.created_at DESC LIMIT 100`,
            [req.worker.id]
        );
        const parsed = rows.map(r => ({
            ...r,
            form_data: r.form_data_json ? JSON.parse(r.form_data_json) : {}
        }));
        res.json(parsed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 8. INCIDENTS (ARIZA BİLDİRİMLERİ) — genel public arıza formu ---
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

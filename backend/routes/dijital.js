const express = require('express');
const db = require('../db');
const { signToken, hashPassword, verifyPassword, companyGuard, workerGuard, panelWriteGuard, requireTier } = require('../auth');
const { createOtp, verifyOtp } = require('../otp');
const { mountPanelUsers } = require('../panelUsers');
const { notify, mountNotifications } = require('../notifications');

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

// Faz 3: 'viewer' rolü tüm yazma isteklerinde reddedilir (public/login etkilenmez)
router.use(panelWriteGuard('dijital'));

// Faz 6: stok hareketini defterle. Defter (dijital_stock_movements) denetim izidir;
// balance_after her adımdan sonraki bakiyeyi sabitler. `part` güncel satır olmalı.
// Düşük/negatif stokta manager'a bildirim üretir (günde bir kez, dedup ile).
async function recordStockMovement({ company_id, part, delta, reason, ref_type = null, ref_id = null, note = null }) {
    const balance_after = Number(part.stock_quantity);
    await db.query(
        `INSERT INTO dijital_stock_movements (company_id, part_id, delta, balance_after, reason, ref_type, ref_id, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [company_id, part.id, delta, balance_after, reason, ref_type, ref_id, note]
    );
    const min = Number(part.min_stock || 0);
    // min_stock>0 ve esige inildiyse, VEYA stok negatifse (sayım tutmuyor) uyar.
    if (balance_after < 0 || (min > 0 && balance_after <= min)) {
        const today = new Date().toISOString().slice(0, 10);
        await notify({
            module: 'dijital', company_id, target_role: 'manager', type: 'low_stock',
            title: balance_after < 0 ? 'Stok negatife düştü' : 'Yedek parça stoğu azaldı',
            body: `${part.part_name}: kalan ${balance_after}${min > 0 ? ` (uyarı eşiği ${min})` : ''}.`,
            link: '/dashboard', entity_type: 'spare_part', entity_id: part.id,
            dedup_key: `low_stock:${part.id}:${today}`,
        });
    }
}

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
        const token = signToken({ role: 'company', module: 'dijital', id: company.id, tier: 'owner' });
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
        const token = signToken({ role: 'company', module: 'dijital', id: company.id, tier: 'owner' });
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
                ['Qimlik Digital System', 'DJTL', 'http://localhost:3303/api/client/webhook', 'djtlsystemkey123', '905404234000', 1]
            );
        }

        const code = await createOtp('dijital', 'login', phone_number);
        res.json({
            prefix: 'DJTL',
            code,
            gateway_phone: '905404234000'
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
                const qty = parseInt(part.quantity, 10);
                if (part.part_id && Number.isFinite(qty) && qty > 0) {
                    // Parça da aynı firmaya ait olmalı
                    const { rows: pr } = await db.query('SELECT id FROM dijital_spare_parts WHERE id = ? AND company_id = ?', [part.part_id, req.worker.company_id]);
                    if (pr.length > 0) {
                        await db.query('INSERT INTO dijital_maintenance_parts (log_id, part_id, quantity_used) VALUES (?, ?, ?)', [logId, part.part_id, qty]);
                        // Parça fiilen kullanıldı; stok gerçek durumu yansıtsın (negatife de
                        // düşebilir = sayım tutmuyor demektir, bildirim bunu görünür kılar).
                        const upd = await db.query(
                            'UPDATE dijital_spare_parts SET stock_quantity = stock_quantity - ? WHERE id = ? RETURNING id, part_name, stock_quantity, min_stock',
                            [qty, part.part_id]
                        );
                        await recordStockMovement({
                            company_id: req.worker.company_id, part: upd.rows[0],
                            delta: -qty, reason: 'consume', ref_type: 'maintenance_log', ref_id: logId,
                        });
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
        const check = await db.query('SELECT id, company_id, machine_name FROM dijital_machines WHERE machine_code = ?', [machine_code.toUpperCase()]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Makine bulunamadı.' });
        }
        const machine = check.rows[0];
        const ins = await db.query(
            'INSERT INTO dijital_incidents (machine_id, reporter_name, reporter_phone, description) VALUES (?, ?, ?, ?)',
            [machine.id, reporter_name, reporter_phone, description]
        );
        const incidentId = ins.lastInsertRowid != null ? Number(ins.lastInsertRowid) : null;
        // Firmaya bildirim (yeni arıza)
        await notify({
            module: 'dijital', company_id: machine.company_id, type: 'incident',
            title: 'Yeni arıza bildirimi',
            body: `${machine.machine_name || 'Makine'}: ${String(description).slice(0, 120)}`,
            link: '/dashboard', entity_type: 'incident', entity_id: incidentId,
            dedup_key: `incident:${incidentId}`,
        });
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

router.post('/spare-parts', companyAuth, requireTier('operator'), async (req, res) => {
    const { part_name, stock_quantity, min_stock } = req.body;
    if (!part_name || !String(part_name).trim()) {
        return res.status(400).json({ error: 'Parça adı zorunludur.' });
    }
    const qty = Math.max(0, parseInt(stock_quantity, 10) || 0);
    const min = Math.max(0, parseInt(min_stock, 10) || 0);
    try {
        const ins = await db.query(
            'INSERT INTO dijital_spare_parts (company_id, part_name, stock_quantity, min_stock) VALUES (?, ?, ?, ?) RETURNING id',
            [req.company.id, String(part_name).trim(), qty, min]
        );
        if (qty > 0) {
            await recordStockMovement({
                company_id: req.company.id,
                part: { id: ins.rows[0].id, part_name, stock_quantity: qty, min_stock: min },
                delta: qty, reason: 'manual_add', note: 'İlk stok',
            });
        }
        res.status(201).json({ message: 'Yedek parça eklendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Parça bilgisi (ad + uyarı eşiği) düzenle
router.put('/spare-parts/:id', companyAuth, requireTier('operator'), async (req, res) => {
    const { part_name, min_stock } = req.body;
    try {
        const { rows } = await db.query('SELECT * FROM dijital_spare_parts WHERE id = ? AND company_id = ?', [req.params.id, req.company.id]);
        if (!rows.length) return res.status(404).json({ error: 'Parça bulunamadı.' });
        await db.query(
            'UPDATE dijital_spare_parts SET part_name = ?, min_stock = ? WHERE id = ? AND company_id = ?',
            [part_name != null ? String(part_name).trim() : rows[0].part_name,
             min_stock != null ? Math.max(0, parseInt(min_stock, 10) || 0) : rows[0].min_stock,
             req.params.id, req.company.id]
        );
        res.json({ message: 'Parça güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/spare-parts/:id/add-stock', companyAuth, requireTier('operator'), async (req, res) => {
    const quantity = parseInt(req.body.quantity, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Girilen miktar pozitif olmalıdır.' });
    }
    try {
        const upd = await db.query(
            'UPDATE dijital_spare_parts SET stock_quantity = stock_quantity + ? WHERE id = ? AND company_id = ? RETURNING id, part_name, stock_quantity, min_stock',
            [quantity, req.params.id, req.company.id]
        );
        if (!upd.rows.length) return res.status(404).json({ error: 'Parça bulunamadı.' });
        await recordStockMovement({
            company_id: req.company.id, part: upd.rows[0],
            delta: quantity, reason: 'manual_add',
        });
        res.json({ message: 'Stok güncellendi.', stock_quantity: upd.rows[0].stock_quantity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sayım düzeltme: stoğu mutlak bir değere ayarla (fark deftere yazılır).
// Manuel giriş negatif olamaz — imkânsız durumu kullanıcı yaratmasın.
router.put('/spare-parts/:id/set-count', companyAuth, requireTier('operator'), async (req, res) => {
    const target = parseInt(req.body.stock_quantity, 10);
    if (!Number.isFinite(target) || target < 0) {
        return res.status(400).json({ error: 'Sayım değeri 0 veya daha büyük olmalıdır.' });
    }
    try {
        const { rows } = await db.query('SELECT * FROM dijital_spare_parts WHERE id = ? AND company_id = ?', [req.params.id, req.company.id]);
        if (!rows.length) return res.status(404).json({ error: 'Parça bulunamadı.' });
        const delta = target - Number(rows[0].stock_quantity);
        await db.query('UPDATE dijital_spare_parts SET stock_quantity = ? WHERE id = ? AND company_id = ?', [target, req.params.id, req.company.id]);
        if (delta !== 0) {
            await recordStockMovement({
                company_id: req.company.id,
                part: { ...rows[0], stock_quantity: target },
                delta, reason: 'adjust', note: req.body.note || 'Sayım düzeltmesi',
            });
        }
        res.json({ message: 'Sayım güncellendi.', stock_quantity: target });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bir parçanın stok hareket defteri
router.get('/spare-parts/:id/movements', companyAuth, async (req, res) => {
    try {
        const { rows: own } = await db.query('SELECT id FROM dijital_spare_parts WHERE id = ? AND company_id = ?', [req.params.id, req.company.id]);
        if (!own.length) return res.status(404).json({ error: 'Parça bulunamadı.' });
        const { rows } = await db.query(
            'SELECT delta, balance_after, reason, ref_type, ref_id, note, created_at FROM dijital_stock_movements WHERE part_id = ? ORDER BY id DESC LIMIT 100',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ANALYTICS (ŞİRKET PANOSU İÇİN) ---
router.get('/company/analytics', companyAuth, async (req, res) => {
    const cid = req.company.id;
    try {
        // Son 30 gün günlük bakım kaydı — trend
        const { rows: daily } = await db.query(
            `SELECT date(l.created_at) as day, COUNT(*) as count
             FROM dijital_maintenance_logs l JOIN dijital_machines m ON l.machine_id = m.id
             WHERE m.company_id = ? AND l.created_at >= date('now','-29 days')
             GROUP BY date(l.created_at) ORDER BY day ASC`, [cid]);
        // Makine durum dağılımı
        const { rows: machineStatus } = await db.query(
            'SELECT status, COUNT(*) as count FROM dijital_machines WHERE company_id = ? GROUP BY status', [cid]);
        // Yaklaşan (veya geçmiş) bakımlar — önleyici bakım için
        const { rows: upcoming } = await db.query(
            `SELECT machine_code, machine_name, last_maintenance_date, maintenance_interval_days,
                    date(last_maintenance_date, '+' || maintenance_interval_days || ' days') as next_due
             FROM dijital_machines
             WHERE company_id = ? AND maintenance_interval_days IS NOT NULL AND last_maintenance_date IS NOT NULL
               AND date(last_maintenance_date, '+' || maintenance_interval_days || ' days') <= date('now','+7 days')
             ORDER BY next_due ASC LIMIT 10`, [cid]);
        const { rows: mac } = await db.query('SELECT COUNT(*) as total FROM dijital_machines WHERE company_id = ?', [cid]);
        const { rows: tech } = await db.query('SELECT COUNT(*) as total FROM dijital_technicians WHERE company_id = ?', [cid]);
        const { rows: inc } = await db.query(
            `SELECT COUNT(*) as open FROM dijital_incidents i JOIN dijital_machines m ON i.machine_id = m.id
             WHERE m.company_id = ? AND i.status = 'pending'`, [cid]);
        const { rows: lowStock } = await db.query(
            'SELECT COUNT(*) as low FROM dijital_spare_parts WHERE company_id = ? AND stock_quantity <= 5', [cid]);

        res.json({
            daily,
            machine_status: machineStatus,
            upcoming_maintenance: upcoming,
            summary: {
                machines: mac[0]?.total || 0,
                technicians: tech[0]?.total || 0,
                open_incidents: inc[0]?.open || 0,
                low_stock_parts: lowStock[0]?.low || 0,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 10. WORK ORDERS (İŞ EMİRLERİ) + SLA + ÖNLEYİCİ BAKIM ---

// Firmanın iş emirleri (opsiyonel ?status= filtresi ile)
router.get('/company/work-orders', companyAuth, async (req, res) => {
    const { status } = req.query;
    try {
        const params = [req.company.id];
        let statusFilter = '';
        if (status) {
            statusFilter = ' AND wo.status = ?';
            params.push(status);
        }
        const { rows } = await db.query(
            `SELECT wo.*, m.machine_name, m.machine_code,
                    t.name || ' ' || t.surname AS technician_name,
                    CASE WHEN wo.status NOT IN ('done','cancelled') AND wo.due_at IS NOT NULL AND wo.due_at < datetime('now')
                         THEN 1 ELSE 0 END AS is_overdue
             FROM dijital_work_orders wo
             JOIN dijital_machines m ON wo.machine_id = m.id
             LEFT JOIN dijital_technicians t ON wo.technician_id = t.id
             WHERE wo.company_id = ?${statusFilter}
             ORDER BY wo.created_at DESC`,
            params
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Yeni iş emri oluştur
router.post('/company/work-orders', companyAuth, async (req, res) => {
    const { machine_id, technician_id, order_type, title, description, priority, sla_hours } = req.body;
    if (!machine_id || !order_type || !title) {
        return res.status(400).json({ error: 'Makine, iş emri türü ve başlık zorunludur.' });
    }
    if (!['preventive', 'corrective'].includes(order_type)) {
        return res.status(400).json({ error: 'Geçersiz iş emri türü.' });
    }
    try {
        // Makine bu firmaya ait olmalı
        const mc = await db.query('SELECT id FROM dijital_machines WHERE id = ? AND company_id = ?', [machine_id, req.company.id]);
        if (mc.rows.length === 0) {
            return res.status(403).json({ error: 'Bu makineye iş emri açma yetkiniz yok.' });
        }
        // Teknisyen verilmişse firmaya ait olmalı
        if (technician_id) {
            const tc = await db.query('SELECT id FROM dijital_technicians WHERE id = ? AND company_id = ?', [technician_id, req.company.id]);
            if (tc.rows.length === 0) {
                return res.status(400).json({ error: 'Geçersiz teknisyen.' });
            }
        }

        const slaVal = sla_hours ? parseInt(sla_hours) : null;
        const status = technician_id ? 'assigned' : 'open';
        const dueExpr = (slaVal && slaVal > 0) ? `datetime('now', '+${slaVal} hours')` : 'NULL';

        await db.query(
            `INSERT INTO dijital_work_orders (company_id, machine_id, technician_id, order_type, title, description, priority, status, sla_hours, due_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${dueExpr})`,
            [req.company.id, machine_id, technician_id || null, order_type, title, description || '', priority || 'normal', status, slaVal]
        );
        res.status(201).json({ message: 'İş emri başarıyla oluşturuldu.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// İş emri güncelle (atama / öncelik / durum)
router.put('/company/work-orders/:id', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { technician_id, priority, status } = req.body;
    try {
        const { rows } = await db.query('SELECT * FROM dijital_work_orders WHERE id = ? AND company_id = ?', [id, req.company.id]);
        const wo = rows[0];
        if (!wo) {
            return res.status(404).json({ error: 'İş emri bulunamadı.' });
        }

        // Teknisyen verilmişse firmaya ait olmalı
        if (technician_id) {
            const tc = await db.query('SELECT id FROM dijital_technicians WHERE id = ? AND company_id = ?', [technician_id, req.company.id]);
            if (tc.rows.length === 0) {
                return res.status(400).json({ error: 'Geçersiz teknisyen.' });
            }
        }

        const newTech = technician_id !== undefined ? (technician_id || null) : wo.technician_id;
        const newPriority = priority || wo.priority;
        let newStatus = status || wo.status;
        // Teknisyen atanınca ve durum belirtilmemişse, açık iş emrini 'assigned' yap
        if (technician_id && !status && wo.status === 'open') {
            newStatus = 'assigned';
        }

        await db.query(
            `UPDATE dijital_work_orders
             SET technician_id = ?, priority = ?, status = ?,
                 started_at = CASE WHEN ? = 'in_progress' AND started_at IS NULL THEN datetime('now') ELSE started_at END,
                 completed_at = CASE WHEN ? IN ('done','cancelled') THEN COALESCE(completed_at, datetime('now')) ELSE completed_at END
             WHERE id = ? AND company_id = ?`,
            [newTech, newPriority, newStatus, newStatus, newStatus, id, req.company.id]
        );
        res.json({ message: 'İş emri güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Arızayı düzeltici (corrective) iş emrine çevir
router.post('/company/incidents/:id/to-work-order', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { priority, technician_id, sla_hours } = req.body;
    try {
        const { rows } = await db.query(
            `SELECT i.id, i.machine_id, i.description, m.company_id
             FROM dijital_incidents i
             JOIN dijital_machines m ON i.machine_id = m.id
             WHERE i.id = ? AND m.company_id = ?`,
            [id, req.company.id]
        );
        const incident = rows[0];
        if (!incident) {
            return res.status(404).json({ error: 'Arıza kaydı bulunamadı.' });
        }

        if (technician_id) {
            const tc = await db.query('SELECT id FROM dijital_technicians WHERE id = ? AND company_id = ?', [technician_id, req.company.id]);
            if (tc.rows.length === 0) {
                return res.status(400).json({ error: 'Geçersiz teknisyen.' });
            }
        }

        const desc = incident.description || '';
        const title = 'Arıza: ' + (desc.length > 100 ? desc.slice(0, 100) + '...' : desc || 'Müşteri arıza bildirimi');
        const woPriority = priority || 'high';
        const status = technician_id ? 'assigned' : 'open';
        const slaVal = sla_hours ? parseInt(sla_hours) : null;
        const dueExpr = (slaVal && slaVal > 0) ? `datetime('now', '+${slaVal} hours')` : 'NULL';

        await db.query(
            `INSERT INTO dijital_work_orders (company_id, machine_id, technician_id, incident_id, order_type, title, description, priority, status, sla_hours, due_at)
             VALUES (?, ?, ?, ?, 'corrective', ?, ?, ?, ?, ?, ${dueExpr})`,
            [req.company.id, incident.machine_id, technician_id || null, incident.id, title, desc, woPriority, status, slaVal]
        );
        await db.query(`UPDATE dijital_incidents SET status = 'in_progress' WHERE id = ?`, [incident.id]);

        res.status(201).json({ message: 'Arıza düzeltici iş emrine dönüştürüldü.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Önleyici bakımı yaklaşan/gecikmiş, henüz açık iş emri olmayan makineler
router.get('/company/preventive-due', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT m.id, m.machine_code, m.machine_name, m.last_maintenance_date, m.maintenance_interval_days,
                    date(m.last_maintenance_date, '+' || m.maintenance_interval_days || ' days') AS next_due
             FROM dijital_machines m
             WHERE m.company_id = ?
               AND m.maintenance_interval_days IS NOT NULL
               AND m.last_maintenance_date IS NOT NULL
               AND date(m.last_maintenance_date, '+' || m.maintenance_interval_days || ' days') <= date('now','+7 days')
               AND NOT EXISTS (
                   SELECT 1 FROM dijital_work_orders wo
                   WHERE wo.machine_id = m.id AND wo.order_type = 'preventive'
                     AND wo.status NOT IN ('done','cancelled')
               )
             ORDER BY next_due ASC`,
            [req.company.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Teknisyene atanmış aktif iş emirleri
router.get('/technician/work-orders', technicianAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT wo.*, m.machine_name, m.machine_code,
                    CASE WHEN wo.status NOT IN ('done','cancelled') AND wo.due_at IS NOT NULL AND wo.due_at < datetime('now')
                         THEN 1 ELSE 0 END AS is_overdue
             FROM dijital_work_orders wo
             JOIN dijital_machines m ON wo.machine_id = m.id
             WHERE wo.technician_id = ? AND wo.status NOT IN ('done','cancelled')
             ORDER BY wo.created_at DESC`,
            [req.worker.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Teknisyen kendi iş emri durumunu günceller (başlat/tamamla)
router.put('/technician/work-orders/:id/status', technicianAuth, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['in_progress', 'done'].includes(status)) {
        return res.status(400).json({ error: 'Geçersiz durum.' });
    }
    try {
        const { rows } = await db.query('SELECT id FROM dijital_work_orders WHERE id = ? AND technician_id = ?', [id, req.worker.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Size atanmış böyle bir iş emri bulunamadı.' });
        }
        await db.query(
            `UPDATE dijital_work_orders
             SET status = ?,
                 started_at = CASE WHEN ? = 'in_progress' AND started_at IS NULL THEN datetime('now') ELSE started_at END,
                 completed_at = CASE WHEN ? = 'done' THEN COALESCE(completed_at, datetime('now')) ELSE completed_at END
             WHERE id = ? AND technician_id = ?`,
            [status, status, status, id, req.worker.id]
        );
        res.json({ message: 'İş emri durumu güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- FAZ 5: HARİTA & KONUM ---
// Makine konumları (durum + bakım gecikmesi) ve son N gündeki bakım noktaları.
router.get('/company/map/data', companyAuth, async (req, res) => {
    const cid = req.company.id;
    let days = parseInt(req.query.days, 10);
    if (isNaN(days) || days < 1 || days > 365) days = 7;
    try {
        const { rows: machines } = await db.query(
            `SELECT m.id, m.machine_code, m.machine_name, m.location, m.status,
                    m.gps_latitude, m.gps_longitude, m.allowed_radius, m.require_location_match,
                    m.maintenance_interval_days, m.last_maintenance_date,
                    CASE WHEN m.maintenance_interval_days IS NULL OR m.last_maintenance_date IS NULL THEN NULL
                         ELSE date(m.last_maintenance_date, '+' || m.maintenance_interval_days || ' days')
                    END AS next_maintenance_date,
                    (SELECT COUNT(*) FROM dijital_work_orders w
                      WHERE w.machine_id = m.id AND w.status NOT IN ('done','cancelled')) AS open_orders,
                    (SELECT COUNT(*) FROM dijital_work_orders w
                      WHERE w.machine_id = m.id AND w.status NOT IN ('done','cancelled')
                        AND w.due_at IS NOT NULL AND w.due_at < datetime('now')) AS overdue_orders
             FROM dijital_machines m
             WHERE m.company_id = ?
             ORDER BY m.machine_name ASC`,
            [cid]
        );

        const located = machines.filter(m => m.gps_latitude != null && m.gps_longitude != null);

        const { rows: maintenance } = await db.query(
            `SELECT ml.id, ml.machine_id, m.machine_name, m.machine_code,
                    t.name || ' ' || t.surname AS technician_name,
                    ml.technician_latitude AS latitude, ml.technician_longitude AS longitude,
                    ml.calculated_distance, ml.status_after, ml.created_at
             FROM dijital_maintenance_logs ml
             JOIN dijital_machines m ON ml.machine_id = m.id
             LEFT JOIN dijital_technicians t ON ml.technician_id = t.id
             WHERE m.company_id = ?
               AND ml.technician_latitude IS NOT NULL AND ml.technician_longitude IS NOT NULL
               AND ml.created_at >= datetime('now', '-' || ? || ' days')
             ORDER BY ml.created_at ASC
             LIMIT 1000`,
            [cid, days]
        );

        const withFlags = located.map(m => ({
            ...m,
            maintenance_overdue: m.next_maintenance_date ? m.next_maintenance_date < new Date().toISOString().slice(0, 10) : false,
        }));

        res.json({
            days,
            machines: withFlags,
            maintenance,
            summary: {
                total_machines: machines.length,
                located: located.length,
                unlocated: machines.length - located.length,
                maintenance_points: maintenance.length,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Makine konumunu haritadan güncelle (pin sürükleme / harita tıklaması)
router.put('/machines/:id/location', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { gps_latitude, gps_longitude, allowed_radius, require_location_match } = req.body;

    const lat = parseFloat(gps_latitude);
    const lng = parseFloat(gps_longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) return res.status(400).json({ error: 'Geçersiz enlem.' });
    if (isNaN(lng) || lng < -180 || lng > 180) return res.status(400).json({ error: 'Geçersiz boylam.' });

    const sets = ['gps_latitude = ?', 'gps_longitude = ?'];
    const params = [lat, lng];

    if (allowed_radius !== undefined) {
        const r = parseInt(allowed_radius, 10);
        if (isNaN(r) || r < 5 || r > 100000) return res.status(400).json({ error: 'Yarıçap 5 ile 100000 metre arasında olmalı.' });
        sets.push('allowed_radius = ?');
        params.push(r);
    }
    if (require_location_match !== undefined) {
        sets.push('require_location_match = ?');
        params.push(require_location_match ? 1 : 0);
    }

    params.push(id, req.company.id);
    try {
        await db.query(`UPDATE dijital_machines SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, params);
        res.json({ message: 'Makine konumu güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Faz 3: panel alt kullanıcı girişi + yönetimi (sahip)
mountPanelUsers(router, { module: 'dijital', companyTable: 'dijital_companies', companyAuth });
// Faz 4: bildirim merkezi uçları
mountNotifications(router, { module: 'dijital', companyAuth });

module.exports = router;

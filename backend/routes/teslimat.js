const express = require('express');
const db = require('../db');
const { signToken, hashPassword, verifyPassword, companyGuard, workerGuard } = require('../auth');

const router = express.Router();

const companyAuth = companyGuard('teslimat', 'teslimat_companies');
const courierAuth = workerGuard('teslimat');

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
        const check = await db.query('SELECT id FROM teslimat_companies WHERE phone_number = ?', [phone_number]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Bu telefon numarası zaten kayıtlı.' });
        }

        const hashed = await hashPassword(password);
        await db.query(
            'INSERT INTO teslimat_companies (company_name, contact_name, contact_surname, phone_number, password) VALUES (?, ?, ?, ?, ?)',
            [company_name, contact_name, contact_surname, phone_number, hashed]
        );

        const { rows } = await db.query('SELECT * FROM teslimat_companies WHERE phone_number = ?', [phone_number]);
        const company = rows[0];
        const token = signToken({ role: 'company', module: 'teslimat', id: company.id });
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
        const { rows } = await db.query('SELECT * FROM teslimat_companies WHERE phone_number = ?', [phone_number]);
        const company = rows[0];
        if (!company || !(await verifyPassword(password, company.password))) {
            return res.status(401).json({ error: 'Hatalı telefon numarası veya şifre.' });
        }
        if (!company.is_active) {
            return res.status(403).json({ error: 'Hesap askıya alınmıştır.' });
        }
        const token = signToken({ role: 'company', module: 'teslimat', id: company.id });
        res.json({ message: 'Giriş başarılı.', company: sanitizeCompany(company), token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 2. COURIERS MANAGEMENT (COMPANY ACCESS) ---
router.post('/couriers', companyAuth, async (req, res) => {
    const { name, surname, phone_number } = req.body;
    if (!name || !surname || !phone_number) {
        return res.status(400).json({ error: 'Ad, soyad ve telefon zorunludur.' });
    }
    try {
        await db.query(
            'INSERT INTO teslimat_couriers (company_id, name, surname, phone_number) VALUES (?, ?, ?, ?)',
            [req.company.id, name, surname, phone_number]
        );
        res.status(201).json({ message: 'Kurye başarıyla eklendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/couriers', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM teslimat_couriers WHERE company_id = ? ORDER BY created_at DESC',
            [req.company.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/couriers/:id/toggle', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    try {
        await db.query('UPDATE teslimat_couriers SET is_active = ? WHERE id = ? AND company_id = ?', [is_active ? 1 : 0, id, req.company.id]);
        res.json({ message: 'Kurye durumu güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. PACKAGES MANAGEMENT (COMPANY ACCESS) ---
router.post('/packages', companyAuth, async (req, res) => {
    const { package_code, recipient_name, recipient_phone, delivery_address } = req.body;
    if (!package_code || !recipient_name || !recipient_phone || !delivery_address) {
        return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
    }
    try {
        const check = await db.query('SELECT id FROM teslimat_packages WHERE package_code = ?', [package_code]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Bu paket kodu zaten mevcut.' });
        }

        await db.query(
            'INSERT INTO teslimat_packages (company_id, package_code, recipient_name, recipient_phone, delivery_address) VALUES (?, ?, ?, ?, ?)',
            [req.company.id, package_code, recipient_name, recipient_phone, delivery_address]
        );
        res.status(201).json({ message: 'Gönderi kaydı oluşturuldu.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/packages', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT p.*, c.name || ' ' || c.surname as courier_name,
                    l.gps_latitude, l.gps_longitude, l.recipient_signature_base64, l.created_at as delivered_at
             FROM teslimat_packages p
             LEFT JOIN teslimat_couriers c ON p.courier_id = c.id
             LEFT JOIN teslimat_logs l ON l.id = (
                 SELECT max(id) FROM teslimat_logs
                 WHERE package_id = p.id AND log_type IN ('delivered_success', 'delivered_partial', 'returned')
             )
             WHERE p.company_id = ? ORDER BY p.created_at DESC`,
            [req.company.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/packages/:id/assign', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { courier_id } = req.body;
    if (!courier_id) {
        return res.status(400).json({ error: 'Kurye ataması zorunludur.' });
    }
    try {
        // Kurye de aynı firmaya ait olmalı
        const { rows: cr } = await db.query('SELECT id FROM teslimat_couriers WHERE id = ? AND company_id = ?', [courier_id, req.company.id]);
        if (cr.length === 0) {
            return res.status(400).json({ error: 'Geçersiz kurye.' });
        }
        await db.query(
            "UPDATE teslimat_packages SET courier_id = ?, status = 'in_transit' WHERE id = ? AND company_id = ?",
            [courier_id, id, req.company.id]
        );
        res.json({ message: 'Paket kuryeye zimmetlendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. COURIER PORTAL (OTP LOGIN FLOW) ---
router.post('/courier/login/request', async (req, res) => {
    const { phone_number } = req.body;
    if (!phone_number) {
        return res.status(400).json({ error: 'Telefon numarası zorunludur.' });
    }
    try {
        const { rows } = await db.query('SELECT * FROM teslimat_couriers WHERE phone_number = ? AND is_active = TRUE', [phone_number]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Sistemde kayıtlı veya aktif böyle bir kurye bulunamadı.' });
        }

        const checkClient = await db.query("SELECT id FROM clients WHERE prefix = 'TSLM'");
        if (checkClient.rows.length === 0) {
            await db.query(
                "INSERT INTO clients (company_name, prefix, webhook_url, api_key, phone_number, is_active) VALUES (?, ?, ?, ?, ?, ?)",
                ['Qimlik Teslimat System', 'TSLM', 'http://localhost:3303/api/client/webhook', 'tslmsystemkey123', '905303700589', 1]
            );
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        res.json({
            prefix: 'TSLM',
            code,
            gateway_phone: '905303700589'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/courier/login/status', async (req, res) => {
    const { phone_number, code } = req.query;
    if (!phone_number || !code) {
        return res.status(400).json({ error: 'Telefon ve kod zorunludur.' });
    }
    try {
        const targetMessage = `TSLM ${code}`;
        const { rows } = await db.query(
            "SELECT phone_number FROM logs WHERE UPPER(message_body) = ? AND created_at >= datetime('now', '-5 minutes') LIMIT 1",
            [targetMessage]
        );

        if (rows.length === 0) {
            return res.json({ verified: false });
        }

        const logPhone = rows[0].phone_number.replace(/\D/g, '');
        const cleanInputPhone = phone_number.replace(/\D/g, '');

        const isMatched = cleanInputPhone.length >= 9 && logPhone.length >= 9
            ? logPhone.endsWith(cleanInputPhone.slice(-9)) || cleanInputPhone.endsWith(logPhone.slice(-9))
            : logPhone === cleanInputPhone;

        if (!isMatched) {
            return res.json({ verified: false });
        }

        const { rows: courierRows } = await db.query('SELECT * FROM teslimat_couriers WHERE phone_number = ? AND is_active = TRUE', [phone_number]);
        const courier = courierRows[0];
        if (!courier) {
            return res.json({ verified: false });
        }
        const token = signToken({ role: 'worker', module: 'teslimat', id: courier.id, company_id: courier.company_id });
        res.json({ verified: true, courier, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Courier assigned packages (COURIER AUTH — kendi paketleri)
router.get('/courier/packages', courierAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            "SELECT * FROM teslimat_packages WHERE courier_id = ? ORDER BY created_at DESC",
            [req.worker.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 5. RECIPIENT DELIVERY VERIFICATION (REVERSE OTP) ---
router.get('/deliver/status', courierAuth, async (req, res) => {
    const { phone_number, code } = req.query;
    if (!phone_number || !code) {
        return res.status(400).json({ error: 'Telefon ve OTP kodu zorunludur.' });
    }
    try {
        const targetMessage = `TSLM ${code}`;
        const { rows } = await db.query(
            "SELECT phone_number FROM logs WHERE UPPER(message_body) = ? AND created_at >= datetime('now', '-5 minutes') LIMIT 1",
            [targetMessage]
        );

        if (rows.length === 0) {
            return res.json({ verified: false });
        }

        const logPhone = rows[0].phone_number.replace(/\D/g, '');
        const cleanInputPhone = phone_number.replace(/\D/g, '');

        const isMatched = cleanInputPhone.length >= 9 && logPhone.length >= 9
            ? logPhone.endsWith(cleanInputPhone.slice(-9)) || cleanInputPhone.endsWith(logPhone.slice(-9))
            : logPhone === cleanInputPhone;

        res.json({ verified: isMatched });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Confirm delivery with signature and GPS (COURIER AUTH — yalnızca kendi paketi)
router.post('/deliver/confirm', courierAuth, async (req, res) => {
    const { package_id, gps_latitude, gps_longitude, recipient_signature_base64, status, return_reason } = req.body;
    if (!package_id || gps_latitude === undefined || gps_longitude === undefined) {
        return res.status(400).json({ error: 'Paket ID ve GPS konum verisi zorunludur.' });
    }
    const finalStatus = status || 'delivered';
    try {
        // Paket bu kuryeye zimmetli olmalı
        const { rows: pkgRows } = await db.query('SELECT id FROM teslimat_packages WHERE id = ? AND courier_id = ?', [package_id, req.worker.id]);
        if (pkgRows.length === 0) {
            return res.status(403).json({ error: 'Bu paket size zimmetli değil.' });
        }

        await db.query(
            "UPDATE teslimat_packages SET status = ?, return_reason = ? WHERE id = ?",
            [finalStatus, return_reason || null, package_id]
        );

        let logType = 'delivered_success';
        let msg = 'Teslimat başarıyla doğrulandı ve tamamlandı.';
        if (finalStatus === 'partial') {
            logType = 'delivered_partial';
            msg = 'Kısmi teslimat başarıyla kaydedildi.';
        } else if (finalStatus === 'returned') {
            logType = 'returned';
            msg = 'Paket iade olarak işaretlendi.';
        }

        await db.query(
            "INSERT INTO teslimat_logs (package_id, log_type, gps_latitude, gps_longitude, recipient_signature_base64) VALUES (?, ?, ?, ?, ?)",
            [package_id, logType, parseFloat(gps_latitude), parseFloat(gps_longitude), recipient_signature_base64 || null]
        );

        res.json({ message: msg });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Kurye teslimat ekranı için paket detayı (COURIER AUTH — yalnızca kendi paketi)
router.get('/courier/packages/:id', courierAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query(
            `SELECT p.id, p.package_code, p.recipient_name, p.recipient_phone, p.status, p.delivery_address,
                    c.company_name
             FROM teslimat_packages p
             JOIN teslimat_companies c ON p.company_id = c.id
             WHERE p.id = ? AND p.courier_id = ?`,
            [id, req.worker.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Paket bulunamadı.' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 6. PUBLIC SHIPMENT TRACKING (alıcı için, kod ile) ---
router.get('/public/packages/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const { rows } = await db.query(
            `SELECT p.package_code, p.recipient_name, p.status, p.created_at,
                    c.company_name,
                    l.created_at as delivered_at
             FROM teslimat_packages p
             JOIN teslimat_companies c ON p.company_id = c.id
             LEFT JOIN teslimat_logs l ON p.id = l.package_id AND l.log_type = 'delivered_success'
             WHERE p.package_code = ?`,
            [code]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Paket bulunamadı.' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

const express = require('express');
const db = require('../db');
const { signToken, hashPassword, verifyPassword, companyGuard, workerGuard, panelWriteGuard } = require('../auth');
const { createOtp, verifyOtp } = require('../otp');
const { mountPanelUsers } = require('../panelUsers');

const router = express.Router();

const companyAuth = companyGuard('teslimat', 'teslimat_companies');
const courierAuth = workerGuard('teslimat');

// Faz 3: 'viewer' rolü tüm yazma isteklerinde reddedilir (public/login etkilenmez)
router.use(panelWriteGuard('teslimat'));

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
        const token = signToken({ role: 'company', module: 'teslimat', id: company.id, tier: 'owner' });
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
        const token = signToken({ role: 'company', module: 'teslimat', id: company.id, tier: 'owner' });
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

        const code = await createOtp('teslimat', 'login', phone_number);
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
        const result = await verifyOtp('teslimat', 'login', phone_number, code, 'TSLM');
        if (!result.verified) {
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
// Kurye, alıcıya gönderilecek teslimat kodunu sunucudan ister (tarayıcıda üretilmez).
router.post('/deliver/request', courierAuth, async (req, res) => {
    const { package_id } = req.body;
    if (!package_id) {
        return res.status(400).json({ error: 'Paket ID zorunludur.' });
    }
    try {
        const { rows } = await db.query(
            'SELECT recipient_phone FROM teslimat_packages WHERE id = ? AND courier_id = ?',
            [package_id, req.worker.id]
        );
        if (rows.length === 0) {
            return res.status(403).json({ error: 'Bu paket size zimmetli değil.' });
        }
        const recipientPhone = rows[0].recipient_phone;
        const code = await createOtp('teslimat', 'delivery', recipientPhone, package_id);
        res.json({ prefix: 'TSLM', code, gateway_phone: '905303700589', recipient_phone: recipientPhone });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/deliver/status', courierAuth, async (req, res) => {
    const { phone_number, code } = req.query;
    if (!phone_number || !code) {
        return res.status(400).json({ error: 'Telefon ve OTP kodu zorunludur.' });
    }
    try {
        const result = await verifyOtp('teslimat', 'delivery', phone_number, code, 'TSLM');
        res.json({ verified: result.verified });
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

        // Başarılı teslim/kısmi teslim için doğrulanmış alıcı OTP'si zorunlu (iade hariç)
        if (finalStatus === 'delivered' || finalStatus === 'partial') {
            const { rows: otpRows } = await db.query(
                "SELECT id FROM otp_codes WHERE module = 'teslimat' AND purpose = 'delivery' AND package_id = ? AND used = 1 AND created_at >= datetime('now', '-10 minutes') ORDER BY id DESC LIMIT 1",
                [package_id]
            );
            if (otpRows.length === 0) {
                return res.status(400).json({ error: 'Teslimat, alıcı doğrulaması (OTP) tamamlanmadan onaylanamaz.' });
            }
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

// --- ANALYTICS (ŞİRKET PANOSU İÇİN) ---
router.get('/company/analytics', companyAuth, async (req, res) => {
    const cid = req.company.id;
    try {
        // Son 30 gün günlük başarılı teslimat — trend
        const { rows: daily } = await db.query(
            `SELECT date(l.created_at) as day, COUNT(*) as count
             FROM teslimat_logs l JOIN teslimat_packages p ON l.package_id = p.id
             WHERE p.company_id = ? AND l.log_type = 'delivered_success' AND l.created_at >= date('now','-29 days')
             GROUP BY date(l.created_at) ORDER BY day ASC`, [cid]);
        // Paket durum dağılımı
        const { rows: statusDist } = await db.query(
            'SELECT status, COUNT(*) as count FROM teslimat_packages WHERE company_id = ? GROUP BY status', [cid]);
        // Kurye performansı (en çok teslim eden 10)
        const { rows: perf } = await db.query(
            `SELECT c.name || ' ' || c.surname as courier, COUNT(l.id) as delivered
             FROM teslimat_couriers c
             LEFT JOIN teslimat_packages p ON p.courier_id = c.id
             LEFT JOIN teslimat_logs l ON l.package_id = p.id AND l.log_type = 'delivered_success'
             WHERE c.company_id = ? GROUP BY c.id ORDER BY delivered DESC LIMIT 10`, [cid]);
        const { rows: cour } = await db.query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active FROM teslimat_couriers WHERE company_id = ?', [cid]);
        const { rows: pkg } = await db.query('SELECT COUNT(*) as total FROM teslimat_packages WHERE company_id = ?', [cid]);

        res.json({
            daily,
            status_distribution: statusDist,
            courier_performance: perf,
            summary: {
                couriers: cour[0]?.total || 0,
                active_couriers: cour[0]?.active || 0,
                packages: pkg[0]?.total || 0,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================
// --- 7. BAŞARISIZ TESLİM YÖNETİMİ & KURYE PERFORMANS KARNESİ ---
// ============================================================================

const FAIL_REASONS = ['recipient_absent', 'wrong_address', 'refused', 'other'];

// Kurye teslim edemedi: başarısız deneme kaydı oluşturur (COURIER AUTH — kendi paketi)
router.post('/courier/packages/:id/fail', courierAuth, async (req, res) => {
    const { id } = req.params;
    const { reason, note, next_attempt_date, gps_latitude, gps_longitude } = req.body;
    if (!reason || !FAIL_REASONS.includes(reason)) {
        return res.status(400).json({ error: 'Geçerli bir başarısızlık nedeni zorunludur.' });
    }
    if (gps_latitude === undefined || gps_latitude === null || gps_longitude === undefined || gps_longitude === null) {
        return res.status(400).json({ error: 'GPS konum verisi zorunludur.' });
    }
    try {
        // Paket bu kuryeye zimmetli olmalı
        const { rows: pkgRows } = await db.query(
            'SELECT id FROM teslimat_packages WHERE id = ? AND courier_id = ?',
            [id, req.worker.id]
        );
        if (pkgRows.length === 0) {
            return res.status(403).json({ error: 'Bu paket size zimmetli değil.' });
        }

        // Bu paket için mevcut deneme sayısı + 1
        const { rows: cntRows } = await db.query(
            'SELECT COUNT(*) as cnt FROM teslimat_delivery_attempts WHERE package_id = ?',
            [id]
        );
        const attemptNo = Number(cntRows[0]?.cnt || 0) + 1;

        await db.query(
            `INSERT INTO teslimat_delivery_attempts
                (package_id, courier_id, attempt_no, result, reason, note, next_attempt_date, gps_latitude, gps_longitude)
             VALUES (?, ?, ?, 'failed', ?, ?, ?, ?, ?)`,
            [id, req.worker.id, attemptNo, reason, note || null, next_attempt_date || null, parseFloat(gps_latitude), parseFloat(gps_longitude)]
        );

        await db.query(
            "UPDATE teslimat_packages SET status = 'failed', return_reason = ? WHERE id = ?",
            [reason, id]
        );

        await db.query(
            "INSERT INTO teslimat_logs (package_id, log_type, gps_latitude, gps_longitude) VALUES (?, 'delivery_failed', ?, ?)",
            [id, parseFloat(gps_latitude), parseFloat(gps_longitude)]
        );

        res.json({ message: 'Başarısız teslim kaydı oluşturuldu.', attempt_no: attemptNo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Firma: başarısız (status='failed') paketler — kurye adı ve deneme sayısı ile
router.get('/company/packages/failed', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT p.*, c.name || ' ' || c.surname as courier_name,
                    (SELECT COUNT(*) FROM teslimat_delivery_attempts a WHERE a.package_id = p.id) as attempts
             FROM teslimat_packages p
             LEFT JOIN teslimat_couriers c ON p.courier_id = c.id
             WHERE p.company_id = ? AND p.status = 'failed'
             ORDER BY p.created_at DESC`,
            [req.company.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Firma: bir paketin tüm deneme geçmişi (kronolojik, kurye adı ile)
router.get('/company/packages/:id/attempts', companyAuth, async (req, res) => {
    const { id } = req.params;
    try {
        // Sahiplik doğrula
        const { rows: own } = await db.query(
            'SELECT id FROM teslimat_packages WHERE id = ? AND company_id = ?',
            [id, req.company.id]
        );
        if (own.length === 0) {
            return res.status(404).json({ error: 'Paket bulunamadı.' });
        }
        const { rows } = await db.query(
            `SELECT a.*, c.name || ' ' || c.surname as courier_name
             FROM teslimat_delivery_attempts a
             LEFT JOIN teslimat_couriers c ON a.courier_id = c.id
             WHERE a.package_id = ?
             ORDER BY a.attempt_no ASC, a.id ASC`,
            [id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Firma: başarısız paketi yeniden ata (yeniden dağıtım için)
router.put('/company/packages/:id/reassign', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { courier_id } = req.body;
    if (!courier_id) {
        return res.status(400).json({ error: 'Kurye ataması zorunludur.' });
    }
    try {
        // Paket sahipliği
        const { rows: own } = await db.query(
            'SELECT id FROM teslimat_packages WHERE id = ? AND company_id = ?',
            [id, req.company.id]
        );
        if (own.length === 0) {
            return res.status(404).json({ error: 'Paket bulunamadı.' });
        }
        // Kurye de aynı firmaya ait olmalı
        const { rows: cr } = await db.query(
            'SELECT id FROM teslimat_couriers WHERE id = ? AND company_id = ?',
            [courier_id, req.company.id]
        );
        if (cr.length === 0) {
            return res.status(400).json({ error: 'Geçersiz kurye.' });
        }
        await db.query(
            "UPDATE teslimat_packages SET courier_id = ?, status = 'in_transit', return_reason = NULL WHERE id = ? AND company_id = ?",
            [courier_id, id, req.company.id]
        );
        res.json({ message: 'Paket yeniden atandı ve dağıtıma alındı.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Firma: kurye performans karnesi
router.get('/company/courier-scorecard', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT
                c.id,
                c.name || ' ' || c.surname as courier_name,
                c.is_active,
                (SELECT COUNT(*) FROM teslimat_packages p WHERE p.courier_id = c.id) as total_assigned,
                (SELECT COUNT(*) FROM teslimat_packages p WHERE p.courier_id = c.id AND p.status = 'delivered') as delivered,
                (SELECT COUNT(*) FROM teslimat_packages p WHERE p.courier_id = c.id AND p.status = 'failed') as failed,
                (SELECT COUNT(*) FROM teslimat_delivery_attempts a WHERE a.courier_id = c.id) as total_attempts,
                (SELECT COUNT(DISTINCT a.package_id) FROM teslimat_delivery_attempts a WHERE a.courier_id = c.id) as attempted_packages,
                (SELECT COUNT(*) FROM teslimat_logs l JOIN teslimat_packages p ON l.package_id = p.id
                    WHERE p.courier_id = c.id AND l.log_type = 'delivered_success'
                      AND l.created_at >= date('now','-29 days')) as last30_delivered
             FROM teslimat_couriers c
             WHERE c.company_id = ?
             ORDER BY delivered DESC, c.id ASC`,
            [req.company.id]
        );

        const scorecard = rows.map(r => {
            const delivered = Number(r.delivered) || 0;
            const failed = Number(r.failed) || 0;
            const resolved = delivered + failed;
            const totalAttempts = Number(r.total_attempts) || 0;
            const attemptedPackages = Number(r.attempted_packages) || 0;
            return {
                id: r.id,
                courier_name: r.courier_name,
                is_active: r.is_active,
                total_assigned: Number(r.total_assigned) || 0,
                delivered,
                failed,
                success_rate: resolved > 0 ? Math.round((delivered / resolved) * 100) : 0,
                avg_attempts: attemptedPackages > 0 ? Math.round((totalAttempts / attemptedPackages) * 10) / 10 : 0,
                last30_delivered: Number(r.last30_delivered) || 0,
            };
        });

        res.json(scorecard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Faz 3: panel alt kullanıcı girişi + yönetimi (sahip)
mountPanelUsers(router, { module: 'teslimat', companyTable: 'teslimat_companies', companyAuth });

module.exports = router;

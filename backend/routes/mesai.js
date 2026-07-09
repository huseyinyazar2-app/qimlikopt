const express = require('express');
const db = require('../db');
const { signToken, hashPassword, verifyPassword, companyGuard, workerGuard } = require('../auth');
const { createOtp, verifyOtp } = require('../otp');

const router = express.Router();

// --- COMPANY AUTH MIDDLEWARE ---
const companyAuth = companyGuard('mesai', 'mesai_companies');
// --- EMPLOYEE (WORKER) AUTH MIDDLEWARE ---
const employeeAuth = workerGuard('mesai');

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
        const check = await db.query('SELECT id FROM mesai_companies WHERE phone_number = ?', [phone_number]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Bu telefon numarası zaten kayıtlı.' });
        }

        const hashed = await hashPassword(password);
        await db.query(
            'INSERT INTO mesai_companies (company_name, contact_name, contact_surname, phone_number, password) VALUES (?, ?, ?, ?, ?)',
            [company_name, contact_name, contact_surname, phone_number, hashed]
        );

        const { rows } = await db.query('SELECT * FROM mesai_companies WHERE phone_number = ?', [phone_number]);
        const company = rows[0];
        const token = signToken({ role: 'company', module: 'mesai', id: company.id });
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
        const { rows } = await db.query('SELECT * FROM mesai_companies WHERE phone_number = ?', [phone_number]);
        const company = rows[0];
        if (!company || !(await verifyPassword(password, company.password))) {
            return res.status(401).json({ error: 'Hatalı telefon numarası veya şifre.' });
        }
        if (!company.is_active) {
            return res.status(403).json({ error: 'Hesap askıya alınmıştır.' });
        }
        const token = signToken({ role: 'company', module: 'mesai', id: company.id });
        res.json({ message: 'Giriş başarılı.', company: sanitizeCompany(company), token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- COMPANY SETTINGS ---
router.put('/company/settings', companyAuth, async (req, res) => {
    const { shift_type, shift_start_time, shift_end_time, tolerance_minutes, deduct_break_time } = req.body;
    try {
        await db.query(
            'UPDATE mesai_companies SET shift_type = ?, shift_start_time = ?, shift_end_time = ?, tolerance_minutes = ?, deduct_break_time = ? WHERE id = ?',
            [shift_type, shift_start_time, shift_end_time, parseInt(tolerance_minutes) || 0, deduct_break_time === undefined ? 1 : (deduct_break_time ? 1 : 0), req.company.id]
        );
        res.json({ message: 'Şirket mesai ayarları güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/company/settings', companyAuth, async (req, res) => {
    res.json(sanitizeCompany(req.company));
});

// --- 2. EMPLOYEES MANAGEMENT (COMPANY ACCESS) ---
router.post('/employees', companyAuth, async (req, res) => {
    const { name, surname, phone_number, photo_base64, hourly_wage } = req.body;
    if (!name || !surname || !phone_number) {
        return res.status(400).json({ error: 'Ad, soyad ve telefon zorunludur.' });
    }
    try {
        await db.query(
            'INSERT INTO mesai_employees (company_id, name, surname, phone_number, photo_base64, hourly_wage) VALUES (?, ?, ?, ?, ?, ?)',
            [req.company.id, name, surname, phone_number, photo_base64 || null, parseFloat(hourly_wage) || 0]
        );
        res.status(201).json({ message: 'Personel başarıyla eklendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/employees', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM mesai_employees WHERE company_id = ? ORDER BY created_at DESC',
            [req.company.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/employees/:id', companyAuth, async (req, res) => {
    const { hourly_wage } = req.body;
    try {
        await db.query('UPDATE mesai_employees SET hourly_wage = ? WHERE id = ? AND company_id = ?', [parseFloat(hourly_wage) || 0, req.params.id, req.company.id]);
        res.json({ message: 'Personel bilgileri güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/employees/:id/toggle', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    try {
        await db.query('UPDATE mesai_employees SET is_active = ? WHERE id = ? AND company_id = ?', [is_active ? 1 : 0, id, req.company.id]);
        res.json({ message: 'Personel durumu güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. LOCATIONS/WORK SITES (COMPANY ACCESS) ---
router.post('/locations', companyAuth, async (req, res) => {
    const { location_name, latitude, longitude, allowed_radius, shift_start_time, shift_end_time } = req.body;
    if (!location_name || !latitude || !longitude) {
        return res.status(400).json({ error: 'Lokasyon adı ve koordinatlar zorunludur.' });
    }
    try {
        await db.query(
            'INSERT INTO mesai_locations (company_id, location_name, latitude, longitude, allowed_radius, shift_start_time, shift_end_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.company.id, location_name, parseFloat(latitude), parseFloat(longitude), parseInt(allowed_radius) || 50, shift_start_time || '09:00', shift_end_time || '18:00']
        );
        res.status(201).json({ message: 'Çalışma alanı başarıyla eklendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/locations/:id', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { shift_start_time, shift_end_time } = req.body;
    try {
        await db.query('UPDATE mesai_locations SET shift_start_time = ?, shift_end_time = ? WHERE id = ? AND company_id = ?', [shift_start_time, shift_end_time, id, req.company.id]);
        res.json({ message: 'Lokasyon mesai saatleri güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/locations', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM mesai_locations WHERE company_id = ? ORDER BY created_at DESC',
            [req.company.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Personelin kendi firmasının lokasyonları (giriş yapmış personel)
router.get('/worker/locations', employeeAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT id, location_name, latitude, longitude, allowed_radius, shift_start_time, shift_end_time FROM mesai_locations WHERE company_id = ? ORDER BY location_name ASC',
            [req.worker.company_id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. EMPLOYEE WHATSAPP REVERSE OTP LOGIN FLOW ---
router.post('/employee/login/request', async (req, res) => {
    const { phone_number } = req.body;
    if (!phone_number) {
        return res.status(400).json({ error: 'Telefon numarası zorunludur.' });
    }
    try {
        const { rows } = await db.query('SELECT * FROM mesai_employees WHERE phone_number = ? AND is_active = TRUE', [phone_number]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Sistemde kayıtlı veya aktif böyle bir personel bulunamadı.' });
        }

        const checkClient = await db.query("SELECT id FROM clients WHERE prefix = 'MSAI'");
        if (checkClient.rows.length === 0) {
            await db.query(
                "INSERT INTO clients (company_name, prefix, webhook_url, api_key, phone_number, is_active) VALUES (?, ?, ?, ?, ?, ?)",
                ['Qimlik Mesai System', 'MSAI', 'http://localhost:3303/api/client/webhook', 'msaisystemkey123', '905303700589', 1]
            );
        }

        const code = await createOtp('mesai', 'login', phone_number);
        res.json({
            prefix: 'MSAI',
            code,
            gateway_phone: '905303700589'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/employee/login/status', async (req, res) => {
    const { phone_number, code } = req.query;
    if (!phone_number || !code) {
        return res.status(400).json({ error: 'Telefon ve kod zorunludur.' });
    }
    try {
        const result = await verifyOtp('mesai', 'login', phone_number, code, 'MSAI');
        if (!result.verified) {
            return res.json({ verified: false });
        }

        const { rows: empRows } = await db.query('SELECT * FROM mesai_employees WHERE phone_number = ? AND is_active = TRUE', [phone_number]);
        const employee = empRows[0];
        if (!employee) {
            return res.json({ verified: false });
        }
        const token = signToken({ role: 'worker', module: 'mesai', id: employee.id, company_id: employee.company_id });
        res.json({ verified: true, employee, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 5. GPS & GEOFENCING CHECK-IN / CHECK-OUT (EMPLOYEE AUTH) ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

router.post('/check', employeeAuth, async (req, res) => {
    const { location_id, log_type, gps_latitude, gps_longitude } = req.body;
    if (!location_id || !log_type || gps_latitude === undefined || gps_longitude === undefined) {
        return res.status(400).json({ error: 'Lokasyon, işlem türü ve GPS konum verileri zorunludur.' });
    }

    try {
        // Lokasyon personelin firmasına ait olmalı
        const { rows: locRows } = await db.query('SELECT * FROM mesai_locations WHERE id = ? AND company_id = ?', [location_id, req.worker.company_id]);
        const location = locRows[0];
        if (!location) {
            return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });
        }

        const distance = getDistance(
            parseFloat(gps_latitude),
            parseFloat(gps_longitude),
            location.latitude,
            location.longitude
        );

        await db.query(
            'INSERT INTO mesai_logs (employee_id, location_id, log_type, gps_latitude, gps_longitude, calculated_distance) VALUES (?, ?, ?, ?, ?, ?)',
            [req.worker.id, location_id, log_type, parseFloat(gps_latitude), parseFloat(gps_longitude), distance]
        );

        const isWithin = distance <= location.allowed_radius;
        const msg = log_type === 'check_in'
            ? (isWithin ? 'Mesai başarıyla başlatıldı.' : `Mesai başlatıldı (Şantiye dışında! Sapma: ${Math.round(distance)}m)`)
            : (isWithin ? 'Mesai başarıyla sonlandırıldı.' : `Mesai sonlandırıldı (Şantiye dışında! Sapma: ${Math.round(distance)}m)`);

        res.status(201).json({
            message: msg,
            distance: Math.round(distance),
            warning: !isWithin
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 6. COMPANY LIVE LOGS & TIMESHEET REPORTS ---
router.get('/company/logs', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT l.*, e.name || ' ' || e.surname as employee_name, loc.location_name
             FROM mesai_logs l
             JOIN mesai_employees e ON l.employee_id = e.id
             JOIN mesai_locations loc ON l.location_id = loc.id
             WHERE e.company_id = ? ORDER BY l.created_at DESC LIMIT 500`,
            [req.company.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

async function calculateEmployeeReport(id) {
    const { rows: empRows } = await db.query('SELECT company_id, hourly_wage FROM mesai_employees WHERE id = ?', [id]);
    if (empRows.length === 0) return { daily: [], monthly: [] };
    const hourly_wage = empRows[0].hourly_wage || 0;

    const { rows: compRows } = await db.query('SELECT shift_type, shift_start_time, shift_end_time, tolerance_minutes, deduct_break_time FROM mesai_companies WHERE id = ?', [empRows[0].company_id]);
    const company = compRows[0];

    const { rows: logs } = await db.query(
        `SELECT l.*, loc.location_name, loc.shift_start_time as loc_start, loc.shift_end_time as loc_end
         FROM mesai_logs l
         JOIN mesai_locations loc ON l.location_id = loc.id
         WHERE l.employee_id = ? ORDER BY l.created_at ASC`,
        [id]
    );

    const dailyLogs = {};

    for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const dateStr = new Date(log.created_at).toLocaleDateString('tr-TR');
        const timeStr = new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        if (!dailyLogs[dateStr]) {
            dailyLogs[dateStr] = {
                date: dateStr,
                check_in: '-',
                check_out: '-',
                hours: 0,
                break_hours: 0,
                wage: 0,
                location: log.location_name,
                raw_check_in: null,
                raw_break_start: null,
                late_minutes: 0,
                early_minutes: 0
            };
        }

        let targetStart = company.shift_start_time;
        let targetEnd = company.shift_end_time;
        if (company.shift_type === 'location_based') {
            targetStart = log.loc_start || '09:00';
            targetEnd = log.loc_end || '18:00';
        }

        const getMinutesDiff = (dObj, timeStr2) => {
            if (!timeStr2) return 0;
            const [h, m] = timeStr2.split(':').map(Number);
            const targetTime = new Date(dObj);
            targetTime.setHours(h, m, 0, 0);
            return (dObj - targetTime) / 60000;
        };

        if (log.log_type === 'check_in') {
            if (dailyLogs[dateStr].check_in === '-') {
                dailyLogs[dateStr].check_in = timeStr;
                dailyLogs[dateStr].raw_check_in = new Date(log.created_at);

                if (company.shift_type !== 'flexible') {
                    let diff = getMinutesDiff(new Date(log.created_at), targetStart);
                    if (diff > (company.tolerance_minutes || 0)) {
                        dailyLogs[dateStr].late_minutes = Math.round(diff);
                    }
                }
            }
        } else if (log.log_type === 'check_out' && dailyLogs[dateStr].raw_check_in) {
            dailyLogs[dateStr].check_out = timeStr;
            const checkInTime = dailyLogs[dateStr].raw_check_in;
            const checkOutTime = new Date(log.created_at);
            const diffMs = checkOutTime - checkInTime;
            const diffHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
            dailyLogs[dateStr].hours = diffHours;

            if (company.shift_type !== 'flexible') {
                let diff = getMinutesDiff(checkOutTime, targetEnd);
                if (diff < 0) {
                    dailyLogs[dateStr].early_minutes = Math.round(Math.abs(diff));
                }
            }
        } else if (log.log_type === 'break_start') {
            dailyLogs[dateStr].raw_break_start = new Date(log.created_at);
        } else if (log.log_type === 'break_end' && dailyLogs[dateStr].raw_break_start) {
            const breakInTime = dailyLogs[dateStr].raw_break_start;
            const breakOutTime = new Date(log.created_at);
            const diffMs = breakOutTime - breakInTime;
            dailyLogs[dateStr].break_hours += parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
            dailyLogs[dateStr].raw_break_start = null;
        }
    }

    Object.values(dailyLogs).forEach(day => {
        if (company.deduct_break_time) {
            day.hours = Math.max(0, day.hours - day.break_hours);
        }
        day.wage = parseFloat((day.hours * hourly_wage).toFixed(2));
    });

    const { rows: leaves } = await db.query("SELECT start_date, end_date, leave_type FROM mesai_leaves WHERE employee_id = ? AND status = 'approved'", [id]);

    const daily = Object.values(dailyLogs).reverse();

    const monthlyLogs = {};
    daily.forEach(day => {
        const parts = day.date.split('.');
        if (parts.length === 3) {
            const monthYear = new Date(parts[2], parts[1] - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

            if (!monthlyLogs[monthYear]) {
                monthlyLogs[monthYear] = {
                    month: monthYear,
                    hours: 0,
                    break_hours: 0,
                    wage: 0,
                    days_present: 0,
                    days_leave: 0
                };
            }
            monthlyLogs[monthYear].hours += day.hours;
            monthlyLogs[monthYear].break_hours += day.break_hours;
            monthlyLogs[monthYear].wage += day.wage;
            if (day.check_in !== '-') {
                monthlyLogs[monthYear].days_present += 1;
            }
        }
    });

    leaves.forEach(lv => {
        let s = new Date(lv.start_date);
        let e = new Date(lv.end_date);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            const monthYear = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
            if (!monthlyLogs[monthYear]) {
                monthlyLogs[monthYear] = { month: monthYear, hours: 0, break_hours: 0, wage: 0, days_present: 0, days_leave: 0 };
            }
            monthlyLogs[monthYear].days_leave += 1;
        }
    });

    const monthly = Object.values(monthlyLogs).map(m => ({
        ...m,
        hours: parseFloat(m.hours.toFixed(2)),
        break_hours: parseFloat(m.break_hours.toFixed(2)),
        wage: parseFloat(m.wage.toFixed(2))
    }));

    return { daily, monthly };
}

// Şirket erişimi: personel raporu (sahiplik doğrulanır)
router.get('/employees/:id/report', companyAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT id FROM mesai_employees WHERE id = ? AND company_id = ?', [id, req.company.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Personel bulunamadı.' });
        }
        const report = await calculateEmployeeReport(id);
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Personel erişimi: yalnızca kendi raporu
router.get('/worker/report', employeeAuth, async (req, res) => {
    try {
        const report = await calculateEmployeeReport(req.worker.id);
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 7. LEAVE MANAGEMENT (İZİN SİSTEMİ) ---
router.post('/worker/leaves', employeeAuth, async (req, res) => {
    const { start_date, end_date, leave_type } = req.body;
    if (!start_date || !end_date || !leave_type) {
        return res.status(400).json({ error: 'Eksik bilgi.' });
    }
    try {
        await db.query(
            'INSERT INTO mesai_leaves (employee_id, start_date, end_date, leave_type) VALUES (?, ?, ?, ?)',
            [req.worker.id, start_date, end_date, leave_type]
        );
        res.status(201).json({ message: 'İzin talebiniz başarıyla oluşturuldu.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/company/leaves', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT l.*, e.name || ' ' || e.surname as employee_name
             FROM mesai_leaves l
             JOIN mesai_employees e ON l.employee_id = e.id
             WHERE e.company_id = ? ORDER BY l.created_at DESC`,
            [req.company.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/company/leaves/:id', companyAuth, async (req, res) => {
    const { status } = req.body;
    try {
        await db.query('UPDATE mesai_leaves SET status = ? WHERE id = ? AND employee_id IN (SELECT id FROM mesai_employees WHERE company_id = ?)', [status, req.params.id, req.company.id]);
        res.json({ message: 'İzin durumu güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

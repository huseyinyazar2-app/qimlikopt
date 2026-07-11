const express = require('express');
const db = require('../db');
const { signToken, hashPassword, verifyPassword, companyGuard, workerGuard, requireTier, panelWriteGuard } = require('../auth');
const { createOtp, verifyOtp } = require('../otp');
const { mountPanelUsers } = require('../panelUsers');
const { notify, mountNotifications } = require('../notifications');

const router = express.Router();

// Faz 3: 'viewer' rolü tüm yazma isteklerinde reddedilir (public/login etkilenmez)
router.use(panelWriteGuard('mesai'));

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
        const token = signToken({ role: 'company', module: 'mesai', id: company.id, tier: 'owner' });
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
        const token = signToken({ role: 'company', module: 'mesai', id: company.id, tier: 'owner' });
        res.json({ message: 'Giriş başarılı.', company: sanitizeCompany(company), token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- COMPANY SETTINGS ---
router.put('/company/settings', companyAuth, requireTier('manager'), async (req, res) => {
    const { shift_type, shift_start_time, shift_end_time, tolerance_minutes, deduct_break_time,
            require_checkin_selfie, selfie_retention_days } = req.body;
    try {
        // Faz 6: selfie ayarlari yalnizca gonderilmisse degistirilsin (kismi guncelleme).
        const wantSelfie = require_checkin_selfie === undefined
            ? req.company.require_checkin_selfie
            : (require_checkin_selfie ? 1 : 0);
        // Saklama suresi: 1-365 gun arasi; disinda kalirsa mevcut degeri koru.
        let retention = req.company.selfie_retention_days ?? 30;
        if (selfie_retention_days !== undefined) {
            const n = parseInt(selfie_retention_days, 10);
            if (Number.isFinite(n) && n >= 1 && n <= 365) retention = n;
        }
        await db.query(
            `UPDATE mesai_companies SET shift_type = ?, shift_start_time = ?, shift_end_time = ?,
                    tolerance_minutes = ?, deduct_break_time = ?,
                    require_checkin_selfie = ?, selfie_retention_days = ? WHERE id = ?`,
            [shift_type, shift_start_time, shift_end_time, parseInt(tolerance_minutes) || 0,
             deduct_break_time === undefined ? 1 : (deduct_break_time ? 1 : 0),
             wantSelfie, retention, req.company.id]
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
    const { hourly_wage, annual_leave_days, hire_date } = req.body;
    try {
        await db.query(
            'UPDATE mesai_employees SET hourly_wage = ?, annual_leave_days = ?, hire_date = ? WHERE id = ? AND company_id = ?',
            [
                parseFloat(hourly_wage) || 0,
                annual_leave_days === undefined || annual_leave_days === null || annual_leave_days === '' ? null : parseInt(annual_leave_days),
                hire_date || null,
                req.params.id,
                req.company.id,
            ]
        );
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

// Kısmi güncelleme: yalnızca gönderilen alanlar değişir.
// (Faz 5: harita üzerinden pin sürükleyerek koordinat/yarıçap düzeltilebilsin diye genişletildi.)
router.put('/locations/:id', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { location_name, latitude, longitude, allowed_radius, shift_start_time, shift_end_time } = req.body;

    const sets = [];
    const params = [];
    const push = (col, val) => { sets.push(`${col} = ?`); params.push(val); };

    if (location_name !== undefined) push('location_name', location_name);
    if (latitude !== undefined) {
        const lat = parseFloat(latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) return res.status(400).json({ error: 'Geçersiz enlem.' });
        push('latitude', lat);
    }
    if (longitude !== undefined) {
        const lng = parseFloat(longitude);
        if (isNaN(lng) || lng < -180 || lng > 180) return res.status(400).json({ error: 'Geçersiz boylam.' });
        push('longitude', lng);
    }
    if (allowed_radius !== undefined) {
        const r = parseInt(allowed_radius, 10);
        if (isNaN(r) || r < 5 || r > 100000) return res.status(400).json({ error: 'Yarıçap 5 ile 100000 metre arasında olmalı.' });
        push('allowed_radius', r);
    }
    if (shift_start_time !== undefined) push('shift_start_time', shift_start_time);
    if (shift_end_time !== undefined) push('shift_end_time', shift_end_time);

    if (sets.length === 0) return res.status(400).json({ error: 'Güncellenecek alan gönderilmedi.' });

    params.push(id, req.company.id);
    try {
        await db.query(`UPDATE mesai_locations SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, params);
        res.json({ message: 'Çalışma alanı güncellendi.' });
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
        // Faz 6: check sayfasi selfie isteyecek mi bilsin diye firma ayarini iliştir.
        const { rows: comp } = await db.query(
            'SELECT require_checkin_selfie FROM mesai_companies WHERE id = ?',
            [req.worker.company_id]
        );
        const requireSelfie = !!(comp[0] && comp[0].require_checkin_selfie);
        res.json(rows.map(r => ({ ...r, require_selfie: requireSelfie })));
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
                ['Qimlik Mesai System', 'MSAI', 'http://localhost:3303/api/client/webhook', 'msaisystemkey123', '905404234000', 1]
            );
        }

        const code = await createOtp('mesai', 'login', phone_number);
        res.json({
            prefix: 'MSAI',
            code,
            gateway_phone: '905404234000'
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
    const { location_id, log_type, gps_latitude, gps_longitude, selfie_base64 } = req.body;
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

        const ins = await db.query(
            'INSERT INTO mesai_logs (employee_id, location_id, log_type, gps_latitude, gps_longitude, calculated_distance) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
            [req.worker.id, location_id, log_type, parseFloat(gps_latitude), parseFloat(gps_longitude), distance]
        );

        // Faz 6: selfie SADECE denetim kaydidir — girisi ASLA engellemez.
        // Kamera reddedilse/gonderilmese bile check-in yukarida zaten islendi.
        // Sadece gecerli ve makul boyutlu bir data-URL geldiyse ayri tabloya yaz.
        const logId = ins.rows[0]?.id;
        if (logId && typeof selfie_base64 === 'string' &&
            selfie_base64.startsWith('data:image/') && selfie_base64.length < 500000) {
            try {
                await db.query(
                    'INSERT INTO mesai_log_photos (log_id, photo_base64) VALUES (?, ?)',
                    [logId, selfie_base64]
                );
            } catch (photoErr) {
                console.warn('[mesai] selfie kaydedilemedi (giris etkilenmedi):', photoErr.message);
            }
        }

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
            `SELECT l.*, e.name || ' ' || e.surname as employee_name, loc.location_name,
                    EXISTS(SELECT 1 FROM mesai_log_photos p WHERE p.log_id = l.id) AS has_selfie
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

// Faz 6: bir giris kaydinin selfie'si (agir base64 — sadece istenince, tek tek).
// Kaydin personeli istekte bulunan firmaya ait olmali (yetki izolasyonu).
router.get('/company/logs/:id/selfie', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT p.photo_base64
             FROM mesai_log_photos p
             JOIN mesai_logs l ON p.log_id = l.id
             JOIN mesai_employees e ON l.employee_id = e.id
             WHERE p.log_id = ? AND e.company_id = ?
             ORDER BY p.id DESC LIMIT 1`,
            [req.params.id, req.company.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Selfie bulunamadı.' });
        res.json({ photo_base64: rows[0].photo_base64 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- BORDRO YARDIMCILARI ---
// Yerel saat diliminde YYYY-MM-DD (tatil eşleştirme için)
function toIsoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
// weekend_days '0' -> Set{0} (0=Pazar), '6,0' -> Set{6,0}
function parseWeekendDays(str) {
    return new Set(String(str ?? '0').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)));
}
// Bir tarih aralığındaki fiili çalışma günü (hafta tatili + resmi tatil hariç) — yıllık izin hesabı için
function countWorkingDays(startIso, endIso, weekendSet, holidaySet) {
    let count = 0;
    const s = new Date(startIso + 'T00:00:00');
    const e = new Date(endIso + 'T00:00:00');
    if (isNaN(s) || isNaN(e)) return 0;
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        if (weekendSet.has(d.getDay())) continue;
        if (holidaySet.has(toIsoDate(d))) continue;
        count++;
    }
    return count;
}
// Firmanın geçerli tatil haritası (global resmi + firmaya özel) -> Map<iso, {name,is_half_day,multiplier}>
async function loadHolidayMap(companyId) {
    const { rows } = await db.query(
        'SELECT holiday_date, name, is_half_day, multiplier FROM mesai_holidays WHERE company_id IS NULL OR company_id = ?',
        [companyId]
    );
    const map = new Map();
    rows.forEach(h => map.set(String(h.holiday_date).slice(0, 10), h));
    return map;
}

async function calculateEmployeeReport(id) {
    const { rows: empRows } = await db.query('SELECT company_id, hourly_wage FROM mesai_employees WHERE id = ?', [id]);
    if (empRows.length === 0) return { daily: [], monthly: [] };
    const hourly_wage = empRows[0].hourly_wage || 0;

    const { rows: compRows } = await db.query(
        `SELECT shift_type, shift_start_time, shift_end_time, tolerance_minutes, deduct_break_time,
                overtime_multiplier, weekend_multiplier, holiday_multiplier, daily_normal_hours, weekend_days
         FROM mesai_companies WHERE id = ?`, [empRows[0].company_id]);
    const company = compRows[0];

    // Bordro çarpanları ve gün türü kuralları
    const otMult = company.overtime_multiplier ?? 1.5;
    const wkMult = company.weekend_multiplier ?? 2.0;
    const holMult = company.holiday_multiplier ?? 2.0;
    const dailyNormal = company.daily_normal_hours ?? 9;
    const weekendSet = parseWeekendDays(company.weekend_days);
    const holidayMap = await loadHolidayMap(empRows[0].company_id);

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
            const dObj = new Date(log.created_at);
            const iso = toIsoDate(dObj);
            dailyLogs[dateStr] = {
                date: dateStr,
                iso_date: iso,
                weekday: dObj.getDay(),
                holiday_info: holidayMap.get(iso) || null,
                day_kind: 'workday',
                check_in: '-',
                check_out: '-',
                hours: 0,
                break_hours: 0,
                wage: 0,
                normal_hours: 0,
                overtime_hours: 0,
                weekend_hours: 0,
                holiday_hours: 0,
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
        const worked = day.hours;
        const isFullHoliday = day.holiday_info && !day.holiday_info.is_half_day;
        const isWeekend = weekendSet.has(day.weekday);

        if (isFullHoliday) {
            // Resmi/dini bayram: tüm çalışma tatil çarpanıyla (tatile özel çarpan varsa o)
            const f = day.holiday_info.multiplier != null ? day.holiday_info.multiplier : holMult;
            day.day_kind = 'holiday';
            day.holiday_name = day.holiday_info.name;
            day.holiday_hours = worked;
            day.wage = parseFloat((worked * hourly_wage * f).toFixed(2));
        } else if (isWeekend) {
            // Hafta tatili çalışması
            day.day_kind = 'weekend';
            day.weekend_hours = worked;
            day.wage = parseFloat((worked * hourly_wage * wkMult).toFixed(2));
        } else {
            // Normal iş günü: günlük eşiğe kadar normal, üstü fazla mesai
            if (day.holiday_info && day.holiday_info.is_half_day) {
                day.day_kind = 'half_holiday';
                day.holiday_name = day.holiday_info.name;
            }
            const normal = Math.min(worked, dailyNormal);
            const overtime = Math.max(0, worked - dailyNormal);
            day.normal_hours = normal;
            day.overtime_hours = overtime;
            day.wage = parseFloat((normal * hourly_wage + overtime * hourly_wage * otMult).toFixed(2));
        }

        day.normal_hours = parseFloat(day.normal_hours.toFixed(2));
        day.overtime_hours = parseFloat(day.overtime_hours.toFixed(2));
        day.weekend_hours = parseFloat(day.weekend_hours.toFixed(2));
        day.holiday_hours = parseFloat(day.holiday_hours.toFixed(2));
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
                    normal_hours: 0,
                    overtime_hours: 0,
                    weekend_hours: 0,
                    holiday_hours: 0,
                    days_present: 0,
                    days_leave: 0
                };
            }
            monthlyLogs[monthYear].hours += day.hours;
            monthlyLogs[monthYear].break_hours += day.break_hours;
            monthlyLogs[monthYear].wage += day.wage;
            monthlyLogs[monthYear].normal_hours += day.normal_hours;
            monthlyLogs[monthYear].overtime_hours += day.overtime_hours;
            monthlyLogs[monthYear].weekend_hours += day.weekend_hours;
            monthlyLogs[monthYear].holiday_hours += day.holiday_hours;
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
                monthlyLogs[monthYear] = { month: monthYear, hours: 0, break_hours: 0, wage: 0, normal_hours: 0, overtime_hours: 0, weekend_hours: 0, holiday_hours: 0, days_present: 0, days_leave: 0 };
            }
            monthlyLogs[monthYear].days_leave += 1;
        }
    });

    const monthly = Object.values(monthlyLogs).map(m => ({
        ...m,
        hours: parseFloat(m.hours.toFixed(2)),
        break_hours: parseFloat(m.break_hours.toFixed(2)),
        wage: parseFloat(m.wage.toFixed(2)),
        normal_hours: parseFloat(m.normal_hours.toFixed(2)),
        overtime_hours: parseFloat(m.overtime_hours.toFixed(2)),
        weekend_hours: parseFloat(m.weekend_hours.toFixed(2)),
        holiday_hours: parseFloat(m.holiday_hours.toFixed(2))
    }));

    return {
        daily,
        monthly,
        payroll: {
            overtime_multiplier: otMult,
            weekend_multiplier: wkMult,
            holiday_multiplier: holMult,
            daily_normal_hours: dailyNormal,
        },
    };
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
        const ins = await db.query(
            'INSERT INTO mesai_leaves (employee_id, start_date, end_date, leave_type) VALUES (?, ?, ?, ?)',
            [req.worker.id, start_date, end_date, leave_type]
        );
        const leaveId = ins.lastInsertRowid != null ? Number(ins.lastInsertRowid) : null;
        // Yöneticilere bildirim (izin talebi onay bekliyor)
        const { rows: emp } = await db.query('SELECT name, surname FROM mesai_employees WHERE id = ?', [req.worker.id]);
        const empName = emp[0] ? `${emp[0].name} ${emp[0].surname}` : 'Personel';
        const typeLabel = leave_type === 'annual' ? 'Yıllık izin' : leave_type === 'sick' ? 'Rapor' : 'İzin';
        await notify({
            module: 'mesai', company_id: req.worker.company_id, target_role: 'manager',
            type: 'leave_request', title: 'Yeni izin talebi',
            body: `${empName} — ${typeLabel} (${start_date} → ${end_date}) onayınızı bekliyor.`,
            link: '/logs', entity_type: 'leave', entity_id: leaveId,
            dedup_key: `leave_request:${leaveId}`,
        });
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

// --- ANALYTICS (ŞİRKET PANOSU İÇİN) ---
router.get('/company/analytics', companyAuth, async (req, res) => {
    const cid = req.company.id;
    try {
        // Son 30 günün günlük giriş (check_in) sayısı — trend grafiği
        const { rows: daily } = await db.query(
            `SELECT date(l.created_at) as day, COUNT(*) as count
             FROM mesai_logs l JOIN mesai_employees e ON l.employee_id = e.id
             WHERE e.company_id = ? AND l.log_type = 'check_in' AND l.created_at >= date('now','-29 days')
             GROUP BY date(l.created_at) ORDER BY day ASC`, [cid]);

        const { rows: emp } = await db.query(
            `SELECT COUNT(*) as total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active
             FROM mesai_employees WHERE company_id = ?`, [cid]);
        const { rows: loc } = await db.query('SELECT COUNT(*) as total FROM mesai_locations WHERE company_id = ?', [cid]);
        const { rows: month } = await db.query(
            `SELECT COUNT(*) as checkins,
                    SUM(CASE WHEN l.calculated_distance > loc.allowed_radius THEN 1 ELSE 0 END) as out_of_bounds
             FROM mesai_logs l
             JOIN mesai_employees e ON l.employee_id = e.id
             JOIN mesai_locations loc ON l.location_id = loc.id
             WHERE e.company_id = ? AND l.log_type = 'check_in' AND l.created_at >= date('now','start of month')`, [cid]);

        res.json({
            daily,
            summary: {
                employees: emp[0]?.total || 0,
                active_employees: emp[0]?.active || 0,
                locations: loc[0]?.total || 0,
                month_checkins: month[0]?.checkins || 0,
                month_out_of_bounds: month[0]?.out_of_bounds || 0,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 8. BORDRO AYARLARI (ÇARPANLAR) ---
router.get('/company/payroll-settings', companyAuth, async (req, res) => {
    const c = req.company;
    res.json({
        overtime_multiplier: c.overtime_multiplier ?? 1.5,
        weekend_multiplier: c.weekend_multiplier ?? 2.0,
        holiday_multiplier: c.holiday_multiplier ?? 2.0,
        daily_normal_hours: c.daily_normal_hours ?? 9,
        annual_leave_days: c.annual_leave_days ?? 14,
        weekend_days: c.weekend_days ?? '0',
    });
});

router.put('/company/payroll-settings', companyAuth, requireTier('manager'), async (req, res) => {
    const { overtime_multiplier, weekend_multiplier, holiday_multiplier, daily_normal_hours, annual_leave_days, weekend_days } = req.body;
    try {
        await db.query(
            `UPDATE mesai_companies SET overtime_multiplier = ?, weekend_multiplier = ?, holiday_multiplier = ?,
                    daily_normal_hours = ?, annual_leave_days = ?, weekend_days = ? WHERE id = ?`,
            [
                parseFloat(overtime_multiplier) || 1.5,
                parseFloat(weekend_multiplier) || 2.0,
                parseFloat(holiday_multiplier) || 2.0,
                parseFloat(daily_normal_hours) || 9,
                parseInt(annual_leave_days) || 14,
                String(weekend_days || '0'),
                req.company.id,
            ]
        );
        res.json({ message: 'Bordro ayarları güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 9. RESMİ TATİL TAKVİMİ ---
// Global (resmi) tatiller + firmanın kendi eklediği tatiller
router.get('/company/holidays', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT id, company_id, holiday_date, name, is_half_day, multiplier,
                    CASE WHEN company_id IS NULL THEN 1 ELSE 0 END as is_official
             FROM mesai_holidays WHERE company_id IS NULL OR company_id = ?
             ORDER BY holiday_date ASC`,
            [req.company.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/company/holidays', companyAuth, async (req, res) => {
    const { holiday_date, name, is_half_day, multiplier } = req.body;
    if (!holiday_date || !name) {
        return res.status(400).json({ error: 'Tarih ve tatil adı zorunludur.' });
    }
    try {
        await db.query(
            'INSERT INTO mesai_holidays (company_id, holiday_date, name, is_half_day, multiplier) VALUES (?, ?, ?, ?, ?)',
            [req.company.id, String(holiday_date).slice(0, 10), name, is_half_day ? 1 : 0, multiplier != null && multiplier !== '' ? parseFloat(multiplier) : null]
        );
        res.status(201).json({ message: 'Tatil günü eklendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sadece firmanın kendi eklediği tatil silinebilir (resmi tatiller korunur)
router.delete('/company/holidays/:id', companyAuth, async (req, res) => {
    try {
        await db.query('DELETE FROM mesai_holidays WHERE id = ? AND company_id = ?', [req.params.id, req.company.id]);
        res.json({ message: 'Tatil günü silindi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 10. YILLIK İZİN BAKİYESİ ---
async function computeLeaveBalance(employeeId) {
    const { rows: empRows } = await db.query('SELECT company_id, annual_leave_days FROM mesai_employees WHERE id = ?', [employeeId]);
    if (empRows.length === 0) return null;
    const emp = empRows[0];
    const { rows: compRows } = await db.query('SELECT annual_leave_days, weekend_days FROM mesai_companies WHERE id = ?', [emp.company_id]);
    const comp = compRows[0] || {};
    const entitlement = emp.annual_leave_days ?? comp.annual_leave_days ?? 14;
    const weekendSet = parseWeekendDays(comp.weekend_days);
    const holidaySet = new Set((await loadHolidayMap(emp.company_id)).keys());

    const year = new Date().getFullYear();
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const { rows: leaves } = await db.query(
        'SELECT start_date, end_date, leave_type, status FROM mesai_leaves WHERE employee_id = ?',
        [employeeId]
    );

    let used = 0, pending = 0;
    leaves.forEach(lv => {
        if (lv.leave_type !== 'annual') return; // sadece yıllık ücretli izin bakiyeden düşer
        let s = String(lv.start_date).slice(0, 10);
        let e = String(lv.end_date).slice(0, 10);
        if (e < yearStart || s > yearEnd) return; // bu yılın dışı
        if (s < yearStart) s = yearStart;
        if (e > yearEnd) e = yearEnd;
        const days = countWorkingDays(s, e, weekendSet, holidaySet);
        if (lv.status === 'approved') used += days;
        else if (lv.status === 'pending') pending += days;
    });

    return { year, entitlement, used, pending, remaining: Math.max(0, entitlement - used) };
}

// Şirket: bir personelin izin bakiyesi (sahiplik doğrulanır)
router.get('/employees/:id/leave-balance', companyAuth, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id FROM mesai_employees WHERE id = ? AND company_id = ?', [req.params.id, req.company.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Personel bulunamadı.' });
        const balance = await computeLeaveBalance(req.params.id);
        res.json(balance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Personel: kendi izin bakiyesi
router.get('/worker/leave-balance', employeeAuth, async (req, res) => {
    try {
        const balance = await computeLeaveBalance(req.worker.id);
        res.json(balance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- FAZ 5: HARİTA & KONUM ---
// Şantiyeler (merkez + tolerans yarıçapı) ve seçilen günün giriş/çıkış noktaları.
// outside=true ise personel yarıçapın dışında okutmuş demektir.
router.get('/company/map/data', companyAuth, async (req, res) => {
    const cid = req.company.id;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : null;
    try {
        const { rows: locations } = await db.query(
            'SELECT id, location_name, latitude, longitude, allowed_radius FROM mesai_locations WHERE company_id = ? ORDER BY location_name ASC',
            [cid]
        );

        const params = [cid];
        let dateFilter = "date(l.created_at) = date('now')";
        if (date) {
            dateFilter = 'date(l.created_at) = ?';
            params.push(date);
        }

        const { rows: raw } = await db.query(
            `SELECT l.id, l.employee_id, e.name || ' ' || e.surname AS employee_name,
                    l.location_id, loc.location_name, loc.allowed_radius,
                    l.log_type, l.gps_latitude, l.gps_longitude, l.calculated_distance, l.created_at,
                    EXISTS(SELECT 1 FROM mesai_log_photos p WHERE p.log_id = l.id) AS has_selfie
             FROM mesai_logs l
             JOIN mesai_employees e ON l.employee_id = e.id
             JOIN mesai_locations loc ON l.location_id = loc.id
             WHERE e.company_id = ? AND ${dateFilter}
             ORDER BY l.created_at ASC
             LIMIT 2000`,
            params
        );

        const checkins = raw.map(r => ({
            ...r,
            latitude: r.gps_latitude,
            longitude: r.gps_longitude,
            outside: Number(r.calculated_distance) > Number(r.allowed_radius),
        }));

        res.json({
            date: date || null,
            locations,
            checkins,
            summary: {
                locations: locations.length,
                checkins: checkins.length,
                outside: checkins.filter(c => c.outside).length,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Faz 3: panel alt kullanıcı girişi + yönetimi (sahip)
mountPanelUsers(router, { module: 'mesai', companyTable: 'mesai_companies', companyAuth });
// Faz 4: bildirim merkezi uçları
mountNotifications(router, { module: 'mesai', companyAuth });

// Test amaçlı iç fonksiyon erişimi (bordro motoru doğrulaması)
router._calculateEmployeeReport = calculateEmployeeReport;
router._computeLeaveBalance = computeLeaveBalance;

module.exports = router;

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
        const { rows } = await db.query('SELECT * FROM mesai_companies WHERE password = ? AND is_active = TRUE', [token]);
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
        const check = await db.query('SELECT id FROM mesai_companies WHERE phone_number = ?', [phone_number]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Bu telefon numarası zaten kayıtlı.' });
        }

        await db.query(
            'INSERT INTO mesai_companies (company_name, contact_name, contact_surname, phone_number, password) VALUES (?, ?, ?, ?, ?)',
            [company_name, contact_name, contact_surname, phone_number, password]
        );

        const { rows } = await db.query('SELECT * FROM mesai_companies WHERE phone_number = ?', [phone_number]);
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
            'SELECT * FROM mesai_companies WHERE phone_number = ? AND password = ?',
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

// --- 2. EMPLOYEES MANAGEMENT (COMPANY ACCESS) ---
router.post('/employees', companyAuth, async (req, res) => {
    const { name, surname, phone_number, photo_base64 } = req.body;
    if (!name || !surname || !phone_number) {
        return res.status(400).json({ error: 'Ad, soyad ve telefon zorunludur.' });
    }
    try {
        await db.query(
            'INSERT INTO mesai_employees (company_id, name, surname, phone_number, photo_base64) VALUES (?, ?, ?, ?, ?)',
            [req.company.id, name, surname, phone_number, photo_base64 || null]
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

router.put('/employees/:id/toggle', companyAuth, async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    try {
        await db.query('UPDATE mesai_employees SET is_active = ? WHERE id = ? AND company_id = ?', [is_active, id, req.company.id]);
        res.json({ message: 'Personel durumu güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. LOCATIONS/WORK SITES (COMPANY ACCESS) ---
router.post('/locations', companyAuth, async (req, res) => {
    const { location_name, latitude, longitude, allowed_radius } = req.body;
    if (!location_name || !latitude || !longitude) {
        return res.status(400).json({ error: 'Lokasyon adı ve koordinatlar zorunludur.' });
    }
    try {
        await db.query(
            'INSERT INTO mesai_locations (company_id, location_name, latitude, longitude, allowed_radius) VALUES (?, ?, ?, ?, ?)',
            [req.company.id, location_name, parseFloat(latitude), parseFloat(longitude), parseInt(allowed_radius) || 50]
        );
        res.status(201).json({ message: 'Çalışma alanı başarıyla eklendi.' });
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

// GET single location details for employee QR scanning page
router.get('/public/locations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query(
            'SELECT id, location_name, latitude, longitude, allowed_radius FROM mesai_locations WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Lokasyon bulunamadı.' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all locations for employee simulation select dropdown
router.get('/public/locations/all', async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT id, location_name, latitude, longitude, allowed_radius FROM mesai_locations ORDER BY location_name ASC'
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

        // Register MSAI prefix in clients table
        const checkClient = await db.query("SELECT id FROM clients WHERE prefix = 'MSAI'");
        if (checkClient.rows.length === 0) {
            await db.query(
                "INSERT INTO clients (company_name, prefix, webhook_url, api_key, phone_number, is_active) VALUES (?, ?, ?, ?, ?, ?)",
                ['Qimlik Mesai System', 'MSAI', 'http://localhost:3303/api/client/webhook', 'msaisystemkey123', '905303700589', 1]
            );
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
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
        const targetMessage = `MSAI ${code}`;
        const { rows } = await db.query(
            "SELECT phone_number FROM logs WHERE UPPER(message_body) = ? LIMIT 1",
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

        const { rows: empRows } = await db.query('SELECT * FROM mesai_employees WHERE phone_number = ?', [phone_number]);
        res.json({ verified: true, employee: empRows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 5. GPS & GEOFENCING CHECK-IN / CHECK-OUT ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

router.post('/check', async (req, res) => {
    const { employee_id, location_id, log_type, gps_latitude, gps_longitude } = req.body;
    if (!employee_id || !location_id || !log_type || gps_latitude === undefined || gps_longitude === undefined) {
        return res.status(400).json({ error: 'Personel, lokasyon, işlem türü ve GPS konum verileri zorunludur.' });
    }

    try {
        // Fetch location coordinates
        const { rows: locRows } = await db.query('SELECT * FROM mesai_locations WHERE id = ?', [location_id]);
        const location = locRows[0];
        if (!location) {
            return res.status(404).json({ error: 'Çalışma alanı bulunamadı.' });
        }

        // Calculate distance
        const distance = getDistance(
            parseFloat(gps_latitude),
            parseFloat(gps_longitude),
            location.latitude,
            location.longitude
        );

        if (distance > location.allowed_radius) {
            return res.status(400).json({
                error: `Hedef alandan çok uzaktasınız. İzin verilen yarıçap: ${location.allowed_radius}m, Sizin mesafeniz: ${Math.round(distance)}m`
            });
        }

        // Insert log
        await db.query(
            'INSERT INTO mesai_logs (employee_id, location_id, log_type, gps_latitude, gps_longitude, calculated_distance) VALUES (?, ?, ?, ?, ?, ?)',
            [employee_id, location_id, log_type, parseFloat(gps_latitude), parseFloat(gps_longitude), distance]
        );

        res.status(201).json({
            message: log_type === 'check_in' ? 'Mesai başarıyla başlatıldı.' : 'Mesai başarıyla sonlandırıldı.',
            distance: Math.round(distance)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 6. COMPANY LIVE LOGS & RETROSPECTIVE TIMESHEET REPORTS ---

// Get live logs
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

// Helper to calculate retrospective daily & monthly hours
async function calculateEmployeeReport(id) {
    // Fetch all logs for this employee
    const { rows: logs } = await db.query(
        `SELECT l.*, loc.location_name 
         FROM mesai_logs l
         JOIN mesai_locations loc ON l.location_id = loc.id
         WHERE l.employee_id = ? ORDER BY l.created_at ASC`,
        [id]
    );

    // Calculate hours worked per day
    const dailyLogs = {};

    // Parse check-ins and check-outs chronologically to calculate working durations
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
                location: log.location_name,
                raw_check_in: null
            };
        }

        if (log.log_type === 'check_in') {
            dailyLogs[dateStr].check_in = timeStr;
            dailyLogs[dateStr].raw_check_in = new Date(log.created_at);
        } else if (log.log_type === 'check_out' && dailyLogs[dateStr].raw_check_in) {
            dailyLogs[dateStr].check_out = timeStr;
            const checkInTime = dailyLogs[dateStr].raw_check_in;
            const checkOutTime = new Date(log.created_at);
            const diffMs = checkOutTime - checkInTime;
            const diffHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
            dailyLogs[dateStr].hours = diffHours;
        }
    }

    const daily = Object.values(dailyLogs).reverse();

    // Calculate monthly aggregates
    const monthlyLogs = {};
    daily.forEach(day => {
        // Day date format: DD.MM.YYYY
        const parts = day.date.split('.');
        if (parts.length === 3) {
            const monthYear = new Date(parts[2], parts[1] - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
            
            if (!monthlyLogs[monthYear]) {
                monthlyLogs[monthYear] = {
                    month: monthYear,
                    hours: 0,
                    days_present: 0
                };
            }
            monthlyLogs[monthYear].hours += day.hours;
            if (day.check_in !== '-') {
                monthlyLogs[monthYear].days_present += 1;
            }
        }
    });

    // Format monthly details to round hours
    const monthly = Object.values(monthlyLogs).map(m => ({
        ...m,
        hours: parseFloat(m.hours.toFixed(2))
    }));

    return { daily, monthly };
}

// Get employee timesheet report (retrospective daily & monthly hours calculations) - COMPANY ACCESS
router.get('/employees/:id/report', companyAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const report = await calculateEmployeeReport(id);
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get employee timesheet report - PUBLIC/EMPLOYEE ACCESS
router.get('/public/employees/:id/report', async (req, res) => {
    const { id } = req.params;
    try {
        const report = await calculateEmployeeReport(id);
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;

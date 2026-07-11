const fs = require('fs');
const path = require('path');
const db = require('./index');
const { hashPassword, isHashed } = require('../auth');

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Tüm şemayı tek seferde çalıştır (naif ';' bölme yerine).
        // Böylece string/yorum içindeki ';' karakterleri ifadeleri bölmez.
        await db.client.executeMultiple(schemaSql);

        // Yabancı anahtar (foreign key) zorlamasını aç
        await db.client.execute('PRAGMA foreign_keys = ON');

        // Faz 2: mevcut tablolara eklenen kolonlar (idempotent — varsa yoksay)
        await runMigrations();

        // Varsayılan/düz metin admin şifresini bir kez hash'le (DB'de düz metin bırakma)
        const { rows } = await db.client.execute("SELECT value FROM global_settings WHERE key = 'ADMIN_PASSWORD'");
        const stored = rows[0]?.value;
        if (stored && !isHashed(stored)) {
            const hashed = await hashPassword(stored);
            await db.client.execute({
                sql: "UPDATE global_settings SET value = ? WHERE key = 'ADMIN_PASSWORD'",
                args: [hashed],
            });
            console.log('Admin şifresi güvenli biçimde (hash) saklandı.');
        }

        console.log('Database schema initialized successfully.');
    } catch (error) {
        console.error('Failed to initialize database schema:', error);
    }
}

// Faz 2 kolon eklemeleri. SQLite'ta "duplicate column" hatası zararsızdır (zaten var demektir).
async function addColumn(table, column, definition) {
    try {
        await db.client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch (err) {
        if (!/duplicate column/i.test(err.message)) {
            console.warn(`Migration (${table}.${column}) atlandı:`, err.message);
        }
    }
}

async function runMigrations() {
    // --- Eski kurulumlarla şema hizalaması ---
    // `CREATE TABLE IF NOT EXISTS` var olan tabloya kolon EKLEMEZ. İlk sürümden beri
    // schema.sql'e eklenen kolonlar, eskiden kurulmuş veritabanlarında oluşmaz.
    // Aşağıdakiler o boşluğu kapatır (yeni kurulumda "duplicate column" ile yoksayılır).
    for (const table of ['clients', 'gateway_devices', 'mesai_companies', 'mesai_employees',
        'dijital_companies', 'dijital_technicians', 'teslimat_companies', 'teslimat_couriers']) {
        await addColumn(table, 'hourly_wage', 'REAL DEFAULT 0');
    }

    await addColumn('mesai_companies', 'shift_type', "VARCHAR(50) DEFAULT 'company_wide'");
    await addColumn('mesai_companies', 'shift_start_time', "VARCHAR(10) DEFAULT '09:00'");
    await addColumn('mesai_companies', 'shift_end_time', "VARCHAR(10) DEFAULT '18:00'");
    await addColumn('mesai_companies', 'tolerance_minutes', 'INTEGER DEFAULT 15');
    await addColumn('mesai_companies', 'deduct_break_time', 'BOOLEAN DEFAULT 1');

    await addColumn('mesai_locations', 'shift_start_time', "VARCHAR(10) DEFAULT '09:00'");
    await addColumn('mesai_locations', 'shift_end_time', "VARCHAR(10) DEFAULT '18:00'");
    await addColumn('mesai_locations', 'maintenance_interval_days', 'INTEGER');
    await addColumn('mesai_locations', 'last_maintenance_date', 'TIMESTAMP');

    await addColumn('dijital_machines', 'gps_latitude', 'REAL');
    await addColumn('dijital_machines', 'gps_longitude', 'REAL');
    await addColumn('dijital_machines', 'require_location_match', 'BOOLEAN DEFAULT 0');
    await addColumn('dijital_machines', 'allowed_radius', 'INTEGER DEFAULT 50');
    await addColumn('dijital_machines', 'maintenance_interval_days', 'INTEGER');
    await addColumn('dijital_machines', 'last_maintenance_date', 'TIMESTAMP');

    await addColumn('dijital_maintenance_logs', 'technician_latitude', 'REAL');
    await addColumn('dijital_maintenance_logs', 'technician_longitude', 'REAL');
    await addColumn('dijital_maintenance_logs', 'calculated_distance', 'REAL');

    await addColumn('teslimat_packages', 'return_reason', 'TEXT');

    // Mesai: bordro çarpanları + yıllık izin ayarları
    await addColumn('mesai_companies', 'overtime_multiplier', 'REAL DEFAULT 1.5');
    await addColumn('mesai_companies', 'weekend_multiplier', 'REAL DEFAULT 2.0');
    await addColumn('mesai_companies', 'holiday_multiplier', 'REAL DEFAULT 2.0');
    await addColumn('mesai_companies', 'daily_normal_hours', 'REAL DEFAULT 9');
    await addColumn('mesai_companies', 'annual_leave_days', 'INTEGER DEFAULT 14');
    await addColumn('mesai_companies', 'weekend_days', "VARCHAR(20) DEFAULT '0'"); // 0=Pazar; virgüllü: '6,0'

    // Mesai: personel bazlı izin hakkı ve işe giriş tarihi
    await addColumn('mesai_employees', 'annual_leave_days', 'INTEGER'); // NULL = şirket varsayılanı
    await addColumn('mesai_employees', 'hire_date', 'DATE');

    // Faz 5: teslimat hareketini olayın gerçekleştiği andaki kuryeye sabitle.
    // Paket başka kuryeye devredilince geçmiş rota yanlış kuryeye kaymasın diye.
    // Eski satırlarda NULL kalır; okumada paketin güncel kuryesine düşülür.
    await addColumn('teslimat_logs', 'courier_id', 'INTEGER REFERENCES teslimat_couriers(id)');

    // --- Faz 6: Cila ---
    await addColumn('mesai_companies', 'require_checkin_selfie', 'BOOLEAN DEFAULT 0');
    await addColumn('mesai_companies', 'selfie_retention_days', 'INTEGER DEFAULT 30');
    await addColumn('teslimat_packages', 'tracking_token', 'VARCHAR(64)');
    await addColumn('dijital_spare_parts', 'min_stock', 'INTEGER DEFAULT 0');

    // tracking_token indexi kolon EKLENDIKTEN sonra (schema.sql'de olamaz — bkz. not).
    try {
        await db.client.execute('CREATE INDEX IF NOT EXISTS idx_teslimat_pkg_token ON teslimat_packages (tracking_token)');
    } catch (err) {
        console.warn('tracking_token index atlandı:', err.message);
    }

    // Resmi tatilleri tohumla (yalnızca bir kez; global = company_id NULL)
    await seedHolidays();

    // Eski paketlere takip jetonu üret (yeni public/track ucu jetonla çalışır).
    await backfillTrackingTokens();

    // Web sitesindeki canlı deneme bölümü için "DEMO" ön ekli aktif bir firma.
    await seedDemoClient();
}

// Web sitesi /dene bölümü: ziyaretçi "DEMO <kod>" mesajını gateway'e gönderir,
// gateway bunu bu firmaya eşler ve logs'a "success" yazar → verify-status doğrular.
// Ön ek DEMO herkese açıktır (gizli değil); demo amaçlı kasıtlı böyle.
async function seedDemoClient() {
    try {
        const { rows } = await db.client.execute(
            "SELECT id FROM clients WHERE prefix = 'DEMO'"
        );
        if (rows.length === 0) {
            await db.client.execute({
                sql: 'INSERT INTO clients (company_name, prefix, webhook_url, api_key, phone_number, contact_name, contact_surname, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
                args: ['Qimlik Demo', 'DEMO', 'https://api.qimlik.com/api/client/webhook/DEMO', 'qimlik-demo-key', '905404234000', 'Qimlik', 'Demo'],
            });
            console.log('Demo firması (DEMO) tohumlandı.');
        }
    } catch (err) {
        console.warn('Demo firması tohumlanamadı:', err.message);
    }
}

// Faz 6: tracking_token'i olmayan paketlere tahmin edilemez jeton yaz.
// SQLite'ta güvenli rastgele üretmek zor; JS tarafında üretip tek tek yazıyoruz.
async function backfillTrackingTokens() {
    const crypto = require('crypto');
    try {
        const { rows } = await db.client.execute(
            "SELECT id FROM teslimat_packages WHERE tracking_token IS NULL OR tracking_token = ''"
        );
        for (const r of rows) {
            await db.client.execute({
                sql: 'UPDATE teslimat_packages SET tracking_token = ? WHERE id = ?',
                args: [crypto.randomBytes(16).toString('hex'), r.id],
            });
        }
        if (rows.length > 0) console.log(`Faz 6: ${rows.length} pakete takip jetonu üretildi.`);
    } catch (err) {
        console.warn('Takip jetonu backfill atlandı:', err.message);
    }
}

// 2026 sabit tarihli resmi/ulusal bayramlar. Dini bayramlar (Ramazan/Kurban) her yıl
// kayar; yanlış tarih bordroyu bozacağı için tohumlanmaz — firma panelden ekler.
async function seedHolidays() {
    const { rows } = await db.client.execute(
        'SELECT COUNT(*) as c FROM mesai_holidays WHERE company_id IS NULL'
    );
    if ((rows[0]?.c || 0) > 0) return;

    const holidays = [
        ['2026-01-01', 'Yılbaşı', 0],
        ['2026-04-23', 'Ulusal Egemenlik ve Çocuk Bayramı', 0],
        ['2026-05-01', 'Emek ve Dayanışma Günü', 0],
        ['2026-05-19', 'Atatürk’ü Anma, Gençlik ve Spor Bayramı', 0],
        ['2026-07-15', 'Demokrasi ve Milli Birlik Günü', 0],
        ['2026-08-30', 'Zafer Bayramı', 0],
        ['2026-10-28', 'Cumhuriyet Bayramı Arifesi', 1],
        ['2026-10-29', 'Cumhuriyet Bayramı', 0],
    ];
    for (const [date, name, half] of holidays) {
        await db.client.execute({
            sql: 'INSERT INTO mesai_holidays (company_id, holiday_date, name, is_half_day) VALUES (NULL, ?, ?, ?)',
            args: [date, name, half],
        });
    }
    console.log('Resmi tatil takvimi (2026 sabit tarihli) tohumlandı.');
}

module.exports = initDb;

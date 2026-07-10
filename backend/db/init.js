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

    // Resmi tatilleri tohumla (yalnızca bir kez; global = company_id NULL)
    await seedHolidays();
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

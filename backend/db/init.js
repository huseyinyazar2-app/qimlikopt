const fs = require('fs');
const path = require('path');
const db = require('./index');
const { hashPassword, isHashed } = require('../auth');

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon, filter empty, and execute each statement
        const statements = schemaSql.split(';').filter(stmt => stmt.trim() !== '');

        for (const stmt of statements) {
            await db.client.execute(stmt);
        }

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

module.exports = initDb;

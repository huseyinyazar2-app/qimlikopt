const db = require('./index');

async function migrate() {
    console.log('Starting database migration: clients table modification...');
    try {
        // Check if phone_number column already exists to prevent double run errors
        const { rows } = await db.query("PRAGMA table_info(clients)");
        const hasPhoneNumber = rows.some(r => r.name === 'phone_number');

        if (hasPhoneNumber) {
            console.log('Database is already migrated. Skipping migration.');
            process.exit(0);
        }

        // Disable foreign keys temporarily
        console.log('Disabling foreign key constraints...');
        await db.client.execute('PRAGMA foreign_keys = OFF');

        // 1. Rename existing clients table
        console.log('Renaming clients table to clients_old...');
        await db.client.execute('ALTER TABLE clients RENAME TO clients_old');

        // 2. Create the new clients table
        console.log('Creating new clients table...');
        await db.client.execute(`
            CREATE TABLE clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_name VARCHAR(255) NOT NULL,
                prefix VARCHAR(50) UNIQUE NOT NULL,
                webhook_url VARCHAR(500) NOT NULL,
                api_key VARCHAR(255) NOT NULL,
                phone_number VARCHAR(50),
                contact_name VARCHAR(100),
                contact_surname VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Copy data from clients_old to clients
        console.log('Copying data from clients_old to clients...');
        await db.client.execute(`
            INSERT INTO clients (id, company_name, prefix, webhook_url, api_key, is_active, created_at)
            SELECT id, company_name, prefix, webhook_url, api_key, is_active, created_at
            FROM clients_old
        `);

        // 4. Drop clients_old table
        console.log('Dropping clients_old table...');
        await db.client.execute('DROP TABLE clients_old');

        // Re-enable foreign keys
        console.log('Re-enabling foreign key constraints...');
        await db.client.execute('PRAGMA foreign_keys = ON');

        console.log('Database migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Database migration failed:', error);
        // Try to re-enable foreign keys just in case
        try {
            await db.client.execute('PRAGMA foreign_keys = ON');
        } catch (_) {}
        process.exit(1);
    }
}

migrate();

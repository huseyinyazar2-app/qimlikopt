const db = require('./db');

async function alterDb() {
    const commands = [
        "ALTER TABLE dijital_companies ADD COLUMN contact_name VARCHAR(100);",
        "ALTER TABLE dijital_companies ADD COLUMN contact_surname VARCHAR(100);",
        "ALTER TABLE mesai_companies ADD COLUMN contact_name VARCHAR(100);",
        "ALTER TABLE mesai_companies ADD COLUMN contact_surname VARCHAR(100);",
        "ALTER TABLE teslimat_companies ADD COLUMN contact_name VARCHAR(100);",
        "ALTER TABLE teslimat_companies ADD COLUMN contact_surname VARCHAR(100);"
    ];

    for (const cmd of commands) {
        try {
            await db.query(cmd);
            console.log(`Success: ${cmd}`);
        } catch (err) {
            if (err.message && err.message.includes("duplicate column name")) {
                console.log(`Column already exists, skipping: ${cmd}`);
            } else {
                console.error(`Error executing ${cmd}:`, err.message);
            }
        }
    }
    console.log("Database update script finished.");
}

alterDb();

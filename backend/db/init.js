const fs = require('fs');
const path = require('path');
const db = require('./index');

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon, filter empty, and execute each statement
        const statements = schemaSql.split(';').filter(stmt => stmt.trim() !== '');
        
        for (const stmt of statements) {
            await db.client.execute(stmt);
        }
        
        console.log('Database schema initialized successfully.');
    } catch (error) {
        console.error('Failed to initialize database schema:', error);
    }
}

module.exports = initDb;

const { createClient } = require('@libsql/client');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.TURSO_DATABASE_URL || `file:${path.resolve(__dirname, '../local.db')}`;

// For local SQLite, TURSO_DATABASE_URL can be "file:local.db"
// For remote Turso, it will be "libsql://..." and require TURSO_AUTH_TOKEN
const db = createClient({
  url: dbPath,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

module.exports = {
  // execute expects { sql, args } or a string
  query: (text, params) => db.execute({ sql: text, args: params || [] }),
  client: db
};

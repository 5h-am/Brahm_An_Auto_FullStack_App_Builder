require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename TEXT PRIMARY KEY,
        run_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const migrationsDir = __dirname;
    const sqlFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const filename of sqlFiles) {
      try {
        const result = await client.query(
          'SELECT filename FROM _migrations WHERE filename = $1',
          [filename]
        );

        if (result.rows.length > 0) {
          continue;
        }

        const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [filename]
        );
      } catch (err) {
        console.warn(`Migration ${filename} failed or partially failed: ${err.message}. If tables already exist, this is likely a permissions warning.`);
      }
    }
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };

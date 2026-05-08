import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'asmdaproje_db',
  user: 'postgres',
  password: 'postgres'
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Connected to Neon database.');
    const sql = fs.readFileSync(join(__dirname, 'init.sql'), 'utf-8');
    await client.query(sql);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

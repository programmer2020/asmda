import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

// Local PostgreSQL pool — only local mode supported
const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'asmdaproje_db',
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  connectionTimeoutMillis: 5000
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function getDatabaseStatus() {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    return {
      connected: true,
      mode: 'local',
      message: 'الاتصال بقاعدة البيانات المحلية يعمل بشكل سليم.',
      time: result.rows[0].now,
      source: 'local'
    };
  } catch (error) {
    return {
      connected: false,
      mode: 'local',
      message: `خطأ في الاتصال بقاعدة البيانات: ${error.message}`,
      time: new Date().toISOString(),
      source: 'local'
    };
  }
}

export async function safeQuery(text, params = []) {
  try {
    const result = await query(text, params);
    return { ok: true, rows: result.rows };
  } catch (error) {
    return { ok: false, error };
  }
}


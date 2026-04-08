import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const dataMode = (process.env.DATA_MODE ?? 'local').toLowerCase();

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'asmdaproje_db',
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  connectionTimeoutMillis: 1200
});

const initialStatus = {
  connected: false,
  mode: dataMode === 'local' ? 'local' : 'checking',
  message:
    dataMode === 'local'
      ? 'الوضع المحلي مفعل بدون Postgres.'
      : 'جارٍ التحقق من اتصال قاعدة البيانات.',
  time: new Date().toISOString(),
  source: dataMode === 'local' ? 'local' : 'postgres'
};

let cachedStatus = initialStatus;
let lastCheckedAt = 0;

function isLocalMode() {
  return dataMode === 'local';
}

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function getDatabaseStatus(force = false) {
  if (isLocalMode()) {
    cachedStatus = {
      connected: false,
      mode: 'local',
      message: 'الوضع المحلي مفعل بدون Docker أو Postgres.',
      time: new Date().toISOString(),
      source: 'local'
    };

    return cachedStatus;
  }

  if (!force && Date.now() - lastCheckedAt < 15000) {
    return cachedStatus;
  }

  try {
    const result = await query('SELECT NOW() AS now');

    cachedStatus = {
      connected: true,
      mode: 'postgres',
      message: 'الاتصال بقاعدة Postgres المحلية يعمل بشكل سليم.',
      time: result.rows[0].now,
      source: 'postgres'
    };
  } catch (error) {
    cachedStatus = {
      connected: false,
      mode: 'local',
      message: `Fallback local mode: ${error.message}`,
      time: new Date().toISOString(),
      source: 'local'
    };
  }

  lastCheckedAt = Date.now();
  return cachedStatus;
}

export async function safeQuery(text, params = []) {
  try {
    const result = await query(text, params);
    return {
      ok: true,
      rows: result.rows
    };
  } catch (error) {
    return {
      ok: false,
      error
    };
  }
}

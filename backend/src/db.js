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
  if (isLocalMode()) {
    const tableName = text.match(/FROM\s+([a-zA-Z0-9_]+)/i)?.[1];
    
    const mockData = {
      direct_sales: [
        { id: 'SAL-1001', customer_name: 'عميل محلي 1', product_name: 'منتج أ', amount: 1500, status: 'مكتملة', sales_rep: 'أحمد', sale_date: new Date(), created_at: new Date() },
        { id: 'SAL-1002', customer_name: 'عميل محلي 2', product_name: 'منتج ب', amount: 2300, status: 'جديدة', sales_rep: 'سارة', sale_date: new Date(), created_at: new Date() }
      ],
      installment_sales: [
        { id: 'CRD-1001', customer_name: 'عميل آجل 1', invoice_number: 'INV-001', amount: 5000, paid_amount: 1000, due_date: new Date(), status: 'مستحقة', sales_rep: 'محمد', created_at: new Date() }
      ],
      return_sales: [
        { id: 'RET-1001', customer_name: 'عميل مرتجع 1', original_invoice_number: 'INV-005', amount: 500, reason: 'تالف', return_date: new Date(), status: 'قيد المراجعة', sales_rep: 'سامي', created_at: new Date() }
      ],
      price_list: [
        { id: 'PRC-1001', product_name: 'منتج أ', category: 'فئة 1', purchase_price: 1000, selling_price: 1500, created_at: new Date() },
        { id: 'PRC-1002', product_name: 'منتج ب', category: 'فئة 2', purchase_price: 2000, selling_price: 2500, created_at: new Date() }
      ],
      custodies: [
        { id: 'CST-1001', employee_name: 'موظف 1', custody_type: 'نقدية', item_details: '', initial_amount: 1000, current_balance: 800, start_date: new Date(), status: 'نشطة', created_at: new Date() }
      ],
      custody_transactions: [
        { id: 'CTX-1001', custody_id: 'CST-1001', transaction_type: 'صرف', amount: 200, date: new Date(), notes: 'مصاريف نثرية', created_at: new Date() }
      ],
      tasks: [
        { id: 1, title: 'تهيئة النظام', description: 'بدأ العمل على النظام الجديد', status: 'done', created_at: new Date() }
      ]
    };

    return {
      rows: mockData[tableName] || [],
      rowCount: (mockData[tableName] || []).length
    };
  }
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

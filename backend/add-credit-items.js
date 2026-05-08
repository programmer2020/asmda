import pg from 'pg';
const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'asmdaproje_db',
  user: 'postgres',
  password: 'postgres'
});
pool.query(`
  ALTER TABLE installment_sales
    ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10) NOT NULL DEFAULT 'fixed',
    ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
`)
  .then(() => { console.log('installment_sales columns added OK'); pool.end(); })
  .catch(e => { console.error('Error:', e.message); pool.end(); });

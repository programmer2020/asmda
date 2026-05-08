import pg from 'pg';
const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'asmdaproje_db',
  user: 'postgres',
  password: 'postgres'
});
pool.query('ALTER TABLE return_sales ADD COLUMN IF NOT EXISTS product_name VARCHAR(255)')
  .then(() => { console.log('Column added OK'); pool.end(); })
  .catch(e => { console.error('Error:', e.message); pool.end(); });

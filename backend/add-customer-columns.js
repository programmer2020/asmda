import { query } from './src/db.js';
try {
  await query("ALTER TABLE customers_catalog ADD COLUMN IF NOT EXISTS governorate TEXT DEFAULT ''");
  await query("ALTER TABLE customers_catalog ADD COLUMN IF NOT EXISTS registration_date DATE");
  console.log('DONE: columns added');
} catch (e) {
  console.error('ERROR:', e.message);
}
process.exit(0);

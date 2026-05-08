CREATE TABLE IF NOT EXISTS direct_sales (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'جديدة',
  sales_rep VARCHAR(255),
  sale_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS installment_sales (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  invoice_number VARCHAR(100),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'مستحقة',
  sales_rep VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS return_sales (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  product_name VARCHAR(255),
  original_invoice_number VARCHAR(100),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  reason TEXT,
  return_date DATE,
  status VARCHAR(50) DEFAULT 'قيد المراجعة',
  sales_rep VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_list (
  id VARCHAR(50) PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS petty_cash;

CREATE TABLE IF NOT EXISTS custodies (
  id VARCHAR(50) PRIMARY KEY,
  employee_name VARCHAR(255) NOT NULL,
  custody_type VARCHAR(50) NOT NULL,
  item_details TEXT,
  initial_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  start_date DATE,
  status VARCHAR(50) DEFAULT 'نشطة',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custody_transactions (
  id VARCHAR(50) PRIMARY KEY,
  custody_id VARCHAR(50) NOT NULL REFERENCES custodies(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checks (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  check_number VARCHAR(100),
  bank_name VARCHAR(255),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  collection_date DATE,
  status VARCHAR(50) DEFAULT 'معلق',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cash_receipts (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  receipt_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Missing columns on existing tables ────────────────────────────────────────
ALTER TABLE installment_sales ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]';
ALTER TABLE installment_sales ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10) NOT NULL DEFAULT 'fixed';
ALTER TABLE installment_sales ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE installment_sales ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE return_sales ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);

-- ── Final Product Store ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS final_product_store (
  id VARCHAR(50) PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL DEFAULT '',
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT 'قطعة',
  min_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'متوفر',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Raw Materials & Packaging Store ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raw_materials_store (
  id VARCHAR(50) PRIMARY KEY,
  material_name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL DEFAULT '',
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT 'كجم',
  min_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'متوفر',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Rep Sub-Stores ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rep_sub_stores (
  id VARCHAR(50) PRIMARY KEY,
  rep_name VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'مسلّم',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Financial Manager Custody ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_manager_custody (
  id VARCHAR(50) PRIMARY KEY,
  employee_name VARCHAR(255) NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  purpose TEXT NOT NULL DEFAULT '',
  custody_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'نشطة',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Raw Materials Purchases ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raw_materials_purchases (
  id VARCHAR(50) PRIMARY KEY,
  supplier_name VARCHAR(255) NOT NULL,
  material_name VARCHAR(255) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  purchase_date DATE,
  invoice_number VARCHAR(100) NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Machine Maintenance Purchases ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS machine_maintenance_purchases (
  id VARCHAR(50) PRIMARY KEY,
  supplier_name VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  purchase_date DATE,
  machine_name VARCHAR(255) NOT NULL DEFAULT '',
  invoice_number VARCHAR(100) NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Misc Purchases ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS misc_purchases (
  id VARCHAR(50) PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  category VARCHAR(255) NOT NULL DEFAULT '',
  purchase_date DATE,
  receipt_number VARCHAR(100) NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Payroll & Advances ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll_advances (
  id VARCHAR(50) PRIMARY KEY,
  employee_name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'راتب',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  month VARCHAR(50) NOT NULL DEFAULT '',
  status VARCHAR(50) NOT NULL DEFAULT 'معلق',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Customer Payment Alerts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_payment_alerts (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  alert_type VARCHAR(100) NOT NULL DEFAULT 'فاتورة آجل',
  status VARCHAR(50) NOT NULL DEFAULT 'قادم',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Free Samples ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS free_samples (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL DEFAULT '',
  product_name VARCHAR(255) NOT NULL DEFAULT '',
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit VARCHAR(50) NOT NULL DEFAULT 'قطعة',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  sample_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Raw Materials Catalog ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raw_materials_catalog (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(255) NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Suppliers Catalog ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers_catalog (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Product Cards ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_cards (
  id VARCHAR(100) PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL DEFAULT '',
  unit VARCHAR(50) NOT NULL DEFAULT 'قطعة',
  code VARCHAR(100) NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

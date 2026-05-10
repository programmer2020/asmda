import bcrypt from 'bcryptjs';
import { query } from '../db.js';

export const ALL_PAGES = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'notifications', label: 'التنبيهات' },
  { id: 'product-cards', label: 'كبون الأصناف' },
  { id: 'final-product-store', label: 'مخزن المنتج النهائي' },
  { id: 'raw-materials-packaging-store', label: 'مخزن الخامات والتعبئة' },
  { id: 'raw-materials-catalog', label: 'تسجيل الخامات' },
  { id: 'suppliers', label: 'تسجيل الموردين' },
  { id: 'rep-sub-stores', label: 'مخازن المناديب' },
  { id: 'reps-management', label: 'إدارة المناديب' },
  { id: 'financial-manager-custody', label: 'عهدة المدير المالي' },
  { id: 'raw-materials-purchases', label: 'مشتريات خامات' },
  { id: 'machine-maintenance-purchases', label: 'مشتريات صيانة مكن' },
  { id: 'misc-purchases', label: 'مشتريات نثرية' },
  { id: 'payroll-advances', label: 'رواتب وسلف' },
  { id: 'sales', label: 'فاتورة مبيعات' },
  { id: 'checks', label: 'تحصيل' },
  { id: 'returns', label: 'المرتجعات' },
  { id: 'customer-payment-alerts', label: 'تنبيهات مواعيد الدفع' },
  { id: 'free-samples', label: 'العينات المجانية' },
  { id: 'credit-sales', label: 'مبيعات الآجل' },
  { id: 'price-list', label: 'قائمة الأسعار' },
  { id: 'custodies', label: 'العهد' },
  { id: 'customers', label: 'تسجيل العملاء' },
  { id: 'statement', label: 'كشف حساب' }
];

const DEFAULT_ROLES = [
  { id: 'admin', label: 'مدير النظام', isSystem: true, pages: '*' },
  { id: 'manager', label: 'مدير', isSystem: true, pages: ['dashboard','notifications','product-cards','final-product-store','raw-materials-packaging-store','raw-materials-catalog','suppliers','customers','rep-sub-stores','reps-management','financial-manager-custody','raw-materials-purchases','machine-maintenance-purchases','misc-purchases','payroll-advances','sales','checks','returns','customer-payment-alerts','free-samples','credit-sales','price-list','custodies','statement'] },
  { id: 'sales', label: 'مبيعات', isSystem: true, pages: ['dashboard','notifications','customers','sales','credit-sales','returns','customer-payment-alerts','free-samples','price-list','checks','statement'] },
  { id: 'warehouse', label: 'مخازن', isSystem: true, pages: ['dashboard','notifications','product-cards','final-product-store','raw-materials-packaging-store','raw-materials-catalog','suppliers','customers','rep-sub-stores','raw-materials-purchases','machine-maintenance-purchases','misc-purchases'] },
  { id: 'accountant', label: 'محاسب', isSystem: true, pages: ['dashboard','notifications','checks','custodies','financial-manager-custody','payroll-advances','statement','customers','sales','credit-sales','returns'] }
];

const DEFAULT_ADMIN = {
  id: '1',
  username: 'admin',
  password: 'admin123',
  displayName: 'المدير',
  code: 'ADM-001',
  role: 'admin'
};

let initializationPromise = null;

function toBoolean(value) {
  return value === true || value === 'true' || value === 't' || value === 1 || value === '1';
}

function normalizePages(value, allPages = false) {
  if (allPages || value === '*') {
    return '*';
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function serializePages(pages) {
  if (pages === '*') {
    return { pagesJson: JSON.stringify([]), allPages: true };
  }

  return {
    pagesJson: JSON.stringify(Array.isArray(pages) ? pages : []),
    allPages: false
  };
}

function mapRole(row) {
  return {
    id: row.id,
    label: row.label,
    isSystem: toBoolean(row.is_system),
    pages: normalizePages(row.pages, toBoolean(row.all_pages))
  };
}

function mapUser(row) {
  return {
    id: String(row.id),
    username: row.username,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    code: row.code || '',
    role: row.role_id
  };
}

function sanitizeUser(user) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function nextGeneratedId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS roles (
      id VARCHAR(100) PRIMARY KEY,
      label VARCHAR(255) NOT NULL UNIQUE,
      pages JSONB NOT NULL DEFAULT '[]',
      all_pages BOOLEAN NOT NULL DEFAULT FALSE,
      is_system BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query("ALTER TABLE roles ADD COLUMN IF NOT EXISTS pages JSONB NOT NULL DEFAULT '[]'");
  await query("ALTER TABLE roles ADD COLUMN IF NOT EXISTS all_pages BOOLEAN NOT NULL DEFAULT FALSE");
  await query("ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT FALSE");

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(100) PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL DEFAULT '',
      role_id VARCHAR(100) NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS code VARCHAR(100) NOT NULL DEFAULT ''");
}

async function readRoles() {
  const result = await query('SELECT * FROM roles ORDER BY created_at ASC');
  return result.rows.map(mapRole);
}

async function readUsers() {
  const result = await query('SELECT * FROM users ORDER BY created_at ASC');
  return result.rows.map(mapUser);
}

async function seedDefaultRoles() {
  const existingRoles = await readRoles();
  const existingRoleIds = new Set(existingRoles.map((role) => role.id));

  for (const role of DEFAULT_ROLES) {
    if (existingRoleIds.has(role.id)) {
      continue;
    }

    const { pagesJson, allPages } = serializePages(role.pages);
    await query(
      'INSERT INTO roles (id, label, pages, all_pages, is_system) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [role.id, role.label, pagesJson, allPages, role.isSystem]
    );
  }
}

async function seedDefaultAdmin() {
  const existingUsers = await readUsers();
  const adminUser = existingUsers.find((user) => user.username === DEFAULT_ADMIN.username);
  if (adminUser) {
    return;
  }

  await query(
    'INSERT INTO users (id, username, password_hash, display_name, code, role_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [DEFAULT_ADMIN.id, DEFAULT_ADMIN.username, bcrypt.hashSync(DEFAULT_ADMIN.password, 10), DEFAULT_ADMIN.displayName, DEFAULT_ADMIN.code, DEFAULT_ADMIN.role]
  );
}

export async function initializeUsersStore() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await ensureSchema();
      await seedDefaultRoles();
      await seedDefaultAdmin();
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  await initializationPromise;
}

export async function getAllRoles() {
  await initializeUsersStore();
  return readRoles();
}

export async function getRoleById(roleId) {
  await initializeUsersStore();
  const roles = await readRoles();
  return roles.find((role) => role.id === roleId) || null;
}

export async function getRolePagesById(roleId) {
  return (await getRoleById(roleId))?.pages ?? [];
}

export async function createRole({ label, pages }) {
  await initializeUsersStore();
  const normalizedLabel = String(label || '').trim();
  if (!normalizedLabel) throw new Error('يرجى إدخال اسم الدور.');

  const existingRoles = await readRoles();
  if (existingRoles.some((role) => role.label === normalizedLabel)) {
    throw new Error('اسم الدور موجود بالفعل.');
  }

  const { pagesJson, allPages } = serializePages(pages ?? []);
  const result = await query(
    'INSERT INTO roles (id, label, pages, all_pages, is_system) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [nextGeneratedId('role'), normalizedLabel, pagesJson, allPages, false]
  );

  return mapRole(result.rows[0]);
}

export async function updateRole(id, { label, pages }) {
  await initializeUsersStore();
  const existingRole = await getRoleById(id);
  if (!existingRole) throw new Error('الدور غير موجود.');
  if (existingRole.id === 'admin') throw new Error('لا يمكن تعديل دور المدير.');

  const nextLabel = label !== undefined ? String(label || '').trim() : existingRole.label;
  if (!nextLabel) throw new Error('يرجى إدخال اسم الدور.');

  const roles = await readRoles();
  if (roles.some((role) => role.id !== id && role.label === nextLabel)) {
    throw new Error('اسم الدور موجود بالفعل.');
  }

  const nextPages = pages !== undefined ? pages : existingRole.pages;
  const { pagesJson, allPages } = serializePages(nextPages);
  const result = await query(
    'UPDATE roles SET label = COALESCE($2, label), pages = COALESCE($3, pages), all_pages = COALESCE($4, all_pages) WHERE id = $1 RETURNING *',
    [id, nextLabel, pagesJson, allPages]
  );

  return mapRole(result.rows[0]);
}

export async function deleteRole(id) {
  await initializeUsersStore();
  const existingRole = await getRoleById(id);
  if (!existingRole) throw new Error('الدور غير موجود.');
  if (existingRole.isSystem) throw new Error('لا يمكن حذف الأدوار الأساسية للنظام.');

  const users = await readUsers();
  if (users.some((user) => user.role === id)) {
    throw new Error('لا يمكن حذف دور مرتبط بمستخدمين.');
  }

  await query('DELETE FROM roles WHERE id = $1 RETURNING id', [id]);
}

export async function getAllUsers() {
  await initializeUsersStore();
  return (await readUsers()).map(sanitizeUser);
}

export async function getUserById(id) {
  await initializeUsersStore();
  const users = await readUsers();
  return users.find((user) => user.id === String(id)) || null;
}

export async function getUserByUsername(username) {
  await initializeUsersStore();
  const users = await readUsers();
  return users.find((user) => user.username === String(username || '').trim()) || null;
}

export async function createUser({ username, password, displayName, code, role }) {
  await initializeUsersStore();
  const normalizedUsername = String(username || '').trim();
  const normalizedDisplayName = String(displayName || '').trim();
  if (!normalizedUsername || !password || !normalizedDisplayName) {
    throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور والاسم الظاهر.');
  }

  const users = await readUsers();
  if (users.some((user) => user.username === normalizedUsername)) {
    throw new Error('اسم المستخدم موجود بالفعل.');
  }

  if (!(await getRoleById(role))) throw new Error('الدور غير صالح.');

  const result = await query(
    'INSERT INTO users (id, username, password_hash, display_name, code, role_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [nextGeneratedId('USR'), normalizedUsername, bcrypt.hashSync(password, 10), normalizedDisplayName, code || '', role]
  );

  return sanitizeUser(mapUser(result.rows[0]));
}

export async function updateUser(id, { displayName, code, role, password }) {
  await initializeUsersStore();
  const existingUser = await getUserById(id);
  if (!existingUser) throw new Error('المستخدم غير موجود.');
  if (role && !(await getRoleById(role))) throw new Error('الدور غير صالح.');

  const nextDisplayName = displayName !== undefined ? String(displayName || '').trim() : existingUser.displayName;
  if (!nextDisplayName) throw new Error('يرجى إدخال الاسم الظاهر.');

  const result = await query(
    'UPDATE users SET display_name = COALESCE($2, display_name), code = COALESCE($3, code), role_id = COALESCE($4, role_id), password_hash = COALESCE($5, password_hash) WHERE id = $1 RETURNING *',
    [id, nextDisplayName, code !== undefined ? code : existingUser.code, role || existingUser.role, password ? bcrypt.hashSync(password, 10) : undefined]
  );

  return sanitizeUser(mapUser(result.rows[0]));
}

export async function deleteUser(id) {
  await initializeUsersStore();
  const users = await readUsers();
  const existingUser = users.find((user) => user.id === String(id));
  if (!existingUser) throw new Error('المستخدم غير موجود.');
  if (existingUser.role === 'admin' && users.filter((user) => user.role === 'admin').length === 1) {
    throw new Error('لا يمكن حذف آخر مدير للنظام.');
  }

  await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
}

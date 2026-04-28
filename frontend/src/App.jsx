import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

// ─── Auth helpers ────────────────────────────────────────────────
function getStoredAuth() {
  try {
    const raw = localStorage.getItem('asmda_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // basic expiry check (JWT exp is in seconds)
    const payload = JSON.parse(atob(parsed.token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) { localStorage.removeItem('asmda_auth'); return null; }
    return parsed;
  } catch { return null; }
}
function storeAuth(data) { localStorage.setItem('asmda_auth', JSON.stringify(data)); }
function clearAuth() { localStorage.removeItem('asmda_auth'); }
function authHeaders(token) { return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }; }

// ─── Pagination ──────────────────────────────────────────────────
const PAGE_SIZE = 15;
const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100];

function usePagination(items) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(PAGE_SIZE);
  useEffect(() => { setPage(1); }, [items.length]);
  const setPageSize = (size) => { setPageSizeState(size); setPage(1); };
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { page: safePage, setPage, pageItems, totalPages, pageSize, setPageSize };
}

function getPageButtons(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const delta = 2;
  const result = [1];
  const lo = Math.max(2, page - delta);
  const hi = Math.min(totalPages - 1, page + delta);
  if (lo > 2) result.push('...');
  for (let i = lo; i <= hi; i++) result.push(i);
  if (hi < totalPages - 1) result.push('...');
  result.push(totalPages);
  return result;
}

function Pagination({ page, totalPages, onPageChange, pageSize, onPageSizeChange }) {
  const buttons = getPageButtons(page, totalPages);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '14px 0 2px', flexWrap: 'wrap' }} dir="ltr">
      <select
        value={pageSize}
        onChange={e => onPageSizeChange(Number(e.target.value))}
        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer', marginRight: '6px' }}
      >
        {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} / صفحة</option>)}
      </select>
      {totalPages > 1 && <>
        <button type="button" className="ghost-button small" onClick={() => onPageChange(1)} disabled={page <= 1}>«« الأول</button>
        <button type="button" className="ghost-button small" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>‹ السابق</button>
        {buttons.map((b, i) =>
          b === '...'
            ? <span key={`e${i}`} style={{ padding: '0 2px', color: 'var(--text-light)' }}>…</span>
            : <button key={b} type="button" className={b === page ? 'primary-button small' : 'ghost-button small'} onClick={() => onPageChange(b)} style={{ minWidth: '34px' }}>{b}</button>
        )}
        <button type="button" className="ghost-button small" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>التالي ›</button>
        <button type="button" className="ghost-button small" onClick={() => onPageChange(totalPages)} disabled={page >= totalPages}>الأخير »»</button>
      </>}
    </div>
  );
}

// ─── Login Screen ────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'خطأ في تسجيل الدخول'); return; }
      storeAuth(data);
      onLogin(data);
    } catch { setError('تعذر الاتصال بالخادم.'); } finally { setLoading(false); }
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #f4f9f6)', fontFamily: 'inherit' }}>
      <div className="ambient ambient-one" style={{ position: 'fixed' }} />
      <div className="ambient ambient-two" style={{ position: 'fixed' }} />
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px 36px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p className="eyebrow">نظام إدارة أسمدة</p>
          <h2 style={{ margin: '8px 0 0' }}>تسجيل الدخول</h2>
        </div>
        {error && <div className="notice error" style={{ marginBottom: '16px' }}>{error}</div>}
        <form className="form-grid" onSubmit={handleSubmit} style={{ gridTemplateColumns: '1fr' }}>
          <label><span>اسم المستخدم</span><input value={username} onChange={e => setUsername(e.target.value)} required autoFocus autoComplete="username" /></label>
          <label><span>كلمة المرور</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>
          <button type="submit" className="primary-button" disabled={loading} style={{ marginTop: '8px' }}>{loading ? 'جارٍ التحقق...' : 'دخول'}</button>
        </form>
      </div>
    </div>
  );
}

// ─── Users Management Page (admin only) ──────────────────────────
const ROLE_LABELS_FE = { admin: 'مدير النظام', manager: 'مدير', sales: 'مبيعات', warehouse: 'مخازن', accountant: 'محاسب' };
const ROLES_FE = ['admin', 'manager', 'sales', 'warehouse', 'accountant'];

function UsersPage({ token }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', displayName: '', code: '', role: 'sales' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const noticeTimer = useRef(null);

  function showNotice(msg) {
    setNotice(msg);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 5000);
  }

  async function load() {
    const r = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) { const d = await r.json(); setUsers(d.users); setRoles(d.roles); }
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setEditingUser(null); setForm({ username: '', password: '', displayName: '', code: '', role: 'sales' }); setError(''); setFormOpen(true); }
  function openEdit(u) { setEditingUser(u); setForm({ username: u.username, displayName: u.displayName, code: u.code || '', role: u.role, password: '' }); setError(''); setFormOpen(true); }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = editingUser
        ? { displayName: form.displayName, code: form.code, role: form.role, ...(form.password ? { password: form.password } : {}) }
        : { username: form.username, password: form.password, displayName: form.displayName, code: form.code, role: form.role };
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.message || 'خطأ'); return; }
      await load(); setFormOpen(false);
      showNotice(editingUser ? 'تم تعديل المستخدم بنجاح.' : 'تمت إضافة المستخدم بنجاح.');
    } catch { setError('تعذر الاتصال بالخادم.'); } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    setDeleteTarget(null);
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok || res.status === 204) { await load(); showNotice('تم حذف المستخدم.'); }
    else { const d = await res.json().catch(() => ({})); setError(d.message || 'خطأ في الحذف'); }
  }

  const reversedUsers = [...users].reverse();
  const { page: usersPage, setPage: setUsersPage, pageItems: usersPageItems, totalPages: usersTotalPages, pageSize: usersPageSize, setPageSize: setUsersPageSize } = usePagination(reversedUsers);

  return (
    <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
      {notice && <div className="notice success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{notice}</span><button type="button" onClick={() => setNotice('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button></div>}
      {error && <div className="notice error">{error}</div>}
      <article className="card table-card">
        <div className="table-actions-header">
          <div><p className="eyebrow">إدارة النظام</p><h3>المستخدمون والصلاحيات</h3></div>
          <button type="button" className="primary-button" onClick={openAdd}>إضافة مستخدم</button>
        </div>
        <div className="table-list">
          {usersPageItems.map(u => (
            <article key={u.id} className="table-row">
              <div className="table-main">
                <div className="record-top">
                  <strong>{u.displayName}</strong>
                  <span className="status-chip neutral">{u.username}</span>
                  {u.code && <span className="status-chip info">{u.code}</span>}
                  <span className="status-chip calm">{ROLE_LABELS_FE[u.role] ?? u.role}</span>
                </div>
              </div>
              <div className="table-side">
                <div className="row-actions">
                  <button type="button" className="ghost-button small" onClick={() => openEdit(u)}>تعديل</button>
                  <button type="button" className="danger-button small" onClick={() => setDeleteTarget(u.id)}>حذف</button>
                </div>
              </div>
            </article>
          ))}
          {users.length === 0 && <p className="empty-notice">لا يوجد مستخدمون.</p>}
        </div>
        <Pagination page={usersPage} totalPages={usersTotalPages} onPageChange={setUsersPage} pageSize={usersPageSize} onPageSizeChange={setUsersPageSize} />
      </article>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}>
        {error && <div className="notice error" style={{ marginBottom: '12px' }}>{error}</div>}
        <form className="form-grid" onSubmit={handleSubmit}>
          <label><span>الاسم الظاهر</span><input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} required /></label>
          <label><span>كود المستخدم</span><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="مثال: EMP-001" /></label>
          <label><span>اسم المستخدم</span><input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required={!editingUser} disabled={!!editingUser} /></label>
          <label><span>{editingUser ? 'كلمة مرور جديدة (اتركها فارغة للإبقاء)' : 'كلمة المرور'}</span><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editingUser} autoComplete="new-password" /></label>
          <label><span>الدور</span>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
          <div className="form-actions full-width" style={{ marginTop: '16px' }}>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? 'جارٍ الحفظ...' : editingUser ? 'حفظ التعديل' : 'إضافة'}</button>
            <button type="button" className="ghost-button" onClick={() => setFormOpen(false)}>إلغاء</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => handleDelete(deleteTarget)} title="حذف مستخدم" message="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع." />
    </section>
  );
}

function RepsPage({ token }) {
  const [reps, setReps] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRep, setEditingRep] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', displayName: '', code: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const noticeTimer = useRef(null);

  function showNotice(message) {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 5000);
  }

  async function load() {
    const response = await fetch('/api/reps', { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) {
      setReps(await response.json());
      return;
    }
    const data = await response.json().catch(() => ({}));
    setError(data.message || 'تعذر تحميل بيانات المناديب.');
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditingRep(null);
    setForm({ username: '', password: '', displayName: '', code: '' });
    setError('');
    setFormOpen(true);
  }

  function openEdit(rep) {
    setEditingRep(rep);
    setForm({ username: rep.username, password: '', displayName: rep.displayName, code: rep.code || '' });
    setError('');
    setFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = editingRep
        ? { displayName: form.displayName, code: form.code, ...(form.password ? { password: form.password } : {}) }
        : { username: form.username, password: form.password, displayName: form.displayName, code: form.code };
      const url = editingRep ? `/api/reps/${editingRep.id}` : '/api/reps';
      const method = editingRep ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || 'تعذر حفظ المندوب.');
        return;
      }
      await load();
      setFormOpen(false);
      showNotice(editingRep ? 'تم تعديل بيانات المندوب.' : 'تمت إضافة المندوب بنجاح.');
    } catch {
      setError('تعذر الاتصال بالخادم.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeleteTarget(null);
    const response = await fetch(`/api/reps/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (response.ok || response.status === 204) {
      await load();
      showNotice('تم حذف المندوب.');
      return;
    }
    const data = await response.json().catch(() => ({}));
    setError(data.message || 'تعذر حذف المندوب.');
  }

  const reversedReps = [...reps].reverse();
  const { page: repsPage, setPage: setRepsPage, pageItems: repsPageItems, totalPages: repsTotalPages, pageSize: repsPageSize, setPageSize: setRepsPageSize } = usePagination(reversedReps);

  return (
    <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
      {notice ? (
        <div className="notice success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>
      ) : null}
      {error ? <div className="notice error">{error}</div> : null}

      <article className="card table-card">
        <div className="table-actions-header">
          <div>
            <p className="eyebrow">المناديب</p>
            <h3>إضافة وإدارة المناديب</h3>
          </div>
          <button type="button" className="primary-button" onClick={openAdd}>إضافة مندوب</button>
        </div>

        <div className="table-list">
          {repsPageItems.map((rep) => (
            <article key={rep.id} className="table-row">
              <div className="table-main">
                <div className="record-top">
                  <strong>{rep.displayName}</strong>
                  <span className="status-chip neutral">{rep.username}</span>
                  {rep.code ? <span className="status-chip info">{rep.code}</span> : null}
                </div>
              </div>
              <div className="table-side">
                <div className="row-actions">
                  <button type="button" className="ghost-button small" onClick={() => openEdit(rep)}>تعديل</button>
                  <button type="button" className="danger-button small" onClick={() => setDeleteTarget(rep.id)}>حذف</button>
                </div>
              </div>
            </article>
          ))}
          {reps.length === 0 ? <p className="empty-notice">لا يوجد مناديب حتى الآن.</p> : null}
        </div>
        <Pagination page={repsPage} totalPages={repsTotalPages} onPageChange={setRepsPage} pageSize={repsPageSize} onPageSizeChange={setRepsPageSize} />
      </article>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingRep ? 'تعديل مندوب' : 'إضافة مندوب جديد'}>
        {error ? <div className="notice error" style={{ marginBottom: '12px' }}>{error}</div> : null}
        <form className="form-grid" onSubmit={handleSubmit}>
          <label><span>الاسم الظاهر</span><input value={form.displayName} onChange={(e) => setForm((current) => ({ ...current, displayName: e.target.value }))} required /></label>
          <label><span>كود المندوب</span><input value={form.code} onChange={(e) => setForm((current) => ({ ...current, code: e.target.value }))} placeholder="مثال: REP-001" /></label>
          <label><span>اسم المستخدم</span><input value={form.username} onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))} required={!editingRep} disabled={!!editingRep} /></label>
          <label><span>{editingRep ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}</span><input type="password" value={form.password} onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))} required={!editingRep} autoComplete="new-password" /></label>
          <div className="form-actions full-width" style={{ marginTop: '16px' }}>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? 'جارٍ الحفظ...' : editingRep ? 'حفظ التعديل' : 'إضافة'}</button>
            <button type="button" className="ghost-button" onClick={() => setFormOpen(false)}>إلغاء</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => handleDelete(deleteTarget)} title="حذف مندوب" message="هل أنت متأكد من حذف هذا المندوب؟ لا يمكن التراجع." />
    </section>
  );
}

// ── Roles Management Page ────────────────────────────────────────────────────
function RolesPage({ token }) {
  const [roles, setRoles] = useState([]);
  const [pages, setPages] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [localPages, setLocalPages] = useState([]);
  const [localLabel, setLocalLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ label: '', pages: [] });
  const [newSaving, setNewSaving] = useState(false);
  const [newError, setNewError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  function showNotice(msg) {
    setNotice(msg);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 5000);
  }

  async function load(keepSelected) {
    const r = await fetch('/api/roles', { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return;
    const d = await r.json();
    setRoles(d.roles);
    setPages(d.pages);
    if (keepSelected) {
      const found = d.roles.find(r => r.id === keepSelected);
      if (found) {
        setLocalLabel(found.label);
        setLocalPages(found.pages === '*' ? [] : [...(found.pages ?? [])]);
      }
    }
  }

  useEffect(() => { load(); }, []);

  function handleSelectRole(id) {
    setSelectedRoleId(id);
    setSaveError('');
    const role = roles.find(r => r.id === id);
    if (!role) { setLocalPages([]); setLocalLabel(''); return; }
    setLocalLabel(role.label);
    setLocalPages(role.pages === '*' ? [] : [...(role.pages ?? [])]);
  }

  const selectedRole = roles.find(r => r.id === selectedRoleId) ?? null;
  const isAdminRole = selectedRole?.pages === '*';

  function togglePage(pageId) {
    setLocalPages(prev =>
      prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]
    );
  }

  function selectAll() { setLocalPages(pages.map(p => p.id)); }
  function clearAll()  { setLocalPages([]); }

  async function handleSave() {
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(`/api/roles/${selectedRoleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: localLabel, pages: localPages }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setSaveError(d.message || 'خطأ'); return; }
      showNotice('تم حفظ الصلاحيات بنجاح.');
      load(selectedRoleId);
    } catch { setSaveError('تعذر الاتصال بالخادم.'); }
    finally { setSaving(false); }
  }

  async function handleCreateRole(e) {
    e.preventDefault(); setNewSaving(true); setNewError('');
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newForm),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setNewError(d.message || 'خطأ'); return; }
      setNewOpen(false); setNewForm({ label: '', pages: [] });
      showNotice('تم إنشاء الدور بنجاح.');
      await load();
      setSelectedRoleId(d.id);
      setLocalLabel(d.label);
      setLocalPages([...(d.pages ?? [])]);
    } catch { setNewError('تعذر الاتصال بالخادم.'); }
    finally { setNewSaving(false); }
  }

  async function handleDeleteRole() {
    const id = deleteTarget; setDeleteTarget(null);
    const res = await fetch(`/api/roles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok || res.status === 204) {
      showNotice('تم حذف الدور.');
      setSelectedRoleId(''); setLocalPages([]); setLocalLabel('');
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setSaveError(d.message || 'خطأ في الحذف');
    }
  }

  function toggleNewPage(pageId) {
    setNewForm(f => ({
      ...f,
      pages: f.pages.includes(pageId) ? f.pages.filter(p => p !== pageId) : [...f.pages, pageId],
    }));
  }

  const chipStyle = (checked) => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
    borderRadius: '8px',
    background: checked ? 'var(--accent-light, #e8f4e8)' : 'var(--row-bg, #f9f9f9)',
    border: `1px solid ${checked ? 'var(--success, #4caf50)' : 'var(--border, #ddd)'}`,
    cursor: 'pointer', userSelect: 'none', fontSize: '0.9rem', transition: 'all .15s',
  });

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '10px',
    marginTop: '16px',
  };

  return (
    <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
      {notice && (
        <div className="notice success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>
      )}

      <article className="card table-card">
        <div className="table-actions-header">
          <div><p className="eyebrow">إدارة النظام</p><h3>الأدوار والصلاحيات</h3></div>
          <button type="button" className="primary-button" onClick={() => { setNewForm({ label: '', pages: [] }); setNewError(''); setNewOpen(true); }}>+ دور جديد</button>
        </div>

        {/* Role selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>اختر الدور:</label>
          <select
            value={selectedRoleId}
            onChange={e => handleSelectRole(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border, #ccc)', fontSize: '0.95rem', minWidth: '200px' }}
          >
            <option value="">-- اختر دوراً --</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Permissions panel */}
        {selectedRole && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isAdminRole ? (
                  <strong style={{ fontSize: '1rem' }}>{selectedRole.label}</strong>
                ) : (
                  <input
                    value={localLabel}
                    onChange={e => setLocalLabel(e.target.value)}
                    style={{ fontWeight: 700, fontSize: '1rem', border: '1px solid var(--border, #ccc)', borderRadius: '6px', padding: '5px 10px' }}
                    placeholder="اسم الدور"
                  />
                )}
                {selectedRole.isSystem && <span className="status-chip info" style={{ fontSize: '0.75rem' }}>نظامي</span>}
                {isAdminRole && <span className="status-chip calm" style={{ fontSize: '0.78rem' }}>وصول كامل</span>}
              </div>

              {!isAdminRole && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="ghost-button small" onClick={selectAll}>تحديد الكل</button>
                  <button type="button" className="ghost-button small" onClick={clearAll}>إلغاء الكل</button>
                  <button type="button" className="primary-button small" disabled={saving} onClick={handleSave}>
                    {saving ? 'جارٍ الحفظ...' : 'حفظ الصلاحيات'}
                  </button>
                  {!selectedRole.isSystem && (
                    <button type="button" className="danger-button small" onClick={() => setDeleteTarget(selectedRoleId)}>حذف الدور</button>
                  )}
                </div>
              )}
            </div>

            {saveError && <div className="notice error" style={{ marginBottom: '10px' }}>{saveError}</div>}

            {isAdminRole ? (
              <p style={{ color: 'var(--muted, #888)', fontSize: '0.9rem', marginTop: '8px' }}>مدير النظام يملك صلاحية الوصول لجميع الصفحات تلقائياً ولا يمكن تعديلها.</p>
            ) : (
              <div style={gridStyle}>
                {pages.map(page => {
                  const checked = localPages.includes(page.id);
                  return (
                    <label key={page.id} style={chipStyle(checked)} onClick={() => togglePage(page.id)}>
                      <input type="checkbox" checked={checked} onChange={() => {}} style={{ accentColor: 'var(--success, #4caf50)', width: '16px', height: '16px' }} />
                      {page.label}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!selectedRole && roles.length > 0 && (
          <p style={{ color: 'var(--muted, #888)', marginTop: '24px', fontSize: '0.9rem' }}>اختر دوراً من القائمة أعلاه لعرض وتعديل صلاحياته.</p>
        )}
        {roles.length === 0 && <p className="empty-notice">جارٍ التحميل...</p>}
      </article>

      {/* New Role Modal */}
      <Modal isOpen={newOpen} onClose={() => setNewOpen(false)} title="إنشاء دور جديد">
        {newError && <div className="notice error" style={{ marginBottom: '12px' }}>{newError}</div>}
        <form onSubmit={handleCreateRole}>
          <label style={{ display: 'block', marginBottom: '16px' }}>
            <span style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>اسم الدور</span>
            <input value={newForm.label} onChange={e => setNewForm(f => ({ ...f, label: e.target.value }))} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border, #ccc)' }} placeholder="مثال: محرر" />
          </label>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>الصفحات المسموح بها (اختياري)</p>
          <div style={{ ...gridStyle, maxHeight: '280px', overflowY: 'auto' }}>
            {pages.map(page => {
              const checked = newForm.pages.includes(page.id);
              return (
                <label key={page.id} style={chipStyle(checked)} onClick={() => toggleNewPage(page.id)}>
                  <input type="checkbox" checked={checked} onChange={() => {}} style={{ accentColor: 'var(--success, #4caf50)', width: '16px', height: '16px' }} />
                  {page.label}
                </label>
              );
            })}
          </div>
          <div className="form-actions full-width" style={{ marginTop: '20px' }}>
            <button type="submit" className="primary-button" disabled={newSaving}>{newSaving ? 'جارٍ...' : 'إنشاء الدور'}</button>
            <button type="button" className="ghost-button" onClick={() => setNewOpen(false)}>إلغاء</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteRole} title="حذف دور" message="هل أنت متأكد من حذف هذا الدور؟ تأكد أنه غير مرتبط بأي مستخدم." />
    </section>
  );
}


function genId() { return String(_nextId++); }
let _nextId = 1;
const views = [
  'dashboard',
  'notifications',
  'users',
  'roles',
  'reps-management',
  'product-cards',
  'final-product-store',
  'raw-materials-packaging-store',
  'raw-materials-catalog',
  'suppliers',
  'rep-sub-stores',
  'financial-manager-custody',
  'raw-materials-purchases',
  'machine-maintenance-purchases',
  'misc-purchases',
  'payroll-advances',
  'sales',
  'checks',
  'returns',
  'customer-payment-alerts',
  'free-samples',
  'credit-sales',
  'price-list',
  'custodies',
  'statement'
];

const navigation = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    helper: 'الملخص العام'
  },
  {
    id: 'product-cards',
    label: 'كبون الأصناف',
    helper: 'إدارة قائمة المنتجات المعتمدة'
  },
  {
    id: 'final-product-store',
    label: 'مخزن منتج نهائي',
    helper: 'متابعة أرصدة المنتج النهائي'
  },
  {
    id: 'raw-materials-packaging-store',
    label: 'مخزن خامات وتعبئة وتغليف',
    helper: 'إدارة خامات التشغيل والتغليف'
  },
  {
    id: 'raw-materials-catalog',
    label: 'تسجيل الخامات',
    helper: 'إدارة أسماء الخامات المستخدمة في الشراء'
  },
  {
    id: 'suppliers',
    label: 'تسجيل الموردين',
    helper: 'إدارة أسماء الموردين المعتمدين'
  },
  {
    id: 'rep-sub-stores',
    label: 'مخازن فرعية للمناديب',
    helper: 'متابعة العهد والمخزون لدى المناديب'
  },
  {
    id: 'reps-management',
    label: 'إضافة وإدارة المناديب',
    helper: 'إدارة حسابات المناديب وصلاحيات الدخول'
  },
  {
    id: 'financial-manager-custody',
    label: 'عهدة المدير المالي',
    helper: 'توزيع عهد الموظفين من عهدة المدير المالي'
  },
  {
    id: 'custodies',
    label: 'عهد الموظفين',
    helper: 'عهدات الموظفين المخصصة من المدير المالي'
  },
  {
    id: 'raw-materials-purchases',
    label: 'مشتريات خامات',
    helper: 'تسجيل ومراجعة مشتريات الخامات'
  },
  {
    id: 'machine-maintenance-purchases',
    label: 'مشتريات صيانة مكن',
    helper: 'متابعة تكاليف الصيانة وقطع الغيار'
  },
  {
    id: 'misc-purchases',
    label: 'مشتريات نثرية',
    helper: 'إدارة المصروفات النثرية اليومية'
  },
  {
    id: 'payroll-advances',
    label: 'رواتب وسلف',
    helper: 'متابعة الرواتب والسلف الشهرية'
  },
  {
    id: 'sales',
    label: 'فاتورة مبيعات',
    helper: 'إدارة فواتير البيع النقدي'
  },
  {
    id: 'checks',
    label: 'تحصيل',
    helper: 'إدارة التحصيل ومواعيد الشيكات'
  },
  {
    id: 'returns',
    label: 'مرتجع يتم رده لمخزن المندوب المسؤول',
    helper: 'إدارة المرتجعات وإثبات الإرجاع'
  },
  {
    id: 'customer-payment-alerts',
    label: 'تنبيه بمواعيد الدفع الخاصة بالعملاء',
    helper: 'متابعة تنبيهات الاستحقاق والتحصيل'
  },
  {
    id: 'free-samples',
    label: 'احتساب العينات المجانية',
    helper: 'متابعة العينات المجانية المصروفة للعملاء'
  },
  {
    id: 'credit-sales',
    label: 'مبيعات الآجل',
    helper: 'إدارة التحصيل والاستحقاق'
  },
  {
    id: 'price-list',
    label: 'قائمة اسعار',
    helper: 'إدارة المنتجات وتسعيرها'
  },
  {
    id: 'statement',
    label: 'كشف حساب',
    helper: 'استعراض حركة العميل ورصيده'
  }
];

const navigationGroups = [
  {
    id: 'overview',
    label: 'عام',
    items: ['dashboard', 'notifications']
  },
  {
    id: 'catalog-and-stores',
    label: 'الأصناف والمخازن',
    items: ['product-cards', 'final-product-store', 'raw-materials-packaging-store', 'raw-materials-catalog', 'suppliers', 'rep-sub-stores']
  },
  {
    id: 'custodies-and-purchases',
    label: 'العهد والمشتريات',
    items: ['financial-manager-custody', 'custodies', 'raw-materials-purchases', 'machine-maintenance-purchases', 'misc-purchases', 'payroll-advances']
  },
  {
    id: 'sales-and-collection',
    label: 'المبيعات والتحصيل',
    items: ['sales', 'checks', 'returns', 'customer-payment-alerts', 'free-samples', 'credit-sales', 'price-list', 'statement']
  },
  {
    id: 'administration',
    label: 'إدارة النظام',
    items: ['reps-management', 'users', 'roles']
  }
];

const navigationGroupByItemId = navigationGroups.reduce((acc, group) => {
  group.items.forEach((itemId) => {
    acc[itemId] = group.id;
  });
  return acc;
}, {});

const placeholderModuleConfig = {};

const salesStatuses = ['جديدة', 'قيد التنفيذ', 'مكتملة'];
const creditStatuses = ['مستحقة', 'مسدد جزئيا', 'متأخرة', 'مسددة'];
const returnStatuses = ['قيد المراجعة', 'مستلمة', 'تم التعويض', 'مرفوضة'];
const custodyStatuses = ['نشطة', 'مغلقة'];
const custodyTypes = ['نقدية', 'عينية'];
const transactionTypes = ['صرف', 'استعاضة', 'تسوية', 'إرجاع عهدة'];
const checkStatuses = ['معلق', 'محصّل', 'مرتجع'];
const storeStatuses = ['متوفر', 'منخفض', 'نفد'];
const repStoreStatuses = ['مسلّم', 'مسترد', 'قيد التسليم'];
const payrollTypes = ['راتب', 'سلفة'];
const payrollStatuses = ['معلق', 'مدفوع', 'مسترد جزئياً'];
const alertTypes = ['فاتورة آجل', 'شيك', 'أخرى'];
const alertStatuses = ['قادم', 'متأخر', 'تم السداد'];

const initialDashboard = {
  meta: null,
  brand: null,
  summary: [],
  alerts: [],
  recentSales: [],
  recentCreditSales: []
};

const initialSales = {
  overview: [],
  items: []
};

const initialCreditSales = {
  overview: [],
  items: []
};

const initialReturns = {
  overview: [],
  items: []
};

const initialPriceList = {
  overview: [],
  items: []
};

const initialCustodies = {
  overview: [],
  items: []
};

const initialStatement = {
  customerName: '',
  summary: [],
  entries: []
};

const initialChecks = {
  overview: [],
  items: []
};

const initialCashReceipts = { overview: [], items: [] };

const initialCheckForm = {
  customerName: '',
  checkNumber: '',
  bankName: '',
  amount: '',
  collectionDate: '',
  status: 'معلق',
  notes: ''
};

const initialCashForm = {
  customerName: '',
  amount: '',
  receiptDate: '',
  notes: ''
};

const initialProductCards = { overview: [], items: [] };
const initialProductCardForm = { productName: '', category: '', unit: 'قطعة', code: '', notes: '' };

const initialFinalProductStore = { overview: [], items: [] };
const initialRawMaterialsStore = { overview: [], items: [] };
const initialRepSubStores = { overview: [], items: [] };
const initialFinManagerCustody = { overview: [], items: [] };
const initialRawPurchases = { overview: [], items: [] };
const initialRawMaterialsCatalog = { overview: [], items: [] };
const initialSuppliers = { overview: [], items: [] };
const initialMachinePurchases = { overview: [], items: [] };
const initialMiscPurchases = { overview: [], items: [] };
const initialPayrollAdvances = { overview: [], items: [] };
const initialPaymentAlerts = { overview: [], items: [] };
const initialFreeSamples = { overview: [], items: [] };

const initialFinalProductForm = { productName: '', category: '', quantity: '', unit: 'قطعة', minStock: '', status: 'متوفر', notes: '' };
const initialRawMaterialForm = { materialName: '', category: '', quantity: '', unit: 'كجم', minStock: '', status: 'متوفر', notes: '' };
const initialRepSubStoreForm = { repName: '', productName: '', quantity: '', deliveryDate: '', status: 'مسلّم', notes: '' };
const initialFinManagerCustodyForm = { employeeName: '', amount: '', purpose: '', custodyDate: '', status: 'نشطة', notes: '' };
const initialRawPurchaseForm = { supplierName: '', materialName: '', quantity: '', unitPrice: '', purchaseDate: '', invoiceNumber: '', notes: '' };
const initialRawMaterialCatalogForm = { name: '', category: '', notes: '' };
const initialSupplierForm = { name: '', notes: '' };
const initialMachinePurchaseForm = { supplierName: '', description: '', amount: '', purchaseDate: '', machineName: '', invoiceNumber: '', notes: '' };
const initialMiscPurchaseForm = { description: '', amount: '', category: '', purchaseDate: '', receiptNumber: '', notes: '' };
const initialPayrollAdvanceForm = { employeeName: '', type: 'راتب', amount: '', month: '', status: 'معلق', notes: '' };
const initialPaymentAlertForm = { customerName: '', amount: '', dueDate: '', alertType: 'فاتورة آجل', status: 'قادم', notes: '' };
const initialFreeSampleForm = { customerName: '', productName: '', quantity: '1', unit: 'قطعة', unitPrice: '', reason: '', sampleDate: '', notes: '' };

const initialSalesForm = {
  customerName: '',
  productName: '',
  amount: '',
  status: 'جديدة',
  salesRep: '',
  saleDate: '',
  notes: ''
};

const initialCreditForm = {
  customerName: '',
  invoiceNumber: '',
  amount: '',
  paidAmount: '',
  status: 'مستحقة',
  salesRep: '',
  dueDate: '',
  notes: ''
};

const initialReturnsForm = {
  customerName: '',
  productName: '',
  originalInvoiceNumber: '',
  amount: '',
  reason: '',
  status: 'قيد المراجعة',
  salesRep: '',
  returnDate: '',
  notes: ''
};

const initialPriceListForm = {
  productName: '',
  category: '',
  purchasePrice: '',
  sellingPrice: '',
  notes: ''
};

const initialCustodyForm = {
  employeeName: '',
  custodyType: 'نقدية',
  itemDetails: '',
  initialAmount: '',
  startDate: '',
  status: 'نشطة',
  notes: ''
};

const initialTransactionForm = {
  transactionType: 'صرف',
  amount: '',
  date: '',
  notes: ''
};

function buildUrl() { return ''; }

function getInitialView() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  return views.includes(hash) ? hash : 'dashboard';
}

function formatMoney(value) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0
  }).format(Number(value ?? 0));
}

function formatMetricValue(item) {
  if (item.type === 'currency') {
    return formatMoney(item.value);
  }

  if (item.type === 'percent') {
    return `${item.value}%`;
  }

  return new Intl.NumberFormat('ar-EG').format(Number(item.value ?? 0));
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

function getTodayLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLoggedInEmail() {
  const fallbackEmail = 'user@example.com';

  if (typeof window === 'undefined') {
    return fallbackEmail;
  }

  const directKeys = ['userEmail', 'email', 'loginEmail', 'authEmail', 'currentUserEmail'];
  for (const key of directKeys) {
    const value = window.localStorage.getItem(key);
    if (value && value.includes('@')) {
      return value;
    }
  }

  const objectKeys = ['user', 'currentUser', 'authUser'];
  for (const key of objectKeys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.email && parsed.email.includes('@')) {
        return parsed.email;
      }
    } catch {
      // Ignore invalid JSON values in storage and continue fallback search.
    }
  }

  return fallbackEmail;
}

function getDashboardTone(tone) {
  if (tone === 'alert') {
    return 'danger';
  }

  if (tone === 'warning') {
    return 'warning';
  }

  if (tone === 'calm') {
    return 'calm';
  }

  if (tone === 'neutral') {
    return 'neutral';
  }

  return 'accent';
}

function getStatusTone(status) {
  if (status === 'مكتملة' || status === 'مسددة') {
    return 'success';
  }

  if (status === 'متأخرة') {
    return 'danger';
  }

  if (status === 'قيد التنفيذ' || status === 'مسدد جزئيا' || status === 'مستحقة') {
    return 'warning';
  }

  return 'info';
}

function getCheckStatusTone(status) {
  if (status === 'محصّل') return 'success';
  if (status === 'مرتجع') return 'danger';
  return 'warning';
}

function Modal({ isOpen, onClose, title, children, errorMessage = '' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <div className="section-head" style={{ marginBottom: '24px' }}>
          <div>
            <h3>{title}</h3>
          </div>
        </div>
        {errorMessage ? <section className="notice error" style={{ marginBottom: '16px' }}>{errorMessage}</section> : null}
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <div className="section-head">
          <h3>{title}</h3>
        </div>
        <p style={{ marginBottom: '28px', fontSize: '1.05rem', color: 'var(--muted)' }}>
          {message}
        </p>
        <div className="row-actions" style={{ justifyContent: 'center' }}>
          <button type="button" className="ghost-button" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" className="danger-button" onClick={onConfirm}>
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCards({ items }) {
  return (
    <section className="summary-grid">
      {items.map((item) => (
        <article key={item.id} className="summary-card card">
          <span className="summary-label">{item.label}</span>
          <strong className="summary-value">{formatMetricValue(item)}</strong>
          <span className={`summary-helper ${getDashboardTone(item.tone)}`}>{item.helper}</span>
        </article>
      ))}
    </section>
  );
}

function PlaceholderModuleView({ title, description }) {
  return (
    <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
      <article className="card panel-card" style={{ padding: '28px' }}>
        <div className="section-head">
          <div>
            <p className="eyebrow">صفحة جديدة</p>
            <h3>{title}</h3>
          </div>
        </div>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8 }}>{description}</p>
      </article>
    </section>
  );
}

function GenericCrudView({ data, eyebrow, headline, addLabel, emptyLabel, renderRow, form, editingId, saving, isFormOpen, onOpenForm, onCloseForm, onSubmit, formTitle, formFields, onBack, extraActions, addDisabled = false, addDisabledHint = '', addDisabledTitle = '', formError = '' }) {
  const reversedItems = [...(data.items || [])].reverse();
  const { page, setPage, pageItems, totalPages, pageSize, setPageSize } = usePagination(reversedItems);
  return (
    <>
      <SummaryCards items={data.overview} />
      <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
        <article className="card table-card">
          <div className="table-actions-header">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h3>{headline}</h3>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {extraActions}
              {addDisabled && addDisabledHint ? <span style={{ color: 'var(--muted)', fontSize: '0.86rem' }}>{addDisabledHint}</span> : null}
              <button type="button" className="primary-button" onClick={onOpenForm} disabled={addDisabled} title={addDisabled ? addDisabledTitle : undefined}>{addLabel}</button>
              {onBack && (
                <button type="button" className="ghost-button" onClick={onBack}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ marginInlineEnd: '4px' }}><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  رجوع
                </button>
              )}
            </div>
          </div>
          <div className="table-list">
            {pageItems.map(renderRow)}
            {data.items.length === 0 && <p className="empty-notice">{emptyLabel}</p>}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
        </article>
      </section>
      <Modal isOpen={isFormOpen} onClose={onCloseForm} title={editingId ? `تعديل ${formTitle}` : `إضافة ${formTitle}`} errorMessage={formError}>
        <form className="form-grid" onSubmit={onSubmit}>
          {formFields}
          <div className="form-actions full-width" style={{ marginTop: '16px' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديل' : `إضافة ${formTitle}`}
            </button>
            <button type="button" className="ghost-button" onClick={onCloseForm}>إلغاء</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function StatementView({
  statement,
  customers,
  onCustomerChange,
  onPrint
}) {
  return (
    <>
      <section className="dashboard-grid statement-layout" style={{ gridTemplateColumns: '340px minmax(0, 1fr)' }}>
        <article className="card panel-card statement-sidebar">
          <div className="section-head">
            <div>
              <p className="eyebrow">اختيار العميل</p>
              <h3>تحميل كشف الحساب</h3>
            </div>
          </div>

          <div className="statement-controls">
            <label>
              <span>اسم العميل</span>
              <select value={statement.customerName} onChange={onCustomerChange}>
                <option value="">اختر عميلًا</option>
                {customers.map((customer) => (
                  <option key={customer} value={customer}>
                    {customer}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="primary-button statement-print-button"
              onClick={onPrint}
              disabled={!statement.customerName}
            >
              طباعة الكشف
            </button>

            <div className="statement-help">
              <strong>ملاحظة</strong>
              <p>تم تعديل تنسيق الصفحة ليقترب من نموذج التقرير المرفق: عنوان علوي ثابت، اسم العميل أسفل العنوان، وجدول حركات بتنسيق تقريري.</p>
            </div>
          </div>
        </article>

        <article className="statement-report-paper">
          <header className="statement-report-header">
            <h1>Customer Detailed Sales Report</h1>
            <h2>
              <span>Customer :</span>
              <strong>{statement.customerName || '........'}</strong>
            </h2>
          </header>

          {statement.customerName ? (
            <div className="statement-report-meta">
              <span>عدد الحركات: {statement.entries.length}</span>
              <span>تاريخ الإصدار: {formatDate(new Date().toISOString())}</span>
              <span>الرصيد الحالي: {formatMoney(statement.summary.find((item) => item.id === 'statement-balance')?.value ?? 0)}</span>
            </div>
          ) : null}

          {statement.customerName ? (
            <div className="statement-table-wrapper statement-report-table-wrapper">
              <table className="statement-table statement-report-table">
                <thead>
                  <tr>
                    <th>Adl</th>
                    <th>Discount</th>
                    <th>الرصيد</th>
                    <th>مدين</th>
                    <th>دائن</th>
                    <th>صافي الإجمالي</th>
                    <th>المجموع</th>
                    <th>سعر</th>
                    <th>كمية</th>
                    <th>وصف</th>
                    <th>Delivery Address</th>
                    <th>نوع المعاملة</th>
                    <th>رقم المرجع</th>
                    <th>مسلسل</th>
                    <th>تاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.entries.map((entry, index) => (
                    <tr key={entry.id}>
                      <td>{entry.adjustment > 0 ? new Intl.NumberFormat('en-US').format(entry.adjustment) : '0'}</td>
                      <td>{entry.discount > 0 ? new Intl.NumberFormat('en-US').format(entry.discount) : '0'}</td>
                      <td className="statement-balance-cell">
                        <strong>{new Intl.NumberFormat('en-US').format(entry.balance)}</strong>
                        <span>{entry.balance >= 0 ? 'DR' : 'CR'}</span>
                      </td>
                      <td>{entry.debit > 0 ? new Intl.NumberFormat('en-US').format(entry.debit) : '0'}</td>
                      <td>{entry.credit > 0 ? new Intl.NumberFormat('en-US').format(entry.credit) : '0'}</td>
                      <td>{new Intl.NumberFormat('en-US').format(entry.netTotal)}</td>
                      <td>{new Intl.NumberFormat('en-US').format(entry.total)}</td>
                      <td>{entry.price > 0 ? new Intl.NumberFormat('en-US').format(entry.price) : ''}</td>
                      <td>{entry.quantity || ''}</td>
                      <td>
                        <div className="statement-cell-title">{entry.description}</div>
                        {entry.notes ? <div className="statement-cell-note">{entry.notes}</div> : null}
                      </td>
                      <td>{entry.deliveryAddress || ''}</td>
                      <td>{entry.transactionType}</td>
                      <td>{entry.reference || ''}</td>
                      <td>{entry.sequence || index + 1}</td>
                      <td>{entry.reportDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <section className="notice statement-empty statement-empty-paper">
              اختر اسم عميل من القائمة ليتم تحميل كشف الحساب مباشرة.
            </section>
          )}
        </article>
      </section>
    </>
  );
}

function DbModeSwitch({ token }) {
  const [mode, setMode] = useState(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetch('/api/db-mode', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.mode) setMode(data.mode); })
      .catch(() => {});
  }, [token]);

  async function toggle() {
    const next = mode === 'local' ? 'cloud' : 'local';
    setSwitching(true);
    try {
      const r = await fetch('/api/db-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode: next })
      });
      if (r.ok) {
        const data = await r.json();
        setMode(data.mode);
      }
    } finally {
      setSwitching(false);
    }
  }

  if (!mode) return null;

  const isCloud = mode === 'cloud';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: isCloud ? '#e8f5e9' : '#fff3e0', borderRadius: '12px', border: `1px solid ${isCloud ? '#a5d6a7' : '#ffcc80'}`, marginTop: '16px', flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: isCloud ? '#2e7d32' : '#e65100' }}>
        {isCloud ? '☁ Neon Cloud Database' : '💾 Local Mode (بيانات مؤقتة)'}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={switching}
        style={{ marginRight: 'auto', padding: '6px 18px', borderRadius: '20px', border: 'none', cursor: switching ? 'not-allowed' : 'pointer', background: isCloud ? '#2e7d32' : '#e65100', color: '#fff', fontWeight: 600, fontSize: '0.85rem', opacity: switching ? 0.6 : 1 }}
      >
        {switching ? 'جارٍ التبديل...' : isCloud ? 'التبديل إلى المحلي' : 'التبديل إلى Cloud'}
      </button>
    </div>
  );
}

function DashboardView({ dashboard, onNavigate, activeView, token, isAdmin }) {
  const { meta, brand, summary, alerts, recentSales, recentCreditSales } = dashboard;
  const quickLinks = navigation;
  const heroButtonLabels = {
    dashboard: 'لوحة التحكم',
    sales: brand?.primaryAction ?? 'فتح صفحة المبيعات',
    'credit-sales': brand?.secondaryAction ?? 'فتح صفحة مبيعات الآجل',
    returns: 'إدارة المرتجعات',
    'price-list': 'فتح قائمة الأسعار',
    custodies: 'فتح صفحة العهد',
    statement: 'فتح كشف حساب'
  };

  return (
    <>
      <section className="hero-grid">
        <article className="hero-card card">

          <p className="hero-copy">
            {brand?.description ??
              'واجهة موحدة لعرض المؤشرات السريعة وآخر السجلات المهمة والتنبيهات التي تحتاج متابعة.'}
          </p>

          <div className="hero-actions">
            {quickLinks.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === (activeView ?? 'dashboard') ? 'primary-button' : 'ghost-button'}
                onClick={() => onNavigate(item.id)}
              >
                {heroButtonLabels[item.id] ?? item.label}
              </button>
            ))}
          </div>

          <div className="hero-runtime">
            <span className="hero-runtime-label">حالة البيئة</span>
            <strong>{meta?.message ?? 'جارٍ تجهيز البيانات المحلية.'}</strong>
          </div>
          {isAdmin && <DbModeSwitch token={token} />}
        </article>

      </section>

      <SummaryCards items={summary} />

      <section className="dashboard-grid">
        <article className="card panel-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">آخر المبيعات</p>
              <h3>عمليات البيع الحديثة</h3>
            </div>
          </div>

          <div className="records-list">
            {recentSales.map((item) => (
              <article key={item.id} className="record-row">
                <div>
                  <div className="record-top">
                    <strong>{item.customerName}</strong>
                    <span className={`status-chip ${getStatusTone(item.status)}`}>{item.status}</span>
                  </div>
                  <p>{item.productName}</p>
                </div>
                <div className="record-meta">
                  <strong>{formatMoney(item.amount)}</strong>
                  <span>{formatDate(item.saleDate)}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="card panel-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">آخر مبيعات الآجل</p>
              <h3>الفواتير المفتوحة</h3>
            </div>
          </div>

          <div className="records-list">
            {recentCreditSales.map((item) => (
              <article key={item.id} className="record-row">
                <div>
                  <div className="record-top">
                    <strong>{item.customerName}</strong>
                    <span className={`status-chip ${getStatusTone(item.status)}`}>{item.status}</span>
                  </div>
                  <p>{item.invoiceNumber}</p>
                </div>
                <div className="record-meta">
                  <strong>{formatMoney(item.remainingAmount)}</strong>
                  <span>{formatDate(item.dueDate)}</span>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="alerts-grid">
        {alerts.map((alert) => (
          <article key={alert.title} className={`alert-card card ${alert.level === 'high' ? 'alert-high' : ''}`}>
            <strong>{alert.title}</strong>
            <p>{alert.description}</p>
          </article>
        ))}
      </section>
    </>
  );
}

function SalesView({
  sales,
  form,
  salesRepOptions,
  salesProductOptions,
  customerOptions,
  editingId,
  saving,
  isFormOpen,
  onOpenForm,
  onCloseForm,
  onChange,
  onSubmit,
  onEdit,
  onDelete
}) {
  const reversedItems = [...(sales.items || [])].reverse();
  const { page, setPage, pageItems, totalPages, pageSize, setPageSize } = usePagination(reversedItems);
  return (
    <>
      <SummaryCards items={sales.overview} />

      <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
        <article className="card table-card">
          <div className="table-actions-header">
            <div>
              <p className="eyebrow">سجلات المبيعات</p>
              <h3>إدارة العمليات الحالية</h3>
            </div>
            <button type="button" className="primary-button" onClick={onOpenForm}>
              إضافة عملية بيع
            </button>
          </div>

          <div className="table-list">
            {pageItems.map((item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.customerName}</strong>
                    <span className={`status-chip ${getStatusTone(item.status)}`}>{item.status}</span>
                  </div>
                  <p>{item.productName}</p>
                  <small>
                    {item.salesRep} - {formatDate(item.saleDate)}
                  </small>
                </div>
                <div className="table-side">
                  <strong>{formatMoney(item.amount)}</strong>
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => onEdit(item)}>
                      تعديل
                    </button>
                    <button type="button" className="danger-button small" onClick={() => onDelete(item.id)}>
                      حذف
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
        </article>
      </section>

      <Modal isOpen={isFormOpen} onClose={onCloseForm} title={editingId ? 'تعديل عملية بيع' : 'إضافة عملية بيع'}>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            <span>اسم العميل</span>
            <select name="customerName" value={form.customerName} onChange={onChange} required>
              <option value="">{salesRepOptions.length > 0 ? '— اختر عميلاً —' : 'لا يوجد عملاء متاحون'}</option>
              {salesRepOptions.map((repName) => (
                <option key={repName} value={repName}>{repName}</option>
              ))}
              {form.customerName && !salesRepOptions.includes(form.customerName) ? (
                <option value={form.customerName}>{form.customerName}</option>
              ) : null}
            </select>
          </label>
          <label>
            <span>اسم المنتج</span>
            <select name="productName" value={form.productName} onChange={onChange} required>
              <option value="">{salesProductOptions.length > 0 ? '— اختر منتجًا —' : 'لا توجد منتجات متاحة'}</option>
              {salesProductOptions.map((productName) => (
                <option key={productName} value={productName}>{productName}</option>
              ))}
              {form.productName && !salesProductOptions.includes(form.productName) ? (
                <option value={form.productName}>{form.productName}</option>
              ) : null}
            </select>
          </label>
          <label>
            <span>القيمة</span>
            <input name="amount" type="number" min="0" value={form.amount} onChange={onChange} />
          </label>
          <label>
            <span>الحالة</span>
            <select name="status" value={form.status} onChange={onChange}>
              {salesStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>تاريخ البيع</span>
            <input name="saleDate" type="date" value={form.saleDate} onChange={onChange} />
          </label>
          <label className="full-width">
            <span>ملاحظات</span>
            <textarea name="notes" rows="4" value={form.notes} onChange={onChange} />
          </label>

          <div className="form-actions full-width" style={{ marginTop: '16px' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديل' : 'إضافة عملية البيع'}
            </button>
            <button type="button" className="ghost-button" onClick={onCloseForm}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function CreditSalesView({
  creditSales,
  form,
  editingId,
  saving,
  isFormOpen,
  onOpenForm,
  onCloseForm,
  onChange,
  onSubmit,
  onEdit,
  onDelete
}) {
  const reversedItems = [...(creditSales.items || [])].reverse();
  const { page, setPage, pageItems, totalPages, pageSize, setPageSize } = usePagination(reversedItems);
  return (
    <>
      <SummaryCards items={creditSales.overview} />

      <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
        <article className="card table-card">
          <div className="table-actions-header">
            <div>
              <p className="eyebrow">سجلات مبيعات الآجل</p>
              <h3>إدارة التحصيل والمتابعة</h3>
            </div>
            <button type="button" className="primary-button" onClick={onOpenForm}>
              إضافة سجل آجل
            </button>
          </div>

          <div className="table-list">
            {pageItems.map((item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.customerName}</strong>
                    <span className={`status-chip ${getStatusTone(item.status)}`}>{item.status}</span>
                  </div>
                  <p>{item.invoiceNumber}</p>
                  <small>
                    {item.salesRep} - استحقاق {formatDate(item.dueDate)}
                  </small>
                </div>
                <div className="table-side">
                  <strong>{formatMoney(item.remainingAmount)}</strong>
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => onEdit(item)}>
                      تعديل
                    </button>
                    <button type="button" className="danger-button small" onClick={() => onDelete(item.id)}>
                      حذف
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
        </article>
      </section>

      <Modal isOpen={isFormOpen} onClose={onCloseForm} title={editingId ? 'تعديل سجل آجل' : 'إضافة سجل آجل'}>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            <span>اسم العميل</span>
            <input name="customerName" value={form.customerName} onChange={onChange} />
          </label>
          <label>
            <span>رقم الفاتورة</span>
            <input name="invoiceNumber" value={form.invoiceNumber} onChange={onChange} />
          </label>
          <label>
            <span>إجمالي المبلغ</span>
            <input name="amount" type="number" min="0" value={form.amount} onChange={onChange} />
          </label>
          <label>
            <span>المبلغ المسدد</span>
            <input name="paidAmount" type="number" min="0" value={form.paidAmount} onChange={onChange} />
          </label>
          <label>
            <span>الحالة</span>
            <select name="status" value={form.status} onChange={onChange}>
              {creditStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>مسؤول المبيعات</span>
            <input name="salesRep" value={form.salesRep} onChange={onChange} />
          </label>
          <label className="full-width">
            <span>تاريخ الاستحقاق</span>
            <input name="dueDate" type="date" value={form.dueDate} onChange={onChange} />
          </label>
          <label className="full-width">
            <span>ملاحظات</span>
            <textarea name="notes" rows="4" value={form.notes} onChange={onChange} />
          </label>

          <div className="form-actions full-width" style={{ marginTop: '16px' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديل' : 'إضافة سجل الآجل'}
            </button>
            <button type="button" className="ghost-button" onClick={onCloseForm}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function ReturnsView({
  returns,
  form,
  editingId,
  saving,
  isFormOpen,
  onOpenForm,
  onCloseForm,
  onChange,
  onSubmit,
  onEdit,
  onDelete,
  productOptions = [],
  supplierOptions = []
}) {
  const reversedItems = [...(returns.items || [])].reverse();
  const { page, setPage, pageItems, totalPages, pageSize, setPageSize } = usePagination(reversedItems);
  return (
    <>
      <SummaryCards items={returns.overview} />

      <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
        <article className="card table-card">
          <div className="table-actions-header">
            <div>
              <p className="eyebrow">سجلات المرتجعات</p>
              <h3>إدارة ومراجعة البضائع المرتجعة</h3>
            </div>
            <button type="button" className="primary-button" onClick={onOpenForm}>
              إضافة مرتجع
            </button>
          </div>

          <div className="table-list">
            {pageItems.map((item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.customerName}</strong>
                    <span className={`status-chip ${getStatusTone(item.status)}`}>{item.status}</span>
                  </div>
                  <p>{item.productName ? `صنف: ${item.productName}` : item.reason}</p>
                  <small>
                    {item.salesRep} - {formatDate(item.returnDate)}
                  </small>
                </div>
                <div className="table-side">
                  <strong>{formatMoney(item.amount)}</strong>
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => onEdit(item)}>
                      تعديل
                    </button>
                    <button type="button" className="danger-button small" onClick={() => onDelete(item.id)}>
                      حذف
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
        </article>
      </section>

      <Modal isOpen={isFormOpen} onClose={onCloseForm} title={editingId ? 'تعديل سجل المرتجع' : 'إضافة مرتجع جديد'}>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            <span>اسم العميل</span>
            <select name="customerName" value={form.customerName} onChange={onChange}>
              <option value="">{supplierOptions.length > 0 ? '— اختر موردًا —' : 'لا يوجد موردون مسجلون'}</option>
              {supplierOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
              {form.customerName && !supplierOptions.includes(form.customerName) ? <option value={form.customerName}>{form.customerName}</option> : null}
            </select>
          </label>
          <label>
            <span>اسم الصنف</span>
            <select name="productName" value={form.productName} onChange={onChange}>
              <option value="">-- اختر الصنف --</option>
              {productOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>رقم الفاتورة الأصلية (اختياري)</span>
            <input name="originalInvoiceNumber" value={form.originalInvoiceNumber} onChange={onChange} />
          </label>
          <label>
            <span>القيمة</span>
            <input name="amount" type="number" min="0" value={form.amount} onChange={onChange} />
          </label>
          <label>
            <span>الحالة</span>
            <select name="status" value={form.status} onChange={onChange}>
              {returnStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>مسؤول المبيعات</span>
            <input name="salesRep" value={form.salesRep} onChange={onChange} />
          </label>
          <label>
            <span>تاريخ الإرجاع</span>
            <input name="returnDate" type="date" value={form.returnDate} onChange={onChange} />
          </label>
          <label className="full-width">
            <span>سبب الإرجاع</span>
            <textarea name="reason" rows="2" value={form.reason} onChange={onChange} />
          </label>
          <label className="full-width">
            <span>ملاحظات</span>
            <textarea name="notes" rows="2" value={form.notes} onChange={onChange} />
          </label>

          <div className="form-actions full-width" style={{ marginTop: '16px' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديل' : 'إضافة المرتجع'}
            </button>
            <button type="button" className="ghost-button" onClick={onCloseForm}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function PriceListView({
  priceList,
  form,
  editingId,
  saving,
  isFormOpen,
  onOpenForm,
  onCloseForm,
  onChange,
  onSubmit,
  onEdit,
  onDelete
}) {
  const reversedItems = [...(priceList.items || [])].reverse();
  const { page, setPage, pageItems, totalPages, pageSize, setPageSize } = usePagination(reversedItems);
  return (
    <>
      <SummaryCards items={priceList.overview} />

      <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
        <article className="card table-card">
          <div className="table-actions-header">
            <div>
              <p className="eyebrow">قائمة الأسعار</p>
              <h3>إدارة المنتجات وتسعيرها</h3>
            </div>
            <button type="button" className="primary-button" onClick={onOpenForm}>
              إضافة منتج
            </button>
          </div>

          <div className="table-list">
            {pageItems.map((item) => {
              const margin = item.purchasePrice > 0 
                ? (((item.sellingPrice - item.purchasePrice) / item.purchasePrice) * 100).toFixed(1)
                : '0.0';
              return (
                <article key={item.id} className="table-row">
                  <div className="table-main">
                    <div className="record-top">
                      <strong>{item.productName}</strong>
                      {item.category && <span className="status-chip neutral">{item.category}</span>}
                    </div>
                    <p>{item.notes}</p>
                  </div>
                  <div className="table-side">
                    <div style={{ textAlign: 'left', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        شراء: {formatMoney(item.purchasePrice)}
                      </div>
                      <strong>بيع: {formatMoney(item.sellingPrice)}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>
                        هامش: {margin}%
                      </div>
                    </div>
                    <div className="row-actions">
                      <button type="button" className="ghost-button small" onClick={() => onEdit(item)}>
                        تعديل
                      </button>
                      <button type="button" className="danger-button small" onClick={() => onDelete(item.id)}>
                        حذف
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
        </article>
      </section>

      <Modal isOpen={isFormOpen} onClose={onCloseForm} title={editingId ? 'تعديل منتج' : 'إضافة منتج جديد'}>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            <span>اسم المنتج</span>
            <input name="productName" value={form.productName} onChange={onChange} required />
          </label>
          <label>
            <span>التصنيف</span>
            <input name="category" value={form.category} onChange={onChange} placeholder="مثال: إلكترونيات، ملابس.." />
          </label>
          <label>
            <span>سعر الشراء (التكلفة)</span>
            <input name="purchasePrice" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={onChange} required />
          </label>
          <label>
            <span>سعر البيع</span>
            <input name="sellingPrice" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={onChange} required />
          </label>
          <label className="full-width">
            <span>ملاحظات</span>
            <textarea name="notes" rows="2" value={form.notes} onChange={onChange} />
          </label>

          <div className="form-actions full-width" style={{ marginTop: '16px' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديل' : 'إضافة المنتج'}
            </button>
            <button type="button" className="ghost-button" onClick={onCloseForm}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}


function CustodiesView({ custodies, onManageTransactions, onDelete, canDelete = false }) {
  const reversedItems = [...(custodies.items || [])].reverse();
  const { page, setPage, pageItems, totalPages, pageSize, setPageSize } = usePagination(reversedItems);
  return (
    <>
      <SummaryCards items={custodies.overview} />

      <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
        <article className="card table-card">
          <div className="table-actions-header">
            <div>
              <p className="eyebrow">عهد الموظفين</p>
              <h3>سجل العهدات المخصصة للموظفين</h3>
            </div>
          </div>

          <div className="table-list">
            {pageItems.map((item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.employeeName}</strong>
                    <span className={`status-chip ${item.status === 'نشطة' ? 'success' : 'neutral'}`}>{item.status}</span>
                    <span className="status-chip warning">{item.custodyType}</span>
                  </div>
                  <p>{item.custodyType === 'نقدية' ? 'مبلغ مالي' : item.itemDetails}</p>
                </div>
                <div className="table-side">
                  {item.custodyType === 'نقدية' && (
                    <div style={{ textAlign: 'left', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        المبلغ الأساسي: {formatMoney(item.initialAmount)}
                      </div>
                      <strong>الرصيد: {formatMoney(item.currentBalance)}</strong>
                    </div>
                  )}
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => onManageTransactions(item.id)}>
                      تعليقات وملاحظات
                    </button>
                    {canDelete ? (
                      <button type="button" className="danger-button small" onClick={() => onDelete(item.id)}>
                        حذف
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
            {custodies.items.length === 0 && <p className="empty-notice">لا توجد عهدات مسجلة بعد.</p>}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
        </article>
      </section>
    </>
  );
}

function ChecksView({
  checks,
  form,
  editingId,
  saving,
  isFormOpen,
  onOpenForm,
  onCloseForm,
  onChange,
  onSubmit,
  onEdit,
  onDelete,
  cashReceipts,
  cashForm,
  cashEditingId,
  cashSaving,
  isCashFormOpen,
  onOpenCashForm,
  onCloseCashForm,
  onCashChange,
  onCashSubmit,
  onCashEdit,
  onCashDelete,
  supplierOptions = []
}) {
  const [activeTab, setActiveTab] = useState('checks');
  const today = getTodayLocalDateKey();
  const todayChecks = checks.items.filter(
    (item) => item.collectionDate === today && item.status === 'معلق'
  );
  const reversedItems = [...(checks.items || [])].reverse();
  const { page, setPage, pageItems, totalPages, pageSize, setPageSize } = usePagination(reversedItems);
  const reversedCash = [...(cashReceipts?.items || [])].reverse();
  const { page: cashPage, setPage: setCashPage, pageItems: cashPageItems, totalPages: cashTotalPages, pageSize: cashPageSize, setPageSize: setCashPageSize } = usePagination(reversedCash);

  return (
    <>
      <SummaryCards items={activeTab === 'checks' ? checks.overview : (cashReceipts?.overview || [])} />

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', marginBottom: '4px' }}>
        <button
          type="button"
          className={activeTab === 'checks' ? 'primary-button small' : 'ghost-button small'}
          onClick={() => setActiveTab('checks')}
        >
          شيكات
        </button>
        <button
          type="button"
          className={activeTab === 'cash' ? 'primary-button small' : 'ghost-button small'}
          onClick={() => setActiveTab('cash')}
        >
          دفعات نقدية
        </button>
      </div>

      {/* ── Checks Tab ── */}
      {activeTab === 'checks' && <>
        {todayChecks.length > 0 && (
          <section className="checks-today-banner">
            <div className="checks-today-icon">🔔</div>
            <div className="checks-today-content">
              <strong>شيكات موعد تحصيلها اليوم — {new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</strong>
              <p>يوجد <strong>{todayChecks.length}</strong> شيك يستحق التحصيل اليوم بإجمالي&nbsp;
                {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(
                  todayChecks.reduce((s, c) => s + c.amount, 0)
                )}
              </p>
            </div>
          </section>
        )}

        {todayChecks.length > 0 && (
          <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '0' }}>
            <article className="card table-card checks-today-card">
              <div className="table-actions-header">
                <div>
                  <p className="eyebrow">تحصيل اليوم</p>
                  <h3>الشيكات المستحقة اليوم</h3>
                </div>
              </div>
              <div className="table-list">
                {todayChecks.map((item) => (
                  <article key={item.id} className="table-row checks-due-row">
                    <div className="table-main">
                      <div className="record-top">
                        <strong>{item.customerName}</strong>
                        <span className="status-chip danger">تحصيل اليوم</span>
                      </div>
                      <p>{item.bankName ? `بنك: ${item.bankName}` : ''}{item.checkNumber ? ` — شيك رقم: ${item.checkNumber}` : ''}</p>
                    </div>
                    <div className="table-side">
                      <strong>{formatMoney(item.amount)}</strong>
                      <div className="row-actions">
                        <button type="button" className="primary-button small" onClick={() => onEdit(item)}>
                          تحديث الحالة
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </section>
        )}

        <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
          <article className="card table-card">
            <div className="table-actions-header">
              <div>
                <p className="eyebrow">سجل الشيكات</p>
                <h3>إدارة الشيكات ومواعيد التحصيل</h3>
              </div>
              <button type="button" className="primary-button" onClick={onOpenForm}>
                إضافة شيك
              </button>
            </div>

            <div className="table-list">
              {pageItems.map((item) => {
                const isToday = item.collectionDate === today && item.status === 'معلق';
                return (
                  <article key={item.id} className={`table-row${isToday ? ' checks-highlight' : ''}`}>
                    <div className="table-main">
                      <div className="record-top">
                        <strong>{item.customerName}</strong>
                        <span className={`status-chip ${getCheckStatusTone(item.status)}`}>{item.status}</span>
                        {isToday && <span className="status-chip danger">اليوم</span>}
                      </div>
                      <p>
                        {item.bankName ? `${item.bankName}` : '—'}
                        {item.checkNumber ? ` · شيك رقم ${item.checkNumber}` : ''}
                      </p>
                      <small>تاريخ التحصيل: {formatDate(item.collectionDate)}</small>
                    </div>
                    <div className="table-side">
                      <strong>{formatMoney(item.amount)}</strong>
                      <div className="row-actions">
                        <button type="button" className="ghost-button small" onClick={() => onEdit(item)}>
                          تعديل
                        </button>
                        <button type="button" className="danger-button small" onClick={() => onDelete(item.id)}>
                          حذف
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
              {checks.items.length === 0 && (
                <p className="empty-notice">لا توجد شيكات مسجلة بعد.</p>
              )}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
          </article>
        </section>
      </>}

      {/* ── Cash Tab ── */}
      {activeTab === 'cash' && (
        <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
          <article className="card table-card">
            <div className="table-actions-header">
              <div>
                <p className="eyebrow">سجل الدفعات النقدية</p>
                <h3>المقبوضات النقدية من العملاء</h3>
              </div>
              <button type="button" className="primary-button" onClick={onOpenCashForm}>
                إضافة دفعة نقدية
              </button>
            </div>

            <div className="table-list">
              {cashPageItems.map((item) => (
                <article key={item.id} className="table-row">
                  <div className="table-main">
                    <div className="record-top">
                      <strong>{item.customerName}</strong>
                      <span className="status-chip calm">نقدي</span>
                    </div>
                    <small>تاريخ الاستلام: {formatDate(item.receiptDate)}</small>
                    {item.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '2px' }}>{item.notes}</p>}
                  </div>
                  <div className="table-side">
                    <strong>{formatMoney(item.amount)}</strong>
                    <div className="row-actions">
                      <button type="button" className="ghost-button small" onClick={() => onCashEdit(item)}>تعديل</button>
                      <button type="button" className="danger-button small" onClick={() => onCashDelete(item.id)}>حذف</button>
                    </div>
                  </div>
                </article>
              ))}
              {(cashReceipts?.items || []).length === 0 && (
                <p className="empty-notice">لا توجد دفعات نقدية مسجلة بعد.</p>
              )}
            </div>
            <Pagination page={cashPage} totalPages={cashTotalPages} onPageChange={setCashPage} pageSize={cashPageSize} onPageSizeChange={setCashPageSize} />
          </article>
        </section>
      )}

      {/* Check form modal */}
      <Modal isOpen={isFormOpen} onClose={onCloseForm} title={editingId ? 'تعديل الشيك' : 'إضافة شيك جديد'}>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            <span>اسم العميل / الساحب</span>
            <select name="customerName" value={form.customerName} onChange={onChange} required>
              <option value="">-- اختر العميل --</option>
              {supplierOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>رقم الشيك</span>
            <input name="checkNumber" value={form.checkNumber} onChange={onChange} placeholder="اختياري" />
          </label>
          <label>
            <span>اسم البنك</span>
            <input name="bankName" value={form.bankName} onChange={onChange} placeholder="مثال: بنك مصر" />
          </label>
          <label>
            <span>القيمة</span>
            <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={onChange} required />
          </label>
          <label>
            <span>تاريخ التحصيل</span>
            <input name="collectionDate" type="date" value={form.collectionDate} onChange={onChange} required />
          </label>
          <label>
            <span>الحالة</span>
            <select name="status" value={form.status} onChange={onChange}>
              {checkStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="full-width">
            <span>ملاحظات</span>
            <textarea name="notes" rows="3" value={form.notes} onChange={onChange} />
          </label>
          <div className="form-actions full-width" style={{ marginTop: '16px' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديل' : 'إضافة الشيك'}
            </button>
            <button type="button" className="ghost-button" onClick={onCloseForm}>إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Cash form modal */}
      <Modal isOpen={isCashFormOpen} onClose={onCloseCashForm} title={cashEditingId ? 'تعديل الدفعة النقدية' : 'إضافة دفعة نقدية'}>
        <form className="form-grid" onSubmit={onCashSubmit}>
          <label>
            <span>اسم العميل</span>
            <select name="customerName" value={cashForm.customerName} onChange={onCashChange} required>
              <option value="">-- اختر العميل --</option>
              {supplierOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>المبلغ المستلم</span>
            <input name="amount" type="number" min="0" step="0.01" value={cashForm.amount} onChange={onCashChange} required />
          </label>
          <label>
            <span>تاريخ الاستلام</span>
            <input name="receiptDate" type="date" value={cashForm.receiptDate} onChange={onCashChange} required />
          </label>
          <label className="full-width">
            <span>ملاحظات</span>
            <textarea name="notes" rows="3" value={cashForm.notes} onChange={onCashChange} />
          </label>
          <div className="form-actions full-width" style={{ marginTop: '16px' }}>
            <button type="submit" className="primary-button" disabled={cashSaving}>
              {cashSaving ? 'جارٍ الحفظ...' : cashEditingId ? 'حفظ التعديل' : 'إضافة الدفعة'}
            </button>
            <button type="button" className="ghost-button" onClick={onCloseCashForm}>إلغاء</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());

  function handleLogin(data) { setAuth(data); }
  function handleLogout() { clearAuth(); setAuth(null); }

  if (!auth) return <LoginScreen onLogin={handleLogin} />;

  return <MainApp auth={auth} onLogout={handleLogout} />;
}

function MainApp({ auth, onLogout }) {
  const userPages = auth.user.pages; // '*' or array
  function canAccess(id) {
    if (id === 'reps-management') return auth.user.role === 'admin' || auth.user.role === 'manager';
    return userPages === '*' || userPages.includes(id);
  }
  const isAdmin = auth.user.role === 'admin';

  const filteredNavigation = [
    ...navigation.filter(item => canAccess(item.id)),
    ...(isAdmin ? [{ id: 'users', label: 'إدارة المستخدمين', helper: 'الصلاحيات والمستخدمون' }, { id: 'roles', label: 'إدارة الأدوار', helper: 'أدوار وصلاحيات الصفحات' }] : []),
  ];
  const groupedNavigation = navigationGroups
    .map((group) => ({
      ...group,
      items: filteredNavigation.filter((item) => navigationGroupByItemId[item.id] === group.id)
    }))
    .filter((group) => group.items.length > 0);

  const [expandedNavGroups, setExpandedNavGroups] = useState(() =>
    navigationGroups.reduce((acc, group) => {
      acc[group.id] = true;
      return acc;
    }, {})
  );

  function toggleNavGroup(groupId) {
    setExpandedNavGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  const [activeView, setActiveView] = useState(getInitialView);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewHistory, setViewHistory] = useState([]);
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [sales, setSales] = useState(initialSales);
  const [creditSales, setCreditSales] = useState(initialCreditSales);
  const [returns, setReturns] = useState(initialReturns);
  const [priceList, setPriceList] = useState(initialPriceList);
  const [custodies, setCustodies] = useState(initialCustodies);
  const [checks, setChecks] = useState(initialChecks);
  const [cashReceipts, setCashReceipts] = useState(initialCashReceipts);
  const [cashForm, setCashForm] = useState(initialCashForm);
  const [cashEditingId, setCashEditingId] = useState('');
  const [cashSaving, setCashSaving] = useState(false);
  const [cashFormOpen, setCashFormOpen] = useState(false);
  const [statement, setStatement] = useState(initialStatement);
  const [salesForm, setSalesForm] = useState(initialSalesForm);
  const [salesRepProducts, setSalesRepProducts] = useState([]);
  const [creditForm, setCreditForm] = useState(initialCreditForm);
  const [returnsForm, setReturnsForm] = useState(initialReturnsForm);
  const [priceListForm, setPriceListForm] = useState(initialPriceListForm);
  const [checkForm, setCheckForm] = useState(initialCheckForm);
  const [custodyForm, setCustodyForm] = useState(initialCustodyForm);
  const [transactionForm, setTransactionForm] = useState(initialTransactionForm);
  const [salesEditingId, setSalesEditingId] = useState('');
  const [creditEditingId, setCreditEditingId] = useState('');
  const [returnsEditingId, setReturnsEditingId] = useState('');
  const [priceListEditingId, setPriceListEditingId] = useState('');
  const [custodyEditingId, setCustodyEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [salesSaving, setSalesSaving] = useState(false);
  const [creditSaving, setCreditSaving] = useState(false);
  const [returnsSaving, setReturnsSaving] = useState(false);
  const [priceListSaving, setPriceListSaving] = useState(false);
  const [custodiesSaving, setCustodiesSaving] = useState(false);
  const [transactionSaving, setTransactionSaving] = useState(false);
  const [checkSaving, setCheckSaving] = useState(false);
  const [checkEditingId, setCheckEditingId] = useState('');

  // ── New module states ──
  const [productCards, setProductCards] = useState(initialProductCards);
  const [pcForm, setPcForm] = useState(initialProductCardForm);
  const [pcEditingId, setPcEditingId] = useState('');
  const [pcSaving, setPcSaving] = useState(false);
  const [pcFormOpen, setPcFormOpen] = useState(false);
  const [pcImporting, setPcImporting] = useState(false);
  const productCardsFileInputRef = useRef(null);

  const [finalProductStore, setFinalProductStore] = useState(initialFinalProductStore);
  const [rawMaterialsStore, setRawMaterialsStore] = useState(initialRawMaterialsStore);
  const [repSubStores, setRepSubStores] = useState(initialRepSubStores);
  const [finManagerCustody, setFinManagerCustody] = useState(initialFinManagerCustody);
  const [rawPurchases, setRawPurchases] = useState(initialRawPurchases);
  const [rawMaterialsCatalog, setRawMaterialsCatalog] = useState(initialRawMaterialsCatalog);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [machinePurchases, setMachinePurchases] = useState(initialMachinePurchases);
  const [miscPurchases, setMiscPurchases] = useState(initialMiscPurchases);
  const [payrollAdvances, setPayrollAdvances] = useState(initialPayrollAdvances);
  const [paymentAlerts, setPaymentAlerts] = useState(initialPaymentAlerts);
  const [freeSamples, setFreeSamples] = useState(initialFreeSamples);

  const [fpForm, setFpForm] = useState(initialFinalProductForm);
  const [rmForm, setRmForm] = useState(initialRawMaterialForm);
  const [rssForm, setRssForm] = useState(initialRepSubStoreForm);
  const [fmcForm, setFmcForm] = useState(initialFinManagerCustodyForm);
  const [fmcAssignForm, setFmcAssignForm] = useState(initialFinManagerCustodyForm);
  const [rmpForm, setRmpForm] = useState(initialRawPurchaseForm);
  const [rmcForm, setRmcForm] = useState(initialRawMaterialCatalogForm);
  const [supForm, setSupForm] = useState(initialSupplierForm);
  const [mmpForm, setMmpForm] = useState(initialMachinePurchaseForm);
  const [mscForm, setMscForm] = useState(initialMiscPurchaseForm);
  const [payForm, setPayForm] = useState(initialPayrollAdvanceForm);
  const [cpaForm, setCpaForm] = useState(initialPaymentAlertForm);
  const [fsForm, setFsForm] = useState(initialFreeSampleForm);

  const [fpEditingId, setFpEditingId] = useState('');
  const [rmEditingId, setRmEditingId] = useState('');
  const [rssEditingId, setRssEditingId] = useState('');
  const [fmcEditingId, setFmcEditingId] = useState('');
  const [rmpEditingId, setRmpEditingId] = useState('');
  const [rmcEditingId, setRmcEditingId] = useState('');
  const [supEditingId, setSupEditingId] = useState('');
  const [mmpEditingId, setMmpEditingId] = useState('');
  const [mscEditingId, setMscEditingId] = useState('');
  const [payEditingId, setPayEditingId] = useState('');
  const [cpaEditingId, setCpaEditingId] = useState('');
  const [fsEditingId, setFsEditingId] = useState('');

  const [fpSaving, setFpSaving] = useState(false);
  const [rmSaving, setRmSaving] = useState(false);
  const [rssSaving, setRssSaving] = useState(false);
  const [fmcSaving, setFmcSaving] = useState(false);
  const [rmpSaving, setRmpSaving] = useState(false);
  const [rmcSaving, setRmcSaving] = useState(false);
  const [supSaving, setSupSaving] = useState(false);
  const [mmpSaving, setMmpSaving] = useState(false);
  const [mscSaving, setMscSaving] = useState(false);
  const [paySaving, setPaySaving] = useState(false);
  const [cpaSaving, setCpaSaving] = useState(false);
  const [fsSaving, setFsSaving] = useState(false);

  const [fpFormOpen, setFpFormOpen] = useState(false);
  const [rmFormOpen, setRmFormOpen] = useState(false);
  const [rssFormOpen, setRssFormOpen] = useState(false);
  const [transferFormOpen, setTransferFormOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({ repName: '', productName: '', quantity: '', deliveryDate: '', notes: '' });
  const [transferSaving, setTransferSaving] = useState(false);
  const [repUsers, setRepUsers] = useState([]);
  const [employeeUsers, setEmployeeUsers] = useState([]);
  const [registeredReps, setRegisteredReps] = useState([]);
  const [saleDeductForm, setSaleDeductForm] = useState({ repName: '', productName: '', quantity: '' });
  const [saleDeductOpen, setSaleDeductOpen] = useState(false);
  const [saleDeductSaving, setSaleDeductSaving] = useState(false);

  const [fmcFormOpen, setFmcFormOpen] = useState(false);
  const [fmcAssignOpen, setFmcAssignOpen] = useState(false);
  const [fmcBudgetInput, setFmcBudgetInput] = useState('');
  const [activeManagerCustodyId, setActiveManagerCustodyId] = useState('');
  const [rmpFormOpen, setRmpFormOpen] = useState(false);
  const [rmcFormOpen, setRmcFormOpen] = useState(false);
  const [supFormOpen, setSupFormOpen] = useState(false);
  const [mmpFormOpen, setMmpFormOpen] = useState(false);
  const [mscFormOpen, setMscFormOpen] = useState(false);
  const [payFormOpen, setPayFormOpen] = useState(false);
  const [cpaFormOpen, setCpaFormOpen] = useState(false);
  const [fsFormOpen, setFsFormOpen] = useState(false);

  // Modal visibility state
  const [salesFormOpen, setSalesFormOpen] = useState(false);
  const [creditFormOpen, setCreditFormOpen] = useState(false);
  const [returnsFormOpen, setReturnsFormOpen] = useState(false);
  const [priceListFormOpen, setPriceListFormOpen] = useState(false);
  const [custodyFormOpen, setCustodyFormOpen] = useState(false);
  const [checkFormOpen, setCheckFormOpen] = useState(false);
  const [transactionsModalOpen, setTransactionsModalOpen] = useState(false);
  const [activeCustodyId, setActiveCustodyId] = useState(null);
  const [activeCustodyTransactions, setActiveCustodyTransactions] = useState([]);

  // Notification: checks due today
  const [checkNotification, setCheckNotification] = useState(null);
  const [notificationDismissed, setNotificationDismissed] = useState(false);

  // Delete confirmation state: { type: 'sales'|'credit'|'returns'|'price-list'|'custodies'|'transaction'|'check', id }
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveView(getInitialView());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!auth?.token) {
      setEmployeeUsers([]);
      return;
    }
    loadEmployeeUsers();
  }, [auth?.token]);

  useEffect(() => {
    const activeGroupId = navigationGroupByItemId[activeView];
    if (!activeGroupId) return;
    setExpandedNavGroups((prev) => (prev[activeGroupId] ? prev : { ...prev, [activeGroupId]: true }));
  }, [activeView]);

  async function loadEmployeeUsers() {
    if (!auth?.token) {
      setEmployeeUsers([]);
      return;
    }
    try {
      const res = await fetch('/api/users/options', { headers: { Authorization: `Bearer ${auth.token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setEmployeeUsers(
        Array.isArray(data)
          ? data.filter((user) => user && typeof user === 'object' && user.displayName)
          : []
      );
    } catch {
      setEmployeeUsers([]);
    }
  }

  async function loadAllData() {
    try {
      setLoading(true); setError('');
      const pairs = [
        ['/api/dashboard', setDashboard],
        ['/api/sales', setSales],
        ['/api/credit-sales', setCreditSales],
        ['/api/returns', setReturns],
        ['/api/price-list', setPriceList],
        ['/api/custodies', setCustodies],
        ['/api/checks', setChecks],
        ['/api/cash-receipts', setCashReceipts],
        ['/api/final-product-store', setFinalProductStore],
        ['/api/raw-materials-store', setRawMaterialsStore],
        ['/api/rep-sub-stores', setRepSubStores],
        ['/api/financial-manager-custody', setFinManagerCustody],
        ['/api/raw-materials-purchases', setRawPurchases],
        ['/api/raw-materials-catalog', setRawMaterialsCatalog],
        ['/api/suppliers', setSuppliers],
        ['/api/machine-maintenance-purchases', setMachinePurchases],
        ['/api/misc-purchases', setMiscPurchases],
        ['/api/payroll-advances', setPayrollAdvances],
        ['/api/customer-payment-alerts', setPaymentAlerts],
        ['/api/free-samples', setFreeSamples],
        ['/api/product-cards', setProductCards],
      ];
      // Load reps separately (flat array, not {overview,items})
      fetch('/api/reps', { headers: { Authorization: `Bearer ${auth?.token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(data => setRegisteredReps(Array.isArray(data) ? data : []))
        .catch(() => {});
      await Promise.all(pairs.map(async ([url, setter]) => {
        try { const r = await fetch(url); if (r.ok) setter(await r.json()); } catch { /* ignore individual failures */ }
      }));
    } catch { setError('تعذر تحميل البيانات من الخادم.'); } finally { setLoading(false); }
  }

  // Initialize data
  useEffect(() => {
    loadAllData();
  }, []);

  function navigateTo(view) {
    setViewHistory((prev) => [...prev, activeView]);
    setActiveView(view);
    window.location.hash = view;
    setIsMobileMenuOpen(false);
  }

  function goBack() {
    setViewHistory((prev) => {
      const next = [...prev];
      const previous = next.pop();
      if (previous) {
        setActiveView(previous);
        window.location.hash = previous;
      }
      return next;
    });
  }

  function buildCustomerStatement(customerName, currentSales, currentCreditSales, currentReturns) {
    if (!customerName) {
      return initialStatement;
    }

    const normalizeDate = (value) => value || '9999-12-31';
    const entries = [
      ...currentSales.items
        .filter((item) => item.customerName === customerName)
        .map((item) => ({
          id: `sale-${item.id}`,
          date: item.saleDate,
          reportDate: item.saleDate ? new Intl.DateTimeFormat('en-GB').format(new Date(item.saleDate)) : '',
          sequence: item.id,
          description: `مبيعات نقدية - ${item.productName}`,
          reference: item.id,
          transactionType: 'فاتورة المبيعات',
          deliveryAddress: '',
          quantity: 1,
          price: item.amount,
          total: item.amount,
          netTotal: item.amount,
          discount: 0,
          adjustment: 0,
          debit: item.amount,
          credit: 0,
          status: item.status,
          statusLabel: item.status,
          notes: item.notes ?? ''
        })),
      ...currentCreditSales.items
        .filter((item) => item.customerName === customerName)
        .flatMap((item) => {
          const rows = [
            {
              id: `credit-invoice-${item.id}`,
              date: item.dueDate,
              reportDate: item.dueDate ? new Intl.DateTimeFormat('en-GB').format(new Date(item.dueDate)) : '',
              sequence: item.invoiceNumber || item.id,
              description: 'فاتورة آجل',
              reference: item.invoiceNumber || item.id,
              transactionType: 'فاتورة الآجل',
              deliveryAddress: '',
              quantity: 1,
              price: item.amount,
              total: item.amount,
              netTotal: item.amount,
              discount: 0,
              adjustment: 0,
              debit: item.amount,
              credit: 0,
              status: item.status,
              statusLabel: item.status,
              notes: item.notes ?? ''
            }
          ];

          if (item.paidAmount > 0) {
            rows.push({
              id: `credit-payment-${item.id}`,
              date: item.dueDate,
              reportDate: item.dueDate ? new Intl.DateTimeFormat('en-GB').format(new Date(item.dueDate)) : '',
              sequence: item.invoiceNumber || item.id,
              description: 'سداد من العميل',
              reference: item.invoiceNumber || item.id,
              transactionType: 'Consolidation',
              deliveryAddress: '',
              quantity: '',
              price: 0,
              total: item.paidAmount,
              netTotal: item.paidAmount,
              discount: 0,
              adjustment: 0,
              debit: 0,
              credit: item.paidAmount,
              status: item.status,
              statusLabel: item.paidAmount >= item.amount ? 'مسددة' : 'مسدد جزئيا',
              notes: item.notes ?? ''
            });
          }

          return rows;
        }),
      ...currentReturns.items
        .filter((item) => item.customerName === customerName)
        .map((item) => ({
          id: `return-${item.id}`,
          date: item.returnDate,
          reportDate: item.returnDate ? new Intl.DateTimeFormat('en-GB').format(new Date(item.returnDate)) : '',
          sequence: item.id,
          description: 'مرتجع / إشعار دائن',
          reference: item.originalInvoiceNumber || item.id,
          transactionType: 'إشعار دائن',
          deliveryAddress: '',
          quantity: '',
          price: 0,
          total: item.amount,
          netTotal: item.amount,
          discount: 0,
          adjustment: 0,
          debit: 0,
          credit: item.amount,
          status: item.status,
          statusLabel: item.status,
          notes: item.reason || item.notes || ''
        }))
    ]
      .sort((left, right) => normalizeDate(left.date).localeCompare(normalizeDate(right.date)));

    let runningBalance = 0;
    const withBalance = entries.map((entry) => {
      runningBalance += entry.debit - entry.credit;
      return {
        ...entry,
        balance: runningBalance
      };
    });

    const totalDebit = withBalance.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = withBalance.reduce((sum, item) => sum + item.credit, 0);

    return {
      customerName,
      summary: [
        {
          id: 'statement-debit',
          label: 'إجمالي المدين',
          value: totalDebit,
          type: 'currency',
          helper: 'إجمالي المبيعات والفواتير',
          tone: 'warning'
        },
        {
          id: 'statement-credit',
          label: 'إجمالي الدائن',
          value: totalCredit,
          type: 'currency',
          helper: 'سداد ومرتجعات',
          tone: 'calm'
        },
        {
          id: 'statement-balance',
          label: 'الرصيد الحالي',
          value: runningBalance,
          type: 'currency',
          helper: runningBalance > 0 ? 'على العميل' : runningBalance < 0 ? 'له رصيد دائن' : 'الرصيد متزن',
          tone: runningBalance > 0 ? 'alert' : 'accent'
        }
      ],
      entries: withBalance
    };
  }

  const customerOptions = Array.from(
    new Set([
      ...sales.items.map((item) => item.customerName),
      ...creditSales.items.map((item) => item.customerName),
      ...returns.items.map((item) => item.customerName)
    ].filter(Boolean))
  ).sort((left, right) => left.localeCompare(right, 'ar'));

  function handleStatementCustomerChange(event) {
    const customerName = event.target.value;
    setStatement(buildCustomerStatement(customerName, sales, creditSales, returns));
  }

  function handleStatementPrint() {
    window.print();
  }

  useEffect(() => {
    if (!statement.customerName) {
      return;
    }

    setStatement(buildCustomerStatement(statement.customerName, sales, creditSales, returns));
  }, [sales, creditSales, returns]);

  // ── Checks ─────────────────────────────────────────────
  function handleCheckInputChange(event) {
    const { name, value } = event.target;
    setCheckForm((current) => ({ ...current, [name]: value }));
  }

  function openCheckForm() {
    setCheckEditingId('');
    setCheckForm(initialCheckForm);
    setCheckFormOpen(true);
  }

  function startCheckEdit(item) {
    setCheckEditingId(item.id);
    setCheckForm({
      customerName: item.customerName,
      checkNumber: item.checkNumber,
      bankName: item.bankName,
      amount: String(item.amount),
      collectionDate: item.collectionDate,
      status: item.status,
      notes: item.notes ?? ''
    });
    setCheckFormOpen(true);
  }

  function closeCheckForm() {
    setCheckFormOpen(false);
    setCheckEditingId('');
    setCheckForm(initialCheckForm);
  }

  async function handleCheckSubmit(event) {
    event.preventDefault();
    try {
      setCheckSaving(true); setError(''); setNotice('');
      const payload = { ...checkForm, amount: Number(checkForm.amount) };
      const url = checkEditingId ? `/api/checks/${checkEditingId}` : '/api/checks';
      const method = checkEditingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { throw new Error(await getApiErrorMessage(res, 'تعذر حفظ الشيك')); }
      const refreshed = await fetch('/api/checks'); if (refreshed.ok) setChecks(await refreshed.json());
      closeCheckForm();
      setNotice(checkEditingId ? 'تم تعديل الشيك بنجاح.' : 'تمت إضافة الشيك بنجاح.');
    } catch (requestError) { setError(requestError.message); } finally { setCheckSaving(false); }
  }

  function requestCheckDelete(id) {
    setDeleteTarget({ type: 'check', id });
  }

  async function confirmCheckDelete() {
    const id = deleteTarget.id; setDeleteTarget(null);
    try {
      setError(''); setNotice('');
      await fetch(`/api/checks/${id}`, { method: 'DELETE' });
      const refreshed = await fetch('/api/checks'); if (refreshed.ok) setChecks(await refreshed.json());
      setNotice('تم حذف الشيك بنجاح.');
    } catch (requestError) { setError(requestError.message); }
  }

  // ── Cash Receipts ───────────────────────────────────────
  function handleCashInputChange(event) {
    const { name, value } = event.target;
    setCashForm((current) => ({ ...current, [name]: value }));
  }

  function openCashForm() {
    setCashEditingId('');
    setCashForm(initialCashForm);
    setCashFormOpen(true);
  }

  function startCashEdit(item) {
    setCashEditingId(item.id);
    setCashForm({
      customerName: item.customerName,
      amount: String(item.amount),
      receiptDate: item.receiptDate || '',
      notes: item.notes ?? ''
    });
    setCashFormOpen(true);
  }

  function closeCashForm() {
    setCashFormOpen(false);
    setCashEditingId('');
    setCashForm(initialCashForm);
  }

  async function handleCashSubmit(event) {
    event.preventDefault();
    try {
      setCashSaving(true); setError(''); setNotice('');
      const payload = { ...cashForm, amount: Number(cashForm.amount) };
      const url = cashEditingId ? `/api/cash-receipts/${cashEditingId}` : '/api/cash-receipts';
      const method = cashEditingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { throw new Error(await getApiErrorMessage(res, 'تعذر حفظ الدفعة النقدية')); }
      const refreshed = await fetch('/api/cash-receipts'); if (refreshed.ok) setCashReceipts(await refreshed.json());
      closeCashForm();
      setNotice(cashEditingId ? 'تم تعديل الدفعة بنجاح.' : 'تمت إضافة الدفعة النقدية بنجاح.');
    } catch (requestError) { setError(requestError.message); } finally { setCashSaving(false); }
  }

  function requestCashDelete(id) {
    setDeleteTarget({ type: 'cash', id });
  }

  async function confirmCashDelete() {
    const id = deleteTarget.id; setDeleteTarget(null);
    try {
      setError(''); setNotice('');
      await fetch(`/api/cash-receipts/${id}`, { method: 'DELETE' });
      const refreshed = await fetch('/api/cash-receipts'); if (refreshed.ok) setCashReceipts(await refreshed.json());
      setNotice('تم حذف الدفعة النقدية بنجاح.');
    } catch (requestError) { setError(requestError.message); }
  }

  // ── Sales ──────────────────────────────────────────────
  function handleSalesInputChange(event) {
    const { name, value } = event.target;
    setSalesForm((current) => {
      if (name === 'customerName' || name === 'salesRep') {
        // Fetch products for the selected rep from repSubStores
        const repProducts = Array.from(
          new Set(
            (repSubStores?.items || []).filter(
              (item) => item?.repName?.trim().toLowerCase() === value?.trim().toLowerCase()
            ).map((item) => item?.productName).filter(Boolean)
          )
        );
        setSalesRepProducts(repProducts);
        const keepCurrentProduct = repProducts.includes(current.productName);
        return {
          ...current,
          [name]: value,
          salesRep: value,
          productName: keepCurrentProduct ? current.productName : ''
        };
      }
      return { ...current, [name]: value };
    });
  }

  function openSalesForm() {
    setSalesEditingId('');
    setSalesForm(initialSalesForm);
    setSalesRepProducts([]);
    setSalesFormOpen(true);
  }

  function startSalesEdit(item) {
    setSalesEditingId(item.id);
    const repName = item.salesRep || item.customerName || '';
    const repProducts = Array.from(
      new Set(
        (repSubStores?.items || []).filter(
          (s) => s?.repName?.trim().toLowerCase() === repName.trim().toLowerCase()
        ).map((s) => s?.productName).filter(Boolean)
      )
    );
    setSalesRepProducts(repProducts);
    setSalesForm({
      customerName: item.customerName,
      productName: item.productName,
      amount: String(item.amount),
      status: item.status,
      salesRep: item.salesRep,
      saleDate: item.saleDate,
      notes: item.notes ?? ''
    });
    setSalesFormOpen(true);
  }

  function closeSalesForm() {
    setSalesFormOpen(false);
    setSalesEditingId('');
    setSalesForm(initialSalesForm);
  }

  async function handleSalesSubmit(event) {
    event.preventDefault();
    try {
      setSalesSaving(true); setError(''); setNotice('');
      const payload = { ...salesForm, amount: Number(salesForm.amount), salesRep: salesForm.customerName };
      const url = salesEditingId ? `/api/sales/${salesEditingId}` : '/api/sales';
      const method = salesEditingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { throw new Error(await getApiErrorMessage(res, 'تعذر حفظ عملية البيع')); }
      const refreshed = await fetch('/api/sales'); if (refreshed.ok) setSales(await refreshed.json());
      closeSalesForm();
      setNotice(salesEditingId ? 'تم تعديل عملية البيع بنجاح.' : 'تمت إضافة عملية البيع بنجاح.');
    } catch (requestError) { setError(requestError.message); } finally { setSalesSaving(false); }
  }

  function requestSalesDelete(id) {
    setDeleteTarget({ type: 'sales', id });
  }

  async function confirmSalesDelete() {
    const id = deleteTarget.id; setDeleteTarget(null);
    try {
      setError(''); setNotice('');
      await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      const refreshed = await fetch('/api/sales'); if (refreshed.ok) setSales(await refreshed.json());
      setNotice('تم حذف عملية البيع بنجاح.');
    } catch (requestError) { setError(requestError.message); }
  }

  // ── Credit Sales ───────────────────────────────────────
  function handleCreditInputChange(event) {
    const { name, value } = event.target;
    setCreditForm((current) => ({ ...current, [name]: value }));
  }

  function openCreditForm() {
    setCreditEditingId('');
    setCreditForm(initialCreditForm);
    setCreditFormOpen(true);
  }

  function startCreditEdit(item) {
    setCreditEditingId(item.id);
    setCreditForm({
      customerName: item.customerName,
      invoiceNumber: item.invoiceNumber,
      amount: String(item.amount),
      paidAmount: String(item.paidAmount),
      status: item.status,
      salesRep: item.salesRep,
      dueDate: item.dueDate,
      notes: item.notes ?? ''
    });
    setCreditFormOpen(true);
  }

  function closeCreditForm() {
    setCreditFormOpen(false);
    setCreditEditingId('');
    setCreditForm(initialCreditForm);
  }

  async function handleCreditSubmit(event) {
    event.preventDefault();
    try {
      setCreditSaving(true); setError(''); setNotice('');
      const payload = { ...creditForm, amount: Number(creditForm.amount), paidAmount: Number(creditForm.paidAmount) };
      const url = creditEditingId ? `/api/credit-sales/${creditEditingId}` : '/api/credit-sales';
      const method = creditEditingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { throw new Error(await getApiErrorMessage(res, 'تعذر حفظ سجل مبيعات الآجل')); }
      const refreshed = await fetch('/api/credit-sales'); if (refreshed.ok) setCreditSales(await refreshed.json());
      closeCreditForm();
      setNotice(creditEditingId ? 'تم تعديل سجل مبيعات الآجل بنجاح.' : 'تمت إضافة سجل مبيعات الآجل بنجاح.');
    } catch (requestError) { setError(requestError.message); } finally { setCreditSaving(false); }
  }

  function requestCreditDelete(id) {
    setDeleteTarget({ type: 'credit', id });
  }

  async function confirmCreditDelete() {
    const id = deleteTarget.id; setDeleteTarget(null);
    try {
      setError(''); setNotice('');
      await fetch(`/api/credit-sales/${id}`, { method: 'DELETE' });
      const refreshed = await fetch('/api/credit-sales'); if (refreshed.ok) setCreditSales(await refreshed.json());
      setNotice('تم حذف سجل مبيعات الآجل بنجاح.');
    } catch (requestError) { setError(requestError.message); }
  }

  // ── Returns ────────────────────────────────────────────
  function handleReturnsInputChange(event) {
    const { name, value } = event.target;
    setReturnsForm((current) => ({ ...current, [name]: value }));
  }

  function openReturnsForm() {
    setReturnsEditingId('');
    setReturnsForm(initialReturnsForm);
    setReturnsFormOpen(true);
  }

  function startReturnsEdit(item) {
    setReturnsEditingId(item.id);
    setReturnsForm({
      customerName: item.customerName,
      productName: item.productName || '',
      originalInvoiceNumber: item.originalInvoiceNumber,
      amount: String(item.amount),
      reason: item.reason,
      status: item.status,
      salesRep: item.salesRep,
      returnDate: item.returnDate,
      notes: item.notes ?? ''
    });
    setReturnsFormOpen(true);
  }

  function closeReturnsForm() {
    setReturnsFormOpen(false);
    setReturnsEditingId('');
    setReturnsForm(initialReturnsForm);
  }

  async function handleReturnsSubmit(event) {
    event.preventDefault();
    try {
      setReturnsSaving(true); setError(''); setNotice('');
      const payload = { ...returnsForm, amount: Number(returnsForm.amount) };
      const url = returnsEditingId ? `/api/returns/${returnsEditingId}` : '/api/returns';
      const method = returnsEditingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { throw new Error(await getApiErrorMessage(res, 'تعذر حفظ المرتجع')); }
      const refreshed = await fetch('/api/returns'); if (refreshed.ok) setReturns(await refreshed.json());
      closeReturnsForm();
      setNotice(returnsEditingId ? 'تم تعديل المرتجع بنجاح.' : 'تمت إضافة المرتجع بنجاح.');
    } catch (requestError) { setError(requestError.message); } finally { setReturnsSaving(false); }
  }

  function requestReturnsDelete(id) {
    setDeleteTarget({ type: 'returns', id });
  }

  async function confirmReturnsDelete() {
    const id = deleteTarget.id; setDeleteTarget(null);
    try {
      setError(''); setNotice('');
      await fetch(`/api/returns/${id}`, { method: 'DELETE' });
      const refreshed = await fetch('/api/returns'); if (refreshed.ok) setReturns(await refreshed.json());
      setNotice('تم حذف المرتجع بنجاح.');
    } catch (requestError) { setError(requestError.message); }
  }

  // ── Price List ─────────────────────────────────────────
  function handlePriceListInputChange(event) {
    const { name, value } = event.target;
    setPriceListForm((current) => ({ ...current, [name]: value }));
  }

  function openPriceListForm() {
    setPriceListEditingId('');
    setPriceListForm(initialPriceListForm);
    setPriceListFormOpen(true);
  }

  function startPriceListEdit(item) {
    setPriceListEditingId(item.id);
    setPriceListForm({
      productName: item.productName,
      category: item.category ?? '',
      purchasePrice: String(item.purchasePrice),
      sellingPrice: String(item.sellingPrice),
      notes: item.notes ?? ''
    });
    setPriceListFormOpen(true);
  }

  function closePriceListForm() {
    setPriceListFormOpen(false);
    setPriceListEditingId('');
    setPriceListForm(initialPriceListForm);
  }

  async function handlePriceListSubmit(event) {
    event.preventDefault();
    try {
      setPriceListSaving(true); setError(''); setNotice('');
      const payload = { ...priceListForm, purchasePrice: Number(priceListForm.purchasePrice), sellingPrice: Number(priceListForm.sellingPrice) };
      const url = priceListEditingId ? `/api/price-list/${priceListEditingId}` : '/api/price-list';
      const method = priceListEditingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { throw new Error(await getApiErrorMessage(res, 'تعذر حفظ المنتج')); }
      const refreshed = await fetch('/api/price-list'); if (refreshed.ok) setPriceList(await refreshed.json());
      closePriceListForm();
      setNotice(priceListEditingId ? 'تم تعديل المنتج بنجاح.' : 'تمت إضافة المنتج بنجاح.');
    } catch (requestError) { setError(requestError.message); } finally { setPriceListSaving(false); }
  }

  function requestPriceListDelete(id) {
    setDeleteTarget({ type: 'price-list', id });
  }

  async function confirmPriceListDelete() {
    const id = deleteTarget.id; setDeleteTarget(null);
    try {
      setError(''); setNotice('');
      await fetch(`/api/price-list/${id}`, { method: 'DELETE' });
      const refreshed = await fetch('/api/price-list'); if (refreshed.ok) setPriceList(await refreshed.json());
      setNotice('تم حذف المنتج بنجاح.');
    } catch (requestError) { setError(requestError.message); }
  }


  // ── Custodies ─────────────────────────────────────────
  function handleCustodyInputChange(event) {
    const { name, value } = event.target;
    setCustodyForm((current) => ({ ...current, [name]: value }));
  }

  function openCustodyForm() {
    loadEmployeeUsers();
    setCustodyEditingId('');
    setCustodyForm(initialCustodyForm);
    setCustodyFormOpen(true);
  }

  function startCustodyEdit(item) {
    loadEmployeeUsers();
    setCustodyEditingId(item.id);
    setCustodyForm({
      employeeName: item.employeeName,
      custodyType: item.custodyType,
      itemDetails: item.itemDetails,
      initialAmount: String(item.initialAmount ?? 0),
      status: item.status,
      startDate: item.startDate,
      notes: item.notes ?? ''
    });
    setCustodyFormOpen(true);
  }

  function closeCustodyForm() {
    setCustodyFormOpen(false);
    setCustodyEditingId('');
    setCustodyForm(initialCustodyForm);
  }

  async function handleCustodySubmit(event) {
    event.preventDefault();
    try {
      setCustodiesSaving(true); setError(''); setNotice('');
      const payload = { ...custodyForm, initialAmount: Number(custodyForm.initialAmount) };
      const url = custodyEditingId ? `/api/custodies/${custodyEditingId}` : '/api/custodies';
      const method = custodyEditingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { throw new Error(await getApiErrorMessage(res, 'تعذر حفظ العهدة')); }
      const refreshed = await fetch('/api/custodies'); if (refreshed.ok) setCustodies(await refreshed.json());
      closeCustodyForm();
      setNotice(custodyEditingId ? 'تم تعديل العهدة بنجاح.' : 'تمت إضافة العهدة بنجاح.');
    } catch (requestError) { setError(requestError.message); } finally { setCustodiesSaving(false); }
  }

  function requestCustodyDelete(id) {
    setDeleteTarget({ type: 'custodies', id });
  }

  async function confirmCustodyDelete() {
    const id = deleteTarget.id; setDeleteTarget(null);
    try {
      setError(''); setNotice('');
      await fetch(`/api/custodies/${id}`, { method: 'DELETE' });
      const refreshed = await fetch('/api/custodies'); if (refreshed.ok) setCustodies(await refreshed.json());
      setNotice('تم حذف العهدة بنجاح.');
    } catch (requestError) { setError(requestError.message); }
  }

  async function openCustodyTransactions(id) {
    setActiveCustodyId(id);
    setError('');
    try {
      const res = await fetch(`/api/custodies/${id}/transactions`);
      setActiveCustodyTransactions(res.ok ? await res.json() : []);
    } catch { setActiveCustodyTransactions([]); }
    setTransactionsModalOpen(true);
    setTransactionForm(initialTransactionForm);
  }

  async function getApiErrorMessage(response, fallbackMessage = 'تعذر تنفيذ الطلب') {
    try {
      const data = await response.json();
      if (typeof data === 'string' && data.trim()) return data.trim();
      if (data && typeof data === 'object') {
        if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
        if (typeof data.error === 'string' && data.error.trim()) return data.error.trim();
        if (typeof data.detail === 'string' && data.detail.trim()) return data.detail.trim();
      }
    } catch {
      // Response might not be JSON, fallback to text.
    }
    try {
      const text = await response.text();
      if (text && text.trim()) return text.trim();
    } catch {
      // Ignore read failures and return fallback.
    }
    return `${fallbackMessage}. (${response.status})`;
  }

  function closeTransactionsModal() {
    setTransactionsModalOpen(false);
    setActiveCustodyId(null);
    setActiveCustodyTransactions([]);
  }

  function handleTransactionInputChange(event) {
    const { name, value } = event.target;
    setTransactionForm((current) => ({ ...current, [name]: value }));
  }

  async function handleTransactionSubmit(event) {
    event.preventDefault();
    try {
      setTransactionSaving(true); setError(''); setNotice('');
      const payload = { ...transactionForm, amount: Number(transactionForm.amount) };
      const res = await fetch(`/api/custodies/${activeCustodyId}/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { throw new Error(await getApiErrorMessage(res, 'تعذر تسجيل الحركة')); }
      const txRes = await fetch(`/api/custodies/${activeCustodyId}/transactions`);
      if (txRes.ok) setActiveCustodyTransactions(await txRes.json());
      const custRes = await fetch('/api/custodies'); if (custRes.ok) setCustodies(await custRes.json());
      setNotice('تم تسجيل الحركة بنجاح.');
      setTransactionForm(initialTransactionForm);
    } catch (requestError) { setError(requestError.message); } finally { setTransactionSaving(false); }
  }

  function requestTransactionDelete(id) {
    setDeleteTarget({ type: 'transaction', id });
  }

  // ── Generic CRUD helper ────────────────────────────────
  function makeModuleCrud(apiPath, setData, form, setForm, initialForm, editingId, setEditingId, saving, setSaving, formOpen, setFormOpen, mapToPayload, mapToForm, deleteType, entityLabel, afterSave) {
    function handleInput(e) { const { name, value } = e.target; setForm(c => ({ ...c, [name]: value })); }
    function openForm() { setEditingId(''); setForm(initialForm); setFormOpen(true); }
    function startEdit(item) { setEditingId(item.id); setForm(mapToForm(item)); setFormOpen(true); }
    function closeForm() { setFormOpen(false); setEditingId(''); setForm(initialForm); }
    async function handleSubmit(e) {
      e.preventDefault();
      try {
        setSaving(true); setError(''); setNotice('');
        const payload = mapToPayload(form);
        const url = editingId ? `/api${apiPath}/${editingId}` : `/api${apiPath}`;
        const method = editingId ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) {
          const message = await getApiErrorMessage(res, 'تعذر تنفيذ الطلب');
          throw new Error(message);
        }
        const refreshed = await fetch(`/api${apiPath}`);
        if (refreshed.ok) setData(await refreshed.json());
        if (afterSave) await afterSave();
        closeForm();
        setNotice(editingId ? `تم تعديل ${entityLabel} بنجاح.` : `تمت إضافة ${entityLabel} بنجاح.`);
      } catch (err) { setError(err.message); } finally { setSaving(false); }
    }
    function requestDelete(id) { setDeleteTarget({ type: deleteType, id }); }
    async function confirmDelete() {
      const id = deleteTarget.id; setDeleteTarget(null);
      try {
        setError(''); setNotice('');
        const res = await fetch(`/api${apiPath}/${id}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 404) {
          const message = await getApiErrorMessage(res, 'خطأ في الحذف');
          throw new Error(message);
        }
        const refreshed = await fetch(`/api${apiPath}`);
        if (refreshed.ok) setData(await refreshed.json());
        setNotice(`تم حذف ${entityLabel} بنجاح.`);
      } catch (err) { setError(err.message); }
    }
    return { handleInput, openForm, startEdit, closeForm, handleSubmit, requestDelete, confirmDelete };
  }

  const fpCrud = makeModuleCrud('/final-product-store', setFinalProductStore, fpForm, setFpForm, initialFinalProductForm, fpEditingId, setFpEditingId, fpSaving, setFpSaving, fpFormOpen, setFpFormOpen,
    f => ({ ...f, quantity: Number(f.quantity||0), minStock: Number(f.minStock||0) }),
    i => ({ productName: i.productName, category: i.category, quantity: String(i.quantity), unit: i.unit, minStock: String(i.minStock), status: i.status, notes: i.notes||'' }),
    'fp', 'المنتج');

  const rmCrud = makeModuleCrud('/raw-materials-store', setRawMaterialsStore, rmForm, setRmForm, initialRawMaterialForm, rmEditingId, setRmEditingId, rmSaving, setRmSaving, rmFormOpen, setRmFormOpen,
    f => {
      const matchedMaterial = Array.isArray(rawMaterialsCatalog?.items)
        ? rawMaterialsCatalog.items.find((item) => item?.name === f.materialName)
        : null;
      return {
        ...f,
        category: matchedMaterial?.category ?? f.category,
        quantity: Number(f.quantity||0),
        minStock: Number(f.minStock||0)
      };
    },
    i => ({ materialName: i.materialName, category: i.category, quantity: String(i.quantity), unit: i.unit, minStock: String(i.minStock), status: i.status, notes: i.notes||'' }),
    'rm', 'الخامة');

  const rssCrud = makeModuleCrud('/rep-sub-stores', setRepSubStores, rssForm, setRssForm, initialRepSubStoreForm, rssEditingId, setRssEditingId, rssSaving, setRssSaving, rssFormOpen, setRssFormOpen,
    f => ({ ...f, quantity: Number(f.quantity||0) }),
    i => ({ repName: i.repName, productName: i.productName, quantity: String(i.quantity), deliveryDate: i.deliveryDate||'', status: i.status, notes: i.notes||'' }),
    'rss', 'السجل');

  const fmcCrud = makeModuleCrud('/financial-manager-custody', setFinManagerCustody, fmcForm, setFmcForm, initialFinManagerCustodyForm, fmcEditingId, setFmcEditingId, fmcSaving, setFmcSaving, fmcFormOpen, setFmcFormOpen,
    f => ({ ...f, amount: Number(f.amount||0) }),
    i => ({ employeeName: i.employeeName, amount: String(i.amount), purpose: i.purpose, custodyDate: i.custodyDate||'', status: i.status, notes: i.notes||'' }),
    'fmc', 'العهدة',
    async () => { const r = await fetch('/api/custodies'); if (r.ok) setCustodies(await r.json()); });

  const rmpCrud = makeModuleCrud('/raw-materials-purchases', setRawPurchases, rmpForm, setRmpForm, initialRawPurchaseForm, rmpEditingId, setRmpEditingId, rmpSaving, setRmpSaving, rmpFormOpen, setRmpFormOpen,
    f => ({ ...f, quantity: Number(f.quantity||0), unitPrice: Number(f.unitPrice||0) }),
    i => ({ supplierName: i.supplierName, materialName: i.materialName, quantity: String(i.quantity), unitPrice: String(i.unitPrice), purchaseDate: i.purchaseDate||'', invoiceNumber: i.invoiceNumber, notes: i.notes||'' }),
    'rmp', 'الفاتورة');
  const rmcCrud = makeModuleCrud('/raw-materials-catalog', setRawMaterialsCatalog, rmcForm, setRmcForm, initialRawMaterialCatalogForm, rmcEditingId, setRmcEditingId, rmcSaving, setRmcSaving, rmcFormOpen, setRmcFormOpen,
    f => ({ ...f }),
    i => ({ name: i.name, category: i.category || '', notes: i.notes || '' }),
    'rmc', 'الخامة');
  const supCrud = makeModuleCrud('/suppliers', setSuppliers, supForm, setSupForm, initialSupplierForm, supEditingId, setSupEditingId, supSaving, setSupSaving, supFormOpen, setSupFormOpen,
    f => ({ ...f }),
    i => ({ name: i.name, notes: i.notes || '' }),
    'sup', 'المورد');

  const mmpCrud = makeModuleCrud('/machine-maintenance-purchases', setMachinePurchases, mmpForm, setMmpForm, initialMachinePurchaseForm, mmpEditingId, setMmpEditingId, mmpSaving, setMmpSaving, mmpFormOpen, setMmpFormOpen,
    f => ({ ...f, amount: Number(f.amount||0) }),
    i => ({ supplierName: i.supplierName, description: i.description, amount: String(i.amount), purchaseDate: i.purchaseDate||'', machineName: i.machineName, invoiceNumber: i.invoiceNumber, notes: i.notes||'' }),
    'mmp', 'العملية');

  const mscCrud = makeModuleCrud('/misc-purchases', setMiscPurchases, mscForm, setMscForm, initialMiscPurchaseForm, mscEditingId, setMscEditingId, mscSaving, setMscSaving, mscFormOpen, setMscFormOpen,
    f => ({ ...f, amount: Number(f.amount||0) }),
    i => ({ description: i.description, amount: String(i.amount), category: i.category, purchaseDate: i.purchaseDate||'', receiptNumber: i.receiptNumber, notes: i.notes||'' }),
    'msc', 'المصروف');

  const payCrud = makeModuleCrud('/payroll-advances', setPayrollAdvances, payForm, setPayForm, initialPayrollAdvanceForm, payEditingId, setPayEditingId, paySaving, setPaySaving, payFormOpen, setPayFormOpen,
    f => ({ ...f, amount: Number(f.amount||0) }),
    i => ({ employeeName: i.employeeName, type: i.type, amount: String(i.amount), month: i.month, status: i.status, notes: i.notes||'' }),
    'pay', 'السجل');

  const cpaCrud = makeModuleCrud('/customer-payment-alerts', setPaymentAlerts, cpaForm, setCpaForm, initialPaymentAlertForm, cpaEditingId, setCpaEditingId, cpaSaving, setCpaSaving, cpaFormOpen, setCpaFormOpen,
    f => ({ ...f, amount: Number(f.amount||0) }),
    i => ({ customerName: i.customerName, amount: String(i.amount), dueDate: i.dueDate||'', alertType: i.alertType, status: i.status, notes: i.notes||'' }),
    'cpa', 'التنبيه');

  const fsCrud = makeModuleCrud('/free-samples', setFreeSamples, fsForm, setFsForm, initialFreeSampleForm, fsEditingId, setFsEditingId, fsSaving, setFsSaving, fsFormOpen, setFsFormOpen,
    f => ({ ...f, quantity: Number(f.quantity||1) }),
    i => ({ customerName: i.customerName, productName: i.productName, quantity: String(i.quantity), unit: i.unit, reason: i.reason||'', sampleDate: i.sampleDate||'', notes: i.notes||'' }),
    'fs', 'العينة');

  const pcCrud = makeModuleCrud('/product-cards', setProductCards, pcForm, setPcForm, initialProductCardForm, pcEditingId, setPcEditingId, pcSaving, setPcSaving, pcFormOpen, setPcFormOpen,
    f => ({ ...f }),
    i => ({ productName: i.productName, category: i.category||'', unit: i.unit||'قطعة', code: i.code||'', notes: i.notes||'' }),
    'pc', 'الصنف');

  async function confirmTransactionDelete() {
    const id = deleteTarget.id; setDeleteTarget(null);
    try {
      setError(''); setNotice('');
      await fetch(`/api/custodies/${activeCustodyId}/transactions/${id}`, { method: 'DELETE' });
      const txRes = await fetch(`/api/custodies/${activeCustodyId}/transactions`);
      if (txRes.ok) setActiveCustodyTransactions(await txRes.json());
      const custRes = await fetch('/api/custodies'); if (custRes.ok) setCustodies(await custRes.json());
      setNotice('تم التراجع عن الحركة بنجاح.');
    } catch (requestError) { setError(requestError.message); }
  }

  async function handleSetFmcBudget(e) {
    e.preventDefault();
    const v = Number(fmcBudgetInput);
    if (isNaN(v) || v < 0) return;
    try {
      const res = await fetch('/api/financial-manager-custody/budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: v })
      });
      if (res.ok) {
        setFmcBudgetInput('');
        const fmcRes = await fetch('/api/financial-manager-custody');
        if (fmcRes.ok) setFinManagerCustody(await fmcRes.json());
        setNotice('تم تحديث ميزانية المدير المالي.');
      }
    } catch (err) { setError(err.message); }
  }

  function openFmcAssignForm(managerRecord) {
    setActiveManagerCustodyId(managerRecord.id);
    setFmcEditingId('');
    setFmcAssignForm({
      employeeName: '',
      amount: '',
      purpose: managerRecord.purpose || '',
      custodyDate: managerRecord.custodyDate || getTodayLocalDateKey(),
      status: 'نشطة',
      notes: managerRecord.notes || ''
    });
    loadEmployeeUsers();
    setFmcAssignOpen(true);
  }

  function openFmcEditForm(managerRecord) {
    if (auth?.user?.role !== 'manager' && auth?.user?.role !== 'admin') {
      setError('تعديل عهدة المدير متاح للمدير فقط.');
      return;
    }
    loadEmployeeUsers();
    setFmcAssignOpen(false);
    setActiveManagerCustodyId('');
    setError('');
    fmcCrud.startEdit(managerRecord);
  }

  async function handleFmcAssignSubmit(e) {
    e.preventDefault();
    if (!activeManagerCustodyId) return;
    try {
      setFmcSaving(true);
      setError('');
      setNotice('');
      const payload = {
        employeeName: fmcAssignForm.employeeName,
        amount: Number(fmcAssignForm.amount || 0),
        custodyDate: fmcAssignForm.custodyDate || null,
        notes: fmcAssignForm.notes || ''
      };
      const res = await fetch(`/api/financial-manager-custody/${activeManagerCustodyId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'تعذر تعيين العهدة.');

      const [fmcRes, custodiesRes] = await Promise.all([
        fetch('/api/financial-manager-custody'),
        fetch('/api/custodies')
      ]);
      if (fmcRes.ok) setFinManagerCustody(await fmcRes.json());
      if (custodiesRes.ok) setCustodies(await custodiesRes.json());

      setFmcAssignOpen(false);
      setActiveManagerCustodyId('');
      setNotice('تم تعيين عهدة الموظف وخصمها من عهدة المدير بنجاح.');
    } catch (err) {
      setError(err.message);
    } finally {
      setFmcSaving(false);
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'sales') confirmSalesDelete();
    else if (deleteTarget.type === 'credit') confirmCreditDelete();
    else if (deleteTarget.type === 'returns') confirmReturnsDelete();
    else if (deleteTarget.type === 'price-list') confirmPriceListDelete();
    else if (deleteTarget.type === 'custodies') confirmCustodyDelete();
    else if (deleteTarget.type === 'transaction') confirmTransactionDelete();
    else if (deleteTarget.type === 'check') confirmCheckDelete();
    else if (deleteTarget.type === 'cash') confirmCashDelete();
    else if (deleteTarget.type === 'fp') fpCrud.confirmDelete();
    else if (deleteTarget.type === 'rm') rmCrud.confirmDelete();
    else if (deleteTarget.type === 'rss') rssCrud.confirmDelete();
    else if (deleteTarget.type === 'fmc') fmcCrud.confirmDelete();
    else if (deleteTarget.type === 'rmp') rmpCrud.confirmDelete();
    else if (deleteTarget.type === 'rmc') rmcCrud.confirmDelete();
    else if (deleteTarget.type === 'sup') supCrud.confirmDelete();
    else if (deleteTarget.type === 'mmp') mmpCrud.confirmDelete();
    else if (deleteTarget.type === 'msc') mscCrud.confirmDelete();
    else if (deleteTarget.type === 'pay') payCrud.confirmDelete();
    else if (deleteTarget.type === 'cpa') cpaCrud.confirmDelete();
    else if (deleteTarget.type === 'fs') fsCrud.confirmDelete();
    else if (deleteTarget.type === 'pc') pcCrud.confirmDelete();
  }

  async function handleTransferSubmit(e) {
    e.preventDefault();
    try {
      setTransferSaving(true); setError(''); setNotice('');
      const res = await fetch('/api/rep-sub-stores/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...transferForm, quantity: Number(transferForm.quantity) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'خطأ في النقل');
      const [rssR, fpR] = await Promise.all([fetch('/api/rep-sub-stores'), fetch('/api/final-product-store')]);
      if (rssR.ok) setRepSubStores(await rssR.json());
      if (fpR.ok) setFinalProductStore(await fpR.json());
      setTransferFormOpen(false);
      setTransferForm({ repName: '', productName: '', quantity: '', deliveryDate: '', notes: '' });
      setNotice(`تم نقل ${data.deducted} وحدة إلى المندوب. المتبقي في المخزن: ${data.remainingInStore}`);
    } catch (err) { setError(err.message); } finally { setTransferSaving(false); }
  }

  async function handleSaleDeductSubmit(e) {
    e.preventDefault();
    try {
      setSaleDeductSaving(true); setError(''); setNotice('');
      const res = await fetch('/api/rep-sub-stores/sale-deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...saleDeductForm, quantity: Number(saleDeductForm.quantity) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'خطأ في الخصم');
      const rssR = await fetch('/api/rep-sub-stores');
      if (rssR.ok) setRepSubStores(await rssR.json());
      setSaleDeductOpen(false);
      setSaleDeductForm({ repName: '', productName: '', quantity: '' });
      setNotice(`تم خصم الكمية من مخزن المندوب. المتبقي: ${data.quantity}`);
    } catch (err) { setError(err.message); } finally { setSaleDeductSaving(false); }
  }

  async function handleProductCardsExcelFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setPcImporting(true);
      setError('');
      setNotice('');

      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheetName = workbook.SheetNames?.[0];
      if (!firstSheetName) throw new Error('الملف لا يحتوي على أي Sheet.');

      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { header: 1, defval: '', raw: false });
      if (!rows.length) throw new Error('الملف فارغ.');

      const normalizeHeader = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const headerRow = Array.isArray(rows[0]) ? rows[0] : [];
      const aliases = ['item name', 'itemname', 'اسم الصنف', 'الصنف', 'اسم المنتج', 'item'];
      let nameColumnIndex = headerRow.findIndex((cell) => aliases.includes(normalizeHeader(cell)));
      if (nameColumnIndex === -1) nameColumnIndex = 0;

      const names = rows
        .slice(1)
        .map((row) => String(Array.isArray(row) ? row[nameColumnIndex] : '').trim())
        .filter(Boolean);

      if (names.length === 0) {
        throw new Error('لم يتم العثور على أسماء أصناف. تأكد أن العمود Item Name موجود وممتلئ.');
      }

      const importRes = await fetch('/api/product-cards/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names })
      });
      const importData = await importRes.json().catch(() => ({}));

      if (!importRes.ok) {
        throw new Error(importData.message || 'فشل استيراد الأصناف من الإكسل.');
      }

      const refreshed = await fetch('/api/product-cards');
      if (refreshed.ok) setProductCards(await refreshed.json());

      setNotice(`تم استيراد ${importData.insertedCount ?? 0} صنف. تم تجاهل ${importData.duplicateCount ?? 0} مكرر و${importData.emptyCount ?? 0} صف فارغ.`);
    } catch (err) {
      setError(err.message || 'تعذر قراءة ملف الإكسل.');
    } finally {
      if (event.target) event.target.value = '';
      setPcImporting(false);
    }
  }

  const deleteMessages = {
    sales: 'هل أنت متأكد من حذف عملية البيع هذه؟ لا يمكن التراجع عن هذا الإجراء.',
    credit: 'هل أنت متأكد من حذف سجل مبيعات الآجل هذا؟ لا يمكن التراجع عن هذا الإجراء.',
    returns: 'هل أنت متأكد من حذف هذا المرتجع؟ لا يمكن التراجع عن هذا الإجراء.',
    'price-list': 'هل أنت متأكد من حذف هذا المنتج من قائمة الأسعار؟ لا يمكن التراجع عن هذا الإجراء.',
    custodies: 'هل أنت متأكد من حذف العهدة؟ لا يمكن التراجع، سيتم حذف جميع الحركات المتعلقة.',
    transaction: 'هل أنت متأكد من حذف هذه الحركة؟ سيتم استرجاع رصيد العهدة كالمعاملة العكسية.',
    check: 'هل أنت متأكد من حذف هذا الشيك؟ لا يمكن التراجع عن هذا الإجراء.',
    cash: 'هل أنت متأكد من حذف هذه الدفعة النقدية؟ لا يمكن التراجع عن هذا الإجراء.',
    fp: 'هل أنت متأكد من حذف هذا المنتج من المخزن؟ لا يمكن التراجع عن هذا الإجراء.',
    rm: 'هل أنت متأكد من حذف هذه الخامة؟ لا يمكن التراجع عن هذا الإجراء.',
    rss: 'هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.',
    fmc: 'هل أنت متأكد من حذف هذه العهدة؟ لا يمكن التراجع عن هذا الإجراء.',
    rmp: 'هل أنت متأكد من حذف فاتورة المشتريات؟ لا يمكن التراجع عن هذا الإجراء.',
    rmc: 'هل أنت متأكد من حذف هذه الخامة المسجلة؟',
    sup: 'هل أنت متأكد من حذف هذا المورد؟',
    mmp: 'هل أنت متأكد من حذف عملية الصيانة؟ لا يمكن التراجع عن هذا الإجراء.',
    msc: 'هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.',
    pay: 'هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.',
    cpa: 'هل أنت متأكد من حذف هذا التنبيه؟ لا يمكن التراجع عن هذا الإجراء.',
    fs: 'هل أنت متأكد من حذف هذه العينة؟ لا يمكن التراجع عن هذا الإجراء.',
    pc: 'هل أنت متأكد من حذف كارت الصنف هذا؟ لا يمكن التراجع عن هذا الإجراء.'
  };

  const title = filteredNavigation.find((item) => item.id === activeView)?.label ?? 'لوحة التحكم';
  const placeholderModule = placeholderModuleConfig[activeView] ?? null;
  const displayName = auth.user.displayName;
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const notificationsCount = checkNotification && !notificationDismissed ? checkNotification.count : 0;
  const availableEmployeeUsers = Array.isArray(employeeUsers)
    ? employeeUsers.filter((user) => user && typeof user === 'object' && user.displayName)
    : [];
  const employeeOptionsWithFallback = availableEmployeeUsers.length > 0
    ? availableEmployeeUsers
    : auth?.user?.displayName
      ? [{ id: auth.user.id ?? 'current-user', displayName: auth.user.displayName, code: auth.user.code ?? '', role: auth.user.role }]
      : [];
  const adminEmployeeOptions = availableEmployeeUsers.filter((user) => user.role === 'admin');
  const adminEmployeeOptionsWithFallback = adminEmployeeOptions.length > 0
    ? adminEmployeeOptions
    : auth?.user?.role === 'admin' && auth?.user?.displayName
      ? [{ id: auth.user.id ?? 'current-user', displayName: auth.user.displayName, code: auth.user.code ?? '', role: auth.user.role }]
      : [];
  const materialNameOptions = Array.isArray(rawMaterialsCatalog?.items)
    ? rawMaterialsCatalog.items.map((item) => item?.name).filter(Boolean)
    : [];
  const materialCategoryByName = Array.isArray(rawMaterialsCatalog?.items)
    ? Object.fromEntries(rawMaterialsCatalog.items.filter((item) => item?.name).map((item) => [item.name, item.category || '']))
    : {};
  const supplierNameOptions = Array.isArray(suppliers?.items)
    ? suppliers.items.map((item) => item?.name).filter(Boolean)
    : [];
  const priceListProductOptions = Array.isArray(priceList?.items)
    ? priceList.items.map((item) => item?.productName).filter(Boolean)
    : [];
  const salesRepOptions = Array.from(new Set([
    ...registeredReps.map((rep) => rep.displayName).filter(Boolean),
    ...availableEmployeeUsers.filter((user) => user.role === 'sales').map((user) => user.displayName).filter(Boolean),
    ...(repSubStores?.items || []).map((item) => item?.repName).filter(Boolean)
  ]));
  const allSalesProductOptions = Array.from(new Set((repSubStores?.items || []).map((item) => item?.productName).filter(Boolean)));
  const salesProductOptions = salesRepProducts.length > 0
    ? salesRepProducts
    : salesForm.salesRep
      ? Array.from(new Set(
          (repSubStores?.items || []).filter(
            (item) => item?.repName?.trim().toLowerCase() === salesForm.salesRep?.trim().toLowerCase()
          ).map((item) => item?.productName).filter(Boolean)
        ))
      : allSalesProductOptions;
  const transferRepOptions = Array.from(new Set([
    ...repUsers.map((user) => user?.displayName).filter(Boolean),
    ...(repSubStores?.items || []).map((item) => item?.repName).filter(Boolean)
  ]));
  const transferProductOptions = Array.from(new Set((finalProductStore?.items || []).map((item) => item?.productName).filter(Boolean)));
  const activeManagerCustodyAvailable = Array.isArray(finManagerCustody?.items)
    ? finManagerCustody.items
      .filter((item) => item?.status === 'نشطة')
      .reduce((sum, item) => sum + Number(item?.amount ?? 0), 0)
    : 0;
  const hasActiveManagerCustodyBalance = Array.isArray(finManagerCustody?.items)
    ? finManagerCustody.items.some((item) => item?.status === 'نشطة' && Number(item?.amount ?? 0) > 0)
    : false;
  const rawPurchasesAddBlockedReason = 'لا يمكن إضافة فاتورة شراء بدون عهدة مدير مالي نشطة وبرصيد متاح.';
  const machinePurchasesAddBlockedReason = 'لا يمكن إضافة عملية صيانة بدون عهدة مدير مالي نشطة وبرصيد متاح.';
  const miscPurchasesAddBlockedReason = 'لا يمكن إضافة مصروف نثري بدون عهدة مدير مالي نشطة وبرصيد متاح.';
  const payrollAddBlockedReason = 'لا يمكن إضافة راتب أو سلفة بدون عهدة مدير مالي نشطة وبرصيد متاح.';

  function handleFmcSubmitLimited(event) {
    const isAllowedAdmin = adminEmployeeOptionsWithFallback.some((user) => user.displayName === fmcForm.employeeName);
    if (!isAllowedAdmin) {
      event.preventDefault();
      setError('يمكن اختيار مستخدم بدور admin فقط في عهدة المدير المالي.');
      return;
    }
    fmcCrud.handleSubmit(event);
  }

  return (
    <div className="app-shell" dir="rtl">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="workspace-topbar card">
        <div>
          <h2>{title}</h2>
        </div>
        <div className="topbar-actions">
          <div className="user-profile-chip" title={auth.user.username}>
            <div className="user-profile-meta">
              <span>{ROLE_LABELS_FE[auth.user.role] ?? auth.user.role}</span>
              <strong>{displayName}</strong>
            </div>
            <div className="user-avatar" aria-hidden="true">{avatarInitial}</div>
          </div>
          <button type="button" className="ghost-button small" onClick={onLogout} title="تسجيل الخروج" style={{ minHeight: '40px', padding: '0 14px', fontSize: '0.9rem' }}>خروج</button>

          <button
            type="button"
            className={`notification-icon-button ${notificationsCount > 0 ? 'has-alert' : ''}`}
            onClick={() => {
              navigateTo('notifications');
              setNotificationDismissed(true);
            }}
            aria-label="تنبيهات التحصيل"
            title={notificationsCount > 0 ? `${notificationsCount} تنبيه جديد` : 'لا توجد تنبيهات جديدة'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3a5 5 0 0 0-5 5v1.28c0 .9-.31 1.77-.88 2.46L4.5 13.7a1 1 0 0 0 .77 1.63h13.46a1 1 0 0 0 .77-1.63l-1.62-1.96A3.98 3.98 0 0 1 17 9.28V8a5 5 0 0 0-5-5Zm0 18a3 3 0 0 0 2.83-2H9.17A3 3 0 0 0 12 21Z" />
            </svg>
            {notificationsCount > 0 ? (
              <span className="notification-count">{notificationsCount > 99 ? '99+' : notificationsCount}</span>
            ) : null}
          </button>

          <button type="button" className="menu-toggle" onClick={() => setIsMobileMenuOpen(true)} aria-label="فتح القائمة">
            ☰
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />
      )}

      <aside className={`sidebar card ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <nav className="sidebar-nav">
          {groupedNavigation.map((group) => {
            const isOpen = expandedNavGroups[group.id] !== false;
            return (
              <section key={group.id} className={`nav-group ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="nav-group-toggle"
                  onClick={() => toggleNavGroup(group.id)}
                  aria-expanded={isOpen}
                >
                  <strong>{group.label}</strong>
                  <span className="nav-group-chevron" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
                </button>
                {isOpen ? (
                  <div className="nav-group-links">
                    {group.items.map((item) => (
                      <a
                        key={item.id}
                        className={`nav-link ${activeView === item.id ? 'active' : ''}`}
                        href={`#${item.id}`}
                        onClick={() => navigateTo(item.id)}
                      >
                        <strong>
                          {item.label}
                          {item.id === 'checks' && checkNotification && !notificationDismissed && (
                            <span className="nav-badge">{checkNotification.count}</span>
                          )}
                        </strong>
                        <span>{item.helper}</span>
                      </a>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        {notice ? <section className="notice success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span>{notice}</span><button type="button" onClick={() => setNotice('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'inherit', padding: '0 4px', lineHeight: 1 }} aria-label="إغلاق">✕</button></section> : null}
        {loading ? <section className="notice">جارٍ تحميل بيانات النظام...</section> : null}
        {error ? <section className="notice error">{error}</section> : null}

        {activeView === 'users' && isAdmin ? (
          <UsersPage token={auth.token} />
        ) : null}

        {activeView === 'roles' && isAdmin ? (
          <RolesPage token={auth.token} />
        ) : null}

        {activeView === 'reps-management' && (auth.user.role === 'admin' || auth.user.role === 'manager') ? (
          <RepsPage token={auth.token} />
        ) : null}

        {!loading && activeView === 'dashboard' ? (
          <DashboardView dashboard={dashboard} onNavigate={navigateTo} activeView={activeView} token={auth?.token} isAdmin={isAdmin} />
        ) : null}

        {!loading && activeView === 'sales' ? (
          <SalesView
            sales={sales}
            form={salesForm}
            salesRepOptions={salesRepOptions}
            salesProductOptions={salesProductOptions}
            customerOptions={customerOptions}
            editingId={salesEditingId}
            saving={salesSaving}
            isFormOpen={salesFormOpen}
            onOpenForm={openSalesForm}
            onCloseForm={closeSalesForm}
            onChange={handleSalesInputChange}
            onSubmit={handleSalesSubmit}
            onEdit={startSalesEdit}
            onDelete={requestSalesDelete}
          />
        ) : null}

        {!loading && activeView === 'credit-sales' ? (
          <CreditSalesView
            creditSales={creditSales}
            form={creditForm}
            editingId={creditEditingId}
            saving={creditSaving}
            isFormOpen={creditFormOpen}
            onOpenForm={openCreditForm}
            onCloseForm={closeCreditForm}
            onChange={handleCreditInputChange}
            onSubmit={handleCreditSubmit}
            onEdit={startCreditEdit}
            onDelete={requestCreditDelete}
          />
        ) : null}

        {!loading && activeView === 'returns' ? (
          <ReturnsView
            returns={returns}
            form={returnsForm}
            editingId={returnsEditingId}
            saving={returnsSaving}
            isFormOpen={returnsFormOpen}
            onOpenForm={openReturnsForm}
            onCloseForm={closeReturnsForm}
            onChange={handleReturnsInputChange}
            onSubmit={handleReturnsSubmit}
            onEdit={startReturnsEdit}
            onDelete={requestReturnsDelete}
            productOptions={priceListProductOptions}
            supplierOptions={supplierNameOptions}
          />
        ) : null}

        {!loading && activeView === 'price-list' ? (
          <PriceListView
            priceList={priceList}
            form={priceListForm}
            editingId={priceListEditingId}
            saving={priceListSaving}
            isFormOpen={priceListFormOpen}
            onOpenForm={openPriceListForm}
            onCloseForm={closePriceListForm}
            onChange={handlePriceListInputChange}
            onSubmit={handlePriceListSubmit}
            onEdit={startPriceListEdit}
            onDelete={requestPriceListDelete}
          />
        ) : null}

        {!loading && activeView === 'custodies' ? (
          <CustodiesView
            custodies={custodies}
            onManageTransactions={openCustodyTransactions}
            onDelete={requestCustodyDelete}
            canDelete={isAdmin}
          />
        ) : null}

        {!loading && activeView === 'statement' ? (
          <StatementView
            statement={statement}
            customers={customerOptions}
            onCustomerChange={handleStatementCustomerChange}
            onPrint={handleStatementPrint}
          />
        ) : null}

        {!loading && activeView === 'checks' ? (
          <ChecksView
            checks={checks}
            form={checkForm}
            editingId={checkEditingId}
            saving={checkSaving}
            isFormOpen={checkFormOpen}
            onOpenForm={openCheckForm}
            onCloseForm={closeCheckForm}
            onChange={handleCheckInputChange}
            onSubmit={handleCheckSubmit}
            onEdit={startCheckEdit}
            onDelete={requestCheckDelete}
            cashReceipts={cashReceipts}
            cashForm={cashForm}
            cashEditingId={cashEditingId}
            cashSaving={cashSaving}
            isCashFormOpen={cashFormOpen}
            onOpenCashForm={openCashForm}
            onCloseCashForm={closeCashForm}
            onCashChange={handleCashInputChange}
            onCashSubmit={handleCashSubmit}
            onCashEdit={startCashEdit}
            onCashDelete={requestCashDelete}
            supplierOptions={supplierNameOptions}
          />
        ) : null}

        {!loading && activeView === 'notifications' ? (() => {
          const today = getTodayLocalDateKey();
          const todayChecks = checks.items.filter(i => i.collectionDate === today && i.status === 'معلق');
          const soonChecks = checks.items.filter(i => {
            if (i.status !== 'معلق' || i.collectionDate === today) return false;
            const diff = (new Date(i.collectionDate) - new Date()) / 86400000;
            return diff > 0 && diff <= 7;
          });
          const overdueChecks = checks.items.filter(i => i.status === 'معلق' && i.collectionDate < today);
          const allAlerts = checks.items.filter(i => i.status === 'معلق');
          return (
            <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
              <article className="card table-card">
                <div className="table-actions-header">
                  <div>
                    <p className="eyebrow">التنبيهات</p>
                    <h3>مركز التنبيهات والاستحقاقات</h3>
                  </div>
                </div>

                {allAlerts.length === 0 ? (
                  <p className="empty-notice">لا توجد تنبيهات حالياً.</p>
                ) : (
                  <div className="table-list">
                    {overdueChecks.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <p className="eyebrow" style={{ color: 'var(--danger)', marginBottom: '8px', paddingRight: '8px' }}>✕ شيكات متأخرة — {overdueChecks.length}</p>
                        {overdueChecks.map(item => (
                          <article key={item.id} className="table-row">
                            <div className="table-main">
                              <div className="record-top">
                                <strong>{item.customerName}</strong>
                                <span className="status-chip danger">متأخر</span>
                                {item.bankName && <span className="status-chip neutral">{item.bankName}</span>}
                              </div>
                              <p>{formatDate(item.collectionDate)}{item.checkNumber ? ` — شيك رقم: ${item.checkNumber}` : ''}</p>
                            </div>
                            <div className="table-side"><strong>{formatMoney(item.amount)}</strong></div>
                          </article>
                        ))}
                      </div>
                    )}
                    {todayChecks.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <p className="eyebrow" style={{ color: 'var(--warning)', marginBottom: '8px', paddingRight: '8px' }}>🔔 تحصيل اليوم — {todayChecks.length}</p>
                        {todayChecks.map(item => (
                          <article key={item.id} className="table-row">
                            <div className="table-main">
                              <div className="record-top">
                                <strong>{item.customerName}</strong>
                                <span className="status-chip warning">اليوم</span>
                                {item.bankName && <span className="status-chip neutral">{item.bankName}</span>}
                              </div>
                              <p>{formatDate(item.collectionDate)}{item.checkNumber ? ` — شيك رقم: ${item.checkNumber}` : ''}</p>
                            </div>
                            <div className="table-side"><strong>{formatMoney(item.amount)}</strong></div>
                          </article>
                        ))}
                      </div>
                    )}
                    {soonChecks.length > 0 && (
                      <div>
                        <p className="eyebrow" style={{ color: 'var(--accent)', marginBottom: '8px', paddingRight: '8px' }}>⏰ خلال 7 أيام — {soonChecks.length}</p>
                        {soonChecks.map(item => (
                          <article key={item.id} className="table-row">
                            <div className="table-main">
                              <div className="record-top">
                                <strong>{item.customerName}</strong>
                                <span className="status-chip info">قريباً</span>
                                {item.bankName && <span className="status-chip neutral">{item.bankName}</span>}
                              </div>
                              <p>{formatDate(item.collectionDate)}{item.checkNumber ? ` — شيك رقم: ${item.checkNumber}` : ''}</p>
                            </div>
                            <div className="table-side"><strong>{formatMoney(item.amount)}</strong></div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            </section>
          );
        })() : null}

        {!loading && activeView === 'product-cards' ? (
          <GenericCrudView
            data={productCards}
            eyebrow="كبون الأصناف"
            headline="قائمة المنتجات المعتمدة في النظام"
            addLabel="إضافة صنف جديد"
            emptyLabel="لا توجد أصناف مسجلة بعد. أضف صنفاً لتتمكن من استخدامه في المخازن."
            formTitle="صنف"
            editingId={pcEditingId}
            saving={pcSaving}
            isFormOpen={pcFormOpen}
            onOpenForm={pcCrud.openForm}
            onCloseForm={pcCrud.closeForm}
            onSubmit={pcCrud.handleSubmit}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            extraActions={(
              <>
                <input
                  ref={productCardsFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleProductCardsExcelFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => productCardsFileInputRef.current?.click()}
                  disabled={pcImporting}
                >
                  {pcImporting ? 'جارٍ استيراد الإكسل...' : 'رفع ملف Excel'}
                </button>
              </>
            )}
            form={pcForm}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.productName}</strong>
                    {item.code && <span className="status-chip neutral">{item.code}</span>}
                    {item.category && <span className="status-chip neutral">{item.category}</span>}
                    <span className="status-chip calm">{item.unit}</span>
                  </div>
                </div>
                <div className="table-side">
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => pcCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => pcCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label><span>اسم الصنف</span><input name="productName" value={pcForm.productName} onChange={pcCrud.handleInput} required /></label>
              <label><span>الكود / الرمز</span><input name="code" value={pcForm.code} onChange={pcCrud.handleInput} /></label>
              <label><span>التصنيف</span><input name="category" value={pcForm.category} onChange={pcCrud.handleInput} /></label>
              <label><span>وحدة القياس</span>
                <select name="unit" value={pcForm.unit} onChange={pcCrud.handleInput}>
                  {['قطعة','كرتونة','دستة','كيلو','جرام','لتر','متر','علبة','طقم','باكيت','زجاجة','كيس'].map(u => <option key={u} value={u}>{u}</option>)}
                  {!['قطعة','كرتونة','دستة','كيلو','جرام','لتر','متر','علبة','طقم','باكيت','زجاجة','كيس'].includes(pcForm.unit) && pcForm.unit && <option value={pcForm.unit}>{pcForm.unit}</option>}
                </select>
              </label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={pcForm.notes} onChange={pcCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && activeView === 'final-product-store' ? (
          <GenericCrudView
            data={finalProductStore}
            eyebrow="مخزن المنتج النهائي"
            headline="متابعة أرصدة المنتج النهائي"
            addLabel="إضافة منتج"
            emptyLabel="لا توجد منتجات مسجلة بعد."
            formTitle="منتج"
            editingId={fpEditingId}
            saving={fpSaving}
            isFormOpen={fpFormOpen}
            onOpenForm={fpCrud.openForm}
            onCloseForm={fpCrud.closeForm}
            onSubmit={fpCrud.handleSubmit}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            form={fpForm}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.productName}</strong>
                    <span className={`status-chip ${item.status === 'متوفر' ? 'success' : item.status === 'منخفض' ? 'warning' : 'danger'}`}>{item.status}</span>
                    {item.category && <span className="status-chip neutral">{item.category}</span>}
                  </div>
                  <p>الكمية: {item.quantity} {item.unit} · الحد الأدنى: {item.minStock}</p>
                </div>
                <div className="table-side">
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => fpCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => fpCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label className="full-width"><span>الصنف</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select name="productName" value={fpForm.productName} onChange={(e) => {
                    const selected = productCards.items?.find(p => p.productName === e.target.value);
                    setFpForm(prev => ({ ...prev, productName: e.target.value, category: selected?.category || prev.category, unit: selected?.unit || prev.unit }));
                  }} required style={{ flex: 1 }}>
                    <option value="">— اختر صنفاً من كبون الأصناف —</option>
                    {productCards?.items?.map(p => (
                      <option key={p.id} value={p.productName}>{p.productName}{p.code ? ` (${p.code})` : ''}</option>
                    ))}
                  </select>
                  <button type="button" className="ghost-button small" onClick={() => { fpCrud.closeForm(); navigateTo('product-cards'); }} title="إضافة كبون أصناف">➕ إضافة كبون أصناف</button>
                </div>
              </label>
              <label><span>التصنيف</span><input name="category" value={fpForm.category} onChange={fpCrud.handleInput} /></label>
              <label><span>الكمية</span><input name="quantity" type="number" min="0" value={fpForm.quantity} onChange={fpCrud.handleInput} /></label>
              <label><span>الوحدة</span>
                <select name="unit" value={fpForm.unit} onChange={fpCrud.handleInput}>
                  {['قطعة','كرتونة','دستة','كيلو','جرام','لتر','متر','علبة','طقم','باكيت','زجاجة','كيس','رول','صينية','شوال','برميل','جالون','كرتة'].map(u => <option key={u} value={u}>{u}</option>)}
                  {!['قطعة','كرتونة','دستة','كيلو','جرام','لتر','متر','علبة','طقم','باكيت','زجاجة','كيس','رول','صينية','شوال','برميل','جالون','كرتة'].includes(fpForm.unit) && fpForm.unit && <option value={fpForm.unit}>{fpForm.unit}</option>}
                </select>
              </label>
              <label><span>الحد الأدنى</span><input name="minStock" type="number" min="0" value={fpForm.minStock} onChange={fpCrud.handleInput} /></label>
              <label><span>الحالة</span><select name="status" value={fpForm.status} onChange={fpCrud.handleInput}>{storeStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={fpForm.notes} onChange={fpCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && activeView === 'raw-materials-packaging-store' ? (
          <GenericCrudView
            data={rawMaterialsStore}
            eyebrow="مخزن الخامات والتعبئة"
            headline="إدارة خامات التشغيل والتغليف"
            addLabel="إضافة خامة"
            emptyLabel="لا توجد خامات مسجلة بعد."
            formTitle="خامة"
            editingId={rmEditingId}
            saving={rmSaving}
            isFormOpen={rmFormOpen}
            onOpenForm={rmCrud.openForm}
            onCloseForm={rmCrud.closeForm}
            onSubmit={rmCrud.handleSubmit}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.materialName}</strong>
                    <span className={`status-chip ${item.status === 'متوفر' ? 'success' : item.status === 'منخفض' ? 'warning' : 'danger'}`}>{item.status}</span>
                    {item.category && <span className="status-chip neutral">{item.category}</span>}
                  </div>
                  <p>الكمية: {item.quantity} {item.unit} · الحد الأدنى: {item.minStock}</p>
                </div>
                <div className="table-side">
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => rmCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => rmCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label><span>اسم الخامة</span>
                <select
                  name="materialName"
                  value={rmForm.materialName}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    setRmForm((current) => ({
                      ...current,
                      materialName: selectedName,
                      category: materialCategoryByName[selectedName] ?? ''
                    }));
                  }}
                  required
                >
                  <option value="">{materialNameOptions.length > 0 ? '— اختر خامة —' : 'لا توجد خامات مسجلة'}</option>
                  {materialNameOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  {rmForm.materialName && !materialNameOptions.includes(rmForm.materialName) ? <option value={rmForm.materialName}>{rmForm.materialName}</option> : null}
                </select>
              </label>
              <label><span>التصنيف</span><input className="readonly-field" name="category" value={rmForm.category} readOnly /></label>
              <label><span>الكمية</span><input name="quantity" type="number" min="0" value={rmForm.quantity} onChange={rmCrud.handleInput} /></label>
              <label><span>الوحدة</span>
                <select name="unit" value={rmForm.unit} onChange={rmCrud.handleInput}>
                  {['قطعة','كرتونة','دستة','كيلو','جرام','لتر','متر','علبة','طقم','باكيت','زجاجة','كيس','رول','صينية','شوال','برميل','جالون','كرتة'].map(u => <option key={u} value={u}>{u}</option>)}
                  {!['قطعة','كرتونة','دستة','كيلو','جرام','لتر','متر','علبة','طقم','باكيت','زجاجة','كيس','رول','صينية','شوال','برميل','جالون','كرتة'].includes(rmForm.unit) && rmForm.unit && <option value={rmForm.unit}>{rmForm.unit}</option>}
                </select>
              </label>
              <label><span>الحد الأدنى</span><input name="minStock" type="number" min="0" value={rmForm.minStock} onChange={rmCrud.handleInput} /></label>
              <label><span>الحالة</span><select name="status" value={rmForm.status} onChange={rmCrud.handleInput}>{storeStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={rmForm.notes} onChange={rmCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && activeView === 'rep-sub-stores' ? (
          <>
          <GenericCrudView
            data={repSubStores}
            eyebrow="مخازن المناديب"
            headline="متابعة العهد والمخزون لدى المناديب"
            addLabel="نقل من مخزن المنتج النهائي"
            emptyLabel="لا توجد سجلات بعد."
            formTitle="سجل مندوب"
            editingId={rssEditingId}
            saving={rssSaving}
            isFormOpen={rssFormOpen}
            onOpenForm={() => {
              fetch('/api/users/by-role/sales', { headers: { Authorization: `Bearer ${auth.token}` } })
                .then(r => r.ok ? r.json() : []).then(data => setRepUsers(Array.isArray(data) ? data : [])).catch(() => {});
              setTransferFormOpen(true);
            }}
            onCloseForm={rssCrud.closeForm}
            onSubmit={rssCrud.handleSubmit}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            form={rssForm}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.repName}</strong>
                    <span className={`status-chip ${item.status === 'مسلّم' ? 'success' : item.status === 'مسترد' ? 'neutral' : 'warning'}`}>{item.status}</span>
                    <span className="status-chip calm">{item.productName}</span>
                  </div>
                  <p>الكمية المتبقية: <strong>{item.quantity}</strong> · {formatDate(item.deliveryDate)}</p>
                </div>
                <div className="table-side">
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => { setSaleDeductForm({ repName: item.repName, productName: item.productName, quantity: '' }); setSaleDeductOpen(true); }}>تسجيل بيع</button>
                    <button type="button" className="ghost-button small" onClick={() => rssCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => rssCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label><span>اسم المندوب</span><input name="repName" value={rssForm.repName} onChange={rssCrud.handleInput} required /></label>
              <label><span>اسم المنتج</span><input name="productName" value={rssForm.productName} onChange={rssCrud.handleInput} required /></label>
              <label><span>الكمية</span><input name="quantity" type="number" min="0" value={rssForm.quantity} onChange={rssCrud.handleInput} /></label>
              <label><span>تاريخ التسليم</span><input name="deliveryDate" type="date" value={rssForm.deliveryDate} onChange={rssCrud.handleInput} /></label>
              <label><span>الحالة</span><select name="status" value={rssForm.status} onChange={rssCrud.handleInput}>{repStoreStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={rssForm.notes} onChange={rssCrud.handleInput} /></label>
            </>}
          />

          {/* Transfer Modal */}
          <Modal isOpen={transferFormOpen} onClose={() => setTransferFormOpen(false)} title="نقل من مخزن المنتج النهائي إلى مندوب">
            <form className="form-grid" onSubmit={handleTransferSubmit}>
              <label><span>اسم المندوب</span>
                <select value={transferForm.repName} onChange={e => setTransferForm(f => ({...f, repName: e.target.value}))} required>
                  <option value="">{transferRepOptions.length > 0 ? '— اختر مندوباً —' : 'لا توجد أسماء مناديب متاحة'}</option>
                  {transferRepOptions.map((repName) => (
                    <option key={repName} value={repName}>{repName}</option>
                  ))}
                  {transferForm.repName && !transferRepOptions.includes(transferForm.repName) ? (
                    <option value={transferForm.repName}>{transferForm.repName}</option>
                  ) : null}
                </select>
              </label>
              <label><span>المنتج</span>
                <select value={transferForm.productName} onChange={e => setTransferForm(f => ({...f, productName: e.target.value}))} required>
                  <option value="">{transferProductOptions.length > 0 ? '— اختر منتجاً —' : 'لا توجد منتجات متاحة في المخزن النهائي'}</option>
                  {finalProductStore.items.map((p) => (
                    <option key={p.id} value={p.productName}>{p.productName} (متاح: {p.quantity} {p.unit})</option>
                  ))}
                  {transferForm.productName && !transferProductOptions.includes(transferForm.productName) ? (
                    <option value={transferForm.productName}>{transferForm.productName}</option>
                  ) : null}
                </select>
              </label>
              <label><span>الكمية المنقولة</span><input type="number" min="1" value={transferForm.quantity} onChange={e => setTransferForm(f => ({...f, quantity: e.target.value}))} required /></label>
              <label><span>تاريخ التسليم</span><input type="date" value={transferForm.deliveryDate} onChange={e => setTransferForm(f => ({...f, deliveryDate: e.target.value}))} /></label>
              <label className="full-width"><span>ملاحظات</span><textarea rows="2" value={transferForm.notes} onChange={e => setTransferForm(f => ({...f, notes: e.target.value}))} /></label>
              <div className="form-actions full-width" style={{ marginTop: '16px' }}>
                <button type="submit" className="primary-button" disabled={transferSaving}>{transferSaving ? 'جارٍ النقل...' : 'تأكيد النقل'}</button>
                <button type="button" className="ghost-button" onClick={() => setTransferFormOpen(false)}>إلغاء</button>
              </div>
            </form>
          </Modal>

          {/* Sale Deduct Modal */}
          <Modal isOpen={saleDeductOpen} onClose={() => setSaleDeductOpen(false)} title="تسجيل بيع وخصم من مخزن المندوب">
            <form className="form-grid" onSubmit={handleSaleDeductSubmit}>
              <label><span>اسم المندوب</span><input value={saleDeductForm.repName} onChange={e => setSaleDeductForm(f => ({...f, repName: e.target.value}))} required /></label>
              <label><span>المنتج</span><input value={saleDeductForm.productName} onChange={e => setSaleDeductForm(f => ({...f, productName: e.target.value}))} required /></label>
              <label><span>الكمية المباعة</span><input type="number" min="1" value={saleDeductForm.quantity} onChange={e => setSaleDeductForm(f => ({...f, quantity: e.target.value}))} required /></label>
              <div className="form-actions full-width" style={{ marginTop: '16px' }}>
                <button type="submit" className="primary-button" disabled={saleDeductSaving}>{saleDeductSaving ? 'جارٍ الخصم...' : 'تأكيد البيع'}</button>
                <button type="button" className="ghost-button" onClick={() => setSaleDeductOpen(false)}>إلغاء</button>
              </div>
            </form>
          </Modal>
          </>
        ) : null}

        {!loading && activeView === 'financial-manager-custody' ? (
          <>
          <GenericCrudView
            data={finManagerCustody}
            eyebrow="عهدة المدير المالي"
            headline="توزيع عهد الموظفين من عهدة المدير المالي"
            addLabel="إضافة عهدة"
            emptyLabel="لا توجد عهد مسجلة بعد."
            formTitle="عهدة"
            editingId={fmcEditingId}
            saving={fmcSaving}
            isFormOpen={fmcFormOpen}
            extraActions={
              <form onSubmit={handleSetFmcBudget} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="ميزانية المدير (ج.م)"
                  value={fmcBudgetInput}
                  onChange={e => setFmcBudgetInput(e.target.value)}
                  style={{ width: '170px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </form>
            }
            onOpenForm={() => {
              if (auth?.user?.role !== 'manager' && auth?.user?.role !== 'admin') {
                setError('إضافة عهدة المدير متاحة للمدير فقط.');
                return;
              }
              loadEmployeeUsers();
              setFmcAssignOpen(false);
              setFmcEditingId('');
              setFmcAssignForm(initialFinManagerCustodyForm);
              setActiveManagerCustodyId('');
              setFmcForm({
                employeeName: '',
                amount: '',
                purpose: '',
                custodyDate: getTodayLocalDateKey(),
                status: 'نشطة',
                notes: ''
              });
              fmcCrud.openForm();
            }}
            onCloseForm={() => {
              setActiveManagerCustodyId('');
              setFmcAssignOpen(false);
              fmcCrud.closeForm();
            }}
            onSubmit={handleFmcSubmitLimited}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.employeeName}</strong>
                    <span className={`status-chip ${item.status === 'نشطة' ? 'success' : 'neutral'}`}>{item.status}</span>
                  </div>
                  <p>{item.purpose}</p>
                  <small>{formatDate(item.custodyDate)}</small>
                </div>
                <div className="table-side">
                  <strong>{formatMoney(item.amount)}</strong>
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => openFmcEditForm(item)}>تعديل</button>
                    <button type="button" className="ghost-button small" onClick={() => openFmcAssignForm(item)}>تعيين</button>
                    <button type="button" className="danger-button small" onClick={() => fmcCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <>
                <label><span>اسم الموظف</span>
                  <select name="employeeName" value={fmcForm.employeeName} onChange={fmcCrud.handleInput} required>
                    <option value="">{adminEmployeeOptionsWithFallback.length > 0 ? '— اختر مديرًا —' : 'لا يوجد مستخدم admin متاح'}</option>
                    {adminEmployeeOptionsWithFallback.map((user) => (
                      <option key={user.id ?? user.displayName} value={user.displayName}>
                        {user.displayName}{user.code ? ` (${user.code})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label><span>قيمة العهدة</span><input name="amount" type="number" min="0" step="0.01" value={fmcForm.amount} onChange={fmcCrud.handleInput} required /></label>
                <label><span>الغرض</span><input name="purpose" value={fmcForm.purpose} onChange={fmcCrud.handleInput} required /></label>
                <label><span>التاريخ</span><input name="custodyDate" type="date" value={fmcForm.custodyDate} onChange={fmcCrud.handleInput} required /></label>
                <label><span>الحالة</span><select name="status" value={fmcForm.status} onChange={fmcCrud.handleInput} required>{custodyStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
                <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={fmcForm.notes} onChange={fmcCrud.handleInput} /></label>
              </>
            </>}
          />
          <Modal isOpen={fmcAssignOpen} onClose={() => { setFmcAssignOpen(false); setActiveManagerCustodyId(''); }} title="تعيين عهدة موظف">
            <form className="form-grid" onSubmit={handleFmcAssignSubmit}>
              <label><span>اسم الموظف</span>
                <select name="employeeName" value={fmcAssignForm.employeeName} onChange={e => setFmcAssignForm(c => ({ ...c, employeeName: e.target.value }))} required>
                  <option value="">{employeeOptionsWithFallback.length > 0 ? '— اختر موظفًا —' : 'لا يوجد موظفون متاحون'}</option>
                  {employeeOptionsWithFallback.map((user) => (
                    <option key={user.id ?? user.displayName} value={user.displayName}>{user.displayName}{user.code ? ` (${user.code})` : ''}</option>
                  ))}
                </select>
              </label>
              <label><span>المبلغ المعين</span><input name="amount" type="number" min="0" step="0.01" value={fmcAssignForm.amount} onChange={e => setFmcAssignForm(c => ({ ...c, amount: e.target.value }))} required /></label>
              <label><span>التاريخ</span><input name="custodyDate" type="date" value={fmcAssignForm.custodyDate} onChange={e => setFmcAssignForm(c => ({ ...c, custodyDate: e.target.value }))} required /></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={fmcAssignForm.notes} onChange={e => setFmcAssignForm(c => ({ ...c, notes: e.target.value }))} /></label>
              <div className="form-actions full-width" style={{ marginTop: '16px' }}>
                <button type="submit" className="primary-button" disabled={fmcSaving}>{fmcSaving ? 'جارٍ الحفظ...' : 'حفظ التعيين'}</button>
                <button type="button" className="ghost-button" onClick={() => { setFmcAssignOpen(false); setActiveManagerCustodyId(''); }}>إلغاء</button>
              </div>
            </form>
          </Modal>
          </>
        ) : null}

        {!loading && activeView === 'raw-materials-catalog' ? (
          <GenericCrudView
            data={rawMaterialsCatalog}
            eyebrow="تسجيل الخامات"
            headline="إدارة قائمة الخامات المعتمدة"
            addLabel="إضافة خامة"
            emptyLabel="لا توجد خامات مسجلة بعد."
            formTitle="خامة"
            editingId={rmcEditingId}
            saving={rmcSaving}
            isFormOpen={rmcFormOpen}
            onOpenForm={rmcCrud.openForm}
            onCloseForm={rmcCrud.closeForm}
            onSubmit={rmcCrud.handleSubmit}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.name}</strong>
                    {item.category ? <span className="status-chip neutral">{item.category}</span> : null}
                  </div>
                  {item.notes ? <p>{item.notes}</p> : <p>—</p>}
                </div>
                <div className="table-side">
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => rmcCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => rmcCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label><span>اسم الخامة</span><input name="name" value={rmcForm.name} onChange={rmcCrud.handleInput} required /></label>
              <label><span>التصنيف</span><input name="category" value={rmcForm.category} onChange={rmcCrud.handleInput} placeholder="مثال: تعبئة / خامات تشغيل" /></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={rmcForm.notes} onChange={rmcCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && activeView === 'suppliers' ? (
          <GenericCrudView
            data={suppliers}
            eyebrow="تسجيل الموردين"
            headline="إدارة قائمة الموردين المعتمدين"
            addLabel="إضافة مورد"
            emptyLabel="لا يوجد موردون مسجلون بعد."
            formTitle="مورد"
            editingId={supEditingId}
            saving={supSaving}
            isFormOpen={supFormOpen}
            onOpenForm={supCrud.openForm}
            onCloseForm={supCrud.closeForm}
            onSubmit={supCrud.handleSubmit}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.name}</strong>
                  </div>
                  {item.notes ? <p>{item.notes}</p> : <p>—</p>}
                </div>
                <div className="table-side">
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => supCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => supCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label><span>اسم المورد</span><input name="name" value={supForm.name} onChange={supCrud.handleInput} required /></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={supForm.notes} onChange={supCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && activeView === 'raw-materials-purchases' ? (
          <GenericCrudView
            data={rawPurchases}
            eyebrow="مشتريات الخامات"
            headline="تسجيل ومراجعة مشتريات الخامات"
            addLabel="إضافة فاتورة شراء"
            emptyLabel="لا توجد فواتير مشتريات بعد."
            formTitle="فاتورة شراء"
            editingId={rmpEditingId}
            saving={rmpSaving}
            isFormOpen={rmpFormOpen}
            formError={rmpFormOpen ? error : ''}
            onOpenForm={() => {
              if (!hasActiveManagerCustodyBalance) {
                setError(rawPurchasesAddBlockedReason);
                return;
              }
              setError('');
              rmpCrud.openForm();
            }}
            onCloseForm={rmpCrud.closeForm}
            onSubmit={rmpCrud.handleSubmit}
            addDisabled={!hasActiveManagerCustodyBalance}
            addDisabledTitle={rawPurchasesAddBlockedReason}
            addDisabledHint={!hasActiveManagerCustodyBalance ? (
              <>
                {rawPurchasesAddBlockedReason}{' '}
                <button
                  type="button"
                  className="inline-link-button"
                  onClick={() => navigateTo('financial-manager-custody')}
                >
                  إضافة عهدة
                </button>
              </>
            ) : ''}
            extraActions={(
              <span className={`status-chip ${hasActiveManagerCustodyBalance ? 'success' : 'warning'}`}>
                الرصيد المتاح: {formatMoney(activeManagerCustodyAvailable)}
              </span>
            )}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.supplierName}</strong>
                    {item.invoiceNumber && <span className="status-chip neutral">فاتورة {item.invoiceNumber}</span>}
                  </div>
                  <p>{item.materialName} · {item.quantity} وحدة × {formatMoney(item.unitPrice)}</p>
                  <small>{formatDate(item.purchaseDate)}</small>
                </div>
                <div className="table-side">
                  <strong>{formatMoney(item.totalAmount)}</strong>
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => rmpCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => rmpCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label><span>اسم المورد</span>
                <select name="supplierName" value={rmpForm.supplierName} onChange={rmpCrud.handleInput} required>
                  <option value="">{supplierNameOptions.length > 0 ? '— اختر موردًا —' : 'لا يوجد موردون مسجلون'}</option>
                  {supplierNameOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  {rmpForm.supplierName && !supplierNameOptions.includes(rmpForm.supplierName) ? <option value={rmpForm.supplierName}>{rmpForm.supplierName}</option> : null}
                </select>
              </label>
              <label><span>اسم الخامة</span>
                <select name="materialName" value={rmpForm.materialName} onChange={rmpCrud.handleInput} required>
                  <option value="">{materialNameOptions.length > 0 ? '— اختر خامة —' : 'لا توجد خامات مسجلة'}</option>
                  {materialNameOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  {rmpForm.materialName && !materialNameOptions.includes(rmpForm.materialName) ? <option value={rmpForm.materialName}>{rmpForm.materialName}</option> : null}
                </select>
              </label>
              <label><span>الكمية</span><input name="quantity" type="number" min="0" step="0.01" value={rmpForm.quantity} onChange={rmpCrud.handleInput} required /></label>
              <label><span>سعر الوحدة</span><input name="unitPrice" type="number" min="0" step="0.01" value={rmpForm.unitPrice} onChange={rmpCrud.handleInput} required /></label>
              <label><span>تاريخ الشراء</span><input name="purchaseDate" type="date" value={rmpForm.purchaseDate} onChange={rmpCrud.handleInput} required /></label>
              <label><span>رقم الفاتورة</span><input name="invoiceNumber" value={rmpForm.invoiceNumber} onChange={rmpCrud.handleInput} required /></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={rmpForm.notes} onChange={rmpCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && activeView === 'machine-maintenance-purchases' ? (
          <GenericCrudView
            data={machinePurchases}
            eyebrow="مشتريات صيانة المكن"
            headline="متابعة تكاليف الصيانة وقطع الغيار"
            addLabel="إضافة عملية صيانة"
            emptyLabel="لا توجد عمليات صيانة مسجلة بعد."
            formTitle="عملية صيانة"
            editingId={mmpEditingId}
            saving={mmpSaving}
            isFormOpen={mmpFormOpen}
            formError={mmpFormOpen ? error : ''}
            onOpenForm={() => {
              if (!hasActiveManagerCustodyBalance) {
                setError(machinePurchasesAddBlockedReason);
                return;
              }
              setError('');
              mmpCrud.openForm();
            }}
            onCloseForm={mmpCrud.closeForm}
            onSubmit={mmpCrud.handleSubmit}
            addDisabled={!hasActiveManagerCustodyBalance}
            addDisabledTitle={machinePurchasesAddBlockedReason}
            addDisabledHint={!hasActiveManagerCustodyBalance ? (
              <>
                {machinePurchasesAddBlockedReason}{' '}
                <button
                  type="button"
                  className="inline-link-button"
                  onClick={() => navigateTo('financial-manager-custody')}
                >
                  إضافة عهدة
                </button>
              </>
            ) : ''}
            extraActions={(
              <span className={`status-chip ${hasActiveManagerCustodyBalance ? 'success' : 'warning'}`}>
                الرصيد المتاح: {formatMoney(activeManagerCustodyAvailable)}
              </span>
            )}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.supplierName}</strong>
                    {item.machineName && <span className="status-chip neutral">{item.machineName}</span>}
                  </div>
                  <p>{item.description}</p>
                  <small>{formatDate(item.purchaseDate)}{item.invoiceNumber ? ` · فاتورة ${item.invoiceNumber}` : ''}</small>
                </div>
                <div className="table-side">
                  <strong>{formatMoney(item.amount)}</strong>
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => mmpCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => mmpCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label><span>اسم المورد</span>
                <select name="supplierName" value={mmpForm.supplierName} onChange={mmpCrud.handleInput} required>
                  <option value="">{supplierNameOptions.length > 0 ? '— اختر موردًا —' : 'لا يوجد موردون مسجلون'}</option>
                  {supplierNameOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  {mmpForm.supplierName && !supplierNameOptions.includes(mmpForm.supplierName) ? <option value={mmpForm.supplierName}>{mmpForm.supplierName}</option> : null}
                </select>
              </label>
              <label><span>وصف العملية</span><input name="description" value={mmpForm.description} onChange={mmpCrud.handleInput} required /></label>
              <label><span>القيمة</span><input name="amount" type="number" min="0" step="0.01" value={mmpForm.amount} onChange={mmpCrud.handleInput} required /></label>
              <label><span>اسم الماكينة</span><input name="machineName" value={mmpForm.machineName} onChange={mmpCrud.handleInput} /></label>
              <label><span>تاريخ الشراء</span><input name="purchaseDate" type="date" value={mmpForm.purchaseDate} onChange={mmpCrud.handleInput} /></label>
              <label><span>رقم الفاتورة</span><input name="invoiceNumber" value={mmpForm.invoiceNumber} onChange={mmpCrud.handleInput} /></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={mmpForm.notes} onChange={mmpCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && activeView === 'misc-purchases' ? (
          <GenericCrudView
            data={miscPurchases}
            eyebrow="المصروفات النثرية"
            headline="إدارة المصروفات النثرية اليومية"
            addLabel="إضافة مصروف"
            emptyLabel="لا توجد مصروفات مسجلة بعد."
            formTitle="مصروف"
            editingId={mscEditingId}
            saving={mscSaving}
            isFormOpen={mscFormOpen}
            formError={mscFormOpen ? error : ''}
            onOpenForm={() => {
              if (!hasActiveManagerCustodyBalance) {
                setError(miscPurchasesAddBlockedReason);
                return;
              }
              setError('');
              mscCrud.openForm();
            }}
            onCloseForm={mscCrud.closeForm}
            onSubmit={mscCrud.handleSubmit}
            addDisabled={!hasActiveManagerCustodyBalance}
            addDisabledTitle={miscPurchasesAddBlockedReason}
            addDisabledHint={!hasActiveManagerCustodyBalance ? (
              <>
                {miscPurchasesAddBlockedReason}{' '}
                <button
                  type="button"
                  className="inline-link-button"
                  onClick={() => navigateTo('financial-manager-custody')}
                >
                  إضافة عهدة
                </button>
              </>
            ) : ''}
            extraActions={(
              <span className={`status-chip ${hasActiveManagerCustodyBalance ? 'success' : 'warning'}`}>
                الرصيد المتاح: {formatMoney(activeManagerCustodyAvailable)}
              </span>
            )}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.description}</strong>
                    {item.category && <span className="status-chip neutral">{item.category}</span>}
                  </div>
                  <small>{formatDate(item.purchaseDate)}{item.receiptNumber ? ` · إيصال ${item.receiptNumber}` : ''}</small>
                </div>
                <div className="table-side">
                  <strong>{formatMoney(item.amount)}</strong>
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => mscCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => mscCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label><span>وصف المصروف</span><input name="description" value={mscForm.description} onChange={mscCrud.handleInput} required /></label>
              <label><span>القيمة</span><input name="amount" type="number" min="0" step="0.01" value={mscForm.amount} onChange={mscCrud.handleInput} required /></label>
              <label><span>التصنيف</span><input name="category" value={mscForm.category} onChange={mscCrud.handleInput} placeholder="مثال: نقل، أدوات مكتبية.." /></label>
              <label><span>التاريخ</span><input name="purchaseDate" type="date" value={mscForm.purchaseDate} onChange={mscCrud.handleInput} /></label>
              <label><span>رقم الإيصال</span><input name="receiptNumber" value={mscForm.receiptNumber} onChange={mscCrud.handleInput} /></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={mscForm.notes} onChange={mscCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && activeView === 'payroll-advances' ? (
          <GenericCrudView
            data={payrollAdvances}
            eyebrow="الرواتب والسلف"
            headline="متابعة الرواتب والسلف الشهرية"
            addLabel="إضافة سجل"
            emptyLabel="لا توجد سجلات رواتب أو سلف بعد."
            formTitle="سجل"
            editingId={payEditingId}
            saving={paySaving}
            isFormOpen={payFormOpen}
            formError={payFormOpen ? error : ''}
            onOpenForm={() => {
              if (!hasActiveManagerCustodyBalance) {
                setError(payrollAddBlockedReason);
                return;
              }
              setError('');
              payCrud.openForm();
            }}
            onCloseForm={payCrud.closeForm}
            onSubmit={payCrud.handleSubmit}
            addDisabled={!hasActiveManagerCustodyBalance}
            addDisabledTitle={payrollAddBlockedReason}
            addDisabledHint={!hasActiveManagerCustodyBalance ? (
              <>
                {payrollAddBlockedReason}{' '}
                <button
                  type="button"
                  className="inline-link-button"
                  onClick={() => navigateTo('financial-manager-custody')}
                >
                  إضافة عهدة
                </button>
              </>
            ) : ''}
            extraActions={(
              <span className={`status-chip ${hasActiveManagerCustodyBalance ? 'success' : 'warning'}`}>
                الرصيد المتاح: {formatMoney(activeManagerCustodyAvailable)}
              </span>
            )}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.employeeName}</strong>
                    <span className={`status-chip ${item.type === 'راتب' ? 'accent' : 'warning'}`}>{item.type}</span>
                    <span className={`status-chip ${item.status === 'مدفوع' ? 'success' : item.status === 'معلق' ? 'warning' : 'neutral'}`}>{item.status}</span>
                  </div>
                  <p>{item.month ? `شهر: ${item.month}` : ''}</p>
                </div>
                <div className="table-side">
                  <strong>{formatMoney(item.amount)}</strong>
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => payCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => payCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label><span>اسم الموظف</span><input name="employeeName" value={payForm.employeeName} onChange={payCrud.handleInput} required /></label>
              <label><span>النوع</span><select name="type" value={payForm.type} onChange={payCrud.handleInput}>{payrollTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
              <label><span>المبلغ</span><input name="amount" type="number" min="0" step="0.01" value={payForm.amount} onChange={payCrud.handleInput} required /></label>
              <label><span>الشهر</span><input name="month" value={payForm.month} onChange={payCrud.handleInput} placeholder="مثال: أبريل 2026" /></label>
              <label><span>الحالة</span><select name="status" value={payForm.status} onChange={payCrud.handleInput}>{payrollStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={payForm.notes} onChange={payCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && activeView === 'customer-payment-alerts' ? (
          <GenericCrudView
            data={paymentAlerts}
            eyebrow="تنبيهات الدفع"
            headline="متابعة تنبيهات الاستحقاق والتحصيل"
            addLabel="إضافة تنبيه"
            emptyLabel="لا توجد تنبيهات مسجلة بعد."
            formTitle="تنبيه"
            editingId={cpaEditingId}
            saving={cpaSaving}
            isFormOpen={cpaFormOpen}
            onOpenForm={cpaCrud.openForm}
            onCloseForm={cpaCrud.closeForm}
            onSubmit={cpaCrud.handleSubmit}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.customerName}</strong>
                    <span className={`status-chip ${item.status === 'تم السداد' ? 'success' : item.status === 'متأخر' ? 'danger' : 'warning'}`}>{item.status}</span>
                    <span className="status-chip neutral">{item.alertType}</span>
                  </div>
                  <small>تاريخ الاستحقاق: {formatDate(item.dueDate)}</small>
                </div>
                <div className="table-side">
                  <strong>{formatMoney(item.amount)}</strong>
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => cpaCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => cpaCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label><span>اسم العميل</span><input name="customerName" value={cpaForm.customerName} onChange={cpaCrud.handleInput} required /></label>
              <label><span>المبلغ</span><input name="amount" type="number" min="0" step="0.01" value={cpaForm.amount} onChange={cpaCrud.handleInput} required /></label>
              <label><span>تاريخ الاستحقاق</span><input name="dueDate" type="date" value={cpaForm.dueDate} onChange={cpaCrud.handleInput} /></label>
              <label><span>نوع التنبيه</span><select name="alertType" value={cpaForm.alertType} onChange={cpaCrud.handleInput}>{alertTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
              <label><span>الحالة</span><select name="status" value={cpaForm.status} onChange={cpaCrud.handleInput}>{alertStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={cpaForm.notes} onChange={cpaCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && activeView === 'free-samples' ? (
          <GenericCrudView
            data={freeSamples}
            eyebrow="العينات المجانية"
            headline="احتساب العينات المجانية المصروفة للعملاء"
            addLabel="إضافة عينة"
            emptyLabel="لا توجد عينات مسجلة بعد."
            formTitle="عينة مجانية"
            editingId={fsEditingId}
            saving={fsSaving}
            isFormOpen={fsFormOpen}
            onOpenForm={fsCrud.openForm}
            onCloseForm={fsCrud.closeForm}
            onSubmit={fsCrud.handleSubmit}
            onBack={viewHistory.length > 0 ? goBack : undefined}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.customerName}</strong>
                    <span className="status-chip neutral">{item.productName}</span>
                  </div>
                  <p>الكمية: {item.quantity} {item.unit}{item.reason ? ` · السبب: ${item.reason}` : ''}</p>
                  <small>{formatDate(item.sampleDate)}</small>
                </div>
                <div className="table-side">
                  <div className="row-actions">
                    <button type="button" className="ghost-button small" onClick={() => fsCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => fsCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label><span>اسم العميل</span>
                <select name="customerName" value={fsForm.customerName} onChange={fsCrud.handleInput} required>
                  <option value="">{supplierNameOptions.length > 0 ? '— اختر موردًا —' : 'لا يوجد موردون مسجلون'}</option>
                  {supplierNameOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                  {fsForm.customerName && !supplierNameOptions.includes(fsForm.customerName) ? <option value={fsForm.customerName}>{fsForm.customerName}</option> : null}
                </select>
              </label>
              <label><span>اسم المنتج</span>
                <select name="productName" value={fsForm.productName} onChange={fsCrud.handleInput} required>
                  <option value="">{priceListProductOptions.length > 0 ? '— اختر منتجًا —' : 'لا يوجد منتجات مسجلة'}</option>
                  {priceListProductOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                  {fsForm.productName && !priceListProductOptions.includes(fsForm.productName) ? <option value={fsForm.productName}>{fsForm.productName}</option> : null}
                </select>
              </label>
              <label><span>الكمية</span><input name="quantity" type="number" min="1" value={fsForm.quantity} onChange={fsCrud.handleInput} /></label>
              <label><span>الوحدة</span><input name="unit" value={fsForm.unit} onChange={fsCrud.handleInput} /></label>
              <label><span>سعر الوحدة (للتوثيق فقط)</span><input name="unitPrice" type="number" min="0" step="0.01" value={fsForm.unitPrice} onChange={fsCrud.handleInput} placeholder="0.00" /></label>
              <label><span>السبب</span><input name="reason" value={fsForm.reason} onChange={fsCrud.handleInput} placeholder="مثال: ترويج، تجربة.." /></label>
              <label><span>التاريخ</span><input name="sampleDate" type="date" value={fsForm.sampleDate} onChange={fsCrud.handleInput} /></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={fsForm.notes} onChange={fsCrud.handleInput} /></label>
            </>}
          />
        ) : null}
      </main>

      <Modal isOpen={transactionsModalOpen} onClose={closeTransactionsModal} title="إدارة حركات العهدة">
        <div style={{ marginBottom: '24px' }}>
          <form className="form-grid" onSubmit={handleTransactionSubmit} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
            <label>
              <span>نوع الحركة</span>
              <select name="transactionType" value={transactionForm.transactionType} onChange={handleTransactionInputChange}>
                {transactionTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>
              <span>المبلغ</span>
              <input name="amount" type="number" min="0" step="0.01" value={transactionForm.amount} onChange={handleTransactionInputChange} required />
            </label>
             <label className="full-width">
              <span>التاريخ</span>
              <input name="date" type="date" value={transactionForm.date} onChange={handleTransactionInputChange} />
            </label>
            <label className="full-width">
              <span>ملاحظات</span>
              <input name="notes" value={transactionForm.notes} onChange={handleTransactionInputChange} placeholder="مثل: فاتورة بنزين، استهلاك أحبار.." />
            </label>
            <div className="form-actions full-width" style={{ marginTop: '8px' }}>
              <button type="submit" className="primary-button" disabled={transactionSaving}>
                {transactionSaving ? 'جارٍ التسجيل' : 'تسجيل الحركة'}
              </button>
            </div>
          </form>
        </div>

        <div className="table-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {activeCustodyTransactions.map(tx => (
            <article key={tx.id} className="table-row" style={{ padding: '12px' }}>
              <div className="table-main">
                <strong>{tx.transactionType} <span style={{ color: 'var(--primary-color)' }}>{formatMoney(tx.amount)}</span></strong>
                <span style={{ fontSize: '0.85rem' }}>{formatDate(tx.date)} - {tx.notes}</span>
              </div>
              <div className="table-side">
                <button type="button" className="danger-button small" onClick={() => requestTransactionDelete(tx.id)}>
                  حذف
                </button>
              </div>
            </article>
          ))}
          {activeCustodyTransactions.length === 0 && <p style={{ textAlign: 'center', color: '#666' }}>لا توجد حركات مسجلة</p>}
        </div>
      </Modal>

      {/* Global delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="تأكيد الحذف"
        message={deleteTarget ? deleteMessages[deleteTarget.type] : ''}
      />
    </div>
  );
}



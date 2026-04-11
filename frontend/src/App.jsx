import { useEffect, useState } from 'react';

const apiBase = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const views = ['dashboard', 'sales', 'credit-sales'];

const navigation = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    helper: 'الملخص العام'
  },
  {
    id: 'sales',
    label: 'المبيعات',
    helper: 'إدارة البيع النقدي'
  },
  {
    id: 'credit-sales',
    label: 'مبيعات الآجل',
    helper: 'إدارة التحصيل والاستحقاق'
  }
];

const salesStatuses = ['جديدة', 'قيد التنفيذ', 'مكتملة'];
const creditStatuses = ['مستحقة', 'مسدد جزئيا', 'متأخرة', 'مسددة'];

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

function buildUrl(path) {
  return `${apiBase}${path}`;
}

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

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    let message = 'حدث خطأ أثناء تنفيذ الطلب.';

    try {
      const data = await response.json();
      message = data.message ?? message;
    } catch {
      // Ignore JSON parse failures and use fallback message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
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

function DashboardView({ dashboard, onNavigate }) {
  const { meta, brand, summary, alerts, recentSales, recentCreditSales } = dashboard;

  return (
    <>
      <section className="hero-grid">
        <article className="hero-card card">

          <p className="hero-copy">
            {brand?.description ??
              'واجهة موحدة لعرض المؤشرات السريعة وآخر السجلات المهمة والتنبيهات التي تحتاج متابعة.'}
          </p>

          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={() => onNavigate('sales')}>
              {brand?.primaryAction ?? 'فتح صفحة المبيعات'}
            </button>
            <button type="button" className="ghost-button" onClick={() => onNavigate('credit-sales')}>
              {brand?.secondaryAction ?? 'فتح صفحة مبيعات الآجل'}
            </button>
          </div>

          <div className="hero-runtime">
            <span className="hero-runtime-label">حالة البيئة</span>
            <strong>{meta?.message ?? 'جارٍ تجهيز البيانات المحلية.'}</strong>
          </div>
        </article>

        <article className="hero-side card">
          <div className="section-head">
            <div>
              <p className="eyebrow">تحديث سريع</p>
              <h3>وضع التشغيل الحالي</h3>
            </div>
            <span className={`status-chip ${meta?.runtime === 'postgres' ? 'success' : 'warning'}`}>
              {meta?.runtime === 'postgres' ? 'Postgres' : 'محلي'}
            </span>
          </div>

          <div className="runtime-grid">
            <div className="runtime-box">
              <span>مصدر البيانات</span>
              <strong>{meta?.database === 'connected' ? 'متصل بقاعدة البيانات' : 'بيانات محلية'}</strong>
            </div>
            <div className="runtime-box">
              <span>آخر تحديث</span>
              <strong>{formatDate(meta?.updatedAt)}</strong>
            </div>
          </div>
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
  editingId,
  saving,
  onChange,
  onSubmit,
  onEdit,
  onDelete,
  onCancel
}) {
  return (
    <>
      <SummaryCards items={sales.overview} />

      <section className="crud-layout">
        <article className="card form-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">نموذج المبيعات</p>
              <h3>{editingId ? 'تعديل عملية بيع' : 'إضافة عملية بيع'}</h3>
            </div>
          </div>

          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              <span>اسم العميل</span>
              <input name="customerName" value={form.customerName} onChange={onChange} />
            </label>
            <label>
              <span>اسم المنتج</span>
              <input name="productName" value={form.productName} onChange={onChange} />
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
              <span>مسؤول المبيعات</span>
              <input name="salesRep" value={form.salesRep} onChange={onChange} />
            </label>
            <label>
              <span>تاريخ البيع</span>
              <input name="saleDate" type="date" value={form.saleDate} onChange={onChange} />
            </label>
            <label className="full-width">
              <span>ملاحظات</span>
              <textarea name="notes" rows="4" value={form.notes} onChange={onChange} />
            </label>

            <div className="form-actions full-width">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديل' : 'إضافة عملية البيع'}
              </button>
              {editingId ? (
                <button type="button" className="ghost-button" onClick={onCancel}>
                  إلغاء التعديل
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="card table-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">سجلات المبيعات</p>
              <h3>إدارة العمليات الحالية</h3>
            </div>
          </div>

          <div className="table-list">
            {sales.items.map((item) => (
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
        </article>
      </section>
    </>
  );
}

function CreditSalesView({
  creditSales,
  form,
  editingId,
  saving,
  onChange,
  onSubmit,
  onEdit,
  onDelete,
  onCancel
}) {
  return (
    <>
      <SummaryCards items={creditSales.overview} />

      <section className="crud-layout">
        <article className="card form-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">نموذج مبيعات الآجل</p>
              <h3>{editingId ? 'تعديل سجل آجل' : 'إضافة سجل آجل'}</h3>
            </div>
          </div>

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

            <div className="form-actions full-width">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديل' : 'إضافة سجل الآجل'}
              </button>
              {editingId ? (
                <button type="button" className="ghost-button" onClick={onCancel}>
                  إلغاء التعديل
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="card table-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">سجلات مبيعات الآجل</p>
              <h3>إدارة التحصيل والمتابعة</h3>
            </div>
          </div>

          <div className="table-list">
            {creditSales.items.map((item) => (
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
        </article>
      </section>
    </>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState(getInitialView);
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [sales, setSales] = useState(initialSales);
  const [creditSales, setCreditSales] = useState(initialCreditSales);
  const [salesForm, setSalesForm] = useState(initialSalesForm);
  const [creditForm, setCreditForm] = useState(initialCreditForm);
  const [salesEditingId, setSalesEditingId] = useState('');
  const [creditEditingId, setCreditEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [salesSaving, setSalesSaving] = useState(false);
  const [creditSaving, setCreditSaving] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveView(getInitialView());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  async function loadWorkspace() {
    const [dashboardData, salesData, creditData] = await Promise.all([
      fetchJson(buildUrl('/dashboard')),
      fetchJson(buildUrl('/sales')),
      fetchJson(buildUrl('/credit-sales'))
    ]);

    setDashboard(dashboardData);
    setSales(salesData);
    setCreditSales(creditData);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError('');
        await loadWorkspace();
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  function navigateTo(view) {
    setActiveView(view);
    window.location.hash = view;
  }

  function handleSalesInputChange(event) {
    const { name, value } = event.target;
    setSalesForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleCreditInputChange(event) {
    const { name, value } = event.target;
    setCreditForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function startSalesEdit(item) {
    setSalesEditingId(item.id);
    setSalesForm({
      customerName: item.customerName,
      productName: item.productName,
      amount: String(item.amount),
      status: item.status,
      salesRep: item.salesRep,
      saleDate: item.saleDate,
      notes: item.notes ?? ''
    });
    navigateTo('sales');
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
    navigateTo('credit-sales');
  }

  function cancelSalesEdit() {
    setSalesEditingId('');
    setSalesForm(initialSalesForm);
  }

  function cancelCreditEdit() {
    setCreditEditingId('');
    setCreditForm(initialCreditForm);
  }

  async function handleSalesSubmit(event) {
    event.preventDefault();

    try {
      setSalesSaving(true);
      setError('');
      setNotice('');

      const payload = {
        ...salesForm,
        amount: Number(salesForm.amount)
      };

      await fetchJson(
        salesEditingId ? buildUrl(`/sales/${salesEditingId}`) : buildUrl('/sales'),
        {
          method: salesEditingId ? 'PUT' : 'POST',
          body: JSON.stringify(payload)
        }
      );

      await loadWorkspace();
      cancelSalesEdit();
      setNotice(salesEditingId ? 'تم تعديل عملية البيع بنجاح.' : 'تمت إضافة عملية البيع بنجاح.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSalesSaving(false);
    }
  }

  async function handleCreditSubmit(event) {
    event.preventDefault();

    try {
      setCreditSaving(true);
      setError('');
      setNotice('');

      const payload = {
        ...creditForm,
        amount: Number(creditForm.amount),
        paidAmount: Number(creditForm.paidAmount)
      };

      await fetchJson(
        creditEditingId ? buildUrl(`/credit-sales/${creditEditingId}`) : buildUrl('/credit-sales'),
        {
          method: creditEditingId ? 'PUT' : 'POST',
          body: JSON.stringify(payload)
        }
      );

      await loadWorkspace();
      cancelCreditEdit();
      setNotice(creditEditingId ? 'تم تعديل سجل مبيعات الآجل بنجاح.' : 'تمت إضافة سجل مبيعات الآجل بنجاح.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCreditSaving(false);
    }
  }

  async function handleSalesDelete(id) {
    if (!window.confirm('هل تريد حذف عملية البيع هذه؟')) {
      return;
    }

    try {
      setError('');
      setNotice('');
      await fetchJson(buildUrl(`/sales/${id}`), { method: 'DELETE' });
      await loadWorkspace();
      if (salesEditingId === id) {
        cancelSalesEdit();
      }
      setNotice('تم حذف عملية البيع بنجاح.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCreditDelete(id) {
    if (!window.confirm('هل تريد حذف سجل مبيعات الآجل هذا؟')) {
      return;
    }

    try {
      setError('');
      setNotice('');
      await fetchJson(buildUrl(`/credit-sales/${id}`), { method: 'DELETE' });
      await loadWorkspace();
      if (creditEditingId === id) {
        cancelCreditEdit();
      }
      setNotice('تم حذف سجل مبيعات الآجل بنجاح.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const title = navigation.find((item) => item.id === activeView)?.label ?? 'لوحة التحكم';

  return (
    <div className="app-shell" dir="rtl">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <aside className="sidebar card">


        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <a
              key={item.id}
              className={`nav-link ${activeView === item.id ? 'active' : ''}`}
              href={`#${item.id}`}
              onClick={() => navigateTo(item.id)}
            >
              <strong>{item.label}</strong>
              <span>{item.helper}</span>
            </a>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="workspace-topbar">
          <div>
            <p className="eyebrow">الواجهة الحالية</p>
            <h2>{title}</h2>
          </div>
          <div className="topbar-actions">
            <a className="ghost-button" href="http://localhost:5001/api-docs" target="_blank" rel="noreferrer">
              Swagger
            </a>
          </div>
        </header>

        {notice ? <section className="notice success">{notice}</section> : null}
        {loading ? <section className="notice">جارٍ تحميل بيانات النظام...</section> : null}
        {error ? <section className="notice error">{error}</section> : null}

        {!loading && !error && activeView === 'dashboard' ? (
          <DashboardView dashboard={dashboard} onNavigate={navigateTo} />
        ) : null}

        {!loading && !error && activeView === 'sales' ? (
          <SalesView
            sales={sales}
            form={salesForm}
            editingId={salesEditingId}
            saving={salesSaving}
            onChange={handleSalesInputChange}
            onSubmit={handleSalesSubmit}
            onEdit={startSalesEdit}
            onDelete={handleSalesDelete}
            onCancel={cancelSalesEdit}
          />
        ) : null}

        {!loading && !error && activeView === 'credit-sales' ? (
          <CreditSalesView
            creditSales={creditSales}
            form={creditForm}
            editingId={creditEditingId}
            saving={creditSaving}
            onChange={handleCreditInputChange}
            onSubmit={handleCreditSubmit}
            onEdit={startCreditEdit}
            onDelete={handleCreditDelete}
            onCancel={cancelCreditEdit}
          />
        ) : null}
      </main>
    </div>
  );
}

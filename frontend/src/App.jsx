import { useEffect, useState } from 'react';

const apiBase = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const views = ['dashboard', 'sales', 'credit-sales', 'returns', 'price-list'];

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
  },
  {
    id: 'returns',
    label: 'المرتجعات',
    helper: 'إدارة البضائع المرتجعة'
  },
  {
    id: 'price-list',
    label: 'قائمة الأسعار',
    helper: 'إدارة المنتجات وتسعيرها'
  }
];

const salesStatuses = ['جديدة', 'قيد التنفيذ', 'مكتملة'];
const creditStatuses = ['مستحقة', 'مسدد جزئيا', 'متأخرة', 'مسددة'];
const returnStatuses = ['قيد المراجعة', 'مستلمة', 'تم التعويض', 'مرفوضة'];

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

function Modal({ isOpen, onClose, title, children }) {
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
            <button type="button" className="ghost-button" onClick={() => onNavigate('returns')}>
              إدارة المرتجعات
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
  isFormOpen,
  onOpenForm,
  onCloseForm,
  onChange,
  onSubmit,
  onEdit,
  onDelete
}) {
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

      <Modal isOpen={isFormOpen} onClose={onCloseForm} title={editingId ? 'تعديل عملية بيع' : 'إضافة عملية بيع'}>
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
  onDelete
}) {
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
            {returns.items.map((item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.customerName}</strong>
                    <span className={`status-chip ${getStatusTone(item.status)}`}>{item.status}</span>
                  </div>
                  <p>{item.reason}</p>
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
        </article>
      </section>

      <Modal isOpen={isFormOpen} onClose={onCloseForm} title={editingId ? 'تعديل سجل المرتجع' : 'إضافة مرتجع جديد'}>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            <span>اسم العميل</span>
            <input name="customerName" value={form.customerName} onChange={onChange} />
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
            {priceList.items.map((item) => {
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

export default function App() {
  const [activeView, setActiveView] = useState(getInitialView);
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [sales, setSales] = useState(initialSales);
  const [creditSales, setCreditSales] = useState(initialCreditSales);
  const [returns, setReturns] = useState(initialReturns);
  const [priceList, setPriceList] = useState(initialPriceList);
  const [salesForm, setSalesForm] = useState(initialSalesForm);
  const [creditForm, setCreditForm] = useState(initialCreditForm);
  const [returnsForm, setReturnsForm] = useState(initialReturnsForm);
  const [priceListForm, setPriceListForm] = useState(initialPriceListForm);
  const [salesEditingId, setSalesEditingId] = useState('');
  const [creditEditingId, setCreditEditingId] = useState('');
  const [returnsEditingId, setReturnsEditingId] = useState('');
  const [priceListEditingId, setPriceListEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [salesSaving, setSalesSaving] = useState(false);
  const [creditSaving, setCreditSaving] = useState(false);
  const [returnsSaving, setReturnsSaving] = useState(false);
  const [priceListSaving, setPriceListSaving] = useState(false);

  // Modal visibility state
  const [salesFormOpen, setSalesFormOpen] = useState(false);
  const [creditFormOpen, setCreditFormOpen] = useState(false);
  const [returnsFormOpen, setReturnsFormOpen] = useState(false);
  const [priceListFormOpen, setPriceListFormOpen] = useState(false);

  // Delete confirmation state: { type: 'sales'|'credit'|'returns', id }
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveView(getInitialView());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  async function loadWorkspace() {
    const [dashboardData, salesData, creditData, returnsData, priceListData] = await Promise.all([
      fetchJson(buildUrl('/dashboard')),
      fetchJson(buildUrl('/sales')),
      fetchJson(buildUrl('/credit-sales')),
      fetchJson(buildUrl('/returns')),
      fetchJson(buildUrl('/price-list'))
    ]);

    setDashboard(dashboardData);
    setSales(salesData);
    setCreditSales(creditData);
    setReturns(returnsData);
    setPriceList(priceListData);
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

  // ── Sales ──────────────────────────────────────────────
  function handleSalesInputChange(event) {
    const { name, value } = event.target;
    setSalesForm((current) => ({ ...current, [name]: value }));
  }

  function openSalesForm() {
    setSalesEditingId('');
    setSalesForm(initialSalesForm);
    setSalesFormOpen(true);
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
      setSalesSaving(true);
      setError('');
      setNotice('');
      const payload = { ...salesForm, amount: Number(salesForm.amount) };
      await fetchJson(
        salesEditingId ? buildUrl(`/sales/${salesEditingId}`) : buildUrl('/sales'),
        { method: salesEditingId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      await loadWorkspace();
      const msg = salesEditingId ? 'تم تعديل عملية البيع بنجاح.' : 'تمت إضافة عملية البيع بنجاح.';
      closeSalesForm();
      setNotice(msg);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSalesSaving(false);
    }
  }

  function requestSalesDelete(id) {
    setDeleteTarget({ type: 'sales', id });
  }

  async function confirmSalesDelete() {
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      setError('');
      setNotice('');
      await fetchJson(buildUrl(`/sales/${id}`), { method: 'DELETE' });
      await loadWorkspace();
      setNotice('تم حذف عملية البيع بنجاح.');
    } catch (requestError) {
      setError(requestError.message);
    }
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
        { method: creditEditingId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      await loadWorkspace();
      const msg = creditEditingId ? 'تم تعديل سجل مبيعات الآجل بنجاح.' : 'تمت إضافة سجل مبيعات الآجل بنجاح.';
      closeCreditForm();
      setNotice(msg);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCreditSaving(false);
    }
  }

  function requestCreditDelete(id) {
    setDeleteTarget({ type: 'credit', id });
  }

  async function confirmCreditDelete() {
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      setError('');
      setNotice('');
      await fetchJson(buildUrl(`/credit-sales/${id}`), { method: 'DELETE' });
      await loadWorkspace();
      setNotice('تم حذف سجل مبيعات الآجل بنجاح.');
    } catch (requestError) {
      setError(requestError.message);
    }
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
      setReturnsSaving(true);
      setError('');
      setNotice('');
      const payload = { ...returnsForm, amount: Number(returnsForm.amount) };
      await fetchJson(
        returnsEditingId ? buildUrl(`/returns/${returnsEditingId}`) : buildUrl('/returns'),
        { method: returnsEditingId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      await loadWorkspace();
      const msg = returnsEditingId ? 'تم تعديل المرتجع بنجاح.' : 'تمت إضافة المرتجع بنجاح.';
      closeReturnsForm();
      setNotice(msg);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setReturnsSaving(false);
    }
  }

  function requestReturnsDelete(id) {
    setDeleteTarget({ type: 'returns', id });
  }

  async function confirmReturnsDelete() {
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      setError('');
      setNotice('');
      await fetchJson(buildUrl(`/returns/${id}`), { method: 'DELETE' });
      await loadWorkspace();
      setNotice('تم حذف المرتجع بنجاح.');
    } catch (requestError) {
      setError(requestError.message);
    }
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
      setPriceListSaving(true);
      setError('');
      setNotice('');
      const payload = {
        ...priceListForm,
        purchasePrice: Number(priceListForm.purchasePrice),
        sellingPrice: Number(priceListForm.sellingPrice)
      };
      await fetchJson(
        priceListEditingId ? buildUrl(`/price-list/${priceListEditingId}`) : buildUrl('/price-list'),
        { method: priceListEditingId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      await loadWorkspace();
      const msg = priceListEditingId ? 'تم تعديل المنتج بنجاح.' : 'تمت إضافة المنتج بنجاح.';
      closePriceListForm();
      setNotice(msg);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPriceListSaving(false);
    }
  }

  function requestPriceListDelete(id) {
    setDeleteTarget({ type: 'price-list', id });
  }

  async function confirmPriceListDelete() {
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      setError('');
      setNotice('');
      await fetchJson(buildUrl(`/price-list/${id}`), { method: 'DELETE' });
      await loadWorkspace();
      setNotice('تم حذف المنتج بنجاح.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'sales') confirmSalesDelete();
    else if (deleteTarget.type === 'credit') confirmCreditDelete();
    else if (deleteTarget.type === 'returns') confirmReturnsDelete();
    else if (deleteTarget.type === 'price-list') confirmPriceListDelete();
  }

  const deleteMessages = {
    sales: 'هل أنت متأكد من حذف عملية البيع هذه؟ لا يمكن التراجع عن هذا الإجراء.',
    credit: 'هل أنت متأكد من حذف سجل مبيعات الآجل هذا؟ لا يمكن التراجع عن هذا الإجراء.',
    returns: 'هل أنت متأكد من حذف هذا المرتجع؟ لا يمكن التراجع عن هذا الإجراء.',
    'price-list': 'هل أنت متأكد من حذف هذا المنتج من قائمة الأسعار؟ لا يمكن التراجع عن هذا الإجراء.'
  };

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
            isFormOpen={salesFormOpen}
            onOpenForm={openSalesForm}
            onCloseForm={closeSalesForm}
            onChange={handleSalesInputChange}
            onSubmit={handleSalesSubmit}
            onEdit={startSalesEdit}
            onDelete={requestSalesDelete}
          />
        ) : null}

        {!loading && !error && activeView === 'credit-sales' ? (
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

        {!loading && !error && activeView === 'returns' ? (
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
          />
        ) : null}

        {!loading && !error && activeView === 'price-list' ? (
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
      </main>

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


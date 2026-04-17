import { useEffect, useState } from 'react';

const apiBase = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const views = [
  'dashboard',
  'final-product-store',
  'raw-materials-packaging-store',
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
    id: 'rep-sub-stores',
    label: 'مخازن فرعية للمناديب',
    helper: 'متابعة العهد والمخزون لدى المناديب'
  },
  {
    id: 'financial-manager-custody',
    label: 'عهدة المدير المالي',
    helper: 'توزيع عهد الموظفين من عهدة المدير المالي'
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
    id: 'custodies',
    label: 'العهد',
    helper: 'إدارة العهد النقدية والعينية'
  },
  {
    id: 'statement',
    label: 'كشف حساب',
    helper: 'استعراض حركة العميل ورصيده'
  }
];

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

const initialCheckForm = {
  customerName: '',
  checkNumber: '',
  bankName: '',
  amount: '',
  collectionDate: '',
  status: 'معلق',
  notes: ''
};

const initialFinalProductStore = { overview: [], items: [] };
const initialRawMaterialsStore = { overview: [], items: [] };
const initialRepSubStores = { overview: [], items: [] };
const initialFinManagerCustody = { overview: [], items: [] };
const initialRawPurchases = { overview: [], items: [] };
const initialMachinePurchases = { overview: [], items: [] };
const initialMiscPurchases = { overview: [], items: [] };
const initialPayrollAdvances = { overview: [], items: [] };
const initialPaymentAlerts = { overview: [], items: [] };

const initialFinalProductForm = { productName: '', category: '', quantity: '', unit: 'قطعة', minStock: '', status: 'متوفر', notes: '' };
const initialRawMaterialForm = { materialName: '', category: '', quantity: '', unit: 'كجم', minStock: '', status: 'متوفر', notes: '' };
const initialRepSubStoreForm = { repName: '', productName: '', quantity: '', deliveryDate: '', status: 'مسلّم', notes: '' };
const initialFinManagerCustodyForm = { employeeName: '', amount: '', purpose: '', custodyDate: '', status: 'نشطة', notes: '' };
const initialRawPurchaseForm = { supplierName: '', materialName: '', quantity: '', unitPrice: '', purchaseDate: '', invoiceNumber: '', notes: '' };
const initialMachinePurchaseForm = { supplierName: '', description: '', amount: '', purchaseDate: '', machineName: '', invoiceNumber: '', notes: '' };
const initialMiscPurchaseForm = { description: '', amount: '', category: '', purchaseDate: '', receiptNumber: '', notes: '' };
const initialPayrollAdvanceForm = { employeeName: '', type: 'راتب', amount: '', month: '', status: 'معلق', notes: '' };
const initialPaymentAlertForm = { customerName: '', amount: '', dueDate: '', alertType: 'فاتورة آجل', status: 'قادم', notes: '' };

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

function GenericCrudView({ data, eyebrow, headline, addLabel, emptyLabel, renderRow, form, editingId, saving, isFormOpen, onOpenForm, onCloseForm, onSubmit, formTitle, formFields }) {
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
            <button type="button" className="primary-button" onClick={onOpenForm}>{addLabel}</button>
          </div>
          <div className="table-list">
            {data.items.map(renderRow)}
            {data.items.length === 0 && <p className="empty-notice">{emptyLabel}</p>}
          </div>
        </article>
      </section>
      <Modal isOpen={isFormOpen} onClose={onCloseForm} title={editingId ? `تعديل ${formTitle}` : `إضافة ${formTitle}`}>
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

function DashboardView({ dashboard, onNavigate }) {
  const { meta, brand, summary, alerts, recentSales, recentCreditSales } = dashboard;
  const quickLinks = navigation.filter((item) => item.id !== 'dashboard');
  const heroButtonLabels = {
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
                className={item.id === 'sales' ? 'primary-button' : 'ghost-button'}
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


function CustodiesView({
  custodies,
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
  onManageTransactions
}) {  return (
    <>
      <SummaryCards items={custodies.overview} />

      <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
        <article className="card table-card">
          <div className="table-actions-header">
            <div>
              <p className="eyebrow">إدارة العهد</p>
              <h3>سجل العهد النقدية والعينية</h3>
            </div>
            <button type="button" className="primary-button" onClick={onOpenForm}>
              إضافة عهدة
            </button>
          </div>

          <div className="table-list">
            {custodies.items.map((item) => (
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
                      {item.custodyType === 'نقدية' ? 'تتبع مصاريف' : 'سجل حركة'}
                    </button>
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

      <Modal isOpen={isFormOpen} onClose={onCloseForm} title={editingId ? 'تعديل العهدة' : 'إضافة عهدة جديدة'}>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            <span>اسم المستلم</span>
            <input name="employeeName" value={form.employeeName} onChange={onChange} required />
          </label>
          <label>
            <span>نوع العهدة</span>
            <select name="custodyType" value={form.custodyType} onChange={onChange}>
              {custodyTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          {form.custodyType === 'نقدية' ? (
            <label>
              <span>قيمة العهدة</span>
              <input name="initialAmount" type="number" min="0" step="0.01" value={form.initialAmount} onChange={onChange} required />
            </label>
          ) : (
            <label>
              <span>بيانات العهدة العينية</span>
              <input name="itemDetails" value={form.itemDetails || ''} onChange={onChange} placeholder="مثال: لابتوب ديل - رقم 123" required />
            </label>
          )}
          <label>
            <span>حالة العهدة</span>
            <select name="status" value={form.status} onChange={onChange}>
              {custodyStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label>
            <span>تاريخ التسليم</span>
            <input name="startDate" type="date" value={form.startDate} onChange={onChange} />
          </label>
          <label className="full-width">
            <span>ملاحظات</span>
            <textarea name="notes" rows="2" value={form.notes} onChange={onChange} />
          </label>

          <div className="form-actions full-width" style={{ marginTop: '16px' }}>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديل' : 'إضافة العهدة'}
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
  onDelete
}) {
  const today = getTodayLocalDateKey();
  const todayChecks = checks.items.filter(
    (item) => item.collectionDate === today && item.status === 'معلق'
  );

  return (
    <>
      <SummaryCards items={checks.overview} />

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
            {checks.items.map((item) => {
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
        </article>
      </section>

      <Modal isOpen={isFormOpen} onClose={onCloseForm} title={editingId ? 'تعديل الشيك' : 'إضافة شيك جديد'}>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            <span>اسم العميل / الساحب</span>
            <input name="customerName" value={form.customerName} onChange={onChange} required />
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
  const [custodies, setCustodies] = useState(initialCustodies);
  const [checks, setChecks] = useState(initialChecks);
  const [statement, setStatement] = useState(initialStatement);
  const [salesForm, setSalesForm] = useState(initialSalesForm);
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
  const [finalProductStore, setFinalProductStore] = useState(initialFinalProductStore);
  const [rawMaterialsStore, setRawMaterialsStore] = useState(initialRawMaterialsStore);
  const [repSubStores, setRepSubStores] = useState(initialRepSubStores);
  const [finManagerCustody, setFinManagerCustody] = useState(initialFinManagerCustody);
  const [rawPurchases, setRawPurchases] = useState(initialRawPurchases);
  const [machinePurchases, setMachinePurchases] = useState(initialMachinePurchases);
  const [miscPurchases, setMiscPurchases] = useState(initialMiscPurchases);
  const [payrollAdvances, setPayrollAdvances] = useState(initialPayrollAdvances);
  const [paymentAlerts, setPaymentAlerts] = useState(initialPaymentAlerts);

  const [fpForm, setFpForm] = useState(initialFinalProductForm);
  const [rmForm, setRmForm] = useState(initialRawMaterialForm);
  const [rssForm, setRssForm] = useState(initialRepSubStoreForm);
  const [fmcForm, setFmcForm] = useState(initialFinManagerCustodyForm);
  const [rmpForm, setRmpForm] = useState(initialRawPurchaseForm);
  const [mmpForm, setMmpForm] = useState(initialMachinePurchaseForm);
  const [mscForm, setMscForm] = useState(initialMiscPurchaseForm);
  const [payForm, setPayForm] = useState(initialPayrollAdvanceForm);
  const [cpaForm, setCpaForm] = useState(initialPaymentAlertForm);

  const [fpEditingId, setFpEditingId] = useState('');
  const [rmEditingId, setRmEditingId] = useState('');
  const [rssEditingId, setRssEditingId] = useState('');
  const [fmcEditingId, setFmcEditingId] = useState('');
  const [rmpEditingId, setRmpEditingId] = useState('');
  const [mmpEditingId, setMmpEditingId] = useState('');
  const [mscEditingId, setMscEditingId] = useState('');
  const [payEditingId, setPayEditingId] = useState('');
  const [cpaEditingId, setCpaEditingId] = useState('');

  const [fpSaving, setFpSaving] = useState(false);
  const [rmSaving, setRmSaving] = useState(false);
  const [rssSaving, setRssSaving] = useState(false);
  const [fmcSaving, setFmcSaving] = useState(false);
  const [rmpSaving, setRmpSaving] = useState(false);
  const [mmpSaving, setMmpSaving] = useState(false);
  const [mscSaving, setMscSaving] = useState(false);
  const [paySaving, setPaySaving] = useState(false);
  const [cpaSaving, setCpaSaving] = useState(false);

  const [fpFormOpen, setFpFormOpen] = useState(false);
  const [rmFormOpen, setRmFormOpen] = useState(false);
  const [rssFormOpen, setRssFormOpen] = useState(false);
  const [fmcFormOpen, setFmcFormOpen] = useState(false);
  const [rmpFormOpen, setRmpFormOpen] = useState(false);
  const [mmpFormOpen, setMmpFormOpen] = useState(false);
  const [mscFormOpen, setMscFormOpen] = useState(false);
  const [payFormOpen, setPayFormOpen] = useState(false);
  const [cpaFormOpen, setCpaFormOpen] = useState(false);

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

  async function loadWorkspace() {
    const [dashboardData, salesData, creditData, returnsData, priceListData, custodiesData, checksData,
      fpData, rmData, rssData, fmcData, rmpData, mmpData, mscData, payData, cpaData
    ] = await Promise.all([
      fetchJson(buildUrl('/dashboard')),
      fetchJson(buildUrl('/sales')),
      fetchJson(buildUrl('/credit-sales')),
      fetchJson(buildUrl('/returns')),
      fetchJson(buildUrl('/price-list')),
      fetchJson(buildUrl('/custodies')),
      fetchJson(buildUrl('/checks')),
      fetchJson(buildUrl('/final-product-store')),
      fetchJson(buildUrl('/raw-materials-store')),
      fetchJson(buildUrl('/rep-sub-stores')),
      fetchJson(buildUrl('/financial-manager-custody')),
      fetchJson(buildUrl('/raw-materials-purchases')),
      fetchJson(buildUrl('/machine-maintenance-purchases')),
      fetchJson(buildUrl('/misc-purchases')),
      fetchJson(buildUrl('/payroll-advances')),
      fetchJson(buildUrl('/customer-payment-alerts'))
    ]);

    setDashboard(dashboardData);
    setSales(salesData);
    setCreditSales(creditData);
    setReturns(returnsData);
    setPriceList(priceListData);
    setCustodies(custodiesData);
    setChecks(checksData);
    setFinalProductStore(fpData);
    setRawMaterialsStore(rmData);
    setRepSubStores(rssData);
    setFinManagerCustody(fmcData);
    setRawPurchases(rmpData);
    setMachinePurchases(mmpData);
    setMiscPurchases(mscData);
    setPayrollAdvances(payData);
    setPaymentAlerts(cpaData);

    // Update notification for today's pending checks
    const today = getTodayLocalDateKey();
    const todayPending = checksData.items.filter(
      (item) => item.collectionDate === today && item.status === 'معلق'
    );
    if (todayPending.length > 0) {
      setCheckNotification({
        count: todayPending.length,
        total: todayPending.reduce((s, c) => s + c.amount, 0)
      });
      setNotificationDismissed(false);
    } else {
      setCheckNotification(null);
    }
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

  // Periodic notification refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const checksData = await fetchJson(buildUrl('/checks'));
        setChecks(checksData);
        const today = getTodayLocalDateKey();
        const todayPending = checksData.items.filter(
          (item) => item.collectionDate === today && item.status === 'معلق'
        );
        if (todayPending.length > 0) {
          setCheckNotification({ count: todayPending.length, total: todayPending.reduce((s, c) => s + c.amount, 0) });
          setNotificationDismissed(false);
        } else {
          setCheckNotification(null);
        }
      } catch {
        // silently ignore background refresh errors
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
      setCheckSaving(true);
      setError('');
      setNotice('');
      const payload = { ...checkForm, amount: Number(checkForm.amount) };
      await fetchJson(
        checkEditingId ? buildUrl(`/checks/${checkEditingId}`) : buildUrl('/checks'),
        { method: checkEditingId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      await loadWorkspace();
      const msg = checkEditingId ? 'تم تعديل الشيك بنجاح.' : 'تمت إضافة الشيك بنجاح.';
      closeCheckForm();
      setNotice(msg);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCheckSaving(false);
    }
  }

  function requestCheckDelete(id) {
    setDeleteTarget({ type: 'check', id });
  }

  async function confirmCheckDelete() {
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      setError('');
      setNotice('');
      await fetchJson(buildUrl(`/checks/${id}`), { method: 'DELETE' });
      await loadWorkspace();
      setNotice('تم حذف الشيك بنجاح.');
    } catch (requestError) {
      setError(requestError.message);
    }
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


  // ── Custodies ─────────────────────────────────────────
  function handleCustodyInputChange(event) {
    const { name, value } = event.target;
    setCustodyForm((current) => ({ ...current, [name]: value }));
  }

  function openCustodyForm() {
    setCustodyEditingId('');
    setCustodyForm(initialCustodyForm);
    setCustodyFormOpen(true);
  }

  function startCustodyEdit(item) {
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
      setCustodiesSaving(true);
      setError('');
      setNotice('');
      const payload = {
        ...custodyForm,
        initialAmount: Number(custodyForm.initialAmount)
      };
      await fetchJson(
        custodyEditingId ? buildUrl(`/custodies/${custodyEditingId}`) : buildUrl('/custodies'),
        { method: custodyEditingId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      await loadWorkspace();
      const msg = custodyEditingId ? 'تم تعديل العهدة بنجاح.' : 'تمت إضافة العهدة بنجاح.';
      closeCustodyForm();
      setNotice(msg);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCustodiesSaving(false);
    }
  }

  function requestCustodyDelete(id) {
    setDeleteTarget({ type: 'custodies', id });
  }

  async function confirmCustodyDelete() {
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      setError('');
      setNotice('');
      await fetchJson(buildUrl(`/custodies/${id}`), { method: 'DELETE' });
      await loadWorkspace();
      setNotice('تم حذف العهدة بنجاح.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function openCustodyTransactions(id) {
    setActiveCustodyId(id);
    try {
      setError('');
      const txs = await fetchJson(buildUrl(`/custodies/${id}/transactions`));
      setActiveCustodyTransactions(txs);
      setTransactionsModalOpen(true);
      setTransactionForm(initialTransactionForm);
    } catch (requestError) {
      setError(requestError.message);
    }
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
      setTransactionSaving(true);
      setError('');
      setNotice('');
      const payload = {
        ...transactionForm,
        amount: Number(transactionForm.amount)
      };
      await fetchJson(buildUrl(`/custodies/${activeCustodyId}/transactions`), {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const txs = await fetchJson(buildUrl(`/custodies/${activeCustodyId}/transactions`));
      setActiveCustodyTransactions(txs);
      await loadWorkspace();
      setNotice('تم تسجيل الحركة بنجاح.');
      setTransactionForm(initialTransactionForm);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setTransactionSaving(false);
    }
  }

  function requestTransactionDelete(id) {
    setDeleteTarget({ type: 'transaction', id });
  }

  // ── Generic CRUD helper ────────────────────────────────
  function makeModuleCrud(apiPath, setData, form, setForm, initialForm, editingId, setEditingId, saving, setSaving, formOpen, setFormOpen, mapToPayload, mapToForm, deleteType, entityLabel) {
    function handleInput(e) { const { name, value } = e.target; setForm(c => ({ ...c, [name]: value })); }
    function openForm() { setEditingId(''); setForm(initialForm); setFormOpen(true); }
    function startEdit(item) { setEditingId(item.id); setForm(mapToForm(item)); setFormOpen(true); }
    function closeForm() { setFormOpen(false); setEditingId(''); setForm(initialForm); }
    async function handleSubmit(e) {
      e.preventDefault();
      try {
        setSaving(true); setError(''); setNotice('');
        const payload = mapToPayload(form);
        await fetchJson(editingId ? buildUrl(`${apiPath}/${editingId}`) : buildUrl(apiPath), { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        await loadWorkspace();
        closeForm();
        setNotice(editingId ? `تم تعديل ${entityLabel} بنجاح.` : `تمت إضافة ${entityLabel} بنجاح.`);
      } catch (err) { setError(err.message); } finally { setSaving(false); }
    }
    function requestDelete(id) { setDeleteTarget({ type: deleteType, id }); }
    async function confirmDelete() {
      const id = deleteTarget.id; setDeleteTarget(null);
      try { setError(''); setNotice(''); await fetchJson(buildUrl(`${apiPath}/${id}`), { method: 'DELETE' }); await loadWorkspace(); setNotice(`تم حذف ${entityLabel} بنجاح.`); } catch (err) { setError(err.message); }
    }
    return { handleInput, openForm, startEdit, closeForm, handleSubmit, requestDelete, confirmDelete };
  }

  const fpCrud = makeModuleCrud('/final-product-store', setFinalProductStore, fpForm, setFpForm, initialFinalProductForm, fpEditingId, setFpEditingId, fpSaving, setFpSaving, fpFormOpen, setFpFormOpen,
    f => ({ ...f, quantity: Number(f.quantity||0), minStock: Number(f.minStock||0) }),
    i => ({ productName: i.productName, category: i.category, quantity: String(i.quantity), unit: i.unit, minStock: String(i.minStock), status: i.status, notes: i.notes||'' }),
    'fp', 'المنتج');

  const rmCrud = makeModuleCrud('/raw-materials-store', setRawMaterialsStore, rmForm, setRmForm, initialRawMaterialForm, rmEditingId, setRmEditingId, rmSaving, setRmSaving, rmFormOpen, setRmFormOpen,
    f => ({ ...f, quantity: Number(f.quantity||0), minStock: Number(f.minStock||0) }),
    i => ({ materialName: i.materialName, category: i.category, quantity: String(i.quantity), unit: i.unit, minStock: String(i.minStock), status: i.status, notes: i.notes||'' }),
    'rm', 'الخامة');

  const rssCrud = makeModuleCrud('/rep-sub-stores', setRepSubStores, rssForm, setRssForm, initialRepSubStoreForm, rssEditingId, setRssEditingId, rssSaving, setRssSaving, rssFormOpen, setRssFormOpen,
    f => ({ ...f, quantity: Number(f.quantity||0) }),
    i => ({ repName: i.repName, productName: i.productName, quantity: String(i.quantity), deliveryDate: i.deliveryDate||'', status: i.status, notes: i.notes||'' }),
    'rss', 'السجل');

  const fmcCrud = makeModuleCrud('/financial-manager-custody', setFinManagerCustody, fmcForm, setFmcForm, initialFinManagerCustodyForm, fmcEditingId, setFmcEditingId, fmcSaving, setFmcSaving, fmcFormOpen, setFmcFormOpen,
    f => ({ ...f, amount: Number(f.amount||0) }),
    i => ({ employeeName: i.employeeName, amount: String(i.amount), purpose: i.purpose, custodyDate: i.custodyDate||'', status: i.status, notes: i.notes||'' }),
    'fmc', 'العهدة');

  const rmpCrud = makeModuleCrud('/raw-materials-purchases', setRawPurchases, rmpForm, setRmpForm, initialRawPurchaseForm, rmpEditingId, setRmpEditingId, rmpSaving, setRmpSaving, rmpFormOpen, setRmpFormOpen,
    f => ({ ...f, quantity: Number(f.quantity||0), unitPrice: Number(f.unitPrice||0) }),
    i => ({ supplierName: i.supplierName, materialName: i.materialName, quantity: String(i.quantity), unitPrice: String(i.unitPrice), purchaseDate: i.purchaseDate||'', invoiceNumber: i.invoiceNumber, notes: i.notes||'' }),
    'rmp', 'الفاتورة');

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

  async function confirmTransactionDelete() {
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      setError('');
      setNotice('');
      await fetchJson(buildUrl(`/custodies/${activeCustodyId}/transactions/${id}`), { method: 'DELETE' });
      const txs = await fetchJson(buildUrl(`/custodies/${activeCustodyId}/transactions`));
      setActiveCustodyTransactions(txs);
      await loadWorkspace();
      setNotice('تم التراجع عن الحركة بنجاح.');
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
    else if (deleteTarget.type === 'custodies') confirmCustodyDelete();
    else if (deleteTarget.type === 'transaction') confirmTransactionDelete();
    else if (deleteTarget.type === 'check') confirmCheckDelete();
    else if (deleteTarget.type === 'fp') fpCrud.confirmDelete();
    else if (deleteTarget.type === 'rm') rmCrud.confirmDelete();
    else if (deleteTarget.type === 'rss') rssCrud.confirmDelete();
    else if (deleteTarget.type === 'fmc') fmcCrud.confirmDelete();
    else if (deleteTarget.type === 'rmp') rmpCrud.confirmDelete();
    else if (deleteTarget.type === 'mmp') mmpCrud.confirmDelete();
    else if (deleteTarget.type === 'msc') mscCrud.confirmDelete();
    else if (deleteTarget.type === 'pay') payCrud.confirmDelete();
    else if (deleteTarget.type === 'cpa') cpaCrud.confirmDelete();
  }

  const deleteMessages = {
    sales: 'هل أنت متأكد من حذف عملية البيع هذه؟ لا يمكن التراجع عن هذا الإجراء.',
    credit: 'هل أنت متأكد من حذف سجل مبيعات الآجل هذا؟ لا يمكن التراجع عن هذا الإجراء.',
    returns: 'هل أنت متأكد من حذف هذا المرتجع؟ لا يمكن التراجع عن هذا الإجراء.',
    'price-list': 'هل أنت متأكد من حذف هذا المنتج من قائمة الأسعار؟ لا يمكن التراجع عن هذا الإجراء.',
    custodies: 'هل أنت متأكد من حذف العهدة؟ لا يمكن التراجع، سيتم حذف جميع الحركات المتعلقة.',
    transaction: 'هل أنت متأكد من حذف هذه الحركة؟ سيتم استرجاع رصيد العهدة كالمعاملة العكسية.',
    check: 'هل أنت متأكد من حذف هذا الشيك؟ لا يمكن التراجع عن هذا الإجراء.',
    fp: 'هل أنت متأكد من حذف هذا المنتج من المخزن؟ لا يمكن التراجع عن هذا الإجراء.',
    rm: 'هل أنت متأكد من حذف هذه الخامة؟ لا يمكن التراجع عن هذا الإجراء.',
    rss: 'هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.',
    fmc: 'هل أنت متأكد من حذف هذه العهدة؟ لا يمكن التراجع عن هذا الإجراء.',
    rmp: 'هل أنت متأكد من حذف فاتورة المشتريات؟ لا يمكن التراجع عن هذا الإجراء.',
    mmp: 'هل أنت متأكد من حذف عملية الصيانة؟ لا يمكن التراجع عن هذا الإجراء.',
    msc: 'هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.',
    pay: 'هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.',
    cpa: 'هل أنت متأكد من حذف هذا التنبيه؟ لا يمكن التراجع عن هذا الإجراء.'
  };

  const title = navigation.find((item) => item.id === activeView)?.label ?? 'لوحة التحكم';
  const placeholderModule = placeholderModuleConfig[activeView] ?? null;
  const loggedInEmail = getLoggedInEmail();
  const avatarInitial = loggedInEmail.charAt(0).toUpperCase();
  const notificationsCount = checkNotification && !notificationDismissed ? checkNotification.count : 0;

  return (
    <div className="app-shell" dir="rtl">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="workspace-topbar card">
        <div>
          <p className="eyebrow">الواجهة الحالية</p>
          <h2>{title}</h2>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className={`notification-icon-button ${notificationsCount > 0 ? 'has-alert' : ''}`}
            onClick={() => {
              navigateTo('checks');
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

          <div className="user-profile-chip" title={loggedInEmail}>
            <div className="user-profile-meta">
              <span>الحساب الحالي</span>
              <strong>{loggedInEmail}</strong>
            </div>
            <div className="user-avatar" aria-hidden="true">{avatarInitial}</div>
          </div>

          <a className="ghost-button" href="http://localhost:5001/api-docs" target="_blank" rel="noreferrer">
            Swagger
          </a>
        </div>
      </header>

      <aside className="sidebar card">
        <nav className="sidebar-nav">
          {navigation.map((item) => (
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
        </nav>
      </aside>

      <main className="workspace">
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

        {!loading && !error && activeView === 'custodies' ? (
          <CustodiesView
            custodies={custodies}
            form={custodyForm}
            editingId={custodyEditingId}
            saving={custodiesSaving}
            isFormOpen={custodyFormOpen}
            onOpenForm={openCustodyForm}
            onCloseForm={closeCustodyForm}
            onChange={handleCustodyInputChange}
            onSubmit={handleCustodySubmit}
            onEdit={startCustodyEdit}
            onDelete={requestCustodyDelete}
            onManageTransactions={openCustodyTransactions}
          />
        ) : null}

        {!loading && !error && activeView === 'statement' ? (
          <StatementView
            statement={statement}
            customers={customerOptions}
            onCustomerChange={handleStatementCustomerChange}
            onPrint={handleStatementPrint}
          />
        ) : null}

        {!loading && !error && activeView === 'checks' ? (
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
          />
        ) : null}

        {!loading && !error && activeView === 'final-product-store' ? (
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
              <label><span>اسم المنتج</span><input name="productName" value={fpForm.productName} onChange={fpCrud.handleInput} required /></label>
              <label><span>التصنيف</span><input name="category" value={fpForm.category} onChange={fpCrud.handleInput} /></label>
              <label><span>الكمية</span><input name="quantity" type="number" min="0" value={fpForm.quantity} onChange={fpCrud.handleInput} /></label>
              <label><span>الوحدة</span><input name="unit" value={fpForm.unit} onChange={fpCrud.handleInput} /></label>
              <label><span>الحد الأدنى</span><input name="minStock" type="number" min="0" value={fpForm.minStock} onChange={fpCrud.handleInput} /></label>
              <label><span>الحالة</span><select name="status" value={fpForm.status} onChange={fpCrud.handleInput}>{storeStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={fpForm.notes} onChange={fpCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && !error && activeView === 'raw-materials-packaging-store' ? (
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
            form={rmForm}
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
              <label><span>اسم الخامة</span><input name="materialName" value={rmForm.materialName} onChange={rmCrud.handleInput} required /></label>
              <label><span>التصنيف</span><input name="category" value={rmForm.category} onChange={rmCrud.handleInput} /></label>
              <label><span>الكمية</span><input name="quantity" type="number" min="0" value={rmForm.quantity} onChange={rmCrud.handleInput} /></label>
              <label><span>الوحدة</span><input name="unit" value={rmForm.unit} onChange={rmCrud.handleInput} /></label>
              <label><span>الحد الأدنى</span><input name="minStock" type="number" min="0" value={rmForm.minStock} onChange={rmCrud.handleInput} /></label>
              <label><span>الحالة</span><select name="status" value={rmForm.status} onChange={rmCrud.handleInput}>{storeStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={rmForm.notes} onChange={rmCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && !error && activeView === 'rep-sub-stores' ? (
          <GenericCrudView
            data={repSubStores}
            eyebrow="مخازن المناديب"
            headline="متابعة العهد والمخزون لدى المناديب"
            addLabel="إضافة سجل"
            emptyLabel="لا توجد سجلات بعد."
            formTitle="سجل مندوب"
            editingId={rssEditingId}
            saving={rssSaving}
            isFormOpen={rssFormOpen}
            onOpenForm={rssCrud.openForm}
            onCloseForm={rssCrud.closeForm}
            onSubmit={rssCrud.handleSubmit}
            form={rssForm}
            renderRow={(item) => (
              <article key={item.id} className="table-row">
                <div className="table-main">
                  <div className="record-top">
                    <strong>{item.repName}</strong>
                    <span className={`status-chip ${item.status === 'مسلّم' ? 'success' : item.status === 'مسترد' ? 'neutral' : 'warning'}`}>{item.status}</span>
                  </div>
                  <p>{item.productName} · الكمية: {item.quantity}</p>
                  <small>{formatDate(item.deliveryDate)}</small>
                </div>
                <div className="table-side">
                  <div className="row-actions">
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
        ) : null}

        {!loading && !error && activeView === 'financial-manager-custody' ? (
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
            onOpenForm={fmcCrud.openForm}
            onCloseForm={fmcCrud.closeForm}
            onSubmit={fmcCrud.handleSubmit}
            form={fmcForm}
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
                    <button type="button" className="ghost-button small" onClick={() => fmcCrud.startEdit(item)}>تعديل</button>
                    <button type="button" className="danger-button small" onClick={() => fmcCrud.requestDelete(item.id)}>حذف</button>
                  </div>
                </div>
              </article>
            )}
            formFields={<>
              <label><span>اسم الموظف</span><input name="employeeName" value={fmcForm.employeeName} onChange={fmcCrud.handleInput} required /></label>
              <label><span>المبلغ</span><input name="amount" type="number" min="0" step="0.01" value={fmcForm.amount} onChange={fmcCrud.handleInput} required /></label>
              <label><span>الغرض</span><input name="purpose" value={fmcForm.purpose} onChange={fmcCrud.handleInput} /></label>
              <label><span>التاريخ</span><input name="custodyDate" type="date" value={fmcForm.custodyDate} onChange={fmcCrud.handleInput} /></label>
              <label><span>الحالة</span><select name="status" value={fmcForm.status} onChange={fmcCrud.handleInput}>{custodyStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={fmcForm.notes} onChange={fmcCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && !error && activeView === 'raw-materials-purchases' ? (
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
            onOpenForm={rmpCrud.openForm}
            onCloseForm={rmpCrud.closeForm}
            onSubmit={rmpCrud.handleSubmit}
            form={rmpForm}
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
              <label><span>اسم المورد</span><input name="supplierName" value={rmpForm.supplierName} onChange={rmpCrud.handleInput} required /></label>
              <label><span>اسم الخامة</span><input name="materialName" value={rmpForm.materialName} onChange={rmpCrud.handleInput} required /></label>
              <label><span>الكمية</span><input name="quantity" type="number" min="0" step="0.01" value={rmpForm.quantity} onChange={rmpCrud.handleInput} required /></label>
              <label><span>سعر الوحدة</span><input name="unitPrice" type="number" min="0" step="0.01" value={rmpForm.unitPrice} onChange={rmpCrud.handleInput} required /></label>
              <label><span>تاريخ الشراء</span><input name="purchaseDate" type="date" value={rmpForm.purchaseDate} onChange={rmpCrud.handleInput} /></label>
              <label><span>رقم الفاتورة</span><input name="invoiceNumber" value={rmpForm.invoiceNumber} onChange={rmpCrud.handleInput} /></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={rmpForm.notes} onChange={rmpCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && !error && activeView === 'machine-maintenance-purchases' ? (
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
            onOpenForm={mmpCrud.openForm}
            onCloseForm={mmpCrud.closeForm}
            onSubmit={mmpCrud.handleSubmit}
            form={mmpForm}
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
              <label><span>اسم المورد</span><input name="supplierName" value={mmpForm.supplierName} onChange={mmpCrud.handleInput} required /></label>
              <label><span>وصف العملية</span><input name="description" value={mmpForm.description} onChange={mmpCrud.handleInput} required /></label>
              <label><span>القيمة</span><input name="amount" type="number" min="0" step="0.01" value={mmpForm.amount} onChange={mmpCrud.handleInput} required /></label>
              <label><span>اسم الماكينة</span><input name="machineName" value={mmpForm.machineName} onChange={mmpCrud.handleInput} /></label>
              <label><span>تاريخ الشراء</span><input name="purchaseDate" type="date" value={mmpForm.purchaseDate} onChange={mmpCrud.handleInput} /></label>
              <label><span>رقم الفاتورة</span><input name="invoiceNumber" value={mmpForm.invoiceNumber} onChange={mmpCrud.handleInput} /></label>
              <label className="full-width"><span>ملاحظات</span><textarea name="notes" rows="2" value={mmpForm.notes} onChange={mmpCrud.handleInput} /></label>
            </>}
          />
        ) : null}

        {!loading && !error && activeView === 'misc-purchases' ? (
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
            onOpenForm={mscCrud.openForm}
            onCloseForm={mscCrud.closeForm}
            onSubmit={mscCrud.handleSubmit}
            form={mscForm}
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

        {!loading && !error && activeView === 'payroll-advances' ? (
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
            onOpenForm={payCrud.openForm}
            onCloseForm={payCrud.closeForm}
            onSubmit={payCrud.handleSubmit}
            form={payForm}
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

        {!loading && !error && activeView === 'customer-payment-alerts' ? (
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
            form={cpaForm}
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


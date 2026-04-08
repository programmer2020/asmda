const initialSales = [
  {
    id: 'SAL-1001',
    customerName: 'شركة النور التجارية',
    productName: 'نظام إدارة المخزون',
    amount: 18500,
    status: 'مكتملة',
    salesRep: 'أحمد سالم',
    saleDate: '2026-04-05',
    notes: 'تم التسليم والدفع بالكامل.'
  },
  {
    id: 'SAL-1002',
    customerName: 'مؤسسة المدى',
    productName: 'بوابة طلبات الموزعين',
    amount: 12400,
    status: 'قيد التنفيذ',
    salesRep: 'سارة علي',
    saleDate: '2026-04-07',
    notes: 'بانتظار اعتماد النسخة النهائية من العميل.'
  },
  {
    id: 'SAL-1003',
    customerName: 'مجموعة الريادة',
    productName: 'لوحة مؤشرات تنفيذية',
    amount: 9700,
    status: 'جديدة',
    salesRep: 'محمد عادل',
    saleDate: '2026-04-08',
    notes: 'تم إدخال الطلب وجار تجهيز العرض الفني.'
  }
];

const initialCreditSales = [
  {
    id: 'CRD-2001',
    customerName: 'شركة المدار',
    invoiceNumber: 'INV-4101',
    amount: 22000,
    paidAmount: 8000,
    dueDate: '2026-04-18',
    status: 'مسدد جزئيا',
    salesRep: 'هبة فؤاد',
    notes: 'تم استلام الدفعة الأولى وتحديد موعد المتابعة.'
  },
  {
    id: 'CRD-2002',
    customerName: 'مؤسسة التقدم',
    invoiceNumber: 'INV-4102',
    amount: 15400,
    paidAmount: 0,
    dueDate: '2026-04-14',
    status: 'مستحقة',
    salesRep: 'أحمد سالم',
    notes: 'العميل طلب مهلة حتى نهاية الأسبوع.'
  },
  {
    id: 'CRD-2003',
    customerName: 'شركة القمة',
    invoiceNumber: 'INV-4103',
    amount: 11800,
    paidAmount: 2500,
    dueDate: '2026-04-02',
    status: 'متأخرة',
    salesRep: 'سارة علي',
    notes: 'تم إرسال تذكير ثان للعميل.'
  }
];

const dashboardBrand = {
  name: 'مركز قيادة ERB',
  eyebrow: 'لوحة الاستعداد التنفيذي',
  headline: 'لوحة عربية موحدة لمتابعة الأداء والمبيعات ومبيعات الآجل.',
  description:
    'واجهة تنفيذية تساعدك على متابعة المؤشرات الرئيسية وحركة البيع النقدي وحسابات الآجل من مكان واحد وبأسلوب واضح وسريع.',
  primaryAction: 'فتح صفحة المبيعات',
  secondaryAction: 'فتح صفحة مبيعات الآجل'
};

let salesRecords = initialSales.map((item) => ({ ...item }));
let creditSalesRecords = initialCreditSales.map((item) => ({ ...item }));

function nextId(prefix, records) {
  const max = records.reduce((highest, item) => {
    const value = Number(item.id.split('-')[1] ?? 0);
    return Number.isFinite(value) && value > highest ? value : highest;
  }, 0);

  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSalesRecord(input, previous = {}) {
  return {
    id: previous.id,
    customerName: String(input.customerName ?? previous.customerName ?? '').trim(),
    productName: String(input.productName ?? previous.productName ?? '').trim(),
    amount: toNumber(input.amount ?? previous.amount),
    status: String(input.status ?? previous.status ?? 'جديدة').trim(),
    salesRep: String(input.salesRep ?? previous.salesRep ?? '').trim(),
    saleDate: String(input.saleDate ?? previous.saleDate ?? '').trim(),
    notes: String(input.notes ?? previous.notes ?? '').trim()
  };
}

function normalizeCreditSaleRecord(input, previous = {}) {
  return {
    id: previous.id,
    customerName: String(input.customerName ?? previous.customerName ?? '').trim(),
    invoiceNumber: String(input.invoiceNumber ?? previous.invoiceNumber ?? '').trim(),
    amount: toNumber(input.amount ?? previous.amount),
    paidAmount: toNumber(input.paidAmount ?? previous.paidAmount),
    dueDate: String(input.dueDate ?? previous.dueDate ?? '').trim(),
    status: String(input.status ?? previous.status ?? 'مستحقة').trim(),
    salesRep: String(input.salesRep ?? previous.salesRep ?? '').trim(),
    notes: String(input.notes ?? previous.notes ?? '').trim()
  };
}

function mapCreditRecord(record) {
  return {
    ...record,
    remainingAmount: Math.max(0, record.amount - record.paidAmount)
  };
}

function getTotalSalesAmount() {
  return salesRecords.reduce((sum, item) => sum + item.amount, 0);
}

function getOutstandingAmount() {
  return creditSalesRecords.reduce(
    (sum, item) => sum + Math.max(0, item.amount - item.paidAmount),
    0
  );
}

function getOverdueCount() {
  return creditSalesRecords.filter((item) => item.status === 'متأخرة').length;
}

function getCollectionsRate() {
  const totalCredit = creditSalesRecords.reduce((sum, item) => sum + item.amount, 0);
  const totalCollected = creditSalesRecords.reduce((sum, item) => sum + item.paidAmount, 0);

  if (totalCredit === 0) {
    return 0;
  }

  return Math.round((totalCollected / totalCredit) * 100);
}

function getSalesOverview() {
  return [
    {
      id: 'sales-total',
      label: 'إجمالي المبيعات',
      value: getTotalSalesAmount(),
      type: 'currency',
      helper: 'قيمة العمليات الحالية',
      tone: 'accent'
    },
    {
      id: 'sales-count',
      label: 'عدد عمليات البيع',
      value: salesRecords.length,
      type: 'number',
      helper: 'عملية محدثة',
      tone: 'calm'
    },
    {
      id: 'sales-completed',
      label: 'طلبات مكتملة',
      value: salesRecords.filter((item) => item.status === 'مكتملة').length,
      type: 'number',
      helper: 'جاهزة للإغلاق',
      tone: 'neutral'
    }
  ];
}

function getCreditSalesOverview() {
  return [
    {
      id: 'credit-outstanding',
      label: 'إجمالي الآجل المستحق',
      value: getOutstandingAmount(),
      type: 'currency',
      helper: 'رصيد يحتاج متابعة',
      tone: 'warning'
    },
    {
      id: 'credit-overdue',
      label: 'فواتير متأخرة',
      value: getOverdueCount(),
      type: 'number',
      helper: 'تحتاج تحصيل',
      tone: 'alert'
    },
    {
      id: 'credit-rate',
      label: 'نسبة التحصيل',
      value: getCollectionsRate(),
      type: 'percent',
      helper: 'من إجمالي الآجل',
      tone: 'calm'
    }
  ];
}

function getDashboardAlerts() {
  const overdue = getOverdueCount();
  const pendingSales = salesRecords.filter((item) => item.status !== 'مكتملة').length;

  return [
    {
      title: 'متابعة الفواتير المتأخرة',
      description: `يوجد ${overdue} فواتير متأخرة تحتاج تواصل سريع مع العملاء.`,
      level: overdue > 0 ? 'high' : 'medium'
    },
    {
      title: 'الطلبات المفتوحة',
      description: `يوجد ${pendingSales} عمليات بيع ما زالت قيد المتابعة أو التنفيذ.`,
      level: pendingSales > 1 ? 'medium' : 'low'
    }
  ];
}

export function getDashboardData(meta) {
  return {
    meta,
    brand: dashboardBrand,
    summary: [
      {
        id: 'dashboard-sales',
        label: 'إجمالي المبيعات',
        value: getTotalSalesAmount(),
        type: 'currency',
        helper: 'المبيعات الحالية',
        tone: 'accent'
      },
      {
        id: 'dashboard-orders',
        label: 'عمليات البيع',
        value: salesRecords.length,
        type: 'number',
        helper: 'إجمالي السجلات',
        tone: 'calm'
      },
      {
        id: 'dashboard-credit',
        label: 'رصيد مبيعات الآجل',
        value: getOutstandingAmount(),
        type: 'currency',
        helper: 'المبالغ المستحقة',
        tone: 'warning'
      },
      {
        id: 'dashboard-overdue',
        label: 'فواتير متأخرة',
        value: getOverdueCount(),
        type: 'number',
        helper: 'تحتاج إجراء',
        tone: 'alert'
      }
    ],
    alerts: getDashboardAlerts(),
    recentSales: salesRecords.slice().reverse().slice(0, 4),
    recentCreditSales: creditSalesRecords
      .slice()
      .reverse()
      .slice(0, 4)
      .map(mapCreditRecord)
  };
}

export function getSalesData() {
  return {
    overview: getSalesOverview(),
    items: salesRecords.slice()
  };
}

export function getCreditSalesData() {
  return {
    overview: getCreditSalesOverview(),
    items: creditSalesRecords.map(mapCreditRecord)
  };
}

export function createSalesRecord(payload) {
  const record = normalizeSalesRecord(payload);
  record.id = nextId('SAL', salesRecords);
  salesRecords = [record, ...salesRecords];
  return record;
}

export function updateSalesRecord(id, payload) {
  const index = salesRecords.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const updated = normalizeSalesRecord(payload, salesRecords[index]);
  updated.id = id;
  salesRecords[index] = updated;
  return updated;
}

export function deleteSalesRecord(id) {
  const exists = salesRecords.some((item) => item.id === id);

  if (!exists) {
    return false;
  }

  salesRecords = salesRecords.filter((item) => item.id !== id);
  return true;
}

export function createCreditSalesRecord(payload) {
  const record = normalizeCreditSaleRecord(payload);
  record.id = nextId('CRD', creditSalesRecords);
  creditSalesRecords = [record, ...creditSalesRecords];
  return mapCreditRecord(record);
}

export function updateCreditSalesRecord(id, payload) {
  const index = creditSalesRecords.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const updated = normalizeCreditSaleRecord(payload, creditSalesRecords[index]);
  updated.id = id;
  creditSalesRecords[index] = updated;
  return mapCreditRecord(updated);
}

export function deleteCreditSalesRecord(id) {
  const exists = creditSalesRecords.some((item) => item.id === id);

  if (!exists) {
    return false;
  }

  creditSalesRecords = creditSalesRecords.filter((item) => item.id !== id);
  return true;
}


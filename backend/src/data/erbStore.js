import { query } from '../db.js';

const dashboardBrand = {
  name: 'مركز قيادة ERB',
  eyebrow: 'لوحة الاستعداد التنفيذي',
  headline: 'لوحة عربية موحدة لمتابعة الأداء والمبيعات ومبيعات الآجل.',
  description:
    'واجهة تنفيذية تساعدك على متابعة المؤشرات الرئيسية وحركة البيع النقدي وحسابات الآجل من مكان واحد وبأسلوب واضح وسريع.',
  primaryAction: 'فتح صفحة المبيعات',
  secondaryAction: 'فتح صفحة مبيعات الآجل'
};

function mapSale(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    productName: row.product_name,
    amount: Number(row.amount),
    status: row.status,
    salesRep: row.sales_rep,
    saleDate: row.sale_date ? new Date(row.sale_date).toISOString().split('T')[0] : null,
    notes: row.notes || ''
  };
}

function mapCreditSale(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    invoiceNumber: row.invoice_number,
    amount: Number(row.amount),
    paidAmount: Number(row.paid_amount),
    remainingAmount: Math.max(0, Number(row.amount) - Number(row.paid_amount)),
    dueDate: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : null,
    status: row.status,
    salesRep: row.sales_rep,
    notes: row.notes || ''
  };
}

function mapReturn(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    originalInvoiceNumber: row.original_invoice_number,
    amount: Number(row.amount),
    reason: row.reason || '',
    returnDate: row.return_date ? new Date(row.return_date).toISOString().split('T')[0] : null,
    status: row.status,
    salesRep: row.sales_rep,
    notes: row.notes || ''
  };
}

async function nextId(prefix, table) {
  try {
    const result = await query(`SELECT id FROM ${table} WHERE id LIKE $1 ORDER BY id DESC LIMIT 1`, [`${prefix}-%`]);
    if (result.rows.length === 0) {
      return `${prefix}-1001`;
    }
    const lastId = result.rows[0].id;
    const num = parseInt(lastId.split('-')[1], 10);
    return `${prefix}-${String(num + 1).padStart(4, '0')}`;
  } catch (e) {
    return `${prefix}-1001`;
  }
}

export async function getDashboardData(meta) {
  const salesResult = await query('SELECT * FROM direct_sales ORDER BY created_at DESC');
  const creditResult = await query('SELECT * FROM installment_sales ORDER BY created_at DESC');

  const sales = salesResult.rows.map(mapSale);
  const credits = creditResult.rows.map(mapCreditSale);

  const totalSales = sales.reduce((sum, item) => sum + item.amount, 0);
  const outstandingAmount = credits.reduce((sum, item) => sum + Math.max(0, item.amount - item.paidAmount), 0);
  const overdueCount = credits.filter((item) => item.status === 'متأخرة').length;
  const pendingSales = sales.filter((item) => item.status !== 'مكتملة').length;

  const alerts = [
    {
      title: 'متابعة الفواتير المتأخرة',
      description: `يوجد ${overdueCount} فواتير متأخرة تحتاج تواصل سريع مع العملاء.`,
      level: overdueCount > 0 ? 'high' : 'medium'
    },
    {
      title: 'الطلبات المفتوحة',
      description: `يوجد ${pendingSales} عمليات بيع ما زالت قيد المتابعة أو التنفيذ.`,
      level: pendingSales > 1 ? 'medium' : 'low'
    }
  ];

  return {
    meta,
    brand: dashboardBrand,
    summary: [
      {
        id: 'dashboard-sales',
        label: 'إجمالي المبيعات',
        value: totalSales,
        type: 'currency',
        helper: 'المبيعات الحالية',
        tone: 'accent'
      },
      {
        id: 'dashboard-orders',
        label: 'عمليات البيع',
        value: sales.length,
        type: 'number',
        helper: 'إجمالي السجلات',
        tone: 'calm'
      },
      {
        id: 'dashboard-credit',
        label: 'رصيد مبيعات الآجل',
        value: outstandingAmount,
        type: 'currency',
        helper: 'المبالغ المستحقة',
        tone: 'warning'
      },
      {
        id: 'dashboard-overdue',
        label: 'فواتير متأخرة',
        value: overdueCount,
        type: 'number',
        helper: 'تحتاج إجراء',
        tone: 'alert'
      }
    ],
    alerts,
    recentSales: sales.slice(0, 4),
    recentCreditSales: credits.slice(0, 4)
  };
}

export async function getSalesData() {
  const result = await query('SELECT * FROM direct_sales ORDER BY created_at DESC');
  const sales = result.rows.map(mapSale);

  const totalSalesAmount = sales.reduce((sum, item) => sum + item.amount, 0);
  const completedCount = sales.filter(item => item.status === 'مكتملة').length;

  const overview = [
    {
      id: 'sales-total',
      label: 'إجمالي المبيعات',
      value: totalSalesAmount,
      type: 'currency',
      helper: 'قيمة العمليات الحالية',
      tone: 'accent'
    },
    {
      id: 'sales-count',
      label: 'عدد عمليات البيع',
      value: sales.length,
      type: 'number',
      helper: 'عملية محدثة',
      tone: 'calm'
    },
    {
      id: 'sales-completed',
      label: 'طلبات مكتملة',
      value: completedCount,
      type: 'number',
      helper: 'جاهزة للإغلاق',
      tone: 'neutral'
    }
  ];

  return {
    overview,
    items: sales
  };
}

export async function getCreditSalesData() {
  const result = await query('SELECT * FROM installment_sales ORDER BY created_at DESC');
  const credits = result.rows.map(mapCreditSale);

  const totalCredit = credits.reduce((sum, item) => sum + item.amount, 0);
  const totalCollected = credits.reduce((sum, item) => sum + item.paidAmount, 0);
  const outstandingAmount = credits.reduce((sum, item) => sum + Math.max(0, item.amount - item.paidAmount), 0);
  const overdueCount = credits.filter(item => item.status === 'متأخرة').length;

  let collRate = 0;
  if (totalCredit > 0) {
    collRate = Math.round((totalCollected / totalCredit) * 100);
  }

  const overview = [
    {
      id: 'credit-outstanding',
      label: 'إجمالي الآجل المستحق',
      value: outstandingAmount,
      type: 'currency',
      helper: 'رصيد يحتاج متابعة',
      tone: 'warning'
    },
    {
      id: 'credit-overdue',
      label: 'فواتير متأخرة',
      value: overdueCount,
      type: 'number',
      helper: 'تحتاج تحصيل',
      tone: 'alert'
    },
    {
      id: 'credit-rate',
      label: 'نسبة التحصيل',
      value: collRate,
      type: 'percent',
      helper: 'من إجمالي الآجل',
      tone: 'calm'
    }
  ];

  return {
    overview,
    items: credits
  };
}

export async function createSalesRecord(payload) {
  const id = await nextId('SAL', 'direct_sales');
  
  const text = `
    INSERT INTO direct_sales 
    (id, customer_name, product_name, amount, status, sales_rep, sale_date, notes) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
  `;
  const values = [
    id,
    payload.customerName || '',
    payload.productName || '',
    Number(payload.amount || 0),
    payload.status || 'جديدة',
    payload.salesRep || '',
    payload.saleDate || null,
    payload.notes || ''
  ];

  const result = await query(text, values);
  return mapSale(result.rows[0]);
}

export async function updateSalesRecord(id, payload) {
  const text = `
    UPDATE direct_sales SET 
      customer_name = COALESCE($2, customer_name),
      product_name = COALESCE($3, product_name),
      amount = COALESCE($4, amount),
      status = COALESCE($5, status),
      sales_rep = COALESCE($6, sales_rep),
      sale_date = COALESCE($7, sale_date),
      notes = COALESCE($8, notes)
    WHERE id = $1 RETURNING *
  `;
  const values = [
    id,
    payload.customerName,
    payload.productName,
    payload.amount !== undefined ? Number(payload.amount) : undefined,
    payload.status,
    payload.salesRep,
    payload.saleDate,
    payload.notes
  ];

  const result = await query(text, values);
  if (result.rows.length === 0) return null;
  return mapSale(result.rows[0]);
}

export async function deleteSalesRecord(id) {
  const result = await query('DELETE FROM direct_sales WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

export async function createCreditSalesRecord(payload) {
  const id = await nextId('CRD', 'installment_sales');

  const text = `
    INSERT INTO installment_sales 
    (id, customer_name, invoice_number, amount, paid_amount, due_date, status, sales_rep, notes) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
  `;
  const values = [
    id,
    payload.customerName || '',
    payload.invoiceNumber || '',
    Number(payload.amount || 0),
    Number(payload.paidAmount || 0),
    payload.dueDate || null,
    payload.status || 'مستحقة',
    payload.salesRep || '',
    payload.notes || ''
  ];

  const result = await query(text, values);
  return mapCreditSale(result.rows[0]);
}

export async function updateCreditSalesRecord(id, payload) {
  const text = `
    UPDATE installment_sales SET 
      customer_name = COALESCE($2, customer_name),
      invoice_number = COALESCE($3, invoice_number),
      amount = COALESCE($4, amount),
      paid_amount = COALESCE($5, paid_amount),
      due_date = COALESCE($6, due_date),
      status = COALESCE($7, status),
      sales_rep = COALESCE($8, sales_rep),
      notes = COALESCE($9, notes)
    WHERE id = $1 RETURNING *
  `;
  const values = [
    id,
    payload.customerName,
    payload.invoiceNumber,
    payload.amount !== undefined ? Number(payload.amount) : undefined,
    payload.paidAmount !== undefined ? Number(payload.paidAmount) : undefined,
    payload.dueDate,
    payload.status,
    payload.salesRep,
    payload.notes
  ];

  const result = await query(text, values);
  if (result.rows.length === 0) return null;
  return mapCreditSale(result.rows[0]);
}

export async function deleteCreditSalesRecord(id) {
  const result = await query('DELETE FROM installment_sales WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

export async function getReturnsData() {
  const result = await query('SELECT * FROM return_sales ORDER BY created_at DESC');
  const returns = result.rows.map(mapReturn);

  const totalReturnsAmount = returns.reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = returns.filter(item => item.status === 'قيد المراجعة').length;

  const overview = [
    {
      id: 'returns-total',
      label: 'إجمالي المرتجعات',
      value: totalReturnsAmount,
      type: 'currency',
      helper: 'قيمة المرتجعات الحالية',
      tone: 'danger'
    },
    {
      id: 'returns-count',
      label: 'عدد المرتجعات',
      value: returns.length,
      type: 'number',
      helper: 'مرتجع مسجل',
      tone: 'warning'
    },
    {
      id: 'returns-pending',
      label: 'قيد المراجعة',
      value: pendingCount,
      type: 'number',
      helper: 'تحتاج اتخاذ قرار',
      tone: 'alert'
    }
  ];

  return {
    overview,
    items: returns
  };
}

export async function createReturnRecord(payload) {
  const id = await nextId('RET', 'return_sales');

  const text = `
    INSERT INTO return_sales 
    (id, customer_name, original_invoice_number, amount, reason, return_date, status, sales_rep, notes) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
  `;
  const values = [
    id,
    payload.customerName || '',
    payload.originalInvoiceNumber || '',
    Number(payload.amount || 0),
    payload.reason || '',
    payload.returnDate || null,
    payload.status || 'قيد المراجعة',
    payload.salesRep || '',
    payload.notes || ''
  ];

  const result = await query(text, values);
  return mapReturn(result.rows[0]);
}

export async function updateReturnRecord(id, payload) {
  const text = `
    UPDATE return_sales SET 
      customer_name = COALESCE($2, customer_name),
      original_invoice_number = COALESCE($3, original_invoice_number),
      amount = COALESCE($4, amount),
      reason = COALESCE($5, reason),
      return_date = COALESCE($6, return_date),
      status = COALESCE($7, status),
      sales_rep = COALESCE($8, sales_rep),
      notes = COALESCE($9, notes)
    WHERE id = $1 RETURNING *
  `;
  const values = [
    id,
    payload.customerName,
    payload.originalInvoiceNumber,
    payload.amount !== undefined ? Number(payload.amount) : undefined,
    payload.reason,
    payload.returnDate,
    payload.status,
    payload.salesRep,
    payload.notes
  ];

  const result = await query(text, values);
  if (result.rows.length === 0) return null;
  return mapReturn(result.rows[0]);
}

export async function deleteReturnRecord(id) {
  const result = await query('DELETE FROM return_sales WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

function mapPriceListItem(row) {
  return {
    id: row.id,
    productName: row.product_name,
    category: row.category || '',
    purchasePrice: Number(row.purchase_price),
    sellingPrice: Number(row.selling_price),
    notes: row.notes || ''
  };
}

export async function getPriceListData() {
  const result = await query('SELECT * FROM price_list ORDER BY created_at DESC');
  const items = result.rows.map(mapPriceListItem);

  let avgMargin = 0;
  if (items.length > 0) {
    const totalMargin = items.reduce((sum, item) => {
      const margin = item.purchasePrice > 0 ? ((item.sellingPrice - item.purchasePrice) / item.purchasePrice) * 100 : 0;
      return sum + margin;
    }, 0);
    avgMargin = Math.round(totalMargin / items.length);
  }

  const overview = [
    {
      id: 'price-count',
      label: 'عدد المنتجات',
      value: items.length,
      type: 'number',
      helper: 'منتج مسجل',
      tone: 'calm'
    },
    {
      id: 'price-margin',
      label: 'متوسط هامش الربح',
      value: avgMargin,
      type: 'percent',
      helper: 'تقريبياً بناءً على التكلفة',
      tone: 'accent'
    }
  ];

  return {
    overview,
    items
  };
}

export async function createPriceListRecord(payload) {
  const id = await nextId('PRC', 'price_list');

  const text = `
    INSERT INTO price_list 
    (id, product_name, category, purchase_price, selling_price, notes) 
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
  `;
  const values = [
    id,
    payload.productName || '',
    payload.category || '',
    Number(payload.purchasePrice || 0),
    Number(payload.sellingPrice || 0),
    payload.notes || ''
  ];

  const result = await query(text, values);
  return mapPriceListItem(result.rows[0]);
}

export async function updatePriceListRecord(id, payload) {
  const text = `
    UPDATE price_list SET 
      product_name = COALESCE($2, product_name),
      category = COALESCE($3, category),
      purchase_price = COALESCE($4, purchase_price),
      selling_price = COALESCE($5, selling_price),
      notes = COALESCE($6, notes)
    WHERE id = $1 RETURNING *
  `;
  const values = [
    id,
    payload.productName,
    payload.category,
    payload.purchasePrice !== undefined ? Number(payload.purchasePrice) : undefined,
    payload.sellingPrice !== undefined ? Number(payload.sellingPrice) : undefined,
    payload.notes
  ];

  const result = await query(text, values);
  if (result.rows.length === 0) return null;
  return mapPriceListItem(result.rows[0]);
}

export async function deletePriceListRecord(id) {
  const result = await query('DELETE FROM price_list WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

function mapCustodyItem(row) {
  return {
    id: row.id,
    employeeName: row.employee_name,
    custodyType: row.custody_type,
    itemDetails: row.item_details || '',
    initialAmount: Number(row.initial_amount),
    currentBalance: Number(row.current_balance),
    startDate: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : null,
    status: row.status,
    notes: row.notes || ''
  };
}

function mapCustodyTransaction(row) {
  return {
    id: row.id,
    custodyId: row.custody_id,
    transactionType: row.transaction_type,
    amount: Number(row.amount),
    date: row.date ? new Date(row.date).toISOString().split('T')[0] : null,
    notes: row.notes || ''
  };
}

function toLocalDateKey(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getCustodiesData() {
  const result = await query('SELECT * FROM custodies ORDER BY created_at DESC');
  const items = result.rows.map(mapCustodyItem);

  const activeCash = items.filter(item => item.custodyType === 'نقدية' && item.status === 'نشطة').reduce((sum, item) => sum + item.currentBalance, 0);
  const activeItemsCount = items.filter(item => item.custodyType === 'عينية' && item.status === 'نشطة').length;
  const activeCount = items.filter((item) => item.status === 'نشطة').length;

  const overview = [
    {
      id: 'custodies-cash',
      label: 'إجمالي الأرصدة النقدية',
      value: activeCash,
      type: 'currency',
      helper: 'يحتفظ بها الموظفون',
      tone: 'warning'
    },
    {
      id: 'custodies-items',
      label: 'العهد العينية',
      value: activeItemsCount,
      type: 'number',
      helper: 'أصول بصحبة الموظفين',
      tone: 'calm'
    },
    {
      id: 'custodies-active',
      label: 'العهد النشطة',
      value: activeCount,
      type: 'number',
      helper: 'إجمالي العهد المفتوحة',
      tone: 'accent'
    }
  ];

  return {
    overview,
    items
  };
}

export async function createCustodyRecord(payload) {
  const id = await nextId('CST', 'custodies');

  const text = `
    INSERT INTO custodies 
    (id, employee_name, custody_type, item_details, initial_amount, current_balance, start_date, status, notes) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
  `;
  const isCash = payload.custodyType === 'نقدية';
  const values = [
    id,
    payload.employeeName || '',
    payload.custodyType || 'نقدية',
    isCash ? '' : (payload.itemDetails || ''),
    isCash ? Number(payload.initialAmount || 0) : 0,
    isCash ? Number(payload.initialAmount || 0) : 0,
    payload.startDate || null,
    payload.status || 'نشطة',
    payload.notes || ''
  ];

  const result = await query(text, values);
  return mapCustodyItem(result.rows[0]);
}

export async function updateCustodyRecord(id, payload) {
  const text = `
    UPDATE custodies SET 
      employee_name = COALESCE($2, employee_name),
      custody_type = COALESCE($3, custody_type),
      item_details = COALESCE($4, item_details),
      initial_amount = COALESCE($5, initial_amount),
      status = COALESCE($6, status),
      start_date = COALESCE($7, start_date),
      notes = COALESCE($8, notes)
    WHERE id = $1 RETURNING *
  `;
  const values = [
    id,
    payload.employeeName,
    payload.custodyType,
    payload.itemDetails,
    payload.initialAmount !== undefined ? Number(payload.initialAmount) : undefined,
    payload.status,
    payload.startDate,
    payload.notes
  ];

  const result = await query(text, values);
  if (result.rows.length === 0) return null;
  return mapCustodyItem(result.rows[0]);
}

export async function deleteCustodyRecord(id) {
  const result = await query('DELETE FROM custodies WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

export async function getCustodyTransactions(custodyId) {
  const result = await query('SELECT * FROM custody_transactions WHERE custody_id = $1 ORDER BY date DESC, created_at DESC', [custodyId]);
  return result.rows.map(mapCustodyTransaction);
}

export async function createCustodyTransaction(custodyId, payload) {
  const id = await nextId('CTX', 'custody_transactions');
  
  const text = `
    INSERT INTO custody_transactions 
    (id, custody_id, transaction_type, amount, date, notes) 
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
  `;
  const amt = Number(payload.amount || 0);
  const values = [
    id,
    custodyId,
    payload.transactionType || 'صرف',
    amt,
    payload.date || null,
    payload.notes || ''
  ];

  const result = await query(text, values);
  const transaction = mapCustodyTransaction(result.rows[0]);

  // Update current_balance of custody if it is a cash custody
  const custodyRes = await query('SELECT custody_type, current_balance FROM custodies WHERE id = $1', [custodyId]);
  if (custodyRes.rows.length > 0 && custodyRes.rows[0].custody_type === 'نقدية') {
    let currentBalance = Number(custodyRes.rows[0].current_balance);
    if (transaction.transactionType === 'صرف') {
      currentBalance -= amt;
    } else if (transaction.transactionType === 'استعاضة' || transaction.transactionType === 'إرجاع عهدة') {
      currentBalance += amt;
    } else if (transaction.transactionType === 'تسوية') {
      // Settlement does not typically change the balance unless it means wiping it, but for our case let's assume it clears remaining
      if (amt > 0) {
        currentBalance -= amt; // Treat like expense
      }
    }
    
    await query('UPDATE custodies SET current_balance = $1 WHERE id = $2', [currentBalance, custodyId]);
  }

  return transaction;
}

export async function deleteCustodyTransaction(id) {
  // We need to fetch the transaction first to reverse the balance effect
  const trRes = await query('SELECT * FROM custody_transactions WHERE id = $1', [id]);
  if (trRes.rows.length === 0) return false;
  
  const tr = mapCustodyTransaction(trRes.rows[0]);

  const custodyRes = await query('SELECT custody_type, current_balance FROM custodies WHERE id = $1', [tr.custodyId]);
  if (custodyRes.rows.length > 0 && custodyRes.rows[0].custody_type === 'نقدية') {
    let currentBalance = Number(custodyRes.rows[0].current_balance);
    if (tr.transactionType === 'صرف') {
      currentBalance += tr.amount;
    } else if (tr.transactionType === 'استعاضة' || tr.transactionType === 'إرجاع عهدة') {
      currentBalance -= tr.amount;
    } else if (tr.transactionType === 'تسوية') {
      if (tr.amount > 0) currentBalance += tr.amount;
    }
    await query('UPDATE custodies SET current_balance = $1 WHERE id = $2', [currentBalance, tr.custodyId]);
  }

  const result = await query('DELETE FROM custody_transactions WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

// ── Checks ────────────────────────────────────────────────────────────────────

function mapCheck(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    checkNumber: row.check_number || '',
    bankName: row.bank_name || '',
    amount: Number(row.amount),
    collectionDate: toLocalDateKey(row.collection_date),
    status: row.status,
    notes: row.notes || ''
  };
}

export async function getChecksData() {
  const result = await query('SELECT * FROM checks ORDER BY collection_date ASC, created_at DESC');
  const items = result.rows.map(mapCheck);

  const today = toLocalDateKey(new Date());
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = items.filter((item) => item.status === 'معلق').length;
  const todayCount = items.filter((item) => item.collectionDate === today && item.status === 'معلق').length;
  const collectedAmount = items
    .filter((item) => item.status === 'محصّل')
    .reduce((sum, item) => sum + item.amount, 0);

  const overview = [
    {
      id: 'checks-total',
      label: 'إجمالي قيمة الشيكات',
      value: totalAmount,
      type: 'currency',
      helper: 'قيمة جميع الشيكات',
      tone: 'accent'
    },
    {
      id: 'checks-pending',
      label: 'شيكات معلقة',
      value: pendingCount,
      type: 'number',
      helper: 'تنتظر التحصيل',
      tone: 'warning'
    },
    {
      id: 'checks-today',
      label: 'تحصيل اليوم',
      value: todayCount,
      type: 'number',
      helper: 'موعد تحصيلها اليوم',
      tone: todayCount > 0 ? 'alert' : 'neutral'
    },
    {
      id: 'checks-collected',
      label: 'إجمالي المحصّل',
      value: collectedAmount,
      type: 'currency',
      helper: 'شيكات تم تحصيلها',
      tone: 'calm'
    }
  ];

  return { overview, items };
}

export async function createCheckRecord(payload) {
  const id = await nextId('CHK', 'checks');

  const text = `
    INSERT INTO checks
    (id, customer_name, check_number, bank_name, amount, collection_date, status, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
  `;
  const values = [
    id,
    payload.customerName || '',
    payload.checkNumber || '',
    payload.bankName || '',
    Number(payload.amount || 0),
    payload.collectionDate || null,
    payload.status || 'معلق',
    payload.notes || ''
  ];

  const result = await query(text, values);
  return mapCheck(result.rows[0]);
}

export async function updateCheckRecord(id, payload) {
  const text = `
    UPDATE checks SET
      customer_name = COALESCE($2, customer_name),
      check_number = COALESCE($3, check_number),
      bank_name = COALESCE($4, bank_name),
      amount = COALESCE($5, amount),
      collection_date = COALESCE($6, collection_date),
      status = COALESCE($7, status),
      notes = COALESCE($8, notes)
    WHERE id = $1 RETURNING *
  `;
  const values = [
    id,
    payload.customerName,
    payload.checkNumber,
    payload.bankName,
    payload.amount !== undefined ? Number(payload.amount) : undefined,
    payload.collectionDate,
    payload.status,
    payload.notes
  ];

  const result = await query(text, values);
  if (result.rows.length === 0) return null;
  return mapCheck(result.rows[0]);
}

export async function deleteCheckRecord(id) {
  const result = await query('DELETE FROM checks WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}


import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import {
  createCreditSalesRecord,
  createSalesRecord,
  deleteCreditSalesRecord,
  deleteSalesRecord,
  getReturnsData,
  createReturnRecord,
  updateReturnRecord,
  deleteReturnRecord,
  getCreditSalesData,
  getDashboardData,
  getSalesData,
  updateCreditSalesRecord,
  updateSalesRecord,
  getPriceListData,
  createPriceListRecord,
  updatePriceListRecord,
  deletePriceListRecord,
  getCustodiesData,
  createCustodyRecord,
  updateCustodyRecord,
  deleteCustodyRecord,
  getCustodyTransactions,
  createCustodyTransaction,
  deleteCustodyTransaction,
  getChecksData,
  createCheckRecord,
  updateCheckRecord,
  deleteCheckRecord,
  getFinalProductStoreData,
  createFinalProductRecord,
  updateFinalProductRecord,
  deleteFinalProductRecord,
  getRawMaterialsStoreData,
  createRawMaterialRecord,
  updateRawMaterialRecord,
  deleteRawMaterialRecord,
  getRepSubStoresData,
  createRepSubStoreRecord,
  updateRepSubStoreRecord,
  deleteRepSubStoreRecord,
  getFinancialManagerCustodyData,
  createFinManagerCustodyRecord,
  updateFinManagerCustodyRecord,
  deleteFinManagerCustodyRecord,
  getRawMaterialsPurchasesData,
  createRawPurchaseRecord,
  updateRawPurchaseRecord,
  deleteRawPurchaseRecord,
  getMachineMaintenancePurchasesData,
  createMachinePurchaseRecord,
  updateMachinePurchaseRecord,
  deleteMachinePurchaseRecord,
  getMiscPurchasesData,
  createMiscPurchaseRecord,
  updateMiscPurchaseRecord,
  deleteMiscPurchaseRecord,
  getPayrollAdvancesData,
  createPayrollAdvanceRecord,
  updatePayrollAdvanceRecord,
  deletePayrollAdvanceRecord,
  getCustomerPaymentAlertsData,
  createPaymentAlertRecord,
  updatePaymentAlertRecord,
  deletePaymentAlertRecord,
  getFreeSamplesData,
  createFreeSampleRecord,
  updateFreeSampleRecord,
  deleteFreeSampleRecord
} from './data/erbStore.js';
import { getDatabaseStatus, safeQuery } from './db.js';
import { createSwaggerSpec } from './swagger.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 5000);
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const isVercel = !!process.env.VERCEL;
const swaggerSpec = createSwaggerSpec(isVercel ? '' : `http://localhost:${port}`);

app.use(
  cors(
    isVercel
      ? { origin: true }
      : { origin: frontendUrl }
  )
);
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api-docs.json', (_request, response) => {
  response.json(swaggerSpec);
});

function validateSalesPayload(body) {
  if (!body.customerName || !body.productName || !body.salesRep || !body.saleDate) {
    return 'يرجى إدخال اسم العميل والمنتج ومسؤول المبيعات وتاريخ البيع.';
  }

  if (Number(body.amount) <= 0) {
    return 'قيمة المبيعات يجب أن تكون أكبر من صفر.';
  }

  return '';
}

function validateCreditSalesPayload(body) {
  if (!body.customerName || !body.invoiceNumber || !body.salesRep || !body.dueDate) {
    return 'يرجى إدخال اسم العميل ورقم الفاتورة ومسؤول المبيعات وتاريخ الاستحقاق.';
  }

  if (Number(body.amount) <= 0) {
    return 'قيمة مبيعات الآجل يجب أن تكون أكبر من صفر.';
  }

  if (Number(body.paidAmount) < 0) {
    return 'المبلغ المسدد لا يمكن أن يكون سالبًا.';
  }

  return '';
}

function validateReturnsPayload(body) {
  if (!body.customerName || !body.salesRep || !body.returnDate) {
    return 'يرجى إدخال اسم العميل ومسؤول المبيعات وتاريخ الإرجاع.';
  }

  if (Number(body.amount) <= 0) {
    return 'قيمة المرتجع يجب أن تكون أكبر من صفر.';
  }

  return '';
}

function validatePriceListPayload(body) {
  if (!body.productName) {
    return 'يرجى إدخال اسم المنتج.';
  }
  if (Number(body.purchasePrice) < 0 || Number(body.sellingPrice) < 0) {
    return 'الأسعار لا يمكن أن تكون سالبة.';
  }
  return '';
}

async function getDashboardPayload() {
  const databaseStatus = await getDatabaseStatus();

  return getDashboardData({
    runtime: databaseStatus.mode,
    database: databaseStatus.connected ? 'connected' : 'fallback',
    message: databaseStatus.message,
    updatedAt: databaseStatus.time
  });
}

app.get('/api/health', async (_request, response) => {
  const databaseStatus = await getDatabaseStatus();

  response.json({
    status: 'ok',
    runtime: databaseStatus.mode,
    database: databaseStatus.connected ? 'connected' : 'fallback',
    message: databaseStatus.message,
    time: databaseStatus.time
  });
});

app.get('/api/dashboard', async (_request, response) => {
  try {
    const payload = await getDashboardPayload();
    response.json(payload);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.get('/api/sales', async (_request, response) => {
  try {
    response.json(await getSalesData());
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.post('/api/sales', async (request, response) => {
  const validationMessage = validateSalesPayload(request.body);

  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }

  try {
    const created = await createSalesRecord(request.body);
    response.status(201).json(created);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.put('/api/sales/:id', async (request, response) => {
  const validationMessage = validateSalesPayload(request.body);

  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }

  try {
    const updated = await updateSalesRecord(request.params.id, request.body);

    if (!updated) {
      response.status(404).json({ message: 'سجل المبيعات المطلوب غير موجود.' });
      return;
    }

    response.json(updated);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.delete('/api/sales/:id', async (request, response) => {
  try {
    const deleted = await deleteSalesRecord(request.params.id);

    if (!deleted) {
      response.status(404).json({ message: 'سجل المبيعات المطلوب غير موجود.' });
      return;
    }

    response.status(204).send();
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.get('/api/credit-sales', async (_request, response) => {
  try {
    response.json(await getCreditSalesData());
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.get('/api/credit', async (_request, response) => {
  try {
    response.json(await getCreditSalesData());
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.post('/api/credit-sales', async (request, response) => {
  const validationMessage = validateCreditSalesPayload(request.body);

  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }

  try {
    const created = await createCreditSalesRecord(request.body);
    response.status(201).json(created);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.put('/api/credit-sales/:id', async (request, response) => {
  const validationMessage = validateCreditSalesPayload(request.body);

  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }

  try {
    const updated = await updateCreditSalesRecord(request.params.id, request.body);

    if (!updated) {
      response.status(404).json({ message: 'سجل مبيعات الآجل المطلوب غير موجود.' });
      return;
    }

    response.json(updated);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.delete('/api/credit-sales/:id', async (request, response) => {
  try {
    const deleted = await deleteCreditSalesRecord(request.params.id);

    if (!deleted) {
      response.status(404).json({ message: 'سجل مبيعات الآجل المطلوب غير موجود.' });
      return;
    }

    response.status(204).send();
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.get('/api/returns', async (_request, response) => {
  try {
    response.json(await getReturnsData());
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.post('/api/returns', async (request, response) => {
  const validationMessage = validateReturnsPayload(request.body);

  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }

  try {
    const created = await createReturnRecord(request.body);
    response.status(201).json(created);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.put('/api/returns/:id', async (request, response) => {
  const validationMessage = validateReturnsPayload(request.body);

  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }

  try {
    const updated = await updateReturnRecord(request.params.id, request.body);

    if (!updated) {
      response.status(404).json({ message: 'سجل المرتجع المطلوب غير موجود.' });
      return;
    }

    response.json(updated);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.delete('/api/returns/:id', async (request, response) => {
  try {
    const deleted = await deleteReturnRecord(request.params.id);

    if (!deleted) {
      response.status(404).json({ message: 'سجل المرتجع المطلوب غير موجود.' });
      return;
    }

    response.status(204).send();
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.get('/api/price-list', async (_request, response) => {
  try {
    response.json(await getPriceListData());
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.post('/api/price-list', async (request, response) => {
  const validationMessage = validatePriceListPayload(request.body);

  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }

  try {
    const created = await createPriceListRecord(request.body);
    response.status(201).json(created);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.put('/api/price-list/:id', async (request, response) => {
  const validationMessage = validatePriceListPayload(request.body);

  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }

  try {
    const updated = await updatePriceListRecord(request.params.id, request.body);

    if (!updated) {
      response.status(404).json({ message: 'المنتج المطلوب غير موجود.' });
      return;
    }

    response.json(updated);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.delete('/api/price-list/:id', async (request, response) => {
  try {
    const deleted = await deletePriceListRecord(request.params.id);

    if (!deleted) {
      response.status(404).json({ message: 'المنتج المطلوب غير موجود.' });
      return;
    }

    response.status(204).send();
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.get('/api/tasks', async (_request, response) => {
  const tasksResult = await safeQuery(
    'SELECT id, title, description, status, created_at FROM tasks ORDER BY id ASC'
  );

  response.json({
    data: tasksResult.ok ? tasksResult.rows : []
  });
});

function validateCustodyPayload(body) {
  if (!body.employeeName) return 'يرجى إدخال اسم المستلم.';
  if (!body.custodyType) return 'يرجى تحديد نوع العهدة.';
  if (body.custodyType === 'نقدية' && Number(body.initialAmount) <= 0) {
    return 'قيمة العهدة النقدية يجب أن تكون أكبر من صفر.';
  }
  return '';
}

app.get('/api/custodies', async (_request, response) => {
  try {
    response.json(await getCustodiesData());
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.post('/api/custodies', async (request, response) => {
  const validationMSG = validateCustodyPayload(request.body);
  if (validationMSG) {
    response.status(400).json({ message: validationMSG });
    return;
  }
  try {
    const created = await createCustodyRecord(request.body);
    response.status(201).json(created);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.put('/api/custodies/:id', async (request, response) => {
  const validationMSG = validateCustodyPayload(request.body);
  if (validationMSG) {
    response.status(400).json({ message: validationMSG });
    return;
  }
  try {
    const updated = await updateCustodyRecord(request.params.id, request.body);
    if (!updated) {
      response.status(404).json({ message: 'العهدة غير موجودة.' });
      return;
    }
    response.json(updated);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.delete('/api/custodies/:id', async (request, response) => {
  try {
    const deleted = await deleteCustodyRecord(request.params.id);
    if (!deleted) {
      response.status(404).json({ message: 'العهدة غير موجودة.' });
      return;
    }
    response.status(204).send();
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.get('/api/custodies/:id/transactions', async (request, response) => {
  try {
    response.json(await getCustodyTransactions(request.params.id));
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.post('/api/custodies/:id/transactions', async (request, response) => {
  try {
    if (!request.body.transactionType) {
      response.status(400).json({ message: 'نوع الحركة مطلوب.' });
      return;
    }
    const created = await createCustodyTransaction(request.params.id, request.body);
    response.status(201).json(created);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.delete('/api/custodies/:id/transactions/:txId', async (request, response) => {
  try {
    const deleted = await deleteCustodyTransaction(request.params.txId);
    if (!deleted) {
      response.status(404).json({ message: 'الحركة غير موجودة.' });
      return;
    }
    response.status(204).send();
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

// ── Checks ────────────────────────────────────────────────────────────────────

function validateCheckPayload(body) {
  if (!body.customerName) return 'يرجى إدخال اسم العميل.';
  if (Number(body.amount) <= 0) return 'قيمة الشيك يجب أن تكون أكبر من صفر.';
  if (!body.collectionDate) return 'يرجى تحديد تاريخ التحصيل.';
  return '';
}

app.get('/api/checks', async (_request, response) => {
  try {
    response.json(await getChecksData());
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.post('/api/checks', async (request, response) => {
  const validationMessage = validateCheckPayload(request.body);
  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }
  try {
    const created = await createCheckRecord(request.body);
    response.status(201).json(created);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.put('/api/checks/:id', async (request, response) => {
  const validationMessage = validateCheckPayload(request.body);
  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }
  try {
    const updated = await updateCheckRecord(request.params.id, request.body);
    if (!updated) {
      response.status(404).json({ message: 'الشيك غير موجود.' });
      return;
    }
    response.json(updated);
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

app.delete('/api/checks/:id', async (request, response) => {
  try {
    const deleted = await deleteCheckRecord(request.params.id);
    if (!deleted) {
      response.status(404).json({ message: 'الشيك غير موجود.' });
      return;
    }
    response.status(204).send();
  } catch (err) {
    response.status(500).json({ message: err.message });
  }
});

// ── Final Product Store ──────────────────────────────────────────────────────
app.get('/api/final-product-store', async (_req, res) => { try { res.json(await getFinalProductStoreData()); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/api/final-product-store', async (req, res) => {
  if (!req.body.productName) { res.status(400).json({ message: 'يرجى إدخال اسم المنتج.' }); return; }
  try { res.status(201).json(await createFinalProductRecord(req.body)); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/final-product-store/:id', async (req, res) => {
  if (!req.body.productName) { res.status(400).json({ message: 'يرجى إدخال اسم المنتج.' }); return; }
  try { const u = await updateFinalProductRecord(req.params.id, req.body); if (!u) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.json(u); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/final-product-store/:id', async (req, res) => { try { const d = await deleteFinalProductRecord(req.params.id); if (!d) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });

// ── Raw Materials & Packaging Store ──────────────────────────────────────────
app.get('/api/raw-materials-store', async (_req, res) => { try { res.json(await getRawMaterialsStoreData()); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/api/raw-materials-store', async (req, res) => {
  if (!req.body.materialName) { res.status(400).json({ message: 'يرجى إدخال اسم الخامة.' }); return; }
  try { res.status(201).json(await createRawMaterialRecord(req.body)); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/raw-materials-store/:id', async (req, res) => {
  if (!req.body.materialName) { res.status(400).json({ message: 'يرجى إدخال اسم الخامة.' }); return; }
  try { const u = await updateRawMaterialRecord(req.params.id, req.body); if (!u) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.json(u); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/raw-materials-store/:id', async (req, res) => { try { const d = await deleteRawMaterialRecord(req.params.id); if (!d) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });

// ── Rep Sub-Stores ───────────────────────────────────────────────────────────
app.get('/api/rep-sub-stores', async (_req, res) => { try { res.json(await getRepSubStoresData()); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/api/rep-sub-stores', async (req, res) => {
  if (!req.body.repName || !req.body.productName) { res.status(400).json({ message: 'يرجى إدخال اسم المندوب واسم المنتج.' }); return; }
  try { res.status(201).json(await createRepSubStoreRecord(req.body)); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/rep-sub-stores/:id', async (req, res) => {
  if (!req.body.repName || !req.body.productName) { res.status(400).json({ message: 'يرجى إدخال اسم المندوب واسم المنتج.' }); return; }
  try { const u = await updateRepSubStoreRecord(req.params.id, req.body); if (!u) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.json(u); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/rep-sub-stores/:id', async (req, res) => { try { const d = await deleteRepSubStoreRecord(req.params.id); if (!d) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });

// ── Financial Manager Custody ────────────────────────────────────────────────
app.get('/api/financial-manager-custody', async (_req, res) => { try { res.json(await getFinancialManagerCustodyData()); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/api/financial-manager-custody', async (req, res) => {
  if (!req.body.employeeName) { res.status(400).json({ message: 'يرجى إدخال اسم الموظف.' }); return; }
  if (Number(req.body.amount) <= 0) { res.status(400).json({ message: 'قيمة العهدة يجب أن تكون أكبر من صفر.' }); return; }
  try { res.status(201).json(await createFinManagerCustodyRecord(req.body)); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/financial-manager-custody/:id', async (req, res) => {
  if (!req.body.employeeName) { res.status(400).json({ message: 'يرجى إدخال اسم الموظف.' }); return; }
  try { const u = await updateFinManagerCustodyRecord(req.params.id, req.body); if (!u) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.json(u); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/financial-manager-custody/:id', async (req, res) => { try { const d = await deleteFinManagerCustodyRecord(req.params.id); if (!d) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });

// ── Raw Materials Purchases ──────────────────────────────────────────────────
app.get('/api/raw-materials-purchases', async (_req, res) => { try { res.json(await getRawMaterialsPurchasesData()); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/api/raw-materials-purchases', async (req, res) => {
  if (!req.body.supplierName || !req.body.materialName) { res.status(400).json({ message: 'يرجى إدخال اسم المورد واسم الخامة.' }); return; }
  if (Number(req.body.quantity) <= 0 || Number(req.body.unitPrice) <= 0) { res.status(400).json({ message: 'الكمية وسعر الوحدة يجب أن يكونا أكبر من صفر.' }); return; }
  try { res.status(201).json(await createRawPurchaseRecord(req.body)); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/raw-materials-purchases/:id', async (req, res) => {
  if (!req.body.supplierName || !req.body.materialName) { res.status(400).json({ message: 'يرجى إدخال اسم المورد واسم الخامة.' }); return; }
  try { const u = await updateRawPurchaseRecord(req.params.id, req.body); if (!u) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.json(u); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/raw-materials-purchases/:id', async (req, res) => { try { const d = await deleteRawPurchaseRecord(req.params.id); if (!d) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });

// ── Machine Maintenance Purchases ────────────────────────────────────────────
app.get('/api/machine-maintenance-purchases', async (_req, res) => { try { res.json(await getMachineMaintenancePurchasesData()); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/api/machine-maintenance-purchases', async (req, res) => {
  if (!req.body.supplierName || !req.body.description) { res.status(400).json({ message: 'يرجى إدخال اسم المورد ووصف العملية.' }); return; }
  if (Number(req.body.amount) <= 0) { res.status(400).json({ message: 'القيمة يجب أن تكون أكبر من صفر.' }); return; }
  try { res.status(201).json(await createMachinePurchaseRecord(req.body)); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/machine-maintenance-purchases/:id', async (req, res) => {
  if (!req.body.supplierName || !req.body.description) { res.status(400).json({ message: 'يرجى إدخال اسم المورد ووصف العملية.' }); return; }
  try { const u = await updateMachinePurchaseRecord(req.params.id, req.body); if (!u) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.json(u); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/machine-maintenance-purchases/:id', async (req, res) => { try { const d = await deleteMachinePurchaseRecord(req.params.id); if (!d) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });

// ── Misc Purchases ───────────────────────────────────────────────────────────
app.get('/api/misc-purchases', async (_req, res) => { try { res.json(await getMiscPurchasesData()); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/api/misc-purchases', async (req, res) => {
  if (!req.body.description) { res.status(400).json({ message: 'يرجى إدخال وصف المصروف.' }); return; }
  if (Number(req.body.amount) <= 0) { res.status(400).json({ message: 'القيمة يجب أن تكون أكبر من صفر.' }); return; }
  try { res.status(201).json(await createMiscPurchaseRecord(req.body)); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/misc-purchases/:id', async (req, res) => {
  if (!req.body.description) { res.status(400).json({ message: 'يرجى إدخال وصف المصروف.' }); return; }
  try { const u = await updateMiscPurchaseRecord(req.params.id, req.body); if (!u) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.json(u); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/misc-purchases/:id', async (req, res) => { try { const d = await deleteMiscPurchaseRecord(req.params.id); if (!d) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });

// ── Payroll & Advances ───────────────────────────────────────────────────────
app.get('/api/payroll-advances', async (_req, res) => { try { res.json(await getPayrollAdvancesData()); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/api/payroll-advances', async (req, res) => {
  if (!req.body.employeeName) { res.status(400).json({ message: 'يرجى إدخال اسم الموظف.' }); return; }
  if (Number(req.body.amount) <= 0) { res.status(400).json({ message: 'القيمة يجب أن تكون أكبر من صفر.' }); return; }
  try { res.status(201).json(await createPayrollAdvanceRecord(req.body)); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/payroll-advances/:id', async (req, res) => {
  if (!req.body.employeeName) { res.status(400).json({ message: 'يرجى إدخال اسم الموظف.' }); return; }
  try { const u = await updatePayrollAdvanceRecord(req.params.id, req.body); if (!u) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.json(u); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/payroll-advances/:id', async (req, res) => { try { const d = await deletePayrollAdvanceRecord(req.params.id); if (!d) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });

// ── Customer Payment Alerts ──────────────────────────────────────────────────
app.get('/api/customer-payment-alerts', async (_req, res) => { try { res.json(await getCustomerPaymentAlertsData()); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/api/customer-payment-alerts', async (req, res) => {
  if (!req.body.customerName) { res.status(400).json({ message: 'يرجى إدخال اسم العميل.' }); return; }
  if (Number(req.body.amount) <= 0) { res.status(400).json({ message: 'القيمة يجب أن تكون أكبر من صفر.' }); return; }
  try { res.status(201).json(await createPaymentAlertRecord(req.body)); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/customer-payment-alerts/:id', async (req, res) => {
  if (!req.body.customerName) { res.status(400).json({ message: 'يرجى إدخال اسم العميل.' }); return; }
  try { const u = await updatePaymentAlertRecord(req.params.id, req.body); if (!u) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.json(u); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/customer-payment-alerts/:id', async (req, res) => { try { const d = await deletePaymentAlertRecord(req.params.id); if (!d) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });

// ── Free Samples ─────────────────────────────────────────────────────────────
app.get('/api/free-samples', async (_req, res) => { try { res.json(await getFreeSamplesData()); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/api/free-samples', async (req, res) => {
  if (!req.body.customerName) { res.status(400).json({ message: 'يرجى إدخال اسم العميل.' }); return; }
  if (!req.body.productName) { res.status(400).json({ message: 'يرجى إدخال اسم المنتج.' }); return; }
  try { res.status(201).json(await createFreeSampleRecord(req.body)); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/free-samples/:id', async (req, res) => {
  if (!req.body.customerName) { res.status(400).json({ message: 'يرجى إدخال اسم العميل.' }); return; }
  if (!req.body.productName) { res.status(400).json({ message: 'يرجى إدخال اسم المنتج.' }); return; }
  try { const u = await updateFreeSampleRecord(req.params.id, req.body); if (!u) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.json(u); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/free-samples/:id', async (req, res) => { try { const d = await deleteFreeSampleRecord(req.params.id); if (!d) { res.status(404).json({ message: 'السجل غير موجود.' }); return; } res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } });

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`ERB backend is running on http://localhost:${port}`);
  });
}

export default app;

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
  deletePriceListRecord
} from './data/erbStore.js';
import { getDatabaseStatus, safeQuery } from './db.js';
import { createSwaggerSpec } from './swagger.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 5000);
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const swaggerSpec = createSwaggerSpec(`http://localhost:${port}`);

app.use(
  cors({
    origin: frontendUrl
  })
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

app.listen(port, () => {
  console.log(`ERB backend is running on http://localhost:${port}`);
});

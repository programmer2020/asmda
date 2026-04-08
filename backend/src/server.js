import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import {
  createCreditSalesRecord,
  createSalesRecord,
  deleteCreditSalesRecord,
  deleteSalesRecord,
  getCreditSalesData,
  getDashboardData,
  getSalesData,
  updateCreditSalesRecord,
  updateSalesRecord
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
  const payload = await getDashboardPayload();
  response.json(payload);
});

app.get('/api/sales', (_request, response) => {
  response.json(getSalesData());
});

app.post('/api/sales', (request, response) => {
  const validationMessage = validateSalesPayload(request.body);

  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }

  const created = createSalesRecord(request.body);
  response.status(201).json(created);
});

app.put('/api/sales/:id', (request, response) => {
  const validationMessage = validateSalesPayload(request.body);

  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }

  const updated = updateSalesRecord(request.params.id, request.body);

  if (!updated) {
    response.status(404).json({ message: 'سجل المبيعات المطلوب غير موجود.' });
    return;
  }

  response.json(updated);
});

app.delete('/api/sales/:id', (request, response) => {
  const deleted = deleteSalesRecord(request.params.id);

  if (!deleted) {
    response.status(404).json({ message: 'سجل المبيعات المطلوب غير موجود.' });
    return;
  }

  response.status(204).send();
});

app.get('/api/credit-sales', (_request, response) => {
  response.json(getCreditSalesData());
});

app.get('/api/credit', (_request, response) => {
  response.json(getCreditSalesData());
});

app.post('/api/credit-sales', (request, response) => {
  const validationMessage = validateCreditSalesPayload(request.body);

  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }

  const created = createCreditSalesRecord(request.body);
  response.status(201).json(created);
});

app.put('/api/credit-sales/:id', (request, response) => {
  const validationMessage = validateCreditSalesPayload(request.body);

  if (validationMessage) {
    response.status(400).json({ message: validationMessage });
    return;
  }

  const updated = updateCreditSalesRecord(request.params.id, request.body);

  if (!updated) {
    response.status(404).json({ message: 'سجل مبيعات الآجل المطلوب غير موجود.' });
    return;
  }

  response.json(updated);
});

app.delete('/api/credit-sales/:id', (request, response) => {
  const deleted = deleteCreditSalesRecord(request.params.id);

  if (!deleted) {
    response.status(404).json({ message: 'سجل مبيعات الآجل المطلوب غير موجود.' });
    return;
  }

  response.status(204).send();
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

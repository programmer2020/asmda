const healthSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', example: 'ok' },
    runtime: { type: 'string', example: 'local' },
    database: { type: 'string', example: 'fallback' },
    message: {
      type: 'string',
      example: 'الوضع المحلي مفعل بدون Docker أو Postgres.'
    },
    time: {
      type: 'string',
      format: 'date-time',
      example: '2026-04-08T10:15:30.000Z'
    }
  }
};

const salesInputSchema = {
  type: 'object',
  required: ['customerName', 'productName', 'amount', 'status', 'salesRep', 'saleDate'],
  properties: {
    customerName: { type: 'string', example: 'شركة النور التجارية' },
    productName: { type: 'string', example: 'نظام إدارة المخزون' },
    amount: { type: 'number', example: 18500 },
    status: { type: 'string', example: 'مكتملة' },
    salesRep: { type: 'string', example: 'أحمد سالم' },
    saleDate: { type: 'string', example: '2026-04-05' },
    notes: { type: 'string', example: 'تم التسليم والدفع بالكامل.' }
  }
};

const creditSalesInputSchema = {
  type: 'object',
  required: ['customerName', 'invoiceNumber', 'amount', 'paidAmount', 'status', 'salesRep', 'dueDate'],
  properties: {
    customerName: { type: 'string', example: 'شركة المدار' },
    invoiceNumber: { type: 'string', example: 'INV-4101' },
    amount: { type: 'number', example: 22000 },
    paidAmount: { type: 'number', example: 8000 },
    status: { type: 'string', example: 'مسدد جزئيا' },
    salesRep: { type: 'string', example: 'هبة فؤاد' },
    dueDate: { type: 'string', example: '2026-04-18' },
    notes: { type: 'string', example: 'تم استلام الدفعة الأولى وتحديد موعد المتابعة.' }
  }
};

export function createSwaggerSpec(serverUrl) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'توثيق ERB API',
      version: '1.0.0',
      description:
        'توثيق واجهات الباك اند الخاصة بلوحة التحكم والمبيعات ومبيعات الآجل مع عمليات CRUD.'
    },
    servers: [
      {
        url: serverUrl,
        description: 'الخادم المحلي'
      }
    ],
    tags: [
      {
        name: 'الحالة',
        description: 'فحص حالة النظام والبيئة'
      },
      {
        name: 'لوحة التحكم',
        description: 'بيانات الملخص العام'
      },
      {
        name: 'المبيعات',
        description: 'إدارة عمليات المبيعات'
      },
      {
        name: 'مبيعات الآجل',
        description: 'إدارة مبيعات الآجل والتحصيل'
      }
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['الحالة'],
          summary: 'فحص حالة الباك اند',
          responses: {
            200: {
              description: 'حالة النظام',
              content: {
                'application/json': {
                  schema: healthSchema
                }
              }
            }
          }
        }
      },
      '/api/dashboard': {
        get: {
          tags: ['لوحة التحكم'],
          summary: 'جلب بيانات لوحة التحكم',
          responses: {
            200: {
              description: 'بيانات الملخص العام'
            }
          }
        }
      },
      '/api/sales': {
        get: {
          tags: ['المبيعات'],
          summary: 'جلب بيانات المبيعات',
          responses: {
            200: {
              description: 'قائمة المبيعات مع المؤشرات'
            }
          }
        },
        post: {
          tags: ['المبيعات'],
          summary: 'إضافة عملية بيع جديدة',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: salesInputSchema
              }
            }
          },
          responses: {
            201: {
              description: 'تم إنشاء سجل المبيعات'
            }
          }
        }
      },
      '/api/sales/{id}': {
        put: {
          tags: ['المبيعات'],
          summary: 'تعديل عملية بيع',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'SAL-1001' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: salesInputSchema
              }
            }
          },
          responses: {
            200: {
              description: 'تم تعديل السجل'
            }
          }
        },
        delete: {
          tags: ['المبيعات'],
          summary: 'حذف عملية بيع',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'SAL-1001' }
            }
          ],
          responses: {
            204: {
              description: 'تم حذف السجل'
            }
          }
        }
      },
      '/api/credit-sales': {
        get: {
          tags: ['مبيعات الآجل'],
          summary: 'جلب بيانات مبيعات الآجل',
          responses: {
            200: {
              description: 'قائمة مبيعات الآجل مع المؤشرات'
            }
          }
        },
        post: {
          tags: ['مبيعات الآجل'],
          summary: 'إضافة سجل مبيعات آجل',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: creditSalesInputSchema
              }
            }
          },
          responses: {
            201: {
              description: 'تم إنشاء سجل مبيعات الآجل'
            }
          }
        }
      },
      '/api/credit-sales/{id}': {
        put: {
          tags: ['مبيعات الآجل'],
          summary: 'تعديل سجل مبيعات آجل',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'CRD-2001' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: creditSalesInputSchema
              }
            }
          },
          responses: {
            200: {
              description: 'تم تعديل السجل'
            }
          }
        },
        delete: {
          tags: ['مبيعات الآجل'],
          summary: 'حذف سجل مبيعات آجل',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'CRD-2001' }
            }
          ],
          responses: {
            204: {
              description: 'تم حذف السجل'
            }
          }
        }
      }
    }
  };
}

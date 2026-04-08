# ERB Command Center

تم تحويل المشروع إلى واجهة احترافية لفكرة `ERB` مع تشغيل محلي بدون Docker:

- `frontend`: تطبيق React مبني بـ Vite.
- `backend`: API مبني بـ Node.js و Express مع دعم وضع محلي `local mode` أو Postgres عند توفر الإعدادات الصحيحة.
- `scripts`: سكريبتات المساعدة لتشغيل المشروع محليًا.

## التشغيل السريع

1. انسخ ملفات البيئة إذا لم تكن موجودة:

```powershell
.\scripts\setup.ps1
```

2. ثبّت حزم الباك اند وشغله:

```powershell
Set-Location .\backend
npm install
npm run dev
```

3. في نافذة ثانية ثبّت حزم الفرونت اند وشغله:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

## تشغيل اختياري بسكريبت واحد

```powershell
.\scripts\dev.ps1
```

هذا السكريبت يفتح نافذتين PowerShell لتشغيل `backend` و `frontend` محليًا.

## المنافذ الافتراضية

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## API المتوفرة

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/tasks`

## وضع البيانات

- الوضع الافتراضي الآن هو `DATA_MODE=local` داخل [backend/.env](c:/Users/lenovo/Desktop/asmdaproje/backend/.env) حتى يعمل المشروع فورًا بدون Docker.
- لو أردت تشغيل Postgres محليًا، غيّر `DATA_MODE` إلى `auto` أو `postgres` ثم حدّث بيانات الاتصال داخل [backend/.env](c:/Users/lenovo/Desktop/asmdaproje/backend/.env).

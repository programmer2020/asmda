# ─── Local Production Launcher ───────────────────────────────────────────────
# يشغّل Backend (production) + يبني Frontend ويخدمه على http://localhost:4173/asmda/
# الاستخدام: من مجلد الـ root: .\scripts\start-local-prod.ps1
# ─────────────────────────────────────────────────────────────────────────────

$Root = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  تشغيل التطبيق بوضع PRODUCTION محليًا" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# 1. تشغيل Backend في نافذة منفصلة
Write-Host "[1/3] تشغيل Backend على http://localhost:5000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$Root\backend'; Write-Host 'Backend starting...' -ForegroundColor Green; npm start"
)

# انتظر ثانيتين حتى يبدأ السيرفر
Start-Sleep -Seconds 3

# 2. بناء Frontend (يستخدم .env.local → API_URL = localhost:5000)
Write-Host "[2/3] بناء Frontend (production build) ..." -ForegroundColor Yellow
Set-Location "$Root\frontend"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "خطأ في البناء! يرجى مراجعة الأخطاء أعلاه." -ForegroundColor Red
    exit 1
}

# 3. خدمة Frontend المبني على localhost:4173
Write-Host ""
Write-Host "[3/3] تشغيل Frontend على http://localhost:4173/asmda/ ..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  التطبيق يعمل على:" -ForegroundColor Green
Write-Host "  Frontend → http://localhost:4173/asmda/" -ForegroundColor Green
Write-Host "  Backend  → http://localhost:5000" -ForegroundColor Green
Write-Host "  Database → Neon Cloud (تلقائي)" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

npx vite preview --host

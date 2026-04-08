$root = Split-Path -Parent $PSScriptRoot

$filesToCopy = @(
  @{
    Source = Join-Path $root 'frontend\.env.example'
    Target = Join-Path $root 'frontend\.env'
  },
  @{
    Source = Join-Path $root 'backend\.env.example'
    Target = Join-Path $root 'backend\.env'
  }
)

foreach ($file in $filesToCopy) {
  if (-not (Test-Path $file.Target)) {
    Copy-Item $file.Source $file.Target
    Write-Host "Created $($file.Target)"
  } else {
    Write-Host "Skipped existing $($file.Target)"
  }
}

Write-Host ''
Write-Host 'Next steps:'
Write-Host '1. Set-Location .\backend'
Write-Host '   npm install'
Write-Host '   npm run dev'
Write-Host '2. Set-Location .\frontend'
Write-Host '   npm install'
Write-Host '   npm run dev'
Write-Host ''
Write-Host 'Optional: set DATA_MODE=auto in backend\.env if you want to use a local Postgres server.'

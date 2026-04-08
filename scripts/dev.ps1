$root = Split-Path -Parent $PSScriptRoot
$backendCommand = "Set-Location '$root\backend'; npm run dev"
$frontendCommand = "Set-Location '$root\frontend'; npm run dev"

Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCommand
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCommand

Write-Host 'Started frontend and backend locally in separate PowerShell windows.'

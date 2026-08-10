Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "            🚀 Launching NexaERP Services               " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/2] Launching Backend Server on http://localhost:5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\server'; npm run dev"

Write-Host "[2/2] Launching Frontend Client on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\client'; npm run dev"

Write-Host "`n✅ Both services have been launched in separate terminal windows!" -ForegroundColor Green
Write-Host "👉 Open your browser at: http://localhost:5173" -ForegroundColor Green
Write-Host "👉 Demo Login: admin@nexaerp.com / Admin@123" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan

@echo off
title NexaERP Launcher
echo ========================================================
echo               NexaERP Operations Portal
echo ========================================================
echo.
echo [1/2] Starting Backend Server on http://localhost:5000 ...
start "NexaERP Backend Server (Port 5000)" cmd /k "cd /d "%~dp0server" && npm run dev"

echo [2/2] Starting Frontend UI on http://localhost:5173 ...
start "NexaERP Frontend Client (Port 5173)" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo ========================================================
echo  Both services launched in separate windows!
echo  Open Browser: http://localhost:5173
echo  Demo Login:   admin@nexaerp.com / Admin@123
echo ========================================================
pause

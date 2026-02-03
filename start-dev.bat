@echo off
echo ===========================================
echo INICIANDO AMBIENTE DE DESENVOLVIMENTO
echo ===========================================

echo.
echo [1/2] Iniciando Backend na porta 3001...
cd /d "%~dp0backend"
start "Backend-3001" cmd /c "npm start"

echo.
echo [2/2] Aguardando 3 segundos para backend inicializar...
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Iniciando Frontend na porta 3002...
cd /d "%~dp0"
start "Frontend-3002" cmd /c "npm run dev"

echo.
echo ===========================================
echo AMBIENTE INICIADO!
echo ===========================================
echo Backend:  http://localhost:3001/api
echo Frontend: http://localhost:3002
echo ===========================================

pause
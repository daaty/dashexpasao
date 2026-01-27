@echo off
title Urban Dashboard - Inicializador
color 0A

echo.
echo ========================================
echo   URBAN DASHBOARD - Dev Mode
echo ========================================
echo.
echo Iniciando Backend e Frontend...
echo.

REM Inicia o Backend em uma nova janela
start "Backend - API (Port 3001)" powershell -NoExit -Command "cd '%~dp0backend'; Write-Host '===== BACKEND INICIANDO (Port 3001) =====' -ForegroundColor Cyan; npm run dev"

REM Aguarda 5 segundos para backend iniciar
echo Aguardando backend inicializar...
timeout /t 5 /nobreak >nul

REM Inicia o Frontend em uma nova janela
start "Frontend - Dashboard (Port 3000)" powershell -NoExit -Command "cd '%~dp0'; Write-Host '===== FRONTEND INICIANDO (Port 3000) =====' -ForegroundColor Green; npm run dev"

REM Aguarda 5 segundos para frontend compilar
echo Aguardando frontend compilar...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   Servidores Iniciados!
echo ========================================
echo.
echo Backend:  http://localhost:3001/api/rides/status
echo Frontend: http://localhost:3000
echo.
echo Abrindo navegador...
timeout /t 2 /nobreak >nul

start http://localhost:3000

echo.
echo ========================================
echo   Servidores rodando!
echo ========================================
echo.
echo Para encerrar: Feche as janelas do PowerShell
echo Ou pressione Ctrl+C em cada janela
echo.
echo Pressione qualquer tecla para fechar este launcher...
pause >nul
exit

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
start "Backend - API (Port 3001)" powershell -NoExit -Command "cd '%~dp0backend'; Write-Host '===== BACKEND INICIANDO =====' -ForegroundColor Cyan; npm run dev"

REM Aguarda 3 segundos
timeout /t 3 /nobreak >nul

REM Inicia o Frontend em uma nova janela
start "Frontend - Dashboard (Port 3000)" powershell -NoExit -Command "cd '%~dp0'; Write-Host '===== FRONTEND INICIANDO =====' -ForegroundColor Green; npm run dev"

echo.
echo ========================================
echo   Servidores Iniciados!
echo ========================================
echo.
echo Backend:  http://localhost:3001/api/health
echo Frontend: http://localhost:3000
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause >nul

start http://localhost:3000

echo.
echo Servidores rodando em segundo plano.
echo Feche as janelas do PowerShell para encerrar.
echo.
timeout /t 3 /nobreak >nul
exit

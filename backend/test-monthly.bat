@echo off
echo.
echo === Aguardando 3 segundos ===
echo.
timeout /t 3 /nobreak >nul
cd "c:\Users\Herbert\OneDrive\Desktop\Dash-Expansão\backend"
npx tsx scripts\test-monthly-endpoint.ts
pause

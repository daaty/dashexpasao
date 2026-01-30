@echo off
echo ================================================
echo   ATUALIZACAO DE DADOS IBGE - CENSO 2022
echo ================================================
echo.

cd /d "%~dp0"

echo Verificando conexao com o banco de dados...
echo.

node update-cities-ibge-censo2022.js

echo.
echo ================================================
echo   PROCESSO CONCLUIDO
echo ================================================
pause

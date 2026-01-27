@echo off
REM Script para atualizar descrições de transações no Windows
REM Uso: update-transactions.bat ou npm run update:transactions

echo.
echo ========================================
echo Urban Expansao - Atualizar Transacoes
echo ========================================
echo.

setlocal enabledelayedexpansion

REM Definir caminho padrão
set CSV_FILE=%1
if "!CSV_FILE!"=="" (
    set CSV_FILE=transactions-updates.csv
)

REM Verificar se arquivo existe
if not exist "!CSV_FILE!" (
    echo Erro: Arquivo nao encontrado: !CSV_FILE!
    echo.
    echo Uso:
    echo   update-transactions.bat
    echo   update-transactions.bat "C:\path\to\file.csv"
    echo.
    exit /b 1
)

echo Arquivo CSV: !CSV_FILE!
echo.

REM Executar o script TypeScript
echo [*] Processando transacoes...
echo.

call npx tsx scripts/update-transactions-descriptions.ts "!CSV_FILE!"

echo.
echo Processo finalizado!
pause

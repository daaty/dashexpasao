@echo off
echo ========================================
echo ATUALIZADOR DE DADOS DAS CIDADES - IBGE
echo ========================================
echo.

cd /d "%~dp0"
cd backend

echo Instalando dependencias necessarias...
call npm install axios @prisma/client

echo.
echo Escolha uma opcao:
echo.
echo 1. Atualizar dados completos (script principal)
echo 2. Executar requisicoes especificas do IBGE
echo 3. Atualizar apenas prefeitos e detalhes
echo 4. Ver status do banco de dados
echo.

set /p choice="Digite sua escolha (1-4): "

if "%choice%"=="1" (
    echo.
    echo Executando atualizacao completa...
    call npx ts-node scripts/atualizar-dados-ibge.ts
) else if "%choice%"=="2" (
    echo.
    echo Executando requisicoes especificas do IBGE...
    call npx ts-node scripts/executar-requisicoes-ibge.ts
) else if "%choice%"=="3" (
    echo.
    echo Atualizando prefeitos e detalhes...
    call npx ts-node scripts/atualizar-prefeitos-detalhes.ts
) else if "%choice%"=="4" (
    echo.
    echo Verificando status do banco...
    call npx prisma studio
) else (
    echo Opcao invalida!
    goto :eof
)

echo.
echo ========================================
echo Processo concluido!
echo ========================================
pause
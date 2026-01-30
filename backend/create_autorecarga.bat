@echo off
setlocal enabledelayedexpansion

REM Dados de conexão (você pode precisar ajustar com as credenciais corretas)
set DB_HOST=148.230.73.27
set DB_PORT=5434
set DB_NAME=urbantmt
set DB_USER=app_user
set PGPASSWORD=app_user_password

REM Criar arquivo SQL temporário
(
  echo CREATE TABLE IF NOT EXISTS "Autorecarga" (
  echo     "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(^),
  echo     "valido" BOOLEAN DEFAULT false,
  echo     "agendado" BOOLEAN DEFAULT false,
  echo     "tipo" VARCHAR(50^),
  echo     "id_transacao" VARCHAR(255^),
  echo     "data" TIMESTAMP,
  echo     "hora" VARCHAR(8^),
  echo     "valor_extraido" DECIMAL(12,2^),
  echo     "pagador" VARCHAR(255^),
  echo     "recebedor" VARCHAR(255^),
  echo     "cnpj_recebedor" VARCHAR(18^),
  echo     "cnpj_valido" BOOLEAN DEFAULT false,
  echo     "status_recebedor" VARCHAR(50^),
  echo     "creditos_calculados" DECIMAL(12,2^),
  echo     "remetente_whatsapp" VARCHAR(20^),
  echo     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  echo     "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  echo ^);
  echo.
  echo CREATE INDEX IF NOT EXISTS idx_autorecarga_id_transacao ON "Autorecarga"("id_transacao"^);
  echo CREATE INDEX IF NOT EXISTS idx_autorecarga_data ON "Autorecarga"("data"^);
  echo CREATE INDEX IF NOT EXISTS idx_autorecarga_cnpj_recebedor ON "Autorecarga"("cnpj_recebedor"^);
  echo CREATE INDEX IF NOT EXISTS idx_autorecarga_createdAt ON "Autorecarga"("createdAt"^);
  echo.
  echo SELECT tablename FROM pg_tables WHERE tablename = 'Autorecarga';
) > temp_autorecarga.sql

REM Executar SQL
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -f temp_autorecarga.sql

REM Limpar arquivo temporário
del temp_autorecarga.sql

echo.
echo ✅ Tabela Autorecarga criada com sucesso!
pause

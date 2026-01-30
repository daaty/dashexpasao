-- =====================================================
-- ✅ FIX FINAL PARA AUTORECARGA
-- =====================================================

-- 1. REMOVER constraints antigas
ALTER TABLE "Autorecarga" DROP CONSTRAINT IF EXISTS "Autorecarga_pkey" CASCADE;

-- 2. ADICIONAR uuid_id como PRIMARY KEY (se não tiver)
ALTER TABLE "Autorecarga" 
ADD CONSTRAINT autorecarga_uuid_pk PRIMARY KEY (uuid_id);

-- 3. RECREAR ÍNDICES
DROP INDEX IF EXISTS idx_autorecarga_id_transacao;
DROP INDEX IF EXISTS idx_autorecarga_data;
DROP INDEX IF EXISTS idx_autorecarga_cnpj_recebedor;
DROP INDEX IF EXISTS idx_autorecarga_createdat;

CREATE INDEX idx_autorecarga_id_transacao ON "Autorecarga"(id_transacao);
CREATE INDEX idx_autorecarga_data ON "Autorecarga"(data);
CREATE INDEX idx_autorecarga_cnpj_recebedor ON "Autorecarga"(cnpj_recebedor);
CREATE INDEX idx_autorecarga_createdat ON "Autorecarga"("createdAt");

-- =====================================================
-- ✅ VERIFICAR ESTRUTURA
-- =====================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Autorecarga'
ORDER BY ordinal_position;

-- =====================================================
-- 🧪 TESTE: Inserir com dados reais
-- =====================================================
INSERT INTO "Autorecarga" (
  id_transacao, 
  valido, 
  agendado,
  tipo,
  valor_extraido
) VALUES (
  'TXN-001',
  true,
  false,
  'teste_sql',
  100.50
)
RETURNING uuid_id, id_transacao, valor_extraido;

-- =====================================================
-- ✅ RESULTADO: uuid_id será gerado automaticamente ✅
-- =====================================================

-- ✅ Verificar que o trigger foi criado e está funcionando
-- Execute isso no seu banco PostgreSQL

-- 1. Verificar se o trigger existe
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'autorecarga_force_uuid';

-- 2. Verificar se a função existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'force_new_uuid';

-- 3. Listar todos os triggers na tabela Autorecarga
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'Autorecarga';

-- 4. TESTE: Tentar inserir com UUID inválido
-- O trigger vai IGNORAR e gerar novo UUID automaticamente
INSERT INTO "Autorecarga" (
  id, 
  valido, 
  agendado, 
  tipo, 
  id_transacao,
  valor_extraido
) VALUES (
  'E3187249520260127212683250UQKArJ',  -- UUID INVÁLIDO (será ignorado)
  true,
  false,
  'teste_trigger',
  'TXN-001',
  100.50
)
RETURNING id;  -- Vai retornar um UUID válido gerado pelo trigger ✅

-- 5. Verificar registros inseridos
SELECT id, tipo, valor_extraido FROM "Autorecarga" ORDER BY "createdAt" DESC LIMIT 5;

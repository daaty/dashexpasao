import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://urbanmt:urban2025@148.230.73.27:5434/urbantmt?sslmode=disable',
});

const createTableSQL = `
CREATE TABLE IF NOT EXISTS "Autorecarga" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "valido" BOOLEAN DEFAULT false,
    "agendado" BOOLEAN DEFAULT false,
    "tipo" VARCHAR(50),
    "id_transacao" VARCHAR(255),
    "data" TIMESTAMP,
    "hora" VARCHAR(8),
    "valor_extraido" DECIMAL(12,2),
    "pagador" VARCHAR(255),
    "recebedor" VARCHAR(255),
    "cnpj_recebedor" VARCHAR(18),
    "cnpj_valido" BOOLEAN DEFAULT false,
    "status_recebedor" VARCHAR(50),
    "creditos_calculados" DECIMAL(12,2),
    "remetente_whatsapp" VARCHAR(20),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_autorecarga_id_transacao ON "Autorecarga"("id_transacao");
CREATE INDEX IF NOT EXISTS idx_autorecarga_data ON "Autorecarga"("data");
CREATE INDEX IF NOT EXISTS idx_autorecarga_cnpj_recebedor ON "Autorecarga"("cnpj_recebedor");
CREATE INDEX IF NOT EXISTS idx_autorecarga_createdAt ON "Autorecarga"("createdAt");

SELECT tablename FROM pg_tables WHERE tablename = 'Autorecarga';
`;

async function createAutorecargaTable() {
  try {
    console.log('📊 Conectando ao PostgreSQL...');
    const client = await pool.connect();

    console.log('🔨 Criando tabela Autorecarga...\n');
    const result = await client.query(createTableSQL);

    console.log('✅ Tabela Autorecarga criada com sucesso!\n');
    console.log('📋 Colunas criadas:');
    console.log('   ✓ id (UUID - PK)');
    console.log('   ✓ valido (Boolean)');
    console.log('   ✓ agendado (Boolean)');
    console.log('   ✓ tipo (String)');
    console.log('   ✓ id_transacao (String)');
    console.log('   ✓ data (DateTime)');
    console.log('   ✓ hora (String)');
    console.log('   ✓ valor_extraido (Decimal 12,2)');
    console.log('   ✓ pagador (String)');
    console.log('   ✓ recebedor (String)');
    console.log('   ✓ cnpj_recebedor (String)');
    console.log('   ✓ cnpj_valido (Boolean)');
    console.log('   ✓ status_recebedor (String)');
    console.log('   ✓ creditos_calculados (Decimal 12,2)');
    console.log('   ✓ remetente_whatsapp (String)');
    console.log('   ✓ createdAt (DateTime)');
    console.log('   ✓ updatedAt (DateTime)');

    console.log('\n🔍 Índices criados:');
    console.log('   ✓ idx_autorecarga_id_transacao');
    console.log('   ✓ idx_autorecarga_data');
    console.log('   ✓ idx_autorecarga_cnpj_recebedor');
    console.log('   ✓ idx_autorecarga_createdAt');

    console.log('\n📦 Banco de Dados: urbantmt');
    console.log('🏠 Host: 148.230.73.27:5434');

    client.release();
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAutorecargaTable();

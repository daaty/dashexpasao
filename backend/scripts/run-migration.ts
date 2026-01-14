import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('🚀 Iniciando migração para PostgreSQL\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Conectar ao banco
    console.log('📡 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');

    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'migration.sql');
    console.log(`📄 Lendo SQL: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // Executar SQL
    console.log('⚙️  Executando migrations...');
    await client.query(sql);
    console.log('✅ Migrations executadas com sucesso!\n');

    // Verificar tabelas criadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tabelas criadas:');
    result.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n✨ Migração concluída com sucesso!');
    console.log('\n🔄 Agora você pode executar: npx tsx scripts/populate-ibge-data.ts');
    
  } catch (error: any) {
    console.error('❌ Erro durante a migração:', error.message);
    if (error.code) {
      console.error(`   Código do erro: ${error.code}`);
    }
    throw error;
  } finally {
    await client.end();
  }
}

runMigration()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

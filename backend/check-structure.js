const { Pool } = require('pg');

const n8nPool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela transactions...');
    
    const result = await n8nPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'dashboard' 
        AND table_name = 'transactions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 COLUNAS DA TABELA dashboard.transactions:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });

    // Vamos ver alguns dados de exemplo
    const sampleResult = await n8nPool.query(`
      SELECT * FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description ILIKE '%recarga%'
      LIMIT 3
    `);
    
    console.log('\n📊 EXEMPLO DE DADOS:');
    console.log(sampleResult.rows);
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  } finally {
    await n8nPool.end();
    process.exit(0);
  }
}

checkTableStructure();
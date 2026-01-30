const { Pool } = require('pg');

// Configuração do banco N8N
const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

const pool = new Pool({
  connectionString: N8N_DATABASE_URL,
});

async function getTransactionsWithoutCity() {
  try {
    console.log('🔍 Verificando estrutura da tabela transactions...\n');

    // Primeiro, vamos ver a estrutura da tabela
    const structureQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'dashboard' 
      AND table_name = 'transactions'
      ORDER BY ordinal_position;
    `;

    const structure = await pool.query(structureQuery);
    console.log('📋 Estrutura da tabela dashboard.transactions:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Agora vamos buscar algumas transações para ver o formato
    console.log('\n🔍 Buscando transações sem cidade...\n');

    const query = `
      SELECT 
        "driverId",
        "transactionId",
        quantity,
        type,
        amount,
        description,
        timestamp,
        "createdAt",
        city
      FROM dashboard.transactions 
      WHERE city IS NULL 
         OR city = '' 
         OR TRIM(city) = ''
      ORDER BY timestamp DESC
      LIMIT 20;
    `;

    const result = await pool.query(query);
    
    console.log(`📊 Encontradas ${result.rows.length} transações sem cidade:\n`);
    
    if (result.rows.length > 0) {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}.`);
        console.log(`   Driver ID: ${row.driverId}`);
        console.log(`   Transaction ID: ${row.transactionId}`);
        console.log(`   Quantidade: ${row.quantity}`);
        console.log(`   Valor: ${row.amount}`);
        console.log(`   Tipo: ${row.type}`);
        console.log(`   Descrição: ${row.description}`);
        console.log(`   Data Transação: ${row.timestamp}`);
        console.log(`   Data Criação: ${row.createdAt}`);
        console.log(`   Cidade: "${row.city}"`);
        console.log('   ---');
      });
      
      // Estatísticas
      const stats = await pool.query(`
        SELECT 
          COUNT(*) as total_sem_cidade,
          SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) as total_credito_sem_cidade,
          SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END) as total_debito_sem_cidade
        FROM dashboard.transactions 
        WHERE city IS NULL OR city = '' OR TRIM(city) = '';
      `);
      
      console.log('\n📈 Estatísticas das transações sem cidade:');
      console.log(`Total de transações: ${stats.rows[0].total_sem_cidade}`);
      console.log(`Total crédito: ${stats.rows[0].total_credito_sem_cidade}`);
      console.log(`Total débito: ${stats.rows[0].total_debito_sem_cidade}`);
      
    } else {
      console.log('✅ Não há transações sem cidade definida.');
    }

  } catch (error) {
    console.error('❌ Erro ao buscar transações:', error);
  } finally {
    await pool.end();
  }
}

getTransactionsWithoutCity();
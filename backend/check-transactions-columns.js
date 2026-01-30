const { n8nDatabase } = require('./dist/config/n8nDatabase');

async function checkColumns() {
  try {
    // Verificar colunas da tabela transactions
    const columnsResult = await n8nDatabase.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'dashboard' 
        AND table_name = 'transactions' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 COLUNAS DA TABELA TRANSACTIONS:');
    console.log('================================');
    columnsResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    // Verificar amostra de dados de Nova Monte Verde
    const sampleResult = await n8nDatabase.query(`
      SELECT "transactionId", type, description, city, amount, quantity, "createdAt", timestamp
      FROM dashboard.transactions
      WHERE LOWER(city) LIKE '%monte verde%'
        AND type = 'CREDIT'
        AND LOWER(description) LIKE '%recarga%'
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);

    console.log('\n📊 AMOSTRA DE TRANSAÇÕES DE NOVA MONTE VERDE:');
    console.log('==============================================');
    sampleResult.rows.forEach(row => {
      console.log(`  transactionId: ${row.transactionId}`);
      console.log(`    city: ${row.city}`);
      console.log(`    amount: ${row.amount}`);
      console.log(`    quantity: ${row.quantity}`);
      console.log(`    createdAt: ${row.createdAt}`);
      console.log(`    timestamp: ${row.timestamp}`);
      console.log('    ---');
    });

    // Comparar agrupamento por createdAt vs timestamp
    console.log('\n📅 COMPARAÇÃO DE AGRUPAMENTO POR MÊS:');
    console.log('=====================================');
    
    const byCreatedAt = await n8nDatabase.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        COUNT(*) as count,
        SUM(quantity) as total_revenue
      FROM dashboard.transactions
      WHERE LOWER(city) LIKE '%monte verde%'
        AND type = 'CREDIT'
        AND LOWER(description) LIKE '%recarga%'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `);
    
    console.log('\n🔹 Agrupado por createdAt:');
    byCreatedAt.rows.forEach(row => {
      console.log(`    ${row.month}: ${row.count} transações, R$ ${row.total_revenue}`);
    });

    const byTimestamp = await n8nDatabase.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', timestamp), 'YYYY-MM') as month,
        COUNT(*) as count,
        SUM(quantity) as total_revenue
      FROM dashboard.transactions
      WHERE LOWER(city) LIKE '%monte verde%'
        AND type = 'CREDIT'
        AND LOWER(description) LIKE '%recarga%'
      GROUP BY DATE_TRUNC('month', timestamp)
      ORDER BY month DESC
    `);
    
    console.log('\n🔹 Agrupado por timestamp:');
    byTimestamp.rows.forEach(row => {
      console.log(`    ${row.month}: ${row.count} transações, R$ ${row.total_revenue}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkColumns();

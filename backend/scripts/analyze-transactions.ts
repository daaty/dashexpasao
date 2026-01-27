import { n8nDatabase } from '../src/config/n8nDatabase';

async function analyzeTransactions() {
  try {
    await n8nDatabase.connect();
    console.log('✅ Conectado ao banco N8N\n');

    // Estrutura da tabela transactions
    console.log('📋 Estrutura dashboard.transactions:');
    const transStructure = await n8nDatabase.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'dashboard' AND table_name = 'transactions'
      ORDER BY ordinal_position
    `);
    console.table(transStructure.rows);

    // Estrutura da tabela drivers
    console.log('\n📋 Estrutura dashboard.drivers:');
    const driversStructure = await n8nDatabase.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'dashboard' AND table_name = 'drivers'
      ORDER BY ordinal_position
    `);
    console.table(driversStructure.rows);

    // Exemplo de dados de transactions
    console.log('\n🔍 Exemplos de transactions (crédito):');
    const transSample = await n8nDatabase.query(`
      SELECT *
      FROM dashboard.transactions
      WHERE type = 'credit'
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);
    console.table(transSample.rows);

    // Ver todas as descrições únicas de crédito
    console.log('\n📝 Descrições únicas de transactions tipo credit:');
    const descriptions = await n8nDatabase.query(`
      SELECT DISTINCT description, COUNT(*) as count
      FROM dashboard.transactions
      WHERE type = 'credit'
      GROUP BY description
      ORDER BY count DESC
      LIMIT 20
    `);
    console.table(descriptions.rows);

    // Exemplo de dados de drivers
    console.log('\n🔍 Exemplos de drivers:');
    const driversSample = await n8nDatabase.query(`
      SELECT *
      FROM dashboard.drivers
      LIMIT 5
    `);
    console.table(driversSample.rows);

    // Testar JOIN
    console.log('\n🔗 Teste de JOIN transactions + drivers (recargas):');
    const joinTest = await n8nDatabase.query(`
      SELECT 
        d.city,
        COUNT(*) as total_recargas,
        COUNT(*) * 2.50 as receita_total
      FROM dashboard.transactions t
      INNER JOIN dashboard.drivers d ON t."driverId" = d.id
      WHERE t.type = 'credit' AND t.description LIKE '%recarga%'
      GROUP BY d.city
      ORDER BY total_recargas DESC
      LIMIT 10
    `);
    console.table(joinTest.rows);

    await n8nDatabase.disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

analyzeTransactions();

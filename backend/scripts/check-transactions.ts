import { n8nDatabase } from '../src/config/n8nDatabase';

async function checkTransactions() {
  try {
    await n8nDatabase.connect();
    console.log('✅ Conectado\n');

    // Contar por tipo
    console.log('📊 Contagem por tipo:');
    const types = await n8nDatabase.query(`
      SELECT type, COUNT(*) as total
      FROM dashboard.transactions
      GROUP BY type
      ORDER BY total DESC
    `);
    console.table(types.rows);

    // Ver todas as transações
    console.log('\n📋 Primeiras 20 transações:');
    const all = await n8nDatabase.query(`
      SELECT *
      FROM dashboard.transactions
      ORDER BY "createdAt" DESC
      LIMIT 20
    `);
    console.table(all.rows);

    await n8nDatabase.disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkTransactions();

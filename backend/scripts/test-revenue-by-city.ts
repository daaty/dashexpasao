import { n8nDatabase } from '../src/config/n8nDatabase';

async function testRevenueByCity() {
  try {
    await n8nDatabase.connect();
    console.log('✅ Conectado\n');

    // Receita por cidade - APENAS recargas CREDIT
    console.log('💰 Receita por cidade (transações CREDIT com "recarga"):');
    const revenue = await n8nDatabase.query(`
      SELECT 
        d.city,
        COUNT(*) as total_recargas,
        SUM(t.amount) as receita_total,
        AVG(t.amount) as ticket_medio
      FROM dashboard.transactions t
      INNER JOIN dashboard.drivers d ON t."driverId" = d.id
      WHERE t.type = 'CREDIT' 
        AND LOWER(t.description) LIKE '%recarga%'
      GROUP BY d.city
      ORDER BY receita_total DESC
    `);
    console.table(revenue.rows);

    // Total geral
    console.log('\n📊 Total Geral:');
    const total = await n8nDatabase.query(`
      SELECT 
        COUNT(*) as total_recargas,
        SUM(t.amount) as receita_total
      FROM dashboard.transactions t
      WHERE t.type = 'CREDIT' 
        AND LOWER(t.description) LIKE '%recarga%'
    `);
    console.table(total.rows);

    await n8nDatabase.disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testRevenueByCity();

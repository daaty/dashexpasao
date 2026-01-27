require('dotenv').config();
const { Client } = require('pg');

async function testCityQuery() {
  const client = new Client({
    connectionString: process.env.N8N_DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Verificar cidades com "parana"
    const citiesResult = await client.query(`
      SELECT DISTINCT city 
      FROM dashboard.transactions 
      WHERE LOWER(city) LIKE '%parana%'
    `);
    
    console.log('🏙️  Cidades com "parana" em transactions:');
    citiesResult.rows.forEach(row => console.log(`  - ${row.city}`));
    console.log('');
    
    // Testar query simplificada
    const revenueResult = await client.query(`
      SELECT COALESCE(SUM(t.amount), 0) as total
      FROM dashboard.transactions t
      WHERE t.type = 'CREDIT'
        AND LOWER(t.description) LIKE '%recarga%'
        AND LOWER(t.city) = LOWER('Paranaíta')
    `);
    
    console.log('💰 Receita de recargas em Paranaíta (usando t.city):');
    console.log(`   R$ ${parseFloat(revenueResult.rows[0].total).toFixed(2)}\n`);
    
    // Comparar com query antiga
    const oldRevenueResult = await client.query(`
      SELECT COALESCE(SUM(t.amount), 0) as total
      FROM dashboard.transactions t
      WHERE t.type = 'CREDIT'
        AND LOWER(t.description) LIKE '%recarga%'
        AND t."driverId" IN (
          SELECT DISTINCT "driverId"
          FROM dashboard.rides
          WHERE LOWER(city) = LOWER('Paranaíta')
            AND status = 'Concluída'
            AND "arrivedTimestamp" IS NOT NULL
        )
    `);
    
    console.log('💰 Receita de recargas em Paranaíta (query antiga com rides):');
    console.log(`   R$ ${parseFloat(oldRevenueResult.rows[0].total).toFixed(2)}\n`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

testCityQuery();

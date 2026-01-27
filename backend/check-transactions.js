require('dotenv').config();
const { Client } = require('pg');

async function checkTransactions() {
  const client = new Client({
    connectionString: process.env.N8N_DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco N8N\n');
    
    // Calcular receita de recargas para Paranaíta
    const recargaResult = await client.query(`
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
    
    console.log('💰 Receita de RECARGAS em Paranaíta:');
    console.log(`   R$ ${parseFloat(recargaResult.rows[0].total).toFixed(2)}\n`);
    
    // Detalhes das recargas
    const detailResult = await client.query(`
      SELECT 
        t.description,
        COUNT(*) as count,
        COALESCE(SUM(t.amount), 0) as total
      FROM dashboard.transactions t
      WHERE t.type = 'CREDIT'
        AND LOWER(t.description) LIKE '%recarga%'
        AND t."driverId" IN (
          SELECT DISTINCT "driverId"
          FROM dashboard.rides
          WHERE LOWER(city) = LOWER('Paranaíta')
            AND status = 'Concluída'
            AND "drivedId" IS NOT NULL
        )
      GROUP BY t.description
      ORDER BY total DESC
    `);
    
    console.log('📋 Detalhes das Recargas:');
    detailResult.rows.forEach(row => {
      console.log(`  "${row.description}": ${row.count} x R$ ${(parseFloat(row.total) / row.count).toFixed(2)} = R$ ${parseFloat(row.total).toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkTransactions();

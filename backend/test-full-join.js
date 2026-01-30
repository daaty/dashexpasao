const { Pool } = require('pg');

const pool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function testFixedQuery() {
  try {
    console.log('🔍 Testando query corrigida com FULL OUTER JOIN...\n');
    
    // Testar para Paranaita (que só tem recargas, sem corridas em Jan/2026)
    const cityName = 'Paranaita';
    
    const query = `
      WITH monthly_rides AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', r."arrivedTimestamp"), 'YYYY-MM') as month,
          EXTRACT(YEAR FROM DATE_TRUNC('month', r."arrivedTimestamp")) as year,
          EXTRACT(MONTH FROM DATE_TRUNC('month', r."arrivedTimestamp")) as month_number,
          DATE_TRUNC('month', r."arrivedTimestamp") as month_start,
          COUNT(DISTINCT r.id) as rides,
          COUNT(DISTINCT DATE(r."arrivedTimestamp")) as unique_days,
          CASE WHEN COUNT(r.price) > 0 THEN AVG(r.price) ELSE 0 END as average_value
        FROM dashboard.rides r
        WHERE LOWER(r.city) = LOWER($1)
          AND r."arrivedTimestamp" IS NOT NULL
          AND r.status = 'Concluída'
        GROUP BY DATE_TRUNC('month', r."arrivedTimestamp")
      ),
      monthly_revenue AS (
        SELECT 
          DATE_TRUNC('month', t."createdAt") as month_start,
          COALESCE(SUM(t.quantity), 0) as revenue
        FROM dashboard.transactions t
        WHERE t.type = 'CREDIT'
          AND LOWER(t.description) LIKE '%recarga%'
          AND LOWER(t.city) = LOWER($1)
        GROUP BY DATE_TRUNC('month', t."createdAt")
      )
      SELECT 
        COALESCE(mr.month, TO_CHAR(rev.month_start, 'YYYY-MM')) as month,
        COALESCE(mr.year, EXTRACT(YEAR FROM rev.month_start)) as year,
        COALESCE(mr.month_number, EXTRACT(MONTH FROM rev.month_start)) as month_number,
        COALESCE(mr.rides, 0) as rides,
        COALESCE(rev.revenue, 0) as revenue,
        COALESCE(mr.average_value, 0) as average_value,
        COALESCE(mr.unique_days, 0) as unique_days
      FROM monthly_rides mr
      FULL OUTER JOIN monthly_revenue rev ON mr.month_start = rev.month_start
      WHERE COALESCE(mr.month, TO_CHAR(rev.month_start, 'YYYY-MM')) = '2026-01'
      ORDER BY COALESCE(mr.month, TO_CHAR(rev.month_start, 'YYYY-MM')) DESC
    `;
    
    const result = await pool.query(query, [cityName]);
    
    console.log(`📊 Resultado para ${cityName}:`);
    if (result.rows.length > 0) {
      const data = result.rows[0];
      console.log(`✅ Janeiro 2026: ${data.rides} corridas + R$ ${parseFloat(data.revenue).toFixed(2)} receita`);
    } else {
      console.log(`❌ Nenhum dado encontrado`);
    }
    
    // Agora testar o bloco completo
    console.log('\n💰 TESTANDO BLOCO COMPLETO:');
    const cities = ['Nova Bandeirantes', 'Paranaita'];
    let totalRevenue = 0;
    let totalRides = 0;
    
    for (const city of cities) {
      const cityResult = await pool.query(query, [city]);
      
      if (cityResult.rows.length > 0) {
        const data = cityResult.rows[0];
        console.log(`${city}: ${data.rides} corridas + R$ ${parseFloat(data.revenue).toFixed(2)}`);
        totalRides += parseInt(data.rides) || 0;
        totalRevenue += parseFloat(data.revenue) || 0;
      } else {
        console.log(`${city}: Sem dados`);
      }
    }
    
    console.log(`\n🎯 RESULTADO FINAL:`);
    console.log(`Total: ${totalRides} corridas + R$ ${totalRevenue.toFixed(2)} = ${(totalRevenue / 1000).toFixed(1)}k`);
    console.log(`Esperado: R$ 2.127,50 = 2.1k`);
    
    if (Math.abs(totalRevenue - 2127.50) < 10) {
      console.log(`✅ PERFEITO! Agora o frontend deve mostrar R$ 2.1k`);
    } else {
      console.log(`❌ Ainda há diferença: R$ ${Math.abs(totalRevenue - 2127.50).toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testFixedQuery();
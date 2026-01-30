const { Pool } = require('pg');

const pool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function testExactAPIResponse() {
  try {
    console.log('🔍 Testando exatamente como a API responds para o frontend...\n');
    
    // Simular o query exato do backend para Nova Monte Verde
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
        WHERE LOWER(r.city) IN ('nova monte verde')
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
          AND LOWER(t.city) IN ('nova monte verde')
        GROUP BY DATE_TRUNC('month', t."createdAt")
      )
      SELECT 
        mr.month,
        mr.year,
        mr.month_number,
        mr.rides,
        COALESCE(rev.revenue, 0) as revenue,
        mr.average_value,
        mr.unique_days
      FROM monthly_rides mr
      LEFT JOIN monthly_revenue rev ON mr.month_start = rev.month_start
      ORDER BY mr.month DESC
      LIMIT 6
    `;
    
    const result = await pool.query(query);
    
    console.log('📊 API Response for Nova Monte Verde:');
    console.log('====================================');
    result.rows.forEach(row => {
      console.log(`${row.month}: ${row.rides} corridas, R$ ${parseFloat(row.revenue).toFixed(2)} receita`);
    });
    
    // Fazer o mesmo para Nova Bandeirantes
    const queryNB = query.replace(/nova monte verde/g, 'nova bandeirantes');
    const resultNB = await pool.query(queryNB);
    
    console.log('\n📊 API Response for Nova Bandeirantes:');
    console.log('=====================================');
    resultNB.rows.forEach(row => {
      console.log(`${row.month}: ${row.rides} corridas, R$ ${parseFloat(row.revenue).toFixed(2)} receita`);
    });
    
    // Calcular total do mês atual como o frontend faz
    const jan2026NMV = result.rows.find(r => r.month === '2026-01');
    const jan2026NB = resultNB.rows.find(r => r.month === '2026-01');
    
    let totalRevenue = 0;
    let totalRides = 0;
    
    if (jan2026NMV) {
      totalRevenue += parseFloat(jan2026NMV.revenue);
      totalRides += parseInt(jan2026NMV.rides);
      console.log(`\n✅ Nova Monte Verde Jan/26: ${jan2026NMV.rides} corridas, R$ ${parseFloat(jan2026NMV.revenue).toFixed(2)}`);
    }
    
    if (jan2026NB) {
      totalRevenue += parseFloat(jan2026NB.revenue);
      totalRides += parseInt(jan2026NB.rides);
      console.log(`✅ Nova Bandeirantes Jan/26: ${jan2026NB.rides} corridas, R$ ${parseFloat(jan2026NB.revenue).toFixed(2)}`);
    }
    
    console.log(`\n💰 TOTAL COMO O FRONTEND VÊ:`);
    console.log(`Corridas: ${totalRides}`);
    console.log(`Receita: R$ ${totalRevenue.toFixed(2)} = ${(totalRevenue / 1000).toFixed(1)}k`);
    
    // Verificar se está próximo de 1.7k
    if (Math.abs(totalRevenue - 1700) < 200) {
      console.log('🎯 CONFIRMADO! Este é o valor que causa R$ 1.7k');
    } else {
      console.log(`❌ Ainda não explica R$ 1.7k. Diferença: ${Math.abs(totalRevenue - 1700).toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testExactAPIResponse();
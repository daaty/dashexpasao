const { Pool } = require('pg');

const pool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function testFix() {
  try {
    console.log('🔧 Testando a correção...\n');
    
    // Simular exatamente o que o backend corrigido faria
    const cityVariations = ['nova monte verde', 'nova bandeirantes'];
    
    const query = `
      WITH monthly_rides AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', r."arrivedTimestamp"), 'YYYY-MM') as month,
          EXTRACT(YEAR FROM DATE_TRUNC('month', r."arrivedTimestamp")) as year,
          EXTRACT(MONTH FROM DATE_TRUNC('month', r."arrivedTimestamp")) as month_number,
          DATE_TRUNC('month', r."arrivedTimestamp") as month_start,
          COUNT(DISTINCT r.id) as rides
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
        COALESCE(rev.revenue, 0) as revenue
      FROM monthly_rides mr
      LEFT JOIN monthly_revenue rev ON mr.month_start = rev.month_start
      WHERE mr.month = '2026-01'
    `;
    
    const nmvResult = await pool.query(query);
    
    const queryNB = query.replace(/nova monte verde/g, 'nova bandeirantes');
    const nbResult = await pool.query(queryNB);
    
    console.log('✅ Nova Monte Verde Janeiro 2026:');
    console.log(nmvResult.rows[0] || 'Nenhum dado');
    
    console.log('\n✅ Nova Bandeirantes Janeiro 2026:');
    console.log(nbResult.rows[0] || 'Nenhum dado');
    
    // Somar total como o frontend faria
    let totalRevenue = 0;
    let totalRides = 0;
    
    if (nmvResult.rows.length > 0) {
      totalRevenue += parseFloat(nmvResult.rows[0].revenue);
      totalRides += parseInt(nmvResult.rows[0].rides);
    }
    
    if (nbResult.rows.length > 0) {
      totalRevenue += parseFloat(nbResult.rows[0].revenue);
      totalRides += parseInt(nbResult.rows[0].rides);
    }
    
    console.log('\n💰 TOTAL ESPERADO NO FRONTEND:');
    console.log(`Corridas: ${totalRides}`);
    console.log(`Receita: R$ ${totalRevenue.toFixed(2)} = ${(totalRevenue / 1000).toFixed(1)}k`);
    
    if (Math.abs(totalRevenue / 1000 - 7.2) < 0.1) {
      console.log('🎯 PERFEITO! Agora deve mostrar R$ 7.2k em vez de R$ 1.7k');
    } else {
      console.log(`⚠️ Ainda não está certo. Esperado: ~7.2k, Calculado: ${(totalRevenue / 1000).toFixed(1)}k`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testFix();
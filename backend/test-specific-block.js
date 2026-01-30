const { Pool } = require('pg');

const pool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function testSpecificBlock() {
  try {
    console.log('🔍 Testando bloco Nova Bandeirantes + Paranaíta...\n');
    
    // Simular exatamente o que a API deve retornar para o bloco
    const cities = ['Nova Bandeirantes', 'Paranaita'];
    let totalRevenue = 0;
    let totalRides = 0;
    
    for (const cityName of cities) {
      // Query exata do backend corrigido
      const query = `
        WITH monthly_rides AS (
          SELECT 
            TO_CHAR(DATE_TRUNC('month', r."arrivedTimestamp"), 'YYYY-MM') as month,
            EXTRACT(YEAR FROM DATE_TRUNC('month', r."arrivedTimestamp")) as year,
            EXTRACT(MONTH FROM DATE_TRUNC('month', r."arrivedTimestamp")) as month_number,
            DATE_TRUNC('month', r."arrivedTimestamp") as month_start,
            COUNT(DISTINCT r.id) as rides
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
          mr.month,
          mr.year,
          mr.month_number,
          mr.rides,
          COALESCE(rev.revenue, 0) as revenue
        FROM monthly_rides mr
        LEFT JOIN monthly_revenue rev ON mr.month_start = rev.month_start
        WHERE mr.month = '2026-01'
        ORDER BY mr.month DESC
      `;
      
      const result = await pool.query(query, [cityName]);
      
      if (result.rows.length > 0) {
        const data = result.rows[0];
        console.log(`✅ ${cityName}: ${data.rides} corridas + R$ ${parseFloat(data.revenue).toFixed(2)}`);
        totalRides += parseInt(data.rides);
        totalRevenue += parseFloat(data.revenue);
      } else {
        console.log(`❌ ${cityName}: Nenhum dado encontrado`);
      }
    }
    
    console.log(`\n💰 TOTAL DO BLOCO:`);
    console.log(`Corridas: ${totalRides}`);
    console.log(`Receita: R$ ${totalRevenue.toFixed(2)} = ${(totalRevenue / 1000).toFixed(1)}k`);
    
    // Verificar contra os dados esperados
    console.log(`\n🎯 COMPARAÇÃO:`);
    console.log(`Esperado: R$ 2.127,50 = 2.1k`);
    console.log(`Atual: R$ ${totalRevenue.toFixed(2)} = ${(totalRevenue / 1000).toFixed(1)}k`);
    
    if (Math.abs(totalRevenue - 2127.50) < 50) {
      console.log(`✅ CORRETO! O valor está próximo do esperado.`);
    } else {
      console.log(`❌ PROBLEMA: Diferença de R$ ${Math.abs(totalRevenue - 2127.50).toFixed(2)}`);
    }
    
    // Verificar dados de recargas direto para confirmação
    console.log(`\n📊 VERIFICAÇÃO DIRETA DAS RECARGAS:`);
    const directQuery = `
      SELECT 
        city,
        COUNT(*) as amount_sum,
        SUM(quantity) as total_reais
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description = 'recarga'
        AND DATE_PART('year', "createdAt") = 2026
        AND DATE_PART('month', "createdAt") = 1
        AND LOWER(city) IN ('nova bandeirantes', 'paranaita')
      GROUP BY city
    `;
    
    const directResult = await pool.query(directQuery);
    let directTotal = 0;
    let directCredits = 0;
    
    directResult.rows.forEach(row => {
      directTotal += parseFloat(row.total_reais);
      directCredits += parseInt(row.amount_sum);
      console.log(`${row.city}: ${row.amount_sum} recargas = R$ ${parseFloat(row.total_reais).toFixed(2)}`);
    });
    
    console.log(`📋 Total direto: ${directCredits} recargas = R$ ${directTotal.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testSpecificBlock();
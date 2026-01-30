const { Pool } = require('pg');

const n8nPool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function testApiResponse() {
  try {
    console.log('🔍 Testando como a API de rides funciona...\n');
    
    // Simular exatamente como a API do frontend funciona
    const testCities = ['Nova Monte Verde', 'Nova Bandeirantes', 'Paranaita'];
    
    for (const cityName of testCities) {
      console.log(`\n🏙️ TESTANDO API PARA: ${cityName}`);
      console.log('=====================================');
      
      // 1. Testar getMonthlyRidesByCity (como usado no frontend)
      const monthlyQuery = `
        SELECT 
          TO_CHAR(DATE(r."arrivedTimestamp"), 'YYYY-MM') as month,
          DATE_PART('year', r."arrivedTimestamp") as year,
          DATE_PART('month', r."arrivedTimestamp") as monthNumber,
          COUNT(DISTINCT r.id) as rides,
          COALESCE(SUM(r.price), 0) as revenue,
          AVG(r.price) as averageValue,
          COUNT(DISTINCT DATE(r."arrivedTimestamp")) as uniqueDays
        FROM dashboard.rides r
        WHERE LOWER(r.city) SIMILAR TO '%${cityName.toLowerCase()}%'
          AND r."arrivedTimestamp" IS NOT NULL
          AND r.status = 'Concluída'
          AND r."arrivedTimestamp" >= NOW() - INTERVAL '13 months'
        GROUP BY 
          TO_CHAR(DATE(r."arrivedTimestamp"), 'YYYY-MM'),
          DATE_PART('year', r."arrivedTimestamp"),
          DATE_PART('month', r."arrivedTimestamp")
        ORDER BY year DESC, monthNumber DESC
        LIMIT 13
      `;
      
      const result = await n8nPool.query(monthlyQuery);
      
      console.log('📊 Dados Mensais (últimos 13 meses):');
      result.rows.forEach(row => {
        console.log(`${row.month}: ${row.rides} corridas = R$ ${parseFloat(row.revenue).toFixed(2)}`);
      });
      
      // 2. Verificar dados específicos de Janeiro 2026
      const jan2026 = result.rows.find(row => row.month === '2026-01');
      if (jan2026) {
        console.log(`\n⭐ JANEIRO 2026: ${jan2026.rides} corridas = R$ ${parseFloat(jan2026.revenue).toFixed(2)}`);
      } else {
        console.log('\n❌ Não encontrou dados para Janeiro 2026');
      }
      
      // 3. Verificar se o nome da cidade está sendo encontrado corretamente
      const exactMatch = await n8nPool.query(`
        SELECT DISTINCT city 
        FROM dashboard.rides 
        WHERE LOWER(city) SIMILAR TO '%${cityName.toLowerCase()}%'
        LIMIT 5
      `);
      
      console.log('🏷️ Nomes encontrados no banco:', exactMatch.rows.map(r => r.city).join(', '));
    }

    // 4. Verificar qual é a soma total que deveria aparecer
    console.log('\n💰 SOMA TOTAL DO MÊS ATUAL (Janeiro 2026):');
    console.log('===========================================');
    
    const totalQuery = `
      SELECT 
        SUM(rides_revenue) as total_rides_revenue,
        SUM(recargas_revenue) as total_recargas_revenue
      FROM (
        SELECT 
          0 as rides_revenue,
          SUM(t.quantity) as recargas_revenue
        FROM dashboard.transactions t
        WHERE t.type = 'CREDIT' 
          AND t.description = 'recarga'
          AND DATE_PART('year', t."createdAt") = 2026
          AND DATE_PART('month', t."createdAt") = 1
          AND t.city IN ('Nova Monte Verde', 'Nova Bandeirantes', 'Paranaita')
        
        UNION ALL
        
        SELECT 
          SUM(r.price) as rides_revenue,
          0 as recargas_revenue
        FROM dashboard.rides r
        WHERE r."arrivedTimestamp" IS NOT NULL
          AND r.status = 'Concluída'
          AND DATE_PART('year', r."arrivedTimestamp") = 2026
          AND DATE_PART('month', r."arrivedTimestamp") = 1
          AND r.city IN ('Nova Monte Verde', 'Nova Bandeirantes', 'Paranaita')
      ) combined
    `;
    
    const totalResult = await n8nPool.query(totalQuery);
    const data = totalResult.rows[0];
    
    console.log(`Receita de corridas: R$ ${parseFloat(data.total_rides_revenue || 0).toFixed(2)}`);
    console.log(`Receita de recargas: R$ ${parseFloat(data.total_recargas_revenue || 0).toFixed(2)}`);
    console.log(`TOTAL: R$ ${(parseFloat(data.total_rides_revenue || 0) + parseFloat(data.total_recargas_revenue || 0)).toFixed(2)}`);
    
    // 5. Verificar se há inconsistências nos nomes das cidades
    console.log('\n🔍 VERIFICANDO INCONSISTÊNCIAS NOS NOMES:');
    console.log('========================================');
    
    const cityVariations = await n8nPool.query(`
      SELECT DISTINCT r.city, COUNT(*) as ride_count
      FROM dashboard.rides r
      WHERE DATE_PART('year', r."arrivedTimestamp") = 2026
        AND DATE_PART('month', r."arrivedTimestamp") = 1
      GROUP BY r.city
      ORDER BY ride_count DESC
    `);
    
    console.log('Cidades na tabela rides (Janeiro 2026):');
    cityVariations.rows.forEach(row => {
      console.log(`- "${row.city}": ${row.ride_count} corridas`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await n8nPool.end();
    process.exit(0);
  }
}

testApiResponse();
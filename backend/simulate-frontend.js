const { Pool } = require('pg');

const n8nPool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

// Simular exatamente como ridesService.ts funciona
function matchCityName(cityName) {
  const normalized = cityName.toLowerCase().trim();
  return [
    normalized,
    normalized.replace(/[áàâã]/g, 'a').replace(/[éê]/g, 'e').replace(/[íî]/g, 'i').replace(/[óôõ]/g, 'o').replace(/[úû]/g, 'u').replace(/[ç]/g, 'c'),
    normalized.replace(/[^a-z\s]/g, ''),
    normalized.replace(/\s+/g, ''),
  ];
}

async function simulateFrontendCalculation() {
  try {
    console.log('🔍 Simulando EXATAMENTE como o frontend calcula...\n');
    
    const testCities = ['Nova Monte Verde', 'Nova Bandeirantes', 'Paranaita'];
    
    // Simular o que o componente MarketIntelligence.tsx faz
    let totalCurrentMonthRevenue = 0;
    let totalCurrentMonthRides = 0;
    
    for (const cityName of testCities) {
      console.log(`\n🏙️ PROCESSANDO: ${cityName}`);
      console.log('==============================');
      
      // 1. Usar getMonthlyRidesByCity exatamente como o frontend
      const cityVariations = matchCityName(cityName);
      const placeholders = cityVariations.map((_, i) => `$${i + 1}`).join(', ');
      
      console.log(`🔍 Variações do nome: ${cityVariations.join(', ')}`);
      
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
        WHERE LOWER(r.city) IN (${placeholders})
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
      
      const result = await n8nPool.query(monthlyQuery, cityVariations);
      
      // 2. Agrupar por mês (como o frontend faz)
      const monthlyTotals = {};
      
      result.rows.forEach(row => {
        const monthKey = `${row.year}-${String(row.monthNumber).padStart(2, '0')}`;
        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = { rides: 0, revenue: 0 };
        }
        monthlyTotals[monthKey].rides += parseInt(row.rides);
        monthlyTotals[monthKey].revenue += parseFloat(row.revenue);
      });
      
      // 3. Dados do mês atual (2026-01)
      const currentMonthKey = '2026-01';
      const cityCurrentMonthData = monthlyTotals[currentMonthKey];
      
      if (cityCurrentMonthData) {
        console.log(`✅ Janeiro 2026: ${cityCurrentMonthData.rides} corridas = R$ ${cityCurrentMonthData.revenue.toFixed(2)}`);
        totalCurrentMonthRides += cityCurrentMonthData.rides;
        totalCurrentMonthRevenue += cityCurrentMonthData.revenue;
      } else {
        console.log('❌ Não encontrou dados para Janeiro 2026');
      }
      
      console.log(`📊 Todos os meses encontrados:`, Object.keys(monthlyTotals));
    }
    
    console.log('\n💰 TOTAL DO BLOCO (como aparece no frontend):');
    console.log('=============================================');
    console.log(`Corridas: ${totalCurrentMonthRides}`);
    console.log(`Receita: R$ ${totalCurrentMonthRevenue.toFixed(2)} = ${(totalCurrentMonthRevenue / 1000).toFixed(1)}k`);
    
    // Verificar se R$ 1.7k corresponde a alguma parte
    console.log('\n🎯 VERIFICANDO R$ 1.7k:');
    console.log('=======================');
    if (Math.abs(totalCurrentMonthRevenue - 1700) < 100) {
      console.log('✅ ENCONTRADO! O valor bate com R$ 1.7k');
    } else {
      console.log(`❌ Diferença: R$ ${totalCurrentMonthRevenue.toFixed(2)} vs R$ 1700 esperado`);
      
      // Verificar se 1.7k pode ser uma parte
      const possibleSources = [
        { name: 'Nova Bandeirantes apenas', value: 3641.73 },
        { name: 'Paranaita apenas (se encontrado)', value: 0 },
        { name: '20% do total', value: totalCurrentMonthRevenue * 0.2 },
        { name: 'Diferença de cálculo', value: totalCurrentMonthRevenue / 10 }
      ];
      
      possibleSources.forEach(source => {
        if (Math.abs(source.value - 1700) < 100) {
          console.log(`✅ POSSÍVEL CAUSA: ${source.name} = R$ ${source.value.toFixed(2)}`);
        }
      });
    }

    // Verificar se existe algum filtro adicional
    console.log('\n🔍 VERIFICANDO FILTROS ADICIONAIS:');
    console.log('=================================');
    
    // Dados de recargas para comparação
    const recargasQuery = `
      SELECT 
        city,
        SUM(quantity) as receita_recargas
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description = 'recarga'
        AND DATE_PART('year', "createdAt") = 2026
        AND DATE_PART('month', "createdAt") = 1
        AND LOWER(city) IN ($1, $2, $3)
      GROUP BY city
    `;
    
    const recargasResult = await n8nPool.query(recargasQuery, testCities.map(c => c.toLowerCase()));
    
    console.log('💳 Recargas do mesmo período:');
    let totalRecargas = 0;
    recargasResult.rows.forEach(row => {
      totalRecargas += parseFloat(row.receita_recargas);
      console.log(`${row.city}: R$ ${parseFloat(row.receita_recargas).toFixed(2)}`);
    });
    
    console.log(`💰 Total recargas: R$ ${totalRecargas.toFixed(2)} = ${(totalRecargas / 1000).toFixed(1)}k`);
    
    if (Math.abs(totalRecargas / 1000 - 1.7) < 0.1) {
      console.log('🎯 BINGO! R$ 1.7k pode vir das recargas dividido por algum fator!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await n8nPool.end();
    process.exit(0);
  }
}

simulateFrontendCalculation();
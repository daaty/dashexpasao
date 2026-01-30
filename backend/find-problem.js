const { Pool } = require('pg');

const n8nPool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function checkFinalCalculation() {
  try {
    console.log('🔍 ENCONTRANDO O PROBLEMA DOS R$ 1.7k...\n');
    
    // Testar exatamente como o backend real funciona
    const testCities = ['Nova Monte Verde', 'Nova Bandeirantes', 'Paranaita'];
    
    let totalCurrentMonthRevenue = 0;
    
    for (const cityName of testCities) {
      console.log(`\n🏙️ ${cityName}`);
      console.log('=================');
      
      // Query corrigida (sem o campo problemático)
      const monthlyQuery = `
        SELECT 
          EXTRACT(year FROM r."arrivedTimestamp") as year,
          EXTRACT(month FROM r."arrivedTimestamp") as month_number,
          COUNT(DISTINCT r.id) as rides,
          COALESCE(SUM(r.price), 0) as revenue
        FROM dashboard.rides r
        WHERE LOWER(r.city) = LOWER($1)
          AND r."arrivedTimestamp" IS NOT NULL
          AND r.status = 'Concluída'
          AND EXTRACT(year FROM r."arrivedTimestamp") = 2026
          AND EXTRACT(month FROM r."arrivedTimestamp") = 1
        GROUP BY 
          EXTRACT(year FROM r."arrivedTimestamp"),
          EXTRACT(month FROM r."arrivedTimestamp")
      `;
      
      const result = await n8nPool.query(monthlyQuery, [cityName]);
      
      if (result.rows.length > 0) {
        const data = result.rows[0];
        console.log(`✅ ${data.rides} corridas = R$ ${parseFloat(data.revenue).toFixed(2)}`);
        totalCurrentMonthRevenue += parseFloat(data.revenue);
      } else {
        console.log('❌ Nenhum dado encontrado');
      }
    }
    
    console.log(`\n💰 TOTAL RECEITA: R$ ${totalCurrentMonthRevenue.toFixed(2)} = ${(totalCurrentMonthRevenue / 1000).toFixed(1)}k`);
    
    // Verificar as possíveis causas do R$ 1.7k
    console.log('\n🎯 POSSÍVEIS CAUSAS DO R$ 1.7k:');
    console.log('===============================');
    
    // 1. Verificar se é apenas uma fração do total
    const fractions = [0.1, 0.15, 0.2, 0.25, 0.3];
    fractions.forEach(fraction => {
      const result = totalCurrentMonthRevenue * fraction;
      if (Math.abs(result - 1700) < 200) {
        console.log(`✅ ${(fraction * 100)}% do total = R$ ${result.toFixed(2)} ≈ R$ 1.7k`);
      }
    });
    
    // 2. Verificar uma cidade específica
    const novaBandeirantes = await n8nPool.query(`
      SELECT COALESCE(SUM(r.price), 0) as revenue
      FROM dashboard.rides r
      WHERE LOWER(r.city) = 'nova bandeirantes'
        AND r."arrivedTimestamp" IS NOT NULL
        AND r.status = 'Concluída'
        AND EXTRACT(year FROM r."arrivedTimestamp") = 2026
        AND EXTRACT(month FROM r."arrivedTimestamp") = 1
    `);
    
    const nbRevenue = parseFloat(novaBandeirantes.rows[0].revenue);
    console.log(`Nova Bandeirantes apenas: R$ ${nbRevenue.toFixed(2)}`);
    
    if (Math.abs(nbRevenue / 2 - 1700) < 200) {
      console.log(`✅ Nova Bandeirantes ÷ 2 = R$ ${(nbRevenue / 2).toFixed(2)} ≈ R$ 1.7k`);
    }
    
    // 3. Verificar se há algum filtro ou cálculo diferente no frontend
    console.log('\n📊 RESUMO DOS DADOS REAIS:');
    console.log('==========================');
    console.log(`Total de receita de corridas jan/26: R$ ${totalCurrentMonthRevenue.toFixed(2)}`);
    console.log(`Total de recargas jan/26: R$ 7705.00 (já confirmado)`);
    console.log(`Exibido no frontend: R$ 1.7k`);
    
    // 4. Verificar se pode ser um erro de conversão de unidade
    const possibleSources = [
      { name: 'Recargas apenas NB+Paranaita', value: 1620 + 507.5 },
      { name: '25% das corridas de NB', value: nbRevenue * 0.25 },
      { name: 'Erro de divisão por 1000', value: totalCurrentMonthRevenue / 10 }
    ];
    
    possibleSources.forEach(source => {
      if (Math.abs(source.value - 1700) < 100) {
        console.log(`🎯 BINGO! ${source.name} = R$ ${source.value.toFixed(2)}`);
      }
    });

    // 5. Verificar dados específicos que podem estar sendo usados incorretamente
    console.log('\n🔧 VERIFICANDO LÓGICA DO SISTEMA:');
    console.log('=================================');
    
    // O sistema pode estar usando recargas de NB + Paranaita
    const revenueNBP = 1620 + 507.5; // Nova Bandeirantes + Paranaita recargas
    if (Math.abs(revenueNBP - 1700) < 200) {
      console.log(`🎯 ENCONTRADO! Recargas de NB (${1620}) + Paranaita (${507.5}) = ${revenueNBP} ≈ 1700`);
      console.log('💡 CAUSA: O sistema pode estar somando apenas essas duas cidades!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await n8nPool.end();
    process.exit(0);
  }
}

checkFinalCalculation();
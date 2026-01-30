const { Pool } = require('pg');

const n8nPool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function checkCurrentMonthCalculation() {
  try {
    console.log('🔍 Verificando cálculo do mês atual na página de inteligência...\n');
    
    // Data atual
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    console.log(`📅 Mês Atual: ${currentMonthKey} (Janeiro 2026)`);
    
    // 1. Verificar dados reais de CORRIDAS (tabela rides) no mês atual
    const ridesQuery = `
      SELECT 
        r.city,
        COUNT(DISTINCT r.id) as rides,
        COALESCE(SUM(r.price), 0) as revenue_from_rides
      FROM dashboard.rides r
      WHERE r."arrivedTimestamp" IS NOT NULL
        AND r.status = 'Concluída'
        AND DATE_PART('year', r."arrivedTimestamp") = ${currentYear}
        AND DATE_PART('month', r."arrivedTimestamp") = ${currentMonth}
      GROUP BY r.city
      ORDER BY revenue_from_rides DESC
    `;
    
    const ridesResult = await n8nPool.query(ridesQuery);
    
    console.log('\n📊 RECEITA DO MÊS ATUAL (de corridas concluídas):');
    console.log('================================================');
    let totalRidesRevenue = 0;
    ridesResult.rows.forEach(row => {
      const revenue = parseFloat(row.revenue_from_rides || 0);
      totalRidesRevenue += revenue;
      console.log(`${row.city}: ${row.rides} corridas = R$ ${revenue.toFixed(2)}`);
    });
    console.log(`\n💰 TOTAL RECEITA (corridas): R$ ${totalRidesRevenue.toFixed(2)}`);

    // 2. Verificar dados de RECARGAS no mês atual
    const recargas = await n8nPool.query(`
      SELECT 
        city,
        COUNT(*) as recargas,
        SUM(quantity) as valor_recargas
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description = 'recarga'
        AND DATE_PART('year', "createdAt") = ${currentYear}
        AND DATE_PART('month', "createdAt") = ${currentMonth}
      GROUP BY city
      ORDER BY valor_recargas DESC
    `);
    
    console.log('\n💳 RECARGAS DO MÊS ATUAL:');
    console.log('=========================');
    let totalRecargas = 0;
    recargas.rows.forEach(row => {
      const valor = parseFloat(row.valor_recargas || 0);
      totalRecargas += valor;
      console.log(`${row.city || 'Sem cidade'}: ${row.recargas} recargas = R$ ${valor.toFixed(2)}`);
    });
    console.log(`\n💰 TOTAL RECARGAS: R$ ${totalRecargas.toFixed(2)}`);
    
    // 3. Verificar cidades específicas que aparecem no sistema
    const testCities = ['Nova Monte Verde', 'Nova Bandeirantes', 'Paranaita'];
    
    for (const cityName of testCities) {
      console.log(`\n🏙️ ANÁLISE DETALHADA: ${cityName}`);
      console.log('=====================================');
      
      // Corridas da cidade no mês atual
      const cityRides = await n8nPool.query(`
        SELECT 
          COUNT(DISTINCT r.id) as rides,
          COALESCE(SUM(r.price), 0) as revenue
        FROM dashboard.rides r
        WHERE LOWER(r.city) = LOWER($1)
          AND r."arrivedTimestamp" IS NOT NULL
          AND r.status = 'Concluída'
          AND DATE_PART('year', r."arrivedTimestamp") = ${currentYear}
          AND DATE_PART('month', r."arrivedTimestamp") = ${currentMonth}
      `, [cityName]);
      
      // Recargas da cidade no mês atual
      const cityRecargas = await n8nPool.query(`
        SELECT 
          COUNT(*) as recargas,
          SUM(quantity) as valor
        FROM dashboard.transactions 
        WHERE LOWER(city) = LOWER($1)
          AND type = 'CREDIT' 
          AND description = 'recarga'
          AND DATE_PART('year', "createdAt") = ${currentYear}
          AND DATE_PART('month', "createdAt") = ${currentMonth}
      `, [cityName]);
      
      const rideData = cityRides.rows[0];
      const recargaData = cityRecargas.rows[0];
      
      console.log(`🚗 Corridas: ${rideData.rides} = R$ ${parseFloat(rideData.revenue).toFixed(2)}`);
      console.log(`💳 Recargas: ${recargaData.recargas} = R$ ${parseFloat(recargaData.valor).toFixed(2)}`);
      console.log(`📊 TOTAL CIDADE: R$ ${(parseFloat(rideData.revenue) + parseFloat(recargaData.valor)).toFixed(2)}`);
    }
    
    // 4. Qual campo o sistema deveria estar usando?
    console.log('\n❓ QUAL RECEITA O SISTEMA USA?');
    console.log('==============================');
    console.log('O sistema pode estar usando:');
    console.log(`1. Receita de corridas (price): R$ ${totalRidesRevenue.toFixed(2)}`);
    console.log(`2. Receita de recargas (quantity): R$ ${totalRecargas.toFixed(2)}`);
    console.log('3. A receita exibida (R$ 1.7k) pode ser de apenas algumas cidades do bloco');
    
    console.log('\n🎯 VERIFICAÇÃO R$ 1.700:');
    console.log('=========================');
    console.log('Buscando combinações que resultem em ~R$ 1.700...');
    
    // Nova Monte Verde individual
    const nmv = await n8nPool.query(`
      SELECT 
        SUM(quantity) as valor_recargas
      FROM dashboard.transactions 
      WHERE LOWER(city) = 'nova monte verde'
        AND type = 'CREDIT' 
        AND description = 'recarga'
        AND DATE_PART('year', "createdAt") = ${currentYear}
        AND DATE_PART('month', "createdAt") = ${currentMonth}
    `);
    
    console.log(`Nova Monte Verde: R$ ${parseFloat(nmv.rows[0].valor_recargas || 0).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await n8nPool.end();
    process.exit(0);
  }
}

checkCurrentMonthCalculation();
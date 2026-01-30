const { Pool } = require('pg');

const n8nPool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function findUserData() {
  try {
    console.log('🔍 Procurando combinação que resulte em R$ 2070 e 828 créditos...\n');
    
    // 1. Verificar por cidade específica
    const cityResult = await n8nPool.query(`
      SELECT 
        city,
        SUM(amount) as total_creditos,
        SUM(quantity) as total_reais
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description = 'recarga'
        AND "createdAt" >= '2026-01-01'
        AND "createdAt" < '2026-02-01'
        AND city IS NOT NULL
      GROUP BY city
      ORDER BY total_reais DESC
    `);
    
    console.log('📊 VERIFICANDO CIDADES INDIVIDUALMENTE:');
    cityResult.rows.forEach(city => {
      if (Math.abs(parseFloat(city.total_reais) - 2070) < 100 || Math.abs(parseFloat(city.total_creditos) - 828) < 100) {
        console.log(`⭐ CANDIDATO: ${city.city}: ${city.total_creditos} créditos = R$ ${parseFloat(city.total_reais).toFixed(2)}`);
      }
    });

    // 2. Verificar período específico (primeira quinzena, segunda quinzena)
    const firstHalf = await n8nPool.query(`
      SELECT 
        SUM(amount) as total_creditos,
        SUM(quantity) as total_reais,
        COUNT(*) as transacoes
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description = 'recarga'
        AND "createdAt" >= '2026-01-01'
        AND "createdAt" < '2026-01-16'
    `);
    
    const secondHalf = await n8nPool.query(`
      SELECT 
        SUM(amount) as total_creditos,
        SUM(quantity) as total_reais,
        COUNT(*) as transacoes
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description = 'recarga'
        AND "createdAt" >= '2026-01-16'
        AND "createdAt" < '2026-02-01'
    `);

    console.log('\n📅 VERIFICANDO PERÍODOS:');
    const first = firstHalf.rows[0];
    const second = secondHalf.rows[0];
    
    console.log(`1ª quinzena (01-15 jan): ${first.total_creditos} créditos = R$ ${parseFloat(first.total_reais).toFixed(2)} (${first.transacoes} transações)`);
    console.log(`2ª quinzena (16-31 jan): ${second.total_creditos} créditos = R$ ${parseFloat(second.total_reais).toFixed(2)} (${second.transacoes} transações)`);

    // 3. Verificar possível combinação de cidades
    console.log('\n🔍 BUSCANDO COMBINAÇÕES PRÓXIMAS:');
    const combinations = [
      { name: 'Nova Bandeirantes + Paranaita', cities: ['Nova Bandeirantes', 'Paranaita'] },
      { name: 'Nova Monte Verde (parcial)', cities: ['Nova Monte Verde'] },
      { name: 'Todas exceto Nova Monte Verde', exclude: 'Nova Monte Verde' }
    ];

    for (const combo of combinations) {
      if (combo.cities) {
        const comboQuery = `
          SELECT 
            SUM(amount) as total_creditos,
            SUM(quantity) as total_reais
          FROM dashboard.transactions 
          WHERE type = 'CREDIT' 
            AND description = 'recarga'
            AND "createdAt" >= '2026-01-01'
            AND "createdAt" < '2026-02-01'
            AND city = ANY($1)
        `;
        const comboResult = await n8nPool.query(comboQuery, [combo.cities]);
        const data = comboResult.rows[0];
        console.log(`${combo.name}: ${data.total_creditos} créditos = R$ ${parseFloat(data.total_reais).toFixed(2)}`);
      }
    }

    // 4. Verificar se pode ser um subconjunto baseado em valor
    console.log('\n💰 BUSCANDO POR VALOR PRÓXIMO:');
    const valueFilter = await n8nPool.query(`
      SELECT 
        SUM(amount) as total_creditos,
        SUM(quantity) as total_reais,
        COUNT(*) as transacoes
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description = 'recarga'
        AND "createdAt" >= '2026-01-01'
        AND "createdAt" < '2026-02-01'
        AND quantity <= 50
    `);
    
    const valueData = valueFilter.rows[0];
    console.log(`Recargas até R$ 50: ${valueData.total_creditos} créditos = R$ ${parseFloat(valueData.total_reais).toFixed(2)} (${valueData.transacoes} transações)`);

    // 5. Verificar últimos dados de 2025 
    const dec2025 = await n8nPool.query(`
      SELECT 
        SUM(amount) as total_creditos,
        SUM(quantity) as total_reais,
        COUNT(*) as transacoes
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description = 'recarga'
        AND "createdAt" >= '2025-12-01'
        AND "createdAt" < '2026-01-01'
    `);
    
    if (dec2025.rows[0].transacoes > 0) {
      const decData = dec2025.rows[0];
      console.log(`\n📅 Dezembro 2025: ${decData.total_creditos} créditos = R$ ${parseFloat(decData.total_reais).toFixed(2)} (${decData.transacoes} transações)`);
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  } finally {
    await n8nPool.end();
    process.exit(0);
  }
}

findUserData();
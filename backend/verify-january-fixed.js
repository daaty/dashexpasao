const { Pool } = require('pg');

const n8nPool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function checkJanuaryData() {
  try {
    console.log('🔍 Verificando dados de JANEIRO 2026...\n');
    
    // Query usando "createdAt" (com aspas duplas para case-sensitive)
    const result = await n8nPool.query(`
      SELECT 
        COUNT(*) as total_recargas,
        SUM(quantity) as total_valor,
        MIN(quantity) as menor_valor,
        MAX(quantity) as maior_valor,
        AVG(quantity) as valor_medio,
        COUNT(DISTINCT city) as cidades_distintas
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description ILIKE '%recarga%'
        AND "createdAt" >= '2026-01-01'
        AND "createdAt" < '2026-02-01'
    `);
    
    const data = result.rows[0];
    console.log('📊 DADOS DE JANEIRO 2026 - CONFIRMAÇÃO:');
    console.log('==========================================');
    console.log(`💳 Total de Recargas: ${data.total_recargas} créditos`);
    console.log(`💰 Valor Total: R$ ${parseFloat(data.total_valor || 0).toFixed(2)}`);
    console.log(`📈 Valor Médio: R$ ${parseFloat(data.valor_medio || 0).toFixed(2)}`);
    console.log(`📉 Menor Recarga: R$ ${parseFloat(data.menor_valor || 0).toFixed(2)}`);
    console.log(`📈 Maior Recarga: R$ ${parseFloat(data.maior_valor || 0).toFixed(2)}`);
    console.log(`🏙️ Cidades Ativas: ${data.cidades_distintas}`);

    // Detalhamento por cidade
    const cityResult = await n8nPool.query(`
      SELECT 
        city,
        COUNT(*) as recargas,
        SUM(quantity) as valor_total
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description ILIKE '%recarga%'
        AND "createdAt" >= '2026-01-01'
        AND "createdAt" < '2026-02-01'
      GROUP BY city
      ORDER BY valor_total DESC
    `);
    
    console.log('\n🏙️ DETALHAMENTO POR CIDADE (Janeiro 2026):');
    console.log('============================================');
    cityResult.rows.forEach((city, index) => {
      console.log(`${index + 1}. ${city.city}: ${city.recargas} recargas = R$ ${parseFloat(city.valor_total).toFixed(2)}`);
    });

    // Verificação dos valores mencionados pelo usuário
    console.log('\n✅ VERIFICAÇÃO DOS DADOS INFORMADOS:');
    console.log('====================================');
    console.log(`Você informou: R$ 2070 e 828 créditos`);
    console.log(`Dados encontrados: R$ ${parseFloat(data.total_valor || 0).toFixed(2)} e ${data.total_recargas} créditos`);
    
    const valorMatch = Math.abs(parseFloat(data.total_valor || 0) - 2070) < 1;
    const creditoMatch = parseInt(data.total_recargas || 0) === 828;
    
    if (valorMatch && creditoMatch) {
      console.log('🎯 CONFIRMADO! Os valores batem perfeitamente!');
    } else {
      console.log('⚠️ Pequena diferença encontrada nos dados.');
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  } finally {
    await n8nPool.end();
    process.exit(0);
  }
}

checkJanuaryData();
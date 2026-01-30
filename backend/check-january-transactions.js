const { Pool } = require('pg');

// Configuração do banco N8N
const n8nPool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function checkJanuaryTransactions() {
  try {
    console.log('🔍 Verificando transações de janeiro 2026...\n');
    
    // Query para verificar transações de CREDIT com recarga em janeiro 2026
    const query = `
      SELECT 
        COUNT(*) as total_recargas,
        COALESCE(SUM(t.quantity), 0) as total_valor,
        MIN(t.quantity) as menor_valor,
        MAX(t.quantity) as maior_valor,
        AVG(t.quantity) as valor_medio,
        COUNT(DISTINCT t.city) as cidades_distintas
      FROM dashboard.transactions t
      WHERE t.type = 'CREDIT'
        AND LOWER(t.description) LIKE '%recarga%'
        AND DATE_PART('year', t.created_at) = 2026
        AND DATE_PART('month', t.created_at) = 1
    `;
    
    const result = await n8nPool.query(query);
    
    if (result.rows.length > 0) {
      const data = result.rows[0];
      console.log('📊 RESUMO DAS TRANSAÇÕES DE JANEIRO 2026:');
      console.log('================================================');
      console.log(`💳 Total de Recargas: ${data.total_recargas}`);
      console.log(`💰 Valor Total: R$ ${parseFloat(data.total_valor).toFixed(2)}`);
      console.log(`📈 Valor Médio: R$ ${parseFloat(data.valor_medio).toFixed(2)}`);
      console.log(`📉 Menor Valor: R$ ${parseFloat(data.menor_valor).toFixed(2)}`);
      console.log(`📈 Maior Valor: R$ ${parseFloat(data.maior_valor).toFixed(2)}`);
      console.log(`🏙️ Cidades com Recargas: ${data.cidades_distintas}`);
    }
    
    // Query para detalhar por cidade
    const cityQuery = `
      SELECT 
        t.city,
        COUNT(*) as recargas,
        COALESCE(SUM(t.quantity), 0) as valor_total
      FROM dashboard.transactions t
      WHERE t.type = 'CREDIT'
        AND LOWER(t.description) LIKE '%recarga%'
        AND DATE_PART('year', t.created_at) = 2026
        AND DATE_PART('month', t.created_at) = 1
      GROUP BY t.city
      ORDER BY valor_total DESC
      LIMIT 10
    `;
    
    const cityResult = await n8nPool.query(cityQuery);
    
    console.log('\n🏙️ TOP 10 CIDADES POR VALOR (Janeiro 2026):');
    console.log('==============================================');
    cityResult.rows.forEach((city, index) => {
      console.log(`${index + 1}. ${city.city}: ${city.recargas} recargas = R$ ${parseFloat(city.valor_total).toFixed(2)}`);
    });

    // Query para verificar se existem dados de janeiro
    const countQuery = `
      SELECT 
        DATE_PART('year', created_at) as ano,
        DATE_PART('month', created_at) as mes,
        COUNT(*) as total_transacoes
      FROM dashboard.transactions 
      WHERE type = 'CREDIT'
        AND LOWER(description) LIKE '%recarga%'
      GROUP BY DATE_PART('year', created_at), DATE_PART('month', created_at)
      ORDER BY ano DESC, mes DESC
      LIMIT 5
    `;
    
    const countResult = await n8nPool.query(countQuery);
    
    console.log('\n📅 ÚLTIMOS MESES COM DADOS:');
    console.log('============================');
    countResult.rows.forEach(row => {
      console.log(`${row.ano}-${String(row.mes).padStart(2, '0')}: ${row.total_transacoes} transações`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao consultar transações:', error.message);
  } finally {
    await n8nPool.end();
  }
}

checkJanuaryTransactions();
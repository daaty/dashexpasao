const { Pool } = require('pg');

const n8nPool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function checkJanuaryCorrect() {
  try {
    console.log('🔍 Verificando dados de JANEIRO 2026 (CORRETO)...\n');
    
    // Query CORRETA: amount = créditos, quantity = reais
    const result = await n8nPool.query(`
      SELECT 
        COUNT(*) as total_transacoes,
        SUM(amount) as total_creditos,
        SUM(quantity) as total_reais,
        MIN(quantity) as menor_valor,
        MAX(quantity) as maior_valor,
        AVG(quantity) as valor_medio,
        COUNT(DISTINCT city) as cidades_distintas
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description = 'recarga'
        AND "createdAt" >= '2026-01-01'
        AND "createdAt" < '2026-02-01'
    `);
    
    const data = result.rows[0];
    console.log('📊 DADOS CORRETOS DE JANEIRO 2026:');
    console.log('===================================');
    console.log(`📋 Total de Transações: ${data.total_transacoes}`);
    console.log(`💳 Total de Créditos: ${parseFloat(data.total_creditos || 0).toFixed(0)} créditos`);
    console.log(`💰 Valor Total: R$ ${parseFloat(data.total_reais || 0).toFixed(2)}`);
    console.log(`📈 Valor Médio: R$ ${parseFloat(data.valor_medio || 0).toFixed(2)}`);
    console.log(`📉 Menor Recarga: R$ ${parseFloat(data.menor_valor || 0).toFixed(2)}`);
    console.log(`📈 Maior Recarga: R$ ${parseFloat(data.maior_valor || 0).toFixed(2)}`);
    console.log(`🏙️ Cidades Ativas: ${data.cidades_distintas}`);

    // Detalhamento por cidade (CORRETO)
    const cityResult = await n8nPool.query(`
      SELECT 
        city,
        COUNT(*) as transacoes,
        SUM(amount) as total_creditos,
        SUM(quantity) as total_reais
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description = 'recarga'
        AND "createdAt" >= '2026-01-01'
        AND "createdAt" < '2026-02-01'
      GROUP BY city
      ORDER BY total_reais DESC
    `);
    
    console.log('\n🏙️ DETALHAMENTO POR CIDADE (Janeiro 2026):');
    console.log('===========================================');
    cityResult.rows.forEach((city, index) => {
      const cityName = city.city || 'Sem cidade';
      console.log(`${index + 1}. ${cityName}: ${city.total_creditos} créditos = R$ ${parseFloat(city.total_reais).toFixed(2)} (${city.transacoes} transações)`);
    });

    // Verificação dos valores mencionados pelo usuário
    console.log('\n✅ VERIFICAÇÃO DOS DADOS INFORMADOS:');
    console.log('====================================');
    console.log(`Você informou: R$ 2070 e 828 créditos`);
    console.log(`Dados encontrados: R$ ${parseFloat(data.total_reais || 0).toFixed(2)} e ${parseFloat(data.total_creditos || 0).toFixed(0)} créditos`);
    
    const valorMatch = Math.abs(parseFloat(data.total_reais || 0) - 2070) < 1;
    const creditoMatch = Math.abs(parseFloat(data.total_creditos || 0) - 828) < 1;
    
    if (valorMatch && creditoMatch) {
      console.log('🎯 CONFIRMADO! Os valores batem perfeitamente!');
    } else {
      console.log('⚠️ Diferença encontrada nos dados:');
      console.log(`   - Diferença em reais: R$ ${Math.abs(parseFloat(data.total_reais || 0) - 2070).toFixed(2)}`);
      console.log(`   - Diferença em créditos: ${Math.abs(parseFloat(data.total_creditos || 0) - 828)} créditos`);
    }

    // Vamos ver algumas transações de exemplo para confirmar
    const sampleResult = await n8nPool.query(`
      SELECT 
        city, amount, quantity, description, "createdAt"
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description = 'recarga'
        AND "createdAt" >= '2026-01-01'
        AND "createdAt" < '2026-02-01'
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);
    
    console.log('\n📋 EXEMPLOS DE TRANSAÇÕES:');
    console.log('==========================');
    sampleResult.rows.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.city || 'Sem cidade'}: ${tx.amount} créditos = R$ ${tx.quantity} (${tx.createdat?.toLocaleDateString('pt-BR') || 'sem data'})`);
    });
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  } finally {
    await n8nPool.end();
    process.exit(0);
  }
}

checkJanuaryCorrect();
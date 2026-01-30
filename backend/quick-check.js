const { Pool } = require('pg');

const n8nPool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false,
  connectionTimeoutMillis: 5000,
  query_timeout: 10000
});

async function quickCheck() {
  try {
    console.log('Verificando dados de janeiro 2026...');
    
    const result = await n8nPool.query(`
      SELECT 
        COUNT(*) as total_recargas,
        SUM(quantity) as total_valor
      FROM dashboard.transactions 
      WHERE type = 'CREDIT' 
        AND description ILIKE '%recarga%'
        AND created_at >= '2026-01-01'
        AND created_at < '2026-02-01'
    `);
    
    const data = result.rows[0];
    console.log(`\n✅ JANEIRO 2026 - CONFIRMAÇÃO:`);
    console.log(`💳 Recargas: ${data.total_recargas}`);
    console.log(`💰 Valor: R$ ${parseFloat(data.total_valor || 0).toFixed(2)}`);
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  } finally {
    process.exit(0);
  }
}

quickCheck();
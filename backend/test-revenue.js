const { Pool } = require('pg');

const pool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw'
});

async function testRevenue() {
  try {
    // Testar a query com timestamp
    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', t."timestamp"), 'YYYY-MM') as mes,
        t.city,
        COUNT(*) as qtd_transacoes,
        SUM(t.amount) as soma_amount,
        SUM(t.quantity) as soma_quantity
      FROM dashboard.transactions t
      WHERE t.type = 'CREDIT'
        AND LOWER(t.description) LIKE '%recarga%'
      GROUP BY DATE_TRUNC('month', t."timestamp"), t.city
      ORDER BY t.city, mes DESC
    `);
    
    console.log('Transações usando timestamp:');
    console.table(result.rows);
    
    // Verificar Nova Monte Verde
    const nmv = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', t."timestamp"), 'YYYY-MM') as mes,
        SUM(t.quantity) as receita_real
      FROM dashboard.transactions t
      WHERE t.type = 'CREDIT'
        AND LOWER(t.description) LIKE '%recarga%'
        AND LOWER(t.city) = 'nova monte verde'
      GROUP BY DATE_TRUNC('month', t."timestamp")
      ORDER BY mes
    `);
    
    console.log('\nReceita Nova Monte Verde usando timestamp:');
    console.table(nmv.rows);
    
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await pool.end();
  }
}

testRevenue();

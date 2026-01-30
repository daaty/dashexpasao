const { Client } = require('pg');

const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

async function checkDecemberMetrics() {
  const client = new Client({
    connectionString: N8N_DATABASE_URL,
  });

  try {
    await client.connect();
    
    const query = `
      SELECT 
        COALESCE(SUM(t.amount), 0) as total_creditos,
        COALESCE(SUM(t.quantity), 0) as total_receita,
        COUNT(*) as total_transacoes
      FROM dashboard.transactions t
      WHERE LOWER(t.city) = 'nova monte verde'
        AND t.type = 'CREDIT'
        AND LOWER(t.description) LIKE '%recarga%'
        AND DATE_TRUNC('month', t."timestamp") = '2025-12-01'
    `;

    const result = await client.query(query);
    const row = result.rows[0];

    console.log('📊 NOVA MONTE VERDE - DEZEMBRO 2025\n');
    console.log('═════════════════════════════════════');
    console.log(`Créditos (amount):   ${parseFloat(row.total_creditos).toFixed(2).replace('.', ',')} unidades`);
    console.log(`Receita (quantity):  R$ ${parseFloat(row.total_receita).toFixed(2).replace('.', ',')}`);
    console.log(`Total de transações: ${row.total_transacoes}`);
    console.log('═════════════════════════════════════');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkDecemberMetrics();

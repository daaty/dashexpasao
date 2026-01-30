const { Client } = require('pg');

const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

async function checkColumns() {
  const client = new Client({
    connectionString: N8N_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('📊 VERIFICANDO QUANTIDADE vs AMOUNT - DEZEMBRO 2025\n');

    const query = `
      SELECT 
        COALESCE(SUM(t.quantity), 0) as soma_quantity,
        COALESCE(SUM(t.amount), 0) as soma_amount,
        COUNT(*) as total_transacoes
      FROM dashboard.transactions t
      WHERE LOWER(t.city) = 'nova monte verde'
        AND t.type = 'CREDIT'
        AND LOWER(t.description) LIKE '%recarga%'
        AND DATE_TRUNC('month', t."timestamp") = '2025-12-01'
    `;

    const result = await client.query(query);
    const row = result.rows[0];

    console.log('Dezembro 2025 - Nova Monte Verde:');
    console.log('─────────────────────────────────');
    console.log(`SUM(t.quantity): R$ ${parseFloat(row.soma_quantity).toFixed(2).replace('.', ',')}`);
    console.log(`SUM(t.amount):   R$ ${parseFloat(row.soma_amount).toFixed(2).replace('.', ',')}`);
    console.log(`Total de transações: ${row.total_transacoes}`);
    console.log('─────────────────────────────────');
    
    if (parseFloat(row.soma_quantity) === 793) {
      console.log('✅ R$ 793,00 = SUM(quantity)');
    } else if (parseFloat(row.soma_amount) === 793) {
      console.log('✅ R$ 793,00 = SUM(amount)');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

checkColumns();

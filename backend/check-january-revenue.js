const { Pool } = require('pg');

// Configuração do banco N8N
const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

const pool = new Pool({
  connectionString: N8N_DATABASE_URL,
});

async function calculateJanuaryRevenue() {
  try {
    console.log('🔍 Calculando receita total de janeiro 2026...\n');

    // Receita total de janeiro usando timestamp e amount
    const totalQuery = await pool.query(`
      SELECT 
        SUM(amount) as total_revenue_amount,
        SUM(quantity) as total_revenue_quantity,
        COUNT(*) as total_transactions
      FROM dashboard.transactions 
      WHERE type = 'CREDIT'
      AND timestamp >= '2026-01-01'
      AND timestamp < '2026-02-01'
    `);

    console.log(`💰 Receita total janeiro 2026 (amount): R$ ${totalQuery.rows[0].total_revenue_amount}`);
    console.log(`💰 Receita total janeiro 2026 (quantity): R$ ${totalQuery.rows[0].total_revenue_quantity}`);
    console.log(`📊 Total de transações: ${totalQuery.rows[0].total_transactions}\n`);

    // Receita por cidade (usando quantity como o backend)
    const byCityQuery = await pool.query(`
      SELECT 
        COALESCE(city, 'SEM CIDADE') as city,
        SUM(amount) as revenue_amount,
        SUM(quantity) as revenue_quantity,
        COUNT(*) as transactions
      FROM dashboard.transactions 
      WHERE type = 'CREDIT'
      AND timestamp >= '2026-01-01'
      AND timestamp < '2026-02-01'
      GROUP BY city
      ORDER BY revenue_quantity DESC
    `);

    console.log('📋 Receita por cidade em janeiro 2026:');
    let totalCheckAmount = 0;
    let totalCheckQuantity = 0;
    byCityQuery.rows.forEach(row => {
      console.log(`${row.city}: Amount=R$ ${row.revenue_amount} | Quantity=R$ ${row.revenue_quantity} (${row.transactions} transações)`);
      totalCheckAmount += parseFloat(row.revenue_amount);
      totalCheckQuantity += parseFloat(row.revenue_quantity);
    });

    console.log(`\n✅ Total da soma (amount): R$ ${totalCheckAmount}`);
    console.log(`✅ Total da soma (quantity): R$ ${totalCheckQuantity}`);
    console.log(`🔄 Diferença (amount): R$ ${totalCheckAmount - parseFloat(totalQuery.rows[0].total_revenue_amount)}`);
    console.log(`🔄 Diferença (quantity): R$ ${totalCheckQuantity - parseFloat(totalQuery.rows[0].total_revenue_quantity)}`);

  } catch (error) {
    console.error('❌ Erro ao calcular receita:', error);
  } finally {
    await pool.end();
  }
}

calculateJanuaryRevenue();
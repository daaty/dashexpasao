const { Pool } = require('pg');

// Configuração do banco N8N
const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

const pool = new Pool({
  connectionString: N8N_DATABASE_URL,
});

async function calculateJanuaryRecargas() {
  try {
    console.log('🔍 Calculando receita de RECARGAS em janeiro 2026...\n');

    // Receita total de janeiro com apenas recargas
    const totalQuery = await pool.query(`
      SELECT 
        SUM(quantity) as total_revenue_recargas,
        COUNT(*) as total_recargas
      FROM dashboard.transactions 
      WHERE type = 'CREDIT'
      AND LOWER(description) LIKE '%recarga%'
      AND timestamp >= '2026-01-01'
      AND timestamp < '2026-02-01'
    `);

    console.log(`💰 Receita total de recargas janeiro 2026: R$ ${totalQuery.rows[0].total_revenue_recargas}`);
    console.log(`📊 Total de recargas: ${totalQuery.rows[0].total_recargas}\n`);

    // Receita de recargas por cidade
    const byCityQuery = await pool.query(`
      SELECT 
        COALESCE(city, 'SEM CIDADE') as city,
        SUM(quantity) as revenue_recargas,
        COUNT(*) as recargas
      FROM dashboard.transactions 
      WHERE type = 'CREDIT'
      AND LOWER(description) LIKE '%recarga%'
      AND timestamp >= '2026-01-01'
      AND timestamp < '2026-02-01'
      GROUP BY city
      ORDER BY revenue_recargas DESC
    `);

    console.log('📋 Receita de recargas por cidade em janeiro 2026:');
    let totalCheck = 0;
    byCityQuery.rows.forEach(row => {
      console.log(`${row.city}: R$ ${row.revenue_recargas} (${row.recargas} recargas)`);
      totalCheck += parseFloat(row.revenue_recargas || 0);
    });

    console.log(`\n✅ Total da soma: R$ ${totalCheck}`);

  } catch (error) {
    console.error('❌ Erro ao calcular receita de recargas:', error);
  } finally {
    await pool.end();
  }
}

calculateJanuaryRecargas();
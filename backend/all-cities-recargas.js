const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: 'postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable' 
});

(async () => {
  try {
    console.log('\n📊 RECEITA DE RECARGAS POR CIDADE - JANEIRO 2026\n');
    console.log('='.repeat(70));
    
    const res = await pool.query(`
      SELECT 
        COALESCE(city, 'SEM CIDADE') as city,
        COUNT(*) as total_recargas,
        SUM(quantity) as valor_total
      FROM dashboard.transactions 
      WHERE type = 'CREDIT'
      AND LOWER(description) LIKE '%recarga%'
      AND timestamp >= '2026-01-01'
      AND timestamp < '2026-02-01'
      GROUP BY city
      ORDER BY valor_total DESC
    `);
    
    let totalGeral = 0;
    res.rows.forEach((row, idx) => {
      const valor = parseFloat(row.valor_total || 0);
      totalGeral += valor;
      const percentual = (idx === 0) ? '🥇' : (idx === 1) ? '🥈' : (idx === 2) ? '🥉' : ' ';
      console.log(`${percentual} ${row.city.padEnd(25)} | ${row.total_recargas.toString().padStart(2)} recargas | R$ ${valor.toFixed(2).padStart(10)}`);
    });
    
    console.log('='.repeat(70));
    console.log(`\n✅ TOTAL GERAL: ${res.rows.length} cidades | R$ ${totalGeral.toFixed(2)}\n`);
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
})();

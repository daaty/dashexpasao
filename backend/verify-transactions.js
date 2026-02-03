const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: 'postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable' 
});

(async () => {
  try {
    console.log('🔍 Estrutura da tabela transactions:\n');
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='transactions' 
      ORDER BY ordinal_position 
    `);
    res.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

    console.log('\n' + '='.repeat(60));
    console.log('📊 RECARGAS EM NOVA MONTE VERDE - JANEIRO 2026\n');

    const query = await pool.query(`
      SELECT 
        driverId,
        city,
        description,
        quantity,
        timestamp,
        type
      FROM public.transactions 
      WHERE city = 'Nova Monte Verde'
      AND type = 'CREDIT'
      AND LOWER(description) LIKE '%recarga%'
      AND timestamp >= '2026-01-01'
      AND timestamp < '2026-02-01'
      ORDER BY timestamp DESC
    `);

    console.log(`Total de recargas: ${query.rows.length}\n`);
    
    let totalValue = 0;
    query.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.timestamp} | R$ ${row.quantity} | ${row.description}`);
      totalValue += parseFloat(row.quantity || 0);
    });

    console.log(`\n✅ Valor Total: R$ ${totalValue.toFixed(2)}`);
    console.log(`📊 Quantidade: ${query.rows.length} recargas`);

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
})();

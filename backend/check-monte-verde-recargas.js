const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: 'postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable' 
});

(async () => {
  try {
    console.log('🔍 Procurando tabela transactions:\n');
    
    const schemas = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'transactions'
      ORDER BY table_schema
    `);

    console.log('Schemas encontrados:');
    schemas.rows.forEach(r => console.log(`  ${r.table_schema}.${r.table_name}`));

    if (schemas.rows.length > 0) {
      const schema = schemas.rows[0].table_schema;
      console.log(`\n📊 Consultando ${schema}.transactions...\n`);

      const query = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT "driverId") as motoristas,
          SUM(quantity) as valor_total
        FROM ${schema}.transactions 
        WHERE city = 'Nova Monte Verde'
        AND type = 'CREDIT'
        AND LOWER(description) LIKE '%recarga%'
        AND timestamp >= '2026-01-01'
        AND timestamp < '2026-02-01'
      `);

      const result = query.rows[0];
      console.log(`✅ RECARGAS EM NOVA MONTE VERDE - JANEIRO 2026:`);
      console.log(`  Quantidade: ${result.total}`);
      console.log(`  Motoristas: ${result.motoristas}`);
      console.log(`  Valor Total: R$ ${result.valor_total?.toFixed(2) || 0}`);

      // Detalhe
      console.log(`\n📋 Detalhes:\n`);
      const details = await pool.query(`
        SELECT 
          timestamp,
          "driverId",
          quantity,
          description
        FROM ${schema}.transactions 
        WHERE city = 'Nova Monte Verde'
        AND type = 'CREDIT'
        AND LOWER(description) LIKE '%recarga%'
        AND timestamp >= '2026-01-01'
        AND timestamp < '2026-02-01'
        ORDER BY timestamp DESC
      `);

      details.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. ${row.timestamp} | R$ ${row.quantity} | ${row.driverId}`);
      });
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
})();

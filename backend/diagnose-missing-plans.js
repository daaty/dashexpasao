const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://urbanmt:urban2025@148.230.73.27:5434/urbantmt?sslmode=disable'
});

(async () => {
  try {
    await client.connect();
    console.log('🔍 DIAGNÓSTICO: Cidades sem Planejamento\n');

    // 1. Cidades que têm status PLANNING/EXPANSION/CONSOLIDATED mas SEM planejamento
    const missingPlans = await client.query(`
      SELECT 
        c.id,
        c.name,
        c.status,
        COUNT(p.id) as total_plans
      FROM public."City" c
      LEFT JOIN public."Planning" p ON c.id = p."cityId"
      WHERE c.status IN ('PLANNING', 'EXPANSION', 'CONSOLIDATED')
      GROUP BY c.id, c.name, c.status
      HAVING COUNT(p.id) = 0
      ORDER BY c.name
    `);

    console.log(`📍 CIDADES SEM PLANEJAMENTO: ${missingPlans.rows.length}`);
    if (missingPlans.rows.length > 0) {
      console.log('─'.repeat(60));
      missingPlans.rows.forEach(row => {
        console.log(`  • ${row.name.padEnd(30)} (ID: ${row.id}, Status: ${row.status})`);
      });
      console.log('─'.repeat(60) + '\n');
    }

    // 2. Contar planejamentos por status
    const planStats = await client.query(`
      SELECT 
        c.status,
        COUNT(DISTINCT c.id) as total_cidades,
        COUNT(DISTINCT p.id) as total_plans
      FROM public."City" c
      LEFT JOIN public."Planning" p ON c.id = p."cityId"
      WHERE c.status IN ('PLANNING', 'EXPANSION', 'CONSOLIDATED')
      GROUP BY c.status
      ORDER BY c.status
    `);

    console.log('📊 RESUMO POR STATUS:');
    console.log('─'.repeat(60));
    planStats.rows.forEach(row => {
      console.log(`  ${row.status.padEnd(15)}: ${row.total_cidades} cidades, ${row.total_plans} planejamentos`);
    });
    console.log('─'.repeat(60) + '\n');

    // 3. Total geral
    const totalCidades = await client.query(`
      SELECT COUNT(*) as total FROM public."City"
    `);
    
    const totalPlans = await client.query(`
      SELECT COUNT(*) as total FROM public."Planning"
    `);

    console.log('📈 TOTAIS GERAIS:');
    console.log(`  • Cidades no banco: ${totalCidades.rows[0].total}`);
    console.log(`  • Planejamentos: ${totalPlans.rows[0].total}\n`);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
})();

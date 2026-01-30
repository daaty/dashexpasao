const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://urbanmt:urban2025@148.230.73.27:5434/urbantmt?sslmode=disable'
});

(async () => {
  try {
    await client.connect();
    console.log('🔍 VERIFICANDO DADOS APÓS CORREÇÃO\n');

    // Tabela City
    const citiesRes = await client.query(`
      SELECT "id", "name", "status" FROM "City" 
      WHERE "status" IN ('PLANNING', 'EXPANSION', 'CONSOLIDATED')
      ORDER BY "name"
    `);
    console.log(`📊 Cidades com status Planning/Expansion/Consolidated: ${citiesRes.rows.length}`);
    citiesRes.rows.forEach(c => console.log(`   • ${c.name} (ID: ${c.id}, Status: ${c.status})`));

    console.log('\n');

    // Tabela Planning
    const plansRes = await client.query(`
      SELECT p."id", p."cityId", c."name", p."title", COUNT(t."id") as task_count
      FROM "Planning" p
      LEFT JOIN "City" c ON p."cityId" = c."id"
      LEFT JOIN "Task" t ON p."id" = t."planningId"
      GROUP BY p."id", p."cityId", c."name", p."title"
      ORDER BY c."name"
    `);
    console.log(`📋 Planejamentos no banco: ${plansRes.rows.length}`);
    plansRes.rows.forEach(p => {
      console.log(`   • ${p.name}: "${p.title}" (${p.task_count} tarefas)`);
    });

    // Jointure de Cities e Plannings
    console.log('\n');
    const joinRes = await client.query(`
      SELECT 
        c."id",
        c."name",
        c."status",
        COUNT(DISTINCT p."id") as total_plans
      FROM "City" c
      LEFT JOIN "Planning" p ON c."id" = p."cityId"
      WHERE c."status" IN ('PLANNING', 'EXPANSION', 'CONSOLIDATED')
      GROUP BY c."id", c."name", c."status"
      ORDER BY c."name"
    `);
    console.log('✅ VERIFICAÇÃO FINAL - Jointura City + Planning:');
    console.log('─'.repeat(60));
    joinRes.rows.forEach(row => {
      const hasPlans = row.total_plans > 0 ? '✅' : '❌';
      console.log(`  ${hasPlans} ${row.name.padEnd(30)} ${row.status} (${row.total_plans} plans)`);
    });
    console.log('─'.repeat(60));

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
})();

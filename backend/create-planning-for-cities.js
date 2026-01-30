const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://urbanmt:urban2025@148.230.73.27:5434/urbantmt?sslmode=disable'
});

(async () => {
  try {
    await client.connect();
    console.log('🆕 Criando planejamentos para cidades em PLANNING\n');

    // Buscar cidades com status PLANNING que não têm planejamento
    const citiesRes = await client.query(`
      SELECT c."id", c."name", c."implementationStartDate"
      FROM "City" c
      LEFT JOIN "Planning" p ON c."id" = p."cityId"
      WHERE c."status" = 'PLANNING'
        AND p."id" IS NULL
      ORDER BY c."name"
    `);

    console.log(`📍 Encontradas ${citiesRes.rows.length} cidades sem planejamento\n`);

    if (citiesRes.rows.length === 0) {
      console.log('✅ Todas as cidades em PLANNING já têm planejamentos');
      await client.end();
      return;
    }

    // Para cada cidade, criar um planejamento
    for (const city of citiesRes.rows) {
      const startDate = new Date();
      
      const res = await client.query(
        `
          INSERT INTO "Planning" (
            "id",
            "cityId",
            "title",
            "description",
            "startDate",
            "status",
            "priority",
            "progressPercentage",
            "createdAt",
            "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            NOW(),
            NOW()
          )
          RETURNING "id"
        `,
        [
          city.id,
          `Expansão em ${city.name}`,
          `Planejamento de expansão para ${city.name}`,
          startDate,
          'active',
          'medium',
          0
        ]
      );

      const planningId = res.rows[0].id;
      console.log(`✅ Planejamento criado para ${city.name} (ID: ${planningId})`);

      // Criar tarefas padrão para o planejamento
      const tasks = [
        { title: 'Análise de Mercado', description: 'Realizar análise de mercado local' },
        { title: 'Estudo de Viabilidade', description: 'Avaliar viabilidade operacional' },
        { title: 'Preparação Operacional', description: 'Preparar estrutura operacional' },
        { title: 'Aquisição de Motoristas', description: 'Recrutar motoristas iniciais' },
        { title: 'Aquisição de Passageiros', description: 'Realizar divulgação inicial' }
      ];

      for (const task of tasks) {
        await client.query(
          `
            INSERT INTO "Task" ("id", "planningId", "title", "description", "completed", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, false, NOW(), NOW())
          `,
          [planningId, task.title, task.description]
        );
      }

      console.log(`   └─ 5 tarefas padrão criadas`);
    }

    console.log('\n📈 RESUMO FINAL:');
    const planStats = await client.query(`
      SELECT 
        c."status",
        COUNT(DISTINCT c."id") as total_cidades,
        COUNT(DISTINCT p."id") as total_plans
      FROM "City" c
      LEFT JOIN "Planning" p ON c."id" = p."cityId"
      GROUP BY c."status"
      ORDER BY c."status"
    `);

    planStats.rows.forEach(row => {
      console.log(`  ${row.status || 'NULL'}: ${row.total_cidades} cidades, ${row.total_plans} planejamentos`);
    });

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
})();

const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgres://urbanmt:urban2025@148.230.73.27:5434/urbantmt?sslmode=disable'
});

(async () => {
  try {
    await client.connect();
    console.log('📍 Executando script SQL para criar tabelas...\n');

    // Tabela City
    await client.query(`
      CREATE TABLE IF NOT EXISTS "City" (
        "id" INTEGER NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'NOT_SERVED',
        "mesorregion" TEXT,
        "implementationStartDate" TEXT,
        "population" INTEGER DEFAULT 0,
        "population15to44" INTEGER DEFAULT 0,
        "averageIncome" DECIMAL DEFAULT 0,
        "urbanizationIndex" DECIMAL DEFAULT 0,
        "gentilic" TEXT,
        "anniversary" TEXT,
        "mayor" TEXT,
        "averageFormalSalary" DECIMAL DEFAULT 0,
        "formalJobs" INTEGER DEFAULT 0,
        "urbanizedAreaKm2" DECIMAL DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela City criada/verificada');

    // Tabela Planning
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Planning" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "cityId" INTEGER NOT NULL REFERENCES "City"("id") ON DELETE CASCADE,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP,
        "status" TEXT DEFAULT 'active',
        "priority" TEXT DEFAULT 'medium',
        "tags" TEXT,
        "estimatedBudget" DECIMAL(10, 2),
        "actualBudget" DECIMAL(10, 2),
        "progressPercentage" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela Planning criada/verificada');

    // Tabela Task
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Task" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "planningId" TEXT NOT NULL REFERENCES "Planning"("id") ON DELETE CASCADE,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "completed" BOOLEAN DEFAULT false,
        "dueDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela Task criada/verificada');

    // Criar índices
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_city_status" ON "City"("status")`);
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_planning_cityId" ON "Planning"("cityId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_task_planningId" ON "Task"("planningId")`);
    console.log('✅ Índices criados/verificados\n');

    // Verificar quantas cidades existem
    const countRes = await client.query(`SELECT COUNT(*) as total FROM "City"`);
    console.log(`📊 Total de cidades no banco: ${countRes.rows[0].total}`);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
})();

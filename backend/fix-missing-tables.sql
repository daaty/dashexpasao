-- Força criação das tabelas City, Planning e Task se não existirem
-- Adiciona chaves estrangeiras

-- Se City não existir, criar
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
);

-- Se Planning não existir, criar
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
);

-- Se Task não existir, criar
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "planningId" TEXT NOT NULL REFERENCES "Planning"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN DEFAULT false,
    "dueDate" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS "idx_city_status" ON "City"("status");
CREATE INDEX IF NOT EXISTS "idx_planning_cityId" ON "Planning"("cityId");
CREATE INDEX IF NOT EXISTS "idx_task_planningId" ON "Task"("planningId");

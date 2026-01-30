CREATE TABLE IF NOT EXISTS "City" (
  id integer PRIMARY KEY,
  name varchar(255),
  status varchar(50),
  mesorregion varchar(100),
  "implementationStartDate" varchar(255),
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_city_status ON "City" (status);

CREATE TABLE IF NOT EXISTS "Planning" (
  id text PRIMARY KEY,
  "cityId" integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  "startDate" timestamptz NOT NULL,
  "endDate" timestamptz,
  status varchar(50),
  priority varchar(50),
  tags text,
  "estimatedBudget" numeric(10,2),
  "actualBudget" numeric(10,2),
  "progressPercentage" integer DEFAULT 0,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now(),
  CONSTRAINT fk_planning_city FOREIGN KEY ("cityId") REFERENCES "City"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_planning_cityId ON "Planning" ("cityId");

CREATE TABLE IF NOT EXISTS "Task" (
  id text PRIMARY KEY,
  "planningId" text NOT NULL,
  title text NOT NULL,
  description text,
  completed boolean DEFAULT false,
  "dueDate" timestamptz,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now(),
  CONSTRAINT fk_task_planning FOREIGN KEY ("planningId") REFERENCES "Planning"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_planningId ON "Task" ("planningId");

-- Ensure a test city exists for id=1
INSERT INTO "City" (id, name, status) VALUES (1, 'Test City', 'NOT_SERVED') ON CONFLICT (id) DO NOTHING;

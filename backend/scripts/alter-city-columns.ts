import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Altering City table to add missing demographic columns...')

  const statements = [
    `ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "population" integer DEFAULT 0;`,
    `ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "population15to44" integer DEFAULT 0;`,
    `ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "averageIncome" double precision DEFAULT 0;`,
    `ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "urbanizationIndex" double precision DEFAULT 0;`,
    `ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "gentilic" varchar(255);`,
    `ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "anniversary" varchar(255);`,
    `ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "mayor" varchar(255);`,
    `ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "averageFormalSalary" double precision DEFAULT 0;`,
    `ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "formalJobs" integer DEFAULT 0;`,
    `ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "urbanizedAreaKm2" double precision DEFAULT 0;`
  ]

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql)
      console.log('Executed:', sql)
    } catch (err) {
      console.error('Error executing:', sql, err)
    }
  }

  console.log('Done altering City table.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

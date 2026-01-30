import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const cityId = 1;
    const phases = [ { name: 'Phase 1', tasks: [] } ];
    const startDate = '2026-02-01';

    const upsert = await prisma.planDetails.upsert({
      where: { cityId },
      update: { phases: phases as any, startDate, updatedAt: new Date() },
      create: { cityId, phases: phases as any, startDate }
    });

    console.log('Upserted PlanDetails:');
    console.log(JSON.stringify(upsert, null, 2));

    const found = await prisma.planDetails.findUnique({ where: { cityId } });
    console.log('\nFetched PlanDetails:');
    console.log(JSON.stringify(found, null, 2));
  } catch (err) {
    console.error('Error in test-plan-details:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.planningResults.findMany({ take: 3 });
  console.log('Exemplo de PlanningResults salvos:');
  plans.forEach(p => {
    console.log('\nCidade ID:', p.cityId);
    if (p.results) {
      const keys = Object.keys(p.results);
      console.log('Keys:', keys);
      if (keys.length > 0) {
        console.log('Primeiro resultado:', JSON.stringify(p.results[keys[0]], null, 2));
      }
    }
  });
  await prisma.$disconnect();
}
main();

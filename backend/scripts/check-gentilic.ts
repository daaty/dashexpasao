import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cities = await prisma.city.findMany({
    where: {
      OR: [
        { gentilic: { not: null } },
        { mayor: { not: null } }
      ]
    },
    select: {
      name: true,
      gentilic: true,
      mayor: true
    },
    take: 15,
    orderBy: { name: 'asc' }
  });

  console.log('\n📊 DADOS DE GENTÍLICO E PREFEITO:');
  console.log('='.repeat(80));
  
  cities.forEach(city => {
    console.log(`\n${city.name}`);
    console.log(`  Gentílico: ${city.gentilic || 'N/A'}`);
    console.log(`  Prefeito: ${city.mayor || 'N/A'}`);
  });

  // Contar totais
  const totalGentilic = await prisma.city.count({
    where: { gentilic: { not: null } }
  });
  
  const totalMayor = await prisma.city.count({
    where: { mayor: { not: null } }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`✅ Total com Gentílico: ${totalGentilic}`);
  console.log(`✅ Total com Prefeito: ${totalMayor}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

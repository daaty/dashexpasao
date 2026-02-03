import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificar() {
  try {
    const total = await prisma.city.count();
    const comPopulacao = await prisma.city.count({ where: { population: { gt: 0 } } });

    console.log(`\n📊 RESUMO DO BANCO DE DADOS:`);
    console.log(`=`.repeat(50));
    console.log(`Total de cidades: ${total}`);
    console.log(`Cidades com população > 0: ${comPopulacao}`);

    const top5 = await prisma.city.findMany({
      orderBy: { population: 'desc' },
      take: 5,
      select: { id: true, name: true, population: true, mesorregion: true }
    });

    if (top5.length > 0) {
      console.log(`\n📍 Top 5 maiores cidades:`);
      top5.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.name}: ${c.population?.toLocaleString('pt-BR')} hab`);
      });
    }

    const nomesCidades = await prisma.city.findMany({
      where: { name: { contains: 'nova' } },
      select: { id: true, name: true, population: true }
    });

    if (nomesCidades.length > 0) {
      console.log(`\n🔍 Cidades com "nova" no nome:`);
      nomesCidades.forEach(c => {
        console.log(`  - ${c.name}: ${c.population} hab`);
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

verificar();

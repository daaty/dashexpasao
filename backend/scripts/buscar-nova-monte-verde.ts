import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function buscarNovaMonteVerde() {
  try {
    const cidade = await prisma.city.findFirst({
      where: {
        name: {
          contains: 'Nova Monte Verde',
          mode: 'insensitive'
        }
      },
      select: { id: true, name: true, population: true, mesorregion: true }
    });

    if (cidade) {
      console.log(`\n📍 INFORMAÇÕES DE NOVA MONTE VERDE:`);
      console.log(`=`.repeat(50));
      console.log(`Nome: ${cidade.name}`);
      console.log(`ID IBGE: ${cidade.id}`);
      console.log(`Mesorregião: ${cidade.mesorregion || 'N/A'}`);
      console.log(`\n👥 POPULAÇÃO TOTAL: ${cidade.population?.toLocaleString('pt-BR')} habitantes\n`);
    } else {
      console.log(`\n❌ Nova Monte Verde não encontrada no banco de dados\n`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

buscarNovaMonteVerde();

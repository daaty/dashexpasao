const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarDados() {
  const cidades = await prisma.city.findMany({
    where: {
      name: {
        in: ['Nova Monte Verde', 'Nova Bandeirantes', 'Cuiabá', 'Sinop', 'Alta Floresta', 'Colíder', 'Apiacás', 'Paranaíta', 'Carlinda']
      }
    },
    select: {
      name: true,
      population: true,
      population15to44: true
    },
    orderBy: { name: 'asc' }
  });

  console.log('========================================');
  console.log('DADOS ATUALIZADOS NO BANCO (Censo 2022)');
  console.log('========================================\n');
  
  cidades.forEach(c => {
    const pct = ((c.population15to44 / c.population) * 100).toFixed(1);
    console.log(`${c.name}:`);
    console.log(`  População Total: ${c.population.toLocaleString('pt-BR')}`);
    console.log(`  Pop 15-44 anos:  ${c.population15to44.toLocaleString('pt-BR')} (${pct}%)\n`);
  });

  await prisma.$disconnect();
}

verificarDados();

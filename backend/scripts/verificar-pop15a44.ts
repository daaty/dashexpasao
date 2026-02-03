import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 VERIFICAÇÃO - POPULAÇÃO 15-44 ANOS');
  console.log('='.repeat(60));

  // Nova Monte Verde
  const nmv = await prisma.city.findFirst({
    where: { name: { contains: 'Nova Monte Verde' } },
    select: { name: true, population: true, population15to44: true }
  });

  if (nmv) {
    const pct = nmv.population && nmv.population > 0 
      ? ((nmv.population15to44 || 0) / nmv.population * 100).toFixed(1) 
      : '0';
    console.log(`\n🔍 Nova Monte Verde:`);
    console.log(`   População total: ${nmv.population?.toLocaleString('pt-BR')}`);
    console.log(`   Pop 15-44 anos:  ${nmv.population15to44?.toLocaleString('pt-BR')} (${pct}%)`);
  }

  // Top 10 por população
  const top10 = await prisma.city.findMany({
    orderBy: { population: 'desc' },
    take: 10,
    select: { name: true, population: true, population15to44: true }
  });

  console.log('\n📊 Top 10 cidades - População 15-44 anos:');
  console.log('-'.repeat(60));
  
  for (let i = 0; i < top10.length; i++) {
    const c = top10[i];
    const pct = c.population && c.population > 0 
      ? ((c.population15to44 || 0) / c.population * 100).toFixed(1) 
      : '0';
    console.log(`${i + 1}. ${c.name.padEnd(25)} ${String(c.population15to44?.toLocaleString('pt-BR') || '0').padStart(10)} (${pct}%)`);
  }

  // Cidades sem dados de pop 15-44
  const semDados = await prisma.city.findMany({
    where: { 
      OR: [
        { population15to44: 0 }, 
        { population15to44: null },
        { population15to44: { lt: 100 } }
      ] 
    },
    orderBy: { population: 'desc' },
    select: { name: true, population: true, population15to44: true }
  });

  console.log(`\n⚠️  Cidades com pop 15-44 ausente ou muito baixo: ${semDados.length}`);
  if (semDados.length > 0 && semDados.length <= 20) {
    semDados.forEach(c => {
      console.log(`   - ${c.name}: pop total ${c.population?.toLocaleString('pt-BR')}, pop15-44: ${c.population15to44}`);
    });
  }

  // Estatísticas gerais
  const todas = await prisma.city.findMany({
    select: { population: true, population15to44: true }
  });

  const totalPop = todas.reduce((sum, c) => sum + (c.population || 0), 0);
  const totalPop15a44 = todas.reduce((sum, c) => sum + (c.population15to44 || 0), 0);
  const pctGeral = totalPop > 0 ? (totalPop15a44 / totalPop * 100).toFixed(1) : '0';

  console.log('\n📈 RESUMO GERAL:');
  console.log(`   Total população MT:    ${totalPop.toLocaleString('pt-BR')}`);
  console.log(`   Total pop 15-44 anos:  ${totalPop15a44.toLocaleString('pt-BR')} (${pctGeral}%)`);

  await prisma.$disconnect();
}

main();

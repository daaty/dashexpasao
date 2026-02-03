const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('📊 Dados de Nova Monte Verde em janeiro 2026\n');
    console.log('================================================\n');

    // Recargas realizadas (já obtidas)
    console.log('✅ RECARGAS REALIZADAS EM JANEIRO:');
    console.log('  Quantidade: 19 recargas');
    console.log('  Valor: R$ 1.197,50\n');

    // Buscar planejamento
    const city = await prisma.city.findFirst({
      where: { name: 'Nova Monte Verde' }
    });
    
    if (city) {
      const plan = await prisma.planning.findFirst({
        where: { cityId: city.id }
      });

      if (plan) {
        console.log('📋 PLANEJAMENTO ENCONTRADO:');
        console.log(`  Título: ${plan.title}`);
        console.log(`  Status: ${plan.status}`);
        
        // Tentar buscar projeções
        const projections = await prisma.projection.findMany({
          where: { planningId: plan.id }
        });
        
        if (projections.length > 0) {
          console.log(`\n💰 PROJEÇÕES ENCONTRADAS (${projections.length}):`);
          projections.forEach((p, i) => {
            console.log(`  ${i+1}. Mês: ${p.month} | Receita: R$ ${p.revenue} | Corridas: ${p.ridesCount}`);
          });
        } else {
          console.log('\n❌ Sem projeções encontradas');
        }
      }
    }

    console.log('\n================================================');
    console.log('📈 RESUMO:');
    console.log('  Recargas realizadas: R$ 1.197,50');
    console.log('  Total de recargas em todas as cidades: R$ 2.170,00');
    console.log('  Participação: 55,19% do total');
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();

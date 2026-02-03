const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCityStatus() {
  console.log('========================================');
  console.log('ATUALIZANDO STATUS DAS CIDADES');
  console.log('========================================');

  try {
    // Buscar todas as cidades com PLANNING que têm data de implementação
    const cities = await prisma.city.findMany({
      where: {
        status: 'PLANNING',
        implementationStartDate: {
          not: null
        }
      },
      include: {
        plannings: {
          include: {
            tasks: true
          }
        }
      }
    });

    console.log(`\nEncontradas ${cities.length} cidades em PLANNING com data de implementação`);

    const updatesNeeded = [];

    for (const city of cities) {
      const startDate = new Date(city.implementationStartDate);
      const now = new Date();
      const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
      
      console.log(`\n--- ${city.name} ---`);
      console.log(`Meses desde implementação: ${monthsDiff}`);
      
      let shouldConsolidate = false;
      let reason = '';

      // Critério 1: 6+ meses de implementação
      if (monthsDiff >= 6) {
        shouldConsolidate = true;
        reason = `${monthsDiff} meses de implementação (>= 6 meses)`;
      }

      // Critério 2: Todas as fases operacionais terminadas (se houver planning)
      if (city.plannings.length > 0) {
        const planning = city.plannings[0];
        const totalTasks = planning.tasks.length;
        const completedTasks = planning.tasks.filter(t => t.completed).length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
        
        console.log(`Tarefas: ${completedTasks}/${totalTasks} (${Math.round(completionRate * 100)}%)`);
        
        if (completionRate === 1.0 && totalTasks > 0) {
          shouldConsolidate = true;
          reason += reason ? ' + todas as fases concluídas' : 'todas as fases concluídas';
        }
      }

      if (shouldConsolidate) {
        console.log(`✅ DEVE SER CONSOLIDADA: ${reason}`);
        updatesNeeded.push({
          id: city.id,
          name: city.name,
          reason
        });
      } else {
        console.log(`⏳ Ainda em planejamento`);
      }
    }

    // Aplicar atualizações
    if (updatesNeeded.length > 0) {
      console.log(`\n========================================`);
      console.log(`APLICANDO ${updatesNeeded.length} ATUALIZAÇÕES:`);
      console.log(`========================================`);

      for (const update of updatesNeeded) {
        await prisma.city.update({
          where: { id: update.id },
          data: { status: 'CONSOLIDATED' }
        });
        console.log(`✅ ${update.name} → CONSOLIDATED (${update.reason})`);
      }
      
      console.log(`\n🎉 ${updatesNeeded.length} cidades consolidadas com sucesso!`);
    } else {
      console.log('\n📊 Nenhuma atualização necessária');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCityStatus();
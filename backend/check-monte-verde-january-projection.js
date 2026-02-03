const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('📊 Buscando dados de Nova Monte Verde em janeiro 2026...\n');

    // Buscar cidade
    const city = await prisma.city.findFirst({
      where: { name: 'Nova Monte Verde' },
      include: { 
        plannings: true
      }
    });
    
    if (!city) {
      console.log('❌ Cidade Nova Monte Verde não encontrada');
      return;
    }

    console.log('✅ Planejamento para Nova Monte Verde em janeiro 2026:');
    
    // Buscar planejamento
    if (city.plannings && city.plannings.length > 0) {
      const plan = city.plannings[0];
      
      console.log(`  📋 Planejamento: ${plan.title}`);
      console.log(`  📅 Status: ${plan.status}`);
      
      // Os dados projetados estão no objeto plan
      const projectedRevenue = plan.totalProjectedRevenue || plan.revenue;
      if (projectedRevenue) {
        console.log(`  💰 Receita Total Projetada: R$ ${projectedRevenue}`);
      }
      
      // Mostrar dados do plano
      if (plan.data && typeof plan.data === 'string') {
        const data = JSON.parse(plan.data);
        console.log(`  📊 Dados do plano:`, data);
      } else if (plan.data) {
        console.log(`  📊 Dados do plano:`, plan.data);
      }
    } else {
      console.log('❌ Sem planejamento encontrado para Nova Monte Verde');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();

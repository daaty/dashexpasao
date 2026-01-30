const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearPlanningData() {
  try {
    console.log('🗑️  Limpando dados de planejamento e inteligência...\n');

    // Limpar tabelas em ordem (respeitar foreign keys)
    // Limpar Tasks
    try {
      console.log('Deletando Tasks...');
      const tasks = await prisma.task.deleteMany({});
      console.log(`✅ ${tasks.count} tasks deletadas`);
    } catch (e) {
      console.log('⚠️  Erro ao deletar Tasks:', e.message);
    }

    // Limpar PlanDetails
    try {
      console.log('Deletando PlanDetails...');
      const planDetails = await prisma.planDetails.deleteMany({});
      console.log(`✅ ${planDetails.count} plan details deletados`);
    } catch (e) {
      console.log('⚠️  Erro ao deletar PlanDetails:', e.message);
    }

    // Limpar PlanningResults
    try {
      console.log('Deletando PlanningResults...');
      const planningResults = await prisma.planningResults.deleteMany({});
      console.log(`✅ ${planningResults.count} planning results deletados`);
    } catch (e) {
      console.log('⚠️  Erro ao deletar PlanningResults:', e.message);
    }

    // Limpar MarketBlocks
    try {
      console.log('Deletando MarketBlocks...');
      const marketBlocks = await prisma.marketBlock.deleteMany({});
      console.log(`✅ ${marketBlocks.count} market blocks deletados`);
    } catch (e) {
      console.log('⚠️  Erro ao deletar MarketBlocks:', e.message);
    }

    // Limpar Plannings
    try {
      console.log('Deletando Plannings...');
      const plannings = await prisma.planning.deleteMany({});
      console.log(`✅ ${plannings.count} plannings deletados`);
    } catch (e) {
      console.log('⚠️  Erro ao deletar Plannings:', e.message);
    }

    // Limpar Passengers (dados de inteligência)
    try {
      console.log('Deletando Passengers...');
      const passengers = await prisma.passenger.deleteMany({});
      console.log(`✅ ${passengers.count} passengers deletados`);
    } catch (e) {
      console.log('⚠️  Erro ao deletar Passengers:', e.message);
    }

    console.log('\n✅ Todos os dados de planejamento e inteligência foram limpos!');
    console.log('✅ Dados de cidades mantidos intactos.');

    // Verificar cidades
    const cityCount = await prisma.city.count();
    console.log(`\n📊 Total de cidades no banco: ${cityCount}`);

  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearPlanningData();

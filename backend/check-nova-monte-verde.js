const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNovaMonteVerde() {
  try {
    const city = await prisma.city.findFirst({
      where: { name: 'Nova Monte Verde' }
    });
    
    if (city) {
      console.log('========================================');
      console.log('DADOS DE NOVA MONTE VERDE');
      console.log('========================================');
      console.log('ID:', city.id);
      console.log('Nome:', city.name);
      console.log('População:', city.population);
      console.log('Pop 15-44:', city.population15to44);
      console.log('Renda média:', city.averageIncome);
      console.log('Urbanização:', city.urbanizationIndex);
      console.log('Mesorregião:', city.mesorregion);
      console.log('Status:', city.status);
      console.log('Data Implementação:', city.implementationStartDate);
    } else {
      console.log('Cidade não encontrada');
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNovaMonteVerde();

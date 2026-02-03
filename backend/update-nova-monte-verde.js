const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateNovaMonteVerde() {
  try {
    // Dados do Censo 2022 do IBGE
    const populacao = 8313;
    // População 15-44 anos (Censo 2022):
    // 15-19: 552 | 20-24: 611 | 25-29: 663 | 30-34: 632 | 35-39: 744 | 40-44: 642
    const pop15a44 = 552 + 611 + 663 + 632 + 744 + 642; // = 3844
    
    const city = await prisma.city.update({
      where: { id: 5108956 },
      data: {
        population: populacao,
        population15to44: pop15a44
      }
    });
    
    console.log('========================================');
    console.log('NOVA MONTE VERDE - ATUALIZADO');
    console.log('========================================');
    console.log('População (Censo 2022):', city.population);
    console.log('Pop 15-44 (estimada):', city.population15to44);
    console.log('Status:', city.status);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNovaMonteVerde();

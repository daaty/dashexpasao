const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCitiesStatus() {
  console.log('========================================');
  console.log('FORÇANDO ATUALIZAÇÃO DE STATUS');
  console.log('========================================');
  
  try {
    // Verificar estado inicial
    console.log('Estado inicial:');
    const initialCities = await prisma.city.findMany({
      where: {
        name: {
          in: ['Nova Monte Verde', 'Nova Bandeirantes']
        }
      },
      select: {
        id: true,
        name: true,
        status: true,
        implementationStartDate: true
      }
    });
    
    for (const city of initialCities) {
      console.log(`${city.name}: ${city.status} (Início: ${city.implementationStartDate})`);
    }
    
    // Fazer atualizações forçadas
    console.log('\nAtualizando...');
    
    for (const city of initialCities) {
      const updated = await prisma.city.update({
        where: { id: city.id },
        data: { status: 'CONSOLIDATED' }
      });
      console.log(`✅ ${city.name} atualizada: ${updated.status}`);
    }
    
    // Verificar estado final
    console.log('\n========================================');
    console.log('Estado final:');
    const finalCities = await prisma.city.findMany({
      where: {
        name: {
          in: ['Nova Monte Verde', 'Nova Bandeirantes']
        }
      },
      select: {
        name: true,
        status: true
      }
    });
    
    for (const city of finalCities) {
      console.log(`${city.name}: ${city.status}`);
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCitiesStatus();
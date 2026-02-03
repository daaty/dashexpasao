const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStatus() {
  try {
    const result = await prisma.city.updateMany({
      where: {
        name: {
          in: ['Nova Monte Verde', 'Nova Bandeirantes']
        }
      },
      data: {
        status: 'CONSOLIDATED'
      }
    });
    
    console.log('Cidades atualizadas:', result.count);
    
    // Verificar
    const cities = await prisma.city.findMany({
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
    
    console.log('\nStatus verificado:');
    cities.forEach(c => console.log(`  ${c.name}: ${c.status}`));
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStatus();

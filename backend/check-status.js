const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
  try {
    const cities = await prisma.city.findMany({
      where: {
        name: {
          in: ['Nova Monte Verde', 'Nova Bandeirantes']
        }
      },
      select: {
        id: true,
        name: true,
        status: true
      }
    });
    
    console.log('Status das cidades no banco PostgreSQL:');
    console.log('========================================');
    cities.forEach(c => {
      console.log(`${c.name} (ID: ${c.id}): ${c.status}`);
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();

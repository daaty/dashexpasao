const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllCities() {
  try {
    const cities = await prisma.city.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        population: true,
        population15to44: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`📊 Total de cidades no banco: ${cities.length}\n`);
    console.log('=' .repeat(80));
    
    cities.forEach(city => {
      console.log(`${city.name} (ID: ${city.id})`);
      console.log(`  Status: ${city.status}`);
      console.log(`  População: ${city.population || 'N/A'}`);
      console.log(`  População 15-44: ${city.population15to44 || 'N/A'}`);
      console.log('');
    });
    
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllCities();

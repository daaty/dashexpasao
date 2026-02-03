const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('========================================');
  console.log('VERIFICANDO STATUS NO BANCO vs API');
  console.log('========================================');
  
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
  
  console.log('BANCO DE DADOS:');
  for (const city of cities) {
    console.log(`${city.name}: ${city.status} (ID: ${city.id})`);
  }
  
  // Testar API
  console.log('\n========================================');
  console.log('TESTANDO API:');
  
  for (const city of cities) {
    try {
      const response = await fetch(`http://localhost:3001/api/cities/${city.id}`);
      const data = await response.json();
      console.log(`${city.name} via API: ${data.data.status}`);
    } catch (error) {
      console.log(`Erro na API para ${city.name}:`, error.message);
    }
  }
  
  await prisma.$disconnect();
}

test().catch(console.error);

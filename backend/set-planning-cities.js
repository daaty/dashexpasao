const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setPlanningCities() {
  try {
    console.log('🔄 Atualizando cidades para status PLANNING...');

    // Lista de cidades para definir como PLANNING
    const planningCities = [
      'Nova Monte Verde',
      'Paranaíta',
      'Apiacás',
      'Alta Floresta',
      'Guarantã do Norte',
      'Peixoto de Azevedo'
    ];

    for (const cityName of planningCities) {
      const result = await prisma.city.updateMany({
        where: { name: cityName },
        data: { status: 'PLANNING' }
      });
      
      if (result.count > 0) {
        console.log(`✅ ${cityName} -> PLANNING`);
      } else {
        console.log(`⚠️  ${cityName} não encontrada`);
      }
    }

    // Verificar quantas cidades ficaram com status PLANNING
    const planningCount = await prisma.city.count({
      where: { status: 'PLANNING' }
    });

    console.log(`\n✅ Total de cidades com status PLANNING: ${planningCount}`);

    // Listar as cidades com status PLANNING
    const cities = await prisma.city.findMany({
      where: { status: 'PLANNING' },
      select: { id: true, name: true, status: true }
    });

    console.log('\n📋 Cidades com status PLANNING:');
    cities.forEach(city => {
      console.log(`   - ${city.name} (ID: ${city.id})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setPlanningCities();

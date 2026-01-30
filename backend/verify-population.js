const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyCityPopulation() {
  try {
    console.log('🔍 Verificando dados de população atualizados...\n');
    
    const cities = await prisma.city.findMany({
      where: {
        name: {
          in: [
            'Nova Monte Verde',
            'Paranaíta',
            'Apiacás',
            'Alta Floresta',
            'Guarantã do Norte',
            'Peixoto de Azevedo'
          ]
        }
      },
      select: {
        id: true,
        name: true,
        population: true,
        population15to44: true,
        status: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('=' .repeat(80));
    console.log('📊 DADOS DE POPULAÇÃO CONFIRMADOS NO BANCO DE DADOS');
    console.log('='.repeat(80));
    console.log('');
    
    if (cities.length === 0) {
      console.log('⚠️  Nenhuma cidade encontrada!');
    } else {
      for (const city of cities) {
        console.log(`📍 ${city.name} (ID: ${city.id}) - Status: ${city.status}`);
        console.log(`   População Total: ${city.population?.toLocaleString('pt-BR') || 'N/A'}`);
        console.log(`   População 15-44: ${city.population15to44?.toLocaleString('pt-BR') || 'N/A'}`);
        if (city.population && city.population15to44) {
          const percentage = ((city.population15to44 / city.population) * 100).toFixed(1);
          console.log(`   Percentual 15-44: ${percentage}%`);
        }
        console.log('');
      }
      
      console.log('='.repeat(80));
      console.log(`✅ Total de cidades verificadas: ${cities.length}`);
      console.log('='.repeat(80));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCityPopulation();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceUpdateAndLock() {
  console.log('🔧 FORÇANDO ATUALIZAÇÃO DEFINITIVA...');
  
  try {
    // 1. Atualizar no banco
    await prisma.city.updateMany({
      where: {
        name: {
          in: ['Nova Monte Verde', 'Nova Bandeirantes']
        }
      },
      data: {
        status: 'CONSOLIDATED'
      }
    });
    
    console.log('✅ Status atualizado no banco para CONSOLIDATED');
    
    // 2. Verificar se persistiu
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
    
    console.log('📊 Status atual no banco:');
    cities.forEach(city => {
      console.log(`${city.name}: ${city.status}`);
    });
    
    // 3. Reiniciar backend para recarregar dados
    console.log('\n⚠️  REINICIE O BACKEND PARA APLICAR AS MUDANÇAS');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceUpdateAndLock();
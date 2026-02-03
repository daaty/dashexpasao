const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('🏙️ CIDADES NO BANCO DE DADOS:\n');
    const cities = await prisma.city.findMany({
      select: { id: true, name: true, status: true }
    });
    
    cities.forEach(city => {
      console.log(`"${city.name}" (ID: ${city.id}, Status: ${city.status})`);
    });
    
    console.log('\n\n📊 COMPARAÇÃO COM FALLBACK VALUES:\n');
    const fallbackValues = {
      'Nova Monte Verde': 961,
      'Nova Bandeirantes': 1529,
      'Apiacás': 48,
      'Paranaíta': 57
    };
    
    console.log('Fallback values:');
    Object.entries(fallbackValues).forEach(([name, value]) => {
      const found = cities.find(c => c.name === name);
      console.log(`"${name}" = ${found ? '✅ ENCONTRADA' : '❌ NÃO ENCONTRADA'} (R$ ${value})`);
    });
    
  } finally {
    await prisma.$disconnect();
  }
})();

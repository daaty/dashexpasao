const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixConsolidated() {
    console.log('Atualizando Nova Bandeirantes e Nova Monte Verde para CONSOLIDATED...');
    
    // Atualizar status para CONSOLIDATED
    const result = await prisma.city.updateMany({
        where: {
            name: { in: ['Nova Bandeirantes', 'Nova Monte Verde'] }
        },
        data: {
            status: 'CONSOLIDATED'
        }
    });
    
    console.log(`${result.count} cidades atualizadas para CONSOLIDATED`);
    
    // Verificar resultado
    const cities = await prisma.city.findMany({
        where: {
            name: { in: ['Nova Bandeirantes', 'Nova Monte Verde'] }
        },
        select: {
            id: true,
            name: true,
            status: true,
            implementationStartDate: true
        }
    });
    
    console.log('\nStatus atualizado:');
    cities.forEach(c => {
        console.log(`  ${c.name} (ID: ${c.id}): ${c.status} | Implementação: ${c.implementationStartDate}`);
    });
    
    await prisma.$disconnect();
}

fixConsolidated().catch(console.error);

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('=== Verificando cidades com planejamentos ===\n');
    
    // Buscar todas as cidades com planejamentos
    const plannings = await prisma.planning.findMany({
        include: { city: true }
    });
    
    const cityIdsWithPlanning = [...new Set(plannings.map(p => p.cityId))];
    
    console.log('Cidades com planejamentos:');
    for (const cityId of cityIdsWithPlanning) {
        const city = await prisma.city.findUnique({ where: { id: cityId } });
        if (city) {
            console.log(`  - ${city.name} | Status atual: ${city.status} | ID: ${city.id}`);
            
            // Se não está com status Planning, atualizar
            if (city.status !== 'Planning' && city.status !== 'Implementation' && city.status !== 'Consolidated') {
                console.log(`    ➡️ Atualizando para Planning...`);
                await prisma.city.update({
                    where: { id: cityId },
                    data: { status: 'Planning' }
                });
                console.log(`    ✅ Atualizado!`);
            }
        }
    }
    
    console.log('\n=== Status finais ===\n');
    
    const updatedCities = await prisma.city.findMany({
        where: { id: { in: cityIdsWithPlanning } }
    });
    
    updatedCities.forEach(c => console.log(`  - ${c.name} | Status: ${c.status}`));
}

main()
    .catch(e => console.error('Erro:', e))
    .finally(() => prisma.$disconnect());

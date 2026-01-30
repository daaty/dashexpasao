const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeDuplicates() {
    console.log('=== Removendo planejamentos duplicados ===\n');
    
    const plannings = await prisma.planning.findMany({
        include: { city: true },
        orderBy: { createdAt: 'asc' }
    });
    
    // Agrupar por cityId
    const byCity = {};
    plannings.forEach(p => {
        if (!byCity[p.cityId]) byCity[p.cityId] = [];
        byCity[p.cityId].push(p);
    });
    
    // Encontrar e remover duplicados
    for (const [cityId, plans] of Object.entries(byCity)) {
        if (plans.length > 1) {
            console.log(`Cidade com duplicados: ${plans[0].city?.name} (${plans.length} planejamentos)`);
            
            // Manter o primeiro, deletar os outros
            for (let i = 1; i < plans.length; i++) {
                console.log(`  ❌ Deletando: ${plans[i].id}`);
                await prisma.planning.delete({ where: { id: plans[i].id } });
            }
            console.log(`  ✅ Mantido: ${plans[0].id}`);
        }
    }
    
    console.log('\n=== Resultado final ===');
    const remaining = await prisma.planning.findMany({ include: { city: true } });
    console.log(`Total de planejamentos: ${remaining.length}`);
    remaining.forEach(p => console.log(`  - ${p.city?.name} | ID: ${p.id}`));
    
    await prisma.$disconnect();
}

removeDuplicates().catch(e => { console.error(e); process.exit(1); });

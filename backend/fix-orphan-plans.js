const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOrphanPlanningResults() {
    console.log('🔧 Corrigindo PlanningResults órfãos...\n');
    
    // Buscar todos os PlanningResults
    const allResults = await prisma.planningResults.findMany({
        select: { cityId: true }
    });
    
    // Buscar todos os Planning
    const allPlans = await prisma.planning.findMany({
        select: { cityId: true }
    });
    
    const planCityIds = new Set(allPlans.map(p => p.cityId));
    
    // Identificar cidades órfãs (com PlanningResults mas sem Planning)
    const orphanCityIds = [...new Set(allResults.map(r => r.cityId))].filter(id => !planCityIds.has(id));
    
    console.log(`📊 Encontradas ${orphanCityIds.length} cidades com PlanningResults mas sem Planning\n`);
    
    // Buscar nomes das cidades órfãs
    const orphanCities = await prisma.city.findMany({
        where: { id: { in: orphanCityIds } },
        select: { id: true, name: true, implementationStartDate: true }
    });
    
    let created = 0;
    
    for (const city of orphanCities) {
        console.log(`  Creating Planning for: ${city.name} (ID: ${city.id})`);
        
        try {
            await prisma.planning.create({
                data: {
                    cityId: city.id,
                    title: `Expansão em ${city.name}`,
                    description: `Planejamento de expansão para ${city.name}`,
                    startDate: city.implementationStartDate || new Date(),
                    status: 'active',
                    priority: 'medium',
                    tags: 'expansão'
                }
            });
            created++;
            console.log(`    ✅ Criado`);
        } catch (err) {
            console.log(`    ❌ Erro:`, err.message);
        }
    }
    
    console.log(`\n✅ ${created} registros de Planning criados!`);
    
    // Verificar resultado
    const finalPlans = await prisma.planning.count();
    const finalResults = await prisma.planningResults.count();
    
    console.log(`\n📊 Estado final:`);
    console.log(`   Planning: ${finalPlans} registros`);
    console.log(`   PlanningResults: ${finalResults} registros`);
    
    await prisma.$disconnect();
}

fixOrphanPlanningResults().catch(console.error);

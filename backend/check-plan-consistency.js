const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const plans = await prisma.planning.findMany({
        select: { id: true, cityId: true, title: true }
    });
    const results = await prisma.planningResults.findMany({
        select: { id: true, cityId: true }
    });
    
    console.log('Planning:', plans.length, 'registros');
    console.log('PlanningResults:', results.length, 'registros');
    
    console.log('\n=== Cidades com Planning ===');
    plans.forEach(pl => console.log('  - CityId:', pl.cityId, '| Title:', pl.title));
    
    console.log('\n=== Cidades com PlanningResults ===');
    results.forEach(r => console.log('  - CityId:', r.cityId));
    
    // Identificar inconsistências
    const planCityIds = new Set(plans.map(p => p.cityId));
    const resultCityIds = new Set(results.map(r => r.cityId));
    
    console.log('\n=== INCONSISTÊNCIAS ===');
    
    // Cidades com PlanningResults mas sem Planning
    const orphanResults = [...resultCityIds].filter(id => !planCityIds.has(id));
    if (orphanResults.length > 0) {
        console.log('\n⚠️ Cidades com PlanningResults mas SEM Planning:');
        orphanResults.forEach(id => console.log('  - CityId:', id));
    }
    
    // Cidades com Planning mas sem PlanningResults
    const orphanPlans = [...planCityIds].filter(id => !resultCityIds.has(id));
    if (orphanPlans.length > 0) {
        console.log('\n⚠️ Cidades com Planning mas SEM PlanningResults:');
        orphanPlans.forEach(id => console.log('  - CityId:', id));
    }
    
    await prisma.$disconnect();
}
check().catch(console.error);

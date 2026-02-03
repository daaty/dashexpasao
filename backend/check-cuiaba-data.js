const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    // Verificar estrutura de Cuiabá
    const cuiaba = await prisma.planningResults.findFirst({
        where: { cityId: 5103403 }
    });
    
    if (cuiaba && cuiaba.results) {
        console.log('========================================');
        console.log('Cuiabá (ID: 5103403) - PlanningResults:');
        console.log('========================================');
        const results = cuiaba.results;
        Object.keys(results).slice(0, 6).forEach(key => {
            const r = results[key];
            console.log('\n' + key + ':');
            console.log('  rides:', r.rides);
            console.log('  marketingCost:', r.marketingCost);
            console.log('  projectedMarketing:', r.projectedMarketing);
            console.log('  operationalCost:', r.operationalCost);
            console.log('  projectedOperational:', r.projectedOperational);
            console.log('  projectedRevenue:', r.projectedRevenue);
        });
    }
    
    // Verificar também os planos (Planning table)
    const plannings = await prisma.planning.findMany({
        where: { cityId: 5103403 },
        select: { id: true, cityId: true, startDate: true }
    });
    console.log('\n\nPlannings de Cuiabá:', plannings);
    
    await prisma.$disconnect();
}
check().catch(console.error);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
    try {
        console.log('📊 Verificando tabelas do banco de dados...\n');
        
        // PlanDetails
        const planDetails = await prisma.planDetails.findMany();
        console.log(`PlanDetails: ${planDetails.length} registros`);
        planDetails.forEach(pd => {
            console.log(`  - Cidade ${pd.cityId}: ${pd.phases ? 'tem phases' : 'sem phases'}`);
        });
        
        // MarketBlock
        const marketBlocks = await prisma.marketBlock.findMany();
        console.log(`\nMarketBlocks: ${marketBlocks.length} registros`);
        
        // PlanningResults
        const results = await prisma.planningResults.findMany();
        console.log(`\nPlanningResults: ${results.length} registros`);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkTables();

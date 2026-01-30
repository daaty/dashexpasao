const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('=== Verificando cidades com status Planning ===\n');
    
    const planningCities = await prisma.city.findMany({
        where: { status: 'Planning' }
    });
    
    console.log(`Cidades com status Planning: ${planningCities.length}`);
    planningCities.forEach(c => console.log(`  - ${c.name} (ID: ${c.id})`));
    
    console.log('\n=== Verificando planejamentos no banco ===\n');
    
    const plannings = await prisma.planning.findMany({
        include: { city: true }
    });
    
    console.log(`Total de planejamentos: ${plannings.length}`);
    plannings.forEach(p => console.log(`  - Cidade: ${p.city?.name || p.cityId} | ID: ${p.id} | Status: ${p.status}`));
    
    console.log('\n=== Verificando PlanDetails ===\n');
    
    const planDetails = await prisma.planDetails.findMany();
    console.log(`Total de PlanDetails: ${planDetails.length}`);
    
    console.log('\n=== Verificando PlanningResults ===\n');
    
    const results = await prisma.planningResults.findMany();
    console.log(`Total de PlanningResults: ${results.length}`);
    
    console.log('\n=== Verificando MarketBlocks ===\n');
    
    const blocks = await prisma.marketBlock.findMany();
    console.log(`Total de MarketBlocks: ${blocks.length}`);
    blocks.forEach(b => console.log(`  - ${b.name} | Cidades: ${b.cityIds?.length || 0}`));
}

main()
    .catch(e => console.error('Erro:', e))
    .finally(() => prisma.$disconnect());

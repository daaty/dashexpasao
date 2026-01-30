const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkResults() {
    try {
        const results = await prisma.planningResults.findMany();
        
        console.log('\n📊 PLANNING RESULTS NO BANCO DE DADOS:');
        console.log('=====================================');
        console.log(`Total de registros: ${results.length}\n`);
        
        results.forEach(r => {
            const resultsCount = r.results ? Object.keys(r.results).length : 0;
            const realCostsCount = r.realMonthlyCosts ? Object.keys(r.realMonthlyCosts).length : 0;
            
            console.log(`Cidade ${r.cityId}:`);
            console.log(`  - results: ${resultsCount} meses`);
            console.log(`  - realMonthlyCosts: ${realCostsCount} meses`);
            console.log(`  - startDate: ${r.startDate || 'não definido'}`);
            
            if (r.realMonthlyCosts && realCostsCount > 0) {
                console.log(`  - Custos reais salvos:`, r.realMonthlyCosts);
            }
            console.log('');
        });
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkResults();

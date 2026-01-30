const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSaveRealCosts() {
    // Cidade teste: Nova Bandeirantes = 5100250
    const cityId = 5100250;
    
    const testRealCosts = {
        '2025-08': { marketingCost: 1000, operationalCost: 500 },
        '2025-09': { marketingCost: 1500, operationalCost: 750 },
        '2025-10': { marketingCost: 2000, operationalCost: 1000 }
    };
    
    const testResults = {
        'Mes1': { rides: 100, marketingCost: 0, operationalCost: 0 },
        'Mes2': { rides: 200, marketingCost: 0, operationalCost: 0 }
    };
    
    console.log('🧪 Teste de salvamento de custos reais');
    console.log('======================================');
    console.log(`Cidade: ${cityId}`);
    console.log('Dados a salvar:', { results: testResults, realMonthlyCosts: testRealCosts });
    
    try {
        // Salvar
        const saved = await prisma.planningResults.upsert({
            where: { cityId },
            update: {
                results: testResults,
                realMonthlyCosts: testRealCosts,
                updatedAt: new Date()
            },
            create: {
                cityId,
                results: testResults,
                realMonthlyCosts: testRealCosts
            }
        });
        
        console.log('\n✅ Salvamento executado!');
        console.log('Resultado:', saved);
        
        // Verificar
        const check = await prisma.planningResults.findUnique({
            where: { cityId }
        });
        
        console.log('\n📊 Verificação após salvamento:');
        console.log('  results:', check.results ? Object.keys(check.results).length : 0, 'meses');
        console.log('  realMonthlyCosts:', check.realMonthlyCosts ? Object.keys(check.realMonthlyCosts).length : 0, 'meses');
        console.log('  Dados completos:', JSON.stringify(check.realMonthlyCosts, null, 2));
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSaveRealCosts();

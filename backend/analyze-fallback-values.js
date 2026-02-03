const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Analisa os PlanningResults salvos para calcular médias de CPA/OPS
 * que serão usadas como fallback mais realistas
 */
async function analyzeSavedProjections() {
    console.log('📊 Analisando projeções salvas para calcular fallback adequado...\n');
    
    // Buscar todos os PlanningResults
    const allResults = await prisma.planningResults.findMany();
    
    // Buscar informações das cidades
    const cityIds = allResults.map(r => r.cityId);
    const cities = await prisma.city.findMany({
        where: { id: { in: cityIds } }
    });
    const cityMap = new Map(cities.map(c => [c.id, c]));
    
    // Categorias por tamanho de cidade
    const categories = {
        grande: { cities: [], totals: { rides: 0, marketing: 0, operational: 0, count: 0 } }, // > 100k
        media: { cities: [], totals: { rides: 0, marketing: 0, operational: 0, count: 0 } },   // 50k-100k
        pequena: { cities: [], totals: { rides: 0, marketing: 0, operational: 0, count: 0 } }  // < 50k
    };
    
    console.log('='.repeat(70));
    console.log('ANÁLISE POR CIDADE:');
    console.log('='.repeat(70));
    
    for (const result of allResults) {
        const city = cityMap.get(result.cityId);
        if (!city || !result.results) continue;
        
        let cityTotals = { rides: 0, marketing: 0, operational: 0, months: 0 };
        
        // Somar dados de todos os meses (Mes1 a Mes12)
        for (let i = 1; i <= 12; i++) {
            const mesKey = `Mes${i}`;
            const mes = result.results[mesKey];
            if (mes) {
                cityTotals.rides += mes.rides || 0;
                cityTotals.marketing += mes.projectedMarketing || mes.marketingCost || 0;
                cityTotals.operational += mes.projectedOperational || mes.operationalCost || 0;
                cityTotals.months++;
            }
        }
        
        if (cityTotals.rides > 0) {
            const avgCPA = cityTotals.marketing / cityTotals.rides;
            const avgOPS = cityTotals.operational / cityTotals.rides;
            
            console.log(`\n${city.name} (pop: ${city.population?.toLocaleString('pt-BR')})`);
            console.log(`  Meses analisados: ${cityTotals.months}`);
            console.log(`  Total corridas: ${cityTotals.rides.toLocaleString('pt-BR')}`);
            console.log(`  Total Marketing: R$ ${cityTotals.marketing.toFixed(2)}`);
            console.log(`  Total Operacional: R$ ${cityTotals.operational.toFixed(2)}`);
            console.log(`  CPA médio: R$ ${avgCPA.toFixed(2)}/corrida`);
            console.log(`  OPS médio: R$ ${avgOPS.toFixed(2)}/corrida`);
            
            // Categorizar
            let cat;
            if (city.population > 100000) {
                cat = categories.grande;
            } else if (city.population > 50000) {
                cat = categories.media;
            } else {
                cat = categories.pequena;
            }
            
            cat.cities.push(city.name);
            cat.totals.rides += cityTotals.rides;
            cat.totals.marketing += cityTotals.marketing;
            cat.totals.operational += cityTotals.operational;
            cat.totals.count++;
        }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('MÉDIAS POR CATEGORIA:');
    console.log('='.repeat(70));
    
    const recommendations = {};
    
    for (const [catName, data] of Object.entries(categories)) {
        if (data.totals.rides > 0) {
            const avgCPA = data.totals.marketing / data.totals.rides;
            const avgOPS = data.totals.operational / data.totals.rides;
            
            console.log(`\n📊 Cidades ${catName.toUpperCase()} (${data.totals.count} cidades):`);
            console.log(`   Cidades: ${data.cities.join(', ')}`);
            console.log(`   Total corridas: ${data.totals.rides.toLocaleString('pt-BR')}`);
            console.log(`   CPA médio: R$ ${avgCPA.toFixed(2)}/corrida`);
            console.log(`   OPS médio: R$ ${avgOPS.toFixed(2)}/corrida`);
            
            recommendations[catName] = { cpa: avgCPA, ops: avgOPS };
        }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 VALORES RECOMENDADOS PARA FALLBACK:');
    console.log('='.repeat(70));
    
    // Calcular valores para o código
    const grande = recommendations.grande || { cpa: 1.5, ops: 1.0 };
    const media = recommendations.media || { cpa: 1.5, ops: 1.0 };
    const pequena = recommendations.pequena || { cpa: 2.0, ops: 1.2 };
    
    console.log(`\n// Valores baseados nas projeções salvas:`);
    console.log(`let baseCPA = city.population > 100000 ? ${grande.cpa.toFixed(2)} : city.population > 50000 ? ${media.cpa.toFixed(2)} : ${pequena.cpa.toFixed(2)};`);
    console.log(`let baseOPS = city.population > 100000 ? ${grande.ops.toFixed(2)} : city.population > 50000 ? ${media.ops.toFixed(2)} : ${pequena.ops.toFixed(2)};`);
    
    // Comparação com valores atuais
    console.log('\n' + '='.repeat(70));
    console.log('📈 COMPARAÇÃO COM VALORES ATUAIS DO CÓDIGO:');
    console.log('='.repeat(70));
    console.log('\nValores ATUAIS no fallback (muito altos):');
    console.log('  Grande (>100k): CPA=R$10, OPS=R$4');
    console.log('  Média (50-100k): CPA=R$8, OPS=R$3.5');
    console.log('  Pequena (<50k): CPA=R$6, OPS=R$3');
    
    console.log('\nValores RECOMENDADOS (baseados em dados reais):');
    console.log(`  Grande (>100k): CPA=R$${grande.cpa.toFixed(2)}, OPS=R$${grande.ops.toFixed(2)}`);
    console.log(`  Média (50-100k): CPA=R$${media.cpa.toFixed(2)}, OPS=R$${media.ops.toFixed(2)}`);
    console.log(`  Pequena (<50k): CPA=R$${pequena.cpa.toFixed(2)}, OPS=R$${pequena.ops.toFixed(2)}`);
    
    await prisma.$disconnect();
    
    return { grande, media, pequena };
}

analyzeSavedProjections().catch(console.error);

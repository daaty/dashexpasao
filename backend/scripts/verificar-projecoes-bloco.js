const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Buscar o bloco "Bloco 1 - Planejamento" do banco
  const blocks = await prisma.marketBlock.findMany();
  console.log('Blocos encontrados:', blocks.map(b => ({ id: b.id, name: b.name, cidades: b.cityIds?.length || 0 })));
  
  // Usar o primeiro bloco ou buscar pelo nome
  const block = blocks.find(b => b.name.includes('Planejamento')) || blocks[0];
  
  if (!block) {
    console.log('❌ Nenhum bloco encontrado');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`\n📦 Usando bloco: ${block.name} (${block.cityIds?.length || 0} cidades)`);
  
  // Buscar cidades do bloco
  const cities = await prisma.city.findMany({
    where: { id: { in: block.cityIds || [] } }
  });
  
  // Buscar planos das cidades
  const planningResults = await prisma.planningResults.findMany({
    where: { cityId: { in: cities.map(c => c.id) } }
  });
  
  // Mapear planos para cidades
  const citiesWithPlan = cities.map(city => ({
    ...city,
    planResult: planningResults.find(p => p.cityId === city.id)
  }));
  
  console.log('📊 ANÁLISE: Projeções 6 Meses - ' + block.name);
  console.log('='.repeat(60));
  console.log('Cidades no bloco:', citiesWithPlan.length);
  
  // Listar cidades
  console.log('\nCidades:');
  citiesWithPlan.forEach(c => {
    console.log(`  - ${c.name} (pop15-44: ${c.population15to44?.toLocaleString('pt-BR') || 0})`);
  });
  
  // Mesmos valores do código frontend
  const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  
  let totals6M = {
    goal: 0,
    marketingCost: 0,
    operationalCost: 0,
    revenue: 0
  };
  
  // Para cada mês
  for (let m = 0; m < 6; m++) {
    let monthTotal = { goal: 0, mkt: 0, ops: 0, rev: 0 };
    
    citiesWithPlan.forEach(city => {
      if (!city.population15to44) return;
      
      const factor = curveFactors[m];
      const goal = Math.round(city.population15to44 * factor * 0.10);
      
      // CPA/OPS padrão (mesma lógica do frontend)
      let baseCPA = city.population > 100000 ? 10 : city.population > 50000 ? 8 : 6;
      let baseOPS = city.population > 100000 ? 4 : city.population > 50000 ? 3.5 : 3;
      
      const cpaReduction = 1 - (m * 0.1);
      const opsReduction = 1 - (m * 0.08);
      
      const cpa = baseCPA * cpaReduction;
      const ops = baseOPS * opsReduction;
      
      monthTotal.goal += goal;
      monthTotal.mkt += goal * cpa;
      monthTotal.ops += goal * ops;
      monthTotal.rev += goal * 2.5;
    });
    
    console.log('\n' + monthNames[m] + ' (Mês ' + (m+1) + '):');
    console.log('  Meta:', monthTotal.goal.toLocaleString('pt-BR'), 'corridas');
    console.log('  Marketing: R$', monthTotal.mkt.toFixed(2));
    console.log('  Operacional: R$', monthTotal.ops.toFixed(2));
    console.log('  Receita: R$', monthTotal.rev.toFixed(2));
    
    totals6M.goal += monthTotal.goal;
    totals6M.marketingCost += monthTotal.mkt;
    totals6M.operationalCost += monthTotal.ops;
    totals6M.revenue += monthTotal.rev;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📈 TOTAIS 6 MESES (Calculados pelo código do Bloco):');
  console.log('  Meta Total:', totals6M.goal.toLocaleString('pt-BR'), 'corridas');
  console.log('  Marketing Total: R$', totals6M.marketingCost.toFixed(2));
  console.log('  Operacional Total: R$', totals6M.operationalCost.toFixed(2));
  console.log('  Receita Total: R$', totals6M.revenue.toFixed(2));
  console.log('  Custo Total: R$', (totals6M.marketingCost + totals6M.operationalCost).toFixed(2));
  console.log('  Margem: R$', (totals6M.revenue - totals6M.marketingCost - totals6M.operationalCost).toFixed(2));
  
  // Agora verificar os planos individuais salvos
  console.log('\n' + '='.repeat(60));
  console.log('📋 PLANOS INDIVIDUAIS SALVOS (PlanningResults.results):');
  
  let savedTotals = { mkt: 0, ops: 0, goal: 0 };
  
  for (const city of citiesWithPlan) {
    if (city.planResult && city.planResult.results) {
      const results = city.planResult.results;
      let cityMkt = 0, cityOps = 0, cityGoal = 0;
      
      for (let i = 1; i <= 6; i++) {
        const mesKey = `Mes${i}`;
        if (results[mesKey]) {
          // Usar os nomes corretos dos campos
          cityMkt += results[mesKey].projectedMarketing || results[mesKey].marketingCost || 0;
          cityOps += results[mesKey].projectedOperational || results[mesKey].operationalCost || 0;
          cityGoal += results[mesKey].rides || 0;
        }
      }
      
      if (cityMkt > 0 || cityOps > 0 || cityGoal > 0) {
        console.log(`  ${city.name}: Meta ${cityGoal}, Mkt R$${cityMkt.toFixed(2)}, Ops R$${cityOps.toFixed(2)}`);
        savedTotals.mkt += cityMkt;
        savedTotals.ops += cityOps;
        savedTotals.goal += cityGoal;
      }
    }
  }
  
  console.log('\n  TOTAL dos Planos Salvos:');
  console.log('    Meta:', savedTotals.goal.toLocaleString('pt-BR'));
  console.log('    Marketing: R$', savedTotals.mkt.toFixed(2));
  console.log('    Operacional: R$', savedTotals.ops.toFixed(2));
  
  // Comparação
  console.log('\n' + '='.repeat(60));
  console.log('🔍 COMPARAÇÃO:');
  console.log('                        BLOCO          PLANOS SALVOS    DIFERENÇA');
  console.log('  Meta:              ', totals6M.goal.toLocaleString('pt-BR').padStart(10), savedTotals.goal.toLocaleString('pt-BR').padStart(15), (totals6M.goal - savedTotals.goal).toLocaleString('pt-BR').padStart(12));
  console.log('  Marketing:     R$', totals6M.marketingCost.toFixed(2).padStart(12), 'R$', savedTotals.mkt.toFixed(2).padStart(10), 'R$', (totals6M.marketingCost - savedTotals.mkt).toFixed(2).padStart(10));
  console.log('  Operacional:   R$', totals6M.operationalCost.toFixed(2).padStart(12), 'R$', savedTotals.ops.toFixed(2).padStart(10), 'R$', (totals6M.operationalCost - savedTotals.ops).toFixed(2).padStart(10));
  
  await prisma.$disconnect();
}

main().catch(console.error);

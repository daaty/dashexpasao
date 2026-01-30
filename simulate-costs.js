// Simulação dos cálculos de custo para verificar se estão corretos

// Função getGradualMonthlyGoal simulada
function getGradualMonthlyGoal(city, monthKey, implementationStartDate) {
    const [year, month] = monthKey.split('-').map(Number);
    const [impYear, impMonth] = implementationStartDate.split('-').map(Number);
    
    // Calcular quantos meses passaram desde a implementação
    const monthsFromImplementation = (year - impYear) * 12 + (month - impMonth);
    
    if (monthsFromImplementation < 0) return 0; // Antes da implementação
    
    const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0];
    const targetPenetration = 0.10;
    
    // Meta base da cidade (100% = meta máxima)
    const cityBaseGoal = Math.round(city.population15to44 * targetPenetration);
    
    // Determinar o fator da curva baseado no mês
    const curveIndex = Math.min(monthsFromImplementation, curveFactors.length - 1);
    const factor = curveFactors[curveIndex];
    
    return Math.round(cityBaseGoal * factor);
}

// Dados das cidades do bloco Nova Bandeirantes + Paranaíta
const cities = [
    {
        id: 1,
        name: 'Nova Bandeirantes',
        population15to44: 3150,
        implementationStartDate: '2024-12-01'
    },
    {
        id: 2,
        name: 'Nova Monte Verde',
        population15to44: 1180,
        implementationStartDate: '2024-12-01'
    },
    {
        id: 3,
        name: 'Apiacás',
        population15to44: 317,
        implementationStartDate: '2025-01-01'
    },
    {
        id: 4,
        name: 'Paranaíta',
        population15to44: 570,
        implementationStartDate: '2025-01-01'
    }
];

console.log('=== SIMULAÇÃO CÁLCULO DE CUSTOS ===\n');

// Parâmetros
const marketingCostPerRide = 0.15;
const operationalCostPerRide = 0.20;
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;

console.log(`Data atual: ${currentYear}-${String(currentMonth).padStart(2, '0')}\n`);

let totalProjectedMarketingCost = 0;
let totalProjectedOperationalCost = 0;
let totalAccumulatedGoal = 0;

for (const city of cities) {
    console.log(`\n=== ${city.name} ===`);
    console.log(`População 15-44: ${city.population15to44}`);
    console.log(`Implementação: ${city.implementationStartDate}`);
    
    const [impYear, impMonth] = city.implementationStartDate.split('-').map(Number);
    const monthsSinceStart = (currentYear - impYear) * 12 + (currentMonth - impMonth) + 1;
    
    if (monthsSinceStart <= 0) {
        console.log('Implementação futura');
        continue;
    }
    
    console.log(`Meses desde implementação: ${monthsSinceStart}`);
    
    let cityProjectedMarketing = 0;
    let cityProjectedOperational = 0;
    let cityAccumulatedGoal = 0;
    
    let tempYear = impYear;
    let tempMonth = impMonth;
    
    console.log('\nMês a mês:');
    
    for (let m = 1; m <= monthsSinceStart; m++) {
        const monthKey = `${tempYear}-${String(tempMonth).padStart(2, '0')}`;
        const monthGoal = getGradualMonthlyGoal(city, monthKey, city.implementationStartDate);
        const monthMarketingCost = monthGoal * marketingCostPerRide;
        const monthOperationalCost = monthGoal * operationalCostPerRide;
        
        cityAccumulatedGoal += monthGoal;
        cityProjectedMarketing += monthMarketingCost;
        cityProjectedOperational += monthOperationalCost;
        
        console.log(`  ${monthKey}: Meta ${monthGoal} | Mkt R$${monthMarketingCost.toFixed(2)} | Ops R$${monthOperationalCost.toFixed(2)}`);
        
        // Avançar mês
        tempMonth++;
        if (tempMonth > 12) {
            tempMonth = 1;
            tempYear++;
        }
    }
    
    console.log(`\nTotais da cidade:`);
    console.log(`  Meta acumulada: ${cityAccumulatedGoal}`);
    console.log(`  Custo Marketing: R$${cityProjectedMarketing.toFixed(2)}`);
    console.log(`  Custo Operacional: R$${cityProjectedOperational.toFixed(2)}`);
    console.log(`  Custo Total: R$${(cityProjectedMarketing + cityProjectedOperational).toFixed(2)}`);
    
    totalAccumulatedGoal += cityAccumulatedGoal;
    totalProjectedMarketingCost += cityProjectedMarketing;
    totalProjectedOperationalCost += cityProjectedOperational;
}

console.log('\n=== TOTAIS DO BLOCO ===');
console.log(`Meta acumulada total: ${totalAccumulatedGoal}`);
console.log(`Custo Marketing total: R$${totalProjectedMarketingCost.toFixed(2)}`);
console.log(`Custo Operacional total: R$${totalProjectedOperationalCost.toFixed(2)}`);
console.log(`Custo Total: R$${(totalProjectedMarketingCost + totalProjectedOperationalCost).toFixed(2)}`);

// KPIs finais
const cpaMkt = totalProjectedMarketingCost / Math.max(totalAccumulatedGoal, 1);
const opsPass = totalProjectedOperationalCost / Math.max(totalAccumulatedGoal, 1);
const custoTotal = totalProjectedMarketingCost + totalProjectedOperationalCost;
const custoCorreda = custoTotal / Math.max(totalAccumulatedGoal, 1);

console.log('\n=== KPIs FINAIS ===');
console.log(`CPA Marketing: R$${cpaMkt.toFixed(4)} (R$${cpaMkt.toFixed(2)})`);
console.log(`OPS por Passageiro: R$${opsPass.toFixed(4)} (R$${opsPass.toFixed(2)})`);
console.log(`Custo Total: R$${(custoTotal / 1000).toFixed(1)}k`);
console.log(`Custo por Corrida: R$${custoCorreda.toFixed(2)}`);

// Verificar se os valores estão coerentes
console.log('\n=== VERIFICAÇÃO ===');
console.log(`Custo por corrida esperado: R$${(marketingCostPerRide + operationalCostPerRide).toFixed(2)}`);
console.log(`Custo por corrida calculado: R$${custoCorreda.toFixed(2)}`);
console.log(`Valores coincidem: ${Math.abs(custoCorreda - (marketingCostPerRide + operationalCostPerRide)) < 0.01 ? 'SIM ✓' : 'NÃO ✗'}`);
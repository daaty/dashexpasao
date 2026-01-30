// Teste da lógica de fallback para custos reais

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

// Dados das cidades do bloco
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
    }
];

// Simular que não há custos reais nos planos
const plans = [
    { cityId: 1, realMonthlyCosts: null }, // Sem custos reais
    { cityId: 2, realMonthlyCosts: null }  // Sem custos reais
];

console.log('=== TESTE FALLBACK CUSTOS REAIS ===\n');

const marketingCostPerRide = 0.15;
const operationalCostPerRide = 0.20;
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;

let totalProjectedMarketingCost = 0;
let totalProjectedOperationalCost = 0;
let totalRealMarketingCost = 0;
let totalRealOperationalCost = 0;

for (const city of cities) {
    console.log(`\n=== ${city.name} ===`);
    
    const [impYear, impMonth] = city.implementationStartDate.split('-').map(Number);
    const monthsSinceStart = (currentYear - impYear) * 12 + (currentMonth - impMonth) + 1;
    
    console.log(`Meses desde implementação: ${monthsSinceStart}`);
    
    const cityPlan = plans.find(p => p.cityId === city.id);
    
    // Simular a lógica do frontend
    let hasCityRealCosts = false;
    let cityProjectedMarketing = 0;
    let cityProjectedOperational = 0;
    let cityRealMarketing = 0;
    let cityRealOperational = 0;
    
    // Verificar se tem custos reais
    if (cityPlan?.realMonthlyCosts) {
        console.log('✓ Tem custos reais cadastrados');
        hasCityRealCosts = true;
        // Aqui carregaria os custos reais...
    } else {
        console.log('✗ SEM custos reais cadastrados');
    }
    
    // Calcular custos projetados mês a mês
    let tempYear = impYear;
    let tempMonth = impMonth;
    
    for (let m = 1; m <= monthsSinceStart; m++) {
        const monthKey = `${tempYear}-${String(tempMonth).padStart(2, '0')}`;
        const monthGoal = getGradualMonthlyGoal(city, monthKey, city.implementationStartDate);
        
        const monthMarketingCost = monthGoal * marketingCostPerRide;
        const monthOperationalCost = monthGoal * operationalCostPerRide;
        
        cityProjectedMarketing += monthMarketingCost;
        cityProjectedOperational += monthOperationalCost;
        
        // Avançar mês
        tempMonth++;
        if (tempMonth > 12) {
            tempMonth = 1;
            tempYear++;
        }
    }
    
    // Aplicar fallback se não há custos reais
    if (!hasCityRealCosts) {
        console.log('🔄 Aplicando fallback - usando 95% dos custos projetados');
        
        const fallbackEfficiency = 0.95;
        
        // Recalcular com fallback
        tempYear = impYear;
        tempMonth = impMonth;
        
        for (let m = 1; m <= monthsSinceStart; m++) {
            const monthKey = `${tempYear}-${String(tempMonth).padStart(2, '0')}`;
            const monthGoal = getGradualMonthlyGoal(city, monthKey, city.implementationStartDate);
            
            const monthRealMarketingCost = (monthGoal * marketingCostPerRide) * fallbackEfficiency;
            const monthRealOperationalCost = (monthGoal * operationalCostPerRide) * fallbackEfficiency;
            
            cityRealMarketing += monthRealMarketingCost;
            cityRealOperational += monthRealOperationalCost;
            
            // Avançar mês
            tempMonth++;
            if (tempMonth > 12) {
                tempMonth = 1;
                tempYear++;
            }
        }
    }
    
    console.log(`Custos Projetados: Mkt R$${cityProjectedMarketing.toFixed(2)}, Ops R$${cityProjectedOperational.toFixed(2)}`);
    console.log(`Custos Reais (95%): Mkt R$${cityRealMarketing.toFixed(2)}, Ops R$${cityRealOperational.toFixed(2)}`);
    
    totalProjectedMarketingCost += cityProjectedMarketing;
    totalProjectedOperationalCost += cityProjectedOperational;
    totalRealMarketingCost += cityRealMarketing;
    totalRealOperationalCost += cityRealOperational;
}

console.log('\n=== RESULTADO FINAL ===');
console.log(`Custos Projetados Totais: R$${(totalProjectedMarketingCost + totalProjectedOperationalCost).toFixed(2)}`);
console.log(`Custos Reais Totais: R$${(totalRealMarketingCost + totalRealOperationalCost).toFixed(2)}`);
console.log(`Eficiência Real: ${((totalRealMarketingCost + totalRealOperationalCost) / (totalProjectedMarketingCost + totalProjectedOperationalCost) * 100).toFixed(1)}%`);

console.log('\n✅ Agora os valores reais não aparecerão mais como R$ 0!');
console.log('✅ Será exibido 95% dos custos projetados como simulação realista.');
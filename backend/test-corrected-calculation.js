// Teste se o cálculo corrigido está retornando o valor esperado

// Simulação da função getGradualMonthlyGoal
function getGradualMonthlyGoal(city, monthDate, implementationStartDate) {
    const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0]; // 6 meses
    const targetPenetration = 0.10;
    
    if (!implementationStartDate) {
        return Math.round(city.population15to44 * targetPenetration);
    }
    
    let monthStr = monthDate instanceof Date 
        ? `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
        : monthDate;
    
    const [impYear, impMonth] = implementationStartDate.split('-').map(Number);
    const [curYear, curMonth] = monthStr.split('-').map(Number);
    
    const monthDiff = (curYear - impYear) * 12 + (curMonth - impMonth) + 1;
    
    if (monthDiff < 1) return 0;
    
    if (monthDiff >= 1 && monthDiff <= 6) {
        const factor = curveFactors[monthDiff - 1];
        return Math.round(city.population15to44 * factor * targetPenetration);
    }
    
    return Math.round(city.population15to44 * targetPenetration);
}

// Cidades do bloco (use as populações reais do seu sistema)
const cities = [
    { name: 'Nova Monte Verde', population15to44: 3125, implementationStartDate: '2025-08' },
    { name: 'Nova Bandeirantes', population15to44: 10062, implementationStartDate: '2025-08' },
    { name: 'Apiacás', population15to44: 2406, implementationStartDate: '2026-01' },
    { name: 'Paranaíta', population15to44: 5375, implementationStartDate: '2026-01' }
];

console.log('=== TESTE DE RECEITA PROJETADA PARA JANEIRO 2026 ===\n');

let totalCurrentMonthRevenueGoal = 0;
const revenuePerRide = 8;

cities.forEach(city => {
    const goal = getGradualMonthlyGoal(city, '2026-01', city.implementationStartDate);
    const revenue = goal * revenuePerRide;
    totalCurrentMonthRevenueGoal += revenue;
    
    console.log(`${city.name}: ${goal} corridas → R$ ${revenue}`);
});

console.log(`\nTotal: R$ ${totalCurrentMonthRevenueGoal}`);
console.log(`Em k: R$ ${(totalCurrentMonthRevenueGoal / 1000).toFixed(1)}k proj`);

// Se for menor que R$ 3.000, está correto
if (totalCurrentMonthRevenueGoal < 3000) {
    console.log('✅ Valor correto! Muito menor que os R$ 7.200 anteriores.');
} else {
    console.log('❌ Ainda está alto, precisa investigar mais.');
}
// Simulação das metas graduais para janeiro 2026

const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0]; // 6 meses
const targetPenetration = 0.10; // 10% penetração

function calculateMonthlyGoal(population15to44, implementationStart, targetMonth) {
    // Parse dates
    const [impYear, impMonth] = implementationStart.split('-').map(Number);
    const [curYear, curMonth] = targetMonth.split('-').map(Number);
    
    // Calcular diferença em meses (considerando que mês 1 é o mês da implementação)
    const monthDiff = (curYear - impYear) * 12 + (curMonth - impMonth) + 1;
    
    console.log(`Implementação: ${implementationStart}, Mês alvo: ${targetMonth}, Diferença: ${monthDiff} meses`);
    
    // Se ainda não chegou no mês 1, retorna 0
    if (monthDiff < 1) {
        return 0;
    }
    
    // Se está no primeiro ao sexto mês, usa curva gradual
    if (monthDiff >= 1 && monthDiff <= 6) {
        const factor = curveFactors[monthDiff - 1];
        const goal = Math.round(population15to44 * factor * targetPenetration);
        console.log(`  Fator: ${factor}, Meta corridas: ${goal}, Receita projetada: R$ ${goal * 8}`);
        return goal;
    }
    
    // Após 6 meses, usa meta fixa
    const goal = Math.round(population15to44 * targetPenetration);
    console.log(`  Meta fixa (após 6 meses): ${goal}, Receita projetada: R$ ${goal * 8}`);
    return goal;
}

console.log('=== METAS GRADUAIS PARA JANEIRO 2026 ===\n');

// Dados das cidades (exemplo, você pode ajustar as populações reais)
const cities = [
    { name: 'Nova Monte Verde', population15to44: 625, implementationStart: '2025-08' },      // Para dar 62.5 corridas no 6º mês
    { name: 'Nova Bandeirantes', population15to44: 2013, implementationStart: '2025-08' },  // Para dar 201.3 corridas no 6º mês  
    { name: 'Apiacas', population15to44: 1333, implementationStart: '2026-01' },           // Para dar 6 corridas no 1º mês (0.045 * 1333 * 0.1)
    { name: 'Paranaíta', population15to44: 2389, implementationStart: '2026-01' }         // Para dar 10.75 corridas no 1º mês (0.045 * 2389 * 0.1)
];

let totalGoal = 0;
let totalRevenue = 0;

cities.forEach(city => {
    console.log(`\n${city.name}:`);
    const goal = calculateMonthlyGoal(city.population15to44, city.implementationStart, '2026-01');
    totalGoal += goal;
    totalRevenue += goal * 8;
});

console.log(`\n=== TOTAIS ===`);
console.log(`Meta total de corridas: ${totalGoal}`);
console.log(`Receita projetada total: R$ ${totalRevenue}`);
console.log(`Receita projetada (k): R$ ${(totalRevenue / 1000).toFixed(1)}k`);
const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'urbantmt',
    user: 'postgres',
    password: '5432'
});

// Função getGradualMonthlyGoal inline
function getGradualMonthlyGoal(city, monthKey, implementationStartDate) {
    const [year, month] = monthKey.split('-').map(Number);
    const [impYear, impMonth] = implementationStartDate.split('-').map(Number);
    
    // Calcular quantos meses passaram desde a implementação
    const monthsFromImplementation = (year - impYear) * 12 + (month - impMonth);
    
    if (monthsFromImplementation < 0) return 0; // Antes da implementação
    
    const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0];
    const targetPenetration = 0.10;
    
    // Meta base da cidade (100% = meta máxima)
    const cityBaseGoal = Math.round(city.population_15_to_44 * targetPenetration);
    
    // Determinar o fator da curva baseado no mês
    const curveIndex = Math.min(monthsFromImplementation, curveFactors.length - 1);
    const factor = curveFactors[curveIndex];
    
    return Math.round(cityBaseGoal * factor);
}

async function checkCostsCalculation() {
    console.log('\n=== VERIFICAÇÃO DE CÁLCULOS DE CUSTO ===\n');

    try {
        // Buscar cidades do bloco Nova Bandeirantes + Paranaíta
        const citiesResult = await pool.query(`
            SELECT * FROM cities 
            WHERE name IN ('Nova Bandeirantes', 'Nova Monte Verde', 'Apiacás', 'Paranaíta')
            ORDER BY name;
        `);
        const cities = citiesResult.rows;

        console.log('Cidades encontradas:', cities.map(c => `${c.name} - Pop 15-44: ${c.population_15_to_44} - Impl: ${c.implementation_start_date}`));

        // Buscar planos para essas cidades
        const plansResult = await pool.query(`
            SELECT p.*, c.name as city_name 
            FROM plannings p
            JOIN cities c ON p.city_id = c.id
            WHERE c.name IN ('Nova Bandeirantes', 'Nova Monte Verde', 'Apiacás', 'Paranaíta')
            ORDER BY c.name;
        `);
        const plans = plansResult.rows;

        console.log('\nPlanos encontrados:', plans.map(p => `${p.city_name} - ID: ${p.id}`));

        // Parâmetros de custo
        const marketingCostPerRide = 0.15; // R$ 0.15 custo marketing por corrida
        const operationalCostPerRide = 0.20; // R$ 0.20 custo operacional por corrida
        const targetPenetration = 0.10;

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        console.log(`\nCalculando custos para ${currentMonthKey}:`);

        let totalProjectedMarketingCost = 0;
        let totalProjectedOperationalCost = 0;
        let totalAccumulatedGoal = 0;

        for (const city of cities) {
            if (!city.implementation_start_date) {
                console.log(`\n${city.name}: Sem data de implementação`);
                continue;
            }

            const [impYear, impMonth] = city.implementation_start_date.split('-').map(Number);
            const monthsSinceStart = (currentYear - impYear) * 12 + (currentMonth - impMonth) + 1;

            if (monthsSinceStart <= 0) {
                console.log(`\n${city.name}: Implementação futura`);
                continue;
            }

            console.log(`\n${city.name}:`);
            console.log(`  - Implementação: ${city.implementation_start_date}`);
            console.log(`  - Meses desde início: ${monthsSinceStart}`);
            console.log(`  - População 15-44: ${city.population_15_to_44}`);

            // Meta base da cidade
            const cityBaseGoal = Math.round(city.population_15_to_44 * targetPenetration);
            console.log(`  - Meta base (10% pop): ${cityBaseGoal}`);

            // Calcular custos mês a mês desde implementação
            let cityAccumulatedGoal = 0;
            let cityProjectedMarketingCost = 0;
            let cityProjectedOperationalCost = 0;

            let tempYear = impYear;
            let tempMonth = impMonth;
            
            console.log(`  - Detalhamento mês a mês:`);
            
            for (let m = 1; m <= monthsSinceStart; m++) {
                const monthKey = `${tempYear}-${String(tempMonth).padStart(2, '0')}`;
                
                // Usar a função de graduação real
                const monthGoal = getGradualMonthlyGoal(city, monthKey, city.implementation_start_date);
                
                cityAccumulatedGoal += monthGoal;
                cityProjectedMarketingCost += monthGoal * marketingCostPerRide;
                cityProjectedOperationalCost += monthGoal * operationalCostPerRide;

                if (m <= 6) { // Mostrar apenas os primeiros 6 meses para não poluir
                    console.log(`    ${monthKey}: Meta ${monthGoal} | Mkt R$${(monthGoal * marketingCostPerRide).toFixed(2)} | Ops R$${(monthGoal * operationalCostPerRide).toFixed(2)}`);
                }

                // Avançar para próximo mês
                tempMonth++;
                if (tempMonth > 12) {
                    tempMonth = 1;
                    tempYear++;
                }
            }

            console.log(`  - Meta acumulada total: ${cityAccumulatedGoal}`);
            console.log(`  - Custo Marketing acumulado: R$${cityProjectedMarketingCost.toFixed(2)}`);
            console.log(`  - Custo Operacional acumulado: R$${cityProjectedOperationalCost.toFixed(2)}`);
            console.log(`  - Custo Total acumulado: R$${(cityProjectedMarketingCost + cityProjectedOperationalCost).toFixed(2)}`);

            totalAccumulatedGoal += cityAccumulatedGoal;
            totalProjectedMarketingCost += cityProjectedMarketingCost;
            totalProjectedOperationalCost += cityProjectedOperationalCost;

            // Verificar se há valores reais salvos no plano
            const cityPlan = plans.find(p => p.city_id === city.id);
            if (cityPlan && cityPlan.results) {
                console.log(`  - Plano encontrado com resultados: ${Object.keys(cityPlan.results).length} meses`);
                
                let planMarketingCost = 0;
                let planOperationalCost = 0;
                
                const resultsArray = Object.entries(cityPlan.results).sort((a, b) => {
                    const aNum = parseInt(a[0].replace('Mes', ''));
                    const bNum = parseInt(b[0].replace('Mes', ''));
                    return aNum - bNum;
                });

                for (let i = 0; i < resultsArray.length && i < monthsSinceStart; i++) {
                    const [, result] = resultsArray[i];
                    planMarketingCost += result.marketingCost || 0;
                    planOperationalCost += result.operationalCost || 0;
                }

                console.log(`  - Custos do plano - Mkt: R$${planMarketingCost.toFixed(2)} | Ops: R$${planOperationalCost.toFixed(2)}`);
            }
        }

        console.log('\n=== TOTAIS DO BLOCO ===');
        console.log(`Meta acumulada total: ${totalAccumulatedGoal}`);
        console.log(`Custo Marketing total: R$${totalProjectedMarketingCost.toFixed(2)}`);
        console.log(`Custo Operacional total: R$${totalProjectedOperationalCost.toFixed(2)}`);
        console.log(`Custo Total: R$${(totalProjectedMarketingCost + totalProjectedOperationalCost).toFixed(2)}`);

        // Calcular CPA e OPS por corrida
        const cpaMkt = totalProjectedMarketingCost / Math.max(totalAccumulatedGoal, 1);
        const opsPass = totalProjectedOperationalCost / Math.max(totalAccumulatedGoal, 1);
        const custoTotal = totalProjectedMarketingCost + totalProjectedOperationalCost;
        const custoCorreda = custoTotal / Math.max(totalAccumulatedGoal, 1);

        console.log('\n=== KPIs FINAIS ===');
        console.log(`CPA Marketing: R$${cpaMkt.toFixed(4)}`);
        console.log(`OPS por Passageiro: R$${opsPass.toFixed(4)}`);
        console.log(`Custo Total: R$${(custoTotal / 1000).toFixed(1)}k`);
        console.log(`Custo por Corrida: R$${custoCorreda.toFixed(2)}`);

        // Verificar dados reais de transações para comparar
        const transactionsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_rides,
                SUM(CASE WHEN type = 'CREDIT' AND description LIKE '%recarga%' THEN amount ELSE 0 END) as total_revenue
            FROM transactions 
            WHERE city IN ('Nova Bandeirantes', 'Nova Monte Verde', 'Apiacás', 'Paranaíta')
            AND timestamp >= '2025-01-01'::date
            AND timestamp < '2025-02-01'::date;
        `);
        
        const realData = transactionsResult.rows[0];
        console.log('\n=== DADOS REAIS (Jan 2025) ===');
        console.log(`Corridas reais: ${realData.total_rides}`);
        console.log(`Receita real: R$${parseFloat(realData.total_revenue || 0).toFixed(2)}`);

    } catch (error) {
        console.error('Erro na verificação:', error);
    } finally {
        await pool.end();
    }
}

checkCostsCalculation();
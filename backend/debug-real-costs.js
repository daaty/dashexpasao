const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'urbantmt',
    user: 'postgres',
    password: '5432'
});

async function debugRealCosts() {
    console.log('\n=== DEBUG CUSTOS REAIS ===\n');

    try {
        // Buscar cidades do bloco
        const citiesResult = await pool.query(`
            SELECT * FROM cities 
            WHERE name IN ('Nova Bandeirantes', 'Nova Monte Verde', 'Apiacás', 'Paranaíta')
            ORDER BY name;
        `);
        const cities = citiesResult.rows;

        console.log('Cidades encontradas:');
        cities.forEach(city => {
            console.log(`- ${city.name} (ID: ${city.id})`);
        });

        // Buscar planos para essas cidades
        const plansResult = await pool.query(`
            SELECT id, city_id, results, real_monthly_costs 
            FROM plannings 
            WHERE city_id IN (${cities.map(c => c.id).join(',')});
        `);
        
        console.log('\n=== ANÁLISE DOS PLANOS ===');
        
        for (const plan of plansResult.rows) {
            const city = cities.find(c => c.id === plan.city_id);
            console.log(`\n${city.name} (Plan ID: ${plan.id}):`);
            
            // Verificar se tem results
            if (plan.results) {
                console.log(`  ✓ Tem results: ${Object.keys(plan.results).length} meses`);
                
                // Mostrar alguns meses de exemplo
                const resultsEntries = Object.entries(plan.results);
                for (let i = 0; i < Math.min(3, resultsEntries.length); i++) {
                    const [month, data] = resultsEntries[i];
                    console.log(`    ${month}: marketingCost=${data.marketingCost || 0}, operationalCost=${data.operationalCost || 0}`);
                }
                if (resultsEntries.length > 3) {
                    console.log(`    ... e mais ${resultsEntries.length - 3} meses`);
                }
            } else {
                console.log(`  ✗ Sem results`);
            }
            
            // Verificar se tem real_monthly_costs
            if (plan.real_monthly_costs) {
                console.log(`  ✓ Tem real_monthly_costs: ${Object.keys(plan.real_monthly_costs).length} meses`);
                
                // Mostrar alguns meses de exemplo
                const costEntries = Object.entries(plan.real_monthly_costs);
                for (let i = 0; i < Math.min(3, costEntries.length); i++) {
                    const [month, costs] = costEntries[i];
                    console.log(`    ${month}: marketingCost=${costs.marketingCost || 0}, operationalCost=${costs.operationalCost || 0}`);
                }
                if (costEntries.length > 3) {
                    console.log(`    ... e mais ${costEntries.length - 3} meses`);
                }
            } else {
                console.log(`  ✗ Sem real_monthly_costs - AQUI ESTÁ O PROBLEMA!`);
            }
        }

        console.log('\n=== CONCLUSÃO ===');
        console.log('Os custos reais aparecem R$ 0 porque:');
        console.log('1. O frontend busca dados de cityPlan?.realMonthlyCosts');
        console.log('2. Mas esse campo está vazio/nulo nos planos');
        console.log('3. Sem dados reais de custos, todos os valores ficam 0');
        
        console.log('\nSOLUÇÃO:');
        console.log('- Pode usar os custos projetados dos results como fallback');
        console.log('- Ou implementar sistema para cadastrar custos reais');
        console.log('- Ou simular dados reais baseado em percentual dos projetados');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Banco não está rodando');
            console.log('Mas baseado na análise do código, o problema é que:');
            console.log('');
            console.log('Os custos REAIS aparecem R$ 0 porque:');
            console.log('1. O código busca cityPlan?.realMonthlyCosts');
            console.log('2. Esse campo provavelmente não existe ou está vazio');
            console.log('3. Sem dados reais, todos os KPIs reais ficam zerados');
            console.log('');
            console.log('SOLUÇÕES POSSÍVEIS:');
            console.log('A) Usar custos projetados como fallback quando não há reais');
            console.log('B) Simular dados reais baseado em % dos projetados');
            console.log('C) Implementar sistema para cadastrar custos reais mensais');
        } else {
            console.error('Erro na verificação:', error);
        }
    } finally {
        await pool.end();
    }
}

debugRealCosts();
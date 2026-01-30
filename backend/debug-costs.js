require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/dashboard_analytics',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugCostCalculation() {
    try {
        console.log('🔍 Debug dos cálculos de custo...');
        
        // Primeiro verificar estrutura da tabela City
        const structure = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'City'
            ORDER BY ordinal_position
        `);
        
        console.log('Estrutura da tabela City:');
        console.log(structure.rows);
        
        // Buscar cidades do bloco Nova Bandeirantes + Paranaíta
        const cities = await pool.query(`
            SELECT * FROM "City" 
            WHERE name IN ('Nova Monte Verde', 'Nova Bandeirantes', 'Apiacás', 'Paranaíta')
            ORDER BY name
        `);
        
        console.log('\n🏙️ Cidades do bloco:', cities.rows.map(c => c.name));
        
        // Buscar planos com resultados
        for (const city of cities.rows) {
            console.log(`\n📊 Cidade: ${city.name} (ID: ${city.id})`);
            
            const plan = await pool.query(`
                SELECT * FROM "PlanningResults" 
                WHERE "cityId" = $1
            `, [city.id]);
            
            if (plan.rows.length > 0) {
                const planData = plan.rows[0];
                console.log(`  - Data de implementação: ${city.implementationStartDate}`);
                console.log(`  - Population 15-44: ${city.population15to44}`);
                
                if (planData.results) {
                    const months = Object.keys(planData.results).length;
                    console.log(`  - Meses planejados: ${months}`);
                    
                    // Calcular custos projetados baseado nas metas
                    const targetPenetration = 0.0024;
                    const marketingCostPerRide = 0.15;
                    const operationalCostPerRide = 0.20;
                    
                    const cityBaseGoal = Math.round(city.population15to44 * targetPenetration);
                    console.log(`  - Meta base da cidade: ${cityBaseGoal}`);
                    
                    // Simular cálculo de custo do mês atual
                    if (city.implementationStartDate) {
                        const currentYear = new Date().getFullYear();
                        const currentMonth = new Date().getMonth() + 1;
                        
                        const [impYear, impMonth] = city.implementationStartDate.split('-').map(Number);
                        const monthsSinceStart = (currentYear - impYear) * 12 + (currentMonth - impMonth) + 1;
                        
                        console.log(`  - Meses desde implementação: ${monthsSinceStart}`);
                        
                        // Fatores de crescimento graduado
                        const curveFactors = [0.1, 0.25, 0.5, 0.75, 0.9, 1.0];
                        const currentMonthFactor = monthsSinceStart <= 6 ? curveFactors[monthsSinceStart - 1] : 1.0;
                        const currentMonthGoal = Math.round(cityBaseGoal * currentMonthFactor);
                        
                        console.log(`  - Meta do mês atual: ${currentMonthGoal}`);
                        
                        const projectedMarketing = currentMonthGoal * marketingCostPerRide;
                        const projectedOperational = currentMonthGoal * operationalCostPerRide;
                        
                        console.log(`  - Custo marketing projetado: R$ ${projectedMarketing.toFixed(2)}`);
                        console.log(`  - Custo operacional projetado: R$ ${projectedOperational.toFixed(2)}`);
                    }
                } else {
                    console.log(`  - Sem dados de planejamento`);
                }
                
                if (planData.realMonthlyCosts && Object.keys(planData.realMonthlyCosts).length > 0) {
                    console.log(`  - Custos reais disponíveis: ${Object.keys(planData.realMonthlyCosts).length} meses`);
                } else {
                    console.log(`  - Sem custos reais salvos`);
                }
            } else {
                console.log(`  - Sem plano encontrado`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await pool.end();
    }
}

debugCostCalculation();
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/dashboard_analytics',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkPlanningCosts() {
    try {
        console.log('🔍 Verificando custos na tabela Planning...');
        
        // Primeiro verificar estrutura da tabela Planning
        console.log('🔍 Estrutura da tabela Planning:');
        const structure = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'Planning'
            ORDER BY ordinal_position
        `);
        
        console.log(structure.rows);
        
        // Buscar planos das cidades do bloco
        const query = `
            SELECT c.name, p.*
            FROM "Planning" p
            JOIN "City" c ON p."cityId" = c.id
            WHERE c.name IN ('Nova Monte Verde', 'Nova Bandeirantes', 'Apiacás', 'Paranaíta')
        `;
        
        const result = await pool.query(query);
        
        console.log('📊 Resultados:');
        result.rows.forEach(row => {
            console.log(`\nCidade: ${row.name}`);
            console.log('Dados do plano:', JSON.stringify(row, null, 2));
        });
        
        if (result.rows.length === 0) {
            console.log('❌ Nenhum plano encontrado para as cidades do bloco');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await pool.end();
    }
}

checkPlanningCosts();
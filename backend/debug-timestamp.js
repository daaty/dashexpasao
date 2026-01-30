const { Pool } = require('pg');

const pool = new Pool({
  host: '148.230.73.27',
  port: 5432,
  database: 'postgres',
  user: 'n8n_user',
  password: 'n8n_pw',
  ssl: false
});

async function checkTransactionsTimestamp() {
  try {
    console.log('🔍 Verificando qual campo de data usar em transactions...\n');
    
    // 1. Verificar estrutura da tabela
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'dashboard' 
        AND table_name = 'transactions'
        AND column_name IN ('timestamp', 'createdAt', 'created_at')
    `);
    
    console.log('📋 Campos de data encontrados:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    // 2. Testar qual tem dados para janeiro 2026
    const tests = ['timestamp', 'createdAt'];
    
    for (const field of tests) {
      try {
        const query = `
          SELECT 
            DATE_TRUNC('month', "${field}") as month_start,
            COUNT(*) as transactions,
            SUM(quantity) as total_value
          FROM dashboard.transactions 
          WHERE type = 'CREDIT' 
            AND description = 'recarga'
            AND LOWER(city) = 'nova monte verde'
            AND "${field}" >= '2026-01-01'
            AND "${field}" < '2026-02-01'
          GROUP BY DATE_TRUNC('month', "${field}")
        `;
        
        const result = await pool.query(query);
        
        console.log(`\n📊 Usando campo "${field}":`);
        if (result.rows.length > 0) {
          console.log(`✅ Encontrou dados: ${result.rows[0].transactions} transações = R$ ${parseFloat(result.rows[0].total_value).toFixed(2)}`);
        } else {
          console.log(`❌ Nenhum dado encontrado`);
        }
        
      } catch (error) {
        console.log(`❌ Erro ao usar "${field}": ${error.message}`);
      }
    }
    
    // 3. Testar o query correto que deveria retornar R$ 7197.50
    console.log('\n🎯 Testando query correta para obter R$ 7197.50:');
    
    const correctQuery = `
      WITH monthly_rides AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', r."arrivedTimestamp"), 'YYYY-MM') as month,
          EXTRACT(YEAR FROM DATE_TRUNC('month', r."arrivedTimestamp")) as year,
          EXTRACT(MONTH FROM DATE_TRUNC('month', r."arrivedTimestamp")) as month_number,
          DATE_TRUNC('month', r."arrivedTimestamp") as month_start,
          COUNT(DISTINCT r.id) as rides
        FROM dashboard.rides r
        WHERE LOWER(r.city) IN ('nova monte verde', 'nova bandeirantes')
          AND r."arrivedTimestamp" IS NOT NULL
          AND r.status = 'Concluída'
        GROUP BY DATE_TRUNC('month', r."arrivedTimestamp")
      ),
      monthly_revenue AS (
        SELECT 
          DATE_TRUNC('month', t."createdAt") as month_start,
          COALESCE(SUM(t.quantity), 0) as revenue
        FROM dashboard.transactions t
        WHERE t.type = 'CREDIT'
          AND LOWER(t.description) LIKE '%recarga%'
          AND LOWER(t.city) IN ('nova monte verde', 'nova bandeirantes')
        GROUP BY DATE_TRUNC('month', t."createdAt")
      )
      SELECT 
        mr.month,
        mr.year,
        mr.month_number,
        mr.rides,
        COALESCE(rev.revenue, 0) as revenue
      FROM monthly_rides mr
      LEFT JOIN monthly_revenue rev ON mr.month_start = rev.month_start
      WHERE mr.month = '2026-01'
      ORDER BY mr.month DESC
    `;
    
    const correctResult = await pool.query(correctQuery);
    console.log('✅ Query corrigida:');
    console.log(correctResult.rows);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkTransactionsTimestamp();
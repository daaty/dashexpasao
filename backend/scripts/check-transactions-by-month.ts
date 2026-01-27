import { Client } from 'pg';

async function checkTransactions() {
  const client = new Client({
    host: '148.230.73.27',
    port: 5432,
    database: 'postgres',
    user: 'n8n_user',
    password: 'n8n_pw',
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco N8N\n');

    console.log('=== Distribuição de transações por mês (Nova Monte Verde) ===\n');
    
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', t."timestamp"), 'YYYY-MM') as month,
        COUNT(*) as total_transactions,
        SUM(CASE WHEN t.type = 'CREDIT' THEN 1 ELSE 0 END) as credit_transactions,
        SUM(CASE WHEN t.type = 'CREDIT' AND LOWER(t.description) LIKE '%recarga%' THEN 1 ELSE 0 END) as recargas,
        SUM(CASE WHEN t.type = 'CREDIT' AND LOWER(t.description) LIKE '%recarga%' THEN t.amount ELSE 0 END) as receita
      FROM dashboard.transactions t
      INNER JOIN dashboard.drivers d ON t."driverId" = d.id
      WHERE LOWER(d.city) = 'nova monte verde'
      GROUP BY DATE_TRUNC('month', t."timestamp")
      ORDER BY month DESC
    `;
    
    const result = await client.query(query);
    
    console.log(`Total de meses: ${result.rows.length}\n`);
    
    result.rows.forEach((row: any) => {
      console.log(`${row.month}:`);
      console.log(`  Total transações: ${row.total_transactions}`);
      console.log(`  Transações CREDIT: ${row.credit_transactions}`);
      console.log(`  Recargas: ${row.recargas}`);
      console.log(`  Receita: R$ ${parseFloat(row.receita).toFixed(2)}`);
      console.log('');
    });

    await client.end();
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    await client.end();
  }
}

checkTransactions();

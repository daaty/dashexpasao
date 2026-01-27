import { Client } from 'pg';

async function checkTransactionsColumns() {
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

    console.log('=== Colunas da tabela transactions ===\n');
    
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'dashboard' 
        AND table_name = 'transactions'
      ORDER BY ordinal_position
    `;
    
    const result = await client.query(columnsQuery);
    result.rows.forEach((row: any) => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });

    console.log('\n=== Amostra de 3 transações ===\n');
    
    const sampleQuery = `
      SELECT 
        "transactionId",
        "timestamp",
        "createdAt",
        TO_CHAR("timestamp", 'YYYY-MM-DD HH24:MI:SS') as timestamp_formatted,
        TO_CHAR("createdAt", 'YYYY-MM-DD HH24:MI:SS') as created_formatted
      FROM dashboard.transactions
      ORDER BY "transactionId" DESC
      LIMIT 3
    `;
    
    const sampleResult = await client.query(sampleQuery);
    sampleResult.rows.forEach((row: any) => {
      console.log(`Transaction ID: ${row.transactionId}`);
      console.log(`  timestamp: ${row.timestamp_formatted}`);
      console.log(`  createdAt: ${row.created_formatted}`);
      console.log('');
    });

    await client.end();
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    await client.end();
  }
}

checkTransactionsColumns();

import { Client } from 'pg';

async function checkColumns() {
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

    // Verificar colunas da tabela rides
    console.log('=== Colunas da tabela rides ===\n');
    
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'dashboard' 
        AND table_name = 'rides'
      ORDER BY ordinal_position
    `;
    
    const result = await client.query(columnsQuery);
    result.rows.forEach((row: any) => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });

    // Verificar amostra de datas
    console.log('\n=== Amostra de 5 corridas com ambas as datas ===\n');
    
    const sampleQuery = `
      SELECT 
        id,
        "createdAt",
        "requestTimestamp",
        TO_CHAR("createdAt", 'YYYY-MM-DD HH24:MI:SS') as created_formatted,
        TO_CHAR("requestTimestamp", 'YYYY-MM-DD HH24:MI:SS') as request_formatted
      FROM dashboard.rides
      ORDER BY id DESC
      LIMIT 5
    `;
    
    const sampleResult = await client.query(sampleQuery);
    sampleResult.rows.forEach((row: any) => {
      console.log(`ID: ${row.id}`);
      console.log(`  createdAt: ${row.created_formatted}`);
      console.log(`  requestTimestamp: ${row.request_formatted}`);
      console.log('');
    });

    await client.end();
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    await client.end();
  }
}

checkColumns();

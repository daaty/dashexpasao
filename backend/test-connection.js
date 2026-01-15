const { Client } = require('pg');

const client = new Client({
  host: '148.230.73.27',
  port: 5436,
  user: 'urbanexpansao',
  password: 'urban2026',
  database: 'dashboard_de_Expansao'
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Conexão bem-sucedida ao PostgreSQL!');
    
    const infoResult = await client.query('SELECT current_database(), current_user, version();');
    console.log('Database:', infoResult.rows[0].current_database);
    console.log('User:', infoResult.rows[0].current_user);
    console.log('Version:', infoResult.rows[0].version.split(' ').slice(0, 2).join(' '));
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('\nTabelas encontradas:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => console.log('  -', row.table_name));
    
    if (tablesResult.rows.some(r => r.table_name === 'City')) {
      const citiesResult = await client.query('SELECT COUNT(*) FROM "City";');
      console.log('\nTotal de cidades:', citiesResult.rows[0].count);
    }
    
    await client.end();
    console.log('\n✅ Teste concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao conectar:', err.message);
    console.error('Detalhes:', err.code);
    process.exit(1);
  }
}

testConnection();

require('dotenv').config();
const { Client } = require('pg');

async function migrateTransactionsCity() {
  const client = new Client({
    connectionString: process.env.N8N_DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco N8N\n');
    
    // 1. Adicionar coluna city se não existir
    console.log('📝 Adicionando coluna city na tabela transactions...');
    await client.query(`
      ALTER TABLE dashboard.transactions 
      ADD COLUMN IF NOT EXISTS city VARCHAR(255)
    `);
    console.log('✅ Coluna city adicionada\n');
    
    // 2. Atualizar city baseado no driverId
    console.log('🔄 Atualizando city das transactions baseado nos motoristas...');
    const updateResult = await client.query(`
      UPDATE dashboard.transactions t
      SET city = d.city
      FROM dashboard.drivers d
      WHERE t."driverId" = d.id
        AND (t.city IS NULL OR t.city = '')
    `);
    console.log(`✅ ${updateResult.rowCount} transactions atualizadas\n`);
    
    // 3. Verificar resultado
    console.log('📊 Verificando resultado:');
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(city) as with_city,
        COUNT(*) - COUNT(city) as without_city
      FROM dashboard.transactions
    `);
    
    const stats = statsResult.rows[0];
    console.log(`  Total de transactions: ${stats.total_transactions}`);
    console.log(`  Com city: ${stats.with_city}`);
    console.log(`  Sem city: ${stats.without_city}\n`);
    
    // 4. Mostrar sample de cidades
    const citiesResult = await client.query(`
      SELECT city, COUNT(*) as count
      FROM dashboard.transactions
      WHERE city IS NOT NULL
      GROUP BY city
      ORDER BY count DESC
      LIMIT 10
    `);
    
    console.log('🏙️  Top 10 cidades com transactions:');
    citiesResult.rows.forEach(row => {
      console.log(`  ${row.city}: ${row.count} transactions`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

migrateTransactionsCity();

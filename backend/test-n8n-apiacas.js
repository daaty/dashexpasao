const { Client } = require('pg');

const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

async function testApiacas() {
  const client = new Client({
    connectionString: N8N_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to N8N database');

    // Check if rides table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'dashboard' 
      AND table_name = 'rides'
    `);
    console.log('\n📊 Table check:', tableCheck.rows);

    if (tableCheck.rows.length === 0) {
      console.log('\n❌ dashboard.rides table does not exist!');
      
      // Check what tables exist
      const allTables = await client.query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY table_schema, table_name
      `);
      console.log('\n📋 Available tables:');
      allTables.rows.forEach(row => {
        console.log(`  - ${row.table_schema}.${row.table_name}`);
      });
      
      return;
    }

    // Search for Apiacás
    console.log('\n🔍 Searching for Apiacás in rides...');
    const result = await client.query(`
      SELECT DISTINCT city 
      FROM dashboard.rides 
      WHERE LOWER(city) LIKE '%apiac%'
      LIMIT 10
    `);
    console.log('Cities with "apiac":', result.rows);

    // Get stats
    const stats = await client.query(`
      SELECT 
        COUNT(*) as ride_count,
        COUNT(DISTINCT "driverId") as driver_count
      FROM dashboard.rides
      WHERE LOWER(city) LIKE '%apiac%'
    `);
    console.log('\nRide stats:', stats.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testApiacas();

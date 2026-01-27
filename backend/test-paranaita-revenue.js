const { Client } = require('pg');

const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

async function testParanaitaRevenue() {
  const client = new Client({
    connectionString: N8N_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to N8N database\n');

    // Check city name variations in transactions
    console.log('1️⃣ Checking city name in transactions table:');
    const cityCheck = await client.query(`
      SELECT DISTINCT city 
      FROM dashboard.transactions 
      WHERE LOWER(city) LIKE '%paranai%'
      LIMIT 10
    `);
    console.log('Cities found:', cityCheck.rows);

    // Check rides city name
    console.log('\n2️⃣ Checking city name in rides table:');
    const ridesCity = await client.query(`
      SELECT DISTINCT city 
      FROM dashboard.rides 
      WHERE LOWER(city) LIKE '%paranai%'
      LIMIT 10
    `);
    console.log('Cities found:', ridesCity.rows);

    // Check transactions with CREDIT type
    console.log('\n3️⃣ Checking CREDIT transactions for Paranaita:');
    const creditCheck = await client.query(`
      SELECT 
        city,
        type,
        description,
        amount,
        "createdAt"
      FROM dashboard.transactions 
      WHERE LOWER(city) LIKE '%paranai%'
        AND type = 'CREDIT'
      LIMIT 10
    `);
    console.log('CREDIT transactions:', creditCheck.rows);

    // Check transactions with recarga in description
    console.log('\n4️⃣ Checking transactions with "recarga" in description:');
    const recargaCheck = await client.query(`
      SELECT 
        city,
        type,
        description,
        amount
      FROM dashboard.transactions 
      WHERE LOWER(city) LIKE '%paranai%'
        AND type = 'CREDIT'
        AND LOWER(description) LIKE '%recarga%'
      LIMIT 10
    `);
    console.log('Recarga transactions:', recargaCheck.rows);

    // Calculate total revenue
    console.log('\n5️⃣ Total revenue from recargas:');
    const revenueTotal = await client.query(`
      SELECT 
        city,
        COUNT(*) as transaction_count,
        SUM(amount) as total_revenue
      FROM dashboard.transactions 
      WHERE LOWER(city) LIKE '%paranai%'
        AND type = 'CREDIT'
        AND LOWER(description) LIKE '%recarga%'
      GROUP BY city
    `);
    console.log('Revenue by city:', revenueTotal.rows);

    // Test the exact query from backend with variations
    console.log('\n6️⃣ Testing backend query with city variations:');
    const cityVariations = ['paranaíta', 'paranaita'];
    const placeholders = cityVariations.map((_, i) => `$${i + 1}`).join(', ');
    const backendQuery = `
      SELECT COALESCE(SUM(t.amount), 0) as total_revenue
      FROM dashboard.transactions t
      WHERE t.type = 'CREDIT'
        AND LOWER(t.description) LIKE '%recarga%'
        AND LOWER(t.city) IN (${placeholders})
    `;
    
    console.log('Query:', backendQuery);
    console.log('Params:', cityVariations.map(c => c.toLowerCase()));
    
    const backendResult = await client.query(backendQuery, cityVariations.map(c => c.toLowerCase()));
    console.log('Backend query result:', backendResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  } finally {
    await client.end();
  }
}

testParanaitaRevenue();

const { Client } = require('pg');

const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

function normalizeCityName(cityName) {
  return cityName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function matchCityName(cityName) {
  const normalized = normalizeCityName(cityName);
  const cityNameMapping = {
    'cuiaba': ['cuiabá', 'cuiaba', 'capital'],
    'varzea grande': ['várzea grande', 'varzea grande', 'vg'],
    // ... other mappings
  };

  for (const [, variations] of Object.entries(cityNameMapping)) {
    if (variations.some(v => normalizeCityName(v) === normalized)) {
      return variations;
    }
  }
  
  return [cityName];
}

async function testApiacasQuery() {
  const client = new Client({
    connectionString: N8N_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to N8N database\n');

    const cityName = 'Apiacás';
    const cityVariations = matchCityName(cityName);
    console.log('🔍 City variations for "Apiacás":', cityVariations);

    const placeholders = cityVariations.map((_, i) => `$${i + 1}`).join(', ');
    const params = [...cityVariations.map(c => c.toLowerCase())];

    console.log('\n📝 Query parameters:');
    console.log('  Placeholders:', placeholders);
    console.log('  Params:', params);

    const whereClause = `WHERE LOWER(r.city) IN (${placeholders})`;
    
    const query = `
      SELECT 
        COUNT(DISTINCT r.id) as total_rides,
        MIN(r."arrivedTimestamp") as first_ride,
        MAX(r."arrivedTimestamp") as last_ride,
        COUNT(DISTINCT DATE_TRUNC('month', r."arrivedTimestamp")) as active_months,
        COUNT(DISTINCT DATE(r."arrivedTimestamp")) as active_days,
        CASE WHEN COUNT(r.price) > 0 THEN AVG(r.price) ELSE 0 END as average_value
      FROM dashboard.rides r
      ${whereClause}
        AND r."arrivedTimestamp" IS NOT NULL
        AND r.status = 'Concluída'
    `;

    console.log('\n📊 Executing query...');
    const result = await client.query(query, params);
    console.log('Result:', result.rows[0]);

    if (!result.rows[0] || result.rows[0].total_rides === '0') {
      console.log('\n❌ No rides found - would return null');
    } else {
      console.log('\n✅ Rides found!');
      
      // Now test the revenue query
      console.log('\n💰 Testing revenue query...');
      const cityPlaceholders = cityVariations.map((_, i) => `$${i + 1}`).join(', ');
      const revenueQuery = `
        SELECT COALESCE(SUM(t.amount), 0) as total_revenue
        FROM dashboard.transactions t
        WHERE t.type = 'CREDIT'
          AND LOWER(t.description) LIKE '%recarga%'
          AND LOWER(t.city) IN (${cityPlaceholders})
      `;
      
      console.log('  Revenue placeholders:', cityPlaceholders);
      console.log('  Revenue params:', cityVariations.map(c => c.toLowerCase()));
      
      const revenueResult = await client.query(revenueQuery, cityVariations.map(c => c.toLowerCase()));
      console.log('  Revenue result:', revenueResult.rows[0]);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  } finally {
    await client.end();
  }
}

testApiacasQuery();

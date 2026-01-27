const { Client } = require('pg');

const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

async function checkRidesForParanaita() {
  const client = new Client({
    connectionString: N8N_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to N8N database\n');

    // Check all variations
    console.log('1️⃣ Searching for Paranaíta in rides (with accent):');
    const withAccent = await client.query(`
      SELECT city, COUNT(*) as count 
      FROM dashboard.rides 
      WHERE city = 'Paranaíta'
      GROUP BY city
    `);
    console.log('Result:', withAccent.rows);

    console.log('\n2️⃣ Searching for Paranaita in rides (without accent):');
    const withoutAccent = await client.query(`
      SELECT city, COUNT(*) as count 
      FROM dashboard.rides 
      WHERE city = 'Paranaita'
      GROUP BY city
    `);
    console.log('Result:', withoutAccent.rows);

    console.log('\n3️⃣ All cities starting with "Paran":');
    const allParan = await client.query(`
      SELECT DISTINCT city 
      FROM dashboard.rides 
      WHERE city LIKE 'Paran%'
    `);
    console.log('Result:', allParan.rows);

    console.log('\n4️⃣ Test the exact query the backend runs:');
    const cityVariations = ['paranaíta', 'paranaita'];
    const placeholders = cityVariations.map((_, i) => `$${i + 1}`).join(', ');
    
    const ridesQuery = `
      SELECT 
        COUNT(DISTINCT r.id) as total_rides,
        MIN(r."arrivedTimestamp") as first_ride,
        MAX(r."arrivedTimestamp") as last_ride
      FROM dashboard.rides r
      WHERE LOWER(r.city) IN (${placeholders})
        AND r."arrivedTimestamp" IS NOT NULL
        AND r.status = 'Concluída'
    `;
    
    console.log('Query:', ridesQuery);
    console.log('Params:', cityVariations.map(c => c.toLowerCase()));
    
    const ridesResult = await client.query(ridesQuery, cityVariations.map(c => c.toLowerCase()));
    console.log('Rides found:', ridesResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkRidesForParanaita();

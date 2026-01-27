import { n8nDatabase } from '../src/config/n8nDatabase';

async function checkCityNames() {
  try {
    const available = await n8nDatabase.isAvailable();
    if (!available) {
      console.log('❌ N8N database not available');
      return;
    }

    console.log('✅ Database connected');

    // Buscar cidades que contém "parana"
    const result1 = await n8nDatabase.query(
      `SELECT DISTINCT city FROM dashboard.rides WHERE LOWER(city) LIKE $1 LIMIT 10`,
      ['%parana%']
    );
    console.log('\n🔍 Cidades com "parana":', result1.rows);

    // Buscar cidades que contém "cuiab"
    const result2 = await n8nDatabase.query(
      `SELECT DISTINCT city FROM dashboard.rides WHERE LOWER(city) LIKE $1 LIMIT 10`,
      ['%cuiab%']
    );
    console.log('\n🔍 Cidades com "cuiab":', result2.rows);

    // Buscar cidades que contém "apiac"
    const result3 = await n8nDatabase.query(
      `SELECT DISTINCT city FROM dashboard.rides WHERE LOWER(city) LIKE $1 LIMIT 10`,
      ['%apiac%']
    );
    console.log('\n🔍 Cidades com "apiac":', result3.rows);

    // Buscar cidades que contém "nova"
    const result4 = await n8nDatabase.query(
      `SELECT DISTINCT city FROM dashboard.rides WHERE LOWER(city) LIKE $1 LIMIT 10`,
      ['%nova%']
    );
    console.log('\n🔍 Cidades com "nova":', result4.rows);

    // Total de cidades distintas
    const result5 = await n8nDatabase.query(
      `SELECT COUNT(DISTINCT city) as total FROM dashboard.rides`
    );
    console.log('\n📊 Total de cidades únicas:', result5.rows[0]);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkCityNames();

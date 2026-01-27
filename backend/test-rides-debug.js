/**
 * Debug script to test rides API endpoints
 */
const axios = require('axios');

async function testRidesEndpoints() {
  const baseUrl = 'http://localhost:3001/api';
  
  console.log('🔍 Testando endpoints de corridas...\n');
  
  // Test 1: Check service status
  try {
    console.log('1️⃣ Testando /rides/status');
    const statusRes = await axios.get(`${baseUrl}/rides/status`);
    console.log('Status:', statusRes.data);
    console.log('');
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.response?.data || error.message);
  }
  
  // Test 2: Get cities with rides
  try {
    console.log('2️⃣ Testando /rides/cities');
    const citiesRes = await axios.get(`${baseUrl}/rides/cities`);
    console.log('Cidades com dados:', citiesRes.data);
    console.log('Total de cidades:', citiesRes.data.cities?.length || 0);
    console.log('');
  } catch (error) {
    console.error('❌ Erro ao buscar cidades:', error.response?.data || error.message);
  }
  
  // Test 3: Test specific cities
  const testCities = ['Cuiabá', 'Paranaíta', 'Apiacás', 'Nova Monte Verde', 'Nova Bandeirantes'];
  
  for (const city of testCities) {
    try {
      console.log(`3️⃣ Testando /rides/city/${encodeURIComponent(city)}/stats`);
      const statsRes = await axios.get(`${baseUrl}/rides/city/${encodeURIComponent(city)}/stats`);
      console.log(`✅ ${city}:`, {
        totalRides: statsRes.data.totalRides,
        totalRevenue: statsRes.data.totalRevenue,
        averageValue: statsRes.data.averageValue
      });
      console.log('');
    } catch (error) {
      console.log(`❌ ${city}:`, error.response?.data || error.message);
      console.log('');
    }
  }
}

testRidesEndpoints().catch(console.error);

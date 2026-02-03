import fetch from 'node-fetch';

async function testRevenueEndpoint() {
  try {
    console.log('🔗 Testando endpoint /api/plannings/revenue/...\n');
    
    const cities = ['Nova Monte Verde', 'Nova Bandeirantes', 'Apiacás', 'Paranaíta'];
    
    for (const city of cities) {
      const encodedCity = encodeURIComponent(city);
      const url = `http://localhost:3001/api/plannings/revenue/${encodedCity}`;
      
      console.log(`📍 Chamando: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${city}:`);
        console.log(`   Janeiro 2026: R$ ${data.data['2026-01'] || 'N/A'}`);
      } else {
        console.log(`❌ Erro: ${data.message}`);
      }
      console.log('');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao testar endpoint:', error.message);
    process.exit(1);
  }
}

testRevenueEndpoint();

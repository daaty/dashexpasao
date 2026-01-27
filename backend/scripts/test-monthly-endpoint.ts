import axios from 'axios';

async function testMonthlyEndpoint() {
  try {
    console.log('\n=== Testando endpoint mensal ===\n');
    
    const cities = ['Nova Monte Verde', 'Colider', 'Nova Bandeirantes'];
    
    for (const city of cities) {
      console.log(`\n--- ${city} ---`);
      const response = await axios.get(`http://localhost:3001/api/rides/city/${encodeURIComponent(city)}/monthly`, {
        params: { months: 12 }
      });
      
      const data = response.data;
      console.log(`✅ Total de meses: ${data.length}`);
      
      if (data.length > 0) {
        console.log('\nPrimeiro mês:', JSON.stringify(data[0], null, 2));
        
        const totalRevenue = data.reduce((sum: number, month: any) => sum + month.revenue, 0);
        const totalRides = data.reduce((sum: number, month: any) => sum + month.rides, 0);
        console.log(`\nTotal no período: ${totalRides} corridas, R$ ${totalRevenue.toFixed(2)} receita`);
      }
    }
    
    console.log('\n✅ Teste concluído!\n');
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMonthlyEndpoint();

import axios from 'axios';

async function testMonthlyRevenue() {
  try {
    console.log('\n=== Testando receita mensal ===\n');
    
    const city = 'Nova Monte Verde';
    const response = await axios.get(`http://localhost:3001/api/rides/city/${encodeURIComponent(city)}/monthly`, {
      params: { months: 12 }
    });
    
    const data = response.data;
    console.log(`✅ Total de meses: ${data.length}\n`);
    
    data.forEach((month: any) => {
      console.log(`${month.month}:`);
      console.log(`  Corridas: ${month.rides}`);
      console.log(`  Receita: R$ ${month.revenue.toFixed(2)}`);
      console.log(`  Ticket Médio: R$ ${month.averageValue.toFixed(2)}`);
      console.log(`  Dias Ativos: ${month.uniqueDays}`);
      console.log('');
    });
    
    const totalRevenue = data.reduce((sum: number, month: any) => sum + month.revenue, 0);
    const totalRides = data.reduce((sum: number, month: any) => sum + month.rides, 0);
    console.log(`\nTOTAL: ${totalRides} corridas, R$ ${totalRevenue.toFixed(2)} receita\n`);
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMonthlyRevenue();

import prisma from './src/config/database';
import { getMonthlyRechargeRevenue } from './src/services/planning.service';

async function testNewRevenueCalculation() {
  try {
    console.log('🧪 Testando novo cálculo de receita projetada...\n');
    
    const cities = ['Nova Monte Verde', 'Nova Bandeirantes', 'Apiacás', 'Paranaíta'];
    
    for (const city of cities) {
      console.log(`📊 Testando ${city}:`);
      const revenue = await getMonthlyRechargeRevenue(city);
      console.log(revenue);
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao testar:', error);
    process.exit(1);
  }
}

testNewRevenueCalculation();

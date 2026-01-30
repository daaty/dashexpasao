const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAllCities() {
  try {
    console.log('🔍 Verificando TODAS as cidades atualizadas...\n');
    console.log('='.repeat(80));
    
    const cities = await prisma.city.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        population: true,
        population15to44: true
      }
    });
    
    console.log(`📊 Total de cidades no banco: ${cities.length}\n`);
    console.log('='.repeat(80));
    
    // Estatísticas
    let totalPop = 0;
    let totalPop15to44 = 0;
    let minPercent = 100;
    let maxPercent = 0;
    let cityMinPercent = '';
    let cityMaxPercent = '';
    
    // Agrupando por faixa de percentual
    const ranges = {
      '40-45%': 0,
      '45-50%': 0,
      '50-55%': 0,
      '55-60%': 0
    };
    
    console.log('\n📋 LISTA COMPLETA DE CIDADES:\n');
    
    cities.forEach((city, index) => {
      const percent = city.population > 0 
        ? (city.population15to44 / city.population) * 100 
        : 0;
      
      totalPop += city.population;
      totalPop15to44 += city.population15to44;
      
      if (percent < minPercent && percent > 0) {
        minPercent = percent;
        cityMinPercent = city.name;
      }
      if (percent > maxPercent) {
        maxPercent = percent;
        cityMaxPercent = city.name;
      }
      
      // Agrupar por ranges
      if (percent >= 40 && percent < 45) ranges['40-45%']++;
      else if (percent >= 45 && percent < 50) ranges['45-50%']++;
      else if (percent >= 50 && percent < 55) ranges['50-55%']++;
      else if (percent >= 55 && percent < 60) ranges['55-60%']++;
      
      console.log(`${(index + 1).toString().padStart(3)}. ${city.name.padEnd(35)} | Pop: ${city.population.toLocaleString('pt-BR').padStart(9)} | 15-44: ${city.population15to44.toLocaleString('pt-BR').padStart(9)} | ${percent.toFixed(2)}%`);
    });
    
    const avgPercent = totalPop > 0 ? (totalPop15to44 / totalPop) * 100 : 0;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 ESTATÍSTICAS GERAIS\n');
    console.log('='.repeat(80));
    console.log(`✅ Total de cidades: ${cities.length}`);
    console.log(`✅ População total: ${totalPop.toLocaleString('pt-BR')}`);
    console.log(`✅ População 15-44: ${totalPop15to44.toLocaleString('pt-BR')}`);
    console.log(`✅ Percentual médio: ${avgPercent.toFixed(2)}%`);
    console.log(`\n📉 Menor percentual: ${minPercent.toFixed(2)}% (${cityMinPercent})`);
    console.log(`📈 Maior percentual: ${maxPercent.toFixed(2)}% (${cityMaxPercent})`);
    
    console.log('\n📊 Distribuição por faixa:');
    Object.entries(ranges).forEach(([range, count]) => {
      console.log(`   ${range}: ${count} cidades`);
    });
    
    console.log('='.repeat(80));
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllCities();

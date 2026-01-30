const { PrismaClient } = require('@prisma/client');
const https = require('https');
const prisma = new PrismaClient();

// Mapeamento de nomes de cidades para códigos IBGE
const cityIbgeCodes = {
  'Nova Monte Verde': '5106240',
  'Paranaíta': '5106299',
  'Apiacás': '5100805',
  'Alta Floresta': '5100250',
  'Guarantã do Norte': '5104104',
  'Peixoto de Azevedo': '5106422'
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function fetchPopulationFromCenso2010(ibgeCode) {
  try {
    console.log('  📊 Buscando dados do Censo 2010 (faixas 15-44 anos)...');
    
    // Grupos de idade do Censo 2010: 15-19 (3299), 20-24 (3300), 25-29 (3301), 30-34 (3302), 35-39 (3303), 40-44 (3304)
    const ageGroups = [
      { code: '3299', name: '15-19' },
      { code: '3300', name: '20-24' },
      { code: '3301', name: '25-29' },
      { code: '3302', name: '30-34' },
      { code: '3303', name: '35-39' },
      { code: '3304', name: '40-44' }
    ];
    
    let total15to44 = 0;
    
    for (const ageGroup of ageGroups) {
      const url = `https://apisidra.ibge.gov.br/values/t/200/n6/${ibgeCode}/v/93/p/2010/c2/0/c287/${ageGroup.code}`;
      
      try {
        const data = await fetchUrl(url);
        
        if (data && Array.isArray(data) && data.length > 1) {
          const value = parseInt(data[1].V) || 0;
          total15to44 += value;
          console.log(`    ${ageGroup.name} anos: ${value.toLocaleString('pt-BR')}`);
        }
        
        // Delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.log(`    ⚠️ Erro na faixa ${ageGroup.name}: ${err.message}`);
      }
    }
    
    if (total15to44 > 0) {
      console.log(`  ✅ Total Censo 2010 (15-44): ${total15to44.toLocaleString('pt-BR')}`);
      
      // Buscar população total do Censo 2010
      const totalUrl = `https://apisidra.ibge.gov.br/values/t/200/n6/${ibgeCode}/v/93/p/2010/c2/0/c287/0`;
      const totalData = await fetchUrl(totalUrl);
      
      let totalCenso2010 = 0;
      if (totalData && Array.isArray(totalData) && totalData.length > 1) {
        totalCenso2010 = parseInt(totalData[1].V) || 0;
        console.log(`  📊 População Total 2010: ${totalCenso2010.toLocaleString('pt-BR')}`);
      }
      
      return { census15to44: total15to44, censusTotal: totalCenso2010 };
    }
    
    return null;
  } catch (error) {
    console.log(`  ⚠️ Erro ao buscar dados do Censo 2010: ${error.message}`);
    return null;
  }
}

async function fetchCurrentPopulation(ibgeCode) {
  try {
    const url = `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/-1/variaveis/93?localidades=N6[${ibgeCode}]`;
    const data = await fetchUrl(url);
    
    if (data && data[0] && data[0].resultados && data[0].resultados[0]) {
      const serie = data[0].resultados[0].series[0];
      if (serie && serie.serie) {
        const latestYear = Object.keys(serie.serie).sort().reverse()[0];
        return parseInt(serie.serie[latestYear]) || 0;
      }
    }
    return 0;
  } catch (error) {
    console.log(`  ⚠️ Erro ao buscar população atual: ${error.message}`);
    return 0;
  }
}

async function updateCityPopulation() {
  try {
    console.log('🔄 Iniciando atualização de dados de população do IBGE...\n');
    
    const updatedCities = [];
    const errors = [];
    
    for (const [cityName, ibgeCode] of Object.entries(cityIbgeCodes)) {
      console.log(`📍 Processando ${cityName}...`);
      console.log(`   Código IBGE: ${ibgeCode}`);
      
      // Buscar população atual
      const currentPopulation = await fetchCurrentPopulation(ibgeCode);
      console.log(`  🎯 População Atual (estimativa ${new Date().getFullYear()}): ${currentPopulation.toLocaleString('pt-BR')}`);
      
      // Buscar dados do Censo 2010
      const censusData = await fetchPopulationFromCenso2010(ibgeCode);
      
      let population15to44 = 0;
      
      if (censusData && censusData.census15to44 > 0 && censusData.censusTotal > 0) {
        // Calcular proporção baseada no Censo 2010
        const proportion = censusData.census15to44 / censusData.censusTotal;
        console.log(`  📊 Proporção 2010 (15-44): ${(proportion * 100).toFixed(2)}%`);
        
        // Aplicar proporção à população atual
        population15to44 = Math.round(currentPopulation * proportion);
        console.log(`  🎯 Estimativa atual (15-44): ${population15to44.toLocaleString('pt-BR')} (baseado em proporção do Censo 2010)`);
      } else {
        // Usar proporção média nacional (45%)
        population15to44 = Math.round(currentPopulation * 0.45);
        console.log(`  📊 Usando proporção média nacional (45%): ${population15to44.toLocaleString('pt-BR')}`);
      }
      
      // Atualizar no banco de dados
      if (currentPopulation > 0) {
        const result = await prisma.city.updateMany({
          where: { name: cityName },
          data: {
            population: currentPopulation,
            population15to44: population15to44
          }
        });
        
        if (result.count > 0) {
          console.log(`✅ ${cityName} atualizado no banco de dados\n`);
          updatedCities.push({
            name: cityName,
            population: currentPopulation,
            population15to44: population15to44
          });
        } else {
          console.log(`⚠️  ${cityName} não encontrada no banco de dados\n`);
          errors.push(`${cityName} não encontrada`);
        }
      } else {
        console.log(`❌ Não foi possível obter população para ${cityName}\n`);
        errors.push(`Erro ao buscar população para ${cityName}`);
      }
      
      // Delay entre cidades
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DA ATUALIZAÇÃO');
    console.log('='.repeat(80));
    console.log(`✅ Cidades atualizadas: ${updatedCities.length}`);
    console.log(`❌ Erros: ${errors.length}`);
    
    if (updatedCities.length > 0) {
      console.log('\n📋 Dados atualizados:');
      for (const city of updatedCities) {
        console.log(`\n${city.name}:`);
        console.log(`  População Total: ${city.population.toLocaleString('pt-BR')}`);
        console.log(`  População 15-44: ${city.population15to44.toLocaleString('pt-BR')}`);
        console.log(`  % 15-44: ${((city.population15to44 / city.population) * 100).toFixed(1)}%`);
      }
    }
    
    if (errors.length > 0) {
      console.log('\n⚠️  Erros encontrados:');
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCityPopulation();

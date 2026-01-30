const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Dados extraídos manualmente do Censo 2010 (tabela1378.csv)
const censo2010Data = {
  'Alta Floresta': {
    total: 49164,
    ages: {
      '15-17': 3036,
      '18-19': 1800,
      '20-24': 4300,
      '25-29': 4235,
      '30-34': 4007,
      '35-39': 3856,
      '40-44': 3702
    }
  },
  'Apiacás': {
    total: 8567,
    ages: {
      '15-17': 550,
      '18-19': 298,
      '20-24': 761,
      '25-29': 672,
      '30-34': 599,
      '35-39': 656,
      '40-44': 641
    }
  },
  'Guarantã do Norte': {
    total: 32125,
    ages: {
      '15-17': 1907,
      '18-19': 1135,
      '20-24': 3146,
      '25-29': 2684,
      '30-34': 2493,
      '35-39': 2272,
      '40-44': 2163
    }
  },
  'Nova Monte Verde': {
    total: 8093,
    ages: {
      '15-17': 455,
      '18-19': 283,
      '20-24': 657,
      '25-29': 619,
      '30-34': 606,
      '35-39': 645,
      '40-44': 562
    }
  },
  'Paranaíta': {
    total: 10303,
    ages: {
      '15-17': 588,
      '18-19': 314,
      '20-24': 811,
      '25-29': 720,
      '30-34': 723,
      '35-39': 737,
      '40-44': 707
    }
  },
  'Peixoto de Azevedo': {
    total: 29780,
    ages: {
      '15-17': 1716,
      '18-19': 1040,
      '20-24': 2498,
      '25-29': 2165,
      '30-34': 1943,
      '35-39': 1887,
      '40-44': 2020
    }
  }
};

async function fetchCurrentPopulation(ibgeCode) {
  try {
    const https = require('https');
    const url = `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/-1/variaveis/93?localidades=N6[${ibgeCode}]`;
    
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json && json[0] && json[0].resultados && json[0].resultados[0]) {
              const serie = json[0].resultados[0].series[0];
              if (serie && serie.serie) {
                const latestYear = Object.keys(serie.serie).sort().reverse()[0];
                resolve(parseInt(serie.serie[latestYear]) || 0);
                return;
              }
            }
            resolve(0);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  } catch (error) {
    console.log(`  ⚠️ Erro ao buscar população atual: ${error.message}`);
    return 0;
  }
}

async function updatePopulationFromCenso() {
  try {
    console.log('🔄 Atualizando com dados REAIS do Censo 2010...\n');
    console.log('=' .repeat(80));
    console.log('📊 DADOS DO CENSO 2010 (Tabela 1378 - IBGE)\n');
    console.log('='.repeat(80));
    
    // Mostrar dados do Censo
    for (const [cityName, data] of Object.entries(censo2010Data)) {
      const total15to44 = Object.values(data.ages).reduce((sum, val) => sum + val, 0);
      const proportion = (total15to44 / data.total) * 100;
      
      console.log(`\n${cityName} (Censo 2010):`);
      console.log(`  População Total: ${data.total.toLocaleString('pt-BR')}`);
      console.log(`  População 15-44: ${total15to44.toLocaleString('pt-BR')}`);
      console.log(`  Proporção: ${proportion.toFixed(2)}%`);
      console.log(`  Detalhes por faixa:`);
      for (const [age, value] of Object.entries(data.ages)) {
        console.log(`    ${age} anos: ${value.toLocaleString('pt-BR')}`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🔄 Atualizando banco de dados com proporções reais...\n');
    console.log('='.repeat(80));
    
    const cityIbgeCodes = {
      'Nova Monte Verde': '5106240',
      'Paranaíta': '5106299',
      'Apiacás': '5100805',
      'Alta Floresta': '5100250',
      'Guarantã do Norte': '5104104',
      'Peixoto de Azevedo': '5106422'
    };
    
    const updatedCities = [];
    
    for (const [cityName, ibgeCode] of Object.entries(cityIbgeCodes)) {
      console.log(`\n📍 ${cityName}...`);
      
      const censoData = censo2010Data[cityName];
      if (!censoData) {
        console.log(`  ⚠️ Dados do Censo não encontrados`);
        continue;
      }
      
      // Buscar população atual
      console.log(`  📊 Buscando população atual (2026)...`);
      const currentPopulation = await fetchCurrentPopulation(ibgeCode);
      
      if (currentPopulation === 0) {
        console.log(`  ⚠️ Não foi possível obter população atual`);
        continue;
      }
      
      // Calcular população 15-44 do Censo 2010
      const censo15to44 = Object.values(censoData.ages).reduce((sum, val) => sum + val, 0);
      
      // Calcular proporção REAL do Censo 2010
      const proportion = censo15to44 / censoData.total;
      
      console.log(`  📊 População Total 2010: ${censoData.total.toLocaleString('pt-BR')}`);
      console.log(`  📊 População 15-44 (2010): ${censo15to44.toLocaleString('pt-BR')}`);
      console.log(`  📊 Proporção REAL: ${(proportion * 100).toFixed(2)}%`);
      console.log(`  🎯 População Total 2026: ${currentPopulation.toLocaleString('pt-BR')}`);
      
      // Aplicar proporção REAL à população atual
      const population15to44 = Math.round(currentPopulation * proportion);
      console.log(`  🎯 População 15-44 (2026): ${population15to44.toLocaleString('pt-BR')}`);
      
      // Atualizar no banco
      const result = await prisma.city.updateMany({
        where: { name: cityName },
        data: {
          population: currentPopulation,
          population15to44: population15to44
        }
      });
      
      if (result.count > 0) {
        console.log(`  ✅ Atualizado no banco de dados`);
        updatedCities.push({
          name: cityName,
          population: currentPopulation,
          population15to44: population15to44,
          proportion: proportion
        });
      } else {
        console.log(`  ⚠️ Cidade não encontrada no banco`);
      }
      
      // Delay entre cidades
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO FINAL - DADOS REAIS POR IDADE\n');
    console.log('='.repeat(80));
    console.log(`✅ Cidades atualizadas: ${updatedCities.length}\n`);
    
    if (updatedCities.length > 0) {
      console.log('📋 Dados finais no banco de dados:\n');
      for (const city of updatedCities) {
        console.log(`${city.name}:`);
        console.log(`  População Total (2026): ${city.population.toLocaleString('pt-BR')}`);
        console.log(`  População 15-44 (2026): ${city.population15to44.toLocaleString('pt-BR')}`);
        console.log(`  Proporção (Censo 2010): ${(city.proportion * 100).toFixed(2)}%`);
        console.log('');
      }
    }
    
    console.log('='.repeat(80));
    console.log('✅ Atualização concluída com DADOS REAIS por faixa etária!');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePopulationFromCenso();

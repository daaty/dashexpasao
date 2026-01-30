const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Mapeamento de nomes de cidades
const cityNames = {
  'Alta Floresta': 'Alta Floresta (MT)',
  'Apiacás': 'Apiacás (MT)',
  'Guarantã do Norte': 'Guarantã do Norte (MT)',
  'Nova Monte Verde': 'Nova Monte Verde (MT)',
  'Paranaíta': 'Paranaíta (MT)',
  'Peixoto de Azevedo': 'Peixoto de Azevedo (MT)'
};

// Faixas etárias que precisamos: 15 a 44 anos
const ageRanges = [
  '15 a 17 anos',
  '18 ou 19 anos',
  '20 a 24 anos',
  '25 a 29 anos',
  '30 a 34 anos',
  '35 a 39 anos',
  '40 a 44 anos'
];

function parseCSV() {
  const content = fs.readFileSync('./tabela1378.csv', 'utf-8');
  const lines = content.split('\n');
  
  const cityData = {};
  
  for (let i = 6; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV com ponto-e-vírgula e campos entre aspas
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ';' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    
    if (fields.length < 4) continue;
    
    const cityName = fields[0];
    const ageGroup = fields[1];
    const condition = fields[2];
    // O quarto campo (índice 3) contém o Total (soma de urbana + rural)
    const totalValueStr = fields[3].replace(/"/g, '');
    const totalValue = parseInt(totalValueStr) || 0;
    
    // Filtrar apenas as cidades que queremos e condição "Total"
    const targetCities = Object.values(cityNames);
    if (!targetCities.includes(cityName)) continue;
    if (condition !== 'Total') continue;
    
    // Inicializar dados da cidade se não existir
    if (!cityData[cityName]) {
      cityData[cityName] = {
        total: 0,
        age15to44: 0,
        details: {}
      };
    }
    
    // População total
    if (ageGroup === 'Total') {
      cityData[cityName].total = totalValue;
    }
    
    // Faixas etárias 15-44
    if (ageRanges.includes(ageGroup)) {
      cityData[cityName].age15to44 += totalValue;
      cityData[cityName].details[ageGroup] = totalValue;
    }
  }
  
  return cityData;
}

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

async function updatePopulationFromCSV() {
  try {
    console.log('🔄 Processando dados reais do Censo 2010 (tabela1378.csv)...\n');
    
    const cityData = parseCSV();
    
    console.log('📊 Dados extraídos do Censo 2010:\n');
    for (const [cityNameCSV, data] of Object.entries(cityData)) {
      console.log(`${cityNameCSV}:`);
      console.log(`  População Total (2010): ${data.total.toLocaleString('pt-BR')}`);
      console.log(`  População 15-44 (2010): ${data.age15to44.toLocaleString('pt-BR')}`);
      console.log(`  Percentual: ${((data.age15to44 / data.total) * 100).toFixed(2)}%`);
      console.log(`  Detalhes por faixa:`);
      for (const [age, value] of Object.entries(data.details)) {
        console.log(`    ${age}: ${value.toLocaleString('pt-BR')}`);
      }
      console.log('');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🔄 Atualizando banco de dados...\n');
    
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
      console.log(`📍 ${cityName}...`);
      
      const cityNameCSV = cityNames[cityName];
      const censoData = cityData[cityNameCSV];
      
      if (!censoData) {
        console.log(`  ⚠️ Dados não encontrados no CSV\n`);
        continue;
      }
      
      // Buscar população atual
      console.log(`  📊 Buscando população atual...`);
      const currentPopulation = await fetchCurrentPopulation(ibgeCode);
      
      if (currentPopulation === 0) {
        console.log(`  ⚠️ Não foi possível obter população atual\n`);
        continue;
      }
      
      console.log(`  🎯 População atual (2026): ${currentPopulation.toLocaleString('pt-BR')}`);
      console.log(`  📊 População 2010: ${censoData.total.toLocaleString('pt-BR')}`);
      
      // Calcular proporção baseada no Censo 2010
      const proportion = censoData.age15to44 / censoData.total;
      console.log(`  📊 Proporção real 15-44 (Censo 2010): ${(proportion * 100).toFixed(2)}%`);
      
      // Aplicar proporção real à população atual
      const population15to44 = Math.round(currentPopulation * proportion);
      console.log(`  🎯 População 15-44 estimada (2026): ${population15to44.toLocaleString('pt-BR')}`);
      
      // Atualizar no banco
      const result = await prisma.city.updateMany({
        where: { name: cityName },
        data: {
          population: currentPopulation,
          population15to44: population15to44
        }
      });
      
      if (result.count > 0) {
        console.log(`  ✅ Atualizado no banco de dados\n`);
        updatedCities.push({
          name: cityName,
          population: currentPopulation,
          population15to44: population15to44,
          proportion: proportion
        });
      } else {
        console.log(`  ⚠️ Cidade não encontrada no banco\n`);
      }
      
      // Delay entre cidades
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    console.log('='.repeat(80));
    console.log('📊 RESUMO FINAL - DADOS REAIS DO CENSO 2010\n');
    console.log('='.repeat(80));
    console.log(`✅ Cidades atualizadas: ${updatedCities.length}\n`);
    
    if (updatedCities.length > 0) {
      console.log('📋 Dados atualizados com PROPORÇÕES REAIS:\n');
      for (const city of updatedCities) {
        console.log(`${city.name}:`);
        console.log(`  População Total: ${city.population.toLocaleString('pt-BR')}`);
        console.log(`  População 15-44: ${city.population15to44.toLocaleString('pt-BR')}`);
        console.log(`  Proporção real (Censo 2010): ${(city.proportion * 100).toFixed(2)}%`);
        console.log('');
      }
    }
    
    console.log('='.repeat(80));
    console.log('✅ Atualização concluída com dados reais por idade!');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePopulationFromCSV();

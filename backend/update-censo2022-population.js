const { PrismaClient } = require('@prisma/client');
const https = require('https');
const fs = require('fs');
const prisma = new PrismaClient();

// Processar CSV completo do Censo 2010 para proporções
function parseCSVProportions() {
  const content = fs.readFileSync('./tabela1378.csv', 'utf-8');
  const lines = content.split('\n');
  
  const cityData = {};
  
  const ageRanges = [
    '15 a 17 anos',
    '18 ou 19 anos',
    '20 a 24 anos',
    '25 a 29 anos',
    '30 a 34 anos',
    '35 a 39 anos',
    '40 a 44 anos'
  ];
  
  for (let i = 6; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(';');
    if (parts.length < 4) continue;
    
    const cityNameCSV = parts[0].replace(/"/g, '').trim();
    const ageGroup = parts[1].replace(/"/g, '').trim();
    const condition = parts[2].replace(/"/g, '').trim();
    const totalValueStr = parts[3].replace(/"/g, '').trim();
    
    // Pular percentuais
    if (totalValueStr.includes(',')) continue;
    
    const totalValue = parseInt(totalValueStr) || 0;
    
    if (!cityNameCSV.includes('(MT)')) continue;
    if (condition !== 'Total') continue;
    
    const cityName = cityNameCSV.replace(' (MT)', '').trim();
    
    if (!cityData[cityName]) {
      cityData[cityName] = {
        total: 0,
        age15to44: 0
      };
    }
    
    if (ageGroup === 'Total') {
      cityData[cityName].total = totalValue;
    }
    
    if (ageRanges.includes(ageGroup)) {
      cityData[cityName].age15to44 += totalValue;
    }
  }
  
  // Calcular proporções
  const proportions = {};
  for (const [cityName, data] of Object.entries(cityData)) {
    if (data.total > 0) {
      proportions[cityName] = data.age15to44 / data.total;
    }
  }
  
  return proportions;
}

// Buscar população do Censo 2022 via API SIDRA
async function fetchCenso2022Population(ibgeCode) {
  try {
    const url = `https://apisidra.ibge.gov.br/values/t/9514/n6/${ibgeCode}/v/93/p/2022`;
    
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (Array.isArray(json) && json.length > 1) {
              // Primeiro registro é header
              const populationStr = json[1].V;
              const population = parseInt(populationStr) || 0;
              resolve(population);
            } else {
              resolve(0);
            }
          } catch (e) {
            resolve(0);
          }
        });
      }).on('error', () => resolve(0));
    });
  } catch (error) {
    return 0;
  }
}

async function updateAllCitiesCenso2022() {
  try {
    console.log('🔄 Atualizando com População CENSO 2022 + Proporções CENSO 2010...\n');
    console.log('='.repeat(80));
    
    // 1. Processar proporções do Censo 2010
    console.log('📊 Processando proporções do Censo 2010...');
    const proportions = parseCSVProportions();
    console.log(`✅ ${Object.keys(proportions).length} proporções calculadas\n`);
    
    // 2. Buscar cidades do banco
    console.log('📊 Buscando cidades do banco de dados...');
    const cities = await prisma.city.findMany({
      select: {
        id: true,
        name: true
      }
    });
    console.log(`✅ ${cities.length} cidades no banco\n`);
    
    console.log('='.repeat(80));
    console.log('🔄 Iniciando atualização...\n');
    
    let updated = 0;
    let notFoundProportion = 0;
    let noCenso2022Data = 0;
    
    for (const city of cities) {
      const cityNameNormalized = city.name.trim();
      let proportion = proportions[cityNameNormalized];
      
      console.log(`\n📍 ${city.name} (ID: ${city.id})`);
      
      if (!proportion) {
        console.log(`  ⚠️  Proporção não encontrada - usando 42%`);
        notFoundProportion++;
        proportion = 0.42;
      } else {
        console.log(`  📊 Proporção Censo 2010: ${(proportion * 100).toFixed(2)}%`);
      }
      
      // Buscar população do Censo 2022
      console.log(`  🔍 Buscando população Censo 2022...`);
      const censo2022Pop = await fetchCenso2022Population(city.id.toString());
      
      if (censo2022Pop === 0) {
        console.log(`  ⚠️  População Censo 2022 não encontrada`);
        noCenso2022Data++;
        continue;
      }
      
      console.log(`  ✅ População Censo 2022: ${censo2022Pop.toLocaleString('pt-BR')}`);
      
      const population15to44 = Math.round(censo2022Pop * proportion);
      console.log(`  🎯 População 15-44 calculada: ${population15to44.toLocaleString('pt-BR')}`);
      
      // Atualizar no banco
      await prisma.city.update({
        where: { id: city.id },
        data: {
          population: censo2022Pop,
          population15to44: population15to44
        }
      });
      
      console.log(`  ✅ Atualizado!`);
      updated++;
      
      // Delay para não sobrecarregar API
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DA ATUALIZAÇÃO\n');
    console.log('='.repeat(80));
    console.log(`✅ Total de cidades: ${cities.length}`);
    console.log(`✅ Atualizadas com Censo 2022: ${updated}`);
    console.log(`⚠️  Sem proporção Censo 2010: ${notFoundProportion}`);
    console.log(`⚠️  Sem dados Censo 2022: ${noCenso2022Data}`);
    console.log('='.repeat(80));
    console.log('\n✅ Atualização concluída!');
    console.log('\n📋 DADOS UTILIZADOS:');
    console.log('   - População Total: CENSO 2022 (mais recente)');
    console.log('   - Proporção 15-44: CENSO 2010 (último com faixas etárias)');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllCitiesCenso2022();

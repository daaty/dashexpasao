const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Processar CSV completo do Censo 2010
function parseCSVComplete() {
  const content = fs.readFileSync('./tabela1378.csv', 'utf-8');
  const lines = content.split('\n');
  
  const cityData = {};
  
  // Faixas etárias que queremos: 15 a 44 anos
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
    
    // Parse CSV com split simples por ponto e vírgula
    const parts = line.split(';');
    if (parts.length < 4) continue;
    
    // Remover aspas e limpar
    const cityNameCSV = parts[0].replace(/"/g, '').trim();
    const ageGroup = parts[1].replace(/"/g, '').trim();
    const condition = parts[2].replace(/"/g, '').trim();
    const totalValueStr = parts[3].replace(/"/g, '').trim();
    
    // Pular linhas com valores percentuais (contêm vírgula)
    if (totalValueStr.includes(',')) continue;
    
    const totalValue = parseInt(totalValueStr) || 0;
    
    // Filtrar apenas cidades do MT e condição "Total"
    if (!cityNameCSV.includes('(MT)')) continue;
    if (condition !== 'Total') continue;
    
    // Remover o " (MT)" do nome
    const cityName = cityNameCSV.replace(' (MT)', '').trim();
    
    // Inicializar dados da cidade
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
    return 0;
  }
}

async function updateAllCities() {
  try {
    console.log('🔄 Atualizando TODAS as cidades com dados do Censo 2010...\n');
    console.log('='.repeat(80));
    
    // 1. Processar CSV
    console.log('📊 Processando CSV do Censo 2010...');
    const censoData = parseCSVComplete();
    console.log(`✅ ${Object.keys(censoData).length} cidades encontradas no Censo 2010\n`);
    
    // 2. Buscar todas as cidades do banco
    console.log('📊 Buscando cidades do banco de dados...');
    const cities = await prisma.city.findMany({
      select: {
        id: true,
        name: true,
        population: true
      }
    });
    console.log(`✅ ${cities.length} cidades no banco\n`);
    
    console.log('='.repeat(80));
    console.log('🔄 Iniciando atualização...\n');
    
    let updated = 0;
    let notFoundInCenso = 0;
    let noCurrentPop = 0;
    
    for (const city of cities) {
      const cityNameNormalized = city.name.trim();
      const censoCity = censoData[cityNameNormalized];
      
      console.log(`\n📍 ${city.name} (ID: ${city.id})`);
      
      if (!censoCity) {
        console.log(`  ⚠️ Não encontrada no Censo 2010 - mantendo proporção de 42%`);
        notFoundInCenso++;
        
        // Usar proporção conservadora de 42% para cidades sem dados
        const currentPop = city.population || 0;
        if (currentPop > 0) {
          const pop15to44 = Math.round(currentPop * 0.42);
          await prisma.city.update({
            where: { id: city.id },
            data: { population15to44: pop15to44 }
          });
          console.log(`  ✅ População 15-44: ${pop15to44.toLocaleString('pt-BR')} (estimativa 42%)`);
          updated++;
        }
        continue;
      }
      
      // Buscar população atual se não tiver
      let currentPopulation = city.population;
      if (!currentPopulation || currentPopulation === 0) {
        console.log(`  📊 Buscando população atual...`);
        currentPopulation = await fetchCurrentPopulation(city.id.toString());
        
        if (currentPopulation === 0) {
          console.log(`  ⚠️ Não foi possível obter população atual`);
          noCurrentPop++;
          continue;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay para API
      }
      
      // Calcular proporção do Censo 2010
      const proportion = censoCity.age15to44 / censoCity.total;
      const population15to44 = Math.round(currentPopulation * proportion);
      
      console.log(`  📊 Censo 2010: ${censoCity.total.toLocaleString('pt-BR')} (${censoCity.age15to44.toLocaleString('pt-BR')} de 15-44)`);
      console.log(`  📊 Proporção real: ${(proportion * 100).toFixed(2)}%`);
      console.log(`  🎯 População atual: ${currentPopulation.toLocaleString('pt-BR')}`);
      console.log(`  🎯 População 15-44: ${population15to44.toLocaleString('pt-BR')}`);
      
      // Atualizar no banco
      await prisma.city.update({
        where: { id: city.id },
        data: {
          population: currentPopulation,
          population15to44: population15to44
        }
      });
      
      console.log(`  ✅ Atualizado!`);
      updated++;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DA ATUALIZAÇÃO\n');
    console.log('='.repeat(80));
    console.log(`✅ Total de cidades: ${cities.length}`);
    console.log(`✅ Atualizadas: ${updated}`);
    console.log(`⚠️  Não encontradas no Censo: ${notFoundInCenso}`);
    console.log(`⚠️  Sem população atual: ${noCurrentPop}`);
    console.log('='.repeat(80));
    console.log('\n✅ Atualização concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllCities();

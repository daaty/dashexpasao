const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapeamento de nomes de cidades para códigos IBGE (código do município)
const cityIbgeCodes = {
  'Nova Monte Verde': '5106240',
  'Paranaíta': '5106299',
  'Apiacás': '5100805',
  'Alta Floresta': '5100250',
  'Guarantã do Norte': '5104104',
  'Peixoto de Azevedo': '5106422'
};

async function fetchPopulationData(ibgeCode) {
  try {
    // População total - Agregado 9514 (Estimativa populacional)
    const totalPopUrl = `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/-1/variaveis/93?localidades=N6[${ibgeCode}]`;
    
    console.log(`Buscando dados para código IBGE ${ibgeCode}...`);
    
    // Buscar população total
    const totalResponse = await fetch(totalPopUrl);
    const totalData = await totalResponse.json();
    
    let totalPopulation = 0;
    if (totalData && totalData[0] && totalData[0].resultados && totalData[0].resultados[0]) {
      const serie = totalData[0].resultados[0].series[0];
      if (serie && serie.serie) {
        const latestYear = Object.keys(serie.serie).sort().reverse()[0];
        totalPopulation = parseInt(serie.serie[latestYear]) || 0;
      }
    }
    
    // Buscar população por faixa etária do Censo 2010 usando API SIDRA
    // Tabela 200 - População residente por sexo e grupos de idade
    // Grupos de idade: 15 a 19 (3299), 20 a 24 (3300), 25 a 29 (3301), 30 a 34 (3302), 35 a 39 (3303), 40 a 44 (3304)
    
    let population15to44Censo2010 = 0;
    console.log('  📊 Buscando dados do Censo 2010 (faixas 15-44 anos)...');
    
    try {
      // Buscar cada faixa etária do Censo 2010
      const ageGroups = ['3299', '3300', '3301', '3302', '3303', '3304']; // 15-19, 20-24, 25-29, 30-34, 35-39, 40-44
      const ageNames = ['15-19', '20-24', '25-29', '30-34', '35-39', '40-44'];
      
      for (let i = 0; i < ageGroups.length; i++) {
        const sidraUrl = `https://apisidra.ibge.gov.br/values/t/200/n6/${ibgeCode}/v/93/p/2010/c2/0/c287/${ageGroups[i]}`;
        
        const response = await fetch(sidraUrl);
        const data = await response.json();
        
        // Pular o header (primeiro elemento)
        if (data && data.length > 1) {
          const value = parseInt(data[1].V) || 0;
          population15to44Censo2010 += value;
          console.log(`    ${ageNames[i]} anos: ${value.toLocaleString('pt-BR')}`);
        }
        
        // Pequeno delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      if (population15to44Censo2010 > 0) {
        console.log(`  ✅ Total Censo 2010 (15-44): ${population15to44Censo2010.toLocaleString('pt-BR')}`);
        
        // Buscar população total do Censo 2010 para calcular proporção
        const sidraTotal2010Url = `https://apisidra.ibge.gov.br/values/t/200/n6/${ibgeCode}/v/93/p/2010/c2/0/c287/0`;
        const totalResponse2010 = await fetch(sidraTotal2010Url);
        const totalData2010 = await totalResponse2010.json();
        
        let totalPopulation2010 = 0;
        if (totalData2010 && totalData2010.length > 1) {
          totalPopulation2010 = parseInt(totalData2010[1].V) || 0;
        }
        
        if (totalPopulation2010 > 0) {
          // Calcular proporção do Censo 2010
          const proportion2010 = population15to44Censo2010 / totalPopulation2010;
          console.log(`  📊 Proporção 2010: ${(proportion2010 * 100).toFixed(1)}%`);
          
          // Aplicar a mesma proporção à população atual
          const population15to44 = Math.round(totalPopulation * proportion2010);
          console.log(`  🎯 Estimativa atual (15-44): ${population15to44.toLocaleString('pt-BR')}`);
          
          return {
            totalPopulation,
            population15to44
          };
        }
      }
    } catch (err) {
      console.log(`  ⚠️ Erro ao buscar Censo 2010: ${err.message}`);
    }
    
    // Se não conseguiu dados do Censo, usar proporção padrão
    console.log('  📊 Usando proporção média nacional (45%)');
    const population15to44 = Math.round(totalPopulation * 0.45);
    
    return {
      totalPopulation,
      population15to44
    };
  } catch (error) {
    console.error(`Erro ao buscar dados do IBGE para ${ibgeCode}:`, error.message);
    return null;
  }
}

async function updateCityPopulation() {
  try {
    console.log('🔄 Iniciando atualização de dados de população do IBGE...\n');
    
    const updatedCities = [];
    const errors = [];
    
    for (const [cityName, ibgeCode] of Object.entries(cityIbgeCodes)) {
      console.log(`📍 Processando ${cityName}...`);
      
      // Buscar dados do IBGE
      const populationData = await fetchPopulationData(ibgeCode);
      
      if (populationData) {
        // Atualizar no banco de dados
        const result = await prisma.city.updateMany({
          where: { name: cityName },
          data: {
            population: populationData.totalPopulation,
            population15to44: populationData.population15to44
          }
        });
        
        if (result.count > 0) {
          console.log(`✅ ${cityName}:`);
          console.log(`   População Total: ${populationData.totalPopulation.toLocaleString('pt-BR')}`);
          console.log(`   População 15-44: ${populationData.population15to44.toLocaleString('pt-BR')}\n`);
          
          updatedCities.push({
            name: cityName,
            population: populationData.totalPopulation,
            population15to44: populationData.population15to44
          });
        } else {
          console.log(`⚠️  ${cityName} não encontrada no banco de dados\n`);
          errors.push(`${cityName} não encontrada`);
        }
      } else {
        console.log(`❌ Erro ao buscar dados para ${cityName}\n`);
        errors.push(`Erro ao buscar dados para ${cityName}`);
      }
      
      // Aguardar um pouco entre requisições para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA ATUALIZAÇÃO');
    console.log('='.repeat(60));
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
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCityPopulation();

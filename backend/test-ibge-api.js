// Script para testar diferentes agregados da API do IBGE
async function testIBGEAggregates() {
  const ibgeCode = '5100250'; // Alta Floresta (cidade maior para teste)
  
  console.log('🔍 Testando agregados do IBGE para Alta Floresta...\n');
  
  // Agregados a testar
  const aggregates = [
    { id: '1378', name: 'Censo 2010 - População por idade e sexo', periodo: '2010', variavel: '93' },
    { id: '4092', name: 'Censo 2022 - População residente', periodo: '2022', variavel: '93' },
    { id: '136', name: 'População residente - Censo 2010', periodo: '2010', variavel: '93' },
    { id: '200', name: 'População residente por sexo e idade - Censo 2000', periodo: '2000', variavel: '93' },
    { id: '7358', name: 'Projeção da população do Brasil', periodo: '-1', variavel: '606' }
  ];
  
  for (const agg of aggregates) {
    console.log(`\n📊 Testando Agregado ${agg.id} - ${agg.name}`);
    console.log('─'.repeat(70));
    
    try {
      // Testar metadados primeiro
      const metaUrl = `https://servicodados.ibge.gov.br/api/v3/agregados/${agg.id}/metadados`;
      console.log(`Metadados: ${metaUrl}`);
      
      const metaResponse = await fetch(metaUrl);
      const metaData = await metaResponse.json();
      
      if (metaData && metaData[0]) {
        console.log(`✅ Nome: ${metaData[0].nome}`);
        
        // Verificar classificações disponíveis
        if (metaData[0].classificacoes && metaData[0].classificacoes.length > 0) {
          console.log(`\n📋 Classificações disponíveis:`);
          metaData[0].classificacoes.forEach(classif => {
            console.log(`  - ID ${classif.id}: ${classif.nome}`);
            if (classif.categorias && classif.categorias.length > 0) {
              const sample = classif.categorias.slice(0, 3);
              console.log(`    Categorias (${classif.categorias.length}): ${sample.map(c => c.nome).join(', ')}...`);
            }
          });
        }
        
        // Tentar buscar dados
        const dataUrl = `https://servicodados.ibge.gov.br/api/v3/agregados/${agg.id}/periodos/${agg.periodo}/variaveis/${agg.variavel}?localidades=N6[${ibgeCode}]`;
        console.log(`\nDados: ${dataUrl}`);
        
        const dataResponse = await fetch(dataUrl);
        const data = await dataResponse.json();
        
        if (data && data[0] && data[0].resultados) {
          console.log(`✅ Dados encontrados! Resultados: ${data[0].resultados.length}`);
          
          // Mostrar uma amostra
          if (data[0].resultados[0] && data[0].resultados[0].series) {
            const firstSeries = data[0].resultados[0].series[0];
            if (firstSeries) {
              console.log(`  Localidade: ${firstSeries.localidade?.nome || 'N/A'}`);
              console.log(`  Série:`, firstSeries.serie);
            }
          }
        } else {
          console.log(`⚠️ Sem dados disponíveis`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
    
    // Delay entre requisições
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Testar com classificação de idade
  console.log(`\n\n🎯 Testando com classificação de faixa etária...`);
  console.log('='.repeat(70));
  
  try {
    // Censo 2010 com classificação de idade
    const censo2010Url = `https://servicodados.ibge.gov.br/api/v3/agregados/1378/periodos/2010/variaveis/93?localidades=N6[${ibgeCode}]&classificacao=2[6794]`;
    console.log(`\nURL: ${censo2010Url}`);
    
    const response = await fetch(censo2010Url);
    const data = await response.json();
    
    console.log(`\nResposta completa:`, JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

testIBGEAggregates();

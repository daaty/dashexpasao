const https = require('https');

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

async function exploreCenso2022() {
  console.log('🔍 Explorando agregados do Censo 2022...\n');
  console.log('='.repeat(80));
  
  // Buscar agregados que mencionam censo 2022
  console.log('\n1️⃣ Buscando agregados relacionados ao Censo 2022...\n');
  
  const agregadosCenso2022 = [
    { id: 4092, nome: 'População residente - Censo 2022' },
    { id: 4093, nome: 'População residente por sexo - Censo 2022' },
    { id: 4094, nome: 'População residente por idade - Censo 2022' }
  ];
  
  for (const agg of agregadosCenso2022) {
    console.log(`\n📊 Testando Agregado ${agg.id}: ${agg.nome}`);
    console.log('─'.repeat(80));
    
    try {
      // Buscar metadados
      const metaUrl = `https://servicodados.ibge.gov.br/api/v3/agregados/${agg.id}/metadados`;
      console.log(`\n🔗 URL Metadados: ${metaUrl}`);
      
      const meta = await fetchUrl(metaUrl);
      
      if (meta && meta[0]) {
        console.log(`\n✅ Agregado encontrado!`);
        console.log(`   Nome: ${meta[0].nome}`);
        console.log(`   Pesquisa: ${meta[0].pesquisa}`);
        
        // Mostrar variáveis
        if (meta[0].variaveis && meta[0].variaveis.length > 0) {
          console.log(`\n   📈 Variáveis (${meta[0].variaveis.length}):`);
          meta[0].variaveis.forEach(v => {
            console.log(`      - ID ${v.id}: ${v.nome} (${v.unidade})`);
          });
        }
        
        // Mostrar classificações
        if (meta[0].classificacoes && meta[0].classificacoes.length > 0) {
          console.log(`\n   🏷️  Classificações (${meta[0].classificacoes.length}):`);
          meta[0].classificacoes.forEach(c => {
            console.log(`      - ID ${c.id}: ${c.nome}`);
            if (c.categorias && c.categorias.length > 0) {
              console.log(`        Categorias: ${c.categorias.length} disponíveis`);
              // Mostrar algumas categorias relevantes
              const relevant = c.categorias.filter(cat => 
                cat.nome.includes('15') || cat.nome.includes('20') || 
                cat.nome.includes('25') || cat.nome.includes('30') ||
                cat.nome.includes('35') || cat.nome.includes('40') ||
                cat.nome.includes('Homens') || cat.nome.includes('Mulheres')
              );
              if (relevant.length > 0) {
                console.log(`        Relevantes para 15-44 anos:`);
                relevant.forEach(r => {
                  console.log(`          * ${r.id}: ${r.nome}`);
                });
              }
            }
          });
        }
        
        // Testar uma requisição de dados para Alta Floresta
        console.log(`\n   🧪 Testando requisição para Alta Floresta (5100250)...`);
        
        const ibgeCode = '5100250';
        const periodos = meta[0].periodicidade?.fim || '2022';
        
        // Tentar requisição básica
        const dataUrl = `https://servicodados.ibge.gov.br/api/v3/agregados/${agg.id}/periodos/${periodos}/variaveis/93?localidades=N6[${ibgeCode}]`;
        console.log(`   URL: ${dataUrl}`);
        
        try {
          const data = await fetchUrl(dataUrl);
          if (data && data[0]) {
            console.log(`   ✅ Dados encontrados!`);
            if (data[0].resultados && data[0].resultados[0]) {
              console.log(`      Resultados: ${data[0].resultados.length}`);
            }
          }
        } catch (err) {
          console.log(`   ⚠️ Erro na requisição de dados: ${err.message}`);
        }
        
      } else {
        console.log(`   ⚠️ Agregado não encontrado ou sem dados`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // Delay entre requisições
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n2️⃣ Exemplo de URL para buscar população por sexo e idade (Censo 2022):\n');
  console.log('Para população de 15-44 anos separado por sexo, a estrutura seria:');
  console.log('');
  console.log('https://servicodados.ibge.gov.br/api/v3/agregados/{AGREGADO}/periodos/2022/variaveis/{VARIAVEL}');
  console.log('  ?localidades=N6[CODIGO_IBGE]');
  console.log('  &classificacao={ID_CLASSIFICACAO_SEXO}[{ID_HOMENS},{ID_MULHERES}]');
  console.log('  |{ID_CLASSIFICACAO_IDADE}[{FAIXAS_15_A_44}]');
  console.log('');
  console.log('Onde as faixas 15-44 seriam os IDs das categorias:');
  console.log('  - 15 a 19 anos');
  console.log('  - 20 a 24 anos');
  console.log('  - 25 a 29 anos');
  console.log('  - 30 a 34 anos');
  console.log('  - 35 a 39 anos');
  console.log('  - 40 a 44 anos');
  console.log('');
  console.log('='.repeat(80));
}

exploreCenso2022();

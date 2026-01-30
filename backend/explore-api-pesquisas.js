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

async function explorePesquisas() {
  console.log('🔍 Explorando API de Pesquisas do IBGE...\n');
  console.log('='.repeat(80));
  
  try {
    // 1. Buscar todas as pesquisas
    console.log('\n1️⃣ Buscando pesquisas relacionadas a população/censo...\n');
    
    const url = 'https://servicodados.ibge.gov.br/api/v1/pesquisas?q=população';
    console.log(`URL: ${url}\n`);
    
    const pesquisas = await fetchUrl(url);
    
    if (pesquisas && pesquisas.length > 0) {
      console.log(`✅ ${pesquisas.length} pesquisas encontradas:\n`);
      
      pesquisas.forEach((p, index) => {
        console.log(`${index + 1}. ID ${p.id}: ${p.descricao}`);
        if (p.observacao) {
          console.log(`   Obs: ${p.observacao.substring(0, 100)}...`);
        }
      });
      
      // 2. Buscar indicadores de uma pesquisa específica relacionada a população
      console.log('\n' + '='.repeat(80));
      console.log('\n2️⃣ Explorando indicadores da pesquisa de população...\n');
      
      // Pesquisa 37 geralmente é população
      const pesquisaId = 37;
      const urlIndicadores = `https://servicodados.ibge.gov.br/api/v1/pesquisas/${pesquisaId}/indicadores/0`;
      console.log(`URL: ${urlIndicadores}\n`);
      
      const indicadores = await fetchUrl(urlIndicadores);
      
      if (indicadores && indicadores.length > 0) {
        console.log(`✅ ${indicadores.length} indicadores encontrados:\n`);
        
        // Filtrar indicadores relevantes para 15-44 anos
        const relevantes = indicadores.filter(ind => 
          ind.indicador && (
            ind.indicador.includes('15') || 
            ind.indicador.includes('44') ||
            ind.indicador.includes('idade') ||
            ind.indicador.includes('sexo')
          )
        );
        
        if (relevantes.length > 0) {
          console.log(`📊 Indicadores relevantes para faixa 15-44 anos:\n`);
          relevantes.forEach(ind => {
            console.log(`   ID ${ind.id} (${ind.posicao}): ${ind.indicador}`);
            if (ind.unidade) {
              console.log(`     Unidade: ${ind.unidade.id}`);
            }
          });
        }
        
        // Mostrar alguns indicadores gerais
        console.log(`\n📊 Primeiros indicadores:\n`);
        indicadores.slice(0, 20).forEach(ind => {
          console.log(`   ${ind.posicao} - ${ind.indicador} (ID: ${ind.id})`);
        });
      }
      
      // 3. Testar requisição para Alta Floresta
      console.log('\n' + '='.repeat(80));
      console.log('\n3️⃣ Testando requisição para Alta Floresta...\n');
      
      const ibgeCode = '5100250';
      const urlResultado = `https://servicodados.ibge.gov.br/api/v1/pesquisas/${pesquisaId}/indicadores/0/resultados/${ibgeCode}?groupBy=localidade`;
      console.log(`URL: ${urlResultado}\n`);
      
      const resultado = await fetchUrl(urlResultado);
      
      if (resultado && resultado.length > 0) {
        console.log(`✅ ${resultado.length} resultados encontrados\n`);
        
        // Mostrar amostra dos primeiros resultados
        console.log('Amostra de resultados:');
        resultado.slice(0, 5).forEach((r, i) => {
          console.log(`\n${i + 1}. Localidade: ${r.localidade}`);
          if (r.res) {
            const periodos = Object.keys(r.res).slice(0, 3);
            periodos.forEach(p => {
              console.log(`   ${p}: ${r.res[p]}`);
            });
          }
        });
      }
      
    } else {
      console.log('⚠️ Nenhuma pesquisa encontrada');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Exploração concluída!');
    console.log('\n💡 Para buscar dados específicos de população por idade e sexo:');
    console.log('   1. Identificar o ID da pesquisa correta (provavelmente ID 37 - População)');
    console.log('   2. Buscar os indicadores específicos para faixas etárias 15-44');
    console.log('   3. Filtrar por classificação de sexo (Homens/Mulheres)');
    console.log('   4. Fazer requisição para cada município');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

explorePesquisas();

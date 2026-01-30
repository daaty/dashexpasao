// Script para buscar dados reais do Censo 2010 por faixa etária
async function fetchCenso2010Data() {
  const ibgeCode = '5100250'; // Alta Floresta
  
  console.log('🔍 Buscando dados do Censo 2010 para Alta Floresta...\n');
  
  // Tabela 200 do SIDRA - População residente por sexo e grupos de idade
  // Vamos buscar dados agregados por grupos quinquenais
  
  try {
    // Buscar usando a API do SIDRA (formato mais direto)
    // /t/{tabela}/n6/{municipio}/v/{variavel}/p/{periodo}/c58/{categorias_sexo}/c1141/{categorias_idade}
    
    // Categorias de grupos de idade que precisamos (15-44):
    // Grupo 15 a 19 anos, 20 a 24, 25 a 29, 30 a 34, 35 a 39, 40 a 44
    
    // Usando tabela 200 do SIDRA
    const sidraUrl = `https://apisidra.ibge.gov.br/values/t/200/n6/${ibgeCode}/v/93/p/2010/c2/0/c287/3299,3300,3301,3302,3303,3304`;
    
    console.log('URL:', sidraUrl);
    console.log('');
    
    const response = await fetch(sidraUrl);
    const data = await response.json();
    
    console.log('Resposta:', JSON.stringify(data, null, 2));
    
    if (Array.isArray(data) && data.length > 0) {
      let total15to44 = 0;
      
      data.forEach((item, index) => {
        if (index > 0) { // Pular header
          console.log(`Linha ${index}:`, item);
          const value = parseInt(item.V) || 0;
          total15to44 += value;
        }
      });
      
      console.log(`\n✅ Total 15-44 anos: ${total15to44.toLocaleString('pt-BR')}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

fetchCenso2010Data();

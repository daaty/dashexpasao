/**
 * Script executor principal para atualizar dados das cidades usando as requisições IBGE coletadas
 * Executa as mesmas requisições que você capturou do site do IBGE
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Headers das requisições conforme coletado
const headers = {
  "accept": "*/*",
  "sec-ch-ua": "\"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"144\", \"Google Chrome\";v=\"144\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\"",
  "referrer": "https://cidades.ibge.gov.br/",
  "mode": "cors",
  "credentials": "omit"
};

/**
 * Executa uma requisição específica do IBGE
 */
async function executarRequisicaoIBGE(url: string, descricao: string): Promise<any> {
  try {
    console.log(`🔄 ${descricao}...`);
    const response = await axios.get(url, { headers });
    console.log(`✅ ${descricao} - ${response.data ? 'Sucesso' : 'Sem dados'}`);
    return response.data;
  } catch (error) {
    console.error(`❌ ${descricao} - Erro:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Busca indicadores principais (conforme suas requisições)
 */
async function buscarIndicadoresPrincipais() {
  const indicadores = "29169%7C29170%7C96385%7C29171%7C96386%7C143558%7C143514%7C60037%7C60045%7C78187%7C78192%7C5908%7C5913%7C5929%7C5934%7C5950%7C5955%7C47001%7C30255%7C28141%7C60048%7C29749%7C30279%7C60032%7C28242%7C95335%7C60030%7C60029%7C60031%7C93371%7C77861%7C82270%7C29167%7C87529%7C87530%7C91245%7C91247%7C91249%7C91251";
  
  return await executarRequisicaoIBGE(
    `https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/${indicadores}?localidade=&lang=pt`,
    "Buscando indicadores principais"
  );
}

/**
 * Busca dados específicos para uma cidade (usando o exemplo da Nova Mutum - código 510622)
 */
async function buscarDadosCidade(codigoCidade: string) {
  const indicadores = "29169%7C29170%7C96385%7C29171%7C96386%7C143558%7C143514%7C60037%7C60045%7C78187%7C78192%7C5908%7C5913%7C5929%7C5934%7C5950%7C5955%7C47001%7C30255%7C28141%7C60048%7C29749%7C30279%7C60032%7C28242%7C95335%7C60030%7C60029%7C60031%7C93371%7C77861%7C82270%7C29167%7C87529%7C87530%7C91245%7C91247%7C91249%7C91251";
  
  return await executarRequisicaoIBGE(
    `https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/${indicadores}/resultados/${codigoCidade}`,
    `Buscando dados específicos da cidade ${codigoCidade}`
  );
}

/**
 * Busca informações de município específico
 */
async function buscarInfoMunicipio(codigoCidade: string) {
  return await executarRequisicaoIBGE(
    `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${codigoCidade}`,
    `Buscando informações do município ${codigoCidade}`
  );
}

/**
 * Busca dados do Censo 2022 (população por sexo e idade)
 */
async function buscarCenso2022(codigoCidade: string) {
  const indicadoresCenso = "97512%7C97513%7C97527%7C97528%7C97545%7C97546%7C97563%7C97564%7C97581%7C97582%7C97599%7C97600%7C97617%7C97618%7C97635%7C97636%7C97653%7C97654%7C97671%7C97672%7C97689%7C97690%7C97707%7C97708%7C97725%7C97726%7C97743%7C97744%7C97761%7C97762%7C97779%7C97780%7C97797%7C97798%7C97815%7C97816%7C97833%7C97834%7C97851%7C97852%7C97869%7C97870";
  
  return await executarRequisicaoIBGE(
    `https://servicodados.ibge.gov.br/api/v1/pesquisas/10101/periodos/2022/indicadores/${indicadoresCenso}/resultados/${codigoCidade}`,
    `Buscando dados do Censo 2022 para ${codigoCidade}`
  );
}

/**
 * Processa dados dos indicadores IBGE
 */
function processarIndicadoresIBGE(dados: any): any {
  if (!dados || !Array.isArray(dados)) return {};

  const resultado: any = {};

  dados.forEach((item: any) => {
    if (item.serie && Object.keys(item.serie).length > 0) {
      const anos = Object.keys(item.serie).sort();
      const anoRecente = anos[anos.length - 1];
      const valor = item.serie[anoRecente];
      
      // Mapear indicadores para campos do banco
      switch (item.id) {
        case '29169': // População residente
          resultado.population = parseInt(valor) || 0;
          break;
        case '96385': // População homens
        case '96386': // População mulheres
          if (!resultado.populationBySex) resultado.populationBySex = {};
          resultado.populationBySex[item.id === '96385' ? 'men' : 'women'] = parseInt(valor) || 0;
          break;
        case '60045': // Rendimento nominal mensal domiciliar per capita
          resultado.averageIncome = parseFloat(valor) || 0;
          break;
        case '78192': // Salário médio mensal dos trabalhadores formais
          resultado.averageFormalSalary = parseFloat(valor) || 0;
          break;
        case '78187': // Pessoal ocupado
          resultado.formalJobs = parseInt(valor) || 0;
          break;
        case '93371': // Grau de urbanização
          resultado.urbanizationIndex = (parseFloat(valor) || 0) / 100;
          break;
        case '29167': // Área da unidade territorial
          resultado.territorialArea = parseFloat(valor) || 0;
          break;
        case '60030': // Área urbanizada
          resultado.urbanizedAreaKm2 = parseFloat(valor) || 0;
          break;
        case '47001': // PIB per capita
          resultado.gdpPerCapita = parseFloat(valor) || 0;
          break;
      }
    }
  });

  // Calcular população 15-44 anos como aproximação (40% da população total)
  if (resultado.population) {
    resultado.population15to44 = Math.floor(resultado.population * 0.4);
  }

  return resultado;
}

/**
 * Processa dados do Censo 2022
 */
function processarCenso2022(dados: any): any {
  if (!dados || !Array.isArray(dados)) return {};

  const resultado: any = {};
  let populacao15a44Homens = 0;
  let populacao15a44Mulheres = 0;

  dados.forEach((item: any) => {
    if (item.serie && Object.keys(item.serie).length > 0) {
      const valor = parseInt(item.serie['2022']) || 0;
      
      // Faixas etárias de 15-44 anos (conforme indicadores do Censo)
      const faixasEtarias15a44 = [
        '97527', '97528', // 15-19 anos
        '97545', '97546', // 20-24 anos
        '97563', '97564', // 25-29 anos
        '97581', '97582', // 30-34 anos
        '97599', '97600', // 35-39 anos
        '97617', '97618'  // 40-44 anos
      ];
      
      if (faixasEtarias15a44.includes(item.id)) {
        // Indicadores ímpares são homens, pares são mulheres
        if (parseInt(item.id) % 2 === 1) {
          populacao15a44Homens += valor;
        } else {
          populacao15a44Mulheres += valor;
        }
      }
    }
  });

  resultado.population15to44Men = populacao15a44Homens;
  resultado.population15to44Women = populacao15a44Mulheres;
  resultado.population15to44 = populacao15a44Homens + populacao15a44Mulheres;

  return resultado;
}

/**
 * Atualiza uma cidade específica com todos os dados coletados
 */
async function atualizarCidadeCompleta(codigoCidade: string) {
  console.log(`\n🏙️ Atualizando cidade ${codigoCidade}...`);
  console.log('-'.repeat(50));

  try {
    // 1. Buscar informações básicas do município
    const infoMunicipio = await buscarInfoMunicipio(codigoCidade);
    
    // 2. Buscar indicadores principais
    const indicadores = await buscarDadosCidade(codigoCidade);
    
    // 3. Buscar dados do Censo 2022
    const censo2022 = await buscarCenso2022(codigoCidade);

    // Processar dados
    const dadosIndicadores = processarIndicadoresIBGE(indicadores);
    const dadosCenso = processarCenso2022(censo2022);

    // Combinar dados
    const dadosFinais = {
      ...dadosIndicadores,
      ...dadosCenso
    };

    // Mapear mesorregião
    let mesorregion = 'CENTRO_SUL_MATOGROSSENSE';
    if (infoMunicipio && infoMunicipio.microrregiao) {
      const mesoNome = infoMunicipio.microrregiao.mesorregiao?.nome || '';
      if (mesoNome.includes('Norte')) mesorregion = 'NORTE_MATOGROSSENSE';
      else if (mesoNome.includes('Nordeste')) mesorregion = 'NORDESTE_MATOGROSSENSE';
      else if (mesoNome.includes('Sudeste')) mesorregion = 'SUDESTE_MATOGROSSENSE';
      else if (mesoNome.includes('Sudoeste')) mesorregion = 'SUDOESTE_MATOGROSSENSE';
    }

    // Verificar se a cidade existe no banco
    const cityId = parseInt(codigoCidade);
    const existingCity = await prisma.city.findUnique({
      where: { id: cityId }
    });

    const cityName = infoMunicipio?.nome || existingCity?.name || `Cidade ${codigoCidade}`;

    // Preparar dados para atualização/inserção
    const cityData: any = {
      name: cityName,
      mesorregion: mesorregion,
      gentilic: `${cityName.toLowerCase()}ense`,
      anniversary: '01/01', // Padrão - pode ser atualizado com dados de aniversários
      mayor: 'A atualizar'
    };

    // Adicionar dados processados se disponíveis
    if (dadosFinais.population) cityData.population = dadosFinais.population;
    if (dadosFinais.population15to44) cityData.population15to44 = dadosFinais.population15to44;
    if (dadosFinais.averageIncome) cityData.averageIncome = dadosFinais.averageIncome;
    if (dadosFinais.urbanizationIndex !== undefined) cityData.urbanizationIndex = dadosFinais.urbanizationIndex;
    if (dadosFinais.averageFormalSalary) cityData.averageFormalSalary = dadosFinais.averageFormalSalary;
    if (dadosFinais.formalJobs) cityData.formalJobs = dadosFinais.formalJobs;
    if (dadosFinais.urbanizedAreaKm2) cityData.urbanizedAreaKm2 = dadosFinais.urbanizedAreaKm2;

    if (existingCity) {
      // Atualizar cidade existente
      await prisma.city.update({
        where: { id: cityId },
        data: {
          ...cityData,
          updatedAt: new Date()
        }
      });
      console.log(`✅ ${cityName} - Atualizada`);
    } else {
      // Inserir nova cidade
      await prisma.city.create({
        data: {
          id: cityId,
          ...cityData,
          population: cityData.population || 0,
          population15to44: cityData.population15to44 || 0,
          averageIncome: cityData.averageIncome || 0,
          urbanizationIndex: cityData.urbanizationIndex || 0.7,
          status: 'NOT_SERVED',
          averageFormalSalary: cityData.averageFormalSalary || 0,
          formalJobs: cityData.formalJobs || 0,
          urbanizedAreaKm2: cityData.urbanizedAreaKm2 || 50
        }
      });
      console.log(`✅ ${cityName} - Inserida`);
    }

    // Log dos dados principais
    console.log(`📊 Dados atualizados:`);
    if (dadosFinais.population) console.log(`   População: ${dadosFinais.population.toLocaleString()}`);
    if (dadosFinais.population15to44) console.log(`   População 15-44: ${dadosFinais.population15to44.toLocaleString()}`);
    if (dadosFinais.averageIncome) console.log(`   Renda média: R$ ${dadosFinais.averageIncome.toFixed(2)}`);
    if (dadosFinais.averageFormalSalary) console.log(`   Salário formal: R$ ${dadosFinais.averageFormalSalary.toFixed(2)}`);
    if (dadosFinais.urbanizationIndex !== undefined) console.log(`   Urbanização: ${(dadosFinais.urbanizationIndex * 100).toFixed(1)}%`);

    return true;
  } catch (error) {
    console.error(`❌ Erro ao atualizar cidade ${codigoCidade}:`, error);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 INICIANDO ATUALIZAÇÃO DE DADOS DAS CIDADES COM APIS DO IBGE');
  console.log('='.repeat(70));
  console.log('📋 Usando as mesmas requisições coletadas do site do IBGE\n');

  const cidadesParaAtualizar = [
    '5103403', // Cuiabá
    '5108402', // Várzea Grande
    '5107008', // Rondonópolis  
    '5108700', // Sinop
    '5106224', // Nova Mutum (exemplo das suas requisições)
    '5105622', // Cáceres
    '5100201', // Água Boa
    '5100250'  // Águas Mornas
  ];

  let sucessos = 0;
  let erros = 0;

  for (const codigoCidade of cidadesParaAtualizar) {
    const sucesso = await atualizarCidadeCompleta(codigoCidade);
    if (sucesso) {
      sucessos++;
    } else {
      erros++;
    }

    // Pausa entre requisições para não sobrecarregar a API
    console.log('⏳ Aguardando 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ ATUALIZAÇÃO CONCLUÍDA!');
  console.log(`📊 Sucessos: ${sucessos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📍 Total processado: ${cidadesParaAtualizar.length}`);

  await prisma.$disconnect();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { atualizarCidadeCompleta, buscarIndicadoresPrincipais, buscarCenso2022 };
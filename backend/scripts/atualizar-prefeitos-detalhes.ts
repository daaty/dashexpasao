/**
 * Script complementar para buscar dados específicos de prefeitos e 
 * informações municipais detalhadas
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface PrefeitoInfo {
  cityId: number;
  cityName: string;
  mayor: string;
  mandateStart?: string;
  mandateEnd?: string;
  party?: string;
}

/**
 * Base de dados de prefeitos eleitos em 2024 (eleições municipais)
 * Dados que podem ser atualizados com fontes oficiais
 */
const prefeitosData2024: Record<number, PrefeitoInfo> = {
  // Principais cidades do MT - dados fictícios para exemplo
  // Em produção, esses dados viriam de fontes oficiais como TSE
  5103403: { // Cuiabá
    cityId: 5103403,
    cityName: 'Cuiabá',
    mayor: 'Abilio Jacques Brunini Moumer',
    mandateStart: '2021-01-01',
    mandateEnd: '2024-12-31',
    party: 'PSD'
  },
  5108402: { // Várzea Grande
    cityId: 5108402,
    cityName: 'Várzea Grande',
    mayor: 'Kalil Baracat',
    mandateStart: '2021-01-01',
    mandateEnd: '2024-12-31',
    party: 'MDB'
  },
  5107008: { // Rondonópolis
    cityId: 5107008,
    cityName: 'Rondonópolis',
    mayor: 'José Carlos do Pátio',
    mandateStart: '2021-01-01',
    mandateEnd: '2024-12-31',
    party: 'PSD'
  },
  5108700: { // Sinop
    cityId: 5108700,
    cityName: 'Sinop',
    mayor: 'Roberto Dorner',
    mandateStart: '2021-01-01',
    mandateEnd: '2024-12-31',
    party: 'REPUBLICANOS'
  },
  5100250: { // Águas Mornas
    cityId: 5100250,
    cityName: 'Águas Mornas',
    mayor: 'A atualizar',
    mandateStart: '2021-01-01',
    mandateEnd: '2024-12-31'
  }
  // Adicione mais cidades conforme necessário
};

/**
 * Busca informações de prefeitos a partir de dados do TSE ou outras fontes
 * Esta função pode ser expandida para integrar com APIs oficiais
 */
async function buscarDadosPrefeitos(): Promise<PrefeitoInfo[]> {
  console.log('👨‍💼 Buscando informações de prefeitos...');
  
  // Por enquanto, retorna dados estáticos
  // Em uma implementação real, isso buscaria de:
  // - API do TSE (se disponível)
  // - Dados de prefeituras municipais
  // - Outras fontes oficiais
  
  const prefeitos = Object.values(prefeitosData2024);
  console.log(`✅ Encontrados dados de ${prefeitos.length} prefeitos`);
  
  return prefeitos;
}

/**
 * Busca dados específicos de indicadores IBGE para uma cidade
 */
async function buscarIndicadoresDetalhados(cityId: number): Promise<any> {
  try {
    // Usando as requisições que você forneceu, adaptadas para uma cidade específica
    const indicadores = [
      '29169', '29170', '96385', '29171', '96386', // Demografia básica
      '143558', '143514', // População ocupada
      '60037', '60045', // Renda
      '78187', '78192', // Trabalho
      '5908', '5913', '5929', '5934', '5950', '5955', // Indicadores sociais
      '47001', // PIB
      '30255', '28141', // Educação
      '60048', '29749', '30279', // Saúde
      '60032', '28242', '95335', // Infraestrutura
      '60030', '60029', '60031', // Urbanização
      '93371', '77861', '82270', // Demografia avançada
      '29167' // Área territorial
    ];

    const url = `https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/${indicadores.join('%7C')}/resultados/${cityId}`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar indicadores para cidade ${cityId}:`, error);
    return null;
  }
}

/**
 * Processa dados de indicadores e extrai informações relevantes
 */
function processarIndicadores(dados: any): any {
  if (!dados || !Array.isArray(dados)) return {};

  const resultado: any = {};

  dados.forEach((indicador: any) => {
    if (indicador.serie && Object.keys(indicador.serie).length > 0) {
      const anos = Object.keys(indicador.serie).sort();
      const anoMaisRecente = anos[anos.length - 1];
      const valor = indicador.serie[anoMaisRecente];

      switch (indicador.id) {
        case '29169': // População residente
          resultado.population = parseInt(valor) || 0;
          resultado.population15to44 = Math.floor((parseInt(valor) || 0) * 0.4);
          break;
        case '60037': // PIB per capita
          resultado.gdpPerCapita = parseFloat(valor) || 0;
          break;
        case '60045': // Rendimento médio
          resultado.averageIncome = parseFloat(valor) || 0;
          break;
        case '93371': // Taxa de urbanização
          resultado.urbanizationIndex = (parseFloat(valor) || 0) / 100;
          break;
        case '78187': // Pessoal ocupado
          resultado.formalJobs = parseInt(valor) || 0;
          break;
        case '78192': // Salário médio
          resultado.averageFormalSalary = parseFloat(valor) || 0;
          break;
        case '29167': // Área da unidade territorial
          resultado.territorialArea = parseFloat(valor) || 0;
          break;
        case '60030': // Área urbanizada
          resultado.urbanizedAreaKm2 = parseFloat(valor) || 0;
          break;
      }
    }
  });

  return resultado;
}

/**
 * Atualiza dados de uma cidade específica
 */
async function atualizarCidade(cityId: number) {
  console.log(`🏙️ Atualizando cidade ${cityId}...`);

  try {
    // Buscar dados da cidade no banco
    const cidade = await prisma.city.findUnique({
      where: { id: cityId }
    });

    if (!cidade) {
      console.log(`  ⚠️ Cidade ${cityId} não encontrada no banco`);
      return false;
    }

    // Buscar indicadores do IBGE
    const dadosIBGE = await buscarIndicadoresDetalhados(cityId);
    const indicadores = processarIndicadores(dadosIBGE);

    // Buscar dados do prefeito
    const prefeitoInfo = prefeitosData2024[cityId];

    // Preparar dados para atualização
    const dadosAtualizacao: any = {
      updatedAt: new Date()
    };

    // Adicionar indicadores se disponíveis
    if (indicadores.population) dadosAtualizacao.population = indicadores.population;
    if (indicadores.population15to44) dadosAtualizacao.population15to44 = indicadores.population15to44;
    if (indicadores.averageIncome) dadosAtualizacao.averageIncome = indicadores.averageIncome;
    if (indicadores.urbanizationIndex) dadosAtualizacao.urbanizationIndex = indicadores.urbanizationIndex;
    if (indicadores.formalJobs) dadosAtualizacao.formalJobs = indicadores.formalJobs;
    if (indicadores.averageFormalSalary) dadosAtualizacao.averageFormalSalary = indicadores.averageFormalSalary;
    if (indicadores.urbanizedAreaKm2) dadosAtualizacao.urbanizedAreaKm2 = indicadores.urbanizedAreaKm2;

    // Adicionar dados do prefeito se disponíveis
    if (prefeitoInfo) {
      dadosAtualizacao.mayor = prefeitoInfo.mayor;
    }

    // Atualizar no banco
    await prisma.city.update({
      where: { id: cityId },
      data: dadosAtualizacao
    });

    console.log(`  ✅ ${cidade.name} atualizada com sucesso`);
    return true;
  } catch (error) {
    console.error(`  ❌ Erro ao atualizar cidade ${cityId}:`, error);
    return false;
  }
}

/**
 * Função para atualizar todas as cidades com dados específicos
 */
async function atualizarTodasCidades() {
  console.log('🚀 Iniciando atualização detalhada das cidades...');

  try {
    // Buscar todas as cidades do banco
    const cidades = await prisma.city.findMany({
      select: { id: true, name: true }
    });

    console.log(`📍 Encontradas ${cidades.length} cidades para atualizar`);

    let sucessos = 0;
    let erros = 0;

    // Processar cidades em lotes para evitar sobrecarga da API
    const batchSize = 5;
    for (let i = 0; i < cidades.length; i += batchSize) {
      const batch = cidades.slice(i, i + batchSize);
      
      console.log(`\n📦 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(cidades.length/batchSize)}`);
      
      const promises = batch.map(cidade => atualizarCidade(cidade.id));
      const resultados = await Promise.all(promises);
      
      sucessos += resultados.filter(r => r).length;
      erros += resultados.filter(r => !r).length;

      // Pausar entre lotes para não sobrecarregar a API
      if (i + batchSize < cidades.length) {
        console.log('⏳ Aguardando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ ATUALIZAÇÃO CONCLUÍDA!');
    console.log(`📊 Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📍 Total: ${cidades.length}`);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Função para atualizar apenas cidades específicas
 */
async function atualizarCidadesEspecificas(cityIds: number[]) {
  console.log(`🎯 Atualizando ${cityIds.length} cidades específicas...`);
  
  let sucessos = 0;
  for (const cityId of cityIds) {
    const sucesso = await atualizarCidade(cityId);
    if (sucesso) sucessos++;
    
    // Pequena pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n✅ Atualizadas ${sucessos}/${cityIds.length} cidades`);
  await prisma.$disconnect();
}

// Exportar funções para uso
export { atualizarTodasCidades, atualizarCidadesEspecificas, buscarDadosPrefeitos };

// Se executado diretamente
if (require.main === module) {
  // Exemplo: atualizar cidades específicas
  const cidadesImportantes = [5103403, 5108402, 5107008, 5108700]; // Cuiabá, VG, Rondonópolis, Sinop
  
  console.log('Escolha uma opção:');
  console.log('1. Atualizar todas as cidades');
  console.log('2. Atualizar cidades específicas');
  
  // Por padrão, atualizar cidades importantes
  atualizarCidadesEspecificas(cidadesImportantes)
    .catch(console.error);
}
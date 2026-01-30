/**
 * Script para buscar e atualizar TODOS os municípios de Mato Grosso
 * usando as APIs do IBGE
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Headers das requisições
const headers = {
  "accept": "*/*",
  "sec-ch-ua": "\"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"144\", \"Google Chrome\";v=\"144\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\"",
  "referrer": "https://cidades.ibge.gov.br/",
  "mode": "cors" as const,
  "credentials": "omit" as const
};

// Mapeamento de mesorregiões
const mesorregionMap: Record<string, string> = {
  'Norte Mato-grossense': 'NORTE_MATOGROSSENSE',
  'Nordeste Mato-grossense': 'NORDESTE_MATOGROSSENSE',
  'Centro-Sul Mato-grossense': 'CENTRO_SUL_MATOGROSSENSE',
  'Sudeste Mato-grossense': 'SUDESTE_MATOGROSSENSE',
  'Sudoeste Mato-grossense': 'SUDOESTE_MATOGROSSENSE',
};

interface IBGEMunicipio {
  id: number;
  nome: string;
  microrregiao: {
    id: number;
    nome: string;
    mesorregiao: {
      id: number;
      nome: string;
    };
  };
}

/**
 * Busca todos os municípios de Mato Grosso
 */
async function buscarTodosMunicipiosMT(): Promise<IBGEMunicipio[]> {
  try {
    console.log('🌎 Buscando todos os municípios de Mato Grosso...');
    const response = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios', { headers });
    console.log(`✅ Encontrados ${response.data.length} municípios de MT`);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar municípios:', error);
    return [];
  }
}

/**
 * Busca indicadores para uma cidade específica
 */
async function buscarIndicadoresCidade(codigoCidade: string): Promise<any> {
  const indicadores = "29169%7C29170%7C96385%7C29171%7C96386%7C143558%7C143514%7C60037%7C60045%7C78187%7C78192%7C5908%7C5913%7C5929%7C5934%7C5950%7C5955%7C47001%7C30255%7C28141%7C60048%7C29749%7C30279%7C60032%7C28242%7C95335%7C60030%7C60029%7C60031%7C93371%7C77861%7C82270%7C29167%7C87529%7C87530%7C91245%7C91247%7C91249%7C91251";
  
  try {
    const response = await axios.get(`https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/${indicadores}/resultados/${codigoCidade}`, { headers });
    return response.data;
  } catch (error) {
    // console.error(`Erro ao buscar indicadores para ${codigoCidade}:`, error);
    return null;
  }
}

/**
 * Processa indicadores IBGE
 */
function processarIndicadores(dados: any): any {
  if (!dados || !Array.isArray(dados)) return {};

  const resultado: any = {};

  dados.forEach((item: any) => {
    if (item.serie && Object.keys(item.serie).length > 0) {
      const anos = Object.keys(item.serie).sort();
      const anoRecente = anos[anos.length - 1];
      const valor = item.serie[anoRecente];
      
      switch (item.id) {
        case '29169': // População residente
          resultado.population = parseInt(valor) || 0;
          resultado.population15to44 = Math.floor((parseInt(valor) || 0) * 0.4);
          break;
        case '60045': // Rendimento nominal mensal
          resultado.averageIncome = parseFloat(valor) || 0;
          break;
        case '78192': // Salário médio mensal
          resultado.averageFormalSalary = parseFloat(valor) || 0;
          break;
        case '78187': // Pessoal ocupado
          resultado.formalJobs = parseInt(valor) || 0;
          break;
        case '93371': // Grau de urbanização
          resultado.urbanizationIndex = (parseFloat(valor) || 0) / 100;
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

  return resultado;
}

/**
 * Processa um município
 */
async function processarMunicipio(municipio: IBGEMunicipio, index: number, total: number): Promise<boolean> {
  try {
    const codigoCidade = municipio.id.toString();
    console.log(`\n🏙️  [${index + 1}/${total}] ${municipio.nome} (${codigoCidade})`);

    // Buscar indicadores
    const indicadoresData = await buscarIndicadoresCidade(codigoCidade);
    const indicadores = processarIndicadores(indicadoresData);

    // Mapear mesorregião
    const mesorregion = mesorregionMap[municipio.microrregiao.mesorregiao.nome] || 'CENTRO_SUL_MATOGROSSENSE';

    // Verificar se a cidade existe
    const cidadeExistente = await prisma.city.findUnique({
      where: { id: municipio.id }
    });

    const dadosCidade: any = {
      name: municipio.nome,
      mesorregion: mesorregion,
      gentilic: `${municipio.nome.toLowerCase()}ense`,
      anniversary: '01/01', // Padrão
      mayor: 'A atualizar'
    };

    // Adicionar dados dos indicadores
    if (indicadores.population) dadosCidade.population = indicadores.population;
    if (indicadores.population15to44) dadosCidade.population15to44 = indicadores.population15to44;
    if (indicadores.averageIncome) dadosCidade.averageIncome = indicadores.averageIncome;
    if (indicadores.urbanizationIndex !== undefined) dadosCidade.urbanizationIndex = indicadores.urbanizationIndex;
    if (indicadores.averageFormalSalary) dadosCidade.averageFormalSalary = indicadores.averageFormalSalary;
    if (indicadores.formalJobs) dadosCidade.formalJobs = indicadores.formalJobs;
    if (indicadores.urbanizedAreaKm2) dadosCidade.urbanizedAreaKm2 = indicadores.urbanizedAreaKm2;

    if (cidadeExistente) {
      // Atualizar cidade existente
      await prisma.city.update({
        where: { id: municipio.id },
        data: {
          ...dadosCidade,
          updatedAt: new Date()
        }
      });
      console.log(`   ✅ Atualizada`);
    } else {
      // Inserir nova cidade
      await prisma.city.create({
        data: {
          id: municipio.id,
          ...dadosCidade,
          population: dadosCidade.population || 0,
          population15to44: dadosCidade.population15to44 || 0,
          averageIncome: dadosCidade.averageIncome || 0,
          urbanizationIndex: dadosCidade.urbanizationIndex || 0.7,
          status: 'NOT_SERVED',
          averageFormalSalary: dadosCidade.averageFormalSalary || 0,
          formalJobs: dadosCidade.formalJobs || 0,
          urbanizedAreaKm2: dadosCidade.urbanizedAreaKm2 || 50
        }
      });
      console.log(`   ➕ Inserida`);
    }

    // Log de dados importantes
    if (indicadores.population) {
      console.log(`   📊 Pop: ${indicadores.population.toLocaleString('pt-BR')} | Renda: R$ ${(indicadores.averageIncome || 0).toFixed(2)} | Urban: ${((indicadores.urbanizationIndex || 0) * 100).toFixed(1)}%`);
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Erro ao processar ${municipio.nome}:`, error);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 ATUALIZAÇÃO COMPLETA - TODOS OS MUNICÍPIOS DE MATO GROSSO');
  console.log('='.repeat(70));
  console.log('📊 Usando APIs oficiais do IBGE\n');

  try {
    // 1. Buscar todos os municípios
    const municipios = await buscarTodosMunicipiosMT();
    if (municipios.length === 0) {
      console.log('❌ Nenhum município encontrado.');
      return;
    }

    console.log(`📍 Iniciando processamento de ${municipios.length} municípios...\n`);

    let sucessos = 0;
    let erros = 0;
    const batchSize = 10; // Processar em lotes

    // 2. Processar em lotes para não sobrecarregar a API
    for (let i = 0; i < municipios.length; i += batchSize) {
      const lote = municipios.slice(i, i + batchSize);
      console.log(`\n📦 LOTE ${Math.floor(i/batchSize) + 1}/${Math.ceil(municipios.length/batchSize)}`);
      console.log('-'.repeat(50));

      // Processar lote
      for (let j = 0; j < lote.length; j++) {
        const sucesso = await processarMunicipio(lote[j], i + j, municipios.length);
        if (sucesso) sucessos++;
        else erros++;

        // Pequena pausa entre requisições
        if (j < lote.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Pausa maior entre lotes
      if (i + batchSize < municipios.length) {
        console.log('⏳ Aguardando 2 segundos antes do próximo lote...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 3. Resultado final
    console.log('\n' + '='.repeat(70));
    console.log('✅ PROCESSAMENTO COMPLETO!');
    console.log(`📊 Estatísticas:`);
    console.log(`   • Municípios processados: ${municipios.length}`);
    console.log(`   • Sucessos: ${sucessos}`);
    console.log(`   • Erros: ${erros}`);
    console.log(`   • Taxa de sucesso: ${((sucessos/municipios.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { buscarTodosMunicipiosMT, processarMunicipio };
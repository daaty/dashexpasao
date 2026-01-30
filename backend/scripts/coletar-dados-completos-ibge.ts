/**
 * Script para coletar TODOS os dados completos das 142 cidades de MT
 * Extrai cada cidade individualmente e salva em arquivo JSON
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

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

interface DadosCidade {
  id: number;
  nome: string;
  mesorregiao: string;
  gentilico: string;
  indicadores: Record<string, any>;
  populacao: number;
  populacao15a44: number;
  populacao15a44M: number;
  populacao15a44F: number;
  rendaMedia: number;
  salarioMedio: number;
  empregosFormal: number;
  urbanizacao: number;
  areaUrbanizada: number;
  areaTotal: number;
  pibPerCapita: number;
  dataAtualizacao: string;
}

/**
 * Busca todos os municípios de MT
 */
async function buscarTodosMunicipiosMT(): Promise<IBGEMunicipio[]> {
  console.log('🌎 Buscando todos os 142 municípios de Mato Grosso...');
  try {
    const response = await axios.get(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios',
      { headers }
    );
    console.log(`✅ Encontrados ${response.data.length} municípios de MT\n`);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar municípios:', error);
    return [];
  }
}

/**
 * Busca dados completos de uma cidade
 */
async function buscarDadosCompletoCidade(codigoCidade: string): Promise<any> {
  const indicadores = "29169%7C29170%7C96385%7C29171%7C96386%7C143558%7C143514%7C60037%7C60045%7C78187%7C78192%7C5908%7C5913%7C5929%7C5934%7C5950%7C5955%7C47001%7C30255%7C28141%7C60048%7C29749%7C30279%7C60032%7C28242%7C95335%7C60030%7C60029%7C60031%7C93371%7C77861%7C82270%7C29167%7C87529%7C87530%7C91245%7C91247%7C91249%7C91251";

  try {
    const response = await axios.get(
      `https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/${indicadores}/resultados/${codigoCidade}`,
      { headers, timeout: 10000 }
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Busca dados do Censo 2022 para população detalhada
 */
async function buscarCenso2022(codigoCidade: string): Promise<any> {
  const indicadoresCenso = "97512%7C97513%7C97527%7C97528%7C97545%7C97546%7C97563%7C97564%7C97581%7C97582%7C97599%7C97600%7C97617%7C97618%7C97635%7C97636%7C97653%7C97654%7C97671%7C97672%7C97689%7C97690%7C97707%7C97708%7C97725%7C97726%7C97743%7C97744%7C97761%7C97762%7C97779%7C97780%7C97797%7C97798%7C97815%7C97816%7C97833%7C97834%7C97851%7C97852%7C97869%7C97870";

  try {
    const response = await axios.get(
      `https://servicodados.ibge.gov.br/api/v1/pesquisas/10101/periodos/2022/indicadores/${indicadoresCenso}/resultados/${codigoCidade}`,
      { headers, timeout: 10000 }
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Processa indicadores e extrai dados estruturados
 */
function processarIndicadores(dados: any): Record<string, any> {
  const resultado: Record<string, any> = {};

  if (!dados || !Array.isArray(dados)) {
    return resultado;
  }

  dados.forEach((item: any) => {
    if (item.serie && Object.keys(item.serie).length > 0) {
      const anos = Object.keys(item.serie).sort();
      const anoRecente = anos[anos.length - 1];
      const valor = item.serie[anoRecente];

      // Mapear indicadores específicos
      const indicadorMap: Record<string, string> = {
        '29169': 'populacao_total',
        '29170': 'populacao_densidade',
        '96385': 'populacao_homens',
        '96386': 'populacao_mulheres',
        '143558': 'populacao_ocupada',
        '143514': 'taxa_ocupacao',
        '60037': 'pib_per_capita',
        '60045': 'renda_media',
        '78187': 'empregos_formal',
        '78192': 'salario_medio',
        '5908': 'mortalidade_infantil',
        '93371': 'taxa_urbanizacao',
        '60030': 'area_urbanizada',
        '29167': 'area_total',
        '87529': 'salario_minimo_ref',
        '91245': 'indice_desenvolvimento',
      };

      const chave = indicadorMap[item.id] || `indicador_${item.id}`;
      resultado[chave] = {
        valor: valor,
        ano: anoRecente,
        indicadorId: item.id,
        indicadorNome: item.indicador
      };
    }
  });

  return resultado;
}

/**
 * Processa dados do Censo
 */
function processarCenso(dados: any): Record<string, any> {
  const resultado: Record<string, any> = {
    homens_15_44: 0,
    mulheres_15_44: 0,
    faixas_etarias: {}
  };

  if (!dados || !Array.isArray(dados)) {
    return resultado;
  }

  dados.forEach((item: any) => {
    if (item.serie && item.serie['2022']) {
      const valor = parseInt(item.serie['2022']) || 0;
      const id = item.id;

      // Faixas de 15-44 anos
      const faixas15a44: Record<string, string> = {
        '97527': '15-19-H', '97528': '15-19-M',
        '97545': '20-24-H', '97546': '20-24-M',
        '97563': '25-29-H', '97564': '25-29-M',
        '97581': '30-34-H', '97582': '30-34-M',
        '97599': '35-39-H', '97600': '35-39-M',
        '97617': '40-44-H', '97618': '40-44-M'
      };

      if (id in faixas15a44) {
        const descricao = faixas15a44[id];
        const sexo = descricao.split('-')[1];
        resultado.faixas_etarias[descricao] = valor;

        if (sexo === 'H') {
          resultado.homens_15_44 += valor;
        } else {
          resultado.mulheres_15_44 += valor;
        }
      }
    }
  });

  return resultado;
}

/**
 * Coleta dados completos de uma cidade
 */
async function coletarDadosCidade(
  municipio: IBGEMunicipio,
  index: number,
  total: number
): Promise<DadosCidade> {
  const codigoCidade = municipio.id.toString();
  console.log(`📍 [${index}/${total}] ${municipio.nome}...`);

  try {
    // Buscar dados em paralelo
    const [indicadores, censo2022] = await Promise.all([
      buscarDadosCompletoCidade(codigoCidade),
      buscarCenso2022(codigoCidade)
    ]);

    const dadosIndicadores = processarIndicadores(indicadores);
    const dadosCenso = processarCenso(censo2022);

    // Extrair valores principais
    const populacao = parseInt(dadosIndicadores.populacao_total?.valor) || 0;
    const populacao15a44 = dadosCenso.homens_15_44 + dadosCenso.mulheres_15_44 || Math.floor(populacao * 0.4);
    const rendaMedia = parseFloat(dadosIndicadores.renda_media?.valor) || 0;
    const salarioMedio = parseFloat(dadosIndicadores.salario_medio?.valor) || 0;
    const empregosFormal = parseInt(dadosIndicadores.empregos_formal?.valor) || 0;
    const urbanizacao = parseFloat(dadosIndicadores.taxa_urbanizacao?.valor) || 0;
    const areaUrbanizada = parseFloat(dadosIndicadores.area_urbanizada?.valor) || 0;
    const areaTotal = parseFloat(dadosIndicadores.area_total?.valor) || 0;
    const pibPerCapita = parseFloat(dadosIndicadores.pib_per_capita?.valor) || 0;

    // Mapear mesorregião com proteção
    const mesoNome = municipio.microrregiao?.mesorregiao?.nome || '';
    const mesoregiao = mesorregionMap[mesoNome] || 'CENTRO_SUL_MATOGROSSENSE';

    return {
      id: municipio.id,
      nome: municipio.nome,
      mesorregiao: mesoregiao,
      gentilico: `${municipio.nome.toLowerCase()}ense`,
      indicadores: dadosIndicadores,
      populacao,
      populacao15a44,
      populacao15a44M: dadosCenso.mulheres_15_44,
      populacao15a44F: dadosCenso.homens_15_44,
      rendaMedia,
      salarioMedio,
      empregosFormal,
      urbanizacao,
      areaUrbanizada,
      areaTotal,
      pibPerCapita,
      dataAtualizacao: new Date().toISOString()
    };
  } catch (error) {
    console.error(`   ❌ Erro ao processar ${municipio.nome}:`, error);
    const mesoNome = municipio.microrregiao?.mesorregiao?.nome || '';
    const mesoregiao = mesorregionMap[mesoNome] || 'CENTRO_SUL_MATOGROSSENSE';
    
    return {
      id: municipio.id,
      nome: municipio.nome,
      mesorregiao: mesoregiao,
      gentilico: `${municipio.nome.toLowerCase()}ense`,
      indicadores: {},
      populacao: 0,
      populacao15a44: 0,
      populacao15a44M: 0,
      populacao15a44F: 0,
      rendaMedia: 0,
      salarioMedio: 0,
      empregosFormal: 0,
      urbanizacao: 0,
      areaUrbanizada: 0,
      areaTotal: 0,
      pibPerCapita: 0,
      dataAtualizacao: new Date().toISOString()
    };
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 COLETA COMPLETA DE DADOS DAS 142 CIDADES DE MATO GROSSO');
  console.log('='.repeat(70));
  console.log('📊 Usando APIs oficiais do IBGE\n');

  try {
    // 1. Buscar municípios
    const municipios = await buscarTodosMunicipiosMT();
    if (municipios.length === 0) {
      console.log('❌ Nenhum município encontrado.');
      return;
    }

    console.log(`📍 Coletando dados de ${municipios.length} municípios...\n`);

    const dadosColetados: DadosCidade[] = [];
    const batchSize = 5;

    // 2. Coletar dados em lotes
    for (let i = 0; i < municipios.length; i += batchSize) {
      const lote = municipios.slice(i, i + batchSize);

      // Processar lote em paralelo
      const promessas = lote.map((mun, idx) =>
        coletarDadosCidade(mun, i + idx + 1, municipios.length)
      );

      const resultados = await Promise.all(promessas);
      dadosColetados.push(...resultados);

      // Progresso
      if ((i + batchSize) % 20 === 0) {
        console.log(`   ✅ ${Math.min(i + batchSize, municipios.length)}/${municipios.length} coletados`);
      }

      // Pausa entre lotes
      if (i + batchSize < municipios.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 3. Salvar dados em arquivo JSON
    const pastaOutput = join(__dirname, '..', 'dados-ibge');
    mkdirSync(pastaOutput, { recursive: true });

    const caminhoJSON = join(pastaOutput, `cidades-mt-dados-ibge-${new Date().toISOString().split('T')[0]}.json`);
    writeFileSync(caminhoJSON, JSON.stringify(dadosColetados, null, 2), 'utf-8');

    console.log(`\n✅ COLETA COMPLETA!`);
    console.log(`📁 Dados salvos em: ${caminhoJSON}`);
    console.log(`📊 Total de cidades: ${dadosColetados.length}`);

    // 4. Estatísticas
    const comPopulacao = dadosColetados.filter(d => d.populacao > 0).length;
    const comRenda = dadosColetados.filter(d => d.rendaMedia > 0).length;
    const comSalario = dadosColetados.filter(d => d.salarioMedio > 0).length;

    console.log(`\n📈 Qualidade dos dados coletados:`);
    console.log(`   • Com população: ${comPopulacao}/${dadosColetados.length}`);
    console.log(`   • Com renda média: ${comRenda}/${dadosColetados.length}`);
    console.log(`   • Com salário médio: ${comSalario}/${dadosColetados.length}`);

    // 5. Top 5 cidades mais populosas
    const topPopulosas = [...dadosColetados]
      .sort((a, b) => b.populacao - a.populacao)
      .slice(0, 5);

    console.log(`\n🏆 Top 5 cidades mais populosas:`);
    topPopulosas.forEach((cidade, i) => {
      console.log(`   ${i + 1}. ${cidade.nome}: ${cidade.populacao.toLocaleString('pt-BR')}`);
    });

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
main().catch(console.error);
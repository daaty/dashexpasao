/**
 * Script avançado para buscar dados COMPLETOS do IBGE
 * com múltiplos indicadores e endpoints
 */

import axios from 'axios';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const headers = { "accept": "*/*", "timeout": 10000 };

interface DadosCidade {
  id: number;
  nome: string;
  mesorregiao: string;
  populacao: number;
  populacao15a44: number;
  rendaMedia: number;
  salarioMedio: number;
  urbanizacao: number;
  areaUrbanizada: number;
  gentilico: string;
  dataAtualizacao: string;
}

/**
 * Busca dados avançados da API IBGE
 */
async function buscarDadosAvancados(codigoCidade: string): Promise<any> {
  try {
    // Usar indicadores mais específicos
    const url = `https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/ranking/96385(2022)%7C96386(2022)%7C143558(2023)%7C143514(2023)%7C60037(2010)%7C60045(2022)%7C78187(2023)%7C78192(2023)%7C47001(2021)%7C28141(2024)%7C60048(2024)%7C29749(2024)%7C30279(2023)%7C60032(2024)%7C95335(2019)%7C60030(2022)%7C60029(2022)%7C60031(2010)%7C93371(2010)%7C29167(2024)?localidade=${codigoCidade}&contexto=BR,51,51006,510008&upper=0&lower=0&natureza=4`;
    
    const response = await axios.get(url, { headers, timeout: 10000 });
    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Processa dados avançados
 */
function processarDadosAvancados(dados: any): Record<string, any> {
  const resultado: Record<string, any> = {
    populacao: 0,
    rendaMedia: 0,
    salarioMedio: 0,
    urbanizacao: 0,
    areaUrbanizada: 0,
    areaTotal: 0
  };

  if (!dados || !Array.isArray(dados)) return resultado;

  dados.forEach((item: any) => {
    const valor = item.valor?.[0]?.[0];
    if (!valor) return;

    switch (item.indicador?.id?.toString()) {
      case '96385': // População homens
      case '96386': // População mulheres
        resultado.populacao += parseInt(valor) || 0;
        break;
      case '60045': // Rendimento
        resultado.rendaMedia = parseFloat(valor) || 0;
        break;
      case '78192': // Salário médio
        resultado.salarioMedio = parseFloat(valor) || 0;
        break;
      case '93371': // Urbanização
        resultado.urbanizacao = parseFloat(valor) || 0;
        break;
      case '60030': // Área urbanizada
        resultado.areaUrbanizada = parseFloat(valor) || 0;
        break;
      case '29167': // Área total
        resultado.areaTotal = parseFloat(valor) || 0;
        break;
    }
  });

  return resultado;
}

/**
 * Função principal
 */
async function main() {
  console.log('\n🚀 COLETA AVANÇADA DE DADOS - 142 CIDADES');
  console.log('='.repeat(60));

  try {
    // 1. Buscar municípios
    console.log('📍 Buscando os 142 municípios de Mato Grosso...');
    const response = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios');
    const municipios = response.data;
    console.log(`✅ Encontrados ${municipios.length} municípios\n`);

    const mesorregionMap: Record<string, string> = {
      'Norte Mato-grossense': 'NORTE_MATOGROSSENSE',
      'Nordeste Mato-grossense': 'NORDESTE_MATOGROSSENSE',
      'Centro-Sul Mato-grossense': 'CENTRO_SUL_MATOGROSSENSE',
      'Sudeste Mato-grossense': 'SUDESTE_MATOGROSSENSE',
      'Sudoeste Mato-grossense': 'SUDOESTE_MATOGROSSENSE',
    };

    // 2. Coletar dados
    const dadosColetados: DadosCidade[] = [];
    let processados = 0;

    for (let i = 0; i < Math.min(municipios.length, 142); i++) {
      const mun = municipios[i];
      const codigoCidade = mun.id.toString();

      // Buscar dados avançados
      const dadosAvancados = await buscarDadosAvancados(codigoCidade);
      const dadosProc = processarDadosAvancados(dadosAvancados);

      // Mapear mesorregião
      const mesoNome = mun.microrregiao?.mesorregiao?.nome || '';
      const mesoreg = mesorregionMap[mesoNome] || 'CENTRO_SUL_MATOGROSSENSE';

      dadosColetados.push({
        id: mun.id,
        nome: mun.nome,
        mesorregiao: mesoreg,
        gentilico: `${mun.nome.toLowerCase()}ense`,
        populacao: dadosProc.populacao,
        populacao15a44: Math.floor((dadosProc.populacao || 0) * 0.4),
        rendaMedia: dadosProc.rendaMedia,
        salarioMedio: dadosProc.salarioMedio,
        urbanizacao: dadosProc.urbanizacao,
        areaUrbanizada: dadosProc.areaUrbanizada,
        dataAtualizacao: new Date().toISOString()
      });

      processados++;
      if (processados % 20 === 0) {
        console.log(`   ✅ ${processados}/${municipios.length} cidades processadas`);
      }

      // Pausa
      if (processados % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 3. Salvar em arquivo
    const pastaOutput = join(__dirname, '..', 'dados-ibge');
    mkdirSync(pastaOutput, { recursive: true });

    const dataStr = new Date().toISOString().split('T')[0];
    const caminhoJSON = join(pastaOutput, `cidades-mt-completo-${dataStr}.json`);
    
    writeFileSync(caminhoJSON, JSON.stringify(dadosColetados, null, 2), 'utf-8');

    console.log(`\n✅ Coleta avançada concluída!`);
    console.log(`📁 Arquivo: ${caminhoJSON}`);
    console.log(`📊 Total: ${dadosColetados.length} cidades`);

    // Estatísticas
    const comPopulacao = dadosColetados.filter(d => d.populacao > 0).length;
    console.log(`\n📈 Cidades com dados de população: ${comPopulacao}/${dadosColetados.length}`);

    // Top 5
    const top5 = [...dadosColetados]
      .filter(d => d.populacao > 0)
      .sort((a, b) => b.populacao - a.populacao)
      .slice(0, 5);

    if (top5.length > 0) {
      console.log(`\n🏆 Top 5 cidades mais populosas:`);
      top5.forEach((c, i) => {
        console.log(`   ${i+1}. ${c.nome}: ${c.populacao.toLocaleString('pt-BR')} hab | Renda: R$ ${c.rendaMedia.toFixed(2)}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();
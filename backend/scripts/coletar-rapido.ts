/**
 * Script simplificado e rápido para coletar dados das 142 cidades
 * Com melhor tratamento de erros e progresso
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// Headers das requisições
const headers = {
  "accept": "*/*",
  "timeout": 8000
};

const mesorregionMap: Record<string, string> = {
  'Norte Mato-grossense': 'NORTE_MATOGROSSENSE',
  'Nordeste Mato-grossense': 'NORDESTE_MATOGROSSENSE',
  'Centro-Sul Mato-grossense': 'CENTRO_SUL_MATOGROSSENSE',
  'Sudeste Mato-grossense': 'SUDESTE_MATOGROSSENSE',
  'Sudoeste Mato-grossense': 'SUDOESTE_MATOGROSSENSE',
};

interface MunicipioDados {
  id: number;
  nome: string;
  mesorregiao: string;
  populacao: number;
  populacao15a44: number;
  rendaMedia: number;
  salarioMedio: number;
  urbanizacao: number;
  areaUrbanizada: number;
}

/**
 * Busca dados de uma cidade rapidamente
 */
async function buscarDadosCidade(codigoCidade: string): Promise<any> {
  try {
    const indicadores = "29169%7C60045%7C78192%7C93371%7C60030%7C78187";
    const url = `https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/${indicadores}/resultados/${codigoCidade}`;
    
    const response = await axios.get(url, { headers, timeout: 8000 });
    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Processa indicadores rapidamente
 */
function processarIndicadores(dados: any): Record<string, any> {
  const resultado: Record<string, any> = {
    populacao: 0,
    rendaMedia: 0,
    salarioMedio: 0,
    urbanizacao: 0,
    areaUrbanizada: 0,
    empregosFormal: 0
  };

  if (!dados || !Array.isArray(dados)) return resultado;

  dados.forEach((item: any) => {
    if (item.serie && Object.keys(item.serie).length > 0) {
      const anos = Object.keys(item.serie).sort();
      const valor = item.serie[anos[anos.length - 1]];

      switch (item.id) {
        case '29169': resultado.populacao = parseInt(valor) || 0; break;
        case '60045': resultado.rendaMedia = parseFloat(valor) || 0; break;
        case '78192': resultado.salarioMedio = parseFloat(valor) || 0; break;
        case '93371': resultado.urbanizacao = parseFloat(valor) || 0; break;
        case '60030': resultado.areaUrbanizada = parseFloat(valor) || 0; break;
        case '78187': resultado.empregosFormal = parseInt(valor) || 0; break;
      }
    }
  });

  return resultado;
}

/**
 * Função principal
 */
async function main() {
  console.log('\n🚀 COLETA RÁPIDA DE DADOS DAS 142 CIDADES');
  console.log('='.repeat(60));

  try {
    // 1. Buscar municípios
    console.log('📍 Buscando os 142 municípios de Mato Grosso...');
    const response = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios');
    const municipios = response.data;
    console.log(`✅ Encontrados ${municipios.length} municípios\n`);

    // 2. Coletar dados
    const dadosColetados: MunicipioDados[] = [];
    let processados = 0;

    for (let i = 0; i < municipios.length; i++) {
      const mun = municipios[i];
      const codigoCidade = mun.id.toString();

      // Buscar dados
      const indicadores = await buscarDadosCidade(codigoCidade);
      const dadosProc = processarIndicadores(indicadores);

      // Mapear mesorregião
      const mesoNome = mun.microrregiao?.mesorregiao?.nome || '';
      const mesoreg = mesorregionMap[mesoNome] || 'CENTRO_SUL_MATOGROSSENSE';

      // Calcular população 15-44
      const pop15a44 = Math.floor((dadosProc.populacao || 0) * 0.4);

      dadosColetados.push({
        id: mun.id,
        nome: mun.nome,
        mesorregiao: mesoreg,
        populacao: dadosProc.populacao,
        populacao15a44: pop15a44,
        rendaMedia: dadosProc.rendaMedia,
        salarioMedio: dadosProc.salarioMedio,
        urbanizacao: dadosProc.urbanizacao,
        areaUrbanizada: dadosProc.areaUrbanizada
      });

      processados++;
      if (processados % 20 === 0) {
        console.log(`   ✅ ${processados}/${municipios.length} cidades coletadas`);
      }

      // Pequena pausa a cada 5 requisições
      if (processados % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 3. Salvar em arquivo
    const pastaOutput = join(__dirname, '..', 'dados-ibge');
    mkdirSync(pastaOutput, { recursive: true });

    const dataStr = new Date().toISOString().split('T')[0];
    const caminhoJSON = join(pastaOutput, `cidades-mt-${dataStr}.json`);
    
    writeFileSync(caminhoJSON, JSON.stringify(dadosColetados, null, 2), 'utf-8');

    console.log(`\n✅ Coleta concluída!`);
    console.log(`📁 Arquivo: ${caminhoJSON}`);
    console.log(`📊 Total: ${dadosColetados.length} cidades`);

    // Estatísticas
    const comPopulacao = dadosColetados.filter(d => d.populacao > 0).length;
    console.log(`\n📈 ${comPopulacao}/${dadosColetados.length} com dados de população`);

    // Top 5
    const top5 = [...dadosColetados]
      .filter(d => d.populacao > 0)
      .sort((a, b) => b.populacao - a.populacao)
      .slice(0, 5);

    console.log(`\n🏆 Top 5 cidades mais populosas:`);
    top5.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.nome}: ${c.populacao.toLocaleString('pt-BR')} hab`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
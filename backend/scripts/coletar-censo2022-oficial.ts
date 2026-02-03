import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface CidadeCenso {
  id: number;
  nome: string;
  populacaoTotal: number;
  populacao15a44: number;
  populacaoHomens: number;
  populacaoMulheres: number;
  rendaMedia: number;
  dataAtualizacao: string;
}

const API_BASE = 'https://servicodados.ibge.gov.br/api/v1';
const ESTADO_CODE = '51'; // Código IBGE de Mato Grosso
const TIMEOUT = 5000;

async function listarMunicipiosMT(): Promise<Array<{ id: number; nome: string }>> {
  try {
    console.log('📍 Listando municípios de Mato Grosso...');
    const response = await axios.get(
      `${API_BASE}/localidades/estados/${ESTADO_CODE}/municipios`,
      { timeout: TIMEOUT }
    );

    const municipios = response.data.map((m: any) => ({
      id: parseInt(m.id),
      nome: m.nome,
    }));

    console.log(`✅ ${municipios.length} municípios encontrados`);
    return municipios;
  } catch (error: any) {
    console.error('❌ Erro ao listar municípios:', error.message);
    throw error;
  }
}

async function coletarDadosAvancado(codigoMunicipio: number, nomeMunicipio: string): Promise<Partial<CidadeCenso>> {
  try {
    // Tentar múltiplos endpoints para obter dados mais completos
    const endpoints = [
      // Endpoint 1: Dados gerais
      {
        url: `${API_BASE}/pesquisas/10101/periodos/2022/indicadores/0/resultados/N6[${codigoMunicipio}]`,
        field: 'populacaoTotal'
      },
    ];

    const dados: Partial<CidadeCenso> = {
      id: codigoMunicipio,
      nome: nomeMunicipio,
      dataAtualizacao: new Date().toISOString(),
    };

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint.url, { timeout: TIMEOUT });
        
        if (response.data && response.data.length > 0) {
          const resultado = response.data[0];
          if (resultado.res && resultado.res['2022']) {
            const valor = resultado.res['2022'];
            const numValue = typeof valor === 'string' ? parseInt(valor) : valor;
            
            if (!isNaN(numValue) && numValue > 0) {
              (dados as any)[endpoint.field] = numValue;
            }
          }
        }
      } catch {
        // Continua para próximo endpoint
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return dados;
  } catch (error) {
    console.error(`❌ Erro ao coletar dados avançados para ${nomeMunicipio}:`, error);
    return {
      id: codigoMunicipio,
      nome: nomeMunicipio,
      dataAtualizacao: new Date().toISOString(),
    };
  }
}

async function coletarTodosOsDados(): Promise<void> {
  try {
    console.log('🚀 Iniciando coleta de dados do Censo 2022 - IBGE');
    console.log('='.repeat(60));

    // 1. Listar municípios
    const municipios = await listarMunicipiosMT();

    if (municipios.length === 0) {
      throw new Error('Nenhum município encontrado');
    }

    // 2. Coletar dados em lotes
    const dados: CidadeCenso[] = [];
    const loteSize = 10;
    const pausaEntreLottes = 1000; // 1 segundo entre lotes

    console.log(`\n📊 Coletando dados em ${Math.ceil(municipios.length / loteSize)} lotes de ${loteSize}...`);

    for (let i = 0; i < municipios.length; i += loteSize) {
      const lote = municipios.slice(i, i + loteSize);
      const numeroLote = Math.floor(i / loteSize) + 1;
      const totalLotes = Math.ceil(municipios.length / loteSize);

      console.log(`\n[Lote ${numeroLote}/${totalLotes}] Processando ${lote.length} municípios...`);

      const promessas = lote.map((mun) =>
        coletarDadosAvancado(mun.id, mun.nome)
          .then((dados) => {
            if (dados && dados.id) {
              console.log(`  ✅ ${dados.nome || `ID: ${dados.id}`}`);
              return dados as CidadeCenso;
            }
            return null;
          })
          .catch(() => {
            console.error(`  ❌ Erro em ${mun.nome}`);
            return null;
          })
      );

      const resultados = await Promise.all(promessas);
      const dadosValidos = resultados.filter((d) => d !== null) as CidadeCenso[];
      dados.push(...dadosValidos);

      // Pausa entre lotes
      if (i + loteSize < municipios.length) {
        await new Promise(resolve => setTimeout(resolve, pausaEntreLottes));
      }
    }

    // 3. Salvar em arquivo JSON
    const dataAtual = new Date().toISOString().split('T')[0];
    const nomeArquivo = `cidades-mt-censo2022-${dataAtual}.json`;
    const caminhoArquivo = path.join(__dirname, '..', 'dados-ibge', nomeArquivo);

    // Criar diretório se não existir
    const dirDados = path.dirname(caminhoArquivo);
    if (!fs.existsSync(dirDados)) {
      fs.mkdirSync(dirDados, { recursive: true });
    }

    fs.writeFileSync(caminhoArquivo, JSON.stringify(dados, null, 2), 'utf-8');

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Coleta concluída!`);
    console.log(`📁 Arquivo salvo: ${caminhoArquivo}`);
    console.log(`📊 Total de cidades coletadas: ${dados.length}/${municipios.length}`);
    console.log(`📈 Taxa de sucesso: ${((dados.length / municipios.length) * 100).toFixed(2)}%`);

    // Estatísticas
    const comPopulacao = dados.filter(d => d.populacaoTotal && d.populacaoTotal > 0);
    console.log(`\n📈 Estatísticas:`);
    console.log(`  - Cidades com dados de população: ${comPopulacao.length}`);
    if (comPopulacao.length > 0) {
      const maioresPopulacoes = comPopulacao
        .sort((a, b) => (b.populacaoTotal || 0) - (a.populacaoTotal || 0))
        .slice(0, 5);
      
      console.log(`\n  Top 5 maiores cidades por população:`);
      maioresPopulacoes.forEach((cidade, idx) => {
        console.log(`    ${idx + 1}. ${cidade.nome}: ${cidade.populacaoTotal?.toLocaleString('pt-BR')} habitantes`);
      });
    }

  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  }
}

// Executar
coletarTodosOsDados().catch((error) => {
  console.error('Erro não tratado:', error);
  process.exit(1);
});

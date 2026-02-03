import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface CidadeCenso {
  id: number;
  nome: string;
  populacaoTotal: number;
  dataAtualizacao: string;
}

const API_BASE = 'https://servicodados.ibge.gov.br/api/v1';
const TIMEOUT = 5000;

async function coletarDadosMunicipios(): Promise<void> {
  try {
    console.log('🚀 Coletando dados do Censo 2022 - Método Simplificado');
    console.log('='.repeat(60));

    // 1. Listar municipípios
    console.log('\n📍 Listando os 142 municípios de Mato Grosso...');
    const response = await axios.get(
      `${API_BASE}/localidades/estados/51/municipios`,
      { timeout: TIMEOUT }
    );

    const municipios = response.data;
    console.log(`✅ ${municipios.length} municípios encontrados\n`);

    // 2. Coletar dados de cada município com rate limiting
    const dadosColetados: CidadeCenso[] = [];
    let contado = 0;

    for (let i = 0; i < municipios.length; i++) {
      const mun = municipios[i];
      const codigoMun = parseInt(mun.id);
      const nomeMun = mun.nome;

      try {
        // Buscar dados do Censo 2022
        const urlCenso = `${API_BASE}/pesquisas/10101/periodos/2022/indicadores/0/resultados/N6[${codigoMun}]`;
        const resCenso = await axios.get(urlCenso, { timeout: TIMEOUT });

        let populacao = 0;
        if (resCenso.data && resCenso.data.length > 0) {
          const resultado = resCenso.data[0];
          if (resultado.res && resultado.res['2022']) {
            const valor = resultado.res['2022'];
            populacao = typeof valor === 'string' ? parseInt(valor) : valor;
          }
        }

        const dadosCidade: CidadeCenso = {
          id: codigoMun,
          nome: nomeMun,
          populacaoTotal: populacao || 0,
          dataAtualizacao: new Date().toISOString(),
        };

        dadosColetados.push(dadosCidade);

        // Progress
        contado++;
        if (contado % 10 === 0) {
          console.log(`  [${contado}/${municipios.length}] ${nomeMun} - Pop: ${populacao}`);
        }

        // Rate limiting - 500ms entre requisições
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`  ❌ Erro ao processar ${nomeMun}:`, error.message);
      }
    }

    // 3. Salvar em arquivo
    const dataAtual = new Date().toISOString().split('T')[0];
    const nomeArquivo = `censo-2022-mt-${dataAtual}.json`;
    const caminhoArquivo = path.join(__dirname, '..', 'dados-ibge', nomeArquivo);

    // Criar diretório
    const dirDados = path.dirname(caminhoArquivo);
    if (!fs.existsSync(dirDados)) {
      fs.mkdirSync(dirDados, { recursive: true });
    }

    fs.writeFileSync(caminhoArquivo, JSON.stringify(dadosColetados, null, 2), 'utf-8');

    // 4. Resumo
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Coleta concluída!`);
    console.log(`📁 Arquivo: ${caminhoArquivo}`);
    console.log(`📊 Total coletado: ${dadosColetados.length}/${municipios.length}`);

    const comPopulacao = dadosColetados.filter(d => d.populacaoTotal > 0);
    console.log(`🏙️  Cidades com dados de população: ${comPopulacao.length}`);

    if (comPopulacao.length > 0) {
      const top5 = comPopulacao.sort((a, b) => b.populacaoTotal - a.populacaoTotal).slice(0, 5);
      console.log(`\n📍 Top 5 maiores cidades:`);
      top5.forEach((c, idx) => {
        console.log(`  ${idx + 1}. ${c.nome}: ${c.populacaoTotal.toLocaleString('pt-BR')} hab`);
      });
    }
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  }
}

coletarDadosMunicipios().catch(error => {
  console.error('Erro não tratado:', error);
  process.exit(1);
});

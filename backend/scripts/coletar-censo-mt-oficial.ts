import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface CidadeCenso {
  id: number;
  nome: string;
  populacaoTotal: number;
  populacao15a44: number;
  rendaMedia: number;
  dataAtualizacao: string;
}

const API_BASE = 'https://servicodados.ibge.gov.br/api/v1';
const TIMEOUT = 5000;

// Códigos IBGE das 142 cidades de Mato Grosso
const MUNICIPIOS_MT = [
  5100102, 5100201, 5100300, 5100409, 5100508, 5100607, 5100706, 5100805, 5100904, 5101001,
  5101100, 5101209, 5101308, 5101407, 5101506, 5101605, 5101704, 5101803, 5101902, 5102107,
  5102206, 5102305, 5102404, 5102503, 5102602, 5102701, 5102800, 5102909, 5103001, 5103100,
  5103209, 5103308, 5103407, 5103506, 5103605, 5103704, 5103803, 5103902, 5104009, 5104108,
  5104207, 5104306, 5104405, 5104504, 5104603, 5104702, 5104801, 5104900, 5105001, 5105100,
  5105209, 5105308, 5105407, 5105506, 5105605, 5105704, 5105803, 5105902, 5106009, 5106108,
  5106207, 5106306, 5106405, 5106504, 5106603, 5106702, 5106801, 5106900, 5107009, 5107108,
  5107207, 5107306, 5107405, 5107504, 5107603, 5107702, 5107801, 5107900, 5108007, 5108106,
  5108205, 5108304, 5108403, 5108502, 5108601, 5108700, 5108809, 5108908, 5109005, 5109104,
  5109203, 5109302, 5109401, 5109500, 5109609, 5109708, 5109807, 5109906, 5110003, 5110102,
  5110201, 5110300, 5110409, 5110508, 5110607, 5110706, 5110805, 5110904, 5111001, 5111100,
  5111209, 5111308, 5111407, 5111506, 5111605, 5111704, 5111803, 5111902, 5112009, 5112108,
  5112207, 5112306, 5112405, 5112504, 5112603, 5112702, 5112801, 5112900, 5113007, 5113106,
  5113205, 5113304, 5113403, 5113502, 5113601, 5113700, 5113809, 5113908, 5114005, 5114104
];

async function coletarDadosCidade(codigoMunicipio: number): Promise<CidadeCenso | null> {
  try {
    // Buscar dados básicos da localidade
    const urlLocalidade = `${API_BASE}/localidades/municipios/${codigoMunicipio}`;
    const resLocal = await axios.get(urlLocalidade, { timeout: TIMEOUT });
    const nomeMunicipio = resLocal.data.nome;

    // Buscar dados do Censo 2022 (pesquisa 10101)
    const urlCenso = `${API_BASE}/pesquisas/10101/periodos/2022/indicadores/0/resultados/N6[${codigoMunicipio}]`;
    const resCenso = await axios.get(urlCenso, { timeout: TIMEOUT });

    const dados: CidadeCenso = {
      id: codigoMunicipio,
      nome: nomeMunicipio,
      populacaoTotal: 0,
      populacao15a44: 0,
      rendaMedia: 0,
      dataAtualizacao: new Date().toISOString(),
    };

    // Processar resposta do Censo
    if (resCenso.data && resCenso.data.length > 0) {
      const resultado = resCenso.data[0];
      if (resultado.res && resultado.res['2022']) {
        const valor = resultado.res['2022'];
        const numValue = typeof valor === 'string' ? parseInt(valor) : valor;
        if (!isNaN(numValue) && numValue > 0) {
          dados.populacaoTotal = numValue;
        }
      }
    }

    return dados;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn(`⚠️  Município ${codigoMunicipio} não encontrado`);
    } else {
      console.error(`❌ Erro ao coletar dados para ${codigoMunicipio}:`, error.message);
    }
    return null;
  }
}

async function coletarTodosOsDados(): Promise<void> {
  try {
    console.log('🚀 Iniciando coleta de dados do Censo 2022 - IBGE');
    console.log('='.repeat(60));
    console.log(`📊 Total de municípios a coletar: ${MUNICIPIOS_MT.length}`);

    const dados: CidadeCenso[] = [];
    const loteSize = 5;
    const pausaEntreLottes = 2000; // 2 segundos entre lotes

    console.log(`\n📊 Coletando dados em ${Math.ceil(MUNICIPIOS_MT.length / loteSize)} lotes de ${loteSize}...`);

    for (let i = 0; i < MUNICIPIOS_MT.length; i += loteSize) {
      const lote = MUNICIPIOS_MT.slice(i, i + loteSize);
      const numeroLote = Math.floor(i / loteSize) + 1;
      const totalLotes = Math.ceil(MUNICIPIOS_MT.length / loteSize);

      console.log(`\n[Lote ${numeroLote}/${totalLotes}]`);

      const promessas = lote.map((codMun) =>
        coletarDadosCidade(codMun)
          .then((dadosCidade) => {
            if (dadosCidade) {
              console.log(`  ✅ ${dadosCidade.nome}`);
              return dadosCidade;
            }
            return null;
          })
          .catch(() => {
            console.error(`  ❌ Erro ao coletar código ${codMun}`);
            return null;
          })
      );

      const resultados = await Promise.all(promessas);
      const dadosValidos = resultados.filter((d) => d !== null) as CidadeCenso[];
      dados.push(...dadosValidos);

      // Pausa entre lotes
      if (i + loteSize < MUNICIPIOS_MT.length) {
        await new Promise(resolve => setTimeout(resolve, pausaEntreLottes));
      }
    }

    // 3. Salvar em arquivo JSON
    const dataAtual = new Date().toISOString().split('T')[0];
    const nomeArquivo = `cidades-mt-censo2022-final-${dataAtual}.json`;
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
    console.log(`📊 Total de cidades coletadas: ${dados.length}/${MUNICIPIOS_MT.length}`);
    console.log(`📈 Taxa de sucesso: ${((dados.length / MUNICIPIOS_MT.length) * 100).toFixed(2)}%`);

    // Estatísticas
    const comPopulacao = dados.filter(d => d.populacaoTotal && d.populacaoTotal > 0);
    console.log(`\n📈 Estatísticas:`);
    console.log(`  - Cidades com dados de população: ${comPopulacao.length}`);
    if (comPopulacao.length > 0) {
      const maioresPopulacoes = comPopulacao
        .sort((a, b) => b.populacaoTotal - a.populacaoTotal)
        .slice(0, 5);
      
      console.log(`\n  Top 5 maiores cidades por população:`);
      maioresPopulacoes.forEach((cidade, idx) => {
        console.log(`    ${idx + 1}. ${cidade.nome}: ${cidade.populacaoTotal.toLocaleString('pt-BR')} habitantes`);
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

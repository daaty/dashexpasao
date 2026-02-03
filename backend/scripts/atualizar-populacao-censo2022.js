/**
 * Script para atualizar População Total e População 15-44 anos
 * de TODOS os municípios de Mato Grosso usando dados do Censo 2022 do IBGE
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// Delay entre requisições para não sobrecarregar a API do IBGE
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Busca população total de um município (Censo 2022)
 */
async function fetchPopulacaoTotal(municipioId) {
  try {
    const url = `https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93?localidades=N6[${municipioId}]`;
    const response = await axios.get(url);
    
    if (response.data && response.data[0] && response.data[0].resultados) {
      const resultado = response.data[0].resultados[0];
      if (resultado && resultado.series && resultado.series[0]) {
        return parseInt(resultado.series[0].serie['2022'] || '0');
      }
    }
    return null;
  } catch (error) {
    console.error(`  ❌ Erro ao buscar população total: ${error.message}`);
    return null;
  }
}

/**
 * Busca população 15-44 anos de um município (Censo 2022)
 * Faixas: 15-19, 20-24, 25-29, 30-34, 35-39, 40-44
 */
async function fetchPopulacao15a44(municipioId) {
  try {
    // Códigos das faixas etárias 15-44 anos
    const faixas = '93086,93087,93088,93089,93090,93091';
    const url = `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${municipioId}]&classificacao=2[6794]|286[113635]|287[${faixas}]`;
    
    const response = await axios.get(url);
    
    if (response.data && response.data[0] && response.data[0].resultados) {
      let total = 0;
      for (const resultado of response.data[0].resultados) {
        if (resultado.series && resultado.series[0] && resultado.series[0].serie) {
          total += parseInt(resultado.series[0].serie['2022'] || '0');
        }
      }
      return total;
    }
    return null;
  } catch (error) {
    console.error(`  ❌ Erro ao buscar pop 15-44: ${error.message}`);
    return null;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('========================================');
  console.log('ATUALIZAÇÃO DE POPULAÇÃO - CENSO 2022');
  console.log('========================================\n');

  try {
    // Buscar todos os municípios do banco de dados
    const cidades = await prisma.city.findMany({
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Total de municípios no banco: ${cidades.length}\n`);

    let atualizados = 0;
    let erros = 0;
    let semDados = 0;

    for (let i = 0; i < cidades.length; i++) {
      const cidade = cidades[i];
      const progresso = `[${i + 1}/${cidades.length}]`;
      
      console.log(`${progresso} ${cidade.name} (ID: ${cidade.id})`);
      
      // Buscar dados do IBGE
      const popTotal = await fetchPopulacaoTotal(cidade.id);
      await delay(100); // Pequeno delay entre requisições
      
      const pop15a44 = await fetchPopulacao15a44(cidade.id);
      await delay(100);

      if (popTotal !== null && pop15a44 !== null) {
        // Atualizar no banco
        await prisma.city.update({
          where: { id: cidade.id },
          data: {
            population: popTotal,
            population15to44: pop15a44
          }
        });

        const percentual = ((pop15a44 / popTotal) * 100).toFixed(1);
        console.log(`  ✅ Pop Total: ${popTotal.toLocaleString('pt-BR')} | Pop 15-44: ${pop15a44.toLocaleString('pt-BR')} (${percentual}%)`);
        atualizados++;
      } else if (popTotal !== null) {
        // Apenas população total disponível
        await prisma.city.update({
          where: { id: cidade.id },
          data: {
            population: popTotal,
            population15to44: Math.round(popTotal * 0.42) // Estimativa
          }
        });
        console.log(`  ⚠️  Pop Total: ${popTotal.toLocaleString('pt-BR')} | Pop 15-44: ESTIMADA`);
        atualizados++;
      } else {
        console.log(`  ❌ Dados não encontrados no IBGE`);
        semDados++;
        erros++;
      }

      // Log de progresso a cada 10 cidades
      if ((i + 1) % 10 === 0) {
        console.log(`\n📈 Progresso: ${i + 1}/${cidades.length} processados (${atualizados} atualizados, ${erros} erros)\n`);
      }
    }

    // Resumo final
    console.log('\n========================================');
    console.log('✅ ATUALIZAÇÃO CONCLUÍDA!');
    console.log('========================================');
    console.log(`📊 Resumo:`);
    console.log(`   • Municípios processados: ${cidades.length}`);
    console.log(`   • Atualizados com sucesso: ${atualizados}`);
    console.log(`   • Sem dados no IBGE: ${semDados}`);
    console.log(`   • Erros: ${erros}`);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
main().catch(console.error);

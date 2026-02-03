/**
 * Script FINAL para atualizar TODOS os dados das 142 cidades de MT
 * Usa a API de Agregados (SIDRA) do IBGE - Censo 2022
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Tabelas do SIDRA - Censo 2022
const SIDRA_BASE = 'https://apisidra.ibge.gov.br/values';

interface DadosCidade {
  id: number;
  nome: string;
  populacaoTotal: number;
  populacao15a44: number;
  rendaMedia: number;
}

/**
 * Busca população total do Censo 2022 via SIDRA
 * Tabela 4714 - População residente por sexo e idade
 */
async function buscarPopulacaoSIDRA(codigoMunicipio: number): Promise<number> {
  try {
    // Tabela 4714: População residente, por sexo e grupos de idade
    // V = Variável 93 (População residente)
    // P = Período 2022
    // N6 = Nível Município
    const url = `${SIDRA_BASE}/t/4714/n6/${codigoMunicipio}/v/93/p/2022/c2/0/c287/0`;
    
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data && response.data.length > 1) {
      const valor = response.data[1]?.V;
      if (valor && valor !== '-' && valor !== '...') {
        return parseInt(valor) || 0;
      }
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Busca população por faixa etária (15-44 anos) do Censo 2022
 */
async function buscarPopulacao15a44SIDRA(codigoMunicipio: number): Promise<number> {
  try {
    // Tabela 4714: População por grupos de idade
    // c287: 93070 (15-19), 93084 (20-24), 93085 (25-29), 93086 (30-34), 93087 (35-39), 93088 (40-44)
    const faixas = ['93070', '93084', '93085', '93086', '93087', '93088'];
    let total = 0;

    for (const faixa of faixas) {
      try {
        const url = `${SIDRA_BASE}/t/4714/n6/${codigoMunicipio}/v/93/p/2022/c2/0/c287/${faixa}`;
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data && response.data.length > 1) {
          const valor = response.data[1]?.V;
          if (valor && valor !== '-' && valor !== '...') {
            total += parseInt(valor) || 0;
          }
        }
        await new Promise(r => setTimeout(r, 100)); // Rate limiting
      } catch {
        continue;
      }
    }

    return total;
  } catch (error) {
    return 0;
  }
}

/**
 * Busca renda média via API de Pesquisas do IBGE
 */
async function buscarRendaMedia(codigoMunicipio: number): Promise<number> {
  try {
    const url = `https://servicodados.ibge.gov.br/api/v1/pesquisas/-/indicadores/60045/resultados/${codigoMunicipio}`;
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data && response.data.length > 0) {
      const resultado = response.data[0];
      if (resultado.res) {
        // Pegar o valor mais recente
        const anos = Object.keys(resultado.res).sort().reverse();
        for (const ano of anos) {
          const valor = resultado.res[ano];
          if (valor && valor !== '-' && valor !== '...' && valor !== 'X') {
            return parseFloat(valor) || 0;
          }
        }
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Lista todos os municípios de MT
 */
async function listarMunicipiosMT(): Promise<Array<{ id: number; nome: string }>> {
  const response = await axios.get(
    'https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios',
    { timeout: 10000 }
  );

  return response.data.map((m: any) => ({
    id: parseInt(m.id),
    nome: m.nome,
  }));
}

async function main() {
  console.log('🚀 ATUALIZAÇÃO COMPLETA - TODAS AS 142 CIDADES DE MT');
  console.log('='.repeat(60));
  console.log('📊 Fonte: IBGE Censo 2022 via API SIDRA\n');

  try {
    // 1. Listar municípios
    console.log('📍 Listando municípios de Mato Grosso...');
    const municipios = await listarMunicipiosMT();
    console.log(`✅ ${municipios.length} municípios encontrados\n`);

    let atualizados = 0;
    let erros = 0;
    const dadosColetados: DadosCidade[] = [];

    // 2. Processar cada município
    for (let i = 0; i < municipios.length; i++) {
      const mun = municipios[i];
      const progresso = `[${i + 1}/${municipios.length}]`;

      console.log(`${progresso} Processando ${mun.nome}...`);

      try {
        // Buscar dados
        const [populacao, pop15a44, renda] = await Promise.all([
          buscarPopulacaoSIDRA(mun.id),
          buscarPopulacao15a44SIDRA(mun.id),
          buscarRendaMedia(mun.id),
        ]);

        // Guardar dados coletados
        dadosColetados.push({
          id: mun.id,
          nome: mun.nome,
          populacaoTotal: populacao,
          populacao15a44: pop15a44,
          rendaMedia: renda,
        });

        // Verificar se existe no banco
        const cidadeExistente = await prisma.city.findUnique({
          where: { id: mun.id },
        });

        if (cidadeExistente) {
          // Atualizar - manter dados existentes se novos forem 0
          await prisma.city.update({
            where: { id: mun.id },
            data: {
              name: mun.nome,
              population: populacao > 0 ? populacao : cidadeExistente.population,
              population15to44: pop15a44 > 0 ? pop15a44 : cidadeExistente.population15to44,
              averageIncome: renda > 0 ? renda : cidadeExistente.averageIncome,
              updatedAt: new Date(),
            },
          });
          console.log(`   ✅ Atualizado - Pop: ${populacao > 0 ? populacao.toLocaleString('pt-BR') : cidadeExistente.population?.toLocaleString('pt-BR')}`);
        } else {
          // Criar nova cidade
          await prisma.city.create({
            data: {
              id: mun.id,
              name: mun.nome,
              population: populacao,
              population15to44: pop15a44,
              averageIncome: renda,
              status: 'ATIVO',
            },
          });
          console.log(`   ✅ Criado - Pop: ${populacao.toLocaleString('pt-BR')}`);
        }

        atualizados++;
      } catch (error: any) {
        erros++;
        console.log(`   ❌ Erro: ${error.message}`);
      }

      // Rate limiting entre municípios
      await new Promise(r => setTimeout(r, 500));
    }

    // 3. Resumo Final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA ATUALIZAÇÃO:');
    console.log(`   ✅ Atualizados: ${atualizados}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📈 Taxa de sucesso: ${((atualizados / municipios.length) * 100).toFixed(1)}%`);

    // 4. Verificação final
    const total = await prisma.city.count();
    const comPopulacao = await prisma.city.count({ where: { population: { gt: 0 } } });
    const comPop15a44 = await prisma.city.count({ where: { population15to44: { gt: 0 } } });

    console.log('\n📊 ESTADO DO BANCO DE DADOS:');
    console.log(`   Total de cidades: ${total}`);
    console.log(`   Com população total: ${comPopulacao}`);
    console.log(`   Com população 15-44: ${comPop15a44}`);

    // Top 5
    const top5 = await prisma.city.findMany({
      orderBy: { population: 'desc' },
      take: 5,
      select: { name: true, population: true, population15to44: true },
    });

    console.log('\n📍 Top 5 maiores cidades:');
    top5.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name}: ${c.population?.toLocaleString('pt-BR')} hab (15-44: ${c.population15to44?.toLocaleString('pt-BR') || 'N/A'})`);
    });

  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

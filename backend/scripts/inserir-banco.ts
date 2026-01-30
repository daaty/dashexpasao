/**
 * Script final de inserção dos dados IBGE coletados
 * Lê arquivo JSON e atualiza o banco de dados PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

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
}

/**
 * Busca o arquivo JSON mais recente
 */
function buscarArquivoMaisRecente(): string | null {
  try {
    const pastaOutput = join(__dirname, '..', 'dados-ibge');
    const arquivos = readdirSync(pastaOutput)
      .filter(f => f.startsWith('cidades-mt-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (arquivos.length === 0) {
      return null;
    }

    return join(pastaOutput, arquivos[0]);
  } catch (error) {
    return null;
  }
}

/**
 * Carrega dados do arquivo JSON
 */
function carregarDados(caminhoArquivo: string): DadosCidade[] {
  try {
    const conteudo = readFileSync(caminhoArquivo, 'utf-8');
    const dados = JSON.parse(conteudo);
    return dados;
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    return [];
  }
}

/**
 * Insere/atualiza dados no banco
 */
async function atualizarBanco(dadosColetados: DadosCidade[]): Promise<void> {
  console.log(`\n📝 Atualizando ${dadosColetados.length} cidades no banco...\n`);

  let sucessos = 0;
  let erros = 0;

  for (let i = 0; i < dadosColetados.length; i++) {
    try {
      const dados = dadosColetados[i];

      // Verificar se cidade existe
      const cidadeExistente = await prisma.city.findUnique({
        where: { id: dados.id }
      });

      if (cidadeExistente) {
        // Atualizar
        await prisma.city.update({
          where: { id: dados.id },
          data: {
            name: dados.nome,
            mesorregion: dados.mesorregiao,
            population: dados.populacao || cidadeExistente.population || 0,
            population15to44: dados.populacao15a44 || cidadeExistente.population15to44 || 0,
            averageIncome: dados.rendaMedia || cidadeExistente.averageIncome || 0,
            averageFormalSalary: dados.salarioMedio || cidadeExistente.averageFormalSalary || 0,
            urbanizationIndex: (dados.urbanizacao || 0) / 100,
            urbanizedAreaKm2: dados.areaUrbanizada || cidadeExistente.urbanizedAreaKm2 || 0,
            updatedAt: new Date()
          }
        });
        sucessos++;
      } else {
        // Inserir
        await prisma.city.create({
          data: {
            id: dados.id,
            name: dados.nome,
            status: 'NOT_SERVED',
            mesorregion: dados.mesorregiao,
            gentilic: `${dados.nome.toLowerCase()}ense`,
            anniversary: '01/01',
            mayor: 'A atualizar',
            population: dados.populacao || 0,
            population15to44: dados.populacao15a44 || 0,
            averageIncome: dados.rendaMedia || 0,
            averageFormalSalary: dados.salarioMedio || 0,
            urbanizationIndex: (dados.urbanizacao || 0) / 100,
            urbanizedAreaKm2: dados.areaUrbanizada || 0,
            formalJobs: 0
          }
        });
        sucessos++;
      }

      if ((i + 1) % 30 === 0) {
        console.log(`   ✅ ${i + 1}/${dadosColetados.length} processadas`);
      }
    } catch (error) {
      erros++;
      console.error(`   ❌ Erro ao processar ${dadosColetados[i].nome}`);
    }
  }

  console.log(`\n✅ INSERÇÃO CONCLUÍDA!`);
  console.log(`\n📊 Resumo:`);
  console.log(`   • Processadas: ${sucessos}`);
  console.log(`   • Erros: ${erros}`);
  console.log(`   • Taxa de sucesso: ${((sucessos / dadosColetados.length) * 100).toFixed(1)}%`);

  // Mostrar total no banco
  const totalBanco = await prisma.city.count();
  console.log(`\n📍 Total de cidades no banco: ${totalBanco}`);
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 SCRIPT DE INSERÇÃO DE DADOS NO BANCO');
  console.log('='.repeat(60));

  try {
    // 1. Buscar arquivo mais recente
    const caminhoArquivo = buscarArquivoMaisRecente();
    if (!caminhoArquivo) {
      console.log('❌ Nenhum arquivo JSON encontrado em dados-ibge/');
      return;
    }

    console.log(`📁 Arquivo: ${caminhoArquivo}`);

    // 2. Carregar dados
    const dadosColetados = carregarDados(caminhoArquivo);
    if (dadosColetados.length === 0) {
      console.log('❌ Nenhum dado carregado do arquivo');
      return;
    }

    console.log(`📊 Dados carregados: ${dadosColetados.length} cidades`);

    // 3. Atualizar banco
    await atualizarBanco(dadosColetados);

    // 4. Mostrar top 5
    const topPopulosas = await prisma.city.findMany({
      take: 5,
      where: { population: { gt: 0 } },
      orderBy: { population: 'desc' },
      select: { name: true, population: true, mesorregion: true }
    });

    if (topPopulosas.length > 0) {
      console.log(`\n🏆 Top 5 cidades mais populosas:`);
      topPopulosas.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name}: ${c.population?.toLocaleString('pt-BR')} hab`);
      });
    } else {
      console.log(`\n⚠️ Nenhuma cidade com dados de população`);
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
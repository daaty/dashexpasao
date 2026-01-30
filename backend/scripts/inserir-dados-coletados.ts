/**
 * Script de inserção de dados - Lê arquivo JSON e atualiza banco
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

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
 * Busca o arquivo JSON mais recente
 */
function buscarArquivoMaisRecente(): string | null {
  try {
    const pastaOutput = join(__dirname, '..', 'dados-ibge');
    const arquivos = readdirSync(pastaOutput)
      .filter(f => f.startsWith('cidades-mt-dados-ibge-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (arquivos.length === 0) {
      console.error('❌ Nenhum arquivo de dados encontrado em dados-ibge/');
      return null;
    }

    return join(pastaOutput, arquivos[0]);
  } catch (error) {
    console.error('❌ Erro ao buscar arquivo:', error);
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
    console.log(`✅ Dados carregados: ${dados.length} cidades`);
    return dados;
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    return [];
  }
}

/**
 * Insere/atualiza uma cidade no banco
 */
async function inserirOuAtualizarCidade(dados: DadosCidade): Promise<boolean> {
  try {
    const cidadeExistente = await prisma.city.findUnique({
      where: { id: dados.id }
    });

    const dadosCidade: any = {
      name: dados.nome,
      population: dados.populacao,
      population15to44: dados.populacao15a44,
      averageIncome: dados.rendaMedia,
      urbanizationIndex: dados.urbanizacao / 100,
      mesorregion: dados.mesorregiao,
      gentilic: dados.gentilico,
      anniversary: '01/01',
      mayor: 'A atualizar',
      averageFormalSalary: dados.salarioMedio,
      formalJobs: dados.empregosFormal,
      urbanizedAreaKm2: dados.areaUrbanizada,
      status: 'NOT_SERVED',
      updatedAt: new Date()
    };

    if (cidadeExistente) {
      await prisma.city.update({
        where: { id: dados.id },
        data: dadosCidade
      });
      return true;
    } else {
      await prisma.city.create({
        data: {
          id: dados.id,
          ...dadosCidade
        }
      });
      return true;
    }
  } catch (error) {
    console.error(`  ❌ Erro ao inserir ${dados.nome}:`, error);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 SCRIPT DE INSERÇÃO DE DADOS IBGE NO BANCO');
  console.log('='.repeat(70));
  console.log('📊 Lendo dados coletados das 142 cidades\n');

  try {
    // 1. Buscar arquivo mais recente
    const caminhoArquivo = buscarArquivoMaisRecente();
    if (!caminhoArquivo) {
      console.log('❌ Abortando: nenhum arquivo de dados encontrado');
      return;
    }

    console.log(`📁 Arquivo: ${caminhoArquivo}\n`);

    // 2. Carregar dados
    const dadosColetados = carregarDados(caminhoArquivo);
    if (dadosColetados.length === 0) {
      console.log('❌ Abortando: nenhum dado carregado');
      return;
    }

    // 3. Inserir/atualizar cidades
    console.log(`📝 Inserindo/atualizando ${dadosColetados.length} cidades...\n`);

    let sucessos = 0;
    let erros = 0;

    for (let i = 0; i < dadosColetados.length; i++) {
      const dados = dadosColetados[i];
      const sucesso = await inserirOuAtualizarCidade(dados);

      if (sucesso) {
        sucessos++;
        if ((i + 1) % 20 === 0) {
          console.log(`   ✅ ${i + 1}/${dadosColetados.length} processadas`);
        }
      } else {
        erros++;
      }
    }

    // 4. Resultado final
    console.log('\n' + '='.repeat(70));
    console.log('✅ INSERÇÃO CONCLUÍDA!');
    console.log(`\n📊 Resumo:`);
    console.log(`   • Cidades processadas: ${sucessos + erros}`);
    console.log(`   • Sucessos: ${sucessos}`);
    console.log(`   • Erros: ${erros}`);
    console.log(`   • Taxa de sucesso: ${((sucessos / (sucessos + erros)) * 100).toFixed(1)}%`);

    // 5. Verificar dados inseridos
    const cidasesNoDb = await prisma.city.count();
    console.log(`\n📍 Total de cidades no banco: ${cidasesNoDb}`);

    // Top 5 populosas no banco
    const topPopulosas = await prisma.city.findMany({
      take: 5,
      orderBy: { population: 'desc' },
      select: { name: true, population: true, mesorregion: true }
    });

    console.log(`\n🏆 Top 5 cidades mais populosas no banco:`);
    topPopulosas.forEach((cidade, i) => {
      console.log(`   ${i + 1}. ${cidade.name}: ${cidade.population?.toLocaleString('pt-BR') || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
main().catch(console.error);
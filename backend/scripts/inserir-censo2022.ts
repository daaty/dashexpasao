import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CidadeCenso {
  id: number;
  nome: string;
  populacaoTotal?: number;
  populacao15a44?: number;
  populacaoHomens?: number;
  populacaoMulheres?: number;
  rendaMedia?: number;
  dataAtualizacao: string;
}

async function encontrarUltimoArquivo(): Promise<string> {
  const dirDados = path.join(__dirname, '..', 'dados-ibge');
  
  if (!fs.existsSync(dirDados)) {
    throw new Error(`Diretório não encontrado: ${dirDados}`);
  }

  const arquivos = fs
    .readdirSync(dirDados)
    .filter(f => f.startsWith('cidades-mt-censo2022-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (arquivos.length === 0) {
    throw new Error('Nenhum arquivo de dados encontrado. Execute o script de coleta primeiro.');
  }

  const arquivoMaisRecente = path.join(dirDados, arquivos[0]);
  console.log(`📁 Arquivo encontrado: ${arquivos[0]}`);
  return arquivoMaisRecente;
}

async function carregarDados(caminhoArquivo: string): Promise<CidadeCenso[]> {
  try {
    console.log(`📂 Lendo arquivo: ${path.basename(caminhoArquivo)}`);
    const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
    const dados = JSON.parse(conteudo);

    if (!Array.isArray(dados)) {
      throw new Error('Dados devem ser um array');
    }

    console.log(`✅ ${dados.length} registros carregados`);
    return dados;
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    throw error;
  }
}

async function inserirNoBancoDados(cidades: CidadeCenso[]): Promise<void> {
  let sucessos = 0;
  let erros = 0;

  console.log(`\n📊 Iniciando inserção de ${cidades.length} registros no banco de dados...`);
  console.log('='.repeat(60));

  for (let i = 0; i < cidades.length; i++) {
    const cidade = cidades[i];
    const progresso = `[${i + 1}/${cidades.length}]`;

    try {
      // Verificar se cidade existe
      const cidadeExistente = await prisma.city.findUnique({
        where: { id: cidade.id },
      });

      if (cidadeExistente) {
        // Atualizar
        await prisma.city.update({
          where: { id: cidade.id },
          data: {
            name: cidade.nome,
            population: cidade.populacaoTotal || cidadeExistente.population,
            population15to44: cidade.populacao15a44 || cidadeExistente.population15to44,
            averageIncome: cidade.rendaMedia || cidadeExistente.averageIncome,
            updatedAt: new Date(),
          },
        });
        console.log(`${progresso} ✏️  ${cidade.nome} (atualizado)`);
      } else {
        // Criar novo
        await prisma.city.create({
          data: {
            id: cidade.id,
            name: cidade.nome,
            population: cidade.populacaoTotal || 0,
            population15to44: cidade.populacao15a44 || 0,
            averageIncome: cidade.rendaMedia || 0,
          },
        });
        console.log(`${progresso} ✅ ${cidade.nome} (novo)`);
      }

      sucessos++;
    } catch (error: any) {
      erros++;
      console.error(
        `${progresso} ❌ Erro em ${cidade.nome}: ${error.message}`
      );
    }
  }

  console.log('='.repeat(60));
  console.log(`\n📈 Resultado da inserção:`);
  console.log(`  ✅ Sucessos: ${sucessos}`);
  console.log(`  ❌ Erros: ${erros}`);
  console.log(`  📊 Taxa de sucesso: ${((sucessos / cidades.length) * 100).toFixed(2)}%`);
}

async function verificarDadosInseridos(): Promise<void> {
  try {
    const totalCidades = await prisma.city.count();
    const cidadesComPopulacao = await prisma.city.count({
      where: {
        population: {
          gt: 0,
        },
      },
    });

    console.log(`\n✅ Verificação do banco de dados:`);
    console.log(`  - Total de cidades: ${totalCidades}`);
    console.log(`  - Cidades com população > 0: ${cidadesComPopulacao}`);

    // Top 5 maiores cidades
    const top5 = await prisma.city.findMany({
      orderBy: {
        population: 'desc',
      },
      take: 5,
    });

    if (top5.length > 0) {
      console.log(`\n  📍 Top 5 maiores cidades por população:`);
      top5.forEach((cidade, idx) => {
        console.log(
          `    ${idx + 1}. ${cidade.name}: ${cidade.population?.toLocaleString('pt-BR')} habitantes`
        );
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  }
}

async function main(): Promise<void> {
  try {
    console.log('🚀 Iniciando inserção de dados do Censo 2022 no banco de dados');
    console.log('='.repeat(60));

    // 1. Encontrar arquivo mais recente
    const caminhoArquivo = await encontrarUltimoArquivo();

    // 2. Carregar dados
    const dados = await carregarDados(caminhoArquivo);

    // 3. Inserir no banco
    await inserirNoBancoDados(dados);

    // 4. Verificar
    await verificarDadosInseridos();

    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Erro não tratado:', error);
  process.exit(1);
});

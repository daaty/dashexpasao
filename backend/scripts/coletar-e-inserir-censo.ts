import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_BASE = 'https://servicodados.ibge.gov.br/api/v1';
const TIMEOUT = 5000;

async function coletarEInserirDadosCenso(): Promise<void> {
  try {
    console.log('🚀 Coletando e inserindo dados do Censo 2022');
    console.log('='.repeat(60));

    // 1. Listar todos os municípios de MT
    console.log('\n📍 Listando municípios de Mato Grosso...');
    const resMunicipios = await axios.get(
      `${API_BASE}/localidades/estados/51/municipios`,
      { timeout: TIMEOUT }
    );

    const municipios = resMunicipios.data;
    console.log(`✅ ${municipios.length} municípios encontrados`);

    // 2. Processar em lotes e inserir
    const loteSize = 10;
    let sucessos = 0;
    let erros = 0;

    console.log(`\n📊 Processando ${Math.ceil(municipios.length / loteSize)} lotes...`);

    for (let i = 0; i < municipios.length; i += loteSize) {
      const lote = municipios.slice(i, i + loteSize);
      const numeroLote = Math.floor(i / loteSize) + 1;
      const totalLotes = Math.ceil(municipios.length / loteSize);

      console.log(`\n[Lote ${numeroLote}/${totalLotes}] Processando ${lote.length} municípios...`);

      for (const municipio of lote) {
        try {
          const codigoMun = parseInt(municipio.id);
          const nomeMun = municipio.nome;

          // Buscar dados do Censo 2022
          const urlCenso = `${API_BASE}/pesquisas/10101/periodos/2022/indicadores/0/resultados/N6[${codigoMun}]`;
          
          let populacao = 0;
          try {
            const resCenso = await axios.get(urlCenso, { timeout: TIMEOUT });
            
            if (resCenso.data && resCenso.data.length > 0) {
              const resultado = resCenso.data[0];
              if (resultado.res && resultado.res['2022']) {
                const valor = resultado.res['2022'];
                const numValue = typeof valor === 'string' ? parseInt(valor) : valor;
                if (!isNaN(numValue) && numValue > 0) {
                  populacao = numValue;
                }
              }
            }
          } catch {
            // Continua sem dados do Censo
          }

          // Verificar se existe no banco
          const cidadeExistente = await prisma.city.findUnique({
            where: { id: codigoMun },
          });

          if (cidadeExistente) {
            // Atualizar apenas se tiver dados novos
            await prisma.city.update({
              where: { id: codigoMun },
              data: {
                name: nomeMun,
                population: populacao > 0 ? populacao : cidadeExistente.population,
                updatedAt: new Date(),
              },
            });
            console.log(`  ✏️  ${nomeMun}`);
          } else {
            // Criar nova
            await prisma.city.create({
              data: {
                id: codigoMun,
                name: nomeMun,
                population: populacao,
                population15to44: 0,
                averageIncome: 0,
                status: 'ATIVO',
              },
            });
            console.log(`  ✅ ${nomeMun} (novo)`);
          }

          sucessos++;
        } catch (error: any) {
          erros++;
          console.error(`  ❌ Erro em ${municipio.nome}: ${error.message}`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Pausa entre lotes
      if (i + loteSize < municipios.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 3. Resumo final
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Processo concluído!`);
    console.log(`  ✅ Sucessos: ${sucessos}`);
    console.log(`  ❌ Erros: ${erros}`);
    console.log(`  📊 Taxa de sucesso: ${((sucessos / municipios.length) * 100).toFixed(2)}%`);

    // 4. Verificação final
    const total = await prisma.city.count();
    const comPopulacao = await prisma.city.count({
      where: {
        population: { gt: 0 },
      },
    });

    console.log(`\n📊 Estado final do banco de dados:`);
    console.log(`  - Total de cidades: ${total}`);
    console.log(`  - Cidades com população: ${comPopulacao}`);

    // Top 5
    const top5 = await prisma.city.findMany({
      orderBy: { population: 'desc' },
      take: 5,
    });

    if (top5.length > 0) {
      console.log(`\n📍 Top 5 maiores cidades:`);
      top5.forEach((city, idx) => {
        console.log(`  ${idx + 1}. ${city.name}: ${city.population?.toLocaleString('pt-BR')} hab`);
      });
    }
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

coletarEInserirDadosCenso().catch((error) => {
  console.error('Erro não tratado:', error);
  process.exit(1);
});

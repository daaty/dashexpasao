/**
 * Script CORRIGIDO para atualizar população das 142 cidades de MT
 * Usa a tabela 4709 do SIDRA (População residente - Censo 2022)
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Tabela 4709 - População residente (a correta!)
const SIDRA_BASE = 'https://apisidra.ibge.gov.br/values';

/**
 * Busca população total do Censo 2022 via SIDRA - TABELA 4709
 */
async function buscarPopulacaoCorreta(codigoMunicipio: number): Promise<number> {
  try {
    // Tabela 4709: População residente
    // v/93 = Variável População residente
    // p/2022 = Período 2022
    const url = `${SIDRA_BASE}/t/4709/n6/${codigoMunicipio}/v/93/p/2022`;
    
    const response = await axios.get(url, { timeout: 15000 });
    
    if (response.data && response.data.length > 1) {
      const valor = response.data[1]?.V;
      if (valor && valor !== '-' && valor !== '...' && valor !== 'X') {
        return parseInt(valor) || 0;
      }
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Busca população por faixa etária (15-44 anos)
 * Tabela 9514 - População residente por grupos de idade
 */
async function buscarPopulacao15a44(codigoMunicipio: number): Promise<number> {
  try {
    // Faixas etárias: 15-19, 20-24, 25-29, 30-34, 35-39, 40-44
    // c58: códigos das faixas etárias
    const faixas = [
      '2795',  // 15 a 19 anos
      '2796',  // 20 a 24 anos
      '2797',  // 25 a 29 anos
      '2798',  // 30 a 34 anos
      '2799',  // 35 a 39 anos
      '2800',  // 40 a 44 anos
    ];
    
    let total = 0;
    
    for (const faixa of faixas) {
      try {
        const url = `${SIDRA_BASE}/t/9514/n6/${codigoMunicipio}/v/93/p/2022/c58/${faixa}`;
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data && response.data.length > 1) {
          const valor = response.data[1]?.V;
          if (valor && valor !== '-' && valor !== '...' && valor !== 'X') {
            total += parseInt(valor) || 0;
          }
        }
        
        await new Promise(r => setTimeout(r, 100));
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
  console.log('🚀 CORREÇÃO DE POPULAÇÃO - TABELA 4709 SIDRA');
  console.log('='.repeat(60));
  console.log('📊 Fonte: IBGE Censo 2022 - Tabela 4709\n');

  try {
    // 1. Listar municípios
    console.log('📍 Listando municípios de Mato Grosso...');
    const municipios = await listarMunicipiosMT();
    console.log(`✅ ${municipios.length} municípios encontrados\n`);

    let atualizados = 0;
    let comDados = 0;
    let semDados = 0;

    // 2. Processar cada município
    for (let i = 0; i < municipios.length; i++) {
      const mun = municipios[i];
      const progresso = `[${i + 1}/${municipios.length}]`;

      process.stdout.write(`${progresso} ${mun.nome}... `);

      try {
        // Buscar população correta
        const populacao = await buscarPopulacaoCorreta(mun.id);
        
        // Buscar população 15-44 (opcional, pode ser lento)
        let pop15a44 = 0;
        if (populacao > 0) {
          pop15a44 = await buscarPopulacao15a44(mun.id);
        }

        // Atualizar no banco
        const cidadeExistente = await prisma.city.findUnique({
          where: { id: mun.id },
        });

        if (cidadeExistente) {
          await prisma.city.update({
            where: { id: mun.id },
            data: {
              population: populacao > 0 ? populacao : cidadeExistente.population,
              population15to44: pop15a44 > 0 ? pop15a44 : cidadeExistente.population15to44,
              updatedAt: new Date(),
            },
          });
        }

        if (populacao > 0) {
          console.log(`✅ ${populacao.toLocaleString('pt-BR')} hab`);
          comDados++;
        } else {
          console.log(`⚠️  Sem dados (mantido anterior)`);
          semDados++;
        }

        atualizados++;
      } catch (error: any) {
        console.log(`❌ Erro: ${error.message}`);
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 300));
    }

    // 3. Resumo Final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO:');
    console.log(`   ✅ Processados: ${atualizados}`);
    console.log(`   📈 Com dados: ${comDados}`);
    console.log(`   ⚠️  Sem dados: ${semDados}`);

    // 4. Verificação - Top 10
    const top10 = await prisma.city.findMany({
      orderBy: { population: 'desc' },
      take: 10,
      select: { name: true, population: true, population15to44: true },
    });

    console.log('\n📍 Top 10 maiores cidades:');
    top10.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name}: ${c.population?.toLocaleString('pt-BR')} hab`);
    });

    // Nova Monte Verde
    const nmv = await prisma.city.findFirst({
      where: { name: { contains: 'Nova Monte Verde' } },
      select: { name: true, population: true },
    });
    
    if (nmv) {
      console.log(`\n🔍 Nova Monte Verde: ${nmv.population?.toLocaleString('pt-BR')} habitantes`);
    }

  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

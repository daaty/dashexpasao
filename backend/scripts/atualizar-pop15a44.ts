/**
 * Script para ATUALIZAR população 15-44 anos das 142 cidades de MT
 * Usa a tabela 9514 do SIDRA (População por idade - Censo 2022)
 * 
 * Faixas etárias 15-44 anos:
 * - 93086: 15 a 19 anos
 * - 93087: 20 a 24 anos
 * - 93088: 25 a 29 anos
 * - 93089: 30 a 34 anos
 * - 93090: 35 a 39 anos
 * - 93091: 40 a 44 anos
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const SIDRA_BASE = 'https://apisidra.ibge.gov.br/values';

// Códigos das faixas etárias 15-44 anos na tabela 9514
const FAIXAS_15_44 = ['93086', '93087', '93088', '93089', '93090', '93091'];

/**
 * Busca população 15-44 anos via SIDRA tabela 9514
 */
async function buscarPop15a44(codigoMunicipio: number): Promise<number> {
  try {
    // Buscar todas as faixas em uma única requisição
    const faixasStr = FAIXAS_15_44.join(',');
    
    // URL: tabela 9514, município, variável 93 (população), 2022, sexo total, faixas 15-44
    const url = `${SIDRA_BASE}/t/9514/n6/${codigoMunicipio}/v/93/p/2022/c2/6794/c287/${faixasStr}/c286/113635`;
    
    const response = await axios.get(url, { timeout: 30000 });
    
    if (response.data && Array.isArray(response.data)) {
      let total = 0;
      
      // Pular o primeiro item (cabeçalho)
      for (let i = 1; i < response.data.length; i++) {
        const item = response.data[i];
        if (item.V && item.V !== '-' && item.V !== '...' && item.V !== 'X') {
          total += parseInt(item.V) || 0;
        }
      }
      
      return total;
    }
    
    return 0;
  } catch (error: any) {
    // Tentar abordagem alternativa: buscar faixa por faixa
    try {
      let total = 0;
      
      for (const faixa of FAIXAS_15_44) {
        try {
          const url = `${SIDRA_BASE}/t/9514/n6/${codigoMunicipio}/v/93/p/2022/c2/6794/c287/${faixa}/c286/113635`;
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
    } catch {
      return 0;
    }
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
  console.log('🚀 ATUALIZAÇÃO - POPULAÇÃO 15-44 ANOS');
  console.log('='.repeat(60));
  console.log('📊 Fonte: IBGE Censo 2022 - Tabela 9514 (Faixas etárias)\n');

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

      process.stdout.write(`${progresso} ${mun.nome.padEnd(30)}... `);

      try {
        // Buscar população 15-44
        const pop15a44 = await buscarPop15a44(mun.id);

        // Atualizar no banco
        const cidadeExistente = await prisma.city.findUnique({
          where: { id: mun.id },
        });

        if (cidadeExistente) {
          await prisma.city.update({
            where: { id: mun.id },
            data: {
              population15to44: pop15a44 > 0 ? pop15a44 : cidadeExistente.population15to44,
              updatedAt: new Date(),
            },
          });
        }

        if (pop15a44 > 0) {
          const pct = cidadeExistente?.population 
            ? ((pop15a44 / cidadeExistente.population) * 100).toFixed(1) 
            : '?';
          console.log(`✅ ${pop15a44.toLocaleString('pt-BR')} (${pct}%)`);
          comDados++;
        } else {
          console.log(`⚠️  Sem dados`);
          semDados++;
        }

        atualizados++;
      } catch (error: any) {
        console.log(`❌ Erro: ${error.message?.substring(0, 40)}`);
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 400));
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

    console.log('\n📍 Top 10 maiores cidades - Pop 15-44:');
    top10.forEach((c, i) => {
      const pct = c.population && c.population > 0 
        ? ((c.population15to44 || 0) / c.population * 100).toFixed(1)
        : '0';
      console.log(`   ${i + 1}. ${c.name}: ${c.population15to44?.toLocaleString('pt-BR')} (${pct}%)`);
    });

    // Nova Monte Verde
    const nmv = await prisma.city.findFirst({
      where: { name: { contains: 'Nova Monte Verde' } },
      select: { name: true, population: true, population15to44: true },
    });
    
    if (nmv) {
      const pct = nmv.population && nmv.population > 0 
        ? ((nmv.population15to44 || 0) / nmv.population * 100).toFixed(1)
        : '0';
      console.log(`\n🔍 Nova Monte Verde: ${nmv.population15to44?.toLocaleString('pt-BR')} pessoas 15-44 anos (${pct}%)`);
    }

  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

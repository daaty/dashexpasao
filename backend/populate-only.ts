/**
 * Script simplificado - apenas popula dados IBGE (pula migration)
 */

import axios from 'axios';
import { PrismaClient, Mesorregion } from '@prisma/client';

const prisma = new PrismaClient();

interface IBGEMunicipio {
  id: number;
  nome: string;
  microrregiao: {
    id: number;
    nome: string;
    mesorregiao: {
      id: number;
      nome: string;
    };
  };
}

interface IBGEPopulacao {
  localidade: string;
  valor: string;
}

// Mapeamento de mesorregiões do IBGE para o enum do banco
const mesorregionMap: Record<string, Mesorregion> = {
  'Norte Mato-grossense': 'NORTE_MATOGROSSENSE',
  'Nordeste Mato-grossense': 'NORDESTE_MATOGROSSENSE',
  'Centro-Sul Mato-grossense': 'CENTRO_SUL_MATOGROSSENSE',
  'Sudeste Mato-grossense': 'SUDESTE_MATOGROSSENSE',
  'Sudoeste Mato-grossense': 'SUDOESTE_MATOGROSSENSE',
};

async function fetchPopulationEstimate(cityId: number): Promise<number | null> {
  try {
    const response = await axios.get<IBGEPopulacao[]>(
      `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2021/variaveis/9324?localidades=N6[${cityId}]`
    );

    if (response.data && response.data.length > 0) {
      const valorStr = response.data[0].valor;
      if (valorStr && valorStr !== '-') {
        return parseInt(valorStr, 10);
      }
    }
  } catch (error) {
    console.error(`Erro ao buscar população para cidade ${cityId}:`, error);
  }
  return null;
}

async function main() {
  console.log('🔍 Buscando municípios de Mato Grosso do IBGE...');

  try {
    const response = await axios.get<IBGEMunicipio[]>(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios'
    );

    const municipios = response.data;
    console.log(`✅ ${municipios.length} municípios encontrados`);

    let inserted = 0;
    let skipped = 0;

    for (const municipio of municipios) {
      // Verificar se microrregião e mesorregião existem
      if (!municipio.microrregiao?.mesorregiao?.nome) {
        console.log(
          `⚠️  Pulando ${municipio.nome} - sem dados de mesorregião`
        );
        skipped++;
        continue;
      }
      
      const mesoName = municipio.microrregiao.mesorregiao.nome;
      const mesorregion = mesorregionMap[mesoName];

      if (!mesorregion) {
        console.log(
          `⚠️  Pulando ${municipio.nome} - mesorregião "${mesoName}" não mapeada`
        );
        skipped++;
        continue;
      }

      console.log(`📍 Processando: ${municipio.nome}`);

      const population = await fetchPopulationEstimate(municipio.id);

      if (!population) {
        console.log(`  ⚠️  População não encontrada, pulando...`);
        skipped++;
        continue;
      }

      await prisma.city.upsert({
        where: { id: municipio.id },
        update: {
          name: municipio.nome,
          state: 'MT',
          mesorregion,
          population,
          updatedAt: new Date(),
        },
        create: {
          id: municipio.id,
          name: municipio.nome,
          state: 'MT',
          mesorregion,
          population,
          population15to44: Math.floor(population * 0.4),
          averageIncome: 2500,
          urbanizationIndex: 0.75,
          status: 'NOT_SERVED',
          gentilic: 'Mato-grossense',
          anniversary: '01/01',
          mayor: 'N/A',
          averageFormalSalary: 2500,
          formalJobs: Math.floor(population * 0.3),
          urbanizedAreaKm2: 50,
        },
      });

      inserted++;
      console.log(`  ✅ Inserido/Atualizado`);
    }

    console.log(`\n✅ População concluída:`);
    console.log(`   - ${inserted} cidades inseridas/atualizadas`);
    console.log(`   - ${skipped} cidades puladas`);

    const totalCities = await prisma.city.count();
    console.log(`\n📊 Total no banco: ${totalCities} cidades`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

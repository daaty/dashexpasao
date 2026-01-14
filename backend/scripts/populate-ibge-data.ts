import { PrismaClient } from '@prisma/client';
import axios from 'axios';

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

// Mapeamento de mesorregiões do IBGE para nosso enum
const mesorregionMap: Record<string, string> = {
  'Norte Mato-grossense': 'NORTE_MATOGROSSENSE',
  'Nordeste Mato-grossense': 'NORDESTE_MATOGROSSENSE',
  'Centro-Sul Mato-grossense': 'CENTRO_SUL_MATOGROSSENSE',
  'Sudeste Mato-grossense': 'SUDESTE_MATOGROSSENSE',
  'Sudoeste Mato-grossense': 'SUDOESTE_MATOGROSSENSE',
};

async function fetchIBGEMunicipios(): Promise<IBGEMunicipio[]> {
  console.log('🔍 Buscando municípios de Mato Grosso do IBGE...');
  const response = await axios.get<IBGEMunicipio[]>(
    'https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios'
  );
  return response.data;
}

async function fetchPopulationEstimate(cityId: number): Promise<number | null> {
  try {
    // API de estimativa populacional (última disponível)
    const response = await axios.get(
      `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2021/variaveis/9324?localidades=N6[${cityId}]`
    );
    
    const data = response.data[0]?.resultados?.[0]?.series?.[0];
    if (data?.serie?.['2021']) {
      return parseInt(data.serie['2021']);
    }
  } catch (error) {
    console.warn(`⚠️  Erro ao buscar população para cidade ${cityId}`);
  }
  return null;
}

async function main() {
  console.log('🚀 Iniciando população do banco com dados do IBGE\n');

  try {
    // Buscar municípios do IBGE
    const municipios = await fetchIBGEMunicipios();
    console.log(`✅ ${municipios.length} municípios encontrados\n`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const municipio of municipios) {
      const mesorregionName = municipio.microrregiao?.mesorregiao?.nome;
      
      if (!mesorregionName) {
        console.warn(`⚠️  Dados incompletos para: ${municipio.nome} (ID: ${municipio.id})`);
        skipped++;
        continue;
      }
      
      const mesorregion = mesorregionMap[mesorregionName];

      if (!mesorregion) {
        console.warn(`⚠️  Mesorregião desconhecida: ${mesorregionName} (${municipio.nome})`);
        skipped++;
        continue;
      }

      console.log(`📍 Processando: ${municipio.nome} (ID: ${municipio.id})`);

      // Buscar população estimada
      const population = await fetchPopulationEstimate(municipio.id);
      
      // Verificar se cidade já existe
      const existingCity = await prisma.city.findUnique({
        where: { id: municipio.id },
      });

      const cityData = {
        name: municipio.nome,
        mesorregion: mesorregion as any,
        // Campos com valores padrão (podem ser atualizados depois)
        population: population || 10000, // População padrão se não conseguir buscar
        population15to44: Math.floor((population || 10000) * 0.4), // Estimativa ~40%
        averageIncome: 2500.0,
        urbanizationIndex: 0.7,
        status: 'NOT_SERVED' as any,
        gentilic: `${municipio.nome}ense`,
        anniversary: '01/01',
        mayor: 'A definir',
        averageFormalSalary: 2800.0,
        formalJobs: Math.floor((population || 10000) * 0.3),
        urbanizedAreaKm2: 50.0,
      };

      if (existingCity) {
        // Atualizar apenas se não tiver dados importantes
        await prisma.city.update({
          where: { id: municipio.id },
          data: {
            name: municipio.nome,
            mesorregion: mesorregion as any,
            ...(population && { population }),
            ...(population && { population15to44: Math.floor(population * 0.4) }),
          },
        });
        updated++;
        console.log(`  ✏️  Atualizado`);
      } else {
        // Inserir nova cidade
        await prisma.city.create({
          data: {
            id: municipio.id,
            ...cityData,
          },
        });
        inserted++;
        console.log(`  ✅ Inserido`);
      }

      // Aguardar um pouco para não sobrecarregar a API do IBGE
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Resumo:');
    console.log(`  ✅ Inseridos: ${inserted}`);
    console.log(`  ✏️  Atualizados: ${updated}`);
    console.log(`  ⏭️  Ignorados: ${skipped}`);
    console.log(`  📍 Total processado: ${inserted + updated + skipped}\n`);

    console.log('✨ População concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

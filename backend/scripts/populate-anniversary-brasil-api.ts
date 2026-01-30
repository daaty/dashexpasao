import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface BrasilAPICity {
  nome: string;
  codigo_ibge: string;
  criacao?: string; // Some responses include creation date from Wikipedia
  data_criacao?: string;
  founded?: string;
  founded_at?: string;
  [key: string]: any;
}

async function fetchCityFromBrasilAPI(
  cityCode: string,
  cityName: string
): Promise<string | null> {
  try {
    // Try different endpoints and providers
    const endpoints = [
      // With Wikipedia provider
      `https://brasilapi.com.br/api/ibge/municipios/v1/MT?providers=wikipedia`,
      // Basic endpoint
      `https://brasilapi.com.br/api/ibge/municipios/v1/MT`,
    ];

    for (const endpoint of endpoints) {
      const response = await axios.get(endpoint, { timeout: 5000 });
      const cities = Array.isArray(response.data) ? response.data : [response.data];

      // Find the city by code or name
      const foundCity = cities.find(
        (c) =>
          c.codigo_ibge?.endsWith(cityCode) ||
          c.code?.toString() === cityCode ||
          c.nome?.toUpperCase() === cityName.toUpperCase()
      );

      if (foundCity) {
        // Check for anniversary/foundation date fields
        const dateFields = [
          'criacao',
          'data_criacao',
          'founded',
          'founded_at',
          'aniversario',
          'anniversary',
          'data_fundacao',
          'data_emancipacao',
        ];

        for (const field of dateFields) {
          if (foundCity[field]) {
            return foundCity[field];
          }
        }

        // If no date found, log what fields we have
        console.log(`ℹ️  ${cityName} - campos disponíveis:`, Object.keys(foundCity));
      }
    }

    return null;
  } catch (error: any) {
    console.error(`❌ Erro ao buscar ${cityName}:`, error.message);
    return null;
  }
}

async function populateAnniversariesFromBrasilAPI() {
  console.log('🎂 Buscando datas de aniversário via Brasil API');
  console.log('==================================================\n');

  const cities = await prisma.city.findMany({
    where: { status: 'PLANNING' },
    take: 5, // Start with 5 for testing
  });

  console.log(`📍 Testando com ${cities.length} cidades:\n`);

  let updated = 0;
  let notFound = 0;

  for (const city of cities) {
    const anniversary = await fetchCityFromBrasilAPI(
      city.id.toString().slice(-7),
      city.name
    );

    if (anniversary) {
      await prisma.city.update({
        where: { id: city.id },
        data: { anniversary },
      });
      console.log(`✅ ${city.name}: ${anniversary}`);
      updated++;
    } else {
      console.log(`⏭️  ${city.name}: sem data disponível`);
      notFound++;
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`✅ Atualizadas: ${updated}`);
  console.log(`⏭️  Não encontradas: ${notFound}`);

  await prisma.$disconnect();
}

populateAnniversariesFromBrasilAPI();

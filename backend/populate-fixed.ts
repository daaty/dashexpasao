/**
 * Script robusto para popular com dados do internalData.ts
 */

import { PrismaClient, CityStatus } from '@prisma/client';
import { internalCitiesData } from '../services/internalData.js';

const prisma = new PrismaClient();

// Mapear strings para enum CityStatus
function mapStatus(status: string): CityStatus {
  const statusMap: Record<string, CityStatus> = {
    'Consolidada': 'CONSOLIDATED',
    'Em Expansão': 'EXPANSION',
    'Não atendida': 'NOT_SERVED',
    'Planejamento': 'PLANNING',
  };
  return (statusMap[status] as CityStatus) || 'NOT_SERVED';
}

async function main() {
  console.log(`🔍 Populando banco com ${internalCitiesData.length} cidades do internalData.ts...`);

  let inserted = 0;
  let errors = 0;

  for (const city of internalCitiesData) {
    try {
      await prisma.city.upsert({
        where: { id: city.id },
        update: {
          name: city.name,
          mesorregion: city.mesorregion,
          population: city.population,
          population15to44: city.population15to44,
          averageIncome: city.averageIncome,
          urbanizationIndex: city.urbanizationIndex,
          status: mapStatus(city.status as any),
          gentilic: city.gentilic,
          anniversary: city.anniversary,
          mayor: city.mayor,
          monthlyRevenue: city.monthlyRevenue || null,
          implementationStartDate: city.implementationStartDate ? new Date(city.implementationStartDate) : null,
          averageFormalSalary: city.averageFormalSalary,
          formalJobs: city.formalJobs,
          urbanizedAreaKm2: city.urbanizedAreaKm2,
          updatedAt: new Date(),
        },
        create: {
          id: city.id,
          name: city.name,
          mesorregion: city.mesorregion,
          population: city.population,
          population15to44: city.population15to44,
          averageIncome: city.averageIncome,
          urbanizationIndex: city.urbanizationIndex,
          status: mapStatus(city.status as any),
          gentilic: city.gentilic,
          anniversary: city.anniversary,
          mayor: city.mayor,
          monthlyRevenue: city.monthlyRevenue || null,
          implementationStartDate: city.implementationStartDate ? new Date(city.implementationStartDate) : null,
          averageFormalSalary: city.averageFormalSalary,
          formalJobs: city.formalJobs,
          urbanizedAreaKm2: city.urbanizedAreaKm2,
        },
      });
      
      inserted++;
      if (inserted % 10 === 0) {
        console.log(`  ✅ ${inserted} cidades processadas...`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ Erro ao inserir ${city.name}:`, (error as any).message);
    }
  }

  console.log(`\n✅ População concluída:`);
  console.log(`   - ${inserted} cidades inseridas/atualizadas`);
  console.log(`   - ${errors} erros`);

  const totalCities = await prisma.city.count();
  console.log(`📊 Total no banco: ${totalCities} cidades`);

  await prisma.$disconnect();
}

main();

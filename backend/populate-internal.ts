/**
 * Script para popular com dados do internalData.ts
 */

import { PrismaClient, CityStatus as PrismaCityStatus } from '@prisma/client';
import { internalCitiesData } from './services/internalData.js';
import { CityStatus } from './types.js';

const prisma = new PrismaClient();

function mapStatusToPrisma(status: CityStatus | string): PrismaCityStatus {
  // Handle string values if they come as raw strings
  const statusStr = status.toString();
  
  if (statusStr === 'Não atendida' || statusStr === CityStatus.NotServed) return PrismaCityStatus.NOT_SERVED;
  if (statusStr === 'Consolidada' || statusStr === CityStatus.Consolidated) return PrismaCityStatus.CONSOLIDATED;
  if (statusStr === 'Em expansão' || statusStr === CityStatus.Expansion) return PrismaCityStatus.EXPANSION;
  if (statusStr === 'Planejamento' || statusStr === CityStatus.Planning) return PrismaCityStatus.PLANNING;
  
  // Default fallback
  return PrismaCityStatus.NOT_SERVED;
}

async function main() {
  console.log(`🔍 Populando banco com ${internalCitiesData.length} cidades do internalData.ts...`);

  let inserted = 0;

  for (const city of internalCitiesData) {
    try {
      await prisma.city.upsert({
        where: { id: city.id },
        update: {
          name: city.name,
          state: city.state,
          mesorregion: city.mesorregion,
          population: city.population,
          population15to44: city.population15to44,
          averageIncome: city.averageIncome,
          urbanizationIndex: city.urbanizationIndex,
          status: mapStatusToPrisma(city.status),
          gentilic: city.gentilic,
          anniversary: city.anniversary,
          mayor: city.mayor,
          monthlyRevenue: city.monthlyRevenue,
          implementationStartDate: city.implementationStartDate ? new Date(city.implementationStartDate) : undefined,
          averageFormalSalary: city.averageFormalSalary,
          formalJobs: city.formalJobs,
          urbanizedAreaKm2: city.urbanizedAreaKm2,
          updatedAt: new Date(),
        },
        create: {
          id: city.id,
          name: city.name,
          state: city.state,
          mesorregion: city.mesorregion,
          population: city.population,
          population15to44: city.population15to44,
          averageIncome: city.averageIncome,
          urbanizationIndex: city.urbanizationIndex,
          status: mapStatusToPrisma(city.status),
          gentilic: city.gentilic,
          anniversary: city.anniversary,
          mayor: city.mayor,
          monthlyRevenue: city.monthlyRevenue,
          implementationStartDate: city.implementationStartDate ? new Date(city.implementationStartDate) : undefined,
          averageFormalSalary: city.averageFormalSalary,
          formalJobs: city.formalJobs,
          urbanizedAreaKm2: city.urbanizedAreaKm2,
        },
      });
      
      inserted++;
      console.log(`✅ ${city.name} - inserido/atualizado`);
    } catch (error) {
      console.error(`❌ Erro ao inserir ${city.name}:`, error);
    }
  }

  console.log(`\n✅ População concluída: ${inserted} cidades`);

  console.log(`🧹 Removendo cidades obsoletas...`);
  const validIds = internalCitiesData.map(c => c.id);
  const deleted = await prisma.city.deleteMany({
    where: {
      id: {
        notIn: validIds
      }
    }
  });
  console.log(`🗑️ Removidas ${deleted.count} cidades obsoletas.`);

  const totalCities = await prisma.city.count();
  console.log(`📊 Total no banco: ${totalCities} cidades`);

  await prisma.$disconnect();
}

main();

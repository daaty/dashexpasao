import prisma from '../config/database';
import { CityStatus, Mesorregion, PaginationQuery } from '../types';
import { fetchCityDataFromIBGE } from './ibge.service';
import logger from '../config/logger';

/**
 * Busca todas as cidades com paginação e filtros
 */
export const getAllCities = async (query: PaginationQuery & {
  status?: CityStatus;
  mesorregion?: Mesorregion;
  minPopulation?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  // Normalizar status para o valor do banco
  if (query.status) {
    // Aceita tanto enum frontend quanto string backend
    const statusMap: Record<string, string> = {
      'Planejamento': 'PLANNING',
      'PLANNING': 'PLANNING',
      'Em expansão': 'EXPANSION',
      'EXPANSION': 'EXPANSION',
      'Consolidada': 'CONSOLIDATED',
      'CONSOLIDATED': 'CONSOLIDATED',
      'Não atendida': 'NOT_SERVED',
      'NOT_SERVED': 'NOT_SERVED',
      'not_served': 'NOT_SERVED',
      'consolidated': 'CONSOLIDATED',
      'expansion': 'EXPANSION',
      'planning': 'PLANNING',
    };
    const normalized = statusMap[query.status] || query.status;
    where.status = normalized;
  }
  if (query.mesorregion) where.mesorregion = query.mesorregion;
  if (query.minPopulation) where.population = { gte: query.minPopulation };

  const [cities, total] = await Promise.all([
    prisma.city.findMany({
      where,
      skip,
      take: limit,
      orderBy: { population: query.order || 'desc' },
    }),
    prisma.city.count({ where }),
  ]);

  return {
    cities,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Busca cidade por ID
 */
export const getCityById = async (id: number) => {
  const city = await prisma.city.findUnique({
    where: { id },
    include: {
      plannings: true,
    },
  });

  if (!city) {
    throw new Error('Cidade não encontrada');
  }

  return city;
};

/**
 * Atualiza dados de uma cidade com informações do IBGE
 */
export const updateCityFromIBGE = async (id: number) => {
  const city = await getCityById(id);
  
  logger.info(`Atualizando dados do IBGE para cidade ${city.name} (ID: ${id})`);
  
  const ibgeData = await fetchCityDataFromIBGE(id);
  
  const updatedCity = await prisma.city.update({
    where: { id },
    data: {
      population: ibgeData.population > 0 ? ibgeData.population : city.population,
      averageFormalSalary: ibgeData.averageSalary > 0 ? ibgeData.averageSalary : city.averageFormalSalary,
      formalJobs: ibgeData.formalJobs > 0 ? ibgeData.formalJobs : city.formalJobs,
      averageIncome: ibgeData.pibPerCapita > 0 ? ibgeData.pibPerCapita / 12 : city.averageIncome,
    },
  });

  // Atualizar cache
  await prisma.iBGECache.upsert({
    where: { cityId: id },
    update: {
      data: ibgeData,
      lastFetched: new Date(),
    },
    create: {
      cityId: id,
      data: ibgeData,
    },
  });

  return updatedCity;
};

/**
 * Mapeia valores de mesorregion para o enum correto
 */
const mapMesorregion = (mesorregion: string): string => {
  if (!mesorregion) return mesorregion;
  
  const mapping: { [key: string]: string } = {
    'NORTE': 'NORTE_MATOGROSSENSE',
    'NORDESTE': 'NORDESTE_MATOGROSSENSE',
    'CENTRO_SUL': 'CENTRO_SUL_MATOGROSSENSE',
    'SUDESTE': 'SUDESTE_MATOGROSSENSE',
    'SUDOESTE': 'SUDOESTE_MATOGROSSENSE',
    'NORTE_MATOGROSSENSE': 'NORTE_MATOGROSSENSE',
    'NORDESTE_MATOGROSSENSE': 'NORDESTE_MATOGROSSENSE',
    'CENTRO_SUL_MATOGROSSENSE': 'CENTRO_SUL_MATOGROSSENSE',
    'SUDESTE_MATOGROSSENSE': 'SUDESTE_MATOGROSSENSE',
    'SUDOESTE_MATOGROSSENSE': 'SUDOESTE_MATOGROSSENSE',
  };
  
  return mapping[mesorregion.toUpperCase()] || mesorregion;
};

/**
 * Cria ou atualiza uma cidade
 */
export const upsertCity = async (cityData: any) => {
  // Remover campos que não existem no modelo Prisma City
  const { monthlyRevenue, ...cleanData } = cityData;
  
  // Mapear mesorregion se existir
  if (cleanData.mesorregion) {
    cleanData.mesorregion = mapMesorregion(cleanData.mesorregion);
  }
  
  return await prisma.city.upsert({
    where: { id: cleanData.id },
    update: cleanData,
    create: cleanData,
  });
};

/**
 * Calcula score de viabilidade de uma cidade
 */
export const calculateCityViabilityScore = (city: any): number => {
  const weights = {
    population: 0.3,
    income: 0.25,
    urbanization: 0.2,
    formalJobs: 0.15,
    targetPopulation: 0.1,
  };

  const scores = {
    population: Math.min((city.population / 100000) * 10, 10),
    income: Math.min((city.averageIncome / 5000) * 10, 10),
    urbanization: city.urbanizationIndex * 10,
    formalJobs: Math.min((city.formalJobs / 30000) * 10, 10),
    targetPopulation: Math.min((city.population15to44 / 50000) * 10, 10),
  };

  const totalScore = Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + scores[key as keyof typeof scores] * weight;
  }, 0);

  return Math.round(totalScore * 10) / 10;
};

/**
 * Obtém cidades ordenadas por score de viabilidade
 */
export const getCitiesByViabilityScore = async (limit = 20) => {
  const cities = await prisma.city.findMany({
    where: {
      status: { not: 'CONSOLIDATED' },
    },
  });

  const citiesWithScores = cities.map((city) => ({
    ...city,
    viabilityScore: calculateCityViabilityScore(city),
  }));

  return citiesWithScores
    .sort((a, b) => b.viabilityScore - a.viabilityScore)
    .slice(0, limit);
};

/**
 * Atualiza o status de uma cidade
 */
export const updateCityStatus = async (cityId: number, status: string) => {
  const updated = await prisma.city.update({
    where: { id: cityId },
    data: { status: status as any },
  });

  logger.info(`🔄 Status atualizado para cidade ${updated.name} (${cityId}): ${status}`);
  return updated;
};

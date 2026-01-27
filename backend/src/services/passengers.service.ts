import prisma from '../config/database';
import logger from '../config/logger';

/**
 * Busca todos os dados de passageiros
 */
export const getAllPassengers = async () => {
  try {
    const passengers = await prisma.passenger.findMany({
      orderBy: { totalPassengers: 'desc' }
    });
    logger.info(`✅ ${passengers.length} registros de passageiros encontrados`);
    return passengers;
  } catch (error) {
    logger.error('❌ Erro ao buscar passageiros:', error);
    throw error;
  }
};

/**
 * Busca passageiros de uma cidade específica
 */
export const getPassengersByCity = async (cityName: string) => {
  try {
    const passenger = await prisma.passenger.findUnique({
      where: { cityName }
    });
    
    if (!passenger) {
      logger.warn(`⚠️ Nenhum dado de passageiro encontrado para: ${cityName}`);
      return null;
    }
    
    logger.info(`✅ Dados de passageiro encontrados para: ${cityName}`);
    return passenger;
  } catch (error) {
    logger.error(`❌ Erro ao buscar passageiros de ${cityName}:`, error);
    throw error;
  }
};

/**
 * Busca passageiros de múltiplas cidades
 */
export const getPassengersByMultipleCities = async (cityNames: string[]) => {
  try {
    const passengers = await prisma.passenger.findMany({
      where: {
        cityName: {
          in: cityNames
        }
      }
    });
    
    logger.info(`✅ Dados de ${passengers.length} cidades encontrados`);
    return passengers;
  } catch (error) {
    logger.error('❌ Erro ao buscar passageiros de múltiplas cidades:', error);
    throw error;
  }
};

/**
 * Cria ou atualiza registro de passageiros
 */
export const upsertPassenger = async (data: {
  cityName: string;
  totalPassengers: number;
  dailyAverage: number;
  peakHourPassengers: number;
  offPeakPassengers: number;
  retentionRate: number;
  repurchaseRate: number;
  churnRate: number;
}) => {
  try {
    const passenger = await prisma.passenger.upsert({
      where: { cityName: data.cityName },
      update: {
        totalPassengers: data.totalPassengers,
        dailyAverage: data.dailyAverage,
        peakHourPassengers: data.peakHourPassengers,
        offPeakPassengers: data.offPeakPassengers,
        retentionRate: data.retentionRate,
        repurchaseRate: data.repurchaseRate,
        churnRate: data.churnRate,
        updatedAt: new Date()
      },
      create: {
        cityName: data.cityName,
        totalPassengers: data.totalPassengers,
        dailyAverage: data.dailyAverage,
        peakHourPassengers: data.peakHourPassengers,
        offPeakPassengers: data.offPeakPassengers,
        retentionRate: data.retentionRate,
        repurchaseRate: data.repurchaseRate,
        churnRate: data.churnRate
      }
    });
    
    logger.info(`✅ Passageiro de ${data.cityName} salvo/atualizado`);
    return passenger;
  } catch (error) {
    logger.error(`❌ Erro ao salvar passageiros de ${data.cityName}:`, error);
    throw error;
  }
};

/**
 * Busca estatísticas agregadas de passageiros
 */
export const getPassengerStats = async () => {
  try {
    const stats = await prisma.passenger.aggregate({
      _sum: {
        totalPassengers: true,
        peakHourPassengers: true,
        offPeakPassengers: true
      },
      _avg: {
        dailyAverage: true,
        retentionRate: true,
        repurchaseRate: true,
        churnRate: true
      },
      _count: true
    });
    
    logger.info('✅ Estatísticas de passageiros calculadas');
    return stats;
  } catch (error) {
    logger.error('❌ Erro ao calcular estatísticas de passageiros:', error);
    throw error;
  }
};

/**
 * Busca top N cidades por passageiros
 */
export const getTopCitiesByPassengers = async (limit: number = 10) => {
  try {
    const topCities = await prisma.passenger.findMany({
      take: limit,
      orderBy: { totalPassengers: 'desc' },
      select: {
        cityName: true,
        totalPassengers: true,
        dailyAverage: true,
        retentionRate: true,
        repurchaseRate: true
      }
    });
    
    logger.info(`✅ Top ${limit} cidades por passageiros encontradas`);
    return topCities;
  } catch (error) {
    logger.error(`❌ Erro ao buscar top ${limit} cidades:`, error);
    throw error;
  }
};

/**
 * Delete passageiro de uma cidade
 */
export const deletePassenger = async (cityName: string) => {
  try {
    const deleted = await prisma.passenger.delete({
      where: { cityName }
    });
    
    logger.info(`✅ Passageiro de ${cityName} deletado`);
    return deleted;
  } catch (error) {
    logger.error(`❌ Erro ao deletar passageiros de ${cityName}:`, error);
    throw error;
  }
};

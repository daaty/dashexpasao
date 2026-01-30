import { api } from './api';

export interface PassengerData {
  id: string;
  cityName: string;
  totalPassengers: number;
  dailyAverage: number;
  peakHourPassengers: number;
  offPeakPassengers: number;
  retentionRate: number;
  repurchaseRate: number;
  churnRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface PassengerStats {
  _sum: {
    totalPassengers: number | null;
    peakHourPassengers: number | null;
    offPeakPassengers: number | null;
  };
  _avg: {
    dailyAverage: number | null;
    retentionRate: number | null;
    repurchaseRate: number | null;
    churnRate: number | null;
  };
  _count: number;
}

/**
 * Busca todos os passageiros
 */
export const getAllPassengers = async (): Promise<PassengerData[]> => {
  try {
    const response = await api.get('/passengers');
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao buscar passageiros:', error);
    return [];
  }
};

/**
 * Busca passageiros de uma cidade específica
 */
export const getPassengersByCity = async (cityName: string): Promise<PassengerData | null> => {
  try {
    const response = await api.get(`/passengers/${encodeURIComponent(cityName)}`);
    return response.data.data || null;
  } catch (error) {
    console.error(`Erro ao buscar passageiros de ${cityName}:`, error);
    return null;
  }
};

/**
 * Busca passageiros de múltiplas cidades
 */
export const getPassengersByMultipleCities = async (
  cityNames: string[]
): Promise<PassengerData[]> => {
  try {
    const response = await api.post('/passengers/batch', { cityNames });
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao buscar passageiros de múltiplas cidades:', error);
    return [];
  }
};

/**
 * Busca estatísticas agregadas de passageiros
 */
export const getPassengerStats = async (): Promise<PassengerStats | null> => {
  try {
    const response = await api.get('/passengers/stats');
    return response.data.data || null;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de passageiros:', error);
    return null;
  }
};

/**
 * Busca top N cidades por passageiros
 */
export const getTopCitiesByPassengers = async (limit: number = 10): Promise<PassengerData[]> => {
  try {
    const response = await api.get(`/passengers/top/${limit}`);
    return response.data.data || [];
  } catch (error) {
    console.error(`Erro ao buscar top ${limit} cidades:`, error);
    return [];
  }
};

/**
 * Cria ou atualiza registro de passageiros
 */
export const upsertPassenger = async (
  data: Omit<PassengerData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PassengerData | null> => {
  try {
    const response = await api.post('/passengers', data);
    return response.data.data || null;
  } catch (error) {
    console.error(`Erro ao salvar passageiros de ${data.cityName}:`, error);
    return null;
  }
};

/**
 * Deleta registro de passageiros de uma cidade
 */
export const deletePassenger = async (cityName: string): Promise<boolean> => {
  try {
    await api.delete(`/passengers/${encodeURIComponent(cityName)}`);
    console.info(`Passageiro de ${cityName} deletado com sucesso`);
    return true;
  } catch (error) {
    console.error(`Erro ao deletar passageiros de ${cityName}:`, error);
    return false;
  }
};

/**
 * Busca dados de passageiros com tratamento de erro para usar como fallback
 */
export const safeGetPassengersByCity = async (
  cityName: string
): Promise<Partial<PassengerData> | null> => {
  try {
    return await getPassengersByCity(cityName);
  } catch (error) {
    // Retorna um objeto com valores padrão se houver erro
    return {
      cityName,
      totalPassengers: 0,
      dailyAverage: 0,
      peakHourPassengers: 0,
      offPeakPassengers: 0,
      retentionRate: 0,
      repurchaseRate: 0,
      churnRate: 0
    };
  }
};

/**
 * Calcula percentual de retenção
 */
export const calculateRetentionPercentage = (data: PassengerData): number => {
  return Math.round(data.retentionRate * 100);
};

/**
 * Calcula percentual de recompra
 */
export const calculateRepurchasePercentage = (data: PassengerData): number => {
  return Math.round(data.repurchaseRate * 100);
};

/**
 * Calcula percentual de churn (abandono)
 */
export const calculateChurnPercentage = (data: PassengerData): number => {
  return Math.round(data.churnRate * 100);
};

/**
 * Formata número de passageiros para exibição
 */
export const formatPassengerCount = (count: number): string => {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}k`;
  }
  return count.toString();
};

import api from './api';

/**
 * Tipos para dados de corridas
 */
export interface RideStats {
  cityName: string;
  totalRides: number;
  totalRevenue: number;
  averageValue: number;
  firstRide: Date | null;
  lastRide: Date | null;
  activeMonths: number;
  averageRidesPerDay: number;
  averageRidesPerMonth: number;
}

export interface MonthlyRideData {
  month: string;
  year: number;
  monthNumber: number;
  rides: number;
  revenue: number;
  averageValue: number;
  uniqueDays: number;
}

export interface DailyRideData {
  date: string;
  rides: number;
  revenue: number;
}

export interface RidesSummary {
  totalRides: number;
  totalRevenue: number;
  citiesWithData: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  topCities: Array<{
    city: string;
    rides: number;
    revenue: number;
  }>;
}

export interface RidesServiceStatus {
  available: boolean;
  message: string;
}

// Cache para cidades com dados
let citiesCache: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30 * 1000; // 30 segundos - para atualizar dados em tempo real

/**
 * Verifica se o serviço de corridas está disponível
 */
export const checkRidesServiceStatus = async (): Promise<RidesServiceStatus> => {
  try {
    const response = await api.get('/rides/status');
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar status do serviço de corridas:', error);
    return {
      available: false,
      message: 'Erro ao conectar com o serviço'
    };
  }
};

/**
 * Busca lista de cidades com dados de corridas (com cache)
 */
export const getCitiesWithRides = async (forceRefresh = false): Promise<string[]> => {
  try {
    // Usar cache se disponível e não expirado
    const now = Date.now();
    if (!forceRefresh && citiesCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return citiesCache;
    }

    const response = await api.get('/rides/cities');
    citiesCache = response.data.cities || [];
    cacheTimestamp = now;
    
    return citiesCache;
  } catch (error) {
    console.error('Erro ao buscar cidades com corridas:', error);
    return citiesCache || []; // Retorna cache antigo em caso de erro
  }
};

/**
 * Verifica se uma cidade tem dados de corridas disponíveis
 */
export const cityHasRidesData = async (cityName: string): Promise<boolean> => {
  try {
    const cities = await getCitiesWithRides();
    const normalizedName = cityName.toLowerCase().trim();
    return cities.some(city => city.toLowerCase().trim() === normalizedName);
  } catch (error) {
    console.error('Erro ao verificar dados da cidade:', error);
    return false;
  }
};

/**
 * Busca estatísticas de corridas de uma cidade
 */
export const getRideStatsByCity = async (
  cityName: string,
  filters?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<RideStats | null> => {
  try {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(
      `/rides/city/${encodeURIComponent(cityName)}/stats?${params.toString()}`
    );
    
    return {
      ...response.data,
      firstRide: response.data.firstRide ? new Date(response.data.firstRide) : null,
      lastRide: response.data.lastRide ? new Date(response.data.lastRide) : null,
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      // Cidade sem dados - não é erro, apenas não tem dados de corridas
      // Silenciosamente retorna null sem logar nada
      return null;
    }
    // Erros reais (network, 500, etc) devem ser logados
    console.error('Erro ao buscar estatísticas de corridas:', error);
    throw error;
  }
};

/**
 * Busca dados mensais de corridas de uma cidade
 */
export const getMonthlyRidesByCity = async (
  cityName: string,
  months: number = 6,
  startDate?: string,
  page: number = 1
): Promise<MonthlyRideData[]> => {
  try {
    const params = new URLSearchParams();
    params.append('months', months.toString());
    params.append('page', page.toString());
    if (startDate) params.append('startDate', startDate);

    const response = await api.get(
      `/rides/city/${encodeURIComponent(cityName)}/monthly?${params.toString()}`
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao buscar dados mensais de corridas:', error);
    return [];
  }
};

/**
 * Busca dados diários de corridas de uma cidade
 */
export const getDailyRidesByCity = async (
  cityName: string,
  days: number = 30
): Promise<DailyRideData[]> => {
  try {
    const params = new URLSearchParams();
    params.append('days', days.toString());

    const response = await api.get(
      `/rides/city/${encodeURIComponent(cityName)}/daily?${params.toString()}`
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao buscar dados diários de corridas:', error);
    return [];
  }
};

/**
 * Busca resumo geral de todas as corridas
 */
export const getRidesSummary = async (filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<RidesSummary | null> => {
  try {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/rides/summary?${params.toString()}`);
    
    return {
      ...response.data,
      dateRange: {
        start: response.data.dateRange.start ? new Date(response.data.dateRange.start) : null,
        end: response.data.dateRange.end ? new Date(response.data.dateRange.end) : null,
      },
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Erro ao buscar resumo de corridas:', error);
    throw error;
  }
};

/**
 * Hook React para verificar status do serviço
 */
export const useRidesService = () => {
  const [status, setStatus] = React.useState<RidesServiceStatus>({
    available: false,
    message: 'Verificando...'
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    checkRidesServiceStatus()
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  return { status, loading };
};

// Importar React para o hook
import React from 'react';

export default {
  checkRidesServiceStatus,
  getCitiesWithRides,
  cityHasRidesData,
  getRideStatsByCity,
  getMonthlyRidesByCity,
  getDailyRidesByCity,
  getRidesSummary,
  useRidesService,
};

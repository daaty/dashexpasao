import { api } from './api';

export interface RevenueData {
  [monthKey: string]: number; // "2025-01": 5000
}

/**
 * Busca receita de recargas por mês para uma cidade
 * @param cityName - Nome da cidade
 * @returns Object com receita por mês { "2025-01": 5000, "2025-02": 5500 }
 */
export const getMonthlyRevenueData = async (cityName: string): Promise<RevenueData> => {
  try {
    const response = await api.get(`/plannings/revenue/${encodeURIComponent(cityName)}`);
    
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    
    return {};
  } catch (error: any) {
    console.error(`Erro ao buscar receita para ${cityName}:`, error.message);
    return {};
  }
};

/**
 * Busca receita de recargas para múltiplas cidades
 * @param cityNames - Array de nomes de cidades
 * @returns Object com receita por cidade { "Nova Monte Verde": { "2025-01": 5000 } }
 */
export const getMultipleCitiesRevenueData = async (
  cityNames: string[]
): Promise<{ [cityName: string]: RevenueData }> => {
  try {
    const results: { [cityName: string]: RevenueData } = {};
    
    for (const cityName of cityNames) {
      const revenue = await getMonthlyRevenueData(cityName);
      results[cityName] = revenue;
    }
    
    return results;
  } catch (error: any) {
    console.error('Erro ao buscar receitas para múltiplas cidades:', error.message);
    return {};
  }
};

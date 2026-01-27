import api from './api';
import { City, CityStatus } from '../types';

const mapBackendStatusToFrontend = (backendStatus: string): CityStatus => {
  switch (backendStatus) {
    case 'PLANNING':
    case 'planning':
      return CityStatus.Planning; // "Planejamento"
    case 'EXPANSION':
    case 'expansion':
      return CityStatus.Expansion; // "Em expansão"
    case 'CONSOLIDATED':
    case 'consolidated':
      return CityStatus.Consolidated; // "Consolidada"
    case 'NOT_SERVED':
    case 'not_served':
      return CityStatus.NotServed; // "Não atendida"
    default:
      return CityStatus.NotServed;
  }
};

const mapBackendCityToFrontend = (city: any): City => ({
  ...city,
  status: mapBackendStatusToFrontend(city.status)
});

/**
 * Busca todas as cidades
 */
export const fetchAllCities = async (params?: {
  status?: string;
  mesorregion?: string;
  page?: number;
  limit?: number;
}): Promise<{ cities: City[]; pagination: any }> => {
  try {
    const response = await api.get('/cities', { params });
    console.log('🔍 DEBUG fetchAllCities - Status:', response.status);
    console.log('🔍 DEBUG fetchAllCities - Data keys:', Object.keys(response.data));
    console.log('🔍 DEBUG fetchAllCities - Full response:', response.data);
    
    // Backend retorna { success, data, pagination }
    const backendData = response.data.data || response.data;
    const cities = Array.isArray(backendData) ? backendData : [];
    
    console.log('✅ Cidades processadas:', cities.length);
    
    return {
      cities: cities.map(mapBackendCityToFrontend),
      pagination: response.data.pagination || null,
    };
  } catch (error) {
    console.error('❌ ERRO ao buscar cidades:', error);
    return { cities: [], pagination: null };
  }
};

/**
 * Busca cidade por ID
 */
export const fetchCityById = async (cityId: number): Promise<City | null> => {
  try {
    const response = await api.get(`/cities/${cityId}`);
    const cityData = response.data.data || response.data;
    return cityData ? mapBackendCityToFrontend(cityData) : null;
  } catch (error) {
    console.error('Erro ao buscar cidade:', error);
    return null;
  }
};

/**
 * Atualiza dados de uma cidade com informações do IBGE
 */
export const updateCityFromIBGE = async (cityId: number): Promise<City | null> => {
  try {
    const response = await api.put(`/cities/${cityId}/update-ibge`);
    const cityData = response.data.data || response.data;
    return cityData ? mapBackendCityToFrontend(cityData) : null;
  } catch (error) {
    console.error('Erro ao atualizar cidade do IBGE:', error);
    return null;
  }
};

/**
 * Criar ou atualizar cidade
 */
export const upsertCity = async (cityData: City): Promise<City | null> => {
  try {
    const response = await api.post('/cities', cityData);
    return response.data.data || response.data || null;
  } catch (error) {
    console.error('Erro ao salvar cidade:', error);
    return null;
  }
};

/**
 * Buscar cidades por score de viabilidade
 */
export const getCitiesByViability = async (limit?: number): Promise<City[]> => {
  try {
    const response = await api.get('/cities/viability', { params: { limit } });
    const cities = response.data.data || response.data || [];
    return Array.isArray(cities) ? cities : [];
  } catch (error) {
    console.error('Erro ao buscar cidades por viabilidade:', error);
    return [];
  }
};

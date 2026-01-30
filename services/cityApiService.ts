import { api } from './api';
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

const mapBackendMesorregionToFrontend = (backendMeso: string): string => {
  const mesoMap: { [key: string]: string } = {
    'NORTE': 'NORTE_MATOGROSSENSE',
    'NORDESTE': 'NORDESTE_MATOGROSSENSE',
    'CENTRO_SUL': 'CENTRO_SUL_MATOGROSSENSE',
    'SUDESTE': 'SUDESTE_MATOGROSSENSE',
    'SUDOESTE': 'SUDOESTE_MATOGROSSENSE',
  };
  return mesoMap[backendMeso] || backendMeso;
};

const mapBackendCityToFrontend = (city: any): City => ({
  ...city,
  status: mapBackendStatusToFrontend(city.status),
  mesorregion: mapBackendMesorregionToFrontend(city.mesorregion)
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
 * Mapeia os enums do frontend para o formato do backend
 */
export const upsertCity = async (cityData: City): Promise<City | null> => {
  try {
    // Mapear status do frontend para backend
    const statusMap: { [key: string]: string } = {
      'Consolidada': 'CONSOLIDATED',
      'Em expansão': 'EXPANSION',
      'Não atendida': 'NOT_SERVED',
      'Planejamento': 'PLANNING',
    };
    
    // Mapear mesorregion do frontend para backend
    const mesoMap: { [key: string]: string } = {
      'NORTE_MATOGROSSENSE': 'NORTE',
      'NORDESTE_MATOGROSSENSE': 'NORDESTE',
      'CENTRO_SUL_MATOGROSSENSE': 'CENTRO_SUL',
      'SUDESTE_MATOGROSSENSE': 'SUDESTE',
      'SUDOESTE_MATOGROSSENSE': 'SUDOESTE',
    };
    
    // Sanitize implementationStartDate: backend expects a valid date or null/absent
    const safeCity: any = { ...cityData };
    if (safeCity.implementationStartDate) {
      const d = new Date(safeCity.implementationStartDate);
      if (isNaN(d.getTime())) {
        delete safeCity.implementationStartDate;
      } else {
        // Send ISO-8601 date string (backend validation expects valid date)
        safeCity.implementationStartDate = d.toISOString();
      }
    } else {
      delete safeCity.implementationStartDate;
    }

    const backendData = {
      ...safeCity,
      status: statusMap[cityData.status] || 'NOT_SERVED',
      mesorregion: mesoMap[cityData.mesorregion] || cityData.mesorregion,
    };
    
    const response = await api.post('/cities', backendData);
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

/**
 * Atualiza o status de uma cidade no backend
 * IMPORTANTE: Lança erro se falhar - não retorna null silenciosamente
 */
export const updateCityStatus = async (cityId: number, status: CityStatus): Promise<City> => {
  const statusMap: { [key in CityStatus]: string } = {
    [CityStatus.Planning]: 'PLANNING',
    [CityStatus.Expansion]: 'EXPANSION',
    [CityStatus.Consolidated]: 'CONSOLIDATED',
    [CityStatus.NotServed]: 'NOT_SERVED',
  };

  const response = await api.patch(`/cities/${cityId}/status`, { 
    status: statusMap[status] 
  });
  
  const cityData = response.data.data || response.data;
  
  if (!cityData) {
    throw new Error(`Backend não retornou dados para cidade ${cityId}`);
  }
  
  console.log(`✅ Status persistido no PostgreSQL para ${cityId}: ${status}`);
  return mapBackendCityToFrontend(cityData);
};

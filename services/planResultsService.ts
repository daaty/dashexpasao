import api from './api';
import { MonthResult } from '../types';

/**
 * Salvar resultados de planejamento no backend
 */
export const savePlanResults = async (cityId: number, results: { [key: string]: MonthResult }): Promise<boolean> => {
  try {
    const response = await api.post(`/plannings/results/${cityId}`, { results });
    console.log('✅ Resultados salvos no backend:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar resultados no backend:', error);
    return false;
  }
};

/**
 * Buscar resultados de planejamento do backend
 */
export const getPlanResults = async (cityId: number): Promise<{ [key: string]: MonthResult } | null> => {
  try {
    const response = await api.get(`/plannings/results/${cityId}`);
    const results = response.data.data?.results || null;
    if (results && Object.keys(results).length > 0) {
      console.log(`✅ Resultados recuperados do backend para cidade ${cityId}:`, Object.keys(results).length, 'meses');
    }
    return results;
  } catch (error) {
    console.error('❌ Erro ao buscar resultados do backend:', error);
    return null;
  }
};

/**
 * Salvar data de início do planejamento
 */
export const savePlanStartDate = async (cityId: number, startDate: string): Promise<boolean> => {
  try {
    const response = await api.put(`/plannings/start-date/${cityId}`, { startDate });
    console.log('✅ Data de início salva no backend:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar data de início no backend:', error);
    return false;
  }
};

/**
 * Sincronizar todos os planos com o backend
 */
export const syncAllPlans = async (plans: any[]): Promise<boolean> => {
  try {
    const response = await api.post('/plannings/sync', { plans });
    console.log('✅ Planos sincronizados com o backend:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar planos:', error);
    return false;
  }
};

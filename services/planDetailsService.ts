import api from './api';
import { PlanningPhase } from '../types';

/**
 * Salvar detalhes completos do planejamento (fases + ações)
 */
export const savePlanDetails = async (cityId: number, phases: PlanningPhase[], startDate?: string): Promise<boolean> => {
  try {
    const response = await api.post(`/plan-details/${cityId}`, { phases, startDate });
    console.log(`✅ Detalhes de planejamento salvos para cidade ${cityId}:`, phases.length, 'fases');
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar detalhes de planejamento:', error);
    return false;
  }
};

/**
 * Buscar detalhes completos do planejamento
 */
export const getPlanDetails = async (cityId: number): Promise<{ phases: PlanningPhase[], startDate?: string } | null> => {
  try {
    const response = await api.get(`/plan-details/${cityId}`);
    const data = response.data.data;
    
    if (data) {
      console.log(`✅ Detalhes de planejamento recuperados para cidade ${cityId}`);
      return {
        phases: data.phases,
        startDate: data.startDate
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes de planejamento:', error);
    return null;
  }
};

/**
 * Deletar detalhes de planejamento
 */
export const deletePlanDetails = async (cityId: number): Promise<boolean> => {
  try {
    await api.delete(`/plan-details/${cityId}`);
    console.log(`✅ Detalhes de planejamento deletados para cidade ${cityId}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar detalhes de planejamento:', error);
    return false;
  }
};

import api from './api';
import { CityPlan } from '../types';

export interface PlanningDTO {
  id?: string;
  cityId: number;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  status?: string;
  priority?: string;
  tags?: string[];
  estimatedBudget?: number;
  actualBudget?: number;
  progressPercentage?: number;
  tasks?: Array<{
    title: string;
    description?: string;
    completed?: boolean;
    dueDate?: string;
  }>;
}

/**
 * Buscar todos os planejamentos
 */
export const getAllPlannings = async (filters?: {
  cityId?: number;
  status?: string;
}): Promise<CityPlan[]> => {
  try {
    const response = await api.get('/plannings', { params: filters });
    const data = response.data.data || response.data || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erro ao buscar planejamentos:', error);
    return [];
  }
};

/**
 * Buscar planejamento por ID
 */
export const getPlanningById = async (id: string): Promise<CityPlan | null> => {
  try {
    const response = await api.get(`/plannings/${id}`);
    return response.data.data || response.data || null;
  } catch (error) {
    console.error('Erro ao buscar planejamento:', error);
    return null;
  }
};

/**
 * Criar novo planejamento
 */
export const createPlanning = async (planningData: PlanningDTO): Promise<CityPlan | null> => {
  try {
    const response = await api.post('/plannings', planningData);
    return response.data.data || response.data || null;
  } catch (error) {
    console.error('Erro ao criar planejamento:', error);
    return null;
  }
};

/**
 * Atualizar planejamento
 */
export const updatePlanning = async (
  id: string,
  planningData: Partial<PlanningDTO>
): Promise<CityPlan | null> => {
  try {
    const response = await api.put(`/plannings/${id}`, planningData);
    return response.data.data || response.data || null;
  } catch (error) {
    console.error('Erro ao atualizar planejamento:', error);
    return null;
  }
};

/**
 * Deletar planejamento
 */
export const deletePlanning = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/plannings/${id}`);
    return true;
  } catch (error) {
    console.error('Erro ao deletar planejamento:', error);
    return false;
  }
};

/**
 * Adicionar tarefa ao planejamento
 */
export const addTask = async (planningId: string, taskData: {
  title: string;
  description?: string;
  completed?: boolean;
  dueDate?: string;
}): Promise<any> => {
  try {
    const response = await api.post(`/plannings/${planningId}/tasks`, taskData);
    return response.data.data || response.data || null;
  } catch (error) {
    console.error('Erro ao adicionar tarefa:', error);
    return null;
  }
};

/**
 * Atualizar tarefa
 */
export const updateTask = async (taskId: string, taskData: {
  title?: string;
  description?: string;
  completed?: boolean;
  dueDate?: string;
}): Promise<any> => {
  try {
    const response = await api.put(`/plannings/tasks/${taskId}`, taskData);
    return response.data.data || response.data || null;
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    return null;
  }
};

/**
 * Deletar tarefa
 */
export const deleteTask = async (taskId: string): Promise<boolean> => {
  try {
    await api.delete(`/plannings/tasks/${taskId}`);
    return true;
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    return false;
  }
};

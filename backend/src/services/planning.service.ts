import prisma from '../config/database';
import logger from '../config/logger';
import { CityStatus } from '@prisma/client';

/**
 * Cria um novo planejamento
 */
export const createPlanning = async (planningData: any) => {
  // Remove tags field if it's an array (since schema expects String?) or handle logic better
  // Actually, let's simplify the transaction call and ensure typings are bypassed if needed
  
  // Clean planningData to remove non-Prisma fields if any
  const { tasks, ...restData } = planningData;

  // Garantindo que tags seja string se vier como array
  if (Array.isArray(restData.tags)) {
      restData.tags = JSON.stringify(restData.tags);
  }

  // Executa em transação para garantir que o status da cidade seja atualizado
  const planning = await prisma.$transaction(async (tx) => {
    // @ts-ignore - Bypass potential type inference issues with delegated clients
    const newPlanning = await tx.planning.create({
      data: {
        ...restData,
        tasks: {
          create: tasks || [],
        },
      },
      include: {
        tasks: true,
        city: true,
      },
    });

    // Atualiza o status da cidade para PLANNING caso não esteja
    const currentStatus = newPlanning.city.status;
    if (currentStatus !== 'PLANNING' && currentStatus !== 'CONSOLIDATED' && currentStatus !== 'EXPANSION') {
      // @ts-ignore
      await tx.city.update({
        where: { id: newPlanning.cityId },
        data: { status: 'PLANNING' },
      });
      logger.info(`Status da cidade ${newPlanning.city.name} atualizado para PLANNING`);
    }

    return newPlanning;
  });

  logger.info(`Planejamento criado: ${planning.id} para cidade ${planning.city.name}`);
  return planning;
};

/**
 * Busca todos os planejamentos
 */
export const getAllPlannings = async (filters?: {
  cityId?: number;
  status?: string;
}) => {
  const where: any = {};
  if (filters?.cityId) where.cityId = filters.cityId;
  if (filters?.status) where.status = filters.status;

  return await prisma.planning.findMany({
    where,
    include: {
      city: true,
      tasks: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Busca planejamento por ID
 */
export const getPlanningById = async (id: string) => {
  const planning = await prisma.planning.findUnique({
    where: { id },
    include: {
      city: true,
      tasks: true,
    },
  });

  if (!planning) {
    throw new Error('Planejamento não encontrado');
  }

  return planning;
};

/**
 * Atualiza um planejamento
 */
export const updatePlanning = async (id: string, updateData: any) => {
  return await prisma.planning.update({
    where: { id },
    data: updateData,
    include: {
      city: true,
      tasks: true,
    },
  });
};

/**
 * Deleta um planejamento
 */
export const deletePlanning = async (id: string) => {
  return await prisma.planning.delete({
    where: { id },
  });
};

/**
 * Atualiza progresso de um planejamento baseado nas tarefas
 */
export const updatePlanningProgress = async (planningId: string) => {
  const planning = await prisma.planning.findUnique({
    where: { id: planningId },
    include: { tasks: true },
  });

  if (!planning) {
    throw new Error('Planejamento não encontrado');
  }

  const totalTasks = planning.tasks.length;
  const completedTasks = planning.tasks.filter((t) => t.completed).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return await prisma.planning.update({
    where: { id: planningId },
    data: { progressPercentage },
  });
};

/**
 * Adiciona tarefa a um planejamento
 */
export const addTaskToPlanning = async (planningId: string, taskData: any) => {
  const task = await prisma.task.create({
    data: {
      ...taskData,
      planningId,
    },
  });

  await updatePlanningProgress(planningId);
  return task;
};

/**
 * Atualiza tarefa
 */
export const updateTask = async (taskId: string, updateData: any) => {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });

  await updatePlanningProgress(task.planningId);
  return task;
};

/**
 * Deleta tarefa
 */
export const deleteTask = async (taskId: string) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Tarefa não encontrada');

  await prisma.task.delete({ where: { id: taskId } });
  await updatePlanningProgress(task.planningId);
};

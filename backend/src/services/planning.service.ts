import prisma from '../config/database';
import logger from '../config/logger';
import { CityStatus } from '@prisma/client';
import { n8nDatabase } from '../config/n8nDatabase';

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

/**
 * Busca receita de recargas por mês e cidade
 * Retorna distribuição mensal de receita de créditos/recargas
 */
export const getMonthlyRechargeRevenue = async (cityName: string) => {
  try {
    // Criar variações do nome da cidade para buscar
    const cityVariations = [
      cityName.toLowerCase(),
      cityName.toLowerCase().replace(/\s+/g, ' '),
      cityName.toLowerCase().replace(/\s+/g, '_'),
      cityName.toLowerCase().replace(/\s+/g, '-'),
    ];

    const placeholders = cityVariations.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', t."timestamp"), 'YYYY-MM') as month,
        COALESCE(SUM(CASE WHEN t.type = 'CREDIT' AND LOWER(t.description) LIKE '%recarga%' THEN t.amount ELSE 0 END), 0) as revenue,
        COUNT(CASE WHEN t.type = 'CREDIT' AND LOWER(t.description) LIKE '%recarga%' THEN 1 ELSE NULL END) as transaction_count
      FROM dashboard.transactions t
      INNER JOIN dashboard.drivers d ON t."driverId" = d.id
      WHERE LOWER(d.city) IN (${placeholders})
        AND t.type = 'CREDIT'
        AND LOWER(t.description) LIKE '%recarga%'
      GROUP BY DATE_TRUNC('month', t."timestamp")
      ORDER BY month DESC
    `;

    const result = await n8nDatabase.query(query, cityVariations);
    
    // Converter resultado em um objeto { "2025-01": 5000, "2025-02": 5500, ... }
    const revenueByMonth: { [key: string]: number } = {};
    result.rows.forEach((row: any) => {
      revenueByMonth[row.month] = parseFloat(row.revenue) || 0;
    });

    logger.info(`Receita de recargas encontrada para ${cityName}: ${result.rows.length} meses`);
    return revenueByMonth;
  } catch (error: any) {
    logger.error(`Erro ao buscar receita de recargas para ${cityName}:`, error.message);
    return {};
  }
};

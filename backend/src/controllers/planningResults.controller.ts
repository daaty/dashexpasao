import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Salvar ou atualizar resultados de planejamento para uma cidade
 */
export const saveResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const cityId = parseInt(req.params.cityId as string);
    const { results, realMonthlyCosts } = req.body;

    if (!results || typeof results !== 'object') {
      res.status(400).json({ 
        success: false, 
        error: 'Results object is required' 
      });
      return;
    }

    // Upsert: cria se não existe, atualiza se já existe
    const planningResults = await prisma.planningResults.upsert({
      where: { cityId },
      update: {
        results,
        realMonthlyCosts: realMonthlyCosts || null,
        updatedAt: new Date()
      },
      create: {
        cityId,
        results,
        realMonthlyCosts: realMonthlyCosts || null
      }
    });

    res.status(200).json({
      success: true,
      data: planningResults
    });
  } catch (error: any) {
    console.error('Erro ao salvar resultados:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save planning results',
      message: error.message
    });
  }
};

/**
 * Buscar resultados de planejamento de uma cidade
 */
export const getResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const cityId = parseInt(req.params.cityId as string);

    const planningResults = await prisma.planningResults.findUnique({
      where: { cityId }
    });

    if (!planningResults) {
      res.status(200).json({
        success: true,
        data: { results: {} }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: planningResults
    });
  } catch (error: any) {
    console.error('Erro ao buscar resultados:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch planning results',
      message: error.message
    });
  }
};

/**
 * Atualizar data de início do planejamento
 */
export const updateStartDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const cityId = parseInt(req.params.cityId as string);
    const { startDate } = req.body;

    if (!startDate || typeof startDate !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Start date (YYYY-MM format) is required'
      });
      return;
    }

    const planningResults = await prisma.planningResults.upsert({
      where: { cityId },
      update: {
        startDate,
        updatedAt: new Date()
      },
      create: {
        cityId,
        startDate,
        results: {}
      }
    });

    res.status(200).json({
      success: true,
      data: planningResults
    });
  } catch (error: any) {
    console.error('Erro ao atualizar data de início:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update start date',
      message: error.message
    });
  }
};

/**
 * Sincronizar todos os planos (batch update)
 */
export const syncAllPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plans } = req.body;

    if (!Array.isArray(plans)) {
      res.status(400).json({
        success: false,
        error: 'Plans array is required'
      });
      return;
    }

    const syncResults = [];

    for (const plan of plans) {
      if (!plan.cityId || !plan.results) continue;

      try {
        const result = await prisma.planningResults.upsert({
          where: { cityId: plan.cityId },
          update: {
            results: plan.results,
            startDate: plan.startDate || undefined,
            updatedAt: new Date()
          },
          create: {
            cityId: plan.cityId,
            results: plan.results,
            startDate: plan.startDate || undefined
          }
        });

        syncResults.push({
          cityId: plan.cityId,
          success: true
        });
      } catch (error: any) {
        console.error(`Erro ao sincronizar cidade ${plan.cityId}:`, error);
        syncResults.push({
          cityId: plan.cityId,
          success: false,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        total: plans.length,
        synced: syncResults.filter(r => r.success).length,
        failed: syncResults.filter(r => !r.success).length,
        details: syncResults
      }
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar planos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync plans',
      message: error.message
    });
  }
};

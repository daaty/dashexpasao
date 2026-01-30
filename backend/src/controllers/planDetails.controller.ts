import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Salvar ou atualizar detalhes completos do planejamento (fases + ações)
 */
export const savePlanDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const cityId = parseInt(req.params.cityId as string);
    const { phases, startDate } = req.body;

    if (!phases || typeof phases !== 'object') {
      res.status(400).json({ 
        success: false, 
        error: 'Phases object is required' 
      });
      return;
    }

    // Upsert: cria se não existe, atualiza se já existe
    const planDetails = await prisma.planDetails.upsert({
      where: { cityId },
      update: {
        phases,
        startDate,
        updatedAt: new Date()
      },
      create: {
        cityId,
        phases,
        startDate
      }
    });

    console.log(`✅ Detalhes de planejamento salvos para cidade ${cityId}`);

    res.status(200).json({
      success: true,
      data: planDetails
    });
  } catch (error: any) {
    console.error('Erro ao salvar detalhes de planejamento:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save plan details',
      message: error.message
    });
  }
};

/**
 * Buscar detalhes completos do planejamento
 */
export const getPlanDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const cityId = parseInt(req.params.cityId as string);

    const planDetails = await prisma.planDetails.findUnique({
      where: { cityId }
    });

    if (!planDetails) {
      res.status(200).json({
        success: true,
        data: null
      });
      return;
    }

    console.log(`✅ Detalhes de planejamento recuperados para cidade ${cityId}`);

    res.status(200).json({
      success: true,
      data: planDetails
    });
  } catch (error: any) {
    console.error('Erro ao buscar detalhes de planejamento:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plan details',
      message: error.message
    });
  }
};

/**
 * Deletar detalhes de planejamento
 */
export const deletePlanDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const cityId = parseInt(req.params.cityId as string);

    await prisma.planDetails.delete({
      where: { cityId }
    });

    console.log(`✅ Detalhes de planejamento deletados para cidade ${cityId}`);

    res.status(200).json({
      success: true,
      message: 'Plan details deleted successfully'
    });
  } catch (error: any) {
    console.error('Erro ao deletar detalhes de planejamento:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete plan details',
      message: error.message
    });
  }
};

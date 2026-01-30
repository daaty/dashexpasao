import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Salvar ou atualizar blocos de mercado
 */
export const saveMarketBlocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { blocks } = req.body;

    if (!blocks || !Array.isArray(blocks)) {
      res.status(400).json({ 
        success: false, 
        error: 'Blocks array is required' 
      });
      return;
    }

    // Deletar blocos antigos e criar os novos
    await prisma.marketBlock.deleteMany({});
    
    const savedBlocks = await prisma.marketBlock.createMany({
      data: blocks.map((block: any) => ({
        id: block.id,
        name: block.name,
        cityIds: block.cityIds
      }))
    });

    console.log(`✅ ${savedBlocks.count} blocos de mercado salvos no banco de dados`);

    res.status(200).json({
      success: true,
      data: { count: savedBlocks.count }
    });
  } catch (error: any) {
    console.error('Erro ao salvar blocos de mercado:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save market blocks',
      message: error.message
    });
  }
};

/**
 * Buscar blocos de mercado
 */
export const getMarketBlocks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const blocks = await prisma.marketBlock.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`✅ ${blocks.length} blocos de mercado recuperados do banco de dados`);

    res.status(200).json({
      success: true,
      data: blocks
    });
  } catch (error: any) {
    console.error('Erro ao buscar blocos de mercado:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market blocks',
      message: error.message
    });
  }
};

/**
 * Deletar todos os blocos de mercado
 */
export const deleteAllMarketBlocks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await prisma.marketBlock.deleteMany({});

    console.log(`✅ ${result.count} blocos de mercado deletados`);

    res.status(200).json({
      success: true,
      data: { count: result.count }
    });
  } catch (error: any) {
    console.error('Erro ao deletar blocos de mercado:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete market blocks',
      message: error.message
    });
  }
};

import { Router } from 'express';
import * as marketBlocksController from '../controllers/marketBlocks.controller';

const router = Router();

// Salvar blocos de mercado
router.post('/', marketBlocksController.saveMarketBlocks);

// Buscar blocos de mercado
router.get('/', marketBlocksController.getMarketBlocks);

// Deletar todos os blocos de mercado
router.delete('/', marketBlocksController.deleteAllMarketBlocks);

export default router;

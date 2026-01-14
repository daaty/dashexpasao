import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { validateRequest } from '../middleware/validation';
import { aiPromptSchema } from '../utils/validators';

const router = Router();

/**
 * @route   POST /api/ai/chat
 * @desc    Gerar resposta de IA baseada em prompt
 * @access  Public
 */
router.post('/chat', validateRequest(aiPromptSchema, 'body'), aiController.generateResponse);

/**
 * @route   GET /api/ai/analysis/:id
 * @desc    Gerar análise de viabilidade para cidade
 * @access  Public
 */
router.get('/analysis/:id', aiController.generateCityAnalysis);

export default router;

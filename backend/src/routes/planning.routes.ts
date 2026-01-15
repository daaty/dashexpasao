import { Router } from 'express';
import * as planningController from '../controllers/planning.controller';
import * as planningResultsController from '../controllers/planningResults.controller';
import { validateRequest } from '../middleware/validation';
import { planningBodySchema, taskBodySchema } from '../utils/validators';

const router = Router();

/**
 * @route   GET /api/plannings
 * @desc    Buscar todos os planejamentos com filtros
 * @access  Public
 */
router.get('/', planningController.getAllPlannings);

/**
 * @route   GET /api/plannings/:id
 * @desc    Buscar planejamento por ID
 * @access  Public
 */
router.get('/:id', planningController.getPlanningById);

/**
 * @route   POST /api/plannings
 * @desc    Criar novo planejamento
 * @access  Private
 */
router.post('/', validateRequest(planningBodySchema, 'body'), planningController.createPlanning);

/**
 * @route   PUT /api/plannings/:id
 * @desc    Atualizar planejamento
 * @access  Private
 */
router.put('/:id', planningController.updatePlanning);

/**
 * @route   DELETE /api/plannings/:id
 * @desc    Deletar planejamento
 * @access  Private
 */
router.delete('/:id', planningController.deletePlanning);

/**
 * @route   POST /api/plannings/:id/tasks
 * @desc    Adicionar tarefa ao planejamento
 * @access  Private
 */
router.post('/:id/tasks', validateRequest(taskBodySchema, 'body'), planningController.addTask);

/**
 * @route   PUT /api/plannings/tasks/:taskId
 * @desc    Atualizar tarefa
 * @access  Private
 */
router.put('/tasks/:taskId', planningController.updateTask);

/**
 * @route   DELETE /api/plannings/tasks/:taskId
 * @desc    Deletar tarefa
 * @access  Private
 */
router.delete('/tasks/:taskId', planningController.deleteTask);

/**
 * @route   POST /api/plannings/results/:cityId
 * @desc    Salvar resultados financeiros de planejamento
 * @access  Private
 */
router.post('/results/:cityId', planningResultsController.saveResults);

/**
 * @route   GET /api/plannings/results/:cityId
 * @desc    Buscar resultados financeiros de planejamento
 * @access  Public
 */
router.get('/results/:cityId', planningResultsController.getResults);

/**
 * @route   PUT /api/plannings/start-date/:cityId
 * @desc    Atualizar data de início do planejamento
 * @access  Private
 */
router.put('/start-date/:cityId', planningResultsController.updateStartDate);

/**
 * @route   POST /api/plannings/sync
 * @desc    Sincronizar todos os planos em lote
 * @access  Private
 */
router.post('/sync', planningResultsController.syncAllPlans);

export default router;

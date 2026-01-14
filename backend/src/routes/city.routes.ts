import { Router } from 'express';
import * as cityController from '../controllers/city.controller';
import { validateRequest } from '../middleware/validation';
import { cityQuerySchema, cityBodySchema } from '../utils/validators';

const router = Router();

/**
 * @route   GET /api/cities
 * @desc    Buscar todas as cidades com filtros e paginação
 * @access  Public
 */
router.get('/', validateRequest(cityQuerySchema, 'query'), cityController.getAllCities);

/**
 * @route   GET /api/cities/viability
 * @desc    Buscar cidades ordenadas por score de viabilidade
 * @access  Public
 */
router.get('/viability', cityController.getCitiesByViabilityScore);

/**
 * @route   GET /api/cities/:id
 * @desc    Buscar cidade por ID
 * @access  Public
 */
router.get('/:id', cityController.getCityById);

/**
 * @route   POST /api/cities
 * @desc    Criar ou atualizar cidade
 * @access  Private
 */
router.post('/', validateRequest(cityBodySchema, 'body'), cityController.upsertCity);

/**
 * @route   PUT /api/cities/:id/update-ibge
 * @desc    Atualizar dados da cidade do IBGE
 * @access  Private
 */
router.put('/:id/update-ibge', cityController.updateCityFromIBGE);

export default router;

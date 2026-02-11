import { Router } from 'express';
import { ridesController } from '../controllers/rides.controller';

const router = Router();

/**
 * @route   GET /api/rides/status
 * @desc    Verifica se o serviço de corridas está disponível
 * @access  Public
 */
router.get('/status', ridesController.checkStatus.bind(ridesController));

/**
 * @route   GET /api/rides/cities
 * @desc    Lista cidades com dados de corridas
 * @access  Public
 */
router.get('/cities', ridesController.getCitiesWithRides.bind(ridesController));

/**
 * @route   GET /api/rides/summary
 * @desc    Resumo geral de todas as corridas
 * @access  Public
 * @query   startDate - Data inicial (ISO string)
 * @query   endDate - Data final (ISO string)
 */
router.get('/summary', ridesController.getSummary.bind(ridesController));

/**
 * @route   GET /api/rides/monthly-revenue-total
 * @desc    Receita total mensal de recargas (sem filtro de cidade)
 * @access  Public
 * @query   months - Número de meses (default: 6)
 */
router.get('/monthly-revenue-total', ridesController.getTotalMonthlyRevenue.bind(ridesController));

/**
 * @route   GET /api/rides/city/:cityName/stats
 * @desc    Estatísticas de corridas de uma cidade
 * @access  Public
 * @param   cityName - Nome da cidade (URL encoded)
 * @query   startDate - Data inicial (ISO string)
 * @query   endDate - Data final (ISO string)
 */
router.get('/city/:cityName/stats', ridesController.getCityStats.bind(ridesController));

/**
 * @route   GET /api/rides/city/:cityName/monthly
 * @desc    Dados mensais de corridas de uma cidade
 * @access  Public
 * @param   cityName - Nome da cidade (URL encoded)
 * @query   months - Número de meses (default: 12)
 * @query   startDate - Data inicial (ISO string)
 */
router.get('/city/:cityName/monthly', ridesController.getCityMonthly.bind(ridesController));

/**
 * @route   GET /api/rides/city/:cityName/daily
 * @desc    Dados diários de corridas de uma cidade
 * @access  Public
 * @param   cityName - Nome da cidade (URL encoded)
 * @query   days - Número de dias (default: 30)
 */
router.get('/city/:cityName/daily', ridesController.getCityDaily.bind(ridesController));

/**
 * @route   GET /api/rides/city/:cityId/stats-by-id
 * @desc    Estatísticas usando ID da cidade (banco principal)
 * @access  Public
 * @param   cityId - ID da cidade
 */
router.get('/city/:cityId/stats-by-id', ridesController.getCityStatsByIdHandler.bind(ridesController));

export default router;

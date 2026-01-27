import express from 'express';
import * as passengerController from '../controllers/passengers.controller';

const router = express.Router();

/**
 * @route   GET /api/passengers
 * @desc    Busca todos os passageiros
 * @access  Public
 */
router.get('/', passengerController.getAllPassengers);

/**
 * @route   GET /api/passengers/stats
 * @desc    Busca estatísticas agregadas de passageiros
 * @access  Public
 */
router.get('/stats', passengerController.getPassengerStats);

/**
 * @route   GET /api/passengers/top/:limit
 * @desc    Busca top N cidades por passageiros
 * @access  Public
 */
router.get('/top/:limit', passengerController.getTopCitiesByPassengers);

/**
 * @route   GET /api/passengers/:cityName
 * @desc    Busca passageiros de uma cidade específica
 * @access  Public
 */
router.get('/:cityName', passengerController.getPassengersByCity);

/**
 * @route   POST /api/passengers
 * @desc    Cria ou atualiza registro de passageiros
 * @access  Public
 */
router.post('/', passengerController.upsertPassenger);

/**
 * @route   POST /api/passengers/batch
 * @desc    Busca passageiros de múltiplas cidades
 * @access  Public
 */
router.post('/batch', passengerController.getPassengersByMultipleCities);

/**
 * @route   DELETE /api/passengers/:cityName
 * @desc    Deleta registro de passageiros de uma cidade
 * @access  Public
 */
router.delete('/:cityName', passengerController.deletePassenger);

export default router;

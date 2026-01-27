import { Request, Response, NextFunction } from 'express';
import * as passengerService from '../services/passengers.service';
import { ApiResponse } from '../types';

/**
 * GET /api/passengers
 * Busca todos os passageiros
 */
export const getAllPassengers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const passengers = await passengerService.getAllPassengers();
    
    const response: ApiResponse<any> = {
      success: true,
      data: passengers,
      message: `${passengers.length} registros de passageiros encontrados`
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/passengers/:cityName
 * Busca passageiros de uma cidade específica
 */
export const getPassengersByCity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cityName } = req.params;
    const passenger = await passengerService.getPassengersByCity(cityName);
    
    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: `Nenhum dado de passageiro encontrado para: ${cityName}`
      });
    }
    
    const response: ApiResponse<any> = {
      success: true,
      data: passenger
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/passengers/batch
 * Busca passageiros de múltiplas cidades
 */
export const getPassengersByMultipleCities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cityNames } = req.body;
    
    if (!Array.isArray(cityNames) || cityNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'cityNames deve ser um array não vazio'
      });
    }
    
    const passengers = await passengerService.getPassengersByMultipleCities(cityNames);
    
    const response: ApiResponse<any> = {
      success: true,
      data: passengers,
      message: `Dados de ${passengers.length} cidades encontrados`
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/passengers/stats
 * Busca estatísticas agregadas
 */
export const getPassengerStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await passengerService.getPassengerStats();
    
    const response: ApiResponse<any> = {
      success: true,
      data: stats
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/passengers/top/:limit
 * Busca top N cidades por passageiros
 */
export const getTopCitiesByPassengers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = req.params;
    const limitNum = Math.min(parseInt(limit || '10'), 100);
    
    const topCities = await passengerService.getTopCitiesByPassengers(limitNum);
    
    const response: ApiResponse<any> = {
      success: true,
      data: topCities,
      message: `Top ${limitNum} cidades por passageiros`
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/passengers
 * Cria ou atualiza registro de passageiros
 */
export const upsertPassenger = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      cityName,
      totalPassengers,
      dailyAverage,
      peakHourPassengers,
      offPeakPassengers,
      retentionRate,
      repurchaseRate,
      churnRate
    } = req.body;
    
    // Validação básica
    if (!cityName || totalPassengers === undefined) {
      return res.status(400).json({
        success: false,
        message: 'cityName e totalPassengers são obrigatórios'
      });
    }
    
    const passenger = await passengerService.upsertPassenger({
      cityName,
      totalPassengers: parseInt(totalPassengers),
      dailyAverage: parseFloat(dailyAverage || 0),
      peakHourPassengers: parseInt(peakHourPassengers || 0),
      offPeakPassengers: parseInt(offPeakPassengers || 0),
      retentionRate: parseFloat(retentionRate || 0),
      repurchaseRate: parseFloat(repurchaseRate || 0),
      churnRate: parseFloat(churnRate || 0)
    });
    
    const response: ApiResponse<any> = {
      success: true,
      data: passenger,
      message: `Passageiro de ${cityName} salvo com sucesso`
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/passengers/:cityName
 * Deleta registro de passageiros de uma cidade
 */
export const deletePassenger = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cityName } = req.params;
    
    await passengerService.deletePassenger(cityName);
    
    const response: ApiResponse<any> = {
      success: true,
      message: `Passageiro de ${cityName} deletado com sucesso`
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

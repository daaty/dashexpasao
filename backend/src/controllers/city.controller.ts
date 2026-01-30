import { Request, Response, NextFunction } from 'express';
import * as cityService from '../services/city.service';
import { ApiResponse } from '../types';

export const getAllCities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status, mesorregion, minPopulation } = req.query;

    const result = await cityService.getAllCities({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as any,
      mesorregion: mesorregion as any,
      minPopulation: minPopulation ? parseInt(minPopulation as string) : undefined,
    });

    const response: ApiResponse<any> = {
      success: true,
      data: result.cities,
      pagination: result.pagination,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getCityById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const city = await cityService.getCityById(parseInt(id));

    const response: ApiResponse<any> = {
      success: true,
      data: city,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const updateCityFromIBGE = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const city = await cityService.updateCityFromIBGE(parseInt(id));

    const response: ApiResponse<any> = {
      success: true,
      data: city,
      message: 'Dados atualizados com sucesso do IBGE',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getCitiesByViabilityScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = req.query;
    const cities = await cityService.getCitiesByViabilityScore(
      limit ? parseInt(limit as string) : undefined
    );

    const response: ApiResponse<any> = {
      success: true,
      data: cities,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const upsertCity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = await cityService.upsertCity(req.body);

    const response: ApiResponse<any> = {
      success: true,
      data: city,
      message: 'Cidade salva com sucesso',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateCityStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ 
        success: false, 
        error: 'Status is required' 
      });
      return;
    }

    const idNum = typeof id === 'string' ? parseInt(id) : parseInt(Array.isArray(id) ? id[0] : id);
    const city = await cityService.updateCityStatus(idNum, status);

    const response: ApiResponse<any> = {
      success: true,
      data: city,
      message: `Status atualizado para ${status}`,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

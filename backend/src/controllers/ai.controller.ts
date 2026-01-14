import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/ai.service';
import { ApiResponse } from '../types';

export const generateResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt é obrigatório e deve ser uma string',
      });
    }

    const response = await aiService.generateAiResponse(prompt);

    const apiResponse: ApiResponse<any> = {
      success: true,
      data: { response },
    };

    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

export const generateCityAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const analysis = await aiService.generateCityViabilityAnalysis(parseInt(id));

    const response: ApiResponse<any> = {
      success: true,
      data: { analysis },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

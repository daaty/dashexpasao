import { Request, Response } from 'express';
import { ridesService } from '../services/rides.service';
import logger from '../config/logger';

/**
 * Controller para endpoints de dados de corridas
 */
export class RidesController {
  /**
   * GET /api/rides/status
   * Verifica se o serviço de corridas está disponível
   */
  async checkStatus(_req: Request, res: Response): Promise<void> {
    try {
      const available = await ridesService.isAvailable();
      
      res.json({
        available,
        message: available 
          ? 'Serviço de corridas disponível' 
          : 'Serviço de corridas indisponível - usando dados mockados'
      });
    } catch (error) {
      logger.error('Erro ao verificar status do serviço de corridas:', error);
      res.status(500).json({
        available: false,
        error: 'Erro ao verificar status'
      });
    }
  }

  /**
   * GET /api/rides/cities
   * Lista cidades com dados de corridas disponíveis
   */
  async getCitiesWithRides(_req: Request, res: Response): Promise<void> {
    try {
      const cities = await ridesService.getCitiesWithRides();
      
      res.json({
        cities,
        count: cities.length
      });
    } catch (error) {
      logger.error('Erro ao buscar cidades com corridas:', error);
      res.status(500).json({
        error: 'Erro ao buscar cidades',
        cities: []
      });
    }
  }

  /**
   * GET /api/rides/city/:cityName/stats
   * Busca estatísticas de corridas de uma cidade
   */
  async getCityStats(req: Request, res: Response): Promise<void> {
    try {
      const cityName = req.params.cityName as string;
      const { startDate, endDate } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const stats = await ridesService.getRideStatsByCity(
        decodeURIComponent(cityName),
        filters
      );

      if (!stats) {
        res.status(404).json({
          error: 'Nenhum dado de corrida encontrado para esta cidade',
          cityName
        });
        return;
      }

      res.json(stats);
      return;
    } catch (error) {
      logger.error('Erro ao buscar estatísticas da cidade:', error);
      res.status(500).json({
        error: 'Erro ao buscar estatísticas'
      });
    }
  }

  /**
   * GET /api/rides/city/:cityName/monthly
   * Busca dados mensais de corridas de uma cidade
   */
  async getCityMonthly(req: Request, res: Response): Promise<void> {
    try {
      const cityName = req.params.cityName as string;
      const months = parseInt(req.query.months as string) || 6;
      const page = parseInt(req.query.page as string) || 1;
      const { startDate } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);

      const monthlyData = await ridesService.getMonthlyRidesByCity(
        decodeURIComponent(cityName),
        months,
        filters,
        page
      );

      res.json({
        cityName,
        data: monthlyData,
        count: monthlyData.length,
        page,
        perPage: months
      });
    } catch (error) {
      logger.error('Erro ao buscar dados mensais:', error);
      res.status(500).json({
        error: 'Erro ao buscar dados mensais',
        data: []
      });
    }
  }

  /**
   * GET /api/rides/city/:cityName/daily
   * Busca dados diários de corridas de uma cidade
   */
  async getCityDaily(req: Request, res: Response): Promise<void> {
    try {
      const cityName = req.params.cityName as string;
      const days = parseInt(req.query.days as string) || 30;

      const dailyData = await ridesService.getDailyRidesByCity(
        decodeURIComponent(cityName),
        days
      );

      res.json({
        cityName,
        data: dailyData,
        count: dailyData.length
      });
    } catch (error) {
      logger.error('Erro ao buscar dados diários:', error);
      res.status(500).json({
        error: 'Erro ao buscar dados diários',
        data: []
      });
    }
  }

  /**
   * GET /api/rides/summary
   * Busca resumo geral de todas as corridas
   */
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const summary = await ridesService.getRidesSummary(filters);

      if (!summary) {
        res.status(404).json({
          error: 'Nenhum dado de corrida disponível'
        });
        return;
      }

      res.json(summary);
      return;
    } catch (error) {
      logger.error('Erro ao buscar resumo de corridas:', error);
      res.status(500).json({
        error: 'Erro ao buscar resumo'
      });
    }
  }

  /**
   * GET /api/rides/city/:cityId/stats-by-id
   * Busca estatísticas usando ID da cidade do banco principal
   */
  async getCityStatsByIdHandler(_req: Request, res: Response): Promise<void> {
    try {
      // Aqui você precisaria buscar o nome da cidade pelo ID
      // no banco principal e então buscar os dados de corridas
      
      // Por enquanto, retorna erro informativo
      res.status(501).json({
        error: 'Endpoint não implementado ainda',
        message: 'Use /api/rides/city/:cityName/stats passando o nome da cidade'
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas por ID:', error);
      res.status(500).json({
        error: 'Erro ao buscar estatísticas'
      });
    }
  }

  /**
   * GET /api/rides/monthly-revenue-total
   * Busca receita total mensal de recargas (sem filtro de cidade)
   */
  async getTotalMonthlyRevenue(req: Request, res: Response): Promise<void> {
    try {
      const months = parseInt(req.query.months as string) || 6;

      const data = await ridesService.getTotalMonthlyRevenue(months);

      res.json({
        data,
        count: data.length
      });
    } catch (error) {
      logger.error('Erro ao buscar receita total mensal:', error);
      res.status(500).json({
        error: 'Erro ao buscar receita total mensal',
        data: []
      });
    }
  }
}

export const ridesController = new RidesController();

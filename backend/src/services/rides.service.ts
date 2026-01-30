import { n8nDatabase } from '../config/n8nDatabase';
import {
  RideStats,
  MonthlyRideData,
  RidesSummary,
  DailyRideData,
  RideFilters,
} from '../types/rides';
import logger from '../config/logger';

/**
 * Serviço para gerenciar dados de corridas do banco N8N
 */
class RidesService {
  /**
   * Normaliza nome de cidade para match
   * Remove acentos, caracteres especiais e padroniza
   */
  private normalizeCityName(cityName: string): string {
    return cityName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * Mapa de nomes alternativos de cidades
   */
  private cityNameMapping: Record<string, string[]> = {
    'cuiaba': ['cuiabá', 'cuiaba', 'capital'],
    'varzea grande': ['várzea grande', 'varzea grande', 'vg'],
    'rondonopolis': ['rondonópolis', 'rondonopolis'],
    'sinop': ['sinop'],
    'tangara da serra': ['tangará da serra', 'tangara da serra', 'tangara'],
    'caceres': ['cáceres', 'caceres'],
    'paranaita': ['paranaíta', 'paranaita'],
    'apiacas': ['apiacás', 'apiacas'],
    'nova monte verde': ['nova monte verde'],
    'nova bandeirantes': ['nova bandeirantes'],
    'colider': ['colíder', 'colider'],
    // Adicionar mais mapeamentos conforme necessário
  };

  /**
   * Busca nome de cidade considerando variações
   * Sempre retorna versões com e sem acento
   */
  private matchCityName(cityName: string): string[] {
    const normalized = this.normalizeCityName(cityName);
    
    // Busca no mapeamento
    for (const [, variations] of Object.entries(this.cityNameMapping)) {
      if (variations.some(v => this.normalizeCityName(v) === normalized)) {
        return variations;
      }
    }
    
    // Se não encontrar no mapeamento, retorna o original + versão sem acento
    const withoutAccent = this.normalizeCityName(cityName);
    if (withoutAccent !== cityName.toLowerCase()) {
      return [cityName, withoutAccent];
    }
    
    return [cityName];
  }

  /**
   * Verifica se o serviço está disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      const available = await n8nDatabase.isAvailable();
      if (!available) return false;
      
      return await n8nDatabase.ridesTableExists();
    } catch (error) {
      logger.error('Erro ao verificar disponibilidade do serviço de corridas:', error);
      return false;
    }
  }

  /**
   * Busca estatísticas de corridas por cidade
   */
  async getRideStatsByCity(cityName: string, filters?: RideFilters): Promise<RideStats | null> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        logger.warn('Serviço de corridas não disponível');
        return null;
      }

      const cityVariations = this.matchCityName(cityName);
      const placeholders = cityVariations.map((_, i) => `$${i + 1}`).join(', ');
      
      let whereClause = `WHERE LOWER(city) IN (${placeholders})`;
      const params: any[] = [...cityVariations.map(c => c.toLowerCase())];
      let paramIndex = cityVariations.length + 1;

      // Adicionar filtros opcionais
      if (filters?.startDate) {
        whereClause += ` AND "arrivedTimestamp" >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }
      if (filters?.endDate) {
        whereClause += ` AND "arrivedTimestamp" <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      const query = `
        SELECT 
          COUNT(DISTINCT r.id) as total_rides,
          MIN(r."arrivedTimestamp") as first_ride,
          MAX(r."arrivedTimestamp") as last_ride,
          COUNT(DISTINCT DATE_TRUNC('month', r."arrivedTimestamp")) as active_months,
          COUNT(DISTINCT DATE(r."arrivedTimestamp")) as active_days,
          CASE WHEN COUNT(r.price) > 0 THEN AVG(r.price) ELSE 0 END as average_value
        FROM dashboard.rides r
        ${whereClause.replace('LOWER(city)', 'LOWER(r.city)')}
          AND r."arrivedTimestamp" IS NOT NULL
          AND r.status = 'Concluída'
      `;

      const result = await n8nDatabase.query(query, params);
      
      if (!result.rows[0] || result.rows[0].total_rides === '0') {
        return null;
      }

      const row = result.rows[0];
      const totalRides = parseInt(row.total_rides);
      const activeDays = parseInt(row.active_days) || 1;
      const activeMonths = parseInt(row.active_months) || 1;

      // Buscar receita de transactions CREDIT com recargas
      const cityPlaceholders = cityVariations.map((_, i) => `$${i + 1}`).join(', ');
      
      const revenueQuery = `
        SELECT COALESCE(SUM(t.quantity), 0) as total_revenue
        FROM dashboard.transactions t
        WHERE t.type = 'CREDIT'
          AND LOWER(t.description) LIKE '%recarga%'
          AND LOWER(t.city) IN (${cityPlaceholders})
      `;
      
      const revenueResult = await n8nDatabase.query(revenueQuery, cityVariations.map(c => c.toLowerCase()));
      const totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue) || 0;

      return {
        cityName,
        totalRides,
        totalRevenue,
        averageValue: parseFloat(row.average_value) || 0,
        firstRide: row.first_ride ? new Date(row.first_ride) : null,
        lastRide: row.last_ride ? new Date(row.last_ride) : null,
        activeMonths,
        averageRidesPerDay: totalRides / activeDays,
        averageRidesPerMonth: totalRides / activeMonths,
      };
    } catch (error) {
      logger.error(`Erro ao buscar estatísticas de corridas para ${cityName}:`, error);
      return null;
    }
  }

  /**
   * Busca dados mensais de corridas por cidade
   */
  async getMonthlyRidesByCity(
    cityName: string,
    months: number = 6,
    filters?: RideFilters,
    page: number = 1
  ): Promise<MonthlyRideData[]> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return [];
      }

      const cityVariations = this.matchCityName(cityName);
      const placeholders = cityVariations.map((_, i) => `$${i + 1}`).join(', ');
      
      let whereClause = `WHERE LOWER(city) IN (${placeholders})`;
      const params: any[] = [...cityVariations.map(c => c.toLowerCase())];
      let paramIndex = cityVariations.length + 1;

      if (filters?.startDate) {
        whereClause += ` AND "arrivedTimestamp" >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      const query = `
        WITH monthly_rides AS (
          SELECT 
            TO_CHAR(DATE_TRUNC('month', r."arrivedTimestamp"), 'YYYY-MM') as month,
            EXTRACT(YEAR FROM DATE_TRUNC('month', r."arrivedTimestamp")) as year,
            EXTRACT(MONTH FROM DATE_TRUNC('month', r."arrivedTimestamp")) as month_number,
            DATE_TRUNC('month', r."arrivedTimestamp") as month_start,
            COUNT(DISTINCT r.id) as rides,
            COUNT(DISTINCT DATE(r."arrivedTimestamp")) as unique_days,
            CASE WHEN COUNT(r.price) > 0 THEN AVG(r.price) ELSE 0 END as average_value
          FROM dashboard.rides r
          ${whereClause.replace('LOWER(city)', 'LOWER(r.city)')}
            AND r."arrivedTimestamp" IS NOT NULL
            AND r.status = 'Concluída'
          GROUP BY DATE_TRUNC('month', r."arrivedTimestamp")
        ),
        monthly_revenue AS (
          SELECT 
            DATE_TRUNC('month', t.timestamp) as month_start,
            COALESCE(SUM(t.quantity), 0) as revenue
          FROM dashboard.transactions t
          WHERE t.type = 'CREDIT'
            AND LOWER(t.description) LIKE '%recarga%'
            AND LOWER(t.city) IN (${cityVariations.map((_, i) => `$${i + 1}`).join(', ')})
          GROUP BY DATE_TRUNC('month', t.timestamp)
        )
        SELECT 
          COALESCE(mr.month, TO_CHAR(rev.month_start, 'YYYY-MM')) as month,
          COALESCE(mr.year, EXTRACT(YEAR FROM rev.month_start)) as year,
          COALESCE(mr.month_number, EXTRACT(MONTH FROM rev.month_start)) as month_number,
          COALESCE(mr.rides, 0) as rides,
          COALESCE(rev.revenue, 0) as revenue,
          COALESCE(mr.average_value, 0) as average_value,
          COALESCE(mr.unique_days, 0) as unique_days
        FROM monthly_rides mr
        FULL OUTER JOIN monthly_revenue rev ON mr.month_start = rev.month_start
        ORDER BY COALESCE(mr.month, TO_CHAR(rev.month_start, 'YYYY-MM')) DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const offset = (page - 1) * months;
      params.push(months, offset);

      const result = await n8nDatabase.query(query, params);

      return result.rows.map((row: any) => ({
        month: row.month,
        year: parseInt(row.year),
        monthNumber: parseInt(row.month_number),
        rides: parseInt(row.rides),
        revenue: parseFloat(row.revenue) || 0,
        averageValue: parseFloat(row.average_value) || 0,
        uniqueDays: parseInt(row.unique_days) || 0,
      }));
    } catch (error) {
      logger.error(`Erro ao buscar dados mensais para ${cityName}:`, error);
      return [];
    }
  }

  /**
   * Busca dados diários de corridas
   */
  async getDailyRidesByCity(
    cityName: string,
    days: number = 30
  ): Promise<DailyRideData[]> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return [];
      }

      const cityVariations = this.matchCityName(cityName);
      const placeholders = cityVariations.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        SELECT 
          TO_CHAR(DATE(r."arrivedTimestamp"), 'YYYY-MM-DD') as date,
          COUNT(DISTINCT r.id) as rides,
          COALESCE(SUM(r.price), 0) as revenue
        FROM dashboard.rides r
        WHERE LOWER(r.city) IN (${placeholders})
          AND r."arrivedTimestamp" IS NOT NULL
          AND r.status = 'Concluída'
          AND r."arrivedTimestamp" >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(r."arrivedTimestamp")
        ORDER BY date DESC
      `;

      const params = cityVariations.map(c => c.toLowerCase());
      const result = await n8nDatabase.query(query, params);

      return result.rows.map((row: any) => ({
        date: row.date,
        rides: parseInt(row.rides),
        revenue: parseFloat(row.revenue) || 0,
      }));
    } catch (error) {
      logger.error(`Erro ao buscar dados diários para ${cityName}:`, error);
      return [];
    }
  }

  /**
   * Busca resumo geral de todas as corridas
   */
  async getRidesSummary(filters?: RideFilters): Promise<RidesSummary | null> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return null;
      }

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.startDate) {
        whereClause += ` AND "arrivedTimestamp" >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }
      if (filters?.endDate) {
        whereClause += ` AND "arrivedTimestamp" <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      // Estatísticas gerais com receita de recargas
      const summaryQuery = `
        SELECT 
          COUNT(DISTINCT r.id) as total_rides,
          COUNT(DISTINCT r.city) as cities_with_data,
          MIN(r."arrivedTimestamp") as first_ride,
          MAX(r."arrivedTimestamp") as last_ride,
          (
            SELECT COALESCE(SUM(t.quantity), 0)
            FROM dashboard.transactions t
            WHERE t.type = 'CREDIT'
              AND LOWER(t.description) LIKE '%recarga%'
          ) as total_revenue
        FROM dashboard.rides r
        ${whereClause}
          AND r."arrivedTimestamp" IS NOT NULL
          AND r.status = 'Concluída'
      `;

      const summaryResult = await n8nDatabase.query(summaryQuery, params);
      const summary = summaryResult.rows[0];

      // Top cidades com receita de recargas
      const topCitiesQuery = `
        SELECT 
          r.city,
          COUNT(DISTINCT r.id) as rides,
          COALESCE(SUM(t.quantity), 0) as revenue
        FROM dashboard.rides r
        LEFT JOIN dashboard.transactions t ON 
          LOWER(t.city) = LOWER(r.city)
          AND t.type = 'CREDIT'
          AND LOWER(t.description) LIKE '%recarga%'
        ${whereClause.replace('WHERE', 'WHERE r.city IS NOT NULL AND')}
          AND r.status = 'Concluída'
        GROUP BY r.city
        ORDER BY rides DESC
        LIMIT 10
      `;

      const topCitiesResult = await n8nDatabase.query(topCitiesQuery, params);

      return {
        totalRides: parseInt(summary.total_rides),
        totalRevenue: parseFloat(summary.total_revenue) || 0,
        citiesWithData: parseInt(summary.cities_with_data),
        dateRange: {
          start: summary.first_ride ? new Date(summary.first_ride) : null,
          end: summary.last_ride ? new Date(summary.last_ride) : null,
        },
        topCities: topCitiesResult.rows.map((row: any) => ({
          city: row.city,
          rides: parseInt(row.rides),
          revenue: parseFloat(row.revenue) || 0,
        })),
      };
    } catch (error) {
      logger.error('Erro ao buscar resumo de corridas:', error);
      return null;
    }
  }

  /**
   * Busca lista de cidades com dados de corridas
   */
  async getCitiesWithRides(): Promise<string[]> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return [];
      }

      const query = `
        SELECT DISTINCT r.city
        FROM dashboard.rides r
        WHERE r."arrivedTimestamp" IS NOT NULL
          AND r.city IS NOT NULL
          AND r.status = 'Concluída'
        ORDER BY r.city
      `;

      const result = await n8nDatabase.query(query);
      return result.rows.map((row: any) => row.city);
    } catch (error) {
      logger.error('Erro ao buscar cidades com corridas:', error);
      return [];
    }
  }
}

export const ridesService = new RidesService();
export default ridesService;

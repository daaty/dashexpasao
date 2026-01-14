import axios from 'axios';
import { config } from '../config/config';
import logger from '../config/logger';

interface IbgeSeries {
  localidade: {
    id: string;
    nome: string;
  };
  serie: {
    [year: string]: string;
  };
}

interface IbgeResponse {
  id: string;
  variavel: string;
  unidade: string;
  resultados: Array<{
    classificacoes: any[];
    series: IbgeSeries[];
  }>;
}

/**
 * Extrai o valor mais recente de uma série histórica do IBGE
 */
const getLastValue = (data: IbgeResponse[] | null, fallback: number): number => {
  try {
    if (!data || data.length === 0 || !data[0].resultados || data[0].resultados.length === 0) {
      return fallback;
    }

    const series = data[0].resultados[0].series[0].serie;
    const years = Object.keys(series).sort();
    const lastYear = years[years.length - 1];
    const value = series[lastYear];

    if (value === '-' || value === '...' || value === undefined) {
      return fallback;
    }

    return parseFloat(value);
  } catch (e) {
    logger.warn('Erro ao extrair dados do IBGE:', e);
    return fallback;
  }
};

/**
 * Busca dados atualizados de uma cidade específica na API do IBGE
 */
export const fetchCityDataFromIBGE = async (cityId: number) => {
  const baseUrl = config.ibgeApiBaseUrl;

  const fetchData = async (url: string) => {
    try {
      const response = await axios.get<IbgeResponse[]>(url);
      return response.data;
    } catch (error) {
      logger.warn(`Falha na requisição IBGE (${url}):`, error);
      return null;
    }
  };

  const urlPop = `${baseUrl}/agregados/4714/periodos/-1/variaveis/93?localidades=N6[${cityId}]`;
  const urlPib = `${baseUrl}/agregados/5938/periodos/-1/variaveis/37?localidades=N6[${cityId}]`;
  const urlSalario = `${baseUrl}/agregados/1685/periodos/-1/variaveis/2078?localidades=N6[${cityId}]`;
  const urlPessoal = `${baseUrl}/agregados/1685/periodos/-1/variaveis/165?localidades=N6[${cityId}]`;

  const [popData, pibData, salarioData, pessoalData] = await Promise.all([
    fetchData(urlPop),
    fetchData(urlPib),
    fetchData(urlSalario),
    fetchData(urlPessoal),
  ]);

  return {
    population: getLastValue(popData, 0),
    pibPerCapita: getLastValue(pibData, 0),
    averageSalary: getLastValue(salarioData, 0),
    formalJobs: getLastValue(pessoalData, 0),
  };
};

/**
 * Busca lista de municípios de uma mesorregião
 */
export const fetchCitiesByMesorregion = async (mesorregionId: number) => {
  try {
    const url = `${config.ibgeApiBaseUrl}/malhas/mesorregioes/${mesorregionId}/municipios`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar municípios por mesorregião:', error);
    throw error;
  }
};

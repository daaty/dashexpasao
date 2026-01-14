
import { City, Mesorregion, CityStatus } from '../types';
import axios from 'axios';

// Interfaces para tipar a resposta complexa do IBGE
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

interface IbgeCityBase {
    id: number;
    nome: string;
    microrregiao: {
        mesorregiao: {
            nome: string;
        }
    }
}

/**
 * Utilitário para extrair o valor mais recente de uma série histórica do IBGE
 */
const getLastValue = (data: IbgeResponse[] | null, fallback: number): number => {
  try {
    if (!data || data.length === 0 || !data[0].resultados || data[0].resultados.length === 0) {
      return fallback;
    }

    const series = data[0].resultados[0].series[0].serie;
    const years = Object.keys(series).sort(); // Ordena anos
    const lastYear = years[years.length - 1]; // Pega o último ano disponível
    const value = series[lastYear];

    // IBGE retorna "-" ou "..." para dados inexistentes
    if (value === '-' || value === '...' || value === undefined) {
      return fallback;
    }

    return parseFloat(value);
  } catch (e) {
    console.warn('Erro ao extrair dados do IBGE:', e);
    return fallback;
  }
};

/**
 * Busca dados atualizados de uma cidade específica na API do IBGE (Agregados)
 */
export const fetchSingleCityUpdate = async (baseCity: City): Promise<City> => {
  const cityId = baseCity.id;
  let updatedCity = { ...baseCity };

  const fetchData = async (url: string) => {
    try {
      const response = await axios.get<IbgeResponse[]>(url);
      return response.data;
    } catch (error) {
      console.warn(`Falha na requisição IBGE (${url}):`, error);
      return null;
    }
  };

  const urlPop = `https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/-1/variaveis/93?localidades=N6[${cityId}]`;
  const urlPib = `https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/-1/variaveis/37?localidades=N6[${cityId}]`;
  const urlCempreSalario = `https://servicodados.ibge.gov.br/api/v3/agregados/1685/periodos/-1/variaveis/2078?localidades=N6[${cityId}]`;
  const urlCemprePessoal = `https://servicodados.ibge.gov.br/api/v3/agregados/1685/periodos/-1/variaveis/165?localidades=N6[${cityId}]`;

  const [popData, pibData, salarioData, pessoalData] = await Promise.all([
    fetchData(urlPop),
    fetchData(urlPib),
    fetchData(urlCempreSalario),
    fetchData(urlCemprePessoal)
  ]);

  const newPopulation = getLastValue(popData, baseCity.population);
  if (newPopulation !== baseCity.population) {
    updatedCity.population = newPopulation;
    const ratio = baseCity.population > 0 ? baseCity.population15to44 / baseCity.population : 0.42;
    updatedCity.population15to44 = Math.round(newPopulation * ratio);
  }
  
  const pibPerCapita = getLastValue(pibData, 0);
  if (pibPerCapita > 0) {
    updatedCity.averageIncome = pibPerCapita / 12;
  }

  const salariosMinimos = getLastValue(salarioData, 0);
  if (salariosMinimos > 0) {
    const salarioMinimoBase = 1412; 
    updatedCity.averageFormalSalary = salariosMinimos * salarioMinimoBase;
  }

  const newFormalJobs = getLastValue(pessoalData, baseCity.formalJobs);
  if (newFormalJobs > 0) {
    updatedCity.formalJobs = newFormalJobs;
  }

  return updatedCity;
};

// Nova função para buscar dados demográficos específicos para exportação (População 15-44 detalhada)
export const fetchRealTargetPopulation = async (cityIds: number[]): Promise<Record<number, number>> => {
    if (cityIds.length === 0) return {};
    
    // Aggregate 4714 (Censo 2022) - Variable 93 (População residente)
    // Classification 2 (Sexo) = 0 (Total)
    // Classification 58 (Grupo de idade) = IDs for 15-19, 20-24, 25-29, 30-34, 35-39, 40-44
    // IBGE Age Group IDs:
    // 15-19: 6878
    // 20-24: 6879
    // 25-29: 6880
    // 30-34: 6881
    // 35-39: 6882
    // 40-44: 6883
    const ageGroups = "6878,6879,6880,6881,6882,6883";
    
    // Chunk requests if too many cities (IBGE limit safe bet is ~20-30 in pipe, or construct N6[id,id])
    const results: Record<number, number> = {};

    // Helper to process a batch
    const processBatch = async (ids: number[]) => {
        const locSelector = `N6[${ids.join(',')}]`;
        const url = `https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/-1/variaveis/93?localidades=${locSelector}&classificacao=58[${ageGroups}]`;
        
        try {
            const response = await axios.get<IbgeResponse[]>(url);
            const data = response.data;
            
            if (data && data.length > 0) {
                // IBGE returns one "resultado" per classification combination if not structured differently.
                // But usually with classification filter, it returns the breakdown.
                // Actually, aggregate 4714 with classification returns one entry per age group.
                
                // We need to sum up all age groups for each city.
                data[0].resultados.forEach((res) => {
                    const series = res.series;
                    series.forEach(s => {
                        const cityId = parseInt(s.localidade.id);
                        const val = parseFloat(Object.values(s.serie)[0] as string);
                        if (!isNaN(val)) {
                            results[cityId] = (results[cityId] || 0) + val;
                        }
                    });
                });
            }
        } catch (e) {
            console.error("Error fetching target population batch", e);
        }
    };

    // Split into batches of 20 to be safe
    const batchSize = 20;
    const batches = [];
    for (let i = 0; i < cityIds.length; i += batchSize) {
        batches.push(cityIds.slice(i, i + batchSize));
    }

    await Promise.all(batches.map(batch => processBatch(batch)));
    
    return results;
};

/**
 * Busca dados iniciais para TODAS as cidades do estado (Bulk fetch)
 */
export const fetchInitialData = async (onProgress?: (msg: string) => void): Promise<City[]> => {
    if (onProgress) onProgress("Buscando lista de municípios...");
    
    // 1. Fetch List of Municipalities (MT = 51)
    let cityList: IbgeCityBase[] = [];
    try {
        const cityListRes = await axios.get<IbgeCityBase[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios');
        cityList = cityListRes.data;
    } catch (e) {
        console.error("Erro crítico ao buscar lista de municípios do IBGE:", e);
        throw e; // Se falhar a lista, não conseguimos prosseguir
    }

    if (onProgress) onProgress("Carregando indicadores demográficos...");

    // Helper para buscar com tratamento de erro individual (evita que um erro 500 pare tudo)
    const fetchSafe = async (url: string) => {
        try {
            return await axios.get(url);
        } catch (e) {
            console.warn(`Falha na requisição segura [${url}]:`, e);
            // Retorna um objeto vazio compatível com a estrutura esperada pelo axios response
            return { data: [] }; 
        }
    };

    // 2. Fetch Aggregates (Parallel & Split)
    // Dividimos em requisições menores para evitar Timeout/Error 500 do IBGE
    
    // Population (Censo 2022) - All MT cities
    const popPromise = fetchSafe('https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/-1/variaveis/93?localidades=N6[N3[51]]');
    
    // PIB per capita (Proxy for Income)
    const pibPromise = fetchSafe('https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/-1/variaveis/37?localidades=N6[N3[51]]');
    
    // Jobs (CEMPRE) - Variável 165
    const jobsPromise = fetchSafe('https://servicodados.ibge.gov.br/api/v3/agregados/1685/periodos/-1/variaveis/165?localidades=N6[N3[51]]');

    // Salary (CEMPRE) - Variável 2078
    const salaryPromise = fetchSafe('https://servicodados.ibge.gov.br/api/v3/agregados/1685/periodos/-1/variaveis/2078?localidades=N6[N3[51]]');

    const [popRes, pibRes, jobsRes, salaryRes] = await Promise.all([popPromise, pibPromise, jobsPromise, salaryPromise]);

    if (onProgress) onProgress("Processando dados...");

    // Helper to extract values map from simple response
    const extractMap = (res: any) => {
        const map: Record<string, number> = {};
        // Verifica se a estrutura existe antes de tentar iterar
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0 && res.data[0].resultados) {
             res.data.forEach((variableGroup: any) => {
                 const series = variableGroup.resultados[0]?.series;
                 if (series && Array.isArray(series)) {
                    series.forEach((item: any) => {
                        const cityId = item.localidade.id;
                        // Pega o último ano disponível (dinamicamente)
                        const periods = Object.keys(item.serie);
                        const lastPeriod = periods[periods.length - 1];
                        const value = item.serie[lastPeriod]; 
                        
                        if (value && value !== '...' && value !== '-') {
                            map[cityId] = parseFloat(value as string);
                        }
                    });
                 }
             });
        }
        return map;
    };
    
    const popMap = extractMap(popRes);
    const pibMap = extractMap(pibRes);
    const jobsMap = extractMap(jobsRes);
    const salaryMap = extractMap(salaryRes);

    // Merge
    return cityList.map((c) => {
        const id = c.id;
        const idStr = id.toString();
        const pop = popMap[idStr] || 0;
        const pib = pibMap[idStr] || 0;
        const jobs = jobsMap[idStr] || 0;
        const salaryMW = salaryMap[idStr] || 0;
        
        // Map IBGE Mesorregion to Enum
        let mesorregion = Mesorregion.Norte;
        const mesoNome = c.microrregiao?.mesorregiao?.nome || '';
        
        if (mesoNome.includes('Norte')) mesorregion = Mesorregion.Norte;
        else if (mesoNome.includes('Nordeste')) mesorregion = Mesorregion.Nordeste;
        else if (mesoNome.includes('Sudeste')) mesorregion = Mesorregion.Sudeste;
        else if (mesoNome.includes('Sudoeste')) mesorregion = Mesorregion.Sudoeste;
        else if (mesoNome.includes('Centro-Sul')) mesorregion = Mesorregion.CentroSul;

        return {
            id: id,
            name: c.nome,
            population: pop,
            population15to44: Math.round(pop * 0.44), // Estimativa de ~44% da população caso falte detalhe
            averageIncome: pib > 0 ? (pib / 12) : 0, // Proxy mensal
            urbanizationIndex: 0.75, // Dado não disponível facilmente em bulk
            status: CityStatus.NotServed,
            mesorregion: mesorregion,
            gentilic: 'matogrossense',
            anniversary: '01/01',
            mayor: 'Não informado',
            averageFormalSalary: salaryMW > 0 ? salaryMW * 1412 : 0,
            formalJobs: jobs,
            urbanizedAreaKm2: 0
        };
    });
}

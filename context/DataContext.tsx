
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { City, CityPlan, CityStatus, PlanningPhase, PlanningAction, PhaseTemplate, Tag, Responsible, CityMarketData, MarketBlock, MonthResult } from '../types';
import { internalCitiesData } from '../services/internalData';
import { fetchSingleCityUpdate, fetchInitialData } from '../services/ibgeService';
import { fetchAllCities, updateCityStatus as updateCityStatusBackend, upsertCity } from '../services/cityApiService';
import * as planningApi from '../services/planningApiService';
import * as planResultsService from '../services/planResultsService';
import * as planDetailsService from '../services/planDetailsService';
import * as marketBlocksService from '../services/marketBlocksService';


interface DataContextType {
  cities: City[];
  plans: CityPlan[];
  marketData: CityMarketData[];
  isLoading: boolean;
  loadingStatus: string;
  isUpdating: number | null;
  warnings: string[];
  phaseTemplates: PhaseTemplate[];
  tags: Tag[];
  responsibles: Responsible[];
  marketBlocks: MarketBlock[];
  saveCounter: number;
  updateCity: (cityId: number) => Promise<void>;
  addPlanForCity: (cityId: number) => void;
  deletePlan: (cityId: number) => void;
  updatePlanAction: (
    cityId: number, 
    phaseName: string, 
    actionId: string, 
    updates: { 
      description?: string; 
      completed?: boolean; 
      delete?: boolean;
      estimatedCompletionDate?: string;
      driveLink?: string;
      tagIds?: string[];
      responsibleId?: string;
    }
  ) => void;
  updatePlanPhase: (
    cityId: number,
    phaseName: string,
    updates: { 
        startDate?: string;
        estimatedCompletionDate?: string;
        completionDate?: string;
    }
  ) => void;
  updatePlanResults: (cityId: number, monthKey: string, result: MonthResult) => void;
  updatePlanResultsBatch: (cityId: number, results: { [key: string]: MonthResult }) => void;
  updatePlanRealCosts: (cityId: number, realMonthlyCosts: { [key: string]: { marketingCost: number; operationalCost: number } }) => Promise<void>;
  updatePlanStartDate: (cityId: number, newStartDate: string) => void;
  updateCityImplementationDate: (cityId: number, newDate: string) => void;
  updatePhaseTemplate: (templateName: string, updates: Partial<PhaseTemplate>) => void;
  resetPhaseTemplates: () => void;
  addTag: (tag: Omit<Tag, 'id'>) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  addResponsible: (resp: Omit<Responsible, 'id' | 'initials'>) => void;
  updateResponsible: (id: string, updates: Partial<Responsible>) => void;
  deleteResponsible: (id: string) => void;
  getCityMarketData: (cityId: number) => CityMarketData;
  saveCityMarketData: (data: CityMarketData) => void;
  addCityToIntelligence: (cityId: number) => void;
  removeCityFromIntelligence: (cityId: number) => void;
  addMarketBlock: (name: string) => Promise<string>;
  updateMarketBlock: (id: string, name: string) => void;
  deleteMarketBlock: (id: string) => void;
  moveCityToBlock: (cityId: number, blockId: string | null) => void;
  addCitiesToBlock: (cityIds: number[], blockId: string) => void;
}

export const DataContext = createContext<DataContextType>({
  cities: [],
  plans: [],
  marketData: [],
  isLoading: true,
  loadingStatus: '',
  isUpdating: null,
  warnings: [],
  phaseTemplates: [],
  tags: [],
  responsibles: [],
  marketBlocks: [],
  saveCounter: 0,
  updateCity: async () => {},
  addPlanForCity: () => {},
  deletePlan: () => {},
  updatePlanAction: () => {},
  updatePlanPhase: () => {},
  updatePlanResults: () => {},
  updatePlanResultsBatch: () => {},
  updatePlanStartDate: () => {},
  updateCityImplementationDate: () => {},
  updatePhaseTemplate: () => {},
  resetPhaseTemplates: () => {},
  addTag: () => {},
  updateTag: () => {},
  deleteTag: () => {},
  addResponsible: () => {},
  updateResponsible: () => {},
  deleteResponsible: () => {},
  getCityMarketData: () => ({} as CityMarketData),
  saveCityMarketData: () => {},
  addCityToIntelligence: () => {},
  removeCityFromIntelligence: () => {},
  addMarketBlock: async () => Promise.resolve(''),
  updateMarketBlock: () => {},
  deleteMarketBlock: () => {},
  moveCityToBlock: () => {},
  addCitiesToBlock: () => {},
});

const DEFAULT_PHASE_TEMPLATES: PhaseTemplate[] = [
    { name: 'Análise & Viabilidade', durationDays: 30, actions: ['Estudo de mercado detalhado', 'Análise competitiva local', 'Definição de metas de lançamento (KPIs)'] },
    { name: 'Preparação Operacional', durationDays: 30, actions: ['Verificar questões legais/regulatórias', 'Definir área de cobertura inicial', 'Configurar cidade no sistema/app'] },
    { name: 'Aquisição de Motoristas', durationDays: 30, actions: ['Criar campanha de cadastro de motoristas', 'Realizar workshop de apresentação', 'Definir pacote de incentivos iniciais'] },
    { name: 'Marketing & Lançamento', durationDays: 45, actions: ['Campanha de pré-lançamento para passageiros', 'Planejar evento/promoção de lançamento', 'Ativar mídias sociais para a cidade'] },
    { name: 'Aquisição de Passageiros', durationDays: 60, actions: ['Lançar campanha de cupons para primeira viagem', 'Anunciar em rádios e mídias locais'] },
    { name: 'Pós-Lançamento & Otimização', durationDays: 90, actions: ['Monitorar KPIs de lançamento (1ª semana)', 'Coletar feedback de motoristas e passageiros'] }
];

const DEFAULT_TAGS: Tag[] = [
    { id: '1', label: 'Prioritário', color: '#ef4444' },
    { id: '2', label: 'Financeiro', color: '#22c55e' },
    { id: '3', label: 'Marketing', color: '#d946ef' },
    { id: '4', label: 'Legal', color: '#64748b' },
    { id: '5', label: 'Operacional', color: '#3b82f6' },
];

const DEFAULT_RESPONSIBLES: Responsible[] = [
    { id: '1', name: 'Gestor de Expansão', color: '#3b82f6', initials: 'GE' },
    { id: '2', name: 'Analista de Marketing', color: '#d946ef', initials: 'AM' },
    { id: '3', name: 'Operações Local', color: '#f97316', initials: 'OP' },
];

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

export const DataProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [plans, setPlans] = useState<CityPlan[]>([]);
  const [phaseTemplates, setPhaseTemplates] = useState<PhaseTemplate[]>(DEFAULT_PHASE_TEMPLATES);
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  const [responsibles, setResponsibles] = useState<Responsible[]>(DEFAULT_RESPONSIBLES);
  const [marketBlocks, setMarketBlocks] = useState<MarketBlock[]>([]);
  const [marketData, setMarketData] = useState<CityMarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Iniciando...");
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saveCounter, setSaveCounter] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // 1. Dados carregam do PostgreSQL (useEffect abaixo)
  // NÃO USAR localStorage - dados APENAS do banco de dados

  // Auto-salvar market blocks DIRETO no PostgreSQL (sem localStorage)
  useEffect(() => {
    if (marketBlocks.length > 0) {
      // Salvar APENAS no PostgreSQL
      marketBlocksService.saveMarketBlocks(marketBlocks).then(success => {
        if (success) {
          console.log('✅ Blocos de mercado salvos no PostgreSQL');
        }
      });
    }
  }, [marketBlocks]);

  // Market data - mantido em memória por enquanto (TODO: criar tabela no banco)
  useEffect(() => {
    if (marketData.length > 0) {
      // TODO: Criar endpoint para salvar market data no PostgreSQL
      // Por enquanto apenas em memória
    }
  }, [marketData]);

  // 2. Fetch dados do backend (cidades e planejamentos)
  useEffect(() => {
    const initData = async () => {
        setIsLoading(true);
        setLoadingStatus('Conectando ao servidor...');
        
        // LIMPAR localStorage completamente - PostgreSQL é a única fonte de dados
        // Isso garante que dados antigos em cache não interfiram
        try {
            const keysToRemove = [
                'urban_cities', 'urban_cities_status', 'urban_cities_cache_version',
                'urban_plans', 'urban_plans_cache_version',
                'urban_market_blocks', 'urban_market_data',
                'urban_phase_templates', 'urban_planning_tags', 'urban_planning_responsibles',
                'last_sync_time'
            ];
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log('🧹 localStorage limpo - usando apenas PostgreSQL');
        } catch (e) {
            console.warn('Não foi possível limpar localStorage:', e);
        }
        
        try {
            // SEMPRE buscar do PostgreSQL - fonte única da verdade
            setLoadingStatus('Carregando cidades do banco de dados...');
            const { cities: backendCities } = await fetchAllCities({ limit: 1000 });
            
            // Variável para armazenar cidades para uso posterior
            let citiesToUse: any[] = [];
            
            if (backendCities && backendCities.length > 0) {
                console.log('✅ Cidades carregadas do backend:', backendCities.length);
                
                // Criar mapa de cidades do backend
                const backendMap = new Map(backendCities.map(c => [c.id, c]));
                
                // Identificar cidades do internalData que NÃO estão no backend
                const missingCities = internalCitiesData.filter(c => !backendMap.has(c.id));
                if (missingCities.length > 0) {
                    console.log(`🔄 ${missingCities.length} cidades faltando no PostgreSQL - populando...`);
                    // Popular assíncronamente (não bloquear UI)
                    missingCities.forEach(async (city) => {
                        try {
                            await upsertCity(city);
                            console.log(`✅ Cidade ${city.name} populada no PostgreSQL`);
                        } catch (err) {
                            console.error(`❌ Erro ao popular ${city.name}:`, err);
                        }
                    });
                }
                
                // Usar TODAS as cidades (backend + internalData temporariamente até popular)
                const allCityIds = new Set([
                    ...backendCities.map(c => c.id),
                    ...internalCitiesData.map(c => c.id)
                ]);
                
                const mergedCities: City[] = [];
                allCityIds.forEach(cityId => {
                    const backendCity = backendMap.get(cityId);
                    const internalCity = internalCitiesData.find(c => c.id === cityId);
                    
                    if (backendCity) {
                        // Backend TEM PRIORIDADE ABSOLUTA - é a fonte da verdade
                        mergedCities.push(backendCity);
                    } else if (internalCity) {
                        // Fallback temporário até ser populado no PostgreSQL
                        mergedCities.push(internalCity);
                    }
                });
                
                console.log('📊 Total de cidades após merge:', mergedCities.length);
                citiesToUse = mergedCities;
                setCities(mergedCities);
                // NÃO salvar no localStorage - backend é a fonte da verdade
            } else {
                // Se não há cidades no backend, usar dados internos para popular
                setLoadingStatus('Populando banco de dados...');
                console.warn('⚠️ Backend sem dados, populando com dados internos...');
                // Popular banco de dados com dados internos
                for (const city of internalCitiesData) {
                    try {
                        await upsertCity(city);
                    } catch (err) {
                        console.error(`❌ Erro ao popular ${city.name}:`, err);
                    }
                }
                // Usar dados internos temporáriamente
                citiesToUse = internalCitiesData;
                setCities(internalCitiesData);
            }
            
            // Buscar planejamentos do backend
            setLoadingStatus('Carregando planejamentos...');
            const backendPlans = await planningApi.getAllPlannings();

            if (backendPlans && backendPlans.length > 0) {
                console.log('✅ Planejamentos carregados do backend:', backendPlans.length);
                // Converter formato do backend para o formato do frontend
                const convertedPlansPromises = backendPlans.map(async (plan: any) => {
                    // Buscar resultados salvos do backend
                    const backendData = await planResultsService.getPlanResults(plan.cityId);
                    const resultsToUse = backendData?.results || {};
                    const realMonthlyCostsFromBackend = backendData?.realMonthlyCosts || {};
                    const startDateResult = backendData?.startDate;
                    
                    // Buscar detalhes (fases + ações) do backend
                    const planDetailsData = await planDetailsService.getPlanDetails(plan.cityId);
                    
                    // Se tiver dados no backend planDetails, usa. Senão, inicializa padrão.
                    let phasesToUse = planDetailsData?.phases;
                    if (!phasesToUse || phasesToUse.length === 0) {
                         const now = new Date().toISOString();
                         // Obter implementationStartDate da cidade correspondente
                         const cityForPlan = citiesToUse.find((c: any) => c.id === plan.cityId);
                         
                         // Validar e criar data de início da fase
                         let phaseStartDate = now;
                         if (cityForPlan?.implementationStartDate) {
                             try {
                                 const dateValue = new Date(`${cityForPlan.implementationStartDate}T00:00:00Z`);
                                 if (!isNaN(dateValue.getTime())) {
                                     phaseStartDate = dateValue.toISOString();
                                 }
                             } catch (e) {
                                 console.warn('⚠️ Data de implementação inválida, usando data atual:', e);
                             }
                         }
                         
                         phasesToUse = DEFAULT_PHASE_TEMPLATES.map((t, phaseIndex) => ({
                            name: t.name,
                            startDate: phaseStartDate,
                            estimatedCompletionDate: undefined,
                            completionDate: undefined,
                            actions: t.actions.map((desc, i) => ({ id: `${Date.now()}-${phaseIndex}-${i}`, description: desc, completed: false, createdAt: now, tagIds: [] }))
                        }));
                    }

                    return {
                        id: plan.id, // Armazenar ID do backend para permitir deletar
                        cityId: plan.cityId,
                        startDate: startDateResult || (plan.startDate ? String(plan.startDate).slice(0, 7) : new Date().toISOString().slice(0, 7)),
                        phases: phasesToUse,
                        results: resultsToUse,
                        realMonthlyCosts: realMonthlyCostsFromBackend
                    };
                });
                
                const convertedPlans = await Promise.all(convertedPlansPromises);
                setPlans(convertedPlans);
                
                // Sincronizar status das cidades com planejamentos existentes
                const cityIdsWithPlan = new Set(convertedPlans.map(p => p.cityId));
                
                // Atualizar status no backend para todas as cidades com planejamento
                for (const cityId of cityIdsWithPlan) {
                    const city = citiesToUse.find(c => c.id === cityId);
                    if (city && city.status !== CityStatus.Planning) {
                        try {
                            await updateCityStatusBackend(cityId, CityStatus.Planning);
                            console.log(`✅ Status de ${city.name} atualizado para PLANNING no banco`);
                        } catch (err) {
                            console.error(`❌ Erro ao atualizar status de ${city.name}:`, err);
                        }
                    }
                }
                
                // Recarregar cidades do backend após atualização de status
                const { cities: refreshedCities } = await fetchAllCities({ limit: 1000 });
                if (refreshedCities && refreshedCities.length > 0) {
                    setCities(refreshedCities);
                    citiesToUse = refreshedCities;
                    console.log('✅ Cidades recarregadas do banco com status atualizados');
                }
                
                // NÃO salvar em localStorage - dados vem do PostgreSQL
            } else {
                console.log('📦 Nenhum planejamento no banco de dados');
                setPlans([]);
            }
            
            // Carregar blocos de mercado do backend
            setLoadingStatus('Carregando blocos de inteligência...');
            const backendBlocks = await marketBlocksService.getMarketBlocks();
            if (backendBlocks && backendBlocks.length > 0) {
                console.log('✅ Blocos de mercado carregados do backend:', backendBlocks.length);
                setMarketBlocks(backendBlocks);
                // NÃO salvar em localStorage - dados vem do PostgreSQL
            } else {
                console.log('📦 Nenhum bloco de mercado no banco de dados');
                setMarketBlocks([]);
            }
            
            setLoadingStatus('Dados carregados com sucesso!');
            setWarnings(["✅ Conectado ao banco de dados", "Dados sincronizados", "Sistema operacional"]);
            
        } catch (e) {
            console.error("❌ Erro ao carregar do backend:", e);
            setLoadingStatus('Erro na conexão com o banco de dados');
            
            // NÃO usar fallback para localStorage - exibir erro
            // O usuário deve saber que há um problema de conexão
            setCities([]);
            setPlans([]);
            setWarnings(["❌ Erro de conexão com PostgreSQL", "Verifique a conexão com o banco de dados", "Dados não carregados"]);
        } finally {
            setIsLoading(false);
        }
    };
    initData();
  }, []);

  // Debug removido - sistema estável

  // REMOVIDO: useEffect que causava conflito ao corrigir "cidades orfãs"
  // O banco de dados é a fonte da verdade - não fazer correções automáticas no frontend
  // Se houver inconsistência, deve ser corrigida no backend

  const persistCityStatus = async (cityId: number, status: CityStatus) => {
      // SEMPRE sincronizar com PostgreSQL PRIMEIRO
      try {
        await updateCityStatusBackend(cityId, status);
        console.log(`✅ Status atualizado no PostgreSQL para ${cityId}: ${status}`);
        
        // Atualizar estado local APENAS após sucesso no backend
        const updatedCities = cities.map(c => 
            c.id === cityId ? { ...c, status } : c
        );
        setCities(updatedCities);
        setSaveCounter(prev => prev + 1);
        
      } catch (error) {
        console.error(`❌ ERRO CRÍTICO ao atualizar status no PostgreSQL para ${cityId}:`, error);
        throw error; // Propagar erro para não atualizar UI com dados incorretos
      }
  };

  const persistPlans = async (newPlans: CityPlan[]) => {
      // APENAS atualizar estado local e salvar no PostgreSQL
      setPlans(newPlans);
      setSaveCounter(prev => prev + 1);
      console.log(`💾 ${newPlans.length} planejamento(s) sendo salvos no PostgreSQL...`);
      
      // Sincronizar cada plano com backend (OBRIGATÓRIO)
      for (const plan of newPlans) {
        if (plan.phases && plan.phases.length > 0) {
          try {
            const success = await planDetailsService.savePlanDetails(plan.cityId, plan.phases, plan.startDate);
            if (success) {
              console.log(`✅ Planejamento de cidade ${plan.cityId} salvo no PostgreSQL`);
            }
          } catch (err) {
            console.error(`❌ Erro ao salvar planejamento da cidade ${plan.cityId}:`, err);
          }
        }
      }
      
      // Sincronizar resultados também
      try {
        await planResultsService.syncAllPlans(newPlans);
        console.log('✅ Sincronização com PostgreSQL concluída');
      } catch (err) {
        console.error('❌ Erro na sincronização com PostgreSQL:', err);
      }
  };

  // persistCities removido - PostgreSQL é a fonte da verdade

  const updateCity = async (cityId: number) => {
    setIsUpdating(cityId);
    try {
      const cityToUpdate = cities.find(c => c.id === cityId);
      if (!cityToUpdate) throw new Error("City not found");
      const updatedData = await fetchSingleCityUpdate(cityToUpdate);
      setCities(prev => prev.map(c => c.id === cityId ? updatedData : c));
    } finally { setIsUpdating(null); }
  };

  const deletePlan = async (cityId: number) => {
    const city = cities.find(c => c.id === cityId);
    const plan = plans.find(p => p.cityId === cityId);
    
    if (!city) {
        console.error('❌ Cidade não encontrada:', cityId);
        return;
    }
    
    console.log('🗑️ Removendo planejamento para:', city.name);
    
    try {
        // 1. Deletar do backend
        if (plan?.id) {
            await planningApi.deletePlanning(plan.id);
            console.log('✅ Planejamento removido do backend');
        }
        
        // 2. Remover resultados do backend
        await planResultsService.deletePlanResults(cityId);
        console.log('✅ Resultados removidos do backend');
        
        // 3. Atualizar status da cidade no backend
        await updateCityStatusBackend(cityId, CityStatus.NotServed);
        console.log('✅ Status da cidade atualizado no backend');
        
        // 4. Recarregar dados do banco
        const [refreshedPlans, { cities: refreshedCities }] = await Promise.all([
            planningApi.getAllPlannings(),
            fetchAllCities({ limit: 1000 })
        ]);
        
        // 5. Atualizar estado
        if (refreshedPlans) {
            const convertedPlansPromises = refreshedPlans.map(async (p: any) => {
                const resultsData = await planResultsService.getPlanResults(p.cityId);
                const planDetailsData = await planDetailsService.getPlanDetails(p.cityId);
                
                return {
                    id: p.id,
                    cityId: p.cityId,
                    startDate: p.startDate ? String(p.startDate).slice(0, 7) : new Date().toISOString().slice(0, 7),
                    phases: planDetailsData?.phases || [],
                    results: resultsData || undefined
                };
            });
            
            const convertedPlans = await Promise.all(convertedPlansPromises);
            setPlans(convertedPlans);
        }
        
        if (refreshedCities && refreshedCities.length > 0) {
            setCities(refreshedCities);
        }
        
        console.log('✅ Planejamento removido - dados recarregados do banco');
        
    } catch (error) {
        console.error('❌ Erro ao remover planejamento:', error);
        alert(`Erro ao remover planejamento: ${error}`);
    }
  };

  const addPlanForCity = async (cityId: number) => {
    const existingPlan = plans.find(p => p.cityId === cityId);
    const city = cities.find(c => c.id === cityId);
    
    if (!city) {
        console.error('❌ Cidade não encontrada:', cityId);
        alert('Erro: Cidade não encontrada');
        return;
    }
    
    // Se já tem planejamento ativo, não criar duplicado
    if (existingPlan && city.status === CityStatus.Planning) {
        console.log('⚠️ Planejamento já existe para cidade', cityId);
        alert(`Planejamento já existe para ${city.name}`);
        return;
    }
    
    const now = new Date().toISOString();
    
    // Validar e criar data de início da fase
    let phaseStartDate = now;
    if (city.implementationStartDate) {
        try {
            const dateValue = new Date(`${city.implementationStartDate}T00:00:00Z`);
            if (!isNaN(dateValue.getTime())) {
                phaseStartDate = dateValue.toISOString();
            }
        } catch (e) {
            console.warn('⚠️ Data de implementação inválida, usando data atual:', e);
        }
    }
    
    console.log('🆕 Criando planejamento para:', city.name);
    
    try {
        // 1. SEMPRE salvar no PostgreSQL PRIMEIRO
        const planningDTO: planningApi.PlanningDTO = {
            cityId,
            title: `Expansão em ${city.name}`,
            description: `Planejamento de expansão para ${city.name}`,
            startDate: now,
            status: 'active',
            priority: 'medium',
            tags: ['expansão'],
            tasks: []
        };
        
        const savedPlan = await planningApi.createPlanning(planningDTO);
        
        if (!savedPlan?.id) {
            throw new Error('Backend não retornou ID do planejamento');
        }
        
        console.log('✅ Planejamento salvo no PostgreSQL:', savedPlan.id);
        
        // 2. Salvar fases do planejamento no backend
        const newPhases = DEFAULT_PHASE_TEMPLATES.map((t, phaseIndex) => ({
            name: t.name,
            startDate: phaseStartDate,
            actions: t.actions.map((desc, i) => ({ 
                id: `${Date.now()}-${phaseIndex}-${i}`, 
                description: desc, 
                completed: false, 
                createdAt: now, 
                tagIds: [] 
            }))
        }));
        
        await planDetailsService.savePlanDetails(cityId, newPhases, now.slice(0, 7));
        console.log('✅ Fases do planejamento salvas no PostgreSQL');
        
        // 3. Atualizar status da cidade no PostgreSQL
        await updateCityStatusBackend(cityId, CityStatus.Planning);
        console.log('✅ Status da cidade atualizado no PostgreSQL');
        
        // 4. Recarregar dados do banco
        const [refreshedPlans, { cities: refreshedCities }] = await Promise.all([
            planningApi.getAllPlannings(),
            fetchAllCities({ limit: 1000 })
        ]);
        
        // 5. Converter planejamentos
        if (refreshedPlans && refreshedPlans.length > 0) {
            const convertedPlansPromises = refreshedPlans.map(async (plan: any) => {
                const resultsData = await planResultsService.getPlanResults(plan.cityId);
                const planDetailsData = await planDetailsService.getPlanDetails(plan.cityId);
                
                return {
                    id: plan.id,
                    cityId: plan.cityId,
                    startDate: plan.startDate ? String(plan.startDate).slice(0, 7) : new Date().toISOString().slice(0, 7),
                    phases: planDetailsData?.phases || newPhases,
                    results: resultsData || undefined
                };
            });
            
            const convertedPlans = await Promise.all(convertedPlansPromises);
            setPlans(convertedPlans);
        }
        
        // 6. Atualizar cidades
        if (refreshedCities && refreshedCities.length > 0) {
            setCities(refreshedCities);
        }
        
        console.log('✅ Dados recarregados do banco - planejamento criado');
        
    } catch (error: any) {
        console.error('❌ ERRO CRÍTICO ao criar planejamento:', error);
        alert(`Erro ao criar planejamento para ${city.name}:\n\n${error.message}\n\nVerifique o console para mais detalhes.`);
        throw error; // Propagar erro para não atualizar UI
    }
  };

  const saveCityMarketData = async (data: CityMarketData) => {
      const cityName = cities.find(c => c.id === data.cityId)?.name || data.cityId;
      const updatedData = { ...data, updatedAt: new Date().toISOString() };
      
      setMarketData(prev => {
          const updated = [...prev.filter(d => d.cityId !== data.cityId), updatedData];
          setSaveCounter(prevCounter => prevCounter + 1);
          console.log(`💾 Dados de mercado salvos para ${cityName}`);
          return updated;
      });
      
      // Salvar no PostgreSQL
      try {
          await marketBlocksService.saveMarketBlocks(marketBlocks);
          console.log('✅ Dados de mercado sincronizados com PostgreSQL');
      } catch (err) {
          console.error('❌ Erro ao salvar dados de mercado no PostgreSQL:', err);
      }
  };

  const getCityMarketData = (cityId: number): CityMarketData => {
      return marketData.find(d => d.cityId === cityId) || {
          cityId, economicNotes: '', mediaChannelsNotes: '', competitors: [], stakeholders: [],
          swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] }, updatedAt: new Date().toISOString()
      };
  };

  const addCityToIntelligence = (cityId: number) => {
      if (!marketData.some(m => m.cityId === cityId)) {
          saveCityMarketData(getCityMarketData(cityId));
      }
  };

  const removeCityFromIntelligence = async (cityId: number) => {
      try {
          // 1. Remover dos blocos
          const updatedBlocks = marketBlocks.map(b => ({ ...b, cityIds: b.cityIds.filter(id => id !== cityId) }));
          await marketBlocksService.saveMarketBlocks(updatedBlocks);
          setMarketBlocks(updatedBlocks);
          
          // 2. Remover market data
          const updatedMarketData = marketData.filter(d => d.cityId !== cityId);
          setMarketData(updatedMarketData);
          
          // 3. Deletar planejamento do backend (usa função deletePlan que já recarrega tudo)
          const plan = plans.find(p => p.cityId === cityId);
          if (plan) {
              await deletePlan(cityId);
          } else {
              // Se não tem plano, só atualizar status
              await updateCityStatusBackend(cityId, CityStatus.NotServed);
              
              // Recarregar cidades do banco
              const { cities: refreshedCities } = await fetchAllCities({ limit: 1000 });
              if (refreshedCities && refreshedCities.length > 0) {
                  setCities(refreshedCities);
              }
          }
          
          console.log('✅ Cidade removida da inteligência');
      } catch (err) {
          console.error('❌ Erro ao remover cidade da inteligência:', err);
      }
  };
  
  const addMarketBlock = async (name: string): Promise<string> => {
      const newBlockId = `block-${Date.now()}`;
      const newBlock = { id: newBlockId, name, cityIds: [] };
      const updated = [...marketBlocks, newBlock];
      setMarketBlocks(updated);
      console.log(`💾 Bloco criado: ${name} (ID: ${newBlockId})`);
      
      // Salvar no PostgreSQL
      try {
          await marketBlocksService.saveMarketBlocks(updated);
          console.log('✅ Blocos salvos no PostgreSQL');
      } catch (err) {
          console.error('❌ Erro ao salvar blocos no PostgreSQL:', err);
      }
      
      return newBlockId;
  };

  const updateMarketBlock = async (id: string, name: string) => {
       const updated = marketBlocks.map(b => b.id === id ? { ...b, name } : b);
       setMarketBlocks(updated);
       console.log(`💾 Bloco atualizado: ${name}`);
       
       // Salvar no PostgreSQL
       try {
           await marketBlocksService.saveMarketBlocks(updated);
           console.log('✅ Blocos salvos no PostgreSQL');
       } catch (err) {
           console.error('❌ Erro ao salvar blocos no PostgreSQL:', err);
       }
  };

  const deleteMarketBlock = async (id: string) => {
       const blockName = marketBlocks.find(b => b.id === id)?.name;
       const updated = marketBlocks.filter(b => b.id !== id);
       setMarketBlocks(updated);
       console.log(`💾 Bloco deletado: ${blockName}`);
       
       // Salvar no PostgreSQL
       try {
           await marketBlocksService.saveMarketBlocks(updated);
           console.log('✅ Blocos salvos no PostgreSQL');
       } catch (err) {
           console.error('❌ Erro ao salvar blocos no PostgreSQL:', err);
       }
  };

  const moveCityToBlock = async (cityId: number, blockId: string | null) => {
      const cityName = cities.find(c => c.id === cityId)?.name || cityId;
      const blockName = blockId ? marketBlocks.find(b => b.id === blockId)?.name : 'nenhum bloco';
      
      console.log(`🔄 Movendo cidade ${cityName} (${cityId}) para ${blockName} (${blockId})`);
      console.log('📊 Blocos antes:', marketBlocks.map(b => ({ id: b.id, name: b.name, cities: b.cityIds.length })));
      
      const updated = marketBlocks.map(block => {
          // Se é o bloco de destino, adiciona a cidade (se não já estiver)
          if (block.id === blockId) {
              const newBlock = block.cityIds.includes(cityId) ? block : { ...block, cityIds: [...block.cityIds, cityId] };
              console.log(`  ➕ Bloco ${block.name}: adicionando cidade`);
              return newBlock;
          }
          // Para todos os outros blocos, remove a cidade
          const hadCity = block.cityIds.includes(cityId);
          const newBlock = { ...block, cityIds: block.cityIds.filter(id => id !== cityId) };
          if (hadCity) console.log(`  ➖ Bloco ${block.name}: removendo cidade`);
          return newBlock;
      });
      
      console.log('📊 Blocos depois:', updated.map(b => ({ id: b.id, name: b.name, cities: b.cityIds.length })));
      
      setMarketBlocks(updated);
      console.log(`✅ Cidade ${cityName} movida para ${blockName}`);
      
      // Salvar no PostgreSQL
      try {
          await marketBlocksService.saveMarketBlocks(updated);
          console.log('✅ Blocos salvos no PostgreSQL');
      } catch (err) {
          console.error('❌ Erro ao salvar blocos no PostgreSQL:', err);
      }
      
      if (blockId) addCityToIntelligence(cityId);
  };

  const addCitiesToBlock = async (cityIds: number[], blockId: string) => {
      const blockName = marketBlocks.find(b => b.id === blockId)?.name;
      const cityNames = cityIds.map(id => cities.find(c => c.id === id)?.name).filter(Boolean);
      
      const updated = marketBlocks.map(block => {
          if (block.id === blockId) return { ...block, cityIds: [...new Set([...block.cityIds, ...cityIds])] };
          return { ...block, cityIds: block.cityIds.filter(id => !cityIds.includes(id)) };
      });
      setMarketBlocks(updated);
      console.log(`💾 ${cityIds.length} cidade(s) adicionadas ao bloco ${blockName}:`, cityNames);
      
      // Salvar no PostgreSQL
      try {
          await marketBlocksService.saveMarketBlocks(updated);
          console.log('✅ Blocos salvos no PostgreSQL');
      } catch (err) {
          console.error('❌ Erro ao salvar blocos no PostgreSQL:', err);
      }
      
      cityIds.forEach(id => addCityToIntelligence(id));
  };

  const checkAndUpdateCityStatus = (cityId: number, updatedPlans: CityPlan[]) => {
    const plan = updatedPlans.find(p => p.cityId === cityId);
    if (!plan || plan.phases.length === 0) return;

    // Calcula progresso de cada fase
    const phaseProgress = plan.phases.map(phase => {
      if (phase.actions.length === 0) return { name: phase.name, progress: 0 };
      const completed = phase.actions.filter(a => a.completed).length;
      return { name: phase.name, progress: (completed / phase.actions.length) * 100 };
    });

    // Verifica se Análise & Viabilidade e Preparação Operacional estão 100%
    const analiseViabilidade = phaseProgress.find(p => p.name === 'Análise & Viabilidade');
    const preparacaoOperacional = phaseProgress.find(p => p.name === 'Preparação Operacional');
    
    const isReadyForImplementation = 
      analiseViabilidade?.progress === 100 && 
      preparacaoOperacional?.progress === 100;

    // Verifica se todas as fases estão 100%
    const allPhasesComplete = phaseProgress.every(p => p.progress === 100);

    // Atualiza status da cidade
    const currentCity = cities.find(c => c.id === cityId);
    if (!currentCity) return;

    let newStatus = currentCity.status;

    if (allPhasesComplete && currentCity.status !== CityStatus.Consolidated) {
      newStatus = CityStatus.Consolidated;
      updateCityStatus(cityId, newStatus);
    } else if (isReadyForImplementation && !allPhasesComplete && currentCity.status !== CityStatus.Expansion) {
      // Quando planejamento completo, mover para Expansão (não existe Implementation)
      newStatus = CityStatus.Expansion;
      updateCityStatus(cityId, newStatus);
    }
  };

  // Função auxiliar para atualizar status - usa persistCityStatus (PostgreSQL primeiro)
  const updateCityStatus = async (cityId: number, status: CityStatus) => {
    await persistCityStatus(cityId, status);
  };

  const updatePlanAction = (cityId: number, phaseName: string, actionId: string, updates: any) => {
    const cityName = cities.find(c => c.id === cityId)?.name || cityId;
    
    const newPlans = plans.map(plan => {
      if (plan.cityId !== cityId) return plan;
      return {
        ...plan,
        phases: plan.phases.map(phase => {
          if (phase.name !== phaseName) return phase;
          if (updates.delete) {
            console.log(`🗑️ Ação deletada em ${cityName} - ${phaseName}`);
            return { ...phase, actions: phase.actions.filter(a => a.id !== actionId) };
          }
          if (actionId === '') {
             const newAction = { id: Date.now().toString(), description: updates.description || 'Nova Ação', completed: false, createdAt: new Date().toISOString(), tagIds: [], ...updates };
             console.log(`➕ Nova ação adicionada em ${cityName} - ${phaseName}:`, newAction.description);
             return { ...phase, actions: [...phase.actions, newAction] };
          }
          console.log(`✏️ Ação atualizada em ${cityName} - ${phaseName}:`, updates);
          return { ...phase, actions: phase.actions.map(action => action.id === actionId ? { ...action, ...updates } : action) };
        })
      };
    });
    persistPlans(newPlans);
    
    // Verifica e atualiza status da cidade após mudança
    checkAndUpdateCityStatus(cityId, newPlans);
  };

  const updatePlanPhase = (cityId: number, phaseName: string, updates: any) => {
    const cityName = cities.find(c => c.id === cityId)?.name || cityId;
    console.log(`📅 Fase atualizada em ${cityName} - ${phaseName}:`, updates);
    
    const updatedPlans = plans.map(p => p.cityId === cityId ? { ...p, phases: p.phases.map(ph => ph.name === phaseName ? { ...ph, ...updates } : ph) } : p);
    persistPlans(updatedPlans);
  };

  const updatePlanResults = async (cityId: number, monthKey: string, result: MonthResult) => {
    const cityName = cities.find(c => c.id === cityId)?.name || cityId;
    console.log(`📊 Resultados atualizados em ${cityName} para ${monthKey}:`, result);
    
    const updatedPlans = plans.map(p => p.cityId === cityId ? { ...p, results: { ...p.results, [monthKey]: result } } : p);
    persistPlans(updatedPlans);
    
    // Salvar no backend
    const plan = updatedPlans.find(p => p.cityId === cityId);
    if (plan?.results) {
      await planResultsService.savePlanResults(cityId, plan.results);
    }
  };

  const updatePlanResultsBatch = async (cityId: number, results: { [key: string]: MonthResult }) => {
    const city = cities.find(c => c.id === cityId);
    const cityName = city?.name || String(cityId);
    console.log(`📊 Resultados em lote atualizados em ${cityName}:`, results);
    
    // Verificar se já existe um plano para essa cidade
    const existingPlan = plans.find(p => p.cityId === cityId);
    
    let updatedPlans: CityPlan[];
    if (existingPlan) {
      // Atualizar plano existente
      updatedPlans = plans.map(p => p.cityId === cityId ? { 
          ...p, 
          results: { ...(p.results || {}), ...results } 
      } : p);
    } else {
      // Criar novo plano para a cidade
      const startDate = city?.implementationStartDate || new Date().toISOString().slice(0, 7);
      const newPlan: CityPlan = {
        cityId,
        startDate,
        phases: [],
        results
      };
      updatedPlans = [...plans, newPlan];
      console.log(`📝 Criando novo plano para ${cityName}`);
      
      // Criar planejamento no backend também (tabela Planning)
      try {
        const planningData = {
          cityId,
          title: `Planejamento ${cityName}`,
          description: `Planejamento de expansão para ${cityName}`,
          startDate,
          status: 'active'
        };
        const created = await planningApi.createPlanning(planningData);
        if (created) {
          console.log(`✅ Planejamento criado no backend para ${cityName}`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao criar planejamento no backend para ${cityName}:`, error);
      }
    }
    
    persistPlans(updatedPlans);
    
    // Salvar no backend diretamente (não depende de ter plano local)
    console.log(`💾 Enviando resultados de ${cityName} para o servidor...`);
    const saved = await planResultsService.savePlanResults(cityId, results);
    if (saved) {
      console.log(`✅ Resultados de ${cityName} salvos permanentemente no servidor`);
    } else {
      console.warn(`⚠️ Resultados de ${cityName} salvos localmente. Sincronização com servidor pendente.`);
    }
  };

  const updatePlanRealCosts = async (
    cityId: number, 
    realMonthlyCosts: { [key: string]: { marketingCost: number; operationalCost: number } }
  ) => {
    const cityName = cities.find(c => c.id === cityId)?.name || cityId;
    console.log(`💰 Salvando custos reais em ${cityName}:`, realMonthlyCosts);
    
    // Salvar no backend com os custos reais
    const plan = plans.find(p => p.cityId === cityId);
    // Salvar mesmo se não tiver results ainda - usar objeto vazio como fallback
    const resultsToSave = plan?.results || {};
    
    const saved = await planResultsService.savePlanResults(cityId, resultsToSave, realMonthlyCosts);
    if (saved) {
      console.log(`✅ Custos reais de ${cityName} salvos permanentemente no servidor`);
      
      // Recarregar dados do backend após salvar
      const refreshedData = await planResultsService.getPlanResults(cityId);
      if (refreshedData) {
        const updatedPlans = plans.map(p => {
          if (p.cityId === cityId) {
            return {
              ...p,
              results: refreshedData.results || p.results,
              realMonthlyCosts: refreshedData.realMonthlyCosts || {}
            };
          }
          return p;
        });
        setPlans(updatedPlans);
        console.log(`✅ Dados de ${cityName} recarregados do banco`);
      }
    } else {
      console.error(`❌ Erro ao salvar custos reais de ${cityName}`);
    }
  };

  const updatePlanStartDate = async (cityId: number, newStartDate: string) => {
    const updatedPlans = plans.map(p => p.cityId === cityId ? { ...p, startDate: newStartDate } : p);
    persistPlans(updatedPlans);
    console.log(`📅 Data de início atualizada para ${newStartDate}`);
    
    // Salvar no backend
    await planResultsService.savePlanStartDate(cityId, newStartDate);
  };

  const updateCityImplementationDate = (cityId: number, newDate: string) => {
    const updatedCities = cities.map(c => c.id === cityId ? { ...c, implementationStartDate: newDate } : c );
    setCities(updatedCities);
    // Persistir no backend (upsert da cidade)
    (async () => {
      try {
        const cityToSave = updatedCities.find(c => c.id === cityId);
        if (!cityToSave) return;
        // Garantir formato de data aceito pelo backend: usar ISO (YYYY-MM-DD)
        const safeDate = newDate && newDate.length === 7 ? `${newDate}-01` : newDate;
        const payload = { ...cityToSave, implementationStartDate: safeDate } as any;
        const saved = await upsertCity(payload);
        if (saved) {
          // Atualizar com o que o backend retornou
          setCities(prev => prev.map(c => c.id === cityId ? saved : c));
          console.log(`✅ Data de implementação persistida no backend: ${saved.implementationStartDate}`);
        } else {
          console.warn('⚠️ Falha ao persistir data de implementação no backend');
        }
      } catch (err) {
        console.error('❌ Erro ao salvar data de implementação no backend:', err);
      } finally {
        setSaveCounter(prev => prev + 1);
      }
    })();
    console.log(`📅 Data de implementação atualizada para ${newDate}`);
  };

  return (
    <DataContext.Provider value={{ 
      cities, plans, marketData, isLoading, loadingStatus, isUpdating, warnings, phaseTemplates, tags, responsibles, marketBlocks, saveCounter,
      updateCity, addPlanForCity, deletePlan, updatePlanAction, updatePlanPhase, updatePlanResults, updatePlanResultsBatch, updatePlanStartDate, updateCityImplementationDate, updatePlanRealCosts,
      updatePhaseTemplate: (n, u) => {
          const updated = phaseTemplates.map(t => t.name === n ? {...t, ...u} : t);
          setPhaseTemplates(updated);
          // Dados apenas em memória - recarrega do DEFAULT em cada sessão
          setSaveCounter(prev => prev + 1);
      },
      resetPhaseTemplates: () => {
          setPhaseTemplates(DEFAULT_PHASE_TEMPLATES);
          setSaveCounter(prev => prev + 1);
      },
      addTag: (t) => {
          const updated = [...tags, { ...t, id: Date.now().toString() }];
          setTags(updated);
          // TODO: Criar tabela no PostgreSQL para tags se necessário
          setSaveCounter(prev => prev + 1);
      },
      updateTag: (id, u) => {
          const updated = tags.map(t => t.id === id ? {...t, ...u} : t);
          setTags(updated);
          setSaveCounter(prev => prev + 1);
      },
      deleteTag: (id) => {
          const updated = tags.filter(t => t.id !== id);
          setTags(updated);
          setSaveCounter(prev => prev + 1);
      },
      addResponsible: (r) => {
          const updated = [...responsibles, { ...r, id: Date.now().toString(), initials: getInitials(r.name) }];
          setResponsibles(updated);
          // TODO: Criar tabela no PostgreSQL para responsáveis se necessário
          setSaveCounter(prev => prev + 1);
      },
      updateResponsible: (id, u) => {
          const updated = responsibles.map(r => r.id === id ? {...r, ...u, initials: getInitials(u.name || r.name)} : r);
          setResponsibles(updated);
          setSaveCounter(prev => prev + 1);
      },
      deleteResponsible: (id) => {
          const updated = responsibles.filter(r => r.id !== id);
          setResponsibles(updated);
          setSaveCounter(prev => prev + 1);
      },
      getCityMarketData, saveCityMarketData, addCityToIntelligence, removeCityFromIntelligence,
      addMarketBlock, updateMarketBlock, deleteMarketBlock, moveCityToBlock, addCitiesToBlock
    }}>
      {children}
    </DataContext.Provider>
  );
};

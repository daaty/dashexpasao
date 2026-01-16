
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { City, CityPlan, CityStatus, PlanningPhase, PlanningAction, PhaseTemplate, Tag, Responsible, CityMarketData, MarketBlock, MonthResult } from '../types';
import { internalCitiesData } from '../services/internalData';
import { fetchSingleCityUpdate, fetchInitialData } from '../services/ibgeService';
import { fetchAllCities } from '../services/cityApiService';
import * as planningApi from '../services/planningApiService';
import * as planResultsService from '../services/planResultsService';


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
  updatePlanStartDate: (cityId: number, newStartDate: string) => void;
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
  addMarketBlock: (name: string) => void;
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
  updatePlanAction: () => {},
  updatePlanPhase: () => {},
  updatePlanResults: () => {},
  updatePlanResultsBatch: () => {},
  updatePlanStartDate: () => {},
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
  addMarketBlock: () => {},
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

  // 1. Carregar do LocalStorage
  useEffect(() => {
    const load = (key: string, setter: any, defaultVal?: any) => {
        const stored = localStorage.getItem(key);
        if (stored) {
            try { 
                const parsed = JSON.parse(stored);
                setter(parsed);
                console.log(`✅ Carregado ${key}:`, parsed.length || Object.keys(parsed).length || 'dados');
            } catch (e) { 
                console.error(`❌ Erro ao carregar ${key}:`, e);
                if(defaultVal) setter(defaultVal); 
            }
        } else if (defaultVal) {
            setter(defaultVal);
            localStorage.setItem(key, JSON.stringify(defaultVal));
        }
    };

    load('urban_phase_templates', setPhaseTemplates, DEFAULT_PHASE_TEMPLATES);
    load('urban_planning_tags', setTags, DEFAULT_TAGS);
    load('urban_planning_responsibles', setResponsibles, DEFAULT_RESPONSIBLES);
    load('urban_market_blocks', setMarketBlocks, []);
    load('urban_market_data', setMarketData, []);
    load('urban_plans', setPlans, []);
  }, []);

  // Auto-salvar market blocks quando houver mudanças
  useEffect(() => {
    if (marketBlocks.length > 0) {
      localStorage.setItem('urban_market_blocks', JSON.stringify(marketBlocks));
    }
  }, [marketBlocks]);

  // Auto-salvar market data quando houver mudanças
  useEffect(() => {
    if (marketData.length > 0) {
      localStorage.setItem('urban_market_data', JSON.stringify(marketData));
    }
  }, [marketData]);

  // 2. Fetch dados do backend (cidades e planejamentos)
  useEffect(() => {
    const initData = async () => {
        setIsLoading(true);
        setLoadingStatus('Conectando ao servidor...');
        
        // Limpar cache de cidades antigas do localStorage (apenas na primeira vez)
        const cacheVersion = localStorage.getItem('urban_cities_cache_version');
        if (cacheVersion !== '2.0') {
            console.log('🧹 Limpando cache antigo de cidades...');
            localStorage.removeItem('urban_cities');
            localStorage.setItem('urban_cities_cache_version', '2.0');
        }
        
        try {
            // Tentar buscar cidades do backend (Aumentando limite para garantir que todas venham)
            setLoadingStatus('Carregando cidades do banco de dados...');
            const { cities: backendCities } = await fetchAllCities({ limit: 1000 });
            
            if (backendCities && backendCities.length > 0) {
                console.log('✅ Cidades carregadas do backend:', backendCities.length);
                setCities(backendCities);
            } else {
                // Fallback para dados internos
                setLoadingStatus('Usando dados locais...');
                console.warn('⚠️ Backend sem dados, usando fallback interno');
                setCities(internalCitiesData);
            }
            
            // Buscar planejamentos do backend
            setLoadingStatus('Carregando planejamentos...');
            const backendPlans = await planningApi.getAllPlannings();
            
            // Carregar local para fusão
            const savedPlans = JSON.parse(localStorage.getItem('urban_plans') || '[]');

            if (backendPlans && backendPlans.length > 0) {
                console.log('✅ Planejamentos carregados do backend:', backendPlans.length);
                // Converter formato do backend para o formato do frontend e mesclar com local
                const convertedPlansPromises = backendPlans.map(async (plan: any) => {
                    const localMatch = savedPlans.find((p: any) => p.cityId === plan.cityId);
                    
                    // Buscar resultados salvos do backend
                    const backendData = await planResultsService.getPlanResults(plan.cityId);
                    const resultsToUse = backendData?.results || localMatch?.results || {};
                    const startDateResult = backendData?.startDate;
                    
                    // Se tiver dados locais de fases, usa. Senão, inicializa padrão.
                    let phasesToUse = localMatch?.phases;
                    if (!phasesToUse || phasesToUse.length === 0) {
                         const now = new Date().toISOString();
                         phasesToUse = DEFAULT_PHASE_TEMPLATES.map((t, phaseIndex) => ({
                            name: t.name,
                            startDate: now,
                            estimatedCompletionDate: undefined,
                            completionDate: undefined,
                            actions: t.actions.map((desc, i) => ({ id: `${Date.now()}-${phaseIndex}-${i}`, description: desc, completed: false, createdAt: now, tagIds: [] }))
                        }));
                    }

                    return {
                        cityId: plan.cityId,
                        startDate: startDateResult || (plan.startDate ? String(plan.startDate).slice(0, 7) : (localMatch?.startDate || new Date().toISOString().slice(0, 7))),
                        phases: phasesToUse,
                        results: resultsToUse
                    };
                });
                
                const convertedPlans = await Promise.all(convertedPlansPromises);
                setPlans(convertedPlans);
                
                // Salvar no localStorage como cache
                localStorage.setItem('urban_plans', JSON.stringify(convertedPlans));
            } else {
                // Tentar carregar do localStorage como fallback
                if (savedPlans.length > 0) {
                    console.log('📦 Planejamentos carregados do localStorage');
                    setPlans(savedPlans);
                }
            }
            
            setLoadingStatus('Dados carregados com sucesso!');
            setWarnings(["✅ Conectado ao banco de dados", "Dados sincronizados", "Sistema operacional"]);
            
        } catch (e) {
            console.error("❌ Erro ao carregar do backend, usando fallback:", e);
            setLoadingStatus('Erro na conexão, usando dados locais...');
            
            // Fallback completo para dados locais
            const realCities = await fetchInitialData((status) => setLoadingStatus(status));
            const savedStatuses = JSON.parse(localStorage.getItem('urban_cities_status') || '{}');
            const savedPlans = JSON.parse(localStorage.getItem('urban_plans') || '[]');

            const mergedCities = realCities.map(realCity => {
                const userStatus = savedStatuses[realCity.id];
                const internal = internalCitiesData.find(i => i.id === realCity.id);
                
                if (internal) {
                    return {
                        ...realCity,
                        status: userStatus || internal.status,
                        implementationStartDate: internal.implementationStartDate,
                        monthlyRevenue: internal.monthlyRevenue,
                        mayor: internal.mayor || realCity.mayor,
                        gentilic: internal.gentilic || realCity.gentilic,
                        anniversary: internal.anniversary || realCity.anniversary
                    };
                }
                return { ...realCity, status: userStatus || CityStatus.NotServed };
            });
            
            setCities(mergedCities);
            if (savedPlans.length > 0) setPlans(savedPlans);
            setWarnings(["⚠️ Modo offline", "Dados salvos localmente"]);
        } finally {
            setIsLoading(false);
        }
    };
    initData();
  }, []);

  const persistCityStatus = (cityId: number, status: CityStatus) => {
      const saved = JSON.parse(localStorage.getItem('urban_cities_status') || '{}');
      saved[cityId] = status;
      localStorage.setItem('urban_cities_status', JSON.stringify(saved));
      setSaveCounter(prev => prev + 1);
      console.log(`💾 Status salvo para cidade ${cityId}:`, status);
  };

  const persistPlans = (newPlans: CityPlan[]) => {
      localStorage.setItem('urban_plans', JSON.stringify(newPlans));
      setPlans(newPlans);
      setSaveCounter(prev => prev + 1);
      console.log(`💾 ${newPlans.length} planejamento(s) salvo(s) no localStorage`);
      
      // Sincronizar com backend em background (sem bloquear a UI)
      planResultsService.syncAllPlans(newPlans)
        .then(() => {
          localStorage.setItem('last_sync_time', new Date().toISOString());
          console.log('🔄 Sincronização automática com backend concluída');
        })
        .catch(err => {
          console.warn('⚠️ Sincronização automática com backend falhou. Dados salvos localmente.', err);
        });
  };

  const persistCities = (newCities: City[]) => {
      // Salvar status de todas as cidades
      const statusMap: { [key: number]: CityStatus } = {};
      newCities.forEach(city => {
          statusMap[city.id] = city.status;
      });
      localStorage.setItem('urban_cities_status', JSON.stringify(statusMap));
      setSaveCounter(prev => prev + 1);
      console.log(`💾 Status de ${newCities.length} cidades salvo`);
  };

  const updateCity = async (cityId: number) => {
    setIsUpdating(cityId);
    try {
      const cityToUpdate = cities.find(c => c.id === cityId);
      if (!cityToUpdate) throw new Error("City not found");
      const updatedData = await fetchSingleCityUpdate(cityToUpdate);
      setCities(prev => prev.map(c => c.id === cityId ? updatedData : c));
    } finally { setIsUpdating(null); }
  };

  const addPlanForCity = async (cityId: number) => {
    if (plans.some(p => p.cityId === cityId)) {
        console.log('⚠️ Planejamento já existe para cidade', cityId);
        return;
    }
    
    const city = cities.find(c => c.id === cityId);
    if (!city) {
        console.error('❌ Cidade não encontrada:', cityId);
        return;
    }
    
    const now = new Date().toISOString();
    const newPlan: CityPlan = {
        cityId,
        startDate: now.slice(0, 7),
        phases: DEFAULT_PHASE_TEMPLATES.map((t, phaseIndex) => ({
            name: t.name,
            startDate: now,
            actions: t.actions.map((desc, i) => ({ id: `${Date.now()}-${phaseIndex}-${i}`, description: desc, completed: false, createdAt: now, tagIds: [] }))
        }))
    };
    
    console.log('🆕 Criando novo planejamento para:', city.name);
    
    try {
        // Tentar salvar no backend
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
        console.log('✅ Planejamento salvo no backend:', savedPlan);
        
    } catch (error) {
        console.error('❌ Erro ao salvar no backend, salvando localmente:', error);
    }
    
    // Salvar localmente (sempre, como backup)
    const updatedPlans = [...plans, newPlan];
    persistPlans(updatedPlans);
    
    // Atualizar status da cidade
    const updatedCities = cities.map(c => {
        if (c.id === cityId) {
            persistCityStatus(cityId, CityStatus.Planning);
            return { ...c, status: CityStatus.Planning };
        }
        return c;
    });
    setCities(updatedCities);
    persistCities(updatedCities);
    
    console.log('✅ Planejamento criado e salvo com sucesso');
  };

  const saveCityMarketData = (data: CityMarketData) => {
      const cityName = cities.find(c => c.id === data.cityId)?.name || data.cityId;
      setMarketData(prev => {
          const updated = [...prev.filter(d => d.cityId !== data.cityId), { ...data, updatedAt: new Date().toISOString() }];
          localStorage.setItem('urban_market_data', JSON.stringify(updated));
          setSaveCounter(prevCounter => prevCounter + 1);
          console.log(`💾 Dados de mercado salvos para ${cityName}:`, updated.length, 'cidades');
          return updated;
      });
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

  const removeCityFromIntelligence = (cityId: number) => {
      setMarketBlocks(prev => {
          const updated = prev.map(b => ({ ...b, cityIds: b.cityIds.filter(id => id !== cityId) }));
          localStorage.setItem('urban_market_blocks', JSON.stringify(updated));
          return updated;
      });
      setMarketData(prev => {
          const updated = prev.filter(d => d.cityId !== cityId);
          localStorage.setItem('urban_market_data', JSON.stringify(updated));
          return updated;
      });
      const updatedPlans = plans.filter(p => p.cityId !== cityId);
      persistPlans(updatedPlans);
      persistCityStatus(cityId, CityStatus.NotServed);
      setCities(prev => prev.map(c => c.id === cityId ? { ...c, status: CityStatus.NotServed } : c));
  };
  
  const addMarketBlock = (name: string) => {
      const newBlock = { id: Date.now().toString(), name, cityIds: [] };
      const updated = [...marketBlocks, newBlock];
      setMarketBlocks(updated);
      localStorage.setItem('urban_market_blocks', JSON.stringify(updated));
      console.log(`💾 Bloco criado: ${name}`);
  };

  const updateMarketBlock = (id: string, name: string) => {
       const updated = marketBlocks.map(b => b.id === id ? { ...b, name } : b);
       setMarketBlocks(updated);
       localStorage.setItem('urban_market_blocks', JSON.stringify(updated));
       console.log(`💾 Bloco atualizado: ${name}`);
  };

  const deleteMarketBlock = (id: string) => {
       const blockName = marketBlocks.find(b => b.id === id)?.name;
       const updated = marketBlocks.filter(b => b.id !== id);
       setMarketBlocks(updated);
       localStorage.setItem('urban_market_blocks', JSON.stringify(updated));
       console.log(`💾 Bloco deletado: ${blockName}`);
  };

  const moveCityToBlock = (cityId: number, blockId: string | null) => {
      const cityName = cities.find(c => c.id === cityId)?.name || cityId;
      const blockName = blockId ? marketBlocks.find(b => b.id === blockId)?.name : 'nenhum bloco';
      
      const updated = marketBlocks.map(block => {
          if (block.id === blockId) return block.cityIds.includes(cityId) ? block : { ...block, cityIds: [...block.cityIds, cityId] };
          return { ...block, cityIds: block.cityIds.filter(id => id !== cityId) };
      });
      setMarketBlocks(updated);
      localStorage.setItem('urban_market_blocks', JSON.stringify(updated));
      console.log(`💾 Cidade ${cityName} movida para ${blockName}`);
      
      if (blockId) addCityToIntelligence(cityId);
  };

  const addCitiesToBlock = (cityIds: number[], blockId: string) => {
      const blockName = marketBlocks.find(b => b.id === blockId)?.name;
      const cityNames = cityIds.map(id => cities.find(c => c.id === id)?.name).filter(Boolean);
      
      const updated = marketBlocks.map(block => {
          if (block.id === blockId) return { ...block, cityIds: [...new Set([...block.cityIds, ...cityIds])] };
          return { ...block, cityIds: block.cityIds.filter(id => !cityIds.includes(id)) };
      });
      setMarketBlocks(updated);
      localStorage.setItem('urban_market_blocks', JSON.stringify(updated));
      console.log(`💾 ${cityIds.length} cidade(s) adicionadas ao bloco ${blockName}:`, cityNames);
      
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
    } else if (isReadyForImplementation && !allPhasesComplete && currentCity.status !== CityStatus.Implementation) {
      newStatus = CityStatus.Implementation;
      updateCityStatus(cityId, newStatus);
    }
  };

  const updateCityStatus = (cityId: number, status: CityStatus) => {
    const cityName = cities.find(c => c.id === cityId)?.name || cityId;
    const statusMap: { [key: number]: CityStatus } = JSON.parse(localStorage.getItem('urban_cities_status') || '{}');
    statusMap[cityId] = status;
    localStorage.setItem('urban_cities_status', JSON.stringify(statusMap));
    console.log(`💾 Status atualizado para ${cityName}: ${status}`);
    
    const updatedCities = cities.map(city => city.id === cityId ? { ...city, status } : city);
    setCities(updatedCities);
    persistCities(updatedCities);
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
    const cityName = cities.find(c => c.id === cityId)?.name || cityId;
    console.log(`📊 Resultados em lote atualizados em ${cityName}:`, results);
    
    const updatedPlans = plans.map(p => p.cityId === cityId ? { 
        ...p, 
        results: { ...(p.results || {}), ...results } 
    } : p);
    persistPlans(updatedPlans);
    
    // Salvar no backend
    const plan = updatedPlans.find(p => p.cityId === cityId);
    if (plan?.results) {
      const saved = await planResultsService.savePlanResults(cityId, plan.results);
      if (saved) {
        console.log(`✅ Resultados de ${cityName} salvos permanentemente no servidor`);
      } else {
        console.warn(`⚠️ Resultados de ${cityName} salvos localmente. Sincronização com servidor pendente.`);
      }
    }
  };

  const updatePlanStartDate = async (cityId: number, newStartDate: string) => {
    const updatedPlans = plans.map(p => p.cityId === cityId ? { ...p, startDate: newStartDate } : p);
    persistPlans(updatedPlans);
    console.log(`📅 Data de início atualizada para ${newStartDate}`);
    
    // Salvar no backend
    await planResultsService.savePlanStartDate(cityId, newStartDate);
  };

  return (
    <DataContext.Provider value={{ 
      cities, plans, marketData, isLoading, loadingStatus, isUpdating, warnings, phaseTemplates, tags, responsibles, marketBlocks, saveCounter,
      updateCity, addPlanForCity, updatePlanAction, updatePlanPhase, updatePlanResults, updatePlanResultsBatch, updatePlanStartDate,
      updatePhaseTemplate: (n, u) => {
          const updated = phaseTemplates.map(t => t.name === n ? {...t, ...u} : t);
          setPhaseTemplates(updated);
          localStorage.setItem('urban_phase_templates', JSON.stringify(updated));
          setSaveCounter(prev => prev + 1);
      },
      resetPhaseTemplates: () => {
          setPhaseTemplates(DEFAULT_PHASE_TEMPLATES);
          localStorage.setItem('urban_phase_templates', JSON.stringify(DEFAULT_PHASE_TEMPLATES));
          setSaveCounter(prev => prev + 1);
      },
      addTag: (t) => {
          const updated = [...tags, { ...t, id: Date.now().toString() }];
          setTags(updated);
          localStorage.setItem('urban_planning_tags', JSON.stringify(updated));
          setSaveCounter(prev => prev + 1);
      },
      updateTag: (id, u) => {
          const updated = tags.map(t => t.id === id ? {...t, ...u} : t);
          setTags(updated);
          localStorage.setItem('urban_planning_tags', JSON.stringify(updated));
          setSaveCounter(prev => prev + 1);
      },
      deleteTag: (id) => {
          const updated = tags.filter(t => t.id !== id);
          setTags(updated);
          localStorage.setItem('urban_planning_tags', JSON.stringify(updated));
          setSaveCounter(prev => prev + 1);
      },
      addResponsible: (r) => {
          const updated = [...responsibles, { ...r, id: Date.now().toString(), initials: getInitials(r.name) }];
          setResponsibles(updated);
          localStorage.setItem('urban_planning_responsibles', JSON.stringify(updated));
          setSaveCounter(prev => prev + 1);
      },
      updateResponsible: (id, u) => {
          const updated = responsibles.map(r => r.id === id ? {...r, ...u, initials: getInitials(u.name || r.name)} : r);
          setResponsibles(updated);
          localStorage.setItem('urban_planning_responsibles', JSON.stringify(updated));
          setSaveCounter(prev => prev + 1);
      },
      deleteResponsible: (id) => {
          const updated = responsibles.filter(r => r.id !== id);
          setResponsibles(updated);
          localStorage.setItem('urban_planning_responsibles', JSON.stringify(updated));
          setSaveCounter(prev => prev + 1);
      },
      getCityMarketData, saveCityMarketData, addCityToIntelligence, removeCityFromIntelligence,
      addMarketBlock, updateMarketBlock, deleteMarketBlock, moveCityToBlock, addCitiesToBlock
    }}>
      {children}
    </DataContext.Provider>
  );
};

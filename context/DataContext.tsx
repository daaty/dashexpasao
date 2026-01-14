
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { City, CityPlan, CityStatus, PlanningPhase, PlanningAction, PhaseTemplate, Tag, Responsible, CityMarketData, MarketBlock, MonthResult } from '../types';
import { internalCitiesData } from '../services/internalData';
import { fetchSingleCityUpdate, fetchInitialData } from '../services/ibgeService';
import { fetchAllCities } from '../services/cityApiService';
import * as planningApi from '../services/planningApiService';


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
  updateCity: async () => {},
  addPlanForCity: () => {},
  updatePlanAction: () => {},
  updatePlanPhase: () => {},
  updatePlanResults: () => {},
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

  // 1. Carregar do LocalStorage
  useEffect(() => {
    const load = (key: string, setter: any, defaultVal?: any) => {
        const stored = localStorage.getItem(key);
        if (stored) {
            try { setter(JSON.parse(stored)); } catch (e) { if(defaultVal) setter(defaultVal); }
        } else if (defaultVal) {
            setter(defaultVal);
        }
    };

    load('urban_phase_templates', setPhaseTemplates, DEFAULT_PHASE_TEMPLATES);
    load('urban_planning_tags', setTags, DEFAULT_TAGS);
    load('urban_planning_responsibles', setResponsibles, DEFAULT_RESPONSIBLES);
    load('urban_market_blocks', setMarketBlocks);
    load('urban_market_data', setMarketData);
    load('urban_plans', setPlans);
  }, []);

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
            // Tentar buscar cidades do backend
            setLoadingStatus('Carregando cidades do banco de dados...');
            const { cities: backendCities } = await fetchAllCities({ limit: 100 });
            
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
            if (backendPlans && backendPlans.length > 0) {
                console.log('✅ Planejamentos carregados do backend:', backendPlans.length);
                // Converter formato do backend para o formato do frontend
                const convertedPlans = backendPlans.map((plan: any) => ({
                    cityId: plan.cityId,
                    startDate: plan.startDate,
                    phases: [] // Manter estrutura local por enquanto
                }));
                setPlans(convertedPlans);
            } else {
                // Tentar carregar do localStorage como fallback
                const savedPlans = JSON.parse(localStorage.getItem('urban_plans') || '[]');
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
  };

  const persistPlans = (newPlans: CityPlan[]) => {
      localStorage.setItem('urban_plans', JSON.stringify(newPlans));
      setPlans(newPlans);
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
    if (plans.some(p => p.cityId === cityId)) return;
    
    const city = cities.find(c => c.id === cityId);
    if (!city) return;
    
    const now = new Date().toISOString();
    const newPlan: CityPlan = {
        cityId,
        startDate: now.slice(0, 7),
        phases: DEFAULT_PHASE_TEMPLATES.map(t => ({
            name: t.name,
            startDate: now,
            actions: t.actions.map((desc, i) => ({ id: `${Date.now()}-${i}`, description: desc, completed: false, createdAt: now, tagIds: [] }))
        }))
    };
    
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
    persistPlans([...plans, newPlan]);
    
    setCities(prev => prev.map(c => {
        if (c.id === cityId) {
            persistCityStatus(cityId, CityStatus.Planning);
            return { ...c, status: CityStatus.Planning };
        }
        return c;
    }));
  };

  const saveCityMarketData = (data: CityMarketData) => {
      setMarketData(prev => {
          const updated = [...prev.filter(d => d.cityId !== data.cityId), { ...data, updatedAt: new Date().toISOString() }];
          localStorage.setItem('urban_market_data', JSON.stringify(updated));
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
      const updated = [...marketBlocks, { id: Date.now().toString(), name, cityIds: [] }];
      setMarketBlocks(updated);
      localStorage.setItem('urban_market_blocks', JSON.stringify(updated));
  };

  const updateMarketBlock = (id: string, name: string) => {
       const updated = marketBlocks.map(b => b.id === id ? { ...b, name } : b);
       setMarketBlocks(updated);
       localStorage.setItem('urban_market_blocks', JSON.stringify(updated));
  };

  const deleteMarketBlock = (id: string) => {
       const updated = marketBlocks.filter(b => b.id !== id);
       setMarketBlocks(updated);
       localStorage.setItem('urban_market_blocks', JSON.stringify(updated));
  };

  const moveCityToBlock = (cityId: number, blockId: string | null) => {
      const updated = marketBlocks.map(block => {
          if (block.id === blockId) return block.cityIds.includes(cityId) ? block : { ...block, cityIds: [...block.cityIds, cityId] };
          return { ...block, cityIds: block.cityIds.filter(id => id !== cityId) };
      });
      setMarketBlocks(updated);
      localStorage.setItem('urban_market_blocks', JSON.stringify(updated));
      if (blockId) addCityToIntelligence(cityId);
  };

  const addCitiesToBlock = (cityIds: number[], blockId: string) => {
      const updated = marketBlocks.map(block => {
          if (block.id === blockId) return { ...block, cityIds: [...new Set([...block.cityIds, ...cityIds])] };
          return { ...block, cityIds: block.cityIds.filter(id => !cityIds.includes(id)) };
      });
      setMarketBlocks(updated);
      localStorage.setItem('urban_market_blocks', JSON.stringify(updated));
      cityIds.forEach(id => addCityToIntelligence(id));
  };

  const updatePlanAction = (cityId: number, phaseName: string, actionId: string, updates: any) => {
    const newPlans = plans.map(plan => {
      if (plan.cityId !== cityId) return plan;
      return {
        ...plan,
        phases: plan.phases.map(phase => {
          if (phase.name !== phaseName) return phase;
          if (updates.delete) return { ...phase, actions: phase.actions.filter(a => a.id !== actionId) };
          if (actionId === '') {
             const newAction = { id: Date.now().toString(), description: updates.description || 'Nova Ação', completed: false, createdAt: new Date().toISOString(), tagIds: [], ...updates };
             return { ...phase, actions: [...phase.actions, newAction] };
          }
          return { ...phase, actions: phase.actions.map(action => action.id === actionId ? { ...action, ...updates } : action) };
        })
      };
    });
    persistPlans(newPlans);
  };

  const updatePlanPhase = (cityId: number, phaseName: string, updates: any) => {
    persistPlans(plans.map(p => p.cityId === cityId ? { ...p, phases: p.phases.map(ph => ph.name === phaseName ? { ...ph, ...updates } : ph) } : p));
  };

  const updatePlanResults = (cityId: number, monthKey: string, result: MonthResult) => {
    persistPlans(plans.map(p => p.cityId === cityId ? { ...p, results: { ...p.results, [monthKey]: result } } : p));
  };

  return (
    <DataContext.Provider value={{ 
      cities, plans, marketData, isLoading, loadingStatus, isUpdating, warnings, phaseTemplates, tags, responsibles, marketBlocks,
      updateCity, addPlanForCity, updatePlanAction, updatePlanPhase, updatePlanResults,
      updatePhaseTemplate: (n, u) => {
          const updated = phaseTemplates.map(t => t.name === n ? {...t, ...u} : t);
          setPhaseTemplates(updated);
          localStorage.setItem('urban_phase_templates', JSON.stringify(updated));
      },
      resetPhaseTemplates: () => {
          setPhaseTemplates(DEFAULT_PHASE_TEMPLATES);
          localStorage.setItem('urban_phase_templates', JSON.stringify(DEFAULT_PHASE_TEMPLATES));
      },
      addTag: (t) => {
          const updated = [...tags, { ...t, id: Date.now().toString() }];
          setTags(updated);
          localStorage.setItem('urban_planning_tags', JSON.stringify(updated));
      },
      updateTag: (id, u) => {
          const updated = tags.map(t => t.id === id ? {...t, ...u} : t);
          setTags(updated);
          localStorage.setItem('urban_planning_tags', JSON.stringify(updated));
      },
      deleteTag: (id) => {
          const updated = tags.filter(t => t.id !== id);
          setTags(updated);
          localStorage.setItem('urban_planning_tags', JSON.stringify(updated));
      },
      addResponsible: (r) => {
          const updated = [...responsibles, { ...r, id: Date.now().toString(), initials: getInitials(r.name) }];
          setResponsibles(updated);
          localStorage.setItem('urban_planning_responsibles', JSON.stringify(updated));
      },
      updateResponsible: (id, u) => {
          const updated = responsibles.map(r => r.id === id ? {...r, ...u, initials: getInitials(u.name || r.name)} : r);
          setResponsibles(updated);
          localStorage.setItem('urban_planning_responsibles', JSON.stringify(updated));
      },
      deleteResponsible: (id) => {
          const updated = responsibles.filter(r => r.id !== id);
          setResponsibles(updated);
          localStorage.setItem('urban_planning_responsibles', JSON.stringify(updated));
      },
      getCityMarketData, saveCityMarketData, addCityToIntelligence, removeCityFromIntelligence,
      addMarketBlock, updateMarketBlock, deleteMarketBlock, moveCityToBlock, addCitiesToBlock
    }}>
      {children}
    </DataContext.Provider>
  );
};

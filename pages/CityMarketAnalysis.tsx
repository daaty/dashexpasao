
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import Card from '../components/ui/Card';
import { FiArrowLeft, FiSave, FiTrendingUp, FiUsers, FiTarget, FiShield, FiPlus, FiTrash2, FiEdit2, FiPhone, FiMail, FiUser, FiGlobe, FiDollarSign, FiCalendar, FiCheck } from 'react-icons/fi';
import { CityMarketData, MarketCompetitor, StakeholderContact, MonthResult } from '../types';
import { getGradualMonthlyGoal } from '../services/calculationService';
import { PRICE_PER_RIDE } from '../constants';
import * as planResultsService from '../services/planResultsService';

// Definição das tabs
type TabId = 'visao-geral' | 'concorrencia' | 'stakeholders' | 'swot' | 'projecoes';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    color: string;
}

const TABS: Tab[] = [
    { id: 'visao-geral', label: 'Visão Geral', icon: <FiTrendingUp size={16} />, color: '#3b82f6' },
    { id: 'concorrencia', label: 'Concorrência', icon: <FiTarget size={16} />, color: '#f62718' },
    { id: 'stakeholders', label: 'Stakeholders', icon: <FiUsers size={16} />, color: '#17a2b8' },
    { id: 'swot', label: 'SWOT', icon: <FiShield size={16} />, color: '#ffc107' },
    { id: 'projecoes', label: 'Projeções', icon: <FiDollarSign size={16} />, color: '#10b981' },
];

const CityMarketAnalysis: React.FC = () => {
    const { cityId } = useParams<{ cityId: string }>();
    const navigate = useNavigate();
    const { cities, plans, getCityMarketData, saveCityMarketData, updatePlanResultsBatch } = useContext(DataContext);
    
    // Tab state
    const [activeTab, setActiveTab] = useState<TabId>('visao-geral');

    const city = cities.find(c => c.id === Number(cityId));
    const cityPlan = plans.find(p => p.cityId === Number(cityId));
    
    // Form States
    const [formData, setFormData] = useState<CityMarketData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // Projection States - custos projetados por mês (chave: Mes1, Mes2, etc.)
    const [projectedCosts, setProjectedCosts] = useState<{ [monthKey: string]: { marketingCost: number; operationalCost: number } }>({});

    // Estados para CPA e OPS - novos campos por mês
    const [cpaValues, setCpaValues] = useState<{ [monthKey: string]: number }>({});
    const [opsValues, setOpsValues] = useState<{ [monthKey: string]: number }>({});
    
    // Estado para resultados carregados diretamente do backend (independente do cityPlan)
    const [backendResults, setBackendResults] = useState<{ [key: string]: MonthResult } | null>(null);

    // Initial Load
    useEffect(() => {
        if (cityId) {
            const data = getCityMarketData(Number(cityId));
            setFormData(data);
        }
    }, [cityId, getCityMarketData]);
    
    // Carregar resultados diretamente do backend (independente de ter Planning ou não)
    useEffect(() => {
        const loadBackendResults = async () => {
            if (!cityId) return;
            
            try {
                const data = await planResultsService.getPlanResults(Number(cityId));
                if (data?.results) {
                    console.log(`✅ Resultados carregados do backend para cidade ${cityId}:`, Object.keys(data.results).length, 'meses');
                    setBackendResults(data.results);
                }
            } catch (error) {
                console.warn('⚠️ Erro ao carregar resultados do backend:', error);
            }
        };
        
        loadBackendResults();
    }, [cityId]);
    
    // Usar resultados do backend OU do cityPlan (fallback)
    const effectiveResults = backendResults || cityPlan?.results || null;
    
    // Carregar custos projetados quando os resultados estiverem disponíveis
    useEffect(() => {
        if (effectiveResults) {
            const costs: { [key: string]: { marketingCost: number; operationalCost: number } } = {};
            const loadedCPA: { [key: string]: number } = {};
            const loadedOPS: { [key: string]: number } = {};
            let hasSavedCpaOps = false;
            
            Object.entries(effectiveResults).forEach(([key, result]) => {
                // Os dados são salvos com chave Mes1, Mes2, etc.
                costs[key] = {
                    marketingCost: result.marketingCost || 0,
                    operationalCost: result.operationalCost || 0
                };
                
                // Carregar CPA/OPS salvos se existirem
                if (result.cpaPerRide !== undefined && result.cpaPerRide !== 0) {
                    loadedCPA[key] = result.cpaPerRide;
                    hasSavedCpaOps = true;
                }
                if (result.opsPerRide !== undefined && result.opsPerRide !== 0) {
                    loadedOPS[key] = result.opsPerRide;
                    hasSavedCpaOps = true;
                }
            });
            
            setProjectedCosts(costs);
            
            // Se existem valores CPA/OPS salvos, usá-los
            if (hasSavedCpaOps) {
                setCpaValues(loadedCPA);
                setOpsValues(loadedOPS);
            }
        }
    }, [effectiveResults]);

    // Inicializar dados CPA/OPS para cidades específicas (apenas se não houver dados salvos)
    useEffect(() => {
        // Verificar se há dados CPA/OPS já salvos
        const hasSavedCpaOps = effectiveResults && Object.values(effectiveResults).some(
            result => result.cpaPerRide !== undefined && result.cpaPerRide !== 0
        );
        
        // Só inicializar com dados padrão se NÃO houver dados salvos E os estados estiverem vazios
        if (city && !hasSavedCpaOps && !Object.keys(cpaValues).length && !Object.keys(opsValues).length) {
            // Lista das 7 cidades mencionadas com valores CPA/OPS baseados na população e características econômicas
            const cityProjectionData = {
                // Cuiabá (população: 650,912, alta renda)
                5103403: {
                    cpa: [12, 10, 8, 7, 6, 5.5, 5, 5, 5, 5, 5, 5], // Reduz CPA conforme cidade amadurece
                    ops: [4.5, 4.2, 4.0, 3.8, 3.5, 3.2, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0] // OPS também reduz
                },
                // Cáceres (população: 95,448, renda média)
                5102504: {
                    cpa: [8, 7, 6, 5.5, 5, 4.5, 4, 4, 4, 4, 4, 4],
                    ops: [3.8, 3.5, 3.2, 3.0, 2.8, 2.5, 2.3, 2.3, 2.3, 2.3, 2.3, 2.3]
                },
                // Chapada dos Guimarães (população: 18,806, turística)
                5103007: {
                    cpa: [15, 12, 10, 8, 7, 6, 5.5, 5, 5, 5, 5, 5], // CPA maior por ser mercado turístico
                    ops: [5.0, 4.5, 4.0, 3.5, 3.2, 3.0, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8]
                },
                // Poconé (população: 31,247, renda baixa)
                5106505: {
                    cpa: [6, 5.5, 5, 4.5, 4, 3.5, 3.2, 3, 3, 3, 3, 3],
                    ops: [3.2, 3.0, 2.8, 2.5, 2.3, 2.0, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8]
                },
                // Rosário Oeste (população: 15,638, renda baixa)
                5107701: {
                    cpa: [7, 6, 5.5, 5, 4.5, 4, 3.5, 3.2, 3.2, 3.2, 3.2, 3.2],
                    ops: [3.5, 3.2, 3.0, 2.8, 2.5, 2.2, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0]
                },
                // Nossa Senhora do Livramento (população: 12,940, renda baixa)
                5106109: {
                    cpa: [6.5, 5.8, 5.2, 4.8, 4.2, 3.8, 3.5, 3.2, 3.2, 3.2, 3.2, 3.2],
                    ops: [3.3, 3.0, 2.8, 2.5, 2.2, 2.0, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8]
                },
                // Santo Antônio de Leverger (população: 15,472, renda baixa)
                5107800: {
                    cpa: [7.2, 6.5, 5.8, 5.2, 4.8, 4.2, 3.8, 3.5, 3.5, 3.5, 3.5, 3.5],
                    ops: [3.6, 3.3, 3.0, 2.8, 2.5, 2.2, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0]
                }
            };

            const cityData = cityProjectionData[city.id as keyof typeof cityProjectionData];
            if (cityData) {
                const initialCPA: { [monthKey: string]: number } = {};
                const initialOPS: { [monthKey: string]: number } = {};

                // Preencher 12 meses com dados
                for (let i = 0; i < 12; i++) {
                    const monthKey = `Mes${i + 1}`;
                    initialCPA[monthKey] = cityData.cpa[i];
                    initialOPS[monthKey] = cityData.ops[i];
                }

                setCpaValues(initialCPA);
                setOpsValues(initialOPS);

                // Calcular custos projetados baseados nos CPA/OPS iniciais
                const projectedMonths = getProjectionMonthsForCalculation();
                const initialCosts: { [monthKey: string]: { marketingCost: number; operationalCost: number } } = {};
                
                for (let i = 0; i < 12; i++) {
                    const monthKey = `Mes${i + 1}`;
                    const expectedRides = projectedMonths[i]?.expectedRides || 0;
                    initialCosts[monthKey] = {
                        marketingCost: Math.round(expectedRides * cityData.cpa[i]),
                        operationalCost: Math.round(expectedRides * cityData.ops[i])
                    };
                }
                setProjectedCosts(initialCosts);
            }
        }
    }, [city, effectiveResults, cpaValues, opsValues]);

    // Função auxiliar para calcular meses de projeção (sem dependência circular)
    const getProjectionMonthsForCalculation = () => {
        if (!city) return [];
        
        const months: { expectedRides: number }[] = [];
        for (let i = 0; i < 12; i++) {
            let expectedRides = 0;
            if (city.population15to44) {
                const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0];
                const targetPenetration = 0.10;
                const factor = i < 6 ? curveFactors[i] : 1.0;
                expectedRides = Math.round(city.population15to44 * factor * targetPenetration);
            }
            months.push({ expectedRides });
        }
        return months;
    };

    // Gerar meses para projeção (12 meses) - MEMOIZADO para performance
    // Se houver data de implementação, mostra o mês real (Jan/2025)
    // Se não houver, mostra apenas "Mês 1", "Mês 2", etc.
    const projectionMonths = useMemo(() => {
        const months: { key: string; label: string; dateLabel: string | null; expectedRides: number; monthNumber: number }[] = [];
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        const hasImplementationDate = !!city?.implementationStartDate;
        
        for (let i = 0; i < 12; i++) {
            const mesKey = `Mes${i + 1}`; // Chave sempre será Mes1, Mes2, etc.
            let dateLabel: string | null = null;
            let expectedRides = 0;
            
            if (hasImplementationDate && city?.implementationStartDate) {
                // Com data de implementação: calcula a data real
                const [startYear, startMonth] = city.implementationStartDate.split('-').map(Number);
                const totalMonths = (startYear * 12 + (startMonth - 1)) + i;
                const year = Math.floor(totalMonths / 12);
                const month = (totalMonths % 12) + 1;
                const monthKey = `${year}-${String(month).padStart(2, '0')}`;
                
                dateLabel = `${monthNames[month - 1]}/${year}`;
                expectedRides = getGradualMonthlyGoal(city, monthKey, city.implementationStartDate);
            } else if (city) {
                // Sem data de implementação: usa estimativa baseada na curva gradual
                const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0];
                const targetPenetration = 0.10; // 10% da população 15-44
                const factor = i < 6 ? curveFactors[i] : 1.0;
                expectedRides = Math.round(city.population15to44 * factor * targetPenetration);
            }
            
            months.push({
                key: mesKey,
                label: `Mês ${i + 1}`,
                dateLabel: dateLabel,
                expectedRides,
                monthNumber: i + 1
            });
        }
        return months;
    }, [city?.id, city?.implementationStartDate, city?.population15to44]);

    // Alias para manter compatibilidade com código existente
    const getProjectionMonths = () => projectionMonths;

    const handleSaveProjections = async () => {
        if (!city) return;
        
        setIsSaving(true);
        
        // Converter para formato MonthResult
        const results: { [key: string]: MonthResult } = {};
        const projectionMonths = getProjectionMonths();
        
        projectionMonths.forEach((month, index) => {
            const mesKey = `Mes${index + 1}`;
            const costs = projectedCosts[month.key] || { marketingCost: 0, operationalCost: 0 };
            const cpa = cpaValues[mesKey] || 0;
            const ops = opsValues[mesKey] || 0;
            
            results[mesKey] = {
                rides: month.expectedRides,
                marketingCost: costs.marketingCost,
                operationalCost: costs.operationalCost,
                projectedMarketing: costs.marketingCost,
                projectedOperational: costs.operationalCost,
                projectedRevenue: month.expectedRides * PRICE_PER_RIDE,
                cpaPerRide: cpa,
                opsPerRide: ops
            };
        });
        
        await updatePlanResultsBatch(city.id, results);
        
        // Atualizar resultados locais para refletir o que foi salvo
        setBackendResults(results);
        
        setHasUnsavedChanges(false);
        
        setTimeout(() => setIsSaving(false), 500);
    };

    const handleSave = () => {
        if (formData) {
            setIsSaving(true);
            saveCityMarketData(formData);
            setHasUnsavedChanges(false);
            // Simulate network delay
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    // Helper para marcar alterações
    const markAsChanged = () => setHasUnsavedChanges(true);

    // --- Competitor Handlers ---
    const addCompetitor = () => {
        if (!formData) return;
        const newComp: MarketCompetitor = {
            id: Date.now().toString(),
            name: 'Novo Concorrente',
            priceLevel: 'Médio',
            strengths: '',
            weaknesses: '',
            marketShareEstimate: 0
        };
        setFormData({ ...formData, competitors: [...formData.competitors, newComp] });
        markAsChanged();
    };

    const updateCompetitor = (id: string, field: keyof MarketCompetitor, value: any) => {
        if (!formData) return;
        setFormData({
            ...formData,
            competitors: formData.competitors.map(c => c.id === id ? { ...c, [field]: value } : c)
        });
        markAsChanged();
    };

    const removeCompetitor = (id: string) => {
        if (!formData) return;
        setFormData({
            ...formData,
            competitors: formData.competitors.filter(c => c.id !== id)
        });
        markAsChanged();
    };

    // --- Stakeholder Handlers ---
    const addStakeholder = () => {
        if (!formData) return;
        const newStake: StakeholderContact = {
            id: Date.now().toString(),
            name: '',
            role: '',
            organization: '',
            phone: '',
            category: 'Parceiro',
            status: 'A Contatar'
        };
        setFormData({ ...formData, stakeholders: [...formData.stakeholders, newStake] });
        markAsChanged();
    };

    const addGovernmentContact = () => {
        if (!formData) return;
        const newStake: StakeholderContact = {
            id: Date.now().toString(),
            name: '',
            role: 'Secretário',
            organization: 'Prefeitura',
            phone: '',
            category: 'Governo',
            status: 'A Contatar'
        };
        setFormData({ ...formData, stakeholders: [...formData.stakeholders, newStake] });
        markAsChanged();
    }

    const updateStakeholder = (id: string, field: keyof StakeholderContact, value: any) => {
        if (!formData) return;
        setFormData({
            ...formData,
            stakeholders: formData.stakeholders.map(s => s.id === id ? { ...s, [field]: value } : s)
        });
        markAsChanged();
    };

    const removeStakeholder = (id: string) => {
        if (!formData) return;
        setFormData({
            ...formData,
            stakeholders: formData.stakeholders.filter(s => s.id !== id)
        });
        markAsChanged();
    };

    // --- SWOT Handlers ---
    const updateSwotList = (type: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', text: string) => {
        if (!formData) return;
        // Simple text area to array conversion for simplicity in this UI
        const list = text.split('\n').filter(line => line.trim() !== '');
        setFormData({
            ...formData,
            swot: { ...formData.swot, [type]: list }
        });
        markAsChanged();
    };

    if (!city || !formData) return <div>Carregando...</div>;

    const governmentContacts = formData.stakeholders.filter(s => s.category === 'Governo');

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            {/* Header Fixo */}
            <div className="flex-shrink-0 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/inteligencia')} 
                            className="p-2 rounded-full transition"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <FiArrowLeft className="w-6 h-6"/>
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold">Inteligência: {city.name}</h2>
                            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Dados estratégicos e análise de mercado</p>
                        </div>
                    </div>
                    {hasUnsavedChanges && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            Alterações não salvas
                        </span>
                    )}
                </div>

                {/* Tabs Navigation */}
                <div className="mt-4 flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200"
                            style={{
                                background: activeTab === tab.id ? `${tab.color}20` : 'transparent',
                                color: activeTab === tab.id ? tab.color : 'rgba(255, 255, 255, 0.6)',
                                border: activeTab === tab.id ? `1px solid ${tab.color}50` : '1px solid transparent',
                            }}
                        >
                            {tab.icon}
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Conteúdo da Tab Ativa - Scrollável */}
            <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB: VISÃO GERAL */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 'visao-geral' && (
                <div className="space-y-6 pb-24">
                    {/* 1. Resumo do Município */}
                    <Card title="Resumo do Município" tooltipText="Descreva os principais motores econômicos da cidade, grandes empresas, safra agrícola, sazonalidade, e características gerais.">
                        <textarea 
                            className="w-full h-32 p-4 rounded-lg backdrop-blur-sm resize-none"
                            style={{ 
                                background: 'rgba(0, 0, 0, 0.2)', 
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#ffffff'
                            }}
                            placeholder="Ex: Cidade com forte presença do agronegócio (soja/milho). Pico de movimento entre Fevereiro e Março. População flutuante alta..."
                            value={formData.economicNotes}
                            onChange={(e) => setFormData({ ...formData, economicNotes: e.target.value })}
                        />
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 2. Dados de Contato da Prefeitura */}
                        <Card title="Dados da Prefeitura" className="h-full">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold flex items-center mb-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}><FiPhone className="mr-2"/> Telefone Geral</label>
                                    <input 
                                        type="text" 
                                        value={formData.cityHallPhone || ''} 
                                        onChange={(e) => setFormData({ ...formData, cityHallPhone: e.target.value })}
                                        placeholder="(65) 3333-0000"
                                        className="w-full p-2 rounded-lg backdrop-blur-sm"
                                        style={{ 
                                            background: 'rgba(0, 0, 0, 0.2)', 
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold flex items-center mb-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}><FiMail className="mr-2"/> Email Geral / Gabinete</label>
                                    <input 
                                        type="text" 
                                        value={formData.cityHallEmail || ''} 
                                        onChange={(e) => setFormData({ ...formData, cityHallEmail: e.target.value })}
                                        placeholder="contato@cidade.mt.gov.br"
                                        className="w-full p-2 rounded-lg backdrop-blur-sm"
                                        style={{ 
                                            background: 'rgba(0, 0, 0, 0.2)', 
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff'
                                        }}
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* 3. Concorrência em Números */}
                        <Card title="Concorrência em Números" className="h-full">
                             <div className="flex items-center justify-between h-full py-4">
                                <div className="flex items-center">
                                    <div className="p-4 rounded-full mr-4" style={{ backgroundColor: 'rgba(246, 39, 24, 0.2)', color: '#f62718' }}>
                                        <FiTarget size={32} />
                                    </div>
                                    <div>
                                        <p className="text-4xl font-bold">{formData.competitors.length}</p>
                                        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Concorrentes Cadastrados</p>
                                    </div>
                                </div>
                                <a 
                                    href="#concorrencia"
                                    className="text-sm hover:underline"
                                    style={{ color: '#3b82f6' }}
                                >
                                    Ver Detalhes ↓
                                </a>
                             </div>
                        </Card>
                    </div>

                    {/* 4. Gestão de Contatos Governamentais */}
                    <Card 
                        title="Contatos Governamentais" 
                        tooltipText="Adicione contatos específicos como Prefeito, Secretários (Transporte, Obras) e Vereadores."
                    >
                         <div className="overflow-x-auto dt-table-container">
                            <table className="w-full text-left mb-4 dt-table">
                                <thead style={{ background: 'rgba(55, 65, 81, 0.9)', borderBottom: '2px solid rgba(59, 130, 246, 0.5)' }}>
                                    <tr>
                                        <th className="p-3 w-1/4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Nome</th>
                                        <th className="p-3 w-1/4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Cargo</th>
                                        <th className="p-3 w-1/4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Telefone</th>
                                        <th className="p-3 w-1/4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Email</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {governmentContacts.map((stake, index) => (
                                        <tr 
                                            key={stake.id} 
                                            className="hover:bg-gray-700/40 transition-colors"
                                            style={{ 
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                                background: index % 2 === 0 ? 'rgba(55, 65, 81, 0.3)' : 'transparent'
                                            }}
                                        >
                                            <td className="p-3">
                                                 <input 
                                                    type="text" 
                                                    value={stake.name} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:outline-none"
                                                    style={{ color: '#ffffff' }}
                                                    placeholder="Nome"
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="text" 
                                                    value={stake.role} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'role', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:outline-none"
                                                    style={{ color: '#ffffff' }}
                                                    placeholder="Ex: Secretário"
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="text" 
                                                    value={stake.phone} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'phone', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:outline-none"
                                                    style={{ color: '#ffffff' }}
                                                    placeholder="Telefone Direto"
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="text" 
                                                    value={stake.email || ''} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'email', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:outline-none"
                                                    style={{ color: '#ffffff' }}
                                                    placeholder="Email Direto"
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <button 
                                                    onClick={() => removeStakeholder(stake.id)} 
                                                    className="transition"
                                                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f62718'}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {governmentContacts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center font-medium italic" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                Nenhum contato governamental adicionado ainda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button 
                            onClick={addGovernmentContact} 
                            className="w-full py-2 border-2 border-dashed rounded-lg font-bold transition-colors flex items-center justify-center"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                        >
                            <FiPlus className="mr-2"/> Adicionar Prefeito / Secretário / Vereador
                        </button>
                    </Card>
                </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB: CONCORRÊNCIA */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 'concorrencia' && (
                <div className="space-y-6 pb-24">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(246, 39, 24, 0.15)', border: '1px solid rgba(246, 39, 24, 0.3)' }}>
                                <FiTarget className="w-5 h-5" style={{ color: '#f62718' }} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold" style={{ color: '#ffffff' }}>Análise da Concorrência</h3>
                                <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Mapeamento e análise dos concorrentes</p>
                            </div>
                        </div>
                        <button 
                            onClick={addCompetitor} 
                            className="flex items-center text-sm text-white px-3 py-1.5 rounded-lg transition"
                            style={{ backgroundColor: '#f62718' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(246, 39, 24, 0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f62718'}
                        >
                            <FiPlus className="mr-1"/> Adicionar
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {formData.competitors.map(comp => (
                            <div 
                                key={comp.id} 
                                className="backdrop-blur-sm rounded-xl p-4 shadow-sm relative group"
                                style={{ 
                                    background: 'rgba(0, 0, 0, 0.2)', 
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                <button 
                                    onClick={() => removeCompetitor(comp.id)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f62718'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                                >
                                    <FiTrash2 />
                                </button>

                                <input 
                                    type="text" 
                                    value={comp.name} 
                                    onChange={(e) => updateCompetitor(comp.id, 'name', e.target.value)}
                                    className="font-bold text-lg bg-transparent border-b border-transparent w-full mb-2 focus:outline-none"
                                    style={{ color: '#ffffff' }}
                                    placeholder="Nome do Concorrente"
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                    onMouseLeave={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = 'transparent'; }}
                                />

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Nível de Preço</label>
                                        <select 
                                            value={comp.priceLevel}
                                            onChange={(e) => updateCompetitor(comp.id, 'priceLevel', e.target.value)}
                                            className="w-full p-1 backdrop-blur-sm rounded text-sm"
                                            style={{ background: 'rgba(0, 0, 0, 0.2)', color: '#ffffff' }}
                                        >
                                            <option value="Baixo">Baixo (Econômico)</option>
                                            <option value="Médio">Médio</option>
                                            <option value="Alto">Alto (Premium)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Pontos Fortes</label>
                                        <textarea 
                                            value={comp.strengths}
                                            onChange={(e) => updateCompetitor(comp.id, 'strengths', e.target.value)}
                                            rows={2}
                                            className="w-full p-2 backdrop-blur-sm rounded text-sm resize-none"
                                            style={{ background: 'rgba(8, 165, 14, 0.1)', color: '#ffffff' }}
                                            placeholder="Ex: Tempo de espera baixo..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Pontos Fracos</label>
                                        <textarea 
                                            value={comp.weaknesses}
                                            onChange={(e) => updateCompetitor(comp.id, 'weaknesses', e.target.value)}
                                            rows={2}
                                            className="w-full p-2 backdrop-blur-sm rounded text-sm resize-none"
                                            style={{ background: 'rgba(246, 39, 24, 0.1)', color: '#ffffff' }}
                                            placeholder="Ex: App trava muito..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {formData.competitors.length === 0 && (
                            <div 
                                className="col-span-full py-10 text-center font-medium backdrop-blur-sm rounded-xl border border-dashed"
                                style={{ 
                                    background: 'rgba(0, 0, 0, 0.2)', 
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.8)'
                                }}
                            >
                                Nenhum concorrente registrado.
                            </div>
                        )}
                    </div>
                </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB: STAKEHOLDERS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 'stakeholders' && (
                <div className="space-y-6 pb-24">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(23, 162, 184, 0.15)', border: '1px solid rgba(23, 162, 184, 0.3)' }}>
                                <FiUsers className="w-5 h-5" style={{ color: '#17a2b8' }} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold" style={{ color: '#ffffff' }}>Stakeholders & Contatos Chave</h3>
                                <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Parceiros, influenciadores e contatos importantes</p>
                            </div>
                        </div>
                        <button 
                            onClick={addStakeholder} 
                            className="flex items-center text-sm text-white px-3 py-1.5 rounded-lg transition"
                            style={{ backgroundColor: '#17a2b8' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(23, 162, 184, 0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#17a2b8'}
                        >
                            <FiPlus className="mr-1"/> Adicionar
                        </button>
                    </div>

                    <div className="overflow-x-auto dt-table-container rounded-xl">
                        <table className="w-full text-left dt-table">
                            <thead style={{ background: 'rgba(55, 65, 81, 0.9)', borderBottom: '2px solid rgba(59, 130, 246, 0.5)' }}>
                                <tr>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Nome</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Cargo/Org</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Contato</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Categoria</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Status</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.stakeholders.map((stake, index) => (
                                    <tr 
                                        key={stake.id} 
                                        className="last:border-0 transition-colors hover:bg-gray-700/40"
                                        style={{ 
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                            background: index % 2 === 0 ? 'rgba(55, 65, 81, 0.3)' : 'transparent'
                                        }}
                                    >
                                        <td className="p-4">
                                            <input 
                                                type="text" 
                                                value={stake.name} 
                                                onChange={(e) => updateStakeholder(stake.id, 'name', e.target.value)}
                                                className="w-full bg-transparent border-b border-transparent focus:outline-none"
                                                style={{ color: '#ffffff' }}
                                                placeholder="Nome do Contato"
                                                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                 <input 
                                                    type="text" 
                                                    value={stake.role} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'role', e.target.value)}
                                                    className="w-full text-sm bg-transparent border-b border-transparent focus:outline-none"
                                                    style={{ color: '#ffffff' }}
                                                    placeholder="Cargo"
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                                />
                                                 <input 
                                                    type="text" 
                                                    value={stake.organization} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'organization', e.target.value)}
                                                    className="w-full text-xs bg-transparent border-b border-transparent focus:outline-none"
                                                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                                    placeholder="Organização"
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex items-center">
                                                    <FiPhone className="mr-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}/>
                                                    <input 
                                                        type="text" 
                                                        value={stake.phone} 
                                                        onChange={(e) => updateStakeholder(stake.id, 'phone', e.target.value)}
                                                        className="w-full bg-transparent focus:outline-none"
                                                        style={{ color: '#ffffff' }}
                                                        placeholder="Telefone"
                                                    />
                                                </div>
                                                <div className="flex items-center">
                                                    <FiMail className="mr-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}/>
                                                    <input 
                                                        type="text" 
                                                        value={stake.email || ''} 
                                                        onChange={(e) => updateStakeholder(stake.id, 'email', e.target.value)}
                                                        className="w-full bg-transparent focus:outline-none"
                                                        style={{ color: '#ffffff' }}
                                                        placeholder="Email"
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select 
                                                value={stake.category} 
                                                onChange={(e) => updateStakeholder(stake.id, 'category', e.target.value)}
                                                className="backdrop-blur-sm p-1 rounded text-sm"
                                                style={{ background: 'rgba(0, 0, 0, 0.2)', color: '#ffffff' }}
                                            >
                                                <option>Governo</option>
                                                <option>Mídia</option>
                                                <option>Parceiro</option>
                                                <option>Influenciador</option>
                                                <option>Outro</option>
                                            </select>
                                        </td>
                                        <td className="p-4">
                                             <select 
                                                value={stake.status} 
                                                onChange={(e) => updateStakeholder(stake.id, 'status', e.target.value)}
                                                className="p-1 rounded text-xs font-bold text-white"
                                                style={{
                                                    backgroundColor: stake.status === 'Parceria Firmada' 
                                                        ? '#08a50e' 
                                                        : stake.status === 'Em Negociação' 
                                                            ? '#ffc107' 
                                                            : 'rgba(255, 255, 255, 0.1)',
                                                    color: stake.status === 'Em Negociação' ? '#000000' : '#ffffff'
                                                }}
                                            >
                                                <option>A Contatar</option>
                                                <option>Em Negociação</option>
                                                <option>Parceria Firmada</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => removeStakeholder(stake.id)} 
                                                className="transition"
                                                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#f62718'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {formData.stakeholders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Nenhum contato registrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB: SWOT */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 'swot' && (
                <div className="space-y-6 pb-24">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                            <FiShield className="w-5 h-5" style={{ color: '#ffc107' }} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold" style={{ color: '#ffffff' }}>Análise SWOT (F.O.F.A.)</h3>
                            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Forças, Oportunidades, Fraquezas e Ameaças</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Strengths */}
                        <Card title="Forças (Strengths)" className="border-t-4" style={{ borderTopColor: '#08a50e' }}>
                             <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Vantagens internas em relação à cidade.</p>
                             <textarea 
                                className="w-full h-40 p-3 backdrop-blur-sm rounded border-none"
                                style={{ 
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    color: '#ffffff'
                                }}
                                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px #08a50e'}
                                onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                                placeholder="- Marca forte na região vizinha&#10;- Equipe local já contratada"
                                value={formData.swot.strengths.join('\n')}
                                onChange={(e) => updateSwotList('strengths', e.target.value)}
                             />
                        </Card>

                        {/* Weaknesses */}
                        <Card title="Fraquezas (Weaknesses)" className="border-t-4" style={{ borderTopColor: '#f62718' }}>
                             <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Desvantagens internas.</p>
                             <textarea 
                                className="w-full h-40 p-3 backdrop-blur-sm rounded border-none"
                                style={{ 
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    color: '#ffffff'
                                }}
                                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px #f62718'}
                                onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                                placeholder="- Orçamento limitado de marketing&#10;- App ainda sem motoristas cadastrados"
                                value={formData.swot.weaknesses.join('\n')}
                                onChange={(e) => updateSwotList('weaknesses', e.target.value)}
                             />
                        </Card>

                        {/* Opportunities */}
                        <Card title="Oportunidades (Opportunities)" className="border-t-4" style={{ borderTopColor: '#17a2b8' }}>
                             <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Fatores externos positivos.</p>
                             <textarea 
                                className="w-full h-40 p-3 backdrop-blur-sm rounded border-none"
                                style={{ 
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    color: '#ffffff'
                                }}
                                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px #17a2b8'}
                                onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                                placeholder="- Concorrente principal aumentou preços&#10;- Evento agropecuário em breve"
                                value={formData.swot.opportunities.join('\n')}
                                onChange={(e) => updateSwotList('opportunities', e.target.value)}
                             />
                        </Card>

                         {/* Threats */}
                         <Card title="Ameaças (Threats)" className="border-t-4" style={{ borderTopColor: '#ffc107' }}>
                             <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Fatores externos negativos.</p>
                             <textarea 
                                className="w-full h-40 p-3 backdrop-blur-sm rounded border-none"
                                style={{ 
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    color: '#ffffff'
                                }}
                                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px #ffc107'}
                                onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                                placeholder="- Novo app entrando no mercado&#10;- Regulação municipal mais rígida"
                                value={formData.swot.threats.join('\n')}
                                onChange={(e) => updateSwotList('threats', e.target.value)}
                             />
                        </Card>
                    </div>
                </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB: PROJEÇÕES FINANCEIRAS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 'projecoes' && (
                <div className="space-y-6 pb-24">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                <FiDollarSign className="w-5 h-5" style={{ color: '#10b981' }} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold" style={{ color: '#ffffff' }}>Projeções Financeiras</h3>
                                <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Custos, receitas e metas de corridas por mês</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleSaveProjections}
                            disabled={isSaving}
                            className="flex items-center text-white py-2 px-6 rounded-lg transition disabled:opacity-50"
                            style={{ backgroundColor: '#10b981' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                        >
                            <FiSave className="mr-2" />
                            {isSaving ? 'Salvando...' : 'Salvar Projeções'}
                        </button>
                    </div>

                    {/* Resumo - Cards Modernos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Card Início Implementação */}
                        <div className="relative overflow-hidden rounded-xl p-5 border transition-all duration-300 hover:scale-[1.02]"
                            style={{ 
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-semibold text-blue-400 mb-2">📅 Início Implementação</p>
                                    <p className="text-2xl font-bold" style={{ color: city.implementationStartDate ? '#ffffff' : 'rgba(255, 255, 255, 0.4)' }}>
                                        {city.implementationStartDate 
                                            ? new Date(city.implementationStartDate + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()
                                            : 'Não definida'
                                        }
                                    </p>

                                </div>
                                <div className="p-3 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                                    <FiCalendar className="text-blue-400" size={24} />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #3b82f6, transparent)' }} />
                        </div>

                        {/* Card Marketing */}
                        <div className="relative overflow-hidden rounded-xl p-5 border transition-all duration-300 hover:scale-[1.02]"
                            style={{ 
                                background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.15) 0%, rgba(217, 70, 239, 0.05) 100%)',
                                border: '1px solid rgba(217, 70, 239, 0.3)'
                            }}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-semibold text-purple-400 mb-2">📢 Marketing (12m)</p>
                                    <p className="text-2xl font-bold text-white">
                                        {Object.values(projectedCosts).reduce((sum, c) => sum + (c.marketingCost || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                    <p className="text-xs mt-2 text-gray-400">
                                        Média: {(Object.values(projectedCosts).reduce((sum, c) => sum + (c.marketingCost || 0), 0) / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: 'rgba(217, 70, 239, 0.2)' }}>
                                    <FiTrendingUp className="text-purple-400" size={24} />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #d946ef, transparent)' }} />
                        </div>

                        {/* Card Operacional */}
                        <div className="relative overflow-hidden rounded-xl p-5 border transition-all duration-300 hover:scale-[1.02]"
                            style={{ 
                                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.05) 100%)',
                                border: '1px solid rgba(249, 115, 22, 0.3)'
                            }}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-semibold text-orange-400 mb-2">⚙️ Operacional (12m)</p>
                                    <p className="text-2xl font-bold text-white">
                                        {Object.values(projectedCosts).reduce((sum, c) => sum + (c.operationalCost || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                    <p className="text-xs mt-2 text-gray-400">
                                        Média: {(Object.values(projectedCosts).reduce((sum, c) => sum + (c.operationalCost || 0), 0) / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: 'rgba(249, 115, 22, 0.2)' }}>
                                    <FiUsers className="text-orange-400" size={24} />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #f97316, transparent)' }} />
                        </div>

                        {/* Card Custo Total */}
                        <div className="relative overflow-hidden rounded-xl p-5 border transition-all duration-300 hover:scale-[1.02]"
                            style={{ 
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-2">💰 Custo Total (12m)</p>
                                    <p className="text-2xl font-bold text-white">
                                        {Object.values(projectedCosts).reduce((sum, c) => sum + (c.marketingCost || 0) + (c.operationalCost || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                    {(() => {
                                        const totalRides = getProjectionMonths().reduce((sum, m) => sum + m.expectedRides, 0);
                                        const totalCost = Object.values(projectedCosts).reduce((sum, c) => sum + (c.marketingCost || 0) + (c.operationalCost || 0), 0);
                                        const costPerRide = totalRides > 0 ? totalCost / totalRides : 0;
                                        return (
                                            <p className="text-xs mt-2 text-gray-400">
                                                Custo/Corrida: <span className="text-yellow-400 font-semibold">{costPerRide > 0 ? `R$ ${costPerRide.toFixed(2)}` : '-'}</span>
                                            </p>
                                        );
                                    })()}
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                                    <FiDollarSign className="text-emerald-400" size={24} />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #10b981, transparent)' }} />
                        </div>
                    </div>

                    {/* Aplicar CPA/OPS para todos - Quick Actions */}
                    <Card title="Ações Rápidas" tooltipText="Aplique valores de CPA e OPS para todos os 12 meses de uma vez.">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <label className="text-xs font-semibold uppercase text-purple-400 mb-2 block">CPA (R$/Corrida)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Ex: 1.50"
                                        id="bulk-cpa"
                                        className="flex-1 p-2 rounded-lg text-center"
                                        style={{ 
                                            background: 'rgba(0, 0, 0, 0.3)',
                                            border: '1px solid rgba(139, 92, 246, 0.3)',
                                            color: '#ffffff'
                                        }}
                                    />
                                    <button 
                                        onClick={() => {
                                            const input = document.getElementById('bulk-cpa') as HTMLInputElement;
                                            const value = Number(input?.value) || 0;
                                            if (value > 0) {
                                                const newCpa: { [key: string]: number } = {};
                                                for (let i = 1; i <= 12; i++) {
                                                    newCpa[`Mes${i}`] = value;
                                                }
                                                setCpaValues(newCpa);
                                                markAsChanged();
                                            }
                                        }}
                                        className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                                        style={{ background: 'rgba(139, 92, 246, 0.3)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.5)' }}
                                    >
                                        Aplicar para todos
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="text-xs font-semibold uppercase text-cyan-400 mb-2 block">OPS (R$/Corrida)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Ex: 0.80"
                                        id="bulk-ops"
                                        className="flex-1 p-2 rounded-lg text-center"
                                        style={{ 
                                            background: 'rgba(0, 0, 0, 0.3)',
                                            border: '1px solid rgba(6, 182, 212, 0.3)',
                                            color: '#ffffff'
                                        }}
                                    />
                                    <button 
                                        onClick={() => {
                                            const input = document.getElementById('bulk-ops') as HTMLInputElement;
                                            const value = Number(input?.value) || 0;
                                            if (value > 0) {
                                                const newOps: { [key: string]: number } = {};
                                                for (let i = 1; i <= 12; i++) {
                                                    newOps[`Mes${i}`] = value;
                                                }
                                                setOpsValues(newOps);
                                                markAsChanged();
                                            }
                                        }}
                                        className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                                        style={{ background: 'rgba(6, 182, 212, 0.3)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.5)' }}
                                    >
                                        Aplicar para todos
                                    </button>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setCpaValues({});
                                    setOpsValues({});
                                    setProjectedCosts({});
                                    markAsChanged();
                                }}
                                className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                            >
                                Limpar Tudo
                            </button>
                        </div>
                        
                        {/* Templates de Projeção */}
                        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <p className="text-xs font-semibold uppercase text-gray-400 mb-3">Templates Pré-definidos</p>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => {
                                        const newCpa: { [key: string]: number } = {};
                                        const newOps: { [key: string]: number } = {};
                                        for (let i = 1; i <= 12; i++) {
                                            newCpa[`Mes${i}`] = 0.80;
                                            newOps[`Mes${i}`] = 0.40;
                                        }
                                        setCpaValues(newCpa);
                                        setOpsValues(newOps);
                                        markAsChanged();
                                    }}
                                    className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 text-sm"
                                    style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}
                                >
                                    🛡️ Conservador (CPA: R$0,80 / OPS: R$0,40)
                                </button>
                                <button 
                                    onClick={() => {
                                        const newCpa: { [key: string]: number } = {};
                                        const newOps: { [key: string]: number } = {};
                                        for (let i = 1; i <= 12; i++) {
                                            newCpa[`Mes${i}`] = 1.50;
                                            newOps[`Mes${i}`] = 0.60;
                                        }
                                        setCpaValues(newCpa);
                                        setOpsValues(newOps);
                                        markAsChanged();
                                    }}
                                    className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 text-sm"
                                    style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                                >
                                    ⚖️ Moderado (CPA: R$1,50 / OPS: R$0,60)
                                </button>
                                <button 
                                    onClick={() => {
                                        const newCpa: { [key: string]: number } = {};
                                        const newOps: { [key: string]: number } = {};
                                        for (let i = 1; i <= 12; i++) {
                                            newCpa[`Mes${i}`] = 2.50;
                                            newOps[`Mes${i}`] = 1.00;
                                        }
                                        setCpaValues(newCpa);
                                        setOpsValues(newOps);
                                        markAsChanged();
                                    }}
                                    className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 text-sm"
                                    style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.3)' }}
                                >
                                    🚀 Agressivo (CPA: R$2,50 / OPS: R$1,00)
                                </button>
                            </div>
                        </div>
                    </Card>

                    {/* Tabela de Projeções */}
                    <Card title="Custos Projetados por Mês" tooltipText="Defina os valores esperados de investimento em marketing e custos operacionais para cada mês.">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                        <thead style={{ background: 'rgba(55, 65, 81, 0.9)', borderBottom: '2px solid rgba(16, 185, 129, 0.5)' }}>
                                            <tr>
                                                <th className="p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Mês</th>
                                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'rgb(255 255 255 / 80%)' }}>Meta Corridas</th>
                                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: '#10b981' }}>Projeção Receita</th>
                                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: '#22c55e' }}>Valor Líquido</th>
                                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: '#8b5cf6', borderLeft: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                                    CPA (R$/Corrida)
                                                </th>
                                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: '#06b6d4' }}>
                                                    OPS (R$/Corrida)
                                                </th>
                                                <th className="p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#d946ef' }}>
                                                    <FiTrendingUp className="inline mr-1" />
                                                    Marketing (R$)
                                                </th>
                                                <th className="p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#f97316' }}>
                                                    <FiUsers className="inline mr-1" />
                                                    Operacional (R$)
                                                </th>
                                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'rgb(255 255 255 / 80%)' }}>Total</th>
                                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'rgb(255 255 255 / 80%)' }}>Custo/Corrida</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getProjectionMonths().map((month, index) => {
                                                const costs = projectedCosts[month.key] || { marketingCost: 0, operationalCost: 0 };
                                                const cpaValue = cpaValues[month.key] || 0;
                                                const opsValue = opsValues[month.key] || 0;
                                                
                                                // Calcular custos baseados em CPA/OPS se definidos, senão usar valores diretos
                                                const marketingCostFromCpa = month.expectedRides * cpaValue;
                                                const operationalCostFromOps = month.expectedRides * opsValue;
                                                
                                                const finalMarketingCost = cpaValue > 0 ? marketingCostFromCpa : (costs.marketingCost || 0);
                                                const finalOperationalCost = opsValue > 0 ? operationalCostFromOps : (costs.operationalCost || 0);
                                                
                                                const totalCost = finalMarketingCost + finalOperationalCost;
                                                const expectedRevenue = month.expectedRides * PRICE_PER_RIDE;
                                                const costPerRide = month.expectedRides > 0 ? totalCost / month.expectedRides : 0;
                                                
                                                return (
                                                    <tr 
                                                        key={month.key}
                                                        className="hover:bg-gray-700/40 transition-colors"
                                                        style={{ 
                                                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                                            background: index % 2 === 0 ? 'rgba(55, 65, 81, 0.3)' : 'transparent'
                                                        }}
                                                    >
                                                        <td className="p-3 font-medium" style={{ color: '#ffffff' }}>
                                                            {month.label}
                                                            {month.dateLabel && (
                                                                <span className="text-xs ml-2" style={{ color: 'rgba(16, 185, 129, 0.8)' }}>
                                                                    ({month.dateLabel})
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center" style={{ color: '#3b82f6' }}>
                                                            {month.expectedRides.toLocaleString('pt-BR')}
                                                        </td>
                                                        <td className="p-3 text-center" style={{ color: '#10b981' }}>
                                                            {expectedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </td>
                                                        <td className="p-3 text-center font-semibold" style={{ 
                                                            color: (expectedRevenue - totalCost) >= 0 ? '#22c55e' : '#ef4444' 
                                                        }}>
                                                            {(expectedRevenue - totalCost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </td>
                                                        
                                                        {/* Novo campo CPA */}
                                                        <td className="p-3" style={{ borderLeft: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                                            <input 
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={cpaValue || ''}
                                                                onChange={(e) => {
                                                                    const newCpa = Number(e.target.value) || 0;
                                                                    setCpaValues({
                                                                        ...cpaValues,
                                                                        [month.key]: newCpa
                                                                    });
                                                                    
                                                                    // Atualizar marketing cost baseado no CPA
                                                                    if (newCpa > 0) {
                                                                        setProjectedCosts({
                                                                            ...projectedCosts,
                                                                            [month.key]: {
                                                                                ...costs,
                                                                                marketingCost: month.expectedRides * newCpa
                                                                            }
                                                                        });
                                                                    }
                                                                }}
                                                                placeholder="0.00"
                                                                className="w-full p-2 rounded text-center"
                                                                style={{ 
                                                                    background: 'rgba(0, 0, 0, 0.3)',
                                                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                                                    color: '#ffffff'
                                                                }}
                                                                onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                                                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'}
                                                            />
                                                        </td>
                                                        
                                                        {/* Novo campo OPS */}
                                                        <td className="p-3">
                                                            <input 
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={opsValue || ''}
                                                                onChange={(e) => {
                                                                    const newOps = Number(e.target.value) || 0;
                                                                    setOpsValues({
                                                                        ...opsValues,
                                                                        [month.key]: newOps
                                                                    });
                                                                    
                                                                    // Atualizar operational cost baseado no OPS
                                                                    if (newOps > 0) {
                                                                        setProjectedCosts({
                                                                            ...projectedCosts,
                                                                            [month.key]: {
                                                                                ...costs,
                                                                                operationalCost: month.expectedRides * newOps
                                                                            }
                                                                        });
                                                                    }
                                                                }}
                                                                placeholder="0.00"
                                                                className="w-full p-2 rounded text-center"
                                                                style={{ 
                                                                    background: 'rgba(0, 0, 0, 0.3)',
                                                                    border: '1px solid rgba(6, 182, 212, 0.3)',
                                                                    color: '#ffffff'
                                                                }}
                                                                onFocus={(e) => e.currentTarget.style.borderColor = '#06b6d4'}
                                                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)'}
                                                            />
                                                        </td>
                                                        
                                                        <td className="p-3">
                                                            <input 
                                                                type="number"
                                                                min="0"
                                                                step="100"
                                                                value={costs.marketingCost || ''}
                                                                onChange={(e) => setProjectedCosts({
                                                                    ...projectedCosts,
                                                                    [month.key]: {
                                                                        ...costs,
                                                                        marketingCost: Number(e.target.value) || 0
                                                                    }
                                                                })}
                                                                placeholder="0"
                                                                className="w-full p-2 rounded text-right"
                                                                style={{ 
                                                                    background: 'rgba(0, 0, 0, 0.3)',
                                                                    border: '1px solid rgba(217, 70, 239, 0.3)',
                                                                    color: '#ffffff',
                                                                    backgroundColor: cpaValue > 0 ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0, 0, 0, 0.3)'
                                                                }}
                                                                onFocus={(e) => e.currentTarget.style.borderColor = '#d946ef'}
                                                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(217, 70, 239, 0.3)'}
                                                                readOnly={cpaValue > 0}
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <input 
                                                                type="number"
                                                                min="0"
                                                                step="100"
                                                                value={costs.operationalCost || ''}
                                                                onChange={(e) => setProjectedCosts({
                                                                    ...projectedCosts,
                                                                    [month.key]: {
                                                                        ...costs,
                                                                        operationalCost: Number(e.target.value) || 0
                                                                    }
                                                                })}
                                                                placeholder="0"
                                                                className="w-full p-2 rounded text-right"
                                                                style={{ 
                                                                    background: 'rgba(0, 0, 0, 0.3)',
                                                                    border: '1px solid rgba(249, 115, 22, 0.3)',
                                                                    color: '#ffffff',
                                                                    backgroundColor: opsValue > 0 ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0, 0, 0, 0.3)'
                                                                }}
                                                                onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
                                                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
                                                                readOnly={opsValue > 0}
                                                            />
                                                        </td>
                                                        <td className="p-3 text-center font-bold" style={{ color: totalCost > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.4)' }}>
                                                            {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </td>
                                                        <td className="p-3 text-center" style={{ color: costPerRide > 0 ? '#ffc107' : 'rgba(255, 255, 255, 0.4)' }}>
                                                            {costPerRide > 0 ? `R$ ${costPerRide.toFixed(2)}` : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot style={{ background: 'rgba(16, 185, 129, 0.1)', borderTop: '2px solid rgba(16, 185, 129, 0.5)' }}>
                                            <tr>
                                                <td className="p-3 font-bold" style={{ color: '#ffffff' }}>TOTAL</td>
                                                <td className="p-3 text-center font-bold" style={{ color: '#3b82f6' }}>
                                                    {getProjectionMonths().reduce((sum, m) => sum + m.expectedRides, 0).toLocaleString('pt-BR')}
                                                </td>
                                                <td className="p-3 text-center font-bold" style={{ color: '#10b981' }}>
                                                    {(getProjectionMonths().reduce((sum, m) => sum + m.expectedRides, 0) * PRICE_PER_RIDE).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="p-3 text-center font-bold" style={{ 
                                                    color: (() => {
                                                        const totalRevenue = getProjectionMonths().reduce((sum, m) => sum + m.expectedRides, 0) * PRICE_PER_RIDE;
                                                        const totalCostSum = Object.values(projectedCosts).reduce((sum, c) => sum + (c.marketingCost || 0) + (c.operationalCost || 0), 0);
                                                        return (totalRevenue - totalCostSum) >= 0 ? '#22c55e' : '#ef4444';
                                                    })()
                                                }}>
                                                    {(() => {
                                                        const totalRevenue = getProjectionMonths().reduce((sum, m) => sum + m.expectedRides, 0) * PRICE_PER_RIDE;
                                                        const totalCostSum = Object.values(projectedCosts).reduce((sum, c) => sum + (c.marketingCost || 0) + (c.operationalCost || 0), 0);
                                                        return (totalRevenue - totalCostSum).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                                    })()
                                                    }
                                                </td>
                                                <td className="p-3 text-center font-bold" style={{ color: '#8b5cf6', borderLeft: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                                    CPA Médio
                                                </td>
                                                <td className="p-3 text-center font-bold" style={{ color: '#06b6d4' }}>
                                                    OPS Médio
                                                </td>
                                                <td className="p-3 font-bold" style={{ color: '#d946ef' }}>
                                                    {Object.values(projectedCosts).reduce((sum, c) => sum + (c.marketingCost || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="p-3 font-bold" style={{ color: '#f97316' }}>
                                                    {Object.values(projectedCosts).reduce((sum, c) => sum + (c.operationalCost || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="p-3 text-center font-bold" style={{ color: '#ffffff' }}>
                                                    {Object.values(projectedCosts).reduce((sum, c) => sum + (c.marketingCost || 0) + (c.operationalCost || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="p-3 text-center font-bold" style={{ color: '#ffc107' }}>
                                                    {(() => {
                                                        const totalRides = getProjectionMonths().reduce((sum, m) => sum + m.expectedRides, 0);
                                                        const totalCost = Object.values(projectedCosts).reduce((sum, c) => sum + (c.marketingCost || 0) + (c.operationalCost || 0), 0);
                                                        return totalRides > 0 ? `R$ ${(totalCost / totalRides).toFixed(2)}` : '-';
                                                    })()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </Card>

                            {/* Dicas */}
                            <Card>
                                <div className="flex items-start gap-4 p-2">
                                    <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                                        <FiTarget className="text-blue-500" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold" style={{ color: '#ffffff' }}>Dicas para Projeções</h4>
                                        <ul className="text-sm mt-2 space-y-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                            <li>• <strong>CPA (Custo Por Aquisição):</strong> Define quanto você quer gastar em marketing por cada corrida adquirida. Quando preenchido, calcula automaticamente o valor de Marketing.</li>
                                            <li>• <strong>OPS (Operacional por Corrida):</strong> Define quanto você quer gastar em operações por cada corrida. Quando preenchido, calcula automaticamente o valor Operacional.</li>
                                            <li>• <strong>Marketing:</strong> Inclua gastos com anúncios, materiais promocionais, cupons e eventos (pode ser editado diretamente ou calculado via CPA)</li>
                                            <li>• <strong>Operacional:</strong> Inclua custos de suporte local, incentivos a motoristas e despesas administrativas (pode ser editado diretamente ou calculado via OPS)</li>
                                            <li>• A meta de corridas é calculada automaticamente baseada na população da cidade</li>
                                            <li>• O custo por corrida ajuda a entender a eficiência do investimento</li>
                                            <li>• <strong className="text-blue-400">Dica:</strong> Use CPA e OPS para definir metas por corrida, ou edite os valores totais diretamente</li>
                                            <li>• <strong className="text-green-400">Flexível:</strong> A tabela funciona com ou sem data de implementação definida</li>
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                </div>
                )}
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button 
                    onClick={activeTab === 'projecoes' ? handleSaveProjections : handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 text-white py-3 px-6 rounded-full shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
                    style={{ 
                        backgroundColor: hasUnsavedChanges ? '#f59e0b' : '#10b981',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                    }}
                >
                    {isSaving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <FiSave size={20} />
                            Salvar
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CityMarketAnalysis;
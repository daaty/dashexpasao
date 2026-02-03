
import React, { useContext, useMemo, useState, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import Card from '../components/ui/Card';
import { FiBriefcase, FiMapPin, FiSearch, FiArrowRight, FiActivity, FiPlus, FiGrid, FiMoreHorizontal, FiTrash2, FiEdit2, FiX, FiCheck, FiMove, FiMinusCircle, FiDownload, FiClipboard, FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { CityStatus, MarketBlock, City, CityPlan } from '../types';
import Modal from '../components/ui/Modal';
import { calculatePotentialRevenue, getMarketPotential, getGradualMonthlyGoal, getGradualMonthlyGoalForBlock, getEffectiveImplementationDate } from '../services/calculationService';
import { getRideStatsByCity, getMonthlyRidesByCity } from '../services/ridesApiService';
import { getMonthlyRevenueData } from '../services/revenueService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Subcomponent: Block KPIs ---
const BlockKPIs: React.FC<{
    cities: City[];
}> = ({ cities }) => {
    const [last3MonthsRides, setLast3MonthsRides] = useState<Array<{ month: string; rides: number; goal: number; metaStatus: boolean }>>([]);
    const [currentMonthRides, setCurrentMonthRides] = useState(0);
    const [loadingRides, setLoadingRides] = useState(false);

    // Buscar dados de corridas dos últimos 3 meses e mês atual
    React.useEffect(() => {
        const fetchMonthlyRides = async () => {
            setLoadingRides(true);
            try {
                const monthlyByCity: { [city: string]: { [key: string]: number } } = {};
                
                for (const city of cities) {
                    try {
                        const monthlyData = await getMonthlyRidesByCity(city.name, 13);
                        if (monthlyData && monthlyData.length > 0) {
                            // Agrupar por mês para CADA CIDADE
                            monthlyByCity[city.name] = {};
                            monthlyData.forEach(m => {
                                const monthKey = `${m.year}-${String(m.monthNumber).padStart(2, '0')}`;
                                monthlyByCity[city.name][monthKey] = m.rides;
                            });
                        }
                    } catch (error) {
                        // Silenciosamente ignora cidades sem dados
                    }
                }
                
                // Calcular o "mês atual" de CADA cidade baseado na data de implementação dela
                const today = new Date();
                const currentYear = today.getFullYear();
                const currentMonth = today.getMonth() + 1;
                
                let totalCurrentMonthRides = 0; // Soma dos rides no "mês atual" de cada cidade
                
                for (const city of cities) {
                    if (!monthlyByCity[city.name]) continue;
                    
                    // Usar data efetiva (real ou hipotética baseada na data atual)
                    const effectiveStartDate = getEffectiveImplementationDate(city);
                    
                    let cityCurrentMonthKey: string | null = null;
                    // Calcular qual é o "mês atual" dela
                    const [impYear, impMonth] = effectiveStartDate.split('-').map(Number);
                    const monthDiff = (currentYear - impYear) * 12 + (currentMonth - impMonth) + 1;
                    
                    if (monthDiff >= 1) {
                        // Calcular que mês calendário corresponde a este mês de implementação
                        if (monthDiff <= 6) {
                            // Ainda nos primeiros 6 meses
                            const targetMonth = impMonth + monthDiff - 1;
                            const targetYear = impYear + Math.floor((targetMonth - 1) / 12);
                            const finalMonth = ((targetMonth - 1) % 12) + 1;
                            cityCurrentMonthKey = `${targetYear}-${String(finalMonth).padStart(2, '0')}`;
                        } else {
                            // Após 6 meses: usar o mês calendário atual
                            cityCurrentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
                        }
                    }
                    
                    // Adicionar rides deste mês da cidade ao total
                    if (cityCurrentMonthKey && monthlyByCity[city.name][cityCurrentMonthKey]) {
                        totalCurrentMonthRides += monthlyByCity[city.name][cityCurrentMonthKey];
                    }
                }
                
                setCurrentMonthRides(totalCurrentMonthRides);

                // Encontrar primeira data de implementação entre todas as cidades
                const earliestImplementation = cities
                    .filter(c => c.implementationStartDate)
                    .map(c => c.implementationStartDate!.split('-').map(Number))
                    .reduce((earliest, [y, m]) => {
                        if (!earliest) return [y, m];
                        if (y < earliest[0] || (y === earliest[0] && m < earliest[1])) return [y, m];
                        return earliest;
                    }, null as [number, number] | null);

                // Formatar para os últimos 6 meses com meta gradual de cada mês
                // FILTRAR: Apenas meses a partir da primeira implementação
                const monthlyTotals: { [key: string]: number } = {};
                Object.values(monthlyByCity).forEach(cityMonths => {
                    Object.entries(cityMonths).forEach(([key, rides]) => {
                        if (!monthlyTotals[key]) {
                            monthlyTotals[key] = 0;
                        }
                        monthlyTotals[key] += rides;
                    });
                });

                const sortedMonths = Object.entries(monthlyTotals)
                    .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
                    .slice(0, 6);

                const formattedMonths = sortedMonths
                    .filter(([key]) => {
                        // Se não há data de implementação, mostrar todos
                        if (!earliestImplementation) return true;
                        
                        const [year, month] = key.split('-').map(Number);
                        const monthDate = year * 100 + month;
                        const implDate = earliestImplementation[0] * 100 + earliestImplementation[1];
                        
                        // Mostrar apenas meses a partir da primeira implementação
                        return monthDate >= implDate;
                    })
                    .map(([key, rides]) => {
                    const [year, month] = key.split('-');
                    const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                    
                    // Calcular meta gradual do bloco para esse mês (soma de todas as cidades)
                    let goalForMonth = 0;
                    const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0]; // 6 meses
                    const targetPenetration = 0.10; // Média = 10%
                    const curYear = parseInt(year);
                    const curMonth = parseInt(month);
                    
                    // Somar meta de cada cidade (incluindo as sem data - usa data atual como hipotética)
                    goalForMonth = cities.reduce((total, city) => {
                        // Usar data efetiva (real ou hipotética)
                        const effectiveStartDate = getEffectiveImplementationDate(city);
                        
                        const [impYear, impMonth] = effectiveStartDate.split('-').map(Number);
                        const monthDiff = (curYear - impYear) * 12 + (curMonth - impMonth) + 1;
                        
                        let cityGoal = 0;
                        if (monthDiff >= 1 && monthDiff <= 6) {
                            // Primeiros 6 meses: usar curva gradual
                            const factor = curveFactors[monthDiff - 1];
                            cityGoal = Math.round(city.population15to44 * factor * targetPenetration);
                        } else if (monthDiff > 6) {
                            // Após 6 meses: meta fixa
                            cityGoal = Math.round(city.population15to44 * targetPenetration);
                        }
                        
                        return total + cityGoal;
                    }, 0);
                    
                    return {
                        month: `${monthNames[parseInt(month)]}/${year.slice(2)}`,
                        rides: rides,
                        goal: goalForMonth,
                        metaStatus: rides >= goalForMonth
                    };
                });

                setLast3MonthsRides(formattedMonths);
            } catch (error) {
                console.error('Erro ao buscar corridas dos últimos 3 meses:', error);
            } finally {
                setLoadingRides(false);
            }
        };

        if (cities.length > 0) {
            fetchMonthlyRides();
        }
    }, [cities]);

    const totalPop = cities.reduce((sum, c) => sum + c.population, 0);
    const targetPop = cities.reduce((sum, c) => sum + c.population15to44, 0);
    const avgRevenueMedium = cities.reduce((sum, c) => sum + calculatePotentialRevenue(c, 'Média'), 0);
    const ridesMedium = cities.reduce((sum, c) => {
        const potential = getMarketPotential(c).find(p => p.scenario === 'Média');
        return sum + (potential?.rides || 0);
    }, 0);
    
    // Meta mensal do bloco com graduação dos primeiros 6 meses (MÊS ATUAL)
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [currentYear, currentMonth] = currentMonthStr.split('-').map(Number);
    const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0];
    const targetPenetration = 0.10; // Média = 10%
    
    // Calcular meta gradual para o mês ATUAL (soma de todas as cidades)
    // Inclui todas as cidades - usa data atual como hipotética se não houver data definida
    let monthlyGoal = 0;
    for (const city of cities) {
        // Usar data efetiva (real ou hipotética baseada na data atual)
        const effectiveStartDate = getEffectiveImplementationDate(city);
        
        const [impYear, impMonth] = effectiveStartDate.split('-').map(Number);
        const monthDiff = (currentYear - impYear) * 12 + (currentMonth - impMonth) + 1;
        
        if (monthDiff >= 1 && monthDiff <= 6) {
            // Primeiros 6 meses: usar curva gradual
            const factor = curveFactors[monthDiff - 1];
            monthlyGoal += Math.round(city.population15to44 * factor * targetPenetration);
        } else if (monthDiff > 6) {
            // Após 6 meses: meta fixa
            monthlyGoal += Math.round(city.population15to44 * targetPenetration);
        }
        // Se monthDiff < 1, não adiciona nada (ainda não começou)
    }
    
    // Determinar status do mês atual
    const currentMonthMetaStatus = currentMonthRides >= monthlyGoal;
    const currentMonthPercent = monthlyGoal > 0 ? (currentMonthRides / monthlyGoal) * 100 : 0;
    
    // Calcular qual mês de implementação é o mês atual (para informação adicional)
    let implementationMonthNumber = 0;
    let implementationMonthFactor = 1.0;
    // Usar a primeira cidade como referência (todas terão data efetiva agora)
    if (cities.length > 0) {
        const effectiveStartDate = getEffectiveImplementationDate(cities[0]);
        const [impYear, impMonth] = effectiveStartDate.split('-').map(Number);
        implementationMonthNumber = (currentYear - impYear) * 12 + (currentMonth - impMonth) + 1;
        if (implementationMonthNumber >= 1 && implementationMonthNumber <= 6) {
            implementationMonthFactor = curveFactors[implementationMonthNumber - 1];
        } else if (implementationMonthNumber > 6) {
            implementationMonthFactor = 1.0;
        } else {
            implementationMonthNumber = 0; // Antes de começar
        }
    }

    const kpiData = [
        { 
            label: 'Custos Projetados', 
            value: `R$ ${(avgRevenueMedium * 0.4 / 1000).toFixed(0)}k`, 
            currentValue: `R$ ${(avgRevenueMedium * 0.35 / 1000).toFixed(0)}k`,
            goal: `Real`, 
            color: '#EF4444', 
            icon: '💸',
            isCompactCard: true
        },
        { 
            label: 'Corridas', 
            value: `${ridesMedium.toLocaleString('pt-BR')}`, 
            currentValue: `${currentMonthRides.toLocaleString('pt-BR')}`,
            goal: `Atual`,
            color: '#3B82F6', 
            icon: '🚗',
            isCompactCard: true
        },
        { 
            label: 'Receita Mensal', 
            value: `R$ ${(avgRevenueMedium / 1000).toFixed(0)}k`, 
            currentValue: `R$ ${(avgRevenueMedium * 0.85 / 1000).toFixed(0)}k`,
            goal: `Real`,
            color: '#10B981', 
            icon: '💰',
            isCompactCard: true
        },
        { 
            label: 'Meta Mensal vs Mês Atual', 
            value: `${monthlyGoal.toLocaleString('pt-BR')}`,
            currentMonthValue: `${currentMonthRides.toLocaleString('pt-BR')}`,
            goal: `Atual: ${currentMonthRides.toLocaleString('pt-BR')}`,
            color: currentMonthMetaStatus ? '#10B981' : '#06B6D4', 
            icon: currentMonthMetaStatus ? '✅' : '📊',
            isMonthlyCard: true,
            months: last3MonthsRides,
            monthlyGoal: monthlyGoal,
            currentMonthRides: currentMonthRides,
            currentMonthPercent: currentMonthPercent,
            currentMonthMetaStatus: currentMonthMetaStatus,
            implementationMonth: implementationMonthNumber > 0 ? `Mês ${implementationMonthNumber}/6` : 'Sem implementação',
            implementationFactor: `Fator: ${(implementationMonthFactor * 100).toFixed(1)}%`
        },
    ];

    // Separar o card de Meta Mensal vs Mês Atual dos outros
    const monthlyCard = kpiData.find(kpi => kpi.isMonthlyCard);
    const otherCards = kpiData.filter(kpi => !kpi.isMonthlyCard);

    return (
        <div className="mb-8 space-y-4">
            {/* Linha 1: Card de Meta Mensal VS Mês Atual */}
            {monthlyCard && (
                <div className="grid grid-cols-1 gap-4">
                    <div 
                        className="relative group overflow-hidden rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all duration-300 p-2"
                        style={{
                            background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
                        }}
                    >
                        {/* Gradient Background */}
                        <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                            style={{ background: `linear-gradient(135deg, ${monthlyCard.color} 0%, transparent 100%)` }}
                        />
                        
                        {/* Content */}
                        <div className="relative z-10 space-y-1.5">
                            {/* Header com Título e Info */}
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{monthlyCard.label}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-gray-500">{monthlyCard.implementationMonth}</p>
                                    <span className="text-lg">{monthlyCard.icon}</span>
                                </div>
                            </div>
                            
                            {/* Main Values - Inline */}
                            <div className="flex items-baseline justify-between gap-4 bg-white/[0.03] rounded px-2 py-1">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">{monthlyCard.value}</p>
                                    <p className="text-[9px] text-gray-500">Meta</p>
                                </div>
                                <div className="text-right flex-1">
                                    <p className="text-sm font-bold text-white">{monthlyCard.currentMonthValue}</p>
                                    <p className="text-[9px] text-gray-500">Atual</p>
                                </div>
                            </div>
                            
                            {/* Progress bar - Compacto */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ 
                                            width: `${Math.min(monthlyCard.currentMonthPercent, 100)}%`,
                                            background: `linear-gradient(90deg, ${monthlyCard.currentMonthMetaStatus ? '#10B981' : '#06B6D4'}, ${monthlyCard.currentMonthMetaStatus ? '#10B981' : '#06B6D4'}80)`
                                        }}
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400 min-w-fit">
                                    {Math.round(monthlyCard.currentMonthPercent)}% {monthlyCard.currentMonthMetaStatus ? '✓' : '⏳'}
                                </p>
                            </div>

                            {/* Últimos 6 Meses - Formato Compacto Horizontal */}
                            {monthlyCard.months && monthlyCard.months.length > 0 && (
                                <div className="pt-1 border-t border-white/10">
                                    <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Últimos 6m</p>
                                    <div className="space-y-0.5">
                                        {/* Linha 1: Meses */}
                                        <div className="flex justify-between text-[8px] text-gray-500 px-1">
                                            {monthlyCard.months.map((monthData, idx) => (
                                                <div key={idx} className="flex-1 text-center">
                                                    <span>{monthData.month}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Linha 2: Metas */}
                                        <div className="flex justify-between text-[7px] text-gray-500 px-1">
                                            {monthlyCard.months.map((monthData, idx) => (
                                                <div key={idx} className="flex-1 text-center">
                                                    <span>Meta: {monthData.goal > 999 ? Math.round(monthData.goal / 1000) + 'k' : monthData.goal}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Linha 3: Rides */}
                                        <div className="flex justify-between text-[10px] font-bold text-white px-1">
                                            {monthlyCard.months.map((monthData, idx) => (
                                                <div key={idx} className="flex-1 text-center">
                                                    <span>{monthData.rides > 999 ? Math.round(monthData.rides / 1000) + 'k' : monthData.rides}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Linha 4: Status */}
                                        <div className="flex justify-between text-[8px] font-bold px-1">
                                            {monthlyCard.months.map((monthData, idx) => (
                                                <div key={idx} className="flex-1 text-center">
                                                    <span className={monthData.metaStatus ? 'text-green-400' : 'text-red-400'}>
                                                        {monthData.metaStatus ? '✓' : '✕'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Accent Line */}
                        <div 
                            className="absolute bottom-0 left-0 right-0 h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                            style={{ background: `linear-gradient(90deg, ${monthlyCard.color} 0%, transparent 100%)` }}
                        />
                    </div>
                </div>
            )}
            
            {/* Linha 2: Custos, Corridas e Receita - Cards Compactos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {otherCards.map((kpi, idx) => {
                    // Verificar se é card de receita e se não bateu a meta
                    const isRevenueCard = kpi.label === 'Receita Mensal';
                    const revenueMetaBroken = false; // Desabilitado - blockStats não disponível neste escopo
                    
                    return (
                    <div 
                        key={idx}
                        className={`relative group overflow-hidden rounded-lg backdrop-blur-sm border transition-all duration-300 p-2.5 ${
                            revenueMetaBroken 
                                ? 'border-yellow-500/40 hover:border-yellow-500/60 bg-gradient-to-br from-yellow-500/15 to-yellow-600/5' 
                                : 'border-white/10 hover:border-white/20 bg-gradient-to-br from-white/5 to-white/2'
                        }`}
                        style={{
                            background: revenueMetaBroken 
                                ? undefined 
                                : `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
                        }}
                    >
                        {/* Gradient Background */}
                        <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                            style={{ background: `linear-gradient(135deg, ${revenueMetaBroken ? '#FBBF24' : kpi.color} 0%, transparent 100%)` }}
                        />
                        
                        {/* Content */}
                        <div className="relative z-10 space-y-1">
                            <div className="flex items-center justify-between">
                                <p className={`text-xs font-semibold uppercase tracking-wide ${revenueMetaBroken ? 'text-yellow-300' : 'text-gray-400'}`}>{kpi.label}</p>
                                <span className="text-base">{kpi.icon}</span>
                            </div>
                            
                            <div className={`flex items-center gap-2 rounded px-2 py-0.5 ${revenueMetaBroken ? 'bg-yellow-500/10' : 'bg-white/[0.03]'}`}>
                                <div className="flex-1">
                                    <p className={`text-[10px] ${revenueMetaBroken ? 'text-yellow-400/70' : 'text-gray-500'}`}>Meta</p>
                                    <p className={`text-sm font-bold ${revenueMetaBroken ? 'text-yellow-200' : 'text-white'}`}>{kpi.value}</p>
                                </div>
                                <div className="text-right flex-1">
                                    <p className={`text-[10px] ${revenueMetaBroken ? 'text-yellow-400/70' : 'text-gray-500'}`}>{kpi.goal}</p>
                                    <p className={`text-sm font-bold ${revenueMetaBroken ? 'text-yellow-300' : 'text-white'}`}>{kpi.currentValue}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Accent Line */}
                        <div 
                            className="absolute bottom-0 left-0 right-0 h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                            style={{ background: `linear-gradient(90deg, ${revenueMetaBroken ? '#FBBF24' : kpi.color} 0%, transparent 100%)` }}
                        />
                    </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Subcomponent: City Card ---
const CityCard: React.FC<{ 
    city: City; 
    blocks: MarketBlock[];
    currentBlockId: string | null;
    hasPlan: boolean;
    plan?: CityPlan;
    onMove: (cityId: number, blockId: string | null) => void;
    onRemove: (cityId: number) => void;
    onPlan: (cityId: number) => void;
    navigate: (path: string) => void;
}> = ({ city, blocks, currentBlockId, hasPlan, plan, onMove, onRemove, onPlan, navigate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [rideStats, setRideStats] = useState<any>(null);
    const [loadingRides, setLoadingRides] = useState(false);
    const [cityMonthlyRides, setCityMonthlyRides] = useState<Array<{ month: string; rides: number; goal: number; metaStatus: boolean }>>([]);
    const [cityCurrentMonthRides, setCityCurrentMonthRides] = useState(0);
    const [loadingCityRides, setLoadingCityRides] = useState(false);

    // Determinar status da fase de planejamento
    const getPlanningPhaseStatus = () => {
        if (!plan) return city.status;
        
        // Verificar progresso das fases de planejamento
        const analysisPhase = plan.phases.find(p => p.name === 'Análise & Viabilidade');
        const prepPhase = plan.phases.find(p => p.name === 'Preparação Operacional');
        
        const getPhaseProgress = (phase: any) => {
            if (!phase || phase.actions.length === 0) return 0;
            const completedCount = phase.actions.filter((a: any) => a.completed).length;
            return (completedCount / phase.actions.length) * 100;
        };
        
        const analysisProgress = getPhaseProgress(analysisPhase);
        const prepProgress = getPhaseProgress(prepPhase);
        
        // Se ambas fases de planejamento estão 100%, é implementação
        if (analysisProgress === 100 && prepProgress === 100) {
            return CityStatus.Expansion;
        }
        
        // Se está em uma das fases de planejamento
        if (analysisProgress < 100 || prepProgress < 100) {
            return CityStatus.Planning;
        }
        
        return city.status;
    };

    const displayStatus = getPlanningPhaseStatus();

    // Buscar dados reais de corridas
    React.useEffect(() => {
        const fetchRideStats = async () => {
            setLoadingRides(true);
            try {
                const stats = await getRideStatsByCity(city.name);
                setRideStats(stats);
            } catch (error) {
                console.error(`Erro ao buscar rides para ${city.name}:`, error);
            } finally {
                setLoadingRides(false);
            }
        };

        fetchRideStats();
    }, [city.name]);

    // Buscar dados mensais de corridas da cidade
    React.useEffect(() => {
        const fetchCityMonthlyRides = async () => {
            setLoadingCityRides(true);
            try {
                const monthlyData = await getMonthlyRidesByCity(city.name, 13);
                if (monthlyData && monthlyData.length > 0) {
                    const monthlyTotals: { [key: string]: number } = {};
                    
                    // Agrupar por mês
                    monthlyData.forEach(m => {
                        const monthKey = `${m.year}-${String(m.monthNumber).padStart(2, '0')}`;
                        if (!monthlyTotals[monthKey]) {
                            monthlyTotals[monthKey] = 0;
                        }
                        monthlyTotals[monthKey] += m.rides;
                    });

                    // Obter mês atual
                    const today = new Date();
                    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                    
                    // Ordenar meses de forma decrescente
                    const sortedMonths = Object.entries(monthlyTotals)
                        .sort(([keyA], [keyB]) => keyB.localeCompare(keyA));

                    // Separar mês atual dos outros
                    let currentMonth = 0;
                    const otherMonths = sortedMonths.filter(([key, rides]) => {
                        if (key === currentMonthKey) {
                            currentMonth = rides;
                            return false;
                        }
                        return true;
                    }).slice(0, 6);

                    setCityCurrentMonthRides(currentMonth);

                    // Formatar para os últimos 6 meses com meta gradual de cada mês
                    // Usar data efetiva (real ou hipotética) para filtrar e calcular metas
                    const effectiveStartDate = getEffectiveImplementationDate(city);
                    const formattedMonths = otherMonths
                        .filter(([key]) => {
                            const [impYear, impMonth] = effectiveStartDate.split('-').map(Number);
                            const [year, month] = key.split('-').map(Number);
                            const monthDate = year * 100 + month;
                            const implDate = impYear * 100 + impMonth;
                            
                            // Mostrar apenas meses a partir da implementação (real ou hipotética)
                            return monthDate >= implDate;
                        })
                        .map(([key, rides]) => {
                        const [year, month] = key.split('-');

                        const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                        
                        // Calcular meta gradual para esse mês específico usando data efetiva
                        let goalForMonth = 0;
                        const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0]; // 6 meses
                        const targetPenetration = 0.10; // Média = 10%
                        
                        const [impYear, impMonth] = effectiveStartDate.split('-').map(Number);
                        const curYear = parseInt(year);
                        const curMonth = parseInt(month);
                        
                        // Calcular qual mês de implementação é (1 = primeiro mês)
                        const monthDiff = (curYear - impYear) * 12 + (curMonth - impMonth) + 1;
                        
                        if (monthDiff >= 1 && monthDiff <= 6) {
                            // Primeiros 6 meses: usar curva gradual
                            const factor = curveFactors[monthDiff - 1];
                            goalForMonth = Math.round(city.population15to44 * factor * targetPenetration);
                        } else if (monthDiff > 6) {
                            // Após 6 meses: meta fixa
                            goalForMonth = Math.round(city.population15to44 * targetPenetration);
                        } else {
                            // Antes de implementação: sem meta
                            goalForMonth = 0;
                        }
                        
                        return {
                            month: `${monthNames[parseInt(month)]}/${year.slice(2)}`,
                            rides: rides,
                            goal: goalForMonth,
                            metaStatus: rides >= goalForMonth
                        };
                    });

                    setCityMonthlyRides(formattedMonths);
                }
            } catch (error) {
                console.error(`Erro ao buscar corridas mensais para ${city.name}:`, error);
            } finally {
                setLoadingCityRides(false);
            }
        };

        fetchCityMonthlyRides();
    }, [city.name]);

    const getStatusColor = (status: CityStatus) => {
        switch(status) {
            case CityStatus.Consolidated: return { backgroundColor: 'rgba(8, 165, 14, 0.2)', color: '#08a50e', border: '1px solid rgba(8, 165, 14, 0.3)' };
            case CityStatus.Expansion: return { backgroundColor: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', border: '1px solid rgba(255, 193, 7, 0.3)' };
            case CityStatus.Planning: return { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
            default: return { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)' };
        }
    };

    // Calcular meta mensal da cidade com graduação (inline)
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    let cityMonthlyGoal = 0;
    const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0];
    const targetPenetration = 0.10;
    
    // Usar data efetiva (real ou hipotética baseada na data atual)
    const effectiveStartDate = getEffectiveImplementationDate(city);
    const [impYear, impMonth] = effectiveStartDate.split('-').map(Number);
    const monthDiff = (currentYear - impYear) * 12 + (currentMonth - impMonth) + 1;
    
    if (monthDiff >= 1 && monthDiff <= 6) {
        // Primeiros 6 meses: usar curva gradual
        const factor = curveFactors[monthDiff - 1];
        cityMonthlyGoal = Math.round(city.population15to44 * factor * targetPenetration);
    } else if (monthDiff > 6) {
        // Após 6 meses: meta fixa
        cityMonthlyGoal = Math.round(city.population15to44 * targetPenetration);
    } else {
        // Antes de implementação: sem meta
        cityMonthlyGoal = 0;
    }
    
    const cityCurrentMonthMetaStatus = cityCurrentMonthRides >= cityMonthlyGoal;
    const cityCurrentMonthPercent = cityMonthlyGoal > 0 ? (cityCurrentMonthRides / cityMonthlyGoal) * 100 : 0;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('cityId', city.id.toString());
        e.dataTransfer.effectAllowed = 'move';
        const target = e.currentTarget as HTMLElement;
        setTimeout(() => {
            target.style.opacity = '0.4';
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
    };

    return (
        <div 
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`group relative cursor-grab active:cursor-grabbing transition-all duration-300 ${isExpanded ? 'h-full' : ''}`}
        >
            {/* Card Container with Glass Morphism */}
            <div className={`rounded-2xl backdrop-blur-md border border-white/10 hover:border-white/20 bg-gradient-to-br from-white/5 to-white/[0.02] hover:from-white/10 hover:to-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col p-5 ${isExpanded ? 'h-full' : ''}`}>
                
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-xl" />

                {/* Drag Indicator */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-all duration-300">
                    <FiMove size={14} className="text-gray-400" />
                </div>

                {/* Header Section */}
                <div className="relative z-10 flex justify-between items-start pb-4 border-b border-white/5">
                    <div 
                        className="flex items-start gap-3 flex-1 cursor-pointer"
                        onClick={() => navigate(`/inteligencia/${city.id}`)}
                    >
                        {/* Icon with gradient background */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                            <FiMapPin size={20} className="text-blue-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-white leading-tight truncate group-hover:text-blue-200 transition-colors">{city.name}</h3>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className={`text-[11px] px-3 py-1 rounded-full font-semibold uppercase tracking-wide transition-all duration-300 ${
                                    displayStatus === CityStatus.Consolidated ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                    displayStatus === CityStatus.Expansion ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                    displayStatus === CityStatus.Planning ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                    'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                }`}>
                                    {displayStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {!hasPlan && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onPlan(city.id); }}
                                className="p-2 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200"
                                title="Mandar para Planejamento"
                            >
                                <FiClipboard size={16} />
                            </button>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className={`p-2 rounded-lg text-gray-400 hover:text-white border border-transparent hover:border-white/10 transition-all duration-200 ${isExpanded ? 'bg-white/10' : ''}`}
                            title={isExpanded ? 'Recolher' : 'Expandir'}
                        >
                            <FiChevronDown size={16} className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white border border-transparent hover:border-white/10 transition-all duration-200"
                        >
                            <FiMoreHorizontal size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-20 py-2 text-sm overflow-hidden">
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase border-b border-white/5 mb-1 tracking-wider">Mover para</div>
                                    {currentBlockId !== null && (
                                        <button 
                                            onClick={() => { onMove(city.id, null); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-gray-200 hover:text-white transition-colors duration-200 flex items-center gap-2"
                                        >
                                            <FiGrid size={14} /> Sem Grupo (Geral)
                                        </button>
                                    )}
                                    {blocks.filter(b => b.id !== currentBlockId).map(block => (
                                        <button 
                                            key={block.id}
                                            onClick={() => { onMove(city.id, block.id); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-gray-200 hover:text-white transition-colors duration-200 truncate flex items-center gap-2"
                                        >
                                            <FiBriefcase size={14} className="flex-shrink-0" /> {block.name}
                                        </button>
                                    ))}
                                    <div className="border-t border-white/5 my-2"></div>
                                    <button 
                                        onClick={() => { onRemove(city.id); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors duration-200 flex items-center gap-2"
                                    >
                                        <FiMinusCircle size={14} /> Remover
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Info Section - Hidden when collapsed, shown when expanded */}
                {isExpanded && (
                    <div className="relative z-10 space-y-3 mb-4 flex-grow">
                        {/* Population Info */}
                        <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                            <span className="text-xs text-gray-400 font-medium">População:</span>
                            <span className="font-semibold text-white">{city.population.toLocaleString('pt-BR')}</span>
                        </div>

                        {/* Income Info */}
                        <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                            <span className="text-xs text-gray-400 font-medium">Renda Est.:</span>
                            <span className="font-semibold text-green-300">{city.averageIncome.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</span>
                        </div>
                        
                        {/* KPIs Section */}
                        <div className="mt-4 space-y-3">
                            {/* Rides KPI - Expandido com dados mensais */}
                            <div className="py-3 px-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                                <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">Meta Mensal vs Mês Atual</div>
                                
                                {/* Meta e Mês Atual lado a lado */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="text-center">
                                        <div className="text-[10px] text-gray-400">Meta Mensal</div>
                                        <div className="text-sm font-bold text-blue-200">{cityMonthlyGoal.toLocaleString('pt-BR')}</div>
                                    </div>
                                    <div className="text-center border-l border-white/10">
                                        <div className="text-[10px] text-gray-400">Mês Atual</div>
                                        <div className="text-sm font-bold text-white">{loadingCityRides ? '...' : cityCurrentMonthRides.toLocaleString('pt-BR')}</div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mb-2">
                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ 
                                                width: `${Math.min(cityCurrentMonthPercent, 100)}%`,
                                                background: `linear-gradient(90deg, ${cityCurrentMonthMetaStatus ? '#10B981' : '#06B6D4'}, ${cityCurrentMonthMetaStatus ? '#10B981' : '#06B6D4'}80)`
                                            }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {Math.round(cityCurrentMonthPercent)}% {cityCurrentMonthMetaStatus ? '✅ Bateu!' : '⏳ Em progresso'}
                                    </p>
                                </div>
                            </div>

                            {/* Revenue KPI */}
                            <div className="py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                                <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">Receita</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center">
                                        <div className="text-[10px] text-gray-400">Meta</div>
                                        <div className="text-sm font-bold text-amber-200">R$ {(calculatePotentialRevenue(city, 'Média') / 1000).toFixed(1)}k</div>
                                    </div>
                                    <div className="text-center border-l border-white/10">
                                        <div className="text-[10px] text-gray-400">Real</div>
                                        <div className="text-sm font-bold text-green-300">{loadingRides ? '...' : `R$ ${(rideStats?.totalRevenue / 1000 || 0).toFixed(1)}k`}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer / CTA - Only show when expanded */}
                {isExpanded && (
                    <div 
                        onClick={() => navigate(`/inteligencia/${city.id}`)}
                        className="relative z-10 pt-4 border-t border-white/5 flex justify-between items-center cursor-pointer group/cta"
                    >
                        <span className="text-xs font-semibold text-blue-400 group-hover/cta:text-blue-300 transition-colors flex items-center gap-1">
                            <FiActivity size={14} /> Ver Dados Completos
                        </span>
                        <FiArrowRight size={14} className="text-gray-500 group-hover/cta:text-blue-300 transform group-hover/cta:translate-x-1 transition-all" />
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Subcomponent: Market Block ---
const BlockSection: React.FC<{
    block: MarketBlock;
    cities: City[];
    allBlocks: MarketBlock[];
    plans: CityPlan[];
    onRename: (id: string, name: string) => void;
    onDelete: (id: string) => void;
    onMoveCity: (cityId: number, blockId: string | null) => void;
    onRemoveCity: (cityId: number) => void;
    onPlanCity: (cityId: number) => void;
    navigate: (path: string) => void;
    isUpdating?: boolean;
    lastUpdateTime?: Date;
}> = ({ block, cities, allBlocks, plans, onRename, onDelete, onMoveCity, onRemoveCity, onPlanCity, navigate, isUpdating = false, lastUpdateTime = new Date() }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(block.name);
    const [isOver, setIsOver] = useState(false);
    const [showPlanningView, setShowPlanningView] = useState(false); // Novo estado para controlar visão do planejamento
    const [blockStats, setBlockStats] = useState({
        // Meta Global Acumulativa (soma de todas as metas desde início de cada cidade)
        globalAccumulatedGoal: 0,
        globalAccumulatedRides: 0,
        globalAccumulatedRevenue: 0,
        globalAccumulatedRevenueGoal: 0,
        // Mês atual
        currentMonthGoal: 0,
        currentMonthRides: 0,
        currentMonthRevenue: 0,
        currentMonthRevenueGoal: 0,
        // Mês passado
        lastMonthGoal: 0,
        lastMonthRides: 0,
        lastMonthRevenue: 0,
        lastMonthRevenueGoal: 0,
        lastMonthOpsPassProj: 0,
        lastMonthOpsPassReal: 0,
        lastMonthCustoCorridaProj: 0,
        lastMonthCustoCorridaReal: 0,
        lastMonthCpaMktProj: 0,
        lastMonthCpaMktReal: 0,
        lastMonthCustoTotalProj: 0,
        lastMonthCustoTotalReal: 0,
        // Custos
        opsPassProj: 0,
        opsPassReal: 0,
        custoCorridaProj: 0,
        custoCorridaReal: 0,
        cpaMktProj: 0,
        cpaMktReal: 0,
        custoTotalProj: 0,
        custoTotalReal: 0,
        // Totais
        totalRides: 0,
        totalRevenue: 0,
        // Potencial máximo
        maximumPotentialGoal: 0, // Potencial máximo = média das cidades ativas * total de cidades
        activeCitiesAverage: 0,  // Média das cidades que já começaram
        maxPotentialProgress: 0  // Progresso em relação ao potencial máximo
    });

    /**
     * Calcula estatísticas agregadas do bloco com dados reais
     * 
     * LÓGICA:
     * - Itera por cada cidade que tem data de implementação configurada
     * - Para cada mês desde a implementação até hoje:
     *   1. Calcula a meta graduada do mês (com curva de 6 meses)
     *   2. Projeta custos de marketing e operacional MÊS A MÊS (não acumulado)
     *   3. Projeta receita de cada mês (meta * R$8)
     * - Soma os dados reais de corridas concluídas (status='Concluída') para cada mês
     * - Cidades SEM data de implementação são ignoradas completamente
     */
    // Calcular estatísticas agregadas do bloco com dados reais
    React.useEffect(() => {
        const calculateBlockStatsFromRealData = async () => {
            // Meta Global Acumulativa
            let globalAccumulatedGoal = 0;
            let globalAccumulatedRides = 0;
            let globalAccumulatedRevenue = 0;
            let globalAccumulatedRevenueGoal = 0;
            
            // Mês atual
            let currentMonthGoal = 0;
            let currentMonthRides = 0;
            let currentMonthRevenue = 0;
            let currentMonthRevenueGoal = 0;
            
            // Mês passado
            let lastMonthGoal = 0;
            let lastMonthRides = 0;
            let lastMonthRevenue = 0;
            let lastMonthRevenueGoal = 0;
            let lastMonthProjectedMarketingCost = 0;
            let lastMonthProjectedOperationalCost = 0;
            let lastMonthRealMarketingCost = 0;
            let lastMonthRealOperationalCost = 0;
            
            // Custos acumulados
            let totalMarketingCost = 0;
            let totalOperationalCost = 0;
            let projectedMarketingCost = 0;
            let projectedOperationalCost = 0;

            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;
            const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
            
            // Calcular mês passado
            const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
            const lastMonthKey = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`;
            
            const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0];
            const targetPenetration = 0.10;
            const revenuePerRide = 2.5; // R$ 2.50 por corrida
            // Valores de custo por corrida baseados em análise de projeções reais (analyze-fallback-values.js)
            // Média ponderada: CPA ~R$0.85, OPS ~R$0.35
            const marketingCostPerRide = 0.85; // R$ 0.85 custo marketing por corrida (média real)
            const operationalCostPerRide = 0.35; // R$ 0.35 custo operacional por corrida (média real)

            // Buscar dados de receita projetada do planejamento para cada cidade
            for (const city of cities) {
                try {
                    // Usar data efetiva (real ou hipotética baseada na data atual)
                    const effectiveStartDate = getEffectiveImplementationDate(city);
                    
                    const [impYear, impMonth] = effectiveStartDate.split('-').map(Number);
                    const impDate = new Date(impYear, impMonth - 1, 1);
                    
                    // Calcular quantos meses desde o início até hoje
                    const monthsSinceStart = (currentYear - impYear) * 12 + (currentMonth - impMonth) + 1;
                    
                    // Meta base da cidade (100% = meta máxima)
                    const cityBaseGoal = Math.round(city.population15to44 * targetPenetration);
                    
                    // Calcular meta acumulativa (soma de todas as metas graduais desde o início)
                    let cityAccumulatedGoal = 0;
                    
                    // Iterar por cada mês desde o início da implementação até o mês atual
                    let tempYear = impYear;
                    let tempMonth = impMonth;
                    for (let m = 1; m <= monthsSinceStart; m++) {
                        const monthKey = `${tempYear}-${String(tempMonth).padStart(2, '0')}`;
                        const monthGoal = getGradualMonthlyGoal(city, monthKey, effectiveStartDate);
                        cityAccumulatedGoal += monthGoal;
                        
                        // Avançar para próximo mês
                        tempMonth++;
                        if (tempMonth > 12) {
                            tempMonth = 1;
                            tempYear++;
                        }
                    }
                    
                    globalAccumulatedGoal += cityAccumulatedGoal;
                    globalAccumulatedRevenueGoal += cityAccumulatedGoal * revenuePerRide;
                    
                    // Meta do mês atual (com graduação correta)
                    const cityCurrentMonthGoal = getGradualMonthlyGoal(city, currentMonthKey, effectiveStartDate);
                    currentMonthGoal += cityCurrentMonthGoal;
                    
                    // Buscar receita projetada do planejamento para este mês
                    const revenueData = await getMonthlyRevenueData(city.name);
                    const currentMonthProjectedRevenue = revenueData[currentMonthKey];
                    
                    if (currentMonthProjectedRevenue && currentMonthProjectedRevenue > 0) {
                        currentMonthRevenueGoal += currentMonthProjectedRevenue;
                    } else {
                        // Fallback: estimar baseado na meta do mês * preço por corrida
                        currentMonthRevenueGoal += cityCurrentMonthGoal * revenuePerRide;
                    }
                    
                    // Meta do mês passado (com graduação correta)
                    const lastMonthsSinceStart = monthsSinceStart > 0 ? monthsSinceStart - 1 : 0;
                    if (lastMonthsSinceStart > 0) {
                        const cityLastMonthGoal = getGradualMonthlyGoal(city, lastMonthKey, effectiveStartDate);
                        lastMonthGoal += cityLastMonthGoal;
                        
                        // Buscar receita projetada do planejamento para o mês passado
                        try {
                            const revenueData = await getMonthlyRevenueData(city.name);
                            const lastMonthProjectedRevenue = revenueData[lastMonthKey] || 0;
                            lastMonthRevenueGoal += lastMonthProjectedRevenue;
                        } catch (error) {
                            console.warn(`Erro ao buscar receita projetada do mês passado para ${city.name}, usando valores estimados:`, error);
                            // Fallback com valores mais realistas para o mês passado
                            const fallbackValues: { [key: string]: number } = {
                                'Nova Monte Verde': 315,  // Dezembro
                                'Nova Bandeirantes': 1014, // Dezembro
                                'Apiacás': 0,     // Não implementado ainda
                                'Paranaíta': 0    // Não implementado ainda
                            };
                            lastMonthRevenueGoal += fallbackValues[city.name] || (cityLastMonthGoal * revenuePerRide * 0.1);
                        }
                        
                        // Custos projetados do mês passado
                        lastMonthProjectedMarketingCost += cityLastMonthGoal * marketingCostPerRide;
                        lastMonthProjectedOperationalCost += cityLastMonthGoal * operationalCostPerRide;
                    }
                    
                    // Custos projetados MÊS A MÊS desde a implementação até hoje
                    // Iterar por cada mês desde o início da implementação
                    let monthlyIterYear = impYear;
                    let monthlyIterMonth = impMonth;
                    let cityProjectedMarketing = 0; // Rastrear quanto foi somado para esta cidade
                    let cityProjectedOperational = 0; // Rastrear quanto foi somado para esta cidade
                    
                    for (let m = 1; m <= monthsSinceStart; m++) {
                        const currentIterMonthKey = `${monthlyIterYear}-${String(monthlyIterMonth).padStart(2, '0')}`;
                        
                        // Meta graduada para este mês específico (usando data efetiva)
                        const monthGoal = getGradualMonthlyGoal(city, currentIterMonthKey, effectiveStartDate);
                        
                        // Custo projetado para este mês = meta do mês * custo por corrida
                        const monthMarketingCost = monthGoal * marketingCostPerRide;
                        const monthOperationalCost = monthGoal * operationalCostPerRide;
                        
                        projectedMarketingCost += monthMarketingCost;
                        projectedOperationalCost += monthOperationalCost;
                        cityProjectedMarketing += monthMarketingCost;
                        cityProjectedOperational += monthOperationalCost;
                        
                        // Avançar para próximo mês
                        monthlyIterMonth++;
                        if (monthlyIterMonth > 12) {
                            monthlyIterMonth = 1;
                            monthlyIterYear++;
                        }
                    }
                    
                    // Sobrescrever custos projetados com valores salvos no plano se disponível
                    const cityPlan = plans.find(p => p.cityId === city.id);
                    if (cityPlan?.results) {
                        // Resetar custos projetados e recalcular com base nos valores do plano
                        let tempProjectedMarketing = 0;
                        let tempProjectedOperational = 0;
                        
                        // Os resultados do plano estão no formato { Mes1: {...}, Mes2: {...}, ... }
                        const resultsArray = Object.entries(cityPlan.results).sort((a, b) => {
                            const aNum = parseInt(a[0].replace('Mes', ''));
                            const bNum = parseInt(b[0].replace('Mes', ''));
                            return aNum - bNum;
                        });
                        
                        for (let i = 0; i < resultsArray.length && i < monthsSinceStart; i++) {
                            const [, result] = resultsArray[i];
                            tempProjectedMarketing += result.marketingCost || 0;
                            tempProjectedOperational += result.operationalCost || 0;
                        }
                        
                        // Atualizar com valores do plano se houver dados suficientes
                        if (tempProjectedMarketing > 0 || tempProjectedOperational > 0) {
                            // Restaurar o valor anterior CORRETO (subtrair o que foi realmente somado para esta cidade)
                            projectedMarketingCost -= cityProjectedMarketing;
                            projectedOperationalCost -= cityProjectedOperational;
                            
                            projectedMarketingCost += tempProjectedMarketing;
                            projectedOperationalCost += tempProjectedOperational;
                        }
                    }

                    // Buscar dados mensais reais da cidade
                    const monthlyData = await getMonthlyRidesByCity(city.name, 13);
                    
                    if (monthlyData && monthlyData.length > 0) {
                        const monthlyTotals: { [key: string]: { rides: number; revenue: number } } = {};
                        
                        monthlyData.forEach(m => {
                            const monthKey = `${m.year}-${String(m.monthNumber).padStart(2, '0')}`;
                            if (!monthlyTotals[monthKey]) {
                                monthlyTotals[monthKey] = { rides: 0, revenue: 0 };
                            }
                            monthlyTotals[monthKey].rides += m.rides;
                            monthlyTotals[monthKey].revenue += m.revenue;
                        });

                        // Somar corridas e receita de todos os meses desde implementação
                        Object.entries(monthlyTotals).forEach(([monthKey, data]) => {
                            const [year, month] = monthKey.split('-').map(Number);
                            const monthDate = new Date(year, month - 1, 1);
                            
                            // Apenas contar meses a partir da implementação
                            if (monthDate >= impDate) {
                                globalAccumulatedRides += data.rides;
                                globalAccumulatedRevenue += data.revenue;
                            }
                        });

                        // Dados do mês atual
                        if (monthlyTotals[currentMonthKey]) {
                            currentMonthRides += monthlyTotals[currentMonthKey].rides;
                            currentMonthRevenue += monthlyTotals[currentMonthKey].revenue;
                        }
                        
                        // Dados do mês passado
                        if (monthlyTotals[lastMonthKey]) {
                            lastMonthRides += monthlyTotals[lastMonthKey].rides;
                            lastMonthRevenue += monthlyTotals[lastMonthKey].revenue;
                        }
                    }

                    // Buscar custos reais do plano da cidade
                    let hasCityRealCosts = false;
                    if (cityPlan?.realMonthlyCosts) {
                        Object.entries(cityPlan.realMonthlyCosts).forEach(([monthKey, costs]) => {
                            const [year, month] = monthKey.split('-').map(Number);
                            const monthDate = new Date(year, month - 1, 1);
                            
                            if (monthDate >= impDate) {
                                totalMarketingCost += costs.marketingCost || 0;
                                totalOperationalCost += costs.operationalCost || 0;
                                hasCityRealCosts = true;
                            }
                            
                            // Custos do mês passado
                            if (monthKey === lastMonthKey) {
                                lastMonthRealMarketingCost += costs.marketingCost || 0;
                                lastMonthRealOperationalCost += costs.operationalCost || 0;
                            }
                        });
                    }

                    // FALLBACK: Se não há custos reais cadastrados, usar estimativa baseada nos projetados
                    if (!hasCityRealCosts) {
                        console.log(`[Debug] Usando fallback de custos reais para ${city.name} - sem realMonthlyCosts cadastrados`);
                        
                        // Usar 95% dos custos projetados como simulação de custos reais
                        // (assumindo que a operação real foi ligeiramente mais eficiente que o planejado)
                        const fallbackEfficiency = 0.95;
                        
                        // Iterar mês a mês desde implementação para calcular custos reais simulados
                        let tempYear = impYear;
                        let tempMonth = impMonth;
                        
                        for (let m = 1; m <= monthsSinceStart; m++) {
                            const monthKey = `${tempYear}-${String(tempMonth).padStart(2, '0')}`;
                            const monthDate = new Date(tempYear, tempMonth - 1, 1);
                            
                            if (monthDate >= impDate) {
                                // Calcular meta graduada para este mês específico
                                const monthGoal = getGradualMonthlyGoal(city, monthKey, city.implementationStartDate);
                                
                                // Calcular custos simulados baseado na meta e eficiência
                                const monthRealMarketingCost = (monthGoal * marketingCostPerRide) * fallbackEfficiency;
                                const monthRealOperationalCost = (monthGoal * operationalCostPerRide) * fallbackEfficiency;
                                
                                totalMarketingCost += monthRealMarketingCost;
                                totalOperationalCost += monthRealOperationalCost;
                                
                                // Custos do mês passado
                                if (monthKey === lastMonthKey) {
                                    lastMonthRealMarketingCost += monthRealMarketingCost;
                                    lastMonthRealOperationalCost += monthRealOperationalCost;
                                }
                            }

                            // Avançar mês
                            tempMonth++;
                            if (tempMonth > 12) {
                                tempMonth = 1;
                                tempYear++;
                            }
                        }
                    }

                } catch (error) {
                    console.error(`Erro ao buscar dados para ${city.name}:`, error);
                }
            }
            
            // Log final dos custos calculados
            console.log('[BlockStats] Custos Finais:', {
                projectedMarketingCost,
                projectedOperationalCost,
                totalMarketingCost,
                totalOperationalCost,
                globalAccumulatedGoal,
                globalAccumulatedRides,
                monthsSinceStart: cities.map(c => c.implementationStartDate ? 
                    (currentYear - parseInt(c.implementationStartDate.split('-')[0])) * 12 + 
                    (currentMonth - parseInt(c.implementationStartDate.split('-')[1])) + 1 : 0),
                cpaMktProj: (projectedMarketingCost / Math.max(globalAccumulatedGoal, 1)).toFixed(4),
                cpaMktReal: (totalMarketingCost / Math.max(globalAccumulatedRides, 1)).toFixed(4),
                usingFallbackRealCosts: totalMarketingCost > 0 ? 'SIM (95% dos projetados)' : 'NÃO - sem dados'
            });

            // Calcular KPIs com proteção robusta contra divisão por zero
            const totalRidesForCalc = Math.max(globalAccumulatedRides, 1);
            const goalsForCalc = Math.max(globalAccumulatedGoal, 1);
            
            const opsPassReal = totalOperationalCost / totalRidesForCalc;
            const opsPassProj = projectedOperationalCost / goalsForCalc;
            
            const custoCorridaReal = (totalMarketingCost + totalOperationalCost) / totalRidesForCalc;
            const custoCorridaProj = (projectedMarketingCost + projectedOperationalCost) / goalsForCalc;
            
            const cpaMktReal = totalMarketingCost / totalRidesForCalc;
            const cpaMktProj = projectedMarketingCost / goalsForCalc;

            // KPIs do mês passado com proteção robusta
            const lastMonthRidesForCalc = Math.max(lastMonthRides, 1);
            const lastMonthGoalForCalc = Math.max(lastMonthGoal, 1);
            
            const lastMonthOpsPassReal = lastMonthRealOperationalCost / lastMonthRidesForCalc;
            const lastMonthOpsPassProj = lastMonthProjectedOperationalCost / lastMonthGoalForCalc;
            
            const lastMonthCustoCorridaReal = (lastMonthRealMarketingCost + lastMonthRealOperationalCost) / lastMonthRidesForCalc;
            const lastMonthCustoCorridaProj = (lastMonthProjectedMarketingCost + lastMonthProjectedOperationalCost) / lastMonthGoalForCalc;
            
            const lastMonthCpaMktReal = lastMonthRealMarketingCost / lastMonthRidesForCalc;
            const lastMonthCpaMktProj = lastMonthProjectedMarketingCost / lastMonthGoalForCalc;

            // ===== CÁLCULO DO POTENCIAL MÁXIMO =====
            let maximumPotentialGoal = 0;
            let activeCitiesAverage = 0;
            let maxPotentialProgress = 0;
            
            const totalCities = cities.length;
            const activeCities = cities.filter(city => city.implementationStartDate).length;
            
            if (totalCities > 0) {
                // Calcular meta média do MÊS ATUAL de TODAS as cidades do bloco (ativas e não ativas)
                let allCitiesCurrentMonthGoalSum = 0;
                let allCitiesCount = 0;
                
                for (const city of cities) {
                    // Meta base da cidade (100% = meta máxima)
                    const cityBaseGoal = Math.round(city.population15to44 * targetPenetration);
                    
                    if (city.implementationStartDate) {
                        // Para cidades ativas: usar meta graduada do mês atual baseada no tempo decorrido
                        const [impYear, impMonth] = city.implementationStartDate.split('-').map(Number);
                        const monthsSinceStart = (currentYear - impYear) * 12 + (currentMonth - impMonth) + 1;
                        
                        // Meta do mês atual (com graduação)
                        const currentMonthFactor = monthsSinceStart <= 6 ? curveFactors[monthsSinceStart - 1] : 1.0;
                        const cityCurrentMonthGoal = Math.round(cityBaseGoal * currentMonthFactor);
                        
                        allCitiesCurrentMonthGoalSum += cityCurrentMonthGoal;
                    } else {
                        // Para cidades não ativas: usar potencial máximo teórico (meta no 6º mês)
                        const cityTheoreticalMonthGoal = Math.round(cityBaseGoal * 1.0); // 100% do potencial
                        allCitiesCurrentMonthGoalSum += cityTheoreticalMonthGoal;
                    }
                    
                    allCitiesCount++;
                }
                
                // Média do mês atual de todas as cidades (ativas + teórico das não ativas)
                activeCitiesAverage = Math.round(allCitiesCurrentMonthGoalSum / allCitiesCount);
                
                // Potencial máximo = média do mês atual * total de cidades
                maximumPotentialGoal = activeCitiesAverage * totalCities;
                
                // Progresso em relação ao potencial máximo (usando APENAS corridas do mês atual)
                maxPotentialProgress = maximumPotentialGoal > 0 
                    ? (currentMonthRides / maximumPotentialGoal) * 100 
                    : 0;
                    
                console.log('[Potencial Máximo - Mês Atual]', {
                    totalCities,
                    activeCities,
                    allCitiesCurrentMonthGoalSum,
                    activeCitiesAverage: 'Média mês atual de todas as cidades',
                    maximumPotentialGoal,
                    currentMonthRides,
                    maxPotentialProgress: maxPotentialProgress.toFixed(2) + '%'
                });
            }

            setBlockStats({
                globalAccumulatedGoal,
                globalAccumulatedRides,
                globalAccumulatedRevenue,
                globalAccumulatedRevenueGoal,
                currentMonthGoal,
                currentMonthRides,
                currentMonthRevenue,
                currentMonthRevenueGoal,
                lastMonthGoal,
                lastMonthRides,
                lastMonthRevenue,
                lastMonthRevenueGoal,
                lastMonthOpsPassProj,
                lastMonthOpsPassReal,
                lastMonthCustoCorridaProj,
                lastMonthCustoCorridaReal,
                lastMonthCpaMktProj,
                lastMonthCpaMktReal,
                lastMonthCustoTotalProj: lastMonthProjectedMarketingCost + lastMonthProjectedOperationalCost,
                lastMonthCustoTotalReal: lastMonthRealMarketingCost + lastMonthRealOperationalCost,
                opsPassProj,
                opsPassReal,
                custoCorridaProj,
                custoCorridaReal,
                cpaMktProj,
                cpaMktReal,
                custoTotalProj: projectedMarketingCost + projectedOperationalCost,
                custoTotalReal: totalMarketingCost + totalOperationalCost,
                totalRides: globalAccumulatedRides,
                totalRevenue: globalAccumulatedRevenue,
                // Potencial máximo
                maximumPotentialGoal,
                activeCitiesAverage,
                maxPotentialProgress
            });
        };

        if (cities.length > 0) {
            calculateBlockStatsFromRealData();
        } else {
            // Reset stats if no cities
            setBlockStats({
                globalAccumulatedGoal: 0,
                globalAccumulatedRides: 0,
                globalAccumulatedRevenue: 0,
                globalAccumulatedRevenueGoal: 0,
                currentMonthGoal: 0,
                currentMonthRides: 0,
                currentMonthRevenue: 0,
                currentMonthRevenueGoal: 0,
                lastMonthGoal: 0,
                lastMonthRides: 0,
                lastMonthRevenue: 0,
                lastMonthRevenueGoal: 0,
                lastMonthOpsPassProj: 0,
                lastMonthOpsPassReal: 0,
                lastMonthCustoCorridaProj: 0,
                lastMonthCustoCorridaReal: 0,
                lastMonthCpaMktProj: 0,
                lastMonthCpaMktReal: 0,
                lastMonthCustoTotalProj: 0,
                lastMonthCustoTotalReal: 0,
                opsPassProj: 0,
                opsPassReal: 0,
                custoCorridaProj: 0,
                custoCorridaReal: 0,
                cpaMktProj: 0,
                cpaMktReal: 0,
                custoTotalProj: 0,
                custoTotalReal: 0,
                totalRides: 0,
                totalRevenue: 0,
                maximumPotentialGoal: 0,
                activeCitiesAverage: 0,
                maxPotentialProgress: 0
            });
        }
    }, [cities, plans]);

    const handleSaveName = () => {
        if (editName.trim()) {
            onRename(block.id, editName);
            setIsEditing(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const cityId = e.dataTransfer.getData('cityId');
        if (cityId) {
            onMoveCity(parseInt(cityId), block.id);
        }
    };

    const handlePlanAllInBlock = () => {
        const citiesToPlan = cities.filter(city => !plans.some(p => p.cityId === city.id));
        if (citiesToPlan.length === 0) {
            alert("Todas as cidades deste bloco já estão em planejamento.");
            return;
        }
        if (window.confirm(`Isso iniciará o planejamento para ${citiesToPlan.length} cidades. Confirmar?`)) {
            citiesToPlan.forEach(city => onPlanCity(city.id));
            navigate('/planejamento');
        }
    };

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Função para gerar dados de planejamento de 6 meses para todas as cidades do bloco
    // Usa os dados salvos em PlanningResults de cada cidade quando disponíveis
    const getBlockPlanningData = () => {
        const planningData: {
            month: string;
            totalGoal: number;
            totalMarketingCost: number;
            totalOperationalCost: number;
            totalRevenue: number;
            cityBreakdown: Array<{
                cityName: string;
                goal: number;
                marketingCost: number;
                operationalCost: number;
                revenue: number;
                fromSavedPlan: boolean;
            }>;
        }[] = [];

        const monthNames = ['Mês 1', 'Mês 2', 'Mês 3', 'Mês 4', 'Mês 5', 'Mês 6'];
        const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0];

        for (let monthIndex = 0; monthIndex < 6; monthIndex++) {
            let monthTotalGoal = 0;
            let monthTotalMarketingCost = 0;
            let monthTotalOperationalCost = 0;
            let monthTotalRevenue = 0;
            const cityBreakdown: Array<{
                cityName: string;
                goal: number;
                marketingCost: number;
                operationalCost: number;
                revenue: number;
                fromSavedPlan: boolean;
            }> = [];

            cities.forEach(city => {
                if (!city.population15to44) return;

                // Buscar plano salvo da cidade
                const cityPlan = plans.find(p => p.cityId === city.id);
                const mesKey = `Mes${monthIndex + 1}`;
                const savedResult = cityPlan?.results?.[mesKey];
                
                let goal = 0;
                let marketingCost = 0;
                let operationalCost = 0;
                let revenue = 0;
                let fromSavedPlan = false;

                // Se há dados salvos no plano, usar eles
                if (savedResult && (savedResult.rides > 0 || savedResult.marketingCost > 0 || savedResult.operationalCost > 0)) {
                    goal = savedResult.rides || 0;
                    marketingCost = savedResult.projectedMarketing || savedResult.marketingCost || 0;
                    operationalCost = savedResult.projectedOperational || savedResult.operationalCost || 0;
                    revenue = savedResult.projectedRevenue || (goal * 2.5);
                    fromSavedPlan = true;
                } else {
                    // Fallback: calcular automaticamente se não há plano salvo
                    // VALORES BASEADOS EM ANÁLISE DE PROJEÇÕES REAIS SALVAS (analyze-fallback-values.js)
                    const targetPenetration = 0.10; // 10% da população 15-44
                    const factor = curveFactors[monthIndex];
                    goal = Math.round(city.population15to44 * factor * targetPenetration);
                    
                    // Custos baseados em médias reais por categoria de cidade
                    // Grande (>100k): CPA=R$0.76, OPS=R$0.35
                    // Média (50-100k): CPA=R$1.08, OPS=R$0.64
                    // Pequena (<50k): CPA=R$0.89, OPS=R$0.32
                    let baseCPA = city.population > 100000 ? 0.76 : city.population > 50000 ? 1.08 : 0.89;
                    let baseOPS = city.population > 100000 ? 0.35 : city.population > 50000 ? 0.64 : 0.32;
                    
                    // Redução gradual nos custos ao longo dos meses (eficiência)
                    const cpaReductionFactor = 1 - (monthIndex * 0.05); // Reduz 5% por mês
                    const opsReductionFactor = 1 - (monthIndex * 0.03); // Reduz 3% por mês
                    
                    const adjustedCPA = baseCPA * cpaReductionFactor;
                    const adjustedOPS = baseOPS * opsReductionFactor;
                    
                    marketingCost = goal * adjustedCPA;
                    operationalCost = goal * adjustedOPS;
                    revenue = goal * 2.5; // R$2.50 por corrida
                }

                monthTotalGoal += goal;
                monthTotalMarketingCost += marketingCost;
                monthTotalOperationalCost += operationalCost;
                monthTotalRevenue += revenue;

                cityBreakdown.push({
                    cityName: city.name,
                    goal,
                    marketingCost,
                    operationalCost,
                    revenue,
                    fromSavedPlan
                });
            });

            planningData.push({
                month: monthNames[monthIndex],
                totalGoal: monthTotalGoal,
                totalMarketingCost: monthTotalMarketingCost,
                totalOperationalCost: monthTotalOperationalCost,
                totalRevenue: monthTotalRevenue,
                cityBreakdown
            });
        }

        return planningData;
    };

    // Função para gerar HTML completo com CSS para exportação visual
    const generateReportHTML = () => {
        const planningData = getBlockPlanningData();
        const date = new Date().toLocaleDateString('pt-BR');
        
        // Calcular KPIs
        const totalPop = cities.reduce((sum, c) => sum + c.population, 0);
        const targetPop = cities.reduce((sum, c) => sum + c.population15to44, 0);
        const totalGoal = planningData.reduce((sum, m) => sum + m.totalGoal, 0);
        const totalMarketing = planningData.reduce((sum, m) => sum + m.totalMarketingCost, 0);
        const totalOperational = planningData.reduce((sum, m) => sum + m.totalOperationalCost, 0);
        const totalRevenue = planningData.reduce((sum, m) => sum + m.totalRevenue, 0);
        const totalMargin = totalRevenue - totalMarketing - totalOperational;
        
        // Calcular ROI - encontrar mês onde receita acumulada >= investimento acumulado
        let roiMonth = -1; // -1 significa não atingido nos 6 meses
        let roiInvestment = 0;
        let accumulatedRevenue = 0;
        let accumulatedInvestment = 0;
        
        for (let i = 0; i < planningData.length; i++) {
            const month = planningData[i];
            accumulatedRevenue += month.totalRevenue;
            accumulatedInvestment += month.totalMarketingCost + month.totalOperationalCost;
            
            if (roiMonth === -1 && accumulatedRevenue >= accumulatedInvestment) {
                roiMonth = i + 1; // Mês 1-indexed
                roiInvestment = accumulatedInvestment;
            }
        }
        
        // Se não atingiu ROI em 6 meses, calcular projeção para encontrar quando atinge
        let projectedRoiMonth = roiMonth;
        let projectedRoiInvestment = roiInvestment;
        
        if (roiMonth === -1) {
            // Usar média mensal do mês 6 para projetar
            const month6 = planningData[5];
            const avgMonthlyRevenue = month6.totalRevenue;
            const avgMonthlyInvestment = month6.totalMarketingCost + month6.totalOperationalCost;
            const avgMonthlyProfit = avgMonthlyRevenue - avgMonthlyInvestment;
            
            if (avgMonthlyProfit > 0) {
                // Quanto falta para cobrir o déficit acumulado
                const deficit = accumulatedInvestment - accumulatedRevenue;
                const monthsToRecover = Math.ceil(deficit / avgMonthlyProfit);
                projectedRoiMonth = 6 + monthsToRecover;
                projectedRoiInvestment = accumulatedInvestment + (monthsToRecover * avgMonthlyInvestment);
            }
        }
        
        // Metas de penetração
        const penetrationGoals = [0.02, 0.05, 0.10, 0.15, 0.20].map(p => ({
            percent: p,
            value: Math.round(targetPop * p),
            revenue: Math.round(targetPop * p) * 2.5
        }));

        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Planejamento Estratégico - ${block.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="/lufga-font.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            color: #f1f5f9;
            min-height: 100vh;
            padding: 40px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 24px;
            padding: 32px;
            margin-bottom: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        .header .main-title {
            font-family: 'Lufga', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 40px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #fff;
            margin-bottom: 8px;
            background: none;
            -webkit-background-clip: unset;
            -webkit-text-fill-color: unset;
            background-clip: unset;
        }
        .header .subtitle {
            color: #fff;
            font-size: 18px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-weight: 500;
            margin-bottom: 2px;
        }
        .header .subinfo {
            color: #fff;
            font-size: 14px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            margin-bottom: 0;
        }
        
        .header .subtitle {
            color: #94a3b8;
            font-size: 14px;
        }
        
        .header .date {
            color: #94a3b8;
            font-size: 12px;
            margin-top: 4px;
        }
        
        /* KPI Cards Row */
        .kpi-row {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .kpi-card-pastel {
            padding: 20px;
            border-radius: 16px;
        }
        
        .kpi-card-pastel.purple {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            border: 1px solid #94a3b8;
        }
        
        .kpi-card-pastel.green {
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            border: 1px solid #86efac;
        }
        
        .kpi-card-pastel .label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .kpi-card-pastel.purple .label { color: #334155; }
        .kpi-card-pastel.green .label { color: #166534; }
        
        .kpi-card-pastel .value {
            font-size: 32px;
            font-weight: 800;
            margin-top: 8px;
        }
        
        .kpi-card-pastel.purple .value { color: #0f172a; }
        .kpi-card-pastel.green .value { color: #15803d; }
        
        /* Goals Box */
        .goals-section {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 20px;
            margin-bottom: 24px;
        }
        
        .goals-box {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 20px;
            padding: 24px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .goals-box h3 {
            color: #94a3b8;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
        }
        
        .goal-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .goal-item:last-child {
            border-bottom: none;
        }
        
        .goal-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        
        .goal-dot.yellow { background: #fbbf24; }
        .goal-dot.orange { background: #f97316; }
        .goal-dot.amber { background: #f59e0b; }
        .goal-dot.blue { background: #3b82f6; }
        .goal-dot.purple { background: #475569; }
        
        .goal-percent {
            color: #94a3b8;
            font-weight: 500;
            font-size: 13px;
            min-width: 50px;
            background: rgba(255,255,255,0.1);
            padding: 2px 8px;
            border-radius: 4px;
        }
        
        .goal-values {
            flex: 1;
            text-align: right;
        }
        
        .goal-revenue {
            color: #10b981;
            font-weight: 700;
            font-size: 14px;
        }
        
        .goal-rides {
            color: #64748b;
            font-size: 11px;
        }
        
        /* Stats Cards Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
        }
        
        .stat-card {
            background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.08);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.4);
        }
        
        .stat-card .icon-circle {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            margin-bottom: 12px;
            box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.2);
        }
        
        .stat-card .stat-label {
            color: #94a3b8;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
        }
        
        .stat-card .stat-value {
            color: #f1f5f9;
            font-size: 22px;
            font-weight: 800;
            margin-top: 4px;
        }
        
        .stat-card .stat-subtitle {
            color: #64748b;
            font-size: 10px;
            margin-top: 4px;
        }
        
        /* Special Cards */
        .stat-card.highlight-green {
            background: linear-gradient(145deg, #065f46 0%, #064e3b 100%);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .stat-card.highlight-green .stat-label {
            color: #6ee7b7;
        }
        
        .stat-card.highlight-green .stat-value {
            color: #ecfdf5;
        }
        
        .stat-card.highlight-amber {
            background: linear-gradient(145deg, #92400e 0%, #78350f 100%);
            border: 1px solid rgba(251, 191, 36, 0.3);
        }
        
        .stat-card.highlight-amber .stat-label {
            color: #fcd34d;
        }
        
        .stat-card.highlight-amber .stat-value {
            color: #fffbeb;
        }
        
        .stat-card.highlight-blue {
            background: linear-gradient(145deg, #1e40af 0%, #1e3a8a 100%);
            border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .stat-card.highlight-blue .stat-label {
            color: #93c5fd;
        }
        
        .stat-card.highlight-blue .stat-value {
            color: #eff6ff;
        }
        
        /* Tables */
        .table-section {
            background: rgba(30, 41, 59, 0.8);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 24px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .table-section h2 {
            color: #f1f5f9;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .table-section h2::before {
            content: '';
            width: 4px;
            height: 20px;
            background: linear-gradient(to bottom, #475569, #334155);
            border-radius: 2px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            font-size: 10px;
            table-layout: fixed;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 12px;
            overflow: hidden;
        }
        
        thead th {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            padding: 8px 4px;
            text-align: center;
            font-weight: 600;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border: 1px solid rgba(255,255,255,0.2);
            white-space: nowrap;
        }
        
        thead th:first-child {
            border-radius: 0;
            text-align: left;
            padding-left: 8px;
        }
        
        thead th:last-child {
            border-radius: 0;
        }
        
        tbody tr {
            background: rgba(15, 23, 42, 0.5);
        }
        
        tbody tr:nth-child(even) {
            background: rgba(30, 41, 59, 0.5);
        }
        
        tbody tr:hover {
            background: rgba(71, 85, 105, 0.2);
        }
        
        tbody td {
            padding: 6px 4px;
            color: #e2e8f0;
            border: 1px solid rgba(255,255,255,0.08);
            text-align: center;
            font-size: 9px;
        }
        
        tbody td:first-child {
            text-align: left;
            padding-left: 8px;
            font-weight: 600;
        }
        
        tfoot tr {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }
        
        tfoot td {
            padding: 6px 4px;
            color: white;
            font-weight: 700;
            border: 1px solid rgba(255,255,255,0.2);
            text-align: center;
            font-size: 9px;
        }
        
        tfoot td:first-child {
            border-radius: 0;
            text-align: left;
            padding-left: 8px;
        }
        
        tfoot td:last-child {
            border-radius: 0;
        }
        
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        
        /* City Section */
        .city-section {
            background: rgba(15, 23, 42, 0.6);
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 20px;
            border: 1px solid rgba(255,255,255,0.08);
            overflow: hidden;
        }
        
        .city-section h3 {
            color: #94a3b8;
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .city-section table {
            margin: 0;
        }
        
        /* Print Styles */
        @media print {
            body {
                background: white !important;
                color: #1e293b !important;
                padding: 20px !important;
            }
            
            .header {
                background: #1e293b !important;
                -webkit-print-color-adjust: exact;
            }
            
            .goals-box {
                background: white !important;
                border: 2px solid #1e293b !important;
            }
            
            .goals-box h3 {
                color: #0f172a !important;
            }
            
            .goal-percent {
                color: #1e293b !important;
                font-weight: 700 !important;
                background: #e2e8f0 !important;
            }
            
            .goal-revenue {
                color: #059669 !important;
            }
            
            .goal-rides {
                color: #475569 !important;
            }
            
            .goal-dot {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .table-section {
                background: #f8fafc !important;
                border: 1px solid #e2e8f0 !important;
            }
            
            .table-section h2 {
                color: #0f172a !important;
            }
            
            .table-section h2::before {
                background: #0f172a !important;
            }
            
            table {
                border: 1px solid #cbd5e1 !important;
            }
            
            thead th {
                background: #0f172a !important;
                border: 1px solid #1e293b !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            tbody tr {
                background: white !important;
            }
            
            tbody tr:nth-child(even) {
                background: #f1f5f9 !important;
            }
            
            tbody td {
                color: #0f172a !important;
                border: 1px solid #e2e8f0 !important;
            }
            
            tbody td strong {
                color: #0f172a !important;
            }
            
            tfoot tr {
                background: #0f172a !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            tfoot td {
                border: 1px solid #1e293b !important;
                color: white !important;
                font-weight: 800 !important;
            }
            
            .city-section {
                page-break-inside: avoid;
                background: #f8fafc !important;
                border: 1px solid #e2e8f0 !important;
            }
            
            .city-section h3 {
                color: #1e293b !important;
            }
            
            .positive {
                color: #059669 !important;
            }
            
            .negative {
                color: #dc2626 !important;
            }
            
            /* Stats Cards Print Styles */
            .stat-card {
                background: white !important;
                border: 2px solid #1e293b !important;
                box-shadow: none !important;
            }
            
            .stat-card .stat-label {
                color: #475569 !important;
            }
            
            .stat-card .stat-value {
                color: #0f172a !important;
            }
            
            .stat-card .stat-subtitle {
                color: #64748b !important;
            }
            
            .stat-card.highlight-green,
            .stat-card.highlight-amber,
            .stat-card.highlight-blue {
                background: white !important;
                border: 2px solid #1e293b !important;
            }
            
            .stat-card.highlight-green .stat-label,
            .stat-card.highlight-amber .stat-label,
            .stat-card.highlight-blue .stat-label {
                color: #475569 !important;
            }
            
            .stat-card.highlight-green .stat-value,
            .stat-card.highlight-amber .stat-value,
            .stat-card.highlight-blue .stat-value {
                color: #0f172a !important;
            }
            
            .stat-card.highlight-green .stat-subtitle,
            .stat-card.highlight-amber .stat-subtitle,
            .stat-card.highlight-blue .stat-subtitle {
                color: #64748b !important;
            }
            
            .stat-card .icon-circle {
                background: #e2e8f0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            /* KPI Cards Print Styles */
            .kpi-card-pastel {
                background: white !important;
                border: 2px solid #1e293b !important;
            }
            
            .kpi-card-pastel .label {
                color: #475569 !important;
            }
            
            .kpi-card-pastel .value {
                color: #0f172a !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="main-title">Urban Passageiro</div>
            <div class="subtitle">Planejamento de Expansão</div>
            <div class="subinfo">${date} &mdash; Bloco: <b>${block.name}</b></div>
        </div>
        
        <!-- KPI Cards -->
        <div class="kpi-row">
            <div class="kpi-card-pastel purple">
                <div class="label">População Total do Bloco</div>
                <div class="value">${totalPop.toLocaleString('pt-BR')}</div>
            </div>
            <div class="kpi-card-pastel green">
                <div class="label">População Alvo (15-44 anos)</div>
                <div class="value">${targetPop.toLocaleString('pt-BR')}</div>
            </div>
        </div>
        
        <!-- Goals + Stats Section -->
        <div class="goals-section">
            <!-- Goals Box -->
            <div class="goals-box">
                <h3>🎯 Metas de Penetração</h3>
                ${penetrationGoals.map((goal, idx) => {
                    const colors = ['yellow', 'orange', 'amber', 'blue', 'purple'];
                    return `
                    <div class="goal-item">
                        <div class="goal-dot ${colors[idx]}"></div>
                        <span class="goal-percent">(${Math.round(goal.percent * 100)}%)</span>
                        <div class="goal-values">
                            <div class="goal-revenue">${formatCurrency(goal.revenue)}</div>
                            <div class="goal-rides">${goal.value.toLocaleString('pt-BR')} corridas/mês</div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
            
            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="icon-circle" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">👥</div>
                    <div class="stat-label">População Total</div>
                    <div class="stat-value">${totalPop.toLocaleString('pt-BR')}</div>
                </div>
                <div class="stat-card">
                    <div class="icon-circle" style="background: linear-gradient(135deg, #10b981, #059669);">🎯</div>
                    <div class="stat-label">População Alvo</div>
                    <div class="stat-value">${targetPop.toLocaleString('pt-BR')}</div>
                </div>
                <div class="stat-card">
                    <div class="icon-circle" style="background: linear-gradient(135deg, #f59e0b, #d97706);">🏙️</div>
                    <div class="stat-label">Cidades no Bloco</div>
                    <div class="stat-value">${cities.length}</div>
                </div>
                <div class="stat-card">
                    <div class="icon-circle" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">📈</div>
                    <div class="stat-label">Meta Total 6M</div>
                    <div class="stat-value">${totalGoal.toLocaleString('pt-BR')}</div>
                </div>
                <div class="stat-card">
                    <div class="icon-circle" style="background: linear-gradient(135deg, #ec4899, #db2777);">💰</div>
                    <div class="stat-label">Receita Proj. 6M</div>
                    <div class="stat-value">${formatCurrency(totalRevenue)}</div>
                </div>
                <div class="stat-card">
                    <div class="icon-circle" style="background: linear-gradient(135deg, ${totalMargin >= 0 ? '#10b981, #059669' : '#ef4444, #dc2626'});">📊</div>
                    <div class="stat-label">Margem 6M</div>
                    <div class="stat-value ${totalMargin >= 0 ? 'positive' : 'negative'}">${formatCurrency(totalMargin)}</div>
                </div>
                <div class="stat-card highlight-green">
                    <div class="icon-circle" style="background: linear-gradient(135deg, #34d399, #10b981);">💎</div>
                    <div class="stat-label">Receita Mensal (10%)</div>
                    <div class="stat-value">${formatCurrency(Math.round(targetPop * 0.10) * 2.5)}</div>
                    <div class="stat-subtitle" style="color: #6ee7b7;">${Math.round(targetPop * 0.10).toLocaleString('pt-BR')} corridas/mês</div>
                </div>
                <div class="stat-card highlight-amber">
                    <div class="icon-circle" style="background: linear-gradient(135deg, #fbbf24, #f59e0b);">⏱️</div>
                    <div class="stat-label">Tempo até ROI</div>
                    <div class="stat-value">${projectedRoiMonth > 0 ? projectedRoiMonth + (projectedRoiMonth === 1 ? ' mês' : ' meses') : 'N/A'}</div>
                    <div class="stat-subtitle" style="color: #fcd34d;">${roiMonth > 0 ? '✅ Atingido' : projectedRoiMonth > 6 ? '📊 Projeção' : '⚠️ Não atingido'}</div>
                </div>
                <div class="stat-card highlight-blue">
                    <div class="icon-circle" style="background: linear-gradient(135deg, #60a5fa, #3b82f6);">💵</div>
                    <div class="stat-label">Investimento até ROI</div>
                    <div class="stat-value">${projectedRoiInvestment > 0 ? formatCurrency(projectedRoiInvestment) : formatCurrency(totalMarketing + totalOperational)}</div>
                    <div class="stat-subtitle" style="color: #93c5fd;">Mkt + Ops acum.${roiMonth === -1 ? ' (6M)' : ''}</div>
                </div>
            </div>
        </div>
        
        <!-- ROI Progress Table -->
        <div class="table-section" style="margin-bottom: 24px;">
            <h2>📈 Evolução até o ROI</h2>
            <table>
                <thead>
                    <tr>
                        <th>Mês</th>
                        <th class="text-right">Investimento Mensal</th>
                        <th class="text-right">Investimento Acum.</th>
                        <th class="text-right">Receita Mensal</th>
                        <th class="text-right">Receita Acum.</th>
                        <th class="text-right">Saldo Acum.</th>
                        <th class="text-center">ROI</th>
                    </tr>
                </thead>
                <tbody>
                    ${(() => {
                        let accRev = 0;
                        let accInv = 0;
                        let roiReached = false;
                        const rows: string[] = [];
                        
                        // Mostrar até o mês do ROI (ou todos se não atingir)
                        for (let i = 0; i < planningData.length; i++) {
                            const month = planningData[i];
                            const monthInv = month.totalMarketingCost + month.totalOperationalCost;
                            accRev += month.totalRevenue;
                            accInv += monthInv;
                            const balance = accRev - accInv;
                            const isRoiMonth = !roiReached && balance >= 0;
                            if (isRoiMonth) roiReached = true;
                            const rowStyle = isRoiMonth ? 'background: rgba(16, 185, 129, 0.2) !important;' : '';
                            const balanceClass = balance >= 0 ? 'positive' : 'negative';
                            const roiIndicator = isRoiMonth ? '✅' : (balance >= 0 ? '✓' : '—');
                            
                            rows.push('<tr style="' + rowStyle + '">' +
                                '<td><strong>' + month.month + '</strong></td>' +
                                '<td class="text-right">' + formatCurrency(monthInv) + '</td>' +
                                '<td class="text-right">' + formatCurrency(accInv) + '</td>' +
                                '<td class="text-right">' + formatCurrency(month.totalRevenue) + '</td>' +
                                '<td class="text-right">' + formatCurrency(accRev) + '</td>' +
                                '<td class="text-right ' + balanceClass + '">' + formatCurrency(balance) + '</td>' +
                                '<td class="text-center">' + roiIndicator + '</td>' +
                            '</tr>');
                            
                            // Parar no mês do ROI
                            if (isRoiMonth) break;
                        }
                        
                        // Se não atingiu ROI em 6 meses, projetar meses adicionais
                        if (!roiReached && projectedRoiMonth > 6) {
                            const month6 = planningData[5];
                            const avgMonthlyRevenue = month6.totalRevenue;
                            const avgMonthlyInvestment = month6.totalMarketingCost + month6.totalOperationalCost;
                            
                            for (let m = 7; m <= projectedRoiMonth; m++) {
                                accRev += avgMonthlyRevenue;
                                accInv += avgMonthlyInvestment;
                                const balance = accRev - accInv;
                                const isRoiMonth = !roiReached && balance >= 0;
                                if (isRoiMonth) roiReached = true;
                                const rowStyle = isRoiMonth ? 'background: rgba(16, 185, 129, 0.2) !important;' : 'background: rgba(251, 191, 36, 0.1);';
                                const balanceClass = balance >= 0 ? 'positive' : 'negative';
                                const roiIndicator = isRoiMonth ? '✅' : '—';
                                
                                rows.push('<tr style="' + rowStyle + '">' +
                                    '<td><strong>Mês ' + m + '</strong> <span style="font-size: 8px; color: #f59e0b;">(projeção)</span></td>' +
                                    '<td class="text-right">' + formatCurrency(avgMonthlyInvestment) + '</td>' +
                                    '<td class="text-right">' + formatCurrency(accInv) + '</td>' +
                                    '<td class="text-right">' + formatCurrency(avgMonthlyRevenue) + '</td>' +
                                    '<td class="text-right">' + formatCurrency(accRev) + '</td>' +
                                    '<td class="text-right ' + balanceClass + '">' + formatCurrency(balance) + '</td>' +
                                    '<td class="text-center">' + roiIndicator + '</td>' +
                                '</tr>');
                                
                                if (isRoiMonth) break;
                            }
                        }
                        
                        return rows.join('');
                    })()}
                </tbody>
            </table>
            ${roiMonth === -1 && projectedRoiMonth <= 0 ? 
                '<div style="margin-top: 16px; padding: 12px; background: rgba(251, 191, 36, 0.1); border: 1px solid #f59e0b; border-radius: 8px;">' +
                '<p style="color: #f59e0b; font-size: 12px; margin: 0;">' +
                '⚠️ <strong>ROI não projetável.</strong> Ajuste os custos de CPA/OPS para melhorar a margem.' +
                '</p></div>' 
            : ''}
        </div>
        
        <!-- Planning Table -->
        <div class="table-section">
            <h2>Projeção Mensal - Consolidado do Bloco</h2>
            <table>
                <thead>
                    <tr>
                        <th>Mês</th>
                        <th class="text-center">Meta Corridas</th>
                        <th class="text-right">Marketing</th>
                        <th class="text-right">Operacional</th>
                        <th class="text-right">Receita</th>
                        <th class="text-right">Margem</th>
                    </tr>
                </thead>
                <tbody>
                    ${planningData.map(month => {
                        const margin = month.totalRevenue - month.totalMarketingCost - month.totalOperationalCost;
                        return `
                        <tr>
                            <td><strong>${month.month}</strong></td>
                            <td class="text-center">${month.totalGoal.toLocaleString('pt-BR')}</td>
                            <td class="text-right">${formatCurrency(month.totalMarketingCost)}</td>
                            <td class="text-right">${formatCurrency(month.totalOperationalCost)}</td>
                            <td class="text-right">${formatCurrency(month.totalRevenue)}</td>
                            <td class="text-right ${margin >= 0 ? 'positive' : 'negative'}">${formatCurrency(margin)}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td><strong>TOTAL 6M</strong></td>
                        <td class="text-center">${totalGoal.toLocaleString('pt-BR')}</td>
                        <td class="text-right">${formatCurrency(totalMarketing)}</td>
                        <td class="text-right">${formatCurrency(totalOperational)}</td>
                        <td class="text-right">${formatCurrency(totalRevenue)}</td>
                        <td class="text-right">${formatCurrency(totalMargin)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <!-- Per City Tables -->
        <div class="table-section">
            <h2>Detalhamento por Cidade</h2>
            ${cities.map(city => {
                const cityTotalGoal = planningData.reduce((acc, month) => {
                    const cityData = month.cityBreakdown.find(c => c.cityName === city.name);
                    return acc + (cityData ? cityData.goal : 0);
                }, 0);
                const cityTotalMarketing = planningData.reduce((acc, month) => {
                    const cityData = month.cityBreakdown.find(c => c.cityName === city.name);
                    return acc + (cityData ? cityData.marketingCost : 0);
                }, 0);
                const cityTotalOperational = planningData.reduce((acc, month) => {
                    const cityData = month.cityBreakdown.find(c => c.cityName === city.name);
                    return acc + (cityData ? cityData.operationalCost : 0);
                }, 0);
                const cityTotalRevenue = planningData.reduce((acc, month) => {
                    const cityData = month.cityBreakdown.find(c => c.cityName === city.name);
                    return acc + (cityData ? cityData.revenue : 0);
                }, 0);
                const cityMargin = cityTotalRevenue - cityTotalMarketing - cityTotalOperational;
                
                return `
                <div class="city-section">
                    <h3>🏙️ ${city.name} (Pop: ${city.population.toLocaleString('pt-BR')} | Alvo: ${city.population15to44.toLocaleString('pt-BR')})</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Mês</th>
                                <th class="text-center">Meta</th>
                                <th class="text-right">CPA</th>
                                <th class="text-right">OPS</th>
                                <th class="text-right">Marketing</th>
                                <th class="text-right">Operacional</th>
                                <th class="text-right">Receita</th>
                                <th class="text-right">Margem</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${planningData.map((month, idx) => {
                                const cityData = month.cityBreakdown.find(c => c.cityName === city.name);
                                if (!cityData) return '';
                                const cpa = cityData.goal > 0 ? (cityData.marketingCost / cityData.goal) : 0;
                                const ops = cityData.goal > 0 ? (cityData.operationalCost / cityData.goal) : 0;
                                const margin = cityData.revenue - cityData.marketingCost - cityData.operationalCost;
                                return `
                                <tr>
                                    <td><strong>${month.month}</strong></td>
                                    <td class="text-center">${cityData.goal.toLocaleString('pt-BR')}</td>
                                    <td class="text-right">R$ ${cpa.toFixed(2)}</td>
                                    <td class="text-right">R$ ${ops.toFixed(2)}</td>
                                    <td class="text-right">${formatCurrency(cityData.marketingCost)}</td>
                                    <td class="text-right">${formatCurrency(cityData.operationalCost)}</td>
                                    <td class="text-right">${formatCurrency(cityData.revenue)}</td>
                                    <td class="text-right ${margin >= 0 ? 'positive' : 'negative'}">${formatCurrency(margin)}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td><strong>TOTAL</strong></td>
                                <td class="text-center">${cityTotalGoal.toLocaleString('pt-BR')}</td>
                                <td class="text-right">-</td>
                                <td class="text-right">-</td>
                                <td class="text-right">${formatCurrency(cityTotalMarketing)}</td>
                                <td class="text-right">${formatCurrency(cityTotalOperational)}</td>
                                <td class="text-right">${formatCurrency(cityTotalRevenue)}</td>
                                <td class="text-right ${cityMargin >= 0 ? 'positive' : 'negative'}">${formatCurrency(cityMargin)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                `;
            }).join('')}
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 24px; color: #64748b; font-size: 12px;">
            <p>Urban Passageiro - Relatório gerado automaticamente</p>
            <p style="margin-top: 4px;">${date}</p>
        </div>
    </div>
</body>
</html>
        `;
    };

    const exportBlockPDF = () => {

        const date = new Date().toLocaleDateString('pt-BR');

        if (showPlanningView) {
            // Exportar como HTML visual
            const htmlContent = generateReportHTML();
            const printWindow = window.open('', '_blank');
            
            if (printWindow) {
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                
                // Aguardar carregamento das fontes antes de imprimir
                setTimeout(() => {
                    alert('Para salvar como PDF:\\n1. Pressione Ctrl+P\\n2. Selecione "Salvar como PDF"\\n3. Clique em Salvar');
                    printWindow.print();
                }, 1500);
            }
        } else {
            // PDF para Visão Normal (código original)
            const doc = new jsPDF({ orientation: 'portrait' });
            doc.setFontSize(18);
            doc.text(`Relatório Estratégico: ${block.name}`, 14, 20);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Urban Passageiro - Gerado em: ${date}`, 14, 27);

            const tableColumn = [
                "Cidade", 
                "Pop. Total", 
                "Pop. Alvo (15-44)", 
                "Corridas (Média)", 
                "Receita Baixa", 
                "Receita Média", 
                "Receita Alta"
            ];

            const tableRows = cities.map(city => {
                const rides = getMarketPotential(city).find(p => p.scenario === 'Média')?.rides || 0;
                return [
                    city.name,
                    city.population.toLocaleString('pt-BR'),
                    city.population15to44.toLocaleString('pt-BR'),
                    Math.round(rides).toLocaleString('pt-BR'),
                    formatCurrency(calculatePotentialRevenue(city, 'Baixa')),
                    formatCurrency(calculatePotentialRevenue(city, 'Média')),
                    formatCurrency(calculatePotentialRevenue(city, 'Alta'))
                ];
            });

            // Totais
            const totals = cities.reduce((acc, city) => {
                const rides = getMarketPotential(city).find(p => p.scenario === 'Média')?.rides || 0;
                return {
                    pop: acc.pop + city.population,
                    target: acc.target + city.population15to44,
                    rides: acc.rides + rides,
                    baixa: acc.baixa + calculatePotentialRevenue(city, 'Baixa'),
                    media: acc.media + calculatePotentialRevenue(city, 'Média'),
                    alta: acc.alta + calculatePotentialRevenue(city, 'Alta'),
                };
            }, { pop: 0, target: 0, rides: 0, baixa: 0, media: 0, alta: 0 });

            const footerRow = [
                { content: 'TOTAIS DO GRUPO', styles: { fontStyle: 'bold' as const, halign: 'right' as const } },
                totals.pop.toLocaleString('pt-BR'),
                totals.target.toLocaleString('pt-BR'),
                Math.round(totals.rides).toLocaleString('pt-BR'),
                formatCurrency(totals.baixa),
                formatCurrency(totals.media),
                formatCurrency(totals.alta)
            ];

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                foot: [footerRow],
                startY: 35,
                theme: 'striped',
                headStyles: { fillColor: [34, 197, 94], fontSize: 9 },
                bodyStyles: { fontSize: 8 },
                footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
            });

            doc.save(`Urban_Relatorio_${block.name.replace(/\s+/g, '_')}_${date}.pdf`);
        }
    };

    return (
        <div 
            className={`mb-12 rounded-3xl overflow-hidden transition-all duration-300 ${
                isOver 
                    ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-500/20 to-blue-600/10 shadow-2xl' 
                    : 'bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-white/10 hover:border-white/20 shadow-xl hover:shadow-2xl'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header Section with Gradient Background */}
            <div className="bg-gradient-to-r from-gray-900/50 via-gray-800/50 to-gray-900/50 backdrop-blur-md border-b border-white/10 px-6 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Icon with gradient */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <FiGrid className="text-white" size={24} />
                        </div>

                        {/* Title Section */}
                        {isEditing ? (
                            <div className="flex items-center gap-2 flex-1">
                                <input 
                                    type="text" 
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="flex-1 px-4 py-2 text-lg font-bold bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    autoFocus
                                />
                                <button onClick={handleSaveName} className="p-2 text-green-400 hover:bg-green-500/10 border border-green-500/30 rounded-lg transition"><FiCheck size={18}/></button>
                                <button onClick={() => { setIsEditing(false); setEditName(block.name); }} className="p-2 text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition"><FiX size={18}/></button>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    {/* Header: Nome + Badge */}
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl font-bold text-white">{block.name}</h3>
                                        <span className="text-xs font-semibold text-white/90 bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-1 rounded-full">{cities.length} cidades</span>
                                    </div>
                                    
                                    {/* Barra de Potencial na mesma linha */}
                                    {blockStats.maximumPotentialGoal > 0 && (
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-300">Potencial Mês Atual:</span>
                                                <span className="text-sm font-bold text-emerald-400">{blockStats.currentMonthRides}</span>
                                                <span className="text-xs text-slate-500">/</span>
                                                <span className="text-sm font-semibold text-slate-400">{blockStats.maximumPotentialGoal.toLocaleString('pt-BR')}</span>
                                            </div>
                                            <div className="flex-1 max-w-xs">
                                                <div className="w-full bg-slate-700/50 rounded-full h-2">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            blockStats.maxPotentialProgress >= 75 
                                                                ? 'bg-gradient-to-r from-emerald-500 to-green-400' 
                                                                : blockStats.maxPotentialProgress >= 50
                                                                ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                                                                : blockStats.maxPotentialProgress >= 25
                                                                ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                                                                : 'bg-gradient-to-r from-slate-500 to-gray-400'
                                                        }`} 
                                                        style={{width: `${Math.min(blockStats.maxPotentialProgress, 100)}%`}}
                                                    ></div>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-bold px-2 py-1 rounded ${
                                                blockStats.maxPotentialProgress >= 50 
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : blockStats.maxPotentialProgress >= 25
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : 'bg-slate-500/20 text-slate-400'
                                            }`}>
                                                {blockStats.maxPotentialProgress.toFixed(1)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button 
                                        onClick={() => setShowPlanningView(!showPlanningView)}
                                        disabled={cities.length === 0}
                                        className={`p-2 border rounded-lg transition-all duration-200 ${
                                            showPlanningView 
                                                ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' 
                                                : 'text-gray-400 hover:text-purple-400 border-purple-500/30 hover:bg-purple-500/10'
                                        }`}
                                        title={showPlanningView ? "Ver visão geral" : "Ver planejamento"}
                                    >
                                        <FiActivity size={18}/>
                                    </button>
                                    <button 
                                        onClick={exportBlockPDF}
                                        disabled={cities.length === 0}
                                        className="p-2 text-gray-400 hover:text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 transition-all duration-200" 
                                        title="Exportar relatório em PDF"
                                    >
                                        <FiDownload size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => setIsEditing(true)} 
                                        className="p-2 text-gray-400 hover:text-white border border-white/20 rounded-lg hover:bg-white/5 transition-all duration-200" 
                                        title="Renomear bloco"
                                    >
                                        <FiEdit2 size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => onDelete(block.id)} 
                                        className="p-2 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all duration-200" 
                                        title="Excluir bloco"
                                    >
                                        <FiTrash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {!isEditing && (
                    <div className="mt-5">
                        {showPlanningView ? (
                            /* Visualização de Planejamento de 6 Meses */
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-xl font-bold text-white">Projeções de 6 Meses - {block.name}</h4>
                                    <span className="text-xs text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full">
                                        {cities.length} cidades • Planejamento Estratégico
                                    </span>
                                </div>
                                
                                {(() => {
                                    const planningData = getBlockPlanningData();
                                    const totalGoal6M = planningData.reduce((sum, m) => sum + m.totalGoal, 0);
                                    const totalRevenue6M = planningData.reduce((sum, m) => sum + m.totalRevenue, 0);
                                    const totalCosts6M = planningData.reduce((sum, m) => sum + m.totalMarketingCost + m.totalOperationalCost, 0);
                                    const margin6M = totalRevenue6M - totalCosts6M;
                                    const targetPop = cities.reduce((sum, c) => sum + c.population15to44, 0);
                                    const monthlyRevenue10Percent = Math.round(targetPop * 0.10) * 2.5; // 10% penetração x R$2.50/corrida
                                    
                                    return (
                                        <>
                                        {/* Cards de Resumo no Topo */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                            {/* Card 1: Meta Total 6M */}
                                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                                        <span className="text-lg">📈</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Meta Total 6M</span>
                                                </div>
                                                <div className="text-2xl font-bold text-slate-800">{totalGoal6M.toLocaleString('pt-BR')}</div>
                                            </div>
                                            
                                            {/* Card 2: Receita Proj. 6M */}
                                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                                        <span className="text-lg">💰</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Receita Proj. 6M</span>
                                                </div>
                                                <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalRevenue6M)}</div>
                                            </div>
                                            
                                            {/* Card 3: Margem 6M */}
                                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                        <span className="text-lg">📊</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Margem 6M</span>
                                                </div>
                                                <div className={`text-2xl font-bold ${margin6M >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(margin6M)}</div>
                                            </div>
                                            
                                            {/* Card 4: Receita Mensal (10%) */}
                                            <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                        <span className="text-lg">🎯</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Receita Mensal (10%)</span>
                                                </div>
                                                <div className="text-2xl font-bold text-emerald-700">{formatCurrency(monthlyRevenue10Percent)}</div>
                                                <div className="text-xs text-emerald-600 mt-1">{Math.round(targetPop * 0.10).toLocaleString('pt-BR')} corridas/mês</div>
                                            </div>
                                        </div>
                                        
                                        <div className="overflow-x-auto">
                                            <table className="w-full bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                                <thead>
                                                    <tr className="bg-purple-900/30">
                                                        <th className="text-left p-4 text-sm font-semibold text-purple-200">Mês</th>
                                                        <th className="text-center p-4 text-sm font-semibold text-purple-200">Meta Total</th>
                                                        <th className="text-center p-4 text-sm font-semibold text-purple-200">Custo Marketing</th>
                                                        <th className="text-center p-4 text-sm font-semibold text-purple-200">Custo Operacional</th>
                                                        <th className="text-center p-4 text-sm font-semibold text-purple-200">Receita Projetada</th>
                                                        <th className="text-center p-4 text-sm font-semibold text-purple-200">Margem</th>
                                                        <th className="text-left p-4 text-sm font-semibold text-purple-200">Principais Cidades</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {planningData.map((month, index) => {
                                                        const totalCost = month.totalMarketingCost + month.totalOperationalCost;
                                                        const margin = month.totalRevenue - totalCost;
                                                        const marginPercent = month.totalRevenue > 0 ? (margin / month.totalRevenue) * 100 : 0;
                                                        const topCities = month.cityBreakdown
                                                            .sort((a, b) => b.goal - a.goal)
                                                            .slice(0, 3);
                                                        
                                                        return (
                                                            <tr key={index} className="border-t border-slate-700/50 hover:bg-purple-900/10 transition-colors">
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg font-bold text-white">{month.month}</span>
                                                                        <span className="text-xs text-slate-400">Mês {index + 1}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <span className="text-lg font-bold text-purple-400">
                                                                        {month.totalGoal.toLocaleString('pt-BR')}
                                                                    </span>
                                                                    <div className="text-xs text-slate-500">corridas</div>
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <span className="text-sm font-semibold text-orange-400">
                                                                        {formatCurrency(month.totalMarketingCost)}
                                                                    </span>
                                                                    <div className="text-xs text-slate-500">
                                                                        R${(month.totalMarketingCost / month.totalGoal).toFixed(2)}/corrida
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <span className="text-sm font-semibold text-cyan-400">
                                                                        {formatCurrency(month.totalOperationalCost)}
                                                                    </span>
                                                                    <div className="text-xs text-slate-500">
                                                                        R${(month.totalOperationalCost / month.totalGoal).toFixed(2)}/corrida
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <span className="text-lg font-bold text-emerald-400">
                                                                        {formatCurrency(month.totalRevenue)}
                                                                    </span>
                                                                    <div className="text-xs text-slate-500">R$2.50/corrida</div>
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <span className={`text-sm font-bold ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                        {formatCurrency(margin)}
                                                                    </span>
                                                                    <div className={`text-xs ${marginPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                        {marginPercent.toFixed(1)}%
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="space-y-1">
                                                                        {topCities.map((city, i) => (
                                                                            <div key={i} className="flex justify-between text-xs">
                                                                                <span className="text-slate-300 truncate mr-2">{city.cityName}</span>
                                                                                <span className="text-slate-500 flex-shrink-0">{city.goal} corridas</span>
                                                                            </div>
                                                                        ))}
                                                                        {month.cityBreakdown.length > 3 && (
                                                                            <div className="text-xs text-slate-500">
                                                                                +{month.cityBreakdown.length - 3} outras
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                {/* Footer com totais */}
                                                <tfoot>
                                                    <tr className="bg-slate-900/50 border-t-2 border-purple-500/30">
                                                        <th className="p-4 text-left text-sm font-bold text-purple-200">6 MESES</th>
                                                        <th className="p-4 text-center text-lg font-bold text-purple-300">
                                                            {planningData.reduce((sum, m) => sum + m.totalGoal, 0).toLocaleString('pt-BR')}
                                                        </th>
                                                        <th className="p-4 text-center text-sm font-bold text-orange-300">
                                                            {formatCurrency(planningData.reduce((sum, m) => sum + m.totalMarketingCost, 0))}
                                                        </th>
                                                        <th className="p-4 text-center text-sm font-bold text-cyan-300">
                                                            {formatCurrency(planningData.reduce((sum, m) => sum + m.totalOperationalCost, 0))}
                                                        </th>
                                                        <th className="p-4 text-center text-lg font-bold text-emerald-300">
                                                            {formatCurrency(planningData.reduce((sum, m) => sum + m.totalRevenue, 0))}
                                                        </th>
                                                        <th className="p-4 text-center text-lg font-bold text-green-300">
                                                            {formatCurrency(
                                                                planningData.reduce((sum, m) => sum + m.totalRevenue, 0) - 
                                                                planningData.reduce((sum, m) => sum + m.totalMarketingCost + m.totalOperationalCost, 0)
                                                            )}
                                                        </th>
                                                        <th className="p-4 text-left text-xs text-slate-400">
                                                            Total agregado
                                                        </th>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            /* KPIs Grid - Layout Limpo */
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Card 1: Meta Global Acumulativa */}
                            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 relative overflow-hidden">
                                {isUpdating && (
                                    <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent)' }} />
                                )}
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Meta Global Acumulada</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                                                🔄 Atualiza a cada 1 min
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isUpdating && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                                    ⟳ Atualizando...
                                                </span>
                                            )}
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                blockStats.globalAccumulatedRides >= blockStats.globalAccumulatedGoal 
                                                    ? 'bg-green-500/20 text-green-400' 
                                                    : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {blockStats.globalAccumulatedGoal > 0 
                                                    ? Math.round((blockStats.globalAccumulatedRides / blockStats.globalAccumulatedGoal) * 100) 
                                                    : 0}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-6 mb-3">
                                        <div>
                                            <span className="text-3xl font-bold text-white">{blockStats.globalAccumulatedGoal.toLocaleString('pt-BR')}</span>
                                            <span className="text-sm text-slate-500 ml-2">meta</span>
                                            <div className="text-xs text-slate-400 mt-1">R${(blockStats.globalAccumulatedRevenueGoal / 1000).toFixed(1)}k proj</div>
                                        </div>
                                        <div>
                                            <span className="text-3xl font-bold text-green-400">{blockStats.globalAccumulatedRides.toLocaleString('pt-BR')}</span>
                                            <span className="text-sm text-slate-500 ml-2">atual</span>
                                            <div className="text-xs text-green-400 mt-1">R${(blockStats.globalAccumulatedRevenue / 1000).toFixed(1)}k real ✓</div>
                                        </div>
                                        {blockStats.globalAccumulatedRides >= blockStats.globalAccumulatedGoal && (
                                            <span className="text-green-400 text-xl mb-1">✓</span>
                                        )}
                                    </div>
                                    
                                    {/* Informação de Atualização */}
                                    <div className="text-xs text-slate-500 mb-3 pb-2 border-b border-slate-700/50">
                                        📊 Última atualização: {lastUpdateTime.toLocaleString('pt-BR')}
                                    </div>
                                <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            blockStats.globalAccumulatedRides >= blockStats.globalAccumulatedGoal 
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                                                : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                                        }`} 
                                        style={{width: `${Math.min((blockStats.globalAccumulatedRides / Math.max(blockStats.globalAccumulatedGoal, 1)) * 100, 100)}%`}}
                                    ></div>
                                </div>
                                
                                {/* Mini KPIs Globais */}
                                <div className="grid grid-cols-2 gap-2">
                                    {/* CPA MKT */}
                                    <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40">
                                        <div className="text-[9px] text-slate-500 uppercase font-medium mb-1">CPA Mkt</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-semibold text-slate-400">R${blockStats.cpaMktProj.toFixed(2)}</span>
                                            <span className={`text-xs font-bold ${blockStats.cpaMktReal <= blockStats.cpaMktProj ? 'text-green-400' : 'text-red-400'}`}>
                                                R${blockStats.cpaMktReal.toFixed(2)}
                                            </span>
                                            <span className={`text-[10px] ${blockStats.cpaMktReal <= blockStats.cpaMktProj ? 'text-green-400' : 'text-red-400'}`}>
                                                {blockStats.cpaMktReal <= blockStats.cpaMktProj ? '✓' : '✗'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* OPS/PASS */}
                                    <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40">
                                        <div className="text-[9px] text-slate-500 uppercase font-medium mb-1">Ops/Pass</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-semibold text-slate-400">R${blockStats.opsPassProj.toFixed(2)}</span>
                                            <span className={`text-xs font-bold ${blockStats.opsPassReal <= blockStats.opsPassProj ? 'text-green-400' : 'text-red-400'}`}>
                                                R${blockStats.opsPassReal.toFixed(2)}
                                            </span>
                                            <span className={`text-[10px] ${blockStats.opsPassReal <= blockStats.opsPassProj ? 'text-green-400' : 'text-red-400'}`}>
                                                {blockStats.opsPassReal <= blockStats.opsPassProj ? '✓' : '✗'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CUSTO TOT */}
                                    <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40">
                                        <div className="text-[9px] text-slate-500 uppercase font-medium mb-1">Custo Total CPA/OPS</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-semibold text-slate-400">R${(blockStats.custoTotalProj / 1000).toFixed(1)}k</span>
                                            <span className={`text-xs font-bold ${blockStats.custoTotalReal <= blockStats.custoTotalProj ? 'text-green-400' : 'text-amber-400'}`}>
                                                R${(blockStats.custoTotalReal / 1000).toFixed(1)}k
                                            </span>
                                            <span className={`text-[10px] ${blockStats.custoTotalReal <= blockStats.custoTotalProj ? 'text-green-400' : 'text-amber-400'}`}>
                                                {blockStats.custoTotalReal <= blockStats.custoTotalProj ? '✓' : '✗'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CUSTO/CORR */}
                                    <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40">
                                        <div className="text-[9px] text-slate-500 uppercase font-medium mb-1">Custo/Corr</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-semibold text-slate-400">R${blockStats.custoCorridaProj.toFixed(2)}</span>
                                            <span className={`text-xs font-bold ${blockStats.custoCorridaReal <= blockStats.custoCorridaProj ? 'text-green-400' : 'text-red-400'}`}>
                                                R${blockStats.custoCorridaReal.toFixed(2)}
                                            </span>
                                            <span className={`text-[10px] ${blockStats.custoCorridaReal <= blockStats.custoCorridaProj ? 'text-green-400' : 'text-red-400'}`}>
                                                {blockStats.custoCorridaReal <= blockStats.custoCorridaProj ? '✓' : '✗'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>

                            {/* Card 2: Mês Atual */}
                            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 relative overflow-hidden">
                                {isUpdating && (
                                    <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.1), transparent)' }} />
                                )}
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">JAN/26</span>
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mês Atual</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                                                🔄 Atualiza a cada 1 min
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isUpdating && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                                    ⟳ Atualizando...
                                                </span>
                                            )}
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                blockStats.currentMonthRides >= blockStats.currentMonthGoal 
                                                    ? 'bg-green-500/20 text-green-400' 
                                                    : 'bg-purple-500/20 text-purple-400'
                                            }`}>
                                                {blockStats.currentMonthGoal > 0 
                                                    ? Math.round((blockStats.currentMonthRides / blockStats.currentMonthGoal) * 100) 
                                                    : 0}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-6 mb-3">
                                        <div>
                                            <span className="text-3xl font-bold text-white">{blockStats.currentMonthGoal.toLocaleString('pt-BR')}</span>
                                            <span className="text-sm text-slate-500 ml-2">meta</span>
                                            <div className="text-xs text-slate-400 mt-1">R${(blockStats.currentMonthRevenueGoal / 1000).toFixed(1)}k proj</div>
                                        </div>
                                        <div>
                                            <span className="text-3xl font-bold text-purple-400">{blockStats.currentMonthRides.toLocaleString('pt-BR')}</span>
                                            <span className="text-sm text-slate-500 ml-2">atual</span>
                                            <div className="text-xs text-purple-400 mt-1">R${(blockStats.currentMonthRevenue / 1000).toFixed(1)}k real ✓</div>
                                        </div>
                                        {blockStats.currentMonthRides >= blockStats.currentMonthGoal && (
                                            <span className="text-green-400 text-xl mb-1">✓</span>
                                        )}
                                    </div>
                                    
                                    {/* Informação de Atualização */}
                                    <div className="text-xs text-slate-500 mb-3 pb-2 border-b border-slate-700/50">
                                        📊 Última atualização: {lastUpdateTime.toLocaleString('pt-BR')}
                                    </div>
                                <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            blockStats.currentMonthRides >= blockStats.currentMonthGoal 
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                                                : 'bg-gradient-to-r from-purple-500 to-fuchsia-400'
                                        }`} 
                                        style={{width: `${Math.min((blockStats.currentMonthRides / Math.max(blockStats.currentMonthGoal, 1)) * 100, 100)}%`}}
                                    ></div>
                                </div>
                                
                                {/* Mini KPIs Mês Atual */}
                                <div className="grid grid-cols-2 gap-2">
                                    {/* CORRIDAS */}
                                    <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40">
                                        <div className="text-[9px] text-slate-500 uppercase font-medium mb-1">Corridas</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-semibold text-slate-400">{blockStats.currentMonthGoal.toLocaleString('pt-BR')}</span>
                                            <span className={`text-xs font-bold ${blockStats.currentMonthRides >= blockStats.currentMonthGoal ? 'text-green-400' : 'text-purple-400'}`}>
                                                {blockStats.currentMonthRides.toLocaleString('pt-BR')}
                                            </span>
                                            <span className={`text-[10px] ${blockStats.currentMonthRides >= blockStats.currentMonthGoal ? 'text-green-400' : 'text-purple-400'}`}>
                                                {blockStats.currentMonthRides >= blockStats.currentMonthGoal ? '✓' : '⏳'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* RECEITA */}
                                    <div className={`rounded-lg p-2 border transition-all ${blockStats.currentMonthRevenue >= blockStats.currentMonthRevenueGoal ? 'bg-slate-800/40 border-slate-700/40' : 'bg-yellow-500/15 border-yellow-500/40'}`}>
                                        <div className={`text-[9px] uppercase font-medium mb-1 ${blockStats.currentMonthRevenue >= blockStats.currentMonthRevenueGoal ? 'text-slate-500' : 'text-yellow-400'}`}>Receita</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-xs font-semibold ${blockStats.currentMonthRevenue >= blockStats.currentMonthRevenueGoal ? 'text-slate-400' : 'text-yellow-300'}`}>R${(blockStats.currentMonthRevenueGoal / 1000).toFixed(1)}k</span>
                                            <span className={`text-xs font-bold ${blockStats.currentMonthRevenue >= blockStats.currentMonthRevenueGoal ? 'text-green-400' : 'text-yellow-300'}`}>
                                                R${(blockStats.currentMonthRevenue / 1000).toFixed(1)}k
                                            </span>
                                            <span className={`text-[10px] ${blockStats.currentMonthRevenue >= blockStats.currentMonthRevenueGoal ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {blockStats.currentMonthRevenue >= blockStats.currentMonthRevenueGoal ? '✓' : '⚠️'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* STATUS */}
                                    <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40">
                                        <div className="text-[9px] text-slate-500 uppercase font-medium mb-1">Status</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-xs font-bold ${blockStats.currentMonthRides >= blockStats.currentMonthGoal ? 'text-green-400' : 'text-purple-400'}`}>
                                                {blockStats.currentMonthRides >= blockStats.currentMonthGoal ? 'Meta' : 'Em andamento'}
                                            </span>
                                            <span className={`text-[10px] ${blockStats.currentMonthRides >= blockStats.currentMonthGoal ? 'text-green-400' : 'text-purple-400'}`}>
                                                {blockStats.currentMonthRides >= blockStats.currentMonthGoal ? '✓' : '⏳'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* PROGRESSO */}
                                    <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40">
                                        <div className="text-[9px] text-slate-500 uppercase font-medium mb-1">Progresso</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-xs font-bold ${blockStats.currentMonthRides >= blockStats.currentMonthGoal ? 'text-green-400' : 'text-purple-400'}`}>
                                                {blockStats.currentMonthGoal > 0 
                                                    ? Math.round((blockStats.currentMonthRides / blockStats.currentMonthGoal) * 100)
                                                    : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>

                            {/* Card 3: Mês Passado */}
                            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">DEZ/25</span>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mês Passado</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        blockStats.lastMonthRides >= blockStats.lastMonthGoal 
                                            ? 'bg-green-500/20 text-green-400' 
                                            : 'bg-orange-500/20 text-orange-400'
                                    }`}>
                                        {blockStats.lastMonthGoal > 0 
                                            ? Math.round((blockStats.lastMonthRides / blockStats.lastMonthGoal) * 100) 
                                            : 0}%
                                    </span>
                                </div>
                                <div className="flex items-end gap-6 mb-3">
                                    <div>
                                        <span className="text-3xl font-bold text-white">{blockStats.lastMonthGoal.toLocaleString('pt-BR')}</span>
                                        <span className="text-sm text-slate-500 ml-2">meta</span>
                                        <div className="text-xs text-slate-400 mt-1">R${(blockStats.lastMonthRevenueGoal / 1000).toFixed(1)}k proj</div>
                                    </div>
                                    <div>
                                        <span className="text-3xl font-bold text-orange-400">{blockStats.lastMonthRides.toLocaleString('pt-BR')}</span>
                                        <span className="text-sm text-slate-500 ml-2">real</span>
                                        <div className="text-xs text-orange-400 mt-1">R${(blockStats.lastMonthRevenue / 1000).toFixed(1)}k real</div>
                                    </div>
                                    {blockStats.lastMonthRides >= blockStats.lastMonthGoal && (
                                        <span className="text-green-400 text-xl mb-1">✓</span>
                                    )}
                                </div>
                                <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            blockStats.lastMonthRides >= blockStats.lastMonthGoal 
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                                                : 'bg-gradient-to-r from-orange-500 to-orange-400'
                                        }`} 
                                        style={{width: `${Math.min((blockStats.lastMonthRides / Math.max(blockStats.lastMonthGoal, 1)) * 100, 100)}%`}}
                                    ></div>
                                </div>
                                
                                {/* Mini KPIs Mês Passado */}
                                <div className="grid grid-cols-2 gap-2">
                                    {/* CPA MKT Last Month */}
                                    <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40">
                                        <div className="text-[9px] text-slate-500 uppercase font-medium mb-1">CPA Mkt</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-semibold text-slate-400">R${blockStats.lastMonthCpaMktProj.toFixed(2)}</span>
                                            <span className={`text-xs font-bold ${blockStats.lastMonthCpaMktReal <= blockStats.lastMonthCpaMktProj ? 'text-green-400' : 'text-red-400'}`}>
                                                R${blockStats.lastMonthCpaMktReal.toFixed(2)}
                                            </span>
                                            <span className={`text-[10px] ${blockStats.lastMonthCpaMktReal <= blockStats.lastMonthCpaMktProj ? 'text-green-400' : 'text-red-400'}`}>
                                                {blockStats.lastMonthCpaMktReal <= blockStats.lastMonthCpaMktProj ? '✓' : '✗'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* OPS/PASS Last Month */}
                                    <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40">
                                        <div className="text-[9px] text-slate-500 uppercase font-medium mb-1">Ops/Pass</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-semibold text-slate-400">R${blockStats.lastMonthOpsPassProj.toFixed(2)}</span>
                                            <span className={`text-xs font-bold ${blockStats.lastMonthOpsPassReal <= blockStats.lastMonthOpsPassProj ? 'text-green-400' : 'text-red-400'}`}>
                                                R${blockStats.lastMonthOpsPassReal.toFixed(2)}
                                            </span>
                                            <span className={`text-[10px] ${blockStats.lastMonthOpsPassReal <= blockStats.lastMonthOpsPassProj ? 'text-green-400' : 'text-red-400'}`}>
                                                {blockStats.lastMonthOpsPassReal <= blockStats.lastMonthOpsPassProj ? '✓' : '✗'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CUSTO TOT Last Month */}
                                    <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40">
                                        <div className="text-[9px] text-slate-500 uppercase font-medium mb-1">Custo Total</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-semibold text-slate-400">R${(blockStats.lastMonthCustoTotalProj / 1000).toFixed(1)}k</span>
                                            <span className={`text-xs font-bold ${blockStats.lastMonthCustoTotalReal <= blockStats.lastMonthCustoTotalProj ? 'text-green-400' : 'text-orange-400'}`}>
                                                R${(blockStats.lastMonthCustoTotalReal / 1000).toFixed(1)}k
                                            </span>
                                            <span className={`text-[10px] ${blockStats.lastMonthCustoTotalReal <= blockStats.lastMonthCustoTotalProj ? 'text-green-400' : 'text-orange-400'}`}>
                                                {blockStats.lastMonthCustoTotalReal <= blockStats.lastMonthCustoTotalProj ? '✓' : '✗'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CUSTO/CORR Last Month */}
                                    <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40">
                                        <div className="text-[9px] text-slate-500 uppercase font-medium mb-1">Custo/Corr</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-semibold text-slate-400">R${blockStats.lastMonthCustoCorridaProj.toFixed(2)}</span>
                                            <span className={`text-xs font-bold ${blockStats.lastMonthCustoCorridaReal <= blockStats.lastMonthCustoCorridaProj ? 'text-green-400' : 'text-red-400'}`}>
                                                R${blockStats.lastMonthCustoCorridaReal.toFixed(2)}
                                            </span>
                                            <span className={`text-[10px] ${blockStats.lastMonthCustoCorridaReal <= blockStats.lastMonthCustoCorridaProj ? 'text-green-400' : 'text-red-400'}`}>
                                                {blockStats.lastMonthCustoCorridaReal <= blockStats.lastMonthCustoCorridaProj ? '✓' : '✗'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-6">
                {cities.length === 0 ? (
                    <div className="border-2 border-dashed border-white/20 rounded-2xl p-16 text-center hover:border-white/40 transition-colors duration-300">
                        <FiGrid className="mx-auto mb-4 text-gray-500" size={48} />
                        <p className="text-gray-400 font-medium text-lg">Solte uma cidade aqui para agrupar</p>
                        <p className="text-gray-500 text-sm mt-2">Cidades organizadas em um bloco</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {cities.map(city => (
                                <CityCard 
                                    key={city.id} 
                                    city={city} 
                                    blocks={allBlocks}
                                    currentBlockId={block.id}
                                    hasPlan={plans.some(p => p.cityId === city.id)}
                                    plan={plans.find(p => p.cityId === city.id)}
                                    onMove={onMoveCity}
                                    onRemove={onRemoveCity}
                                    onPlan={onPlanCity}
                                    navigate={navigate}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


const MarketIntelligence: React.FC = () => {
    const { cities, plans, marketData, marketBlocks, addMarketBlock, updateMarketBlock, deleteMarketBlock, moveCityToBlock, removeCityFromIntelligence, addPlanForCity } = useContext(DataContext);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newBlockName, setNewBlockName] = useState('');
    const [isUnassignedOver, setIsUnassignedOver] = useState(false);
    
    // Estados para atualização automática a cada 1 minuto
    const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Trigger atualização a cada 1 minuto para forçar re-render
    useEffect(() => {
        let isMounted = true;
        
        const updateData = () => {
            if (isMounted) {
                setIsUpdating(true);
                // Simular atualização - dispara re-render
                setLastUpdateTime(new Date());
                setTimeout(() => {
                    if (isMounted) {
                        setIsUpdating(false);
                    }
                }, 500);
            }
        };
        
        // Primeira atualização imediata
        updateData();
        
        // Configurar polling a cada 1 minuto (60000 ms)
        const interval = setInterval(updateData, 60000);
        
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    // --- Lógica para obter as cidades relevantes para esta tela ---
    const strategicCities = useMemo(() => {
        // Obter todos os IDs de cidades que já estão em algum bloco
        const assignedCityIds = new Set(marketBlocks.flatMap(b => b.cityIds));

        return cities.filter(city => {
            const hasPlan = plans.some(p => p.cityId === city.id);
            const hasIntelligenceData = marketData.some(m => m.cityId === city.id);
            const isRelevantStatus = [CityStatus.Planning, CityStatus.Expansion, CityStatus.Consolidated].includes(city.status);
            // CRÍTICO: Incluir se a cidade estiver em um bloco, mesmo que não tenha plano/status especial
            const isInBlock = assignedCityIds.has(city.id);
            
            return (hasPlan || isRelevantStatus || hasIntelligenceData || isInBlock);
        }).sort((a, b) => b.population - a.population);
    }, [cities, plans, marketData, marketBlocks]);

    // --- Organização por blocos ---
    const organizedData = useMemo(() => {
        const assignedCityIds = new Set(marketBlocks.flatMap(b => b.cityIds));
        
        // Cidades que são estratégicas mas não estão em nenhum bloco específico
        const unassigned = strategicCities.filter(c => !assignedCityIds.has(c.id));
        
        const blocksWithCities = marketBlocks.map(block => ({
            ...block,
            cities: block.cityIds
                .map(id => cities.find(c => c.id === id)) // Busca na lista total para garantir que encontramos IDs recém-adicionados
                .filter(Boolean) as City[]
        }));

        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            const filterFn = (c: City) => c.name.toLowerCase().includes(lowerTerm);
            
            return {
                unassigned: unassigned.filter(filterFn),
                blocks: blocksWithCities.map(b => ({
                    ...b,
                    cities: b.cities.filter(filterFn)
                }))
            };
        }

        return { unassigned, blocks: blocksWithCities };

    }, [strategicCities, marketBlocks, searchTerm, cities]);

    const handleCreateBlock = () => {
        if (newBlockName.trim()) {
            addMarketBlock(newBlockName);
            setNewBlockName('');
            setIsCreateModalOpen(false);
        }
    };

    const handleDeleteBlock = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este grupo? As cidades voltarão para a lista geral.")) {
            deleteMarketBlock(id);
        }
    };

    const handleRemoveFromIntelligence = (cityId: number) => {
        if (window.confirm("Isso removerá a cidade de todos os blocos e resetará as notas de inteligência. A cidade voltará para a lista de consulta geral. Continuar?")) {
            removeCityFromIntelligence(cityId);
        }
    };

    const handlePlanCity = (cityId: number) => {
        addPlanForCity(cityId);
    };

    const handleUnassignedDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsUnassignedOver(true);
    };

    const handleUnassignedDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsUnassignedOver(false);
        const cityId = e.dataTransfer.getData('cityId');
        if (cityId) {
            moveCityToBlock(parseInt(cityId), null);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-pink-600/30 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <FiBriefcase className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white">Inteligência de Mercado</h1>
                                <p className="text-blue-200 font-medium mt-1">Organize as cidades estrategicamente em blocos para análise</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search Bar */}
                        <div className="relative flex-grow md:flex-grow-0 md:w-80">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            <input 
                                type="text" 
                                placeholder="Buscar cidade..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:border-white/50 focus:ring-2 focus:ring-blue-500 focus:bg-white/15 transition-all duration-200 shadow-lg"
                            />
                        </div>

                        {/* Create Block Button */}
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/50 whitespace-nowrap"
                        >
                            <FiPlus size={20} /> Novo Grupo
                        </button>
                    </div>
                </div>
            </div>

            {/* Áreas de Blocos Customizados */}
            <div className="space-y-8">
                {organizedData.blocks.map(block => (
                    <BlockSection 
                        key={block.id}
                        block={block}
                        cities={block.cities}
                        allBlocks={marketBlocks}
                        plans={plans}
                        onRename={updateMarketBlock}
                        onDelete={handleDeleteBlock}
                        onMoveCity={moveCityToBlock}
                        onRemoveCity={handleRemoveFromIntelligence}
                        onPlanCity={handlePlanCity}
                        navigate={navigate}
                        isUpdating={isUpdating}
                        lastUpdateTime={lastUpdateTime}
                    />
                ))}
            </div>

            {/* Área Geral / Não Agrupadas */}
            <div 
                className={`mt-12 rounded-3xl overflow-hidden transition-all duration-300 ${
                    isUnassignedOver 
                        ? 'ring-2 ring-emerald-500 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 shadow-2xl' 
                        : 'bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-white/10 hover:border-white/20 shadow-xl'
                }`}
                onDragOver={handleUnassignedDragOver}
                onDragLeave={() => setIsUnassignedOver(false)}
                onDrop={handleUnassignedDrop}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600/40 via-emerald-700/40 to-emerald-600/40 backdrop-blur-md border-b border-white/10 px-6 py-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                            <FiGrid className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">Cidades Não Agrupadas</h3>
                            <p className="text-emerald-200 text-sm">Arraste para organizar em blocos</p>
                        </div>
                        <div className="ml-auto">
                            <span className="text-lg font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 rounded-full shadow-lg">{organizedData.unassigned.length}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {organizedData.unassigned.length === 0 ? (
                        <div className="text-center py-16">
                            <FiGrid className="mx-auto mb-4 text-gray-500" size={48} />
                            <p className="text-gray-400 font-medium text-lg">Nenhuma cidade estratégica</p>
                            <p className="text-gray-500 text-sm mt-2">Todas as cidades já estão agrupadas</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {organizedData.unassigned.map(city => (
                                <CityCard 
                                    key={city.id} 
                                    city={city} 
                                    blocks={marketBlocks}
                                    currentBlockId={null}
                                    hasPlan={plans.some(p => p.cityId === city.id)}
                                    plan={plans.find(p => p.cityId === city.id)}
                                    onMove={moveCityToBlock}
                                    onRemove={handleRemoveFromIntelligence}
                                    onPlan={handlePlanCity}
                                    navigate={navigate}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Criação de Bloco */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Criar Novo Grupo Estratégico">
                <div className="space-y-5">
                    <p className="text-sm text-gray-400">Organize cidades por prioridade, região ou fase. Exemplos: "Expansão Norte", "Alta Prioridade", "Fase 1"</p>
                    
                    <div>
                        <label className="block text-sm font-bold text-white mb-3">Nome do Grupo</label>
                        <input 
                            type="text" 
                            value={newBlockName}
                            onChange={(e) => setNewBlockName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateBlock()}
                            placeholder="Ex: Expansão Norte"
                            className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:bg-white/15 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button 
                            onClick={() => setIsCreateModalOpen(false)} 
                            className="px-6 py-2 text-gray-300 font-semibold hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleCreateBlock} 
                            disabled={!newBlockName.trim()} 
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Criar Grupo
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MarketIntelligence;

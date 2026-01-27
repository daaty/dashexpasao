
import React, { useContext, useMemo, useState } from 'react';
import { DataContext } from '../context/DataContext';
import Card from '../components/ui/Card';
import { FiBriefcase, FiMapPin, FiSearch, FiArrowRight, FiActivity, FiPlus, FiGrid, FiMoreHorizontal, FiTrash2, FiEdit2, FiX, FiCheck, FiMove, FiMinusCircle, FiDownload, FiClipboard, FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { CityStatus, MarketBlock, City, CityPlan } from '../types';
import Modal from '../components/ui/Modal';
import { calculatePotentialRevenue, getMarketPotential, getGradualMonthlyGoal, getGradualMonthlyGoalForBlock } from '../services/calculationService';
import { getRideStatsByCity, getMonthlyRidesByCity } from '../services/ridesApiService';
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
                    if (!city.implementationStartDate) {
                        // Sem data de implementação: não inclui
                        continue;
                    }
                    
                    let cityCurrentMonthKey: string | null = null;
                    // Calcular qual é o "mês atual" dela
                    const [impYear, impMonth] = city.implementationStartDate.split('-').map(Number);
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
                    
                    // Somar meta de cada cidade (apenas com data de implementação)
                    goalForMonth = cities.reduce((total, city) => {
                        if (!city.implementationStartDate) {
                            // Sem data de implementação: não inclui
                            return total;
                        }
                        
                        const [impYear, impMonth] = city.implementationStartDate.split('-').map(Number);
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
    // Apenas cidades com data de implementação são incluídas
    let monthlyGoal = 0;
    for (const city of cities) {
        if (!city.implementationStartDate) {
            // Sem data: não inclui na meta (aguarda data de início)
            continue;
        }
        
        const [impYear, impMonth] = city.implementationStartDate.split('-').map(Number);
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
    const citiesWithImplementation = cities.filter(c => c.implementationStartDate);
    if (citiesWithImplementation.length > 0) {
        // Usar a primeira implementação como referência
        const [impYear, impMonth] = citiesWithImplementation[0].implementationStartDate!.split('-').map(Number);
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

                                    {/* Análise de Custos Mensais - Tabela Compacta */}
                                    <div className="mt-1 pt-1 border-t border-white/10">
                                        <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Custos: Marketing / Operacional / CPA / Total</p>
                                        <div className="space-y-0.5">
                                            {monthlyCard.months.map((monthData, idx) => {
                                                const marketingProj = Math.round(monthData.goal * 0.15);
                                                const operacionalProj = Math.round(monthData.goal * 0.20);
                                                const marketingReal = Math.round(monthData.rides * 0.15);
                                                const operacionalReal = Math.round(monthData.rides * 0.18);
                                                const cpaProj = monthData.goal > 0 ? Math.round(marketingProj / monthData.goal * 100) / 100 : 0;
                                                const cpaReal = monthData.rides > 0 ? Math.round(marketingReal / monthData.rides * 100) / 100 : 0;
                                                const custoTotalProj = marketingProj + operacionalProj;
                                                const custoTotalReal = marketingReal + operacionalReal;
                                                
                                                // Diferenças
                                                const diffMarketing = marketingProj - marketingReal;
                                                const diffOperacional = operacionalProj - operacionalReal;
                                                const diffCpa = parseFloat((cpaProj - cpaReal).toFixed(2));
                                                const diffTotal = custoTotalProj - custoTotalReal;
                                                
                                                const formatDiff = (value) => {
                                                    if (value > 0) return `+${value}`;
                                                    return String(value);
                                                };
                                                
                                                return (
                                                    <div key={idx} className="space-y-0.5">
                                                        <div className="flex items-center justify-between text-[8px] px-1 py-0.5 rounded" style={{ background: idx % 2 === 0 ? 'rgba(55, 65, 81, 0.15)' : 'transparent' }}>
                                                            <span className="text-gray-400 min-w-[35px]">{monthData.month}</span>
                                                            <span className="text-blue-400">R${marketingProj}/{marketingReal}</span>
                                                            <span className="text-cyan-400">R${operacionalProj}/{operacionalReal}</span>
                                                            <span className="text-purple-400">R${cpaProj.toFixed(2)}/{cpaReal.toFixed(2)}</span>
                                                            <span className="text-orange-300 font-semibold">R${custoTotalProj}/{custoTotalReal}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[7px] px-1 pb-0.5" style={{ color: 'rgba(156, 163, 175, 0.8)' }}>
                                                            <span className="min-w-[35px]"></span>
                                                            <span className={diffMarketing >= 0 ? 'text-emerald-400' : 'text-red-400'}>({formatDiff(diffMarketing)})</span>
                                                            <span className={diffOperacional >= 0 ? 'text-emerald-400' : 'text-red-400'}>({formatDiff(diffOperacional)})</span>
                                                            <span className={diffCpa >= 0 ? 'text-emerald-400' : 'text-red-400'}>({formatDiff(diffCpa.toFixed(1))})</span>
                                                            <span className={diffTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}>({formatDiff(diffTotal)})</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                {otherCards.map((kpi, idx) => (
                    <div 
                        key={idx}
                        className="relative group overflow-hidden rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 p-2.5"
                        style={{
                            background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
                        }}
                    >
                        {/* Gradient Background */}
                        <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                            style={{ background: `linear-gradient(135deg, ${kpi.color} 0%, transparent 100%)` }}
                        />
                        
                        {/* Content */}
                        <div className="relative z-10 space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{kpi.label}</p>
                                <span className="text-base">{kpi.icon}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-white/[0.03] rounded px-2 py-0.5">
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-500">Meta</p>
                                    <p className="text-sm font-bold text-white">{kpi.value}</p>
                                </div>
                                <div className="text-right flex-1">
                                    <p className="text-[10px] text-gray-500">{kpi.goal}</p>
                                    <p className="text-sm font-bold text-white">{kpi.currentValue}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Accent Line */}
                        <div 
                            className="absolute bottom-0 left-0 right-0 h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                            style={{ background: `linear-gradient(90deg, ${kpi.color} 0%, transparent 100%)` }}
                        />
                    </div>
                ))}
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
                    // FILTRAR: Se tem implementationStartDate, mostrar apenas meses a partir disso
                    const formattedMonths = otherMonths
                        .filter(([key]) => {
                            // Se não tem data, mostrar todos
                            if (!city.implementationStartDate) return true;
                            
                            const [impYear, impMonth] = city.implementationStartDate.split('-').map(Number);
                            const [year, month] = key.split('-').map(Number);
                            const monthDate = year * 100 + month;
                            const implDate = impYear * 100 + impMonth;
                            
                            // Mostrar apenas meses a partir da implementação
                            return monthDate >= implDate;
                        })
                        .map(([key, rides]) => {
                        const [year, month] = key.split('-');

                        const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                        
                        // Calcular meta gradual para esse mês específico
                        let goalForMonth = 0;
                        
                        // Se cidade tem data de implementação, calcular com curva gradual
                        if (city.implementationStartDate) {
                            const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0]; // 6 meses
                            const targetPenetration = 0.10; // Média = 10%
                            
                            const [impYear, impMonth] = city.implementationStartDate.split('-').map(Number);
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
                        } else {
                            // Sem data de implementação: meta fixa (Média)
                            goalForMonth = Math.round(city.population15to44 * 0.10);
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
    
    if (city.implementationStartDate) {
        const [impYear, impMonth] = city.implementationStartDate.split('-').map(Number);
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
    } else {
        // Sem data de implementação: meta fixa (Média)
        cityMonthlyGoal = Math.round(city.population15to44 * 0.10);
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

                                {/* Últimos 6 Meses */}
                                {cityMonthlyRides.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-white/10 space-y-1">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Últimos 6 Meses</p>
                                        {cityMonthlyRides.map((monthData, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-[10px] bg-white/5 rounded px-2 py-1 border border-white/5">
                                                <div className="flex-1">
                                                    <p className="text-gray-300 font-medium mb-0.5">{monthData.month}</p>
                                                    <div className="flex items-center gap-1.5 text-[9px]">
                                                        <span className="text-blue-400">Meta: {monthData.goal?.toLocaleString('pt-BR') || 0}</span>
                                                        <span className="text-gray-500">|</span>
                                                        <span className="text-white font-semibold">Real: {monthData.rides.toLocaleString('pt-BR')}</span>
                                                    </div>
                                                </div>
                                                <span className={`ml-1 font-bold ${monthData.metaStatus ? 'text-green-400' : 'text-red-400'}`}>
                                                    {monthData.metaStatus ? '✅' : '❌'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
}> = ({ block, cities, allBlocks, plans, onRename, onDelete, onMoveCity, onRemoveCity, onPlanCity, navigate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(block.name);
    const [isOver, setIsOver] = useState(false);

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

    const exportBlockPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const date = new Date().toLocaleDateString('pt-BR');

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
            { content: 'TOTAIS DO GRUPO', styles: { fontStyle: 'bold', halign: 'right' } },
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
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-2xl font-bold text-white">{block.name}</h3>
                                    <span className="text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 rounded-full shadow-lg">{cities.length} cidades</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Arraste cidades para organizar</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {!isEditing && (
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <button 
                                onClick={handlePlanAllInBlock}
                                disabled={cities.length === 0}
                                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-purple-500 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Planejar todas as cidades do bloco"
                            >
                                <FiClipboard size={16}/> Planejar
                            </button>
                            <button 
                                onClick={exportBlockPDF}
                                disabled={cities.length === 0}
                                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-emerald-500 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Exportar relatório em PDF"
                            >
                                <FiDownload size={16}/> Exportar
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
                    )}
                </div>
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
                        <BlockKPIs cities={cities} />
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

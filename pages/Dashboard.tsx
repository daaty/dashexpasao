
import React, { useContext, useMemo, useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import { FiUsers, FiDollarSign, FiTrendingUp, FiAlertTriangle, FiArrowDown, FiArrowUp, FiMapPin, FiTarget, FiBarChart2 } from 'react-icons/fi';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { CityStatus, Mesorregion } from '../types';
import { useNavigate } from 'react-router-dom';
import InfoTooltip from '../components/ui/InfoTooltip';
import { DataContext } from '../context/DataContext';
import { getMonthlyRidesByCity, getTodayRides } from '../services/ridesApiService';

// Sparkline mini chart component
const SparklineChart = ({ data, color = '#ffffff' }: { data: number[], color?: string }) => {
    const sparklineData = {
        labels: data.map((_, i) => i.toString()),
        datasets: [{
            data,
            borderColor: color,
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 0,
        }]
    };
    
    const sparklineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        scales: {
            x: { display: false },
            y: { display: false }
        },
        elements: {
            line: { borderCapStyle: 'round' as const }
        }
    };
    
    return (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-80">
            <Line data={sparklineData} options={sparklineOptions} />
        </div>
    );
};

const KpiCard = ({ icon, title, value, subValue, trend, trendValue, tooltipText, sparklineData }: { 
    icon: React.ReactElement, 
    title: string, 
    value: string, 
    subValue: string, 
    trend?: 'up' | 'down', 
    trendValue?: string, 
    tooltipText: string,
    sparklineData?: number[]
}) => (
    <div 
        className="group relative rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
        style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)'
        }}
    >
        {/* Background glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
                background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 70%)'
            }}
        />
        
        <div className="flex items-start justify-between relative z-10 mb-4">
            <div className="flex-1 pr-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {title}
                </p>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black" style={{ color: '#ffffff' }}>{value}</p>
                    {trend && trendValue && (
                        <div 
                            className="flex items-center gap-1 px-2 py-1 rounded-full"
                            style={{ 
                                background: trend === 'up' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: trend === 'up' ? '#10b981' : '#ef4444'
                            }}
                        >
                            {trend === 'up' ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
                            <span className="text-xs font-bold">{trendValue}</span>
                        </div>
                    )}
                </div>
                <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{subValue}</p>
            </div>
            <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg"
                style={{ 
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.2))',
                    border: '1px solid rgba(59, 130, 246, 0.5)'
                }}
            >
                <span className="w-6 h-6 text-blue-300">
                    {icon}
                </span>
            </div>
        </div>
        
        {/* Meta subtitle if not trend */}
        {!trend && (
            <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 h-1 bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                        style={{ width: `${Math.min((parseFloat(value) / 100) * 100, 100)}%` }}
                    />
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {Math.min((parseFloat(value) / 100) * 100, 100).toFixed(0)}%
                </span>
            </div>
        )}

        <div className="absolute top-3 right-3 z-20">
            <InfoTooltip text={tooltipText} />
        </div>
        
        {sparklineData && <SparklineChart data={sparklineData} />}
    </div>
);

// MetricCard component for Ops/Pass, Custo/Corr, etc.
const MetricCard = ({ label, value, meta, status }: { label: string, value: string, meta?: string, status?: boolean }) => {
    const isSuccess = status === undefined ? true : status;
    
    // Extrair número do valor para calcular porcentagem
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    const numMeta = meta ? parseFloat(meta.replace(/[^0-9.-]/g, '')) : 100;
    const percentage = Math.min((numValue / numMeta) * 100, 200);
    
    const getGradient = () => {
        if (!isSuccess) return 'from-red-600 to-red-500';
        if (percentage >= 100) return 'from-emerald-600 to-emerald-500';
        if (percentage >= 80) return 'from-blue-600 to-blue-500';
        return 'from-amber-600 to-amber-500';
    };
    
    return (
        <div 
            className="group rounded-xl p-4 border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
            style={{
                background: isSuccess 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                border: isSuccess 
                    ? '1px solid rgba(16, 185, 129, 0.3)' 
                    : '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: isSuccess
                    ? '0 4px 20px rgba(16, 185, 129, 0.15)'
                    : '0 4px 20px rgba(239, 68, 68, 0.15)'
            }}
        >
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-300">{label}</p>
                    <span className="text-lg">{isSuccess ? '✓' : '⚠'}</span>
                </div>
                
                <div className="mb-3">
                    {meta && (
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400">Meta: {meta}</span>
                            <span className={`text-xs font-bold ${percentage >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {percentage.toFixed(0)}%
                            </span>
                        </div>
                    )}
                    <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                        <div 
                            className={`h-full bg-gradient-to-r ${getGradient()} rounded-full transition-all duration-500 shadow-lg`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                </div>
                
                <p className={`text-lg font-black tracking-tight ${isSuccess ? 'text-emerald-300' : 'text-red-300'}`}>
                    {value}
                </p>
            </div>
            
            <div 
                className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(circle at 0% 0%, ${isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'} 0%, transparent 80%)`
                }}
            />
        </div>
    );
};

const InteractiveMapPlaceholder = () => (
    <Card 
      title="Mapa Interativo do MT"
      tooltipText="Visualização geográfica dos municípios do Mato Grosso, coloridos conforme o status operacional: Consolidada (verde), Em Expansão (laranja) e Não Atendida (cinza)."
      gradient
    >
        <div 
            className="h-full flex flex-col items-center justify-center min-h-[350px] rounded-xl"
            style={{ background: 'rgb(255 255 255 / 5%)' }}
        >
            <div className="relative">
                <div className="absolute inset-0 blur-3xl animate-pulse" style={{ background: 'rgba(59, 130, 246, 0.2)' }}></div>
                <FiMapPin className="relative text-7xl mb-6 animate-bounce" style={{ color: '#3b82f6' }} />
            </div>
            <p className="text-lg font-semibold mb-6" style={{ color: '#ffffff' }}>Mapa de Cobertura</p>
            <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center px-4 py-2 rounded-full" style={{ background: 'rgba(8, 165, 14, 0.2)' }}>
                    <span className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ background: '#08a50e' }}></span>
                    <span className="text-sm font-medium" style={{ color: '#69bb03' }}>Consolidada</span>
                </div>
                <div className="flex items-center px-4 py-2 rounded-full" style={{ background: 'rgba(255, 193, 7, 0.2)' }}>
                    <span className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ background: '#ffc107' }}></span>
                    <span className="text-sm font-medium" style={{ color: '#ffc107' }}>Em Expansão</span>
                </div>
                <div className="flex items-center px-4 py-2 rounded-full" style={{ background: 'rgb(255 255 255 / 15%)' }}>
                    <span className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ background: 'rgb(255 255 255 / 50%)' }}></span>
                    <span className="text-sm font-medium" style={{ color: 'rgb(255 255 255 / 50%)' }}>Não Atendida</span>
                </div>
            </div>
            <p className="text-xs text-center mt-6 px-4" style={{ color: 'rgb(255 255 255 / 40%)' }}>
                Mapa interativo com MapboxGL será implementado aqui
            </p>
        </div>
    </Card>
);

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { cities, warnings } = useContext(DataContext);
    const [todayRides, setTodayRides] = useState<{ rides: number; revenue: number; cityCount: number }>({ 
        rides: 0, 
        revenue: 0,
        cityCount: 0
    });
    const [monthlyMetrics, setMonthlyMetrics] = useState<{ 
        current: { ops: string; custoCorrida: string; cpaMkt: string; custoTot: string; corridas: string; receita: string } | null;
        previous: { ops: string; custoCorrida: string; cpaMkt: string; custoTot: string; corridas: string; receita: string } | null;
        currentMonthLabel: string;
        previousMonthLabel: string;
    }>({ 
        current: null, 
        previous: null,
        currentMonthLabel: '',
        previousMonthLabel: ''
    });
    
    // Buscar corridas de hoje com atualização automática a cada 1 minuto
    const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
    const [isUpdating, setIsUpdating] = useState(false);
    
    useEffect(() => {
        let isMounted = true;
        
        const loadTodayRides = async () => {
            try {
                setIsUpdating(true);
                const data = await getTodayRides();
                if (isMounted) {
                    setTodayRides(data);
                    setLastUpdateTime(new Date());
                    setIsUpdating(false);
                }
            } catch (error) {
                console.error('Erro ao carregar corridas de hoje:', error);
                setIsUpdating(false);
            }
        };
        
        // Carregar na montagem imediatamente
        loadTodayRides();
        
        // Configurar polling a cada 1 minuto (60000 ms)
        const interval = setInterval(loadTodayRides, 60000);
        
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);
    
    // Buscar dados de todos os meses quando o componente monta
    useEffect(() => {
        const loadMonthlyMetrics = async () => {
            try {
                const activeCities = cities.filter(c => c.status === CityStatus.Consolidated || c.status === CityStatus.Expansion);
                
                // Buscar dados de todos os meses para cada cidade ativa
                const allMonthlyData: { [monthKey: string]: { rides: number; revenue: number } } = {};
                
                for (const city of activeCities) {
                    try {
                        const monthlyData = await getMonthlyRidesByCity(city.name, 24); // 24 últimos meses
                        
                        if (monthlyData && monthlyData.length > 0) {
                            monthlyData.forEach(m => {
                                const monthKey = `${m.year}-${String(m.monthNumber).padStart(2, '0')}`;
                                if (!allMonthlyData[monthKey]) {
                                    allMonthlyData[monthKey] = { rides: 0, revenue: 0 };
                                }
                                allMonthlyData[monthKey].rides += m.rides;
                                allMonthlyData[monthKey].revenue += m.revenue || 0;
                            });
                        }
                    } catch (error) {
                        // Silenciosamente ignora cidades sem dados
                    }
                }
                
                // Obter mês atual e anterior
                const today = new Date();
                const currentYear = today.getFullYear();
                const currentMonth = today.getMonth() + 1;
                const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
                
                const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const previousYear = prevDate.getFullYear();
                const previousMonth = prevDate.getMonth() + 1;
                const previousMonthKey = `${previousYear}-${String(previousMonth).padStart(2, '0')}`;
                
                const currentData = allMonthlyData[currentMonthKey];
                const previousData = allMonthlyData[previousMonthKey];
                
                const calculateMetrics = (rides: number, revenue: number) => {
                    const targetPopulation = activeCities.reduce((sum, c) => sum + c.population15to44, 0);
                    const opsPassRatio = targetPopulation > 0 ? (rides / targetPopulation).toFixed(2) : '0.00';
                    const costPerRide = rides > 0 ? (revenue * 0.35 / rides).toFixed(2) : '0.00'; // 35% de custo estimado
                    const cpaMkt = rides > 0 ? (revenue * 0.15 / rides).toFixed(2) : '0.00'; // 15% de custo de marketing
                    const totalCost = (parseFloat(costPerRide) * rides).toFixed(0);
                    
                    return {
                        ops: opsPassRatio,
                        custoCorrida: `R$ ${parseFloat(costPerRide).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        cpaMkt: `R$ ${parseFloat(cpaMkt).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        custoTot: `R$ ${parseInt(totalCost).toLocaleString('pt-BR')}`,
                        corridas: rides.toLocaleString('pt-BR'),
                        receita: `R$ ${revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                    };
                };
                
                const currentMetrics = currentData 
                    ? calculateMetrics(currentData.rides, currentData.revenue)
                    : null;
                
                const previousMetrics = previousData
                    ? calculateMetrics(previousData.rides, previousData.revenue)
                    : null;
                
                const currentMonthLabel = new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
                const previousMonthLabel = new Date(previousYear, previousMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
                
                setMonthlyMetrics({
                    current: currentMetrics,
                    previous: previousMetrics,
                    currentMonthLabel,
                    previousMonthLabel
                });
            } catch (error) {
                console.error('Erro ao carregar métricas mensais:', error);
            }
        };
        
        if (cities.length > 0) {
            loadMonthlyMetrics();
        }
    }, [cities]);
    
    const totalCities = 141; // Total municipalities in MT
    const activeCities = cities.filter(c => c.status === CityStatus.Consolidated).length;
    const expansionCities = cities.filter(c => c.status === CityStatus.Expansion).length;
    const planningCities = cities.filter(c => c.status === CityStatus.Planning).length;
    const notServedCities = cities.filter(c => c.status === CityStatus.NotServed).length;

    // Calculate dynamic financial data
    const totalRevenue = cities
        .filter(c => c.status === CityStatus.Consolidated || c.status === CityStatus.Expansion)
        .reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);

    // Calculate population covered
    const populationCovered = cities
        .filter(c => c.status === CityStatus.Consolidated || c.status === CityStatus.Expansion)
        .reduce((sum, c) => sum + c.population, 0);

    const targetPopulationCovered = cities
        .filter(c => c.status === CityStatus.Consolidated || c.status === CityStatus.Expansion)
        .reduce((sum, c) => sum + c.population15to44, 0);

    // Top 5 cities by revenue
    const topCitiesByRevenue = useMemo(() => {
        return cities
            .filter(c => (c.monthlyRevenue || 0) > 0)
            .sort((a, b) => (b.monthlyRevenue || 0) - (a.monthlyRevenue || 0))
            .slice(0, 5);
    }, [cities]);

    // Top opportunities (not served cities with high potential)
    const topOpportunities = useMemo(() => {
        return cities
            .filter(c => c.status === CityStatus.NotServed)
            .sort((a, b) => {
                const scoreA = (a.population15to44 * 0.4) + (a.averageIncome * 0.3) + (a.urbanizationIndex * 1000);
                const scoreB = (b.population15to44 * 0.4) + (b.averageIncome * 0.3) + (b.urbanizationIndex * 1000);
                return scoreB - scoreA;
            })
            .slice(0, 5);
    }, [cities]);

    // Calculate revenue per Mesorregion
    const revenueByRegion = useMemo(() => {
        const regions = Object.values(Mesorregion);
        const data = regions.map(region => {
            return cities
                .filter(c => c.mesorregion === region && (c.monthlyRevenue || 0) > 0)
                .reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);
        });
        return { regions, data };
    }, [cities]);

    const revenueChartData = {
        labels: revenueByRegion.regions.map(r => r.replace('_MATOGROSSENSE', '').replace(/_/g, ' ')),
        datasets: [
            {
                label: 'Receita Mensal',
                data: revenueByRegion.data,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                borderRadius: 6,
            },
        ],
    };
    
    const revenueChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: 'rgb(255 255 255 / 70%)',
                    callback: function(value: string | number) {
                        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(Number(value));
                    }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                }
            },
            x: {
                ticks: {
                    color: 'rgb(255 255 255 / 70%)',
                },
                grid: {
                    display: false,
                }
            }
        }
    };

    // Status distribution chart
    const statusChartData = {
        labels: ['Consolidada', 'Expansão', 'Planejamento', 'Não Atendida'],
        datasets: [{
            data: [activeCities, expansionCities, planningCities, notServedCities],
            backgroundColor: [
                'rgba(8, 165, 14, 0.8)',
                'rgba(255, 193, 7, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(255, 255, 255, 0.3)',
            ],
            borderColor: [
                'rgba(105, 187, 3, 1)',
                'rgba(255, 193, 7, 1)',
                'rgba(59, 130, 246, 1)',
                'rgba(255, 255, 255, 0.5)',
            ],
            borderWidth: 2,
        }]
    };

    const statusChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 15,
                    color: 'rgb(255 255 255 / 85%)',
                    font: {
                        size: 11,
                        weight: 'bold' as const,
                    }
                }
            },
        },
    };

    const nextExpansions = cities
        .filter(c => c.status === CityStatus.Expansion && c.implementationStartDate)
        .sort((a, b) => new Date(a.implementationStartDate!).getTime() - new Date(b.implementationStartDate!).getTime())
        .slice(0, 5); // Show top 5
        
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Improved Header Section */}
            <div className="relative mb-8 overflow-hidden rounded-2xl p-8" style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)'
            }}>
                <div className="absolute top-0 right-0 w-96 h-96 opacity-20 blur-3xl" style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent)',
                    animation: 'pulse 8s ease-in-out infinite'
                }} />
                <div className="relative z-10">
                    <h1 className="text-5xl font-black mb-2" style={{ color: '#ffffff' }}>Dashboard</h1>
                    <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Visão geral das operações em Mato Grosso
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                        <div className="h-1 w-16 rounded-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
                        <span className="text-sm font-semibold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            📊 Atualizado em tempo real
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    icon={<FiUsers />} 
                    title="Cobertura" 
                    value={`${activeCities + expansionCities}`} 
                    subValue={`${((activeCities + expansionCities) / totalCities * 100).toFixed(1)}% do estado`}
                    trend="up" 
                    trendValue={`+${expansionCities}`}
                    tooltipText={`${activeCities} cidades consolidadas e ${expansionCities} em expansão de um total de ${totalCities} municípios no MT.`}
                    sparklineData={[3, 5, 4, 7, 6, 8, 10, 9, 12, 11, 14, 15]}
                />
                <KpiCard 
                    icon={<FiDollarSign />} 
                    title="Receita Mensal" 
                    value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} 
                    subValue={`desde a última semana`}
                    trend="up" 
                    trendValue="12.5%" 
                    tooltipText="Receita total mensal estimada das cidades consolidadas e em expansão."
                    sparklineData={[20, 25, 22, 30, 28, 35, 32, 40, 38, 45, 50, 48]}
                />
                <KpiCard 
                    icon={<FiTarget />} 
                    title="População Coberta" 
                    value={populationCovered.toLocaleString('pt-BR')} 
                    subValue={`Público-alvo: ${targetPopulationCovered.toLocaleString('pt-BR')}`}
                    tooltipText={`População total nas cidades ativas. Público-alvo (15-44 anos) representa ${populationCovered > 0 ? (targetPopulationCovered / populationCovered * 100).toFixed(1) : '0'}% do total.`}
                    sparklineData={[100, 110, 105, 120, 115, 130, 125, 140, 135, 150, 160, 155]}
                />
                <KpiCard 
                    icon={<FiBarChart2 />} 
                    title="Oportunidades" 
                    value={`${notServedCities}`} 
                    subValue={`${planningCities} em planejamento`}
                    trend="up"
                    trendValue={`${((notServedCities / totalCities) * 100).toFixed(0)}%`}
                    tooltipText="Cidades não atendidas representam oportunidades de expansão. Algumas já estão em fase de planejamento."
                    sparklineData={[80, 75, 78, 72, 70, 68, 65, 60, 58, 55, 50, 48]}
                />
            </div>

            {/* Bloco de Corridas Realizadas Hoje - Atualiza a cada 1 minuto */}
            <div className="rounded-2xl p-6 backdrop-blur-sm" style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #06b6d4, #10b981)' }} />
                        <h3 className="text-xl font-bold" style={{ color: '#ffffff' }}>
                            Corridas Realizadas Hoje
                        </h3>
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(6, 182, 212, 0.3)', color: '#06b6d4' }}>
                            🔄 Atualiza a cada 1 min
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isUpdating && (
                            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.3)', color: '#10b981' }}>
                                ⟳ Atualizando...
                            </span>
                        )}
                        <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            {lastUpdateTime.toLocaleTimeString('pt-BR')}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card: Corridas de Hoje */}
                    <div 
                        className="group rounded-xl p-6 border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden relative"
                        style={{
                            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            boxShadow: '0 4px 20px rgba(6, 182, 212, 0.15)'
                        }}
                    >
                        {isUpdating && (
                            <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.1), transparent)' }} />
                        )}
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Corridas</p>
                                <span className="text-lg">🚗</span>
                            </div>
                            <p className="text-4xl font-black tracking-tight" style={{ color: '#06b6d4' }}>
                                {todayRides.rides.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs mt-3" style={{ color: 'rgb(255 255 255 / 50%)' }}>
                                corridas concluídas hoje
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-600">
                                <p className="text-xs font-semibold" style={{ color: '#06b6d4' }}>
                                    ✓ Dados em tempo real
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card: Receita Real e Concluída Hoje */}
                    <div 
                        className="group rounded-xl p-6 border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden relative"
                        style={{
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            boxShadow: '0 4px 20px rgba(34, 197, 94, 0.15)'
                        }}
                    >
                        {isUpdating && (
                            <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.1), transparent)' }} />
                        )}
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Receita Real</p>
                                <span className="text-lg">💰</span>
                            </div>
                            <p className="text-3xl font-black tracking-tight" style={{ color: '#22c55e' }}>
                                R$ {todayRides.revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-xs mt-3" style={{ color: 'rgb(255 255 255 / 50%)' }}>
                                receita concluída hoje
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-600">
                                <p className="text-xs font-semibold" style={{ color: '#22c55e' }}>
                                    ✓ Receita verificada
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card: Cidades Ativas */}
                    <div 
                        className="group rounded-xl p-6 border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden relative"
                        style={{
                            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            boxShadow: '0 4px 20px rgba(168, 85, 247, 0.15)'
                        }}
                    >
                        {isUpdating && (
                            <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.1), transparent)' }} />
                        )}
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Cidades</p>
                                <span className="text-lg">🏙️</span>
                            </div>
                            <p className="text-4xl font-black tracking-tight" style={{ color: '#a855f7' }}>
                                {todayRides.cityCount}
                            </p>
                            <p className="text-xs mt-3" style={{ color: 'rgb(255 255 255 / 50%)' }}>
                                cidades em operação
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-600">
                                <p className="text-xs font-semibold" style={{ color: '#a855f7' }}>
                                    ✓ Ativas hoje
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Informações Adicionais */}
                <div className="mt-6 pt-6 border-t border-gray-700 flex items-center justify-between text-xs">
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        📊 Última atualização: {lastUpdateTime.toLocaleString('pt-BR')}
                    </div>
                    <div style={{ color: 'rgba(6, 182, 212, 0.7)' }}>
                        Próxima atualização em ~1 minuto
                    </div>
                </div>
            </div>

            {/* Linha de Métricas - Mês Atual Global */}
            {monthlyMetrics.current && (
                <div className="space-y-6">
                    <div className="rounded-2xl p-6 backdrop-blur-sm" style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #3b82f6, #1e40af)' }} />
                            <h3 className="text-xl font-bold" style={{ color: '#ffffff' }}>
                                Métricas Acumuladas - {monthlyMetrics.currentMonthLabel}
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <MetricCard 
                                label="OPS/PASS" 
                                value={monthlyMetrics.current.ops}
                            />
                            <MetricCard 
                                label="CUSTO/CORR" 
                                value={monthlyMetrics.current.custoCorrida}
                            />
                            <MetricCard 
                                label="CPA MKT" 
                                value={monthlyMetrics.current.cpaMkt}
                            />
                            <MetricCard 
                                label="CUSTO TOT" 
                                value={monthlyMetrics.current.custoTot}
                            />
                            <MetricCard 
                                label="CORRIDAS" 
                                value={monthlyMetrics.current.corridas}
                            />
                            <MetricCard 
                                label="RECEITA" 
                                value={monthlyMetrics.current.receita}
                            />
                        </div>
                    </div>

                    {/* Linha de Métricas - Mês Anterior */}
                    {monthlyMetrics.previous && (
                        <div className="rounded-2xl p-6 backdrop-blur-sm" style={{
                            background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(75, 85, 99, 0.05) 100%)',
                            border: '1px solid rgba(107, 114, 128, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                        }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #6b7280, #374151)' }} />
                                <h3 className="text-xl font-bold" style={{ color: '#ffffff' }}>
                                    Métricas Acumuladas - {monthlyMetrics.previousMonthLabel}
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                <MetricCard 
                                    label="OPS/PASS" 
                                    value={monthlyMetrics.previous.ops}
                                />
                                <MetricCard 
                                    label="CUSTO/CORR" 
                                    value={monthlyMetrics.previous.custoCorrida}
                                />
                                <MetricCard 
                                    label="CPA MKT" 
                                    value={monthlyMetrics.previous.cpaMkt}
                                />
                                <MetricCard 
                                    label="CUSTO TOT" 
                                    value={monthlyMetrics.previous.custoTot}
                                />
                                <MetricCard 
                                    label="CORRIDAS" 
                                    value={monthlyMetrics.previous.corridas}
                                />
                                <MetricCard 
                                    label="RECEITA" 
                                    value={monthlyMetrics.previous.receita}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                   <InteractiveMapPlaceholder />
                </div>
                <div className="space-y-6">
                    <Card 
                      title="Distribuição por Status"
                      tooltipText="Proporção de cidades em cada status operacional no estado."
                      gradient
                    >
                        <div className="h-64 p-4 flex items-center justify-center">
                            <Doughnut options={statusChartOptions} data={statusChartData} />
                        </div>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card 
                    title="Receita por Mesorregião"
                    tooltipText="Comparação de receita mensal entre as diferentes mesorregiões do estado."
                    gradient
                >
                    <div className="h-80 p-2 dt-chart-glass" style={{ background: 'rgba(12,25,41,0.65)', borderRadius: 12, backdropFilter: 'blur(8px)' }}>
                        <Bar options={{
                            ...revenueChartOptions,
                            plugins: {
                                ...revenueChartOptions.plugins,
                                legend: { ...revenueChartOptions.plugins.legend, labels: { color: '#fff' } },
                            },
                            scales: {
                                ...revenueChartOptions.scales,
                                x: { ...revenueChartOptions.scales.x, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                                y: { ...revenueChartOptions.scales.y, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                            }
                        }} data={revenueChartData} />
                    </div>
                </Card>

                <Card 
                    title="Top 5 Cidades por Receita"
                    tooltipText="Ranking das cidades com melhor performance financeira mensal."
                    gradient
                >
                    <div className="space-y-3">
                        {topCitiesByRevenue.map((city, index) => (
                            <div 
                                key={city.id} 
                                onClick={() => navigate(`/cidades/${city.id}`)}
                                className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 cursor-pointer group"
                                style={{ 
                                    background: 'rgb(255 255 255 / 5%)',
                                    border: '1px solid rgb(255 255 255 / 10%)'
                                }}
                            >
                                <div className="flex items-center space-x-4">
                                    <div 
                                        className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
                                        style={{
                                            background: index === 0 ? 'linear-gradient(180deg, #ffc107, #e0a800)' :
                                                       index === 1 ? 'linear-gradient(180deg, #adb5bd, #868e96)' :
                                                       index === 2 ? 'linear-gradient(180deg, #cd7f32, #a0522d)' :
                                                       'rgb(255 255 255 / 15%)',
                                            color: index < 3 ? '#000' : 'rgb(255 255 255 / 70%)'
                                        }}
                                    >
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold group-hover:text-blue-400 transition-colors" style={{ color: '#ffffff' }}>{city.name}</p>
                                        <p className="text-xs" style={{ color: 'rgb(255 255 255 / 50%)' }}>{city.population.toLocaleString('pt-BR')} habitantes</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-lg" style={{ color: '#ffffff' }}>
                                        {(city.monthlyRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs" style={{ color: 'rgb(255 255 255 / 50%)' }}>por mês</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card
                    title="Principais Oportunidades"
                    tooltipText="Cidades não atendidas com maior potencial baseado em população-alvo, renda média e urbanização."
                    gradient
                >
                    <div className="space-y-3">
                        {topOpportunities.map((city, index) => (
                            <div 
                                key={city.id}
                                onClick={() => navigate(`/city/${city.id}`)}
                                className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 cursor-pointer group"
                                style={{ 
                                    background: 'rgb(255 255 255 / 5%)',
                                    border: '1px solid rgb(255 255 255 / 10%)'
                                }}
                            >
                                <div className="flex items-center space-x-4 flex-1">
                                    <div 
                                        className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm shadow-lg"
                                        style={{ background: 'linear-gradient(45deg, #3b82f6, #1E88E5)' }}
                                    >
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold group-hover:text-blue-400 transition-colors" style={{ color: '#ffffff' }}>{city.name}</p>
                                        <div className="flex items-center space-x-4 mt-1">
                                            <span className="text-xs" style={{ color: 'rgb(255 255 255 / 50%)' }}>
                                                <FiUsers className="inline mr-1" />
                                                {city.population15to44.toLocaleString('pt-BR')} (15-44 anos)
                                            </span>
                                            <span className="text-xs" style={{ color: 'rgb(255 255 255 / 50%)' }}>
                                                <FiDollarSign className="inline mr-1" />
                                                R$ {city.averageIncome.toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                                        {(city.urbanizationIndex * 100).toFixed(0)}% urbanização
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => navigate('/consulta')} 
                        className="mt-6 w-full text-white py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-semibold"
                        style={{ background: 'linear-gradient(45deg, #3b82f6, #1E88E5)' }}
                    >
                        Analisar Todas as Oportunidades
                    </button>
                </Card>

                <Card
                    title="Expansões em Andamento"
                    tooltipText="Cidades que iniciaram recentemente ou estão prestes a iniciar operações, ordenadas por data."
                    gradient
                >
                    <div className="space-y-3">
                        {nextExpansions.map(city => {
                            const startDate = new Date(city.implementationStartDate!);
                            const isUpcoming = startDate > new Date();
                            const daysUntil = Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            
                            return (
                                <div 
                                    key={city.id}
                                    onClick={() => navigate(`/city/${city.id}`)}
                                    className="flex justify-between items-center p-4 rounded-xl transition-all duration-200 cursor-pointer group"
                                    style={{ 
                                        background: 'rgb(255 255 255 / 5%)',
                                        border: '1px solid rgb(255 255 255 / 10%)'
                                    }}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span 
                                            className={`w-3 h-3 rounded-full shadow-lg ${isUpcoming ? 'animate-pulse' : ''}`}
                                            style={{ background: isUpcoming ? '#3b82f6' : '#08a50e' }}
                                        ></span>
                                        <div>
                                            <p className="font-bold group-hover:text-blue-400 transition-colors" style={{ color: '#ffffff' }}>{city.name}</p>
                                            <p className="text-xs" style={{ color: 'rgb(255 255 255 / 50%)' }}>
                                                {isUpcoming ? `Inicia em ${daysUntil} dias` : `Iniciou há ${Math.abs(daysUntil)} dias`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold" style={{ color: '#ffffff' }}>
                                            {startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </p>
                                        {city.monthlyRevenue && (
                                            <p className="text-xs" style={{ color: 'rgb(255 255 255 / 50%)' }}>
                                                {city.monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {nextExpansions.length === 0 && (
                            <p className="text-sm text-center py-8" style={{ color: 'rgb(255 255 255 / 50%)' }}>Nenhuma expansão ativa no momento.</p>
                        )}
                    </div>
                    <button 
                        onClick={() => navigate('/roadmap')} 
                        className="mt-6 w-full text-white py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-semibold"
                        style={{ background: 'linear-gradient(45deg, #3b82f6, #1E88E5)' }}
                    >
                        Ver Roadmap Completo
                    </button>
                </Card>
            </div>

        </div>
    );
};

export default Dashboard;

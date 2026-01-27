
import React, { useContext, useMemo } from 'react';
import Card from '../components/ui/Card';
import { FiUsers, FiDollarSign, FiTrendingUp, FiAlertTriangle, FiArrowDown, FiArrowUp, FiMapPin, FiTarget, FiBarChart2 } from 'react-icons/fi';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { CityStatus, Mesorregion } from '../types';
import { useNavigate } from 'react-router-dom';
import InfoTooltip from '../components/ui/InfoTooltip';
import { DataContext } from '../context/DataContext';

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
        className="relative rounded-xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1"
        style={{
            background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
            border: '1px solid rgb(255 255 255 / 10%)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
    >
        <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'rgb(255 255 255 / 60%)' }}>{title}</p>
                <p className="text-3xl font-bold" style={{ color: '#ffffff' }}>{value}</p>
                {trend && trendValue && (
                    <p 
                        className="text-xs font-medium mt-1 flex items-center"
                        style={{ color: trend === 'up' ? '#10b981' : '#ef4444' }}
                    >
                        {trend === 'up' ? <FiArrowUp className="mr-1" /> : <FiArrowDown className="mr-1" />}
                        {trendValue} {subValue}
                    </p>
                )}
                {!trend && subValue && (
                    <p className="text-xs mt-1" style={{ color: 'rgb(255 255 255 / 50%)' }}>{subValue}</p>
                )}
            </div>
            <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgb(255 255 255 / 15%)' }}
            >
                <span className="w-5 h-5 text-white">
                    {icon}
                </span>
            </div>
        </div>
        <div className="absolute top-1 right-1 z-20">
            <InfoTooltip text={tooltipText} />
        </div>
        {sparklineData && <SparklineChart data={sparklineData} />}
    </div>
);

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
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-4xl font-black mb-2" style={{ color: '#ffffff' }}>Dashboard</h1>
                <p style={{ color: 'rgb(255 255 255 / 50%)' }}>Visão geral das operações em Mato Grosso</p>
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
                    tooltipText={`População total nas cidades ativas. Público-alvo (15-44 anos) representa ${(targetPopulationCovered / populationCovered * 100).toFixed(1)}% do total.`}
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
                                onClick={() => navigate(`/city/${city.id}`)}
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

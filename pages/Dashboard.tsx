
import React, { useContext, useMemo } from 'react';
import Card from '../components/ui/Card';
import { FiUsers, FiDollarSign, FiTrendingUp, FiAlertTriangle, FiArrowDown, FiArrowUp, FiMapPin, FiTarget, FiBarChart2 } from 'react-icons/fi';
import { Bar, Doughnut } from 'react-chartjs-2';
import { CityStatus, Mesorregion } from '../types';
import { useNavigate } from 'react-router-dom';
import InfoTooltip from '../components/ui/InfoTooltip';
import { DataContext } from '../context/DataContext';

const KpiCard = ({ icon, title, value, subValue, trend, trendValue, tooltipText }: { icon: React.ReactElement, title: string, value: string, subValue: string, trend?: 'up' | 'down', trendValue?: string, tooltipText: string }) => (
    <Card gradient>
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
                 <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-400/10 dark:from-blue-500/30 dark:to-blue-600/10 text-blue-700 dark:text-blue-400 mr-4 shadow-sm">
                    {React.cloneElement(icon, { className: 'w-6 h-6' })}
                 </div>
                <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">{value}</p>
                </div>
            </div>
            <InfoTooltip text={tooltipText} />
        </div>
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
            <span className="text-slate-600 dark:text-slate-400">{subValue}</span>
            {trend && trendValue && (
                <span className={`flex items-center font-bold px-3 py-1 rounded-full text-xs ${trend === 'up' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                    {trend === 'up' ? <FiArrowUp className="mr-1" /> : <FiArrowDown className="mr-1" />}
                    {trendValue}
                </span>
            )}
        </div>
    </Card>
);

const InteractiveMapPlaceholder = () => (
    <Card 
      title="Mapa Interativo do MT"
      tooltipText="Visualização geográfica dos municípios do Mato Grosso, coloridos conforme o status operacional: Consolidada (verde), Em Expansão (laranja) e Não Atendida (cinza)."
      gradient
    >
        <div className="h-full flex flex-col items-center justify-center min-h-[350px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 rounded-xl">
            <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-blue-600/20 dark:bg-blue-500/30 animate-pulse"></div>
                <FiMapPin className="relative text-7xl text-blue-700 dark:text-blue-400 mb-6 animate-bounce" />
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Mapa de Cobertura</p>
            <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <span className="w-3 h-3 rounded-full bg-green-500 mr-2 shadow-sm"></span>
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Consolidada</span>
                </div>
                <div className="flex items-center px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <span className="w-3 h-3 rounded-full bg-orange-500 mr-2 shadow-sm"></span>
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Em Expansão</span>
                </div>
                <div className="flex items-center px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <span className="w-3 h-3 rounded-full bg-slate-400 mr-2 shadow-sm"></span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-400">Não Atendida</span>
                </div>
            </div>
            <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-6 px-4">
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
                borderColor: 'rgba(30, 58, 138, 1)',
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
                    callback: function(value: string | number) {
                        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(Number(value));
                    }
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.1)',
                }
            },
            x: {
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
                'rgba(34, 197, 94, 0.8)',
                'rgba(251, 146, 60, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(148, 163, 184, 0.8)',
            ],
            borderColor: [
                'rgba(22, 163, 74, 1)',
                'rgba(234, 88, 12, 1)',
                'rgba(30, 58, 138, 1)',
                'rgba(100, 116, 139, 1)',
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
                    font: {
                        size: 11,
                        weight: '600' as const,
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
                <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-2">Dashboard</h1>
                <p className="text-slate-600 dark:text-slate-400">Visão geral das operações em Mato Grosso</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    icon={<FiUsers />} 
                    title="Cobertura" 
                    value={`${activeCities + expansionCities}`} 
                    subValue={`${((activeCities + expansionCities) / totalCities * 100).toFixed(1)}% do estado`}
                    trend="up" 
                    trendValue={`+${expansionCities} em expansão`}
                    tooltipText={`${activeCities} cidades consolidadas e ${expansionCities} em expansão de um total de ${totalCities} municípios no MT.`}
                />
                <KpiCard 
                    icon={<FiDollarSign />} 
                    title="Receita Mensal" 
                    value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} 
                    subValue={`Média: ${(totalRevenue / (activeCities + expansionCities)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}/cidade`}
                    trend="up" 
                    trendValue="12.5%" 
                    tooltipText="Receita total mensal estimada das cidades consolidadas e em expansão."
                />
                <KpiCard 
                    icon={<FiTarget />} 
                    title="População Coberta" 
                    value={populationCovered.toLocaleString('pt-BR')} 
                    subValue={`Público-alvo: ${targetPopulationCovered.toLocaleString('pt-BR')}`}
                    tooltipText={`População total nas cidades ativas. Público-alvo (15-44 anos) representa ${(targetPopulationCovered / populationCovered * 100).toFixed(1)}% do total.`}
                />
                <KpiCard 
                    icon={<FiBarChart2 />} 
                    title="Oportunidades" 
                    value={`${notServedCities}`} 
                    subValue={`${planningCities} em planejamento`}
                    trend="up"
                    trendValue={`${((notServedCities / totalCities) * 100).toFixed(0)}% potencial`}
                    tooltipText="Cidades não atendidas representam oportunidades de expansão. Algumas já estão em fase de planejamento."
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
                    <div className="h-80 p-2">
                        <Bar options={revenueChartOptions} data={revenueChartData} />
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
                                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer group"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900' :
                                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900' :
                                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900' :
                                        'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{city.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{city.population.toLocaleString('pt-BR')} habitantes</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-lg text-slate-900 dark:text-slate-100">
                                        {(city.monthlyRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">por mês</p>
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
                                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer group"
                            >
                                <div className="flex items-center space-x-4 flex-1">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-white text-sm shadow-lg">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{city.name}</p>
                                        <div className="flex items-center space-x-4 mt-1">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                <FiUsers className="inline mr-1" />
                                                {city.population15to44.toLocaleString('pt-BR')} (15-44 anos)
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                <FiDollarSign className="inline mr-1" />
                                                R$ {city.averageIncome.toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold">
                                        {(city.urbanizationIndex * 100).toFixed(0)}% urbanização
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => navigate('/consulta')} 
                        className="mt-6 w-full bg-gradient-to-r from-blue-700 to-blue-600 dark:from-blue-600 dark:to-blue-500 text-white py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-semibold"
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
                                    className="flex justify-between items-center p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className={`w-3 h-3 rounded-full ${isUpcoming ? 'bg-blue-500 animate-pulse' : 'bg-green-500'} shadow-lg`}></span>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{city.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {isUpcoming ? `Inicia em ${daysUntil} dias` : `Iniciou há ${Math.abs(daysUntil)} dias`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                            {startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </p>
                                        {city.monthlyRevenue && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {city.monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {nextExpansions.length === 0 && (
                            <p className="text-slate-500 text-sm text-center py-8">Nenhuma expansão ativa no momento.</p>
                        )}
                    </div>
                    <button 
                        onClick={() => navigate('/roadmap')} 
                        className="mt-6 w-full bg-gradient-to-r from-blue-700 to-blue-600 dark:from-blue-600 dark:to-blue-500 text-white py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-semibold"
                    >
                        Ver Roadmap Completo
                    </button>
                </Card>
            </div>

        </div>
    );
};

export default Dashboard;

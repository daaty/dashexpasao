
import React, { useContext, useMemo } from 'react';
import Card from '../components/ui/Card';
import { FiUsers, FiDollarSign, FiTrendingUp, FiAlertTriangle, FiArrowDown, FiArrowUp, FiMapPin } from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
import { CityStatus, Mesorregion } from '../types';
import { useNavigate } from 'react-router-dom';
import InfoTooltip from '../components/ui/InfoTooltip';
import { DataContext } from '../context/DataContext';

const KpiCard = ({ icon, title, value, subValue, trend, trendValue, tooltipText }: { icon: React.ReactElement, title: string, value: string, subValue: string, trend?: 'up' | 'down', trendValue?: string, tooltipText: string }) => (
    <Card gradient>
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
                 <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary mr-4 shadow-sm">
                    {React.cloneElement(icon, { className: 'w-6 h-6' })}
                 </div>
                <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
                    <p className="text-3xl font-black text-black dark:text-white mt-1">{value}</p>
                </div>
            </div>
            <InfoTooltip text={tooltipText} />
        </div>
        <div className="pt-4 border-t border-slate-200/60 dark:border-dark-100 flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">{subValue}</span>
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
        <div className="h-full flex flex-col items-center justify-center min-h-[350px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-300 dark:to-dark-200 rounded-xl">
            <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-primary/20 animate-pulse"></div>
                <FiMapPin className="relative text-7xl text-primary mb-6 animate-bounce" />
            </div>
            <p className="text-lg font-semibold text-black dark:text-white mb-6">Mapa de Cobertura</p>
            <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <span className="w-3 h-3 rounded-full bg-green-500 mr-2 shadow-sm"></span>
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Consolidada</span>
                </div>
                <div className="flex items-center px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <span className="w-3 h-3 rounded-full bg-orange-500 mr-2 shadow-sm"></span>
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Em Expansão</span>
                </div>
                <div className="flex items-center px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <span className="w-3 h-3 rounded-full bg-gray-400 mr-2 shadow-sm"></span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Não Atendida</span>
                </div>
            </div>
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-6 px-4">
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

    // Calculate dynamic financial data based on "Consolidated" cities monthlyRevenue
    const totalRevenue = cities
        .filter(c => c.status === CityStatus.Consolidated || c.status === CityStatus.Expansion)
        .reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);

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

    const chartData = {
        labels: revenueByRegion.regions.map(r => r.split(' ')[0]), // Shorten names for chart
        datasets: [
            {
                label: 'Receita Mensal Estimada',
                data: revenueByRegion.data,
                backgroundColor: 'rgba(34, 197, 94, 0.6)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };
    
    const chartOptions = {
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
                }
            }
        }
    };

    const nextExpansions = cities
        .filter(c => c.status === CityStatus.Expansion && c.implementationStartDate)
        .sort((a, b) => new Date(a.implementationStartDate!).getTime() - new Date(b.implementationStartDate!).getTime())
        .slice(0, 5); // Show top 5
        
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-4xl font-black text-black dark:text-white mb-2">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">Visão geral das operações em Mato Grosso</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard icon={<FiUsers />} title="Cidades" value={totalCities.toString()} subValue={`Ativas: ${activeCities} | Expansão: ${expansionCities}`} tooltipText="Total de municípios em MT. 'Ativas' são as cidades consolidadas e 'Em Expansão' são as que iniciaram operações recentemente."/>
                <KpiCard icon={<FiDollarSign />} title="Receita Mês (Est.)" value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} subValue="Baseado em cidades ativas" trend="up" trendValue="12.5%" tooltipText="Receita total mensal estimada somando todas as cidades com status Consolidada ou Em Expansão."/>
                <KpiCard icon={<FiTrendingUp />} title="Meta Global" value="68%" subValue="R$ 1.5M / Mês" tooltipText="Progresso em relação à meta de receita mensal global projetada para o estado." />
                <KpiCard icon={<FiAlertTriangle />} title="Alertas" value={`${warnings.length} Ativos`} subValue="Verificar notificações" tooltipText="Alertas gerados pelo sistema sobre KPIs de performance abaixo do esperado ou oportunidades críticas." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                   <InteractiveMapPlaceholder />
                </div>
                <div className="space-y-6">
                    <Card 
                      title="Receita por Região"
                      tooltipText="Gráfico de barras exibindo a receita mensal estimada agregada por mesorregião do estado."
                      gradient
                    >
                        <div className="h-72 p-2">
                            <Bar options={chartOptions} data={chartData} />
                        </div>
                    </Card>
                </div>
            </div>
            
            <Card
                title="Próximas Expansões / Recentes"
                tooltipText="Lista das cidades em fase de expansão, ordenadas pela data de início de operação."
                gradient
            >
                <ul className="space-y-3">
                    {nextExpansions.map(city => (
                        <li key={city.id} className="flex justify-between items-center p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-100 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-dark-100 group">
                           <span className="font-semibold flex items-center text-black dark:text-white">
                                <span className={`w-2.5 h-2.5 rounded-full mr-3 ${new Date(city.implementationStartDate!) > new Date() ? 'bg-blue-500 animate-pulse' : 'bg-green-500'} shadow-sm`}></span>
                                {city.name}
                           </span>
                           <span className="text-sm text-gray-500 dark:text-gray-400 font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-dark-100 group-hover:bg-white dark:group-hover:bg-dark-200 transition-colors">
                                {new Date(city.implementationStartDate!).toLocaleDateString('pt-BR')}
                           </span>
                        </li>
                    ))}
                    {nextExpansions.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Nenhuma expansão ativa no momento.</p>}
                </ul>
                <button onClick={() => navigate('/roadmap')} className="mt-6 w-full bg-gradient-to-r from-primary to-primary-600 text-white py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-semibold">
                    Ver Roadmap Completo
                </button>
            </Card>

        </div>
    );
};

export default Dashboard;

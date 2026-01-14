
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { City } from '../types';
import Card from '../components/ui/Card';
import { FiArrowLeft, FiPlusCircle, FiDownload, FiMessageSquare, FiExternalLink, FiHexagon } from 'react-icons/fi';
import { Bar, Line, Radar } from 'react-chartjs-2';
import { getFinancialProjections, getMarketPotential, getGrowthRoadmap, calculatePotentialRevenue } from '../services/calculationService';
import { slugify } from '../utils/textUtils';
import { chartColors, PENETRATION_SCENARIOS } from '../constants';
import InfoTooltip from '../components/ui/InfoTooltip';
import { DataContext } from '../context/DataContext';

const Comparison: React.FC = () => {
    const navigate = useNavigate();
    const { cities: allCities, isLoading, marketData } = useContext(DataContext);
    const [cities, setCities] = useState<City[]>([]);

    useEffect(() => {
        if (isLoading) return;
        
        const storedIds = localStorage.getItem('compareCityIds');
        if (storedIds) {
            const ids: number[] = JSON.parse(storedIds);
            const selected = allCities.filter(c => ids.includes(c.id));
            setCities(selected);
        } else if (!isLoading) { // only navigate if not loading and no IDs found
            navigate('/consulta');
        }
    }, [navigate, allCities, isLoading]);
    
    // --- RADAR CHART LOGIC ---
    const radarData = useMemo(() => {
        if (cities.length === 0) return null;

        // 1. Extract Raw Values
        const rawValues = cities.map(city => {
            const mData = marketData.find(m => m.cityId === city.id);
            const competitorCount = mData ? mData.competitors.length : 0;
            
            return {
                name: city.name,
                popTotal: city.population,
                popTarget: city.population15to44,
                salary: city.averageFormalSalary,
                jobs: city.formalJobs, // Proxy for "Quantidade de Indústria/Atividade Econômica"
                revenue: calculatePotentialRevenue(city, 'Média'),
                competitors: competitorCount
            };
        });

        // 2. Determine Max Values for Normalization (Avoid division by zero)
        const maxVals = {
            popTotal: Math.max(...rawValues.map(v => v.popTotal)) || 1,
            popTarget: Math.max(...rawValues.map(v => v.popTarget)) || 1,
            salary: Math.max(...rawValues.map(v => v.salary)) || 1,
            jobs: Math.max(...rawValues.map(v => v.jobs)) || 1,
            revenue: Math.max(...rawValues.map(v => v.revenue)) || 1,
            competitors: Math.max(...rawValues.map(v => v.competitors)) || 1
        };

        // 3. Normalize Data (0-100 scale)
        // Note: For competitors, usually "less is better", but for a "Magnitude" chart, 
        // we usually show the raw magnitude. If we wanted "Score", we would invert it.
        // Here we just show magnitude as requested.
        const datasets = rawValues.map((v, i) => ({
            label: v.name,
            data: [
                (v.revenue / maxVals.revenue) * 100,
                (v.popTarget / maxVals.popTarget) * 100,
                (v.popTotal / maxVals.popTotal) * 100,
                (v.salary / maxVals.salary) * 100,
                (v.jobs / maxVals.jobs) * 100,
                (v.competitors / maxVals.competitors) * 100
            ],
            backgroundColor: chartColors[i % chartColors.length] + '33', // 20% opacity
            borderColor: chartColors[i % chartColors.length],
            pointBackgroundColor: chartColors[i % chartColors.length],
            borderWidth: 2,
        }));

        return {
            labels: [
                'Receita Potencial', 
                'População Alvo', 
                'População Total', 
                'Renda Salarial', 
                'Indústria/Empregos', 
                'Concorrentes'
            ],
            datasets
        };
    }, [cities, marketData]);

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'top' as const,
                labels: {
                    font: {
                        size: 14
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        // Custom tooltip to show REAL value instead of normalized %
                        const cityIndex = context.datasetIndex;
                        const dataIndex = context.dataIndex;
                        const city = cities[cityIndex];
                        const mData = marketData.find(m => m.cityId === city.id);
                        
                        let realValue = '';
                        // let label = context.chart.data.labels[dataIndex]; // Unused

                        switch(dataIndex) {
                            case 0: realValue = calculatePotentialRevenue(city, 'Média').toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}); break; // Receita
                            case 1: realValue = city.population15to44.toLocaleString('pt-BR'); break; // Pop Alvo
                            case 2: realValue = city.population.toLocaleString('pt-BR'); break; // Pop Total
                            case 3: realValue = city.averageFormalSalary.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}); break; // Salario
                            case 4: realValue = city.formalJobs.toLocaleString('pt-BR'); break; // Indústria
                            case 5: realValue = (mData ? mData.competitors.length : 0).toString(); break; // Concorrentes
                        }
                        return `${city.name}: ${realValue}`;
                    }
                }
            }
        },
        scales: {
            r: {
                angleLines: {
                    display: true,
                    color: 'rgba(128, 128, 128, 0.2)'
                },
                suggestedMin: 0,
                suggestedMax: 100,
                ticks: {
                    display: false // Hide the 0-100 ticks to avoid confusion
                },
                pointLabels: {
                    font: {
                        size: 14, // Increased size
                        weight: 'bold' as const
                    }
                }
            }
        }
    };


    if (cities.length === 0) {
        return null;
    }

    const marketPotentialData = {
        labels: cities.map(c => c.name),
        datasets: Object.keys(getMarketPotential(cities[0])).map((scenarioKey, index) => ({
            label: getMarketPotential(cities[0])[index].scenario,
            data: cities.map(c => getMarketPotential(c)[index].rides),
            backgroundColor: chartColors[index % chartColors.length] + '99',
        }))
    };
    
    const financialProjectionsData = {
        labels: cities.map(c => c.name),
        datasets: Object.keys(getFinancialProjections(cities[0])).map((scenarioKey, index) => ({
            label: getFinancialProjections(cities[0])[index].scenario,
            data: cities.map(c => getFinancialProjections(c)[index].revenue),
            backgroundColor: chartColors[index % chartColors.length] + '99',
        }))
    };

    const growthRoadmapData = {
        labels: ['Mês 1', 'Mês 2', 'Mês 3', 'Mês 4', 'Mês 5', 'Mês 6'],
        datasets: cities.map((city, index) => ({
            label: city.name,
            data: getGrowthRoadmap(city, PENETRATION_SCENARIOS['Média']).map(d => d.rides),
            borderColor: chartColors[index % chartColors.length],
            backgroundColor: chartColors[index % chartColors.length] + '33',
            fill: false,
            tension: 0.1
        })),
    };

    const chartOptions = (yLabel: string, isCurrency = false) => ({
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: false },
             tooltip: {
                callbacks: {
                    label: (context: any) => {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += isCurrency ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y) : new Intl.NumberFormat('pt-BR').format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
         scales: {
            y: {
                title: { display: true, text: yLabel },
                 ticks: {
                    callback: (value: any) => isCurrency ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value) : new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)
                }
            }
        }
    });

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center justify-between">
                     <button onClick={() => navigate('/consulta')} className="flex items-center text-sm font-semibold hover:text-primary transition">
                        <FiArrowLeft className="mr-2" /> Voltar para Consulta
                    </button>
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="font-bold">Comparando:</span>
                        {cities.map(c => <span key={c.id} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">{c.name}</span>)}
                    </div>
                </div>
            </Card>

            {/* Radar Chart Section - Full Width & Larger */}
            <Card 
                title="Raio-X Comparativo (Radar)" 
                tooltipText="Gráfico de Radar normalizado (0-100%). Os valores são relativos ao maior da seleção. Útil para entender o perfil da cidade (ex: Cidades com muita indústria vs Cidades com muita população)."
            >
                <div className="h-[600px] w-full flex items-center justify-center">
                    {radarData && <Radar data={radarData} options={radarOptions} />}
                </div>
            </Card>

            {/* Demographic Table - Full Width */}
            <Card
                title="Dados Demográficos Básicos"
                tooltipText="Tabela comparativa com dados demográficos chave obtidos do IBGE. 'Índice de Urbanização' representa a porcentagem da população que vive em áreas urbanas."
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-dark-100">
                                <th className="p-3">Métrica</th>
                                {cities.map(c => <th key={c.id} className="p-3 text-center font-semibold">{c.name}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                        <tr className="border-b dark:border-dark-100"><td className="p-3 font-semibold">População Total</td>{cities.map(c => <td key={c.id} className="p-3 text-center">{c.population.toLocaleString('pt-BR')}</td>)}</tr>
                        <tr className="border-b dark:border-dark-100"><td className="p-3 font-semibold">População 15-44 anos</td>{cities.map(c => <td key={c.id} className="p-3 text-center">{c.population15to44.toLocaleString('pt-BR')}</td>)}</tr>
                        <tr className="border-b dark:border-dark-100"><td className="p-3 font-semibold">Renda Média Familiar</td>{cities.map(c => <td key={c.id} className="p-3 text-center">{c.averageIncome.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>)}</tr>
                        <tr className="border-b dark:border-dark-100"><td className="p-3 font-semibold">Empregos Formais</td>{cities.map(c => <td key={c.id} className="p-3 text-center">{c.formalJobs.toLocaleString('pt-BR')}</td>)}</tr>
                        <tr className="border-b dark:border-dark-100"><td className="p-3 font-semibold">Índice de Urbanização</td>{cities.map(c => <td key={c.id} className="p-3 text-center">{(c.urbanizationIndex * 100).toFixed(0)}%</td>)}</tr>
                            <tr>
                                <td className="p-3 font-semibold">Fonte IBGE</td>
                                {cities.map(c => (
                                    <td key={c.id} className="p-3 text-center">
                                        <a 
                                            href={`https://cidades.ibge.gov.br/brasil/mt/${slugify(c.name)}/panorama`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={`Ver ${c.name} no IBGE Cidades`}
                                            className="inline-block text-primary hover:text-primary-600"
                                        >
                                            <FiExternalLink className="h-5 w-5" />
                                        </a>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card
                    title="Potencial de Mercado (Corridas/mês)"
                    tooltipText="Este gráfico compara o número estimado de corridas mensais para cada cidade, com base em diferentes cenários de penetração de mercado (de 2% a 20%) aplicados sobre a população de 15-44 anos."
                >
                    <Bar options={chartOptions('Corridas Mensais')} data={marketPotentialData} />
                </Card>
                <Card
                    title="Projeções Financeiras (Receita/mês)"
                    tooltipText="Este gráfico compara a receita mensal estimada para cada cidade, calculada a partir do número de corridas (Potencial de Mercado) multiplicado pelo valor padrão por corrida (R$2,50)."
                >
                    <Bar options={chartOptions('Receita Mensal', true)} data={financialProjectionsData} />
                </Card>
            </div>
            
            <Card
                title="Roadmap de Crescimento (6 Meses)"
                tooltipText="Projeção do crescimento do número de corridas mensais ao longo dos primeiros 6 meses de operação, com base em uma curva de crescimento predefinida pela metodologia da Urban."
            >
                <Line options={chartOptions('Corridas Mensais')} data={growthRoadmapData} />
            </Card>

            <Card
                title="Ações Recomendadas"
                tooltipText="Atalhos para ações comuns com base nas cidades selecionadas para comparação, como adicioná-las ao planejamento de expansão ou gerar relatórios."
            >
                <div className="flex flex-wrap gap-4">
                     <button className="flex items-center bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition"><FiPlusCircle className="mr-2"/>Adicionar todas ao roadmap</button>
                     <button className="flex items-center bg-secondary text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"><FiDownload className="mr-2"/>Gerar relatório executivo</button>
                     <button onClick={() => navigate('/assistente')} className="flex items-center bg-tertiary text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition"><FiMessageSquare className="mr-2"/>Consultar assistente de IA</button>
                </div>
            </Card>
        </div>
    );
};

export default Comparison;

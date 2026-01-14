
import React, { useContext, useRef } from 'react';
import { City } from '../types';
import { getFinancialProjections, getGrowthRoadmap, calculateStateAverages, getMarketPotential } from '../services/calculationService';
import { Line } from 'react-chartjs-2';
import type { Chart as ChartJS } from 'chart.js';
import { FiExternalLink, FiUsers, FiDollarSign, FiPlusCircle, FiMessageSquare, FiGrid, FiMaximize, FiRefreshCw, FiBriefcase } from 'react-icons/fi';
import { slugify } from '../utils/textUtils';
import InfoTooltip from './ui/InfoTooltip';
import { DataContext } from '../context/DataContext';
import { PENETRATION_SCENARIOS } from '../constants';
import Spinner from './ui/Spinner';
import { useNavigate } from 'react-router-dom';

const KpiCard = ({ icon, title, value, tooltipText }: { icon: React.ReactElement, title: string, value: string, tooltipText: string }) => (
    <div className="bg-base-200 dark:bg-dark-100 p-4 rounded-lg text-center relative">
        <InfoTooltip text={tooltipText} className="absolute top-2 right-2"/>
        <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/20 text-primary mb-2">
            {icon}
        </div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
    </div>
);

const ComparisonBar = ({ label, cityValue, stateValue, formatFn }: { label: string, cityValue: number, stateValue: number, formatFn: (val: number) => string }) => {
    const difference = cityValue - stateValue;
    const isAboveAverage = difference >= 0;
    const percentageDiff = stateValue > 0 ? (Math.abs(difference) / stateValue) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold">{label}</span>
                <span className={`text-xs font-bold ${isAboveAverage ? 'text-green-500' : 'text-orange-500'}`}>
                    {isAboveAverage ? '▲' : '▼'} {percentageDiff.toFixed(1)}% {isAboveAverage ? 'acima da' : 'abaixo da'} média
                </span>
            </div>
            <div className="space-y-1">
                 <div className="flex items-center">
                    <span className="w-20 text-xs text-right mr-2">Cidade:</span>
                    <div className="w-full bg-base-200 dark:bg-dark-100 rounded-full h-4">
                        <div className={`h-4 rounded-full ${isAboveAverage ? 'bg-primary' : 'bg-tertiary'}`} style={{ width: `${Math.min(100, (cityValue / (Math.max(cityValue, stateValue) * 1.2)) * 100)}%` }}></div>
                    </div>
                    <span className="w-24 text-xs ml-2 font-bold">{formatFn(cityValue)}</span>
                </div>
                 <div className="flex items-center">
                    <span className="w-20 text-xs text-right mr-2">Média MT:</span>
                    <div className="w-full bg-base-200 dark:bg-dark-100 rounded-full h-4">
                        <div className="bg-gray-400 h-4 rounded-full" style={{ width: `${Math.min(100, (stateValue / (Math.max(cityValue, stateValue) * 1.2)) * 100)}%` }}></div>
                    </div>
                    <span className="w-24 text-xs ml-2">{formatFn(stateValue)}</span>
                </div>
            </div>
        </div>
    );
};


const CityDetails: React.FC<{ city: City }> = ({ city }) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const { cities, updateCity, isUpdating, plans, addPlanForCity, addCityToIntelligence } = useContext(DataContext);
  const navigate = useNavigate();
  
  const financialProjections = getFinancialProjections(city);
  const marketPotential = getMarketPotential(city);
  const stateAverages = calculateStateAverages(cities);

  const planExists = plans.some(p => p.cityId === city.id);

  const handleAddPlan = () => {
    addPlanForCity(city.id);
    navigate('/planejamento');
  }

  const handleAddToIntelligence = () => {
    addCityToIntelligence(city.id);
    navigate(`/inteligencia/${city.id}`);
  }

  const handleResetZoom = () => {
    if (chartRef.current) {
        chartRef.current.resetZoom();
    }
  };

  const scenarioDetails: { [key: string]: { color: string; percentage: number } } = {
    'Muito Baixa': { color: 'bg-gray-800 dark:bg-gray-300', percentage: PENETRATION_SCENARIOS['Muito Baixa'] * 100 },
    'Baixa': { color: 'bg-red-500', percentage: PENETRATION_SCENARIOS['Baixa'] * 100 },
    'Média': { color: 'bg-yellow-500', percentage: PENETRATION_SCENARIOS['Média'] * 100 },
    'Alta': { color: 'bg-primary', percentage: PENETRATION_SCENARIOS['Alta'] * 100 },
    'Muito Alta': { color: 'bg-secondary', percentage: PENETRATION_SCENARIOS['Muito Alta'] * 100 },
  };

  const growthRoadmapMuitoBaixa = getGrowthRoadmap(city, PENETRATION_SCENARIOS['Muito Baixa']);
  const growthRoadmapMedia = getGrowthRoadmap(city, PENETRATION_SCENARIOS['Média']);
  const growthRoadmapMuitoAlta = getGrowthRoadmap(city, PENETRATION_SCENARIOS['Muito Alta']);

  const growthChartData = {
    labels: growthRoadmapMedia.map(d => `Mês ${d.month}`),
    datasets: [
      {
        label: 'Meta - Muito Alta (20%)',
        data: growthRoadmapMuitoAlta.map(d => d.rides),
        borderColor: '#1f2937', // black
        backgroundColor: 'rgba(31, 41, 55, 0.1)',
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Meta - Média (10%)',
        data: growthRoadmapMedia.map(d => d.rides),
        borderColor: '#3b82f6', // blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Meta - Muito Baixa (2%)',
        data: growthRoadmapMuitoBaixa.map(d => d.rides),
        borderColor: '#f59e0b', // yellow/amber
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: false,
        tension: 0.3,
      },
    ],
  };

  const growthChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      zoom: {
        pan: {
          enabled: true,
          mode: 'xy' as const,
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'xy' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value: string | number) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(Number(value)) },
        title: { display: true, text: 'Corridas Estimadas' }
      }
    },
  };

  return (
    <div className="space-y-6">
       <div>
        <h3 className="font-bold text-lg mb-3">Informações Gerais (IBGE)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-base-200 dark:bg-dark-100 p-4 rounded-lg">
            <div>
                <p className="text-gray-500 dark:text-gray-400">Código do Município</p>
                <p className="font-semibold">{city.id}</p>
            </div>
            <div>
                <p className="text-gray-500 dark:text-gray-400">Gentílico</p>
                <p className="font-semibold">{city.gentilic}</p>
            </div>
            <div>
                <p className="text-gray-500 dark:text-gray-400">Aniversário</p>
                <p className="font-semibold">{city.anniversary}</p>
            </div>
            <div>
                <p className="text-gray-500 dark:text-gray-400">Prefeito(a) Atual</p>
                <p className="font-semibold">{city.mayor}</p>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard icon={<FiUsers className="w-6 h-6"/>} title="População Total" value={city.population.toLocaleString('pt-BR')} tooltipText="População total do município, de acordo com o Censo 2022 do IBGE." />
        <KpiCard icon={<FiUsers className="w-6 h-6"/>} title="População Alvo (15-44)" value={city.population15to44.toLocaleString('pt-BR')} tooltipText="Público-alvo principal para o serviço, com base na faixa etária economicamente ativa." />
        <KpiCard icon={<FiGrid className="w-6 h-6"/>} title="% de Urbanização" value={`${(city.urbanizationIndex * 100).toFixed(0)}%`} tooltipText="Porcentagem da população que vive em áreas urbanas, indicando a concentração de potenciais usuários." />
        <KpiCard icon={<FiMaximize className="w-6 h-6"/>} title="Área Urbanizada" value={`${city.urbanizedAreaKm2?.toLocaleString('pt-BR') || 'N/D'} km²`} tooltipText="Extensão da mancha urbana da cidade, útil para estimar a complexidade logística e a área de cobertura." />
        <KpiCard icon={<FiDollarSign className="w-6 h-6"/>} title="Salário Médio (Formal)" value={city.averageFormalSalary.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} tooltipText="Salário médio mensal dos trabalhadores com carteira assinada, um forte indicador do poder de compra." />
        <KpiCard icon={<FiDollarSign className="w-6 h-6"/>} title="Renda Per Capita (Mensal Est.)" value={city.averageIncome.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} tooltipText="Estimativa mensal da renda per capita baseada no PIB per capita municipal dividido por 12." />
      </div>

       <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">Projeções de Receita Mensal</h3>
                <InfoTooltip text="Receita mensal estimada com base em diferentes cenários de penetração de mercado (de 2% a 20%) sobre a população alvo."/>
            </div>
            <div className="bg-base-200 dark:bg-dark-100 p-4 rounded-lg">
                <ul className="space-y-2">
                    {financialProjections.map((proj, index) => {
                        const details = scenarioDetails[proj.scenario as keyof typeof scenarioDetails];
                        const correspondingRides = marketPotential[index]?.rides || 0;
                        return (
                            <li key={index} className="flex justify-between items-center text-sm p-2 rounded-md even:bg-base-100 dark:even:bg-dark-200">
                                <div className="flex items-center">
                                    <span className={`w-3 h-3 rounded-full mr-3 ${details?.color || 'bg-gray-400'}`}></span>
                                    <span className="text-gray-600 dark:text-gray-300 w-32">
                                        ({details?.percentage}%) {proj.scenario}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-base">{proj.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">{Math.round(correspondingRides).toLocaleString('pt-BR')} corridas/mês</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
      </div>

       <div>
            <h3 className="font-bold text-lg mb-3">Análise Comparativa (vs. Média do Estado)</h3>
            <div className="space-y-4 bg-base-200 dark:bg-dark-100 p-4 rounded-lg">
                <ComparisonBar 
                    label="População Total"
                    cityValue={city.population}
                    stateValue={stateAverages.averagePopulation}
                    formatFn={(val) => val.toLocaleString('pt-BR')}
                />
                <ComparisonBar 
                    label="Renda Média Familiar / Per Capita (Est.)"
                    cityValue={city.averageIncome}
                    stateValue={stateAverages.averageIncome}
                    formatFn={(val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                />
                 <ComparisonBar 
                    label="População Alvo (15-44)"
                    cityValue={city.population15to44}
                    stateValue={stateAverages.averagePopulation15to44}
                    formatFn={(val) => val.toLocaleString('pt-BR')}
                />
            </div>
        </div>

      <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Projeção de Crescimento (6 Meses)</h3>
            <div className="flex items-center space-x-2">
              <button onClick={handleResetZoom} className="p-1 rounded-full hover:bg-base-200 dark:hover:bg-dark-100" title="Resetar Zoom">
                  <FiRefreshCw className="h-4 w-4 text-gray-500" />
              </button>
              <InfoTooltip text="Projeção de crescimento de corridas para os primeiros 6 meses. Use a roda do mouse para dar zoom e clique e arraste para mover o gráfico."/>
            </div>
        </div>
        <div className="h-56">
          <Line ref={chartRef} options={growthChartOptions} data={growthChartData} />
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-3">Ações Rápidas</h3>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleAddPlan}
            disabled={planExists}
            className="flex items-center bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FiPlusCircle className="mr-2"/>
            {planExists ? 'Plano já Adicionado' : 'Adicionar ao Planejamento'}
          </button>
          <button
            onClick={handleAddToIntelligence}
            className="flex items-center bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
          >
            <FiBriefcase className="mr-2"/>
            Inteligência de Mercado
          </button>
          <button
            onClick={() => updateCity(city.id)}
            disabled={isUpdating === city.id}
            className="flex items-center bg-secondary text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-wait"
            >
            {isUpdating === city.id ? (
                <Spinner className="w-5 h-5 mr-2" />
            ) : (
                <FiRefreshCw className="mr-2 h-5 w-5" />
            )}
            {isUpdating === city.id ? 'Atualizando...' : 'Atualizar Dados'}
            </button>
          <button className="flex items-center bg-tertiary text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition"><FiMessageSquare className="mr-2"/>Análise com IA</button>
        </div>
      </div>

      <div className="text-center pt-4 border-t border-base-200 dark:border-dark-100">
        <a 
            href={`https://cidades.ibge.gov.br/brasil/mt/${slugify(city.name)}/panorama`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-primary hover:text-primary-600 font-semibold text-sm"
        >
            Ver dados completos no IBGE Cidades <FiExternalLink className="ml-2 h-4 w-4" />
        </a>
      </div>
    </div>
  );
};

export default CityDetails;

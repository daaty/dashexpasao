
import React, { useContext, useRef } from 'react';
import { City, CityStatus } from '../types';
import { getFinancialProjections, getGrowthRoadmap, calculateStateAverages, getMarketPotential } from '../services/calculationService';
import { Line } from 'react-chartjs-2';
import type { Chart as ChartJS } from 'chart.js';
import { FiExternalLink, FiUsers, FiDollarSign, FiPlusCircle, FiMessageSquare, FiGrid, FiMaximize, FiRefreshCw, FiBriefcase, FiHash, FiFlag, FiCalendar, FiAward } from 'react-icons/fi';
import { slugify } from '../utils/textUtils';
import InfoTooltip from './ui/InfoTooltip';
import { DataContext } from '../context/DataContext';
import { PENETRATION_SCENARIOS } from '../constants';
import Spinner from './ui/Spinner';
import { useNavigate } from 'react-router-dom';

const KpiCard = ({ icon, title, value, tooltipText }: { icon: React.ReactElement, title: string, value: string, tooltipText: string }) => (
    <div 
        className="p-3 rounded-lg flex items-center space-x-3 shadow-sm transition-colors relative min-h-[80px]"
        style={{
            backgroundColor: 'rgb(0 0 0 / 30%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgb(255 255 255 / 10%)'
        }}
    >
        <div className="absolute top-2 right-2">
            <InfoTooltip text={tooltipText} />
        </div>
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
             {React.cloneElement(icon, { className: "w-5 h-5" })}
        </div>
        <div className="pr-4">
            <p className="text-[10px] font-bold uppercase tracking-wider leading-tight mb-0.5" style={{ color: 'rgb(255 255 255 / 70%)' }}>{title}</p>
            <p className="text-lg font-bold leading-none" style={{ color: '#ffffff' }}>{value}</p>
        </div>
    </div>
);

const ComparisonBar = ({ label, cityValue, stateValue, formatFn }: { label: string, cityValue: number, stateValue: number, formatFn: (val: number) => string }) => {
    const difference = cityValue - stateValue;
    const isAboveAverage = difference >= 0;
    const percentageDiff = stateValue > 0 ? (Math.abs(difference) / stateValue) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold" style={{ color: 'rgb(255 255 255 / 80%)' }}>{label}</span>
                <span className="text-xs font-bold" style={{ color: isAboveAverage ? '#08a50e' : '#ffc107' }}>
                    {isAboveAverage ? '▲' : '▼'} {percentageDiff.toFixed(1)}% {isAboveAverage ? 'acima da' : 'abaixo da'} média
                </span>
            </div>
            <div className="space-y-1">
                 <div className="flex items-center">
                    <span className="w-20 text-xs text-right mr-2" style={{ color: 'rgb(255 255 255 / 70%)' }}>Cidade:</span>
                    <div className="w-full rounded-full h-4" style={{ backgroundColor: 'rgb(255 255 255 / 20%)' }}>
                        <div className="h-4 rounded-full" style={{ width: `${Math.min(100, (cityValue / (Math.max(cityValue, stateValue) * 1.2)) * 100)}%`, backgroundColor: isAboveAverage ? '#3b82f6' : '#ffc107' }}></div>
                    </div>
                    <span className="w-24 text-xs ml-2 font-bold" style={{ color: '#ffffff' }}>{formatFn(cityValue)}</span>
                </div>
                 <div className="flex items-center">
                    <span className="w-20 text-xs text-right mr-2" style={{ color: 'rgb(255 255 255 / 70%)' }}>Média MT:</span>
                    <div className="w-full rounded-full h-4" style={{ backgroundColor: 'rgb(255 255 255 / 20%)' }}>
                        <div className="h-4 rounded-full" style={{ width: `${Math.min(100, (stateValue / (Math.max(cityValue, stateValue) * 1.2)) * 100)}%`, backgroundColor: 'rgb(255 255 255 / 50%)' }}></div>
                    </div>
                    <span className="w-24 text-xs ml-2" style={{ color: 'rgb(255 255 255 / 80%)' }}>{formatFn(stateValue)}</span>
                </div>
            </div>
        </div>
    );
};


const InfoItem = ({ icon, label, value }: { icon: React.ReactElement, label: string, value: string | number }) => (
    <div 
        className="flex items-center space-x-3 p-3 rounded-lg shadow-sm transition-colors"
        style={{
            backgroundColor: 'rgb(0 0 0 / 30%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgb(255 255 255 / 10%)'
        }}
    >
        <div className="p-2 rounded-lg text-xl flex-shrink-0" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate" style={{ color: 'rgb(255 255 255 / 70%)' }}>{label}</p>
            <p className="font-bold text-sm truncate" style={{ color: '#ffffff' }} title={String(value)}>{value}</p>
        </div>
    </div>
);

const CityDetails: React.FC<{ city: City }> = ({ city }) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
// ... existing code ...
  const { cities, updateCity, isUpdating, plans, addPlanForCity, addCityToIntelligence } = useContext(DataContext);
  const navigate = useNavigate();
  
  const financialProjections = getFinancialProjections(city);
  const marketPotential = getMarketPotential(city);
  const stateAverages = calculateStateAverages(cities);

  const planExists = plans.some(p => p.cityId === city.id);
  // Permitir adicionar se não tem plano OU se tem plano mas status não é Planning
  const canAddPlan = !planExists || (planExists && city.status !== CityStatus.Planning);

  const handleAddPlan = () => {
    addPlanForCity(city.id);
    navigate('/planejamento');
  }

  const handleAddToIntelligence = () => {
    addCityToIntelligence(city.id);
    navigate(`/inteligencia/${city.id}`);
  }

  const scenarioDetails: { [key: string]: { color: string; percentage: number } } = {
    'Muito Baixa': { color: 'bg-gray-800', percentage: PENETRATION_SCENARIOS['Muito Baixa'] * 100 },
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
      legend: { 
        display: true, 
        position: 'top' as const,
        labels: { color: '#374151' }
      },
    },
    scales: {
      x: {
        ticks: { color: '#4B5563' },
        grid: { color: '#E5E7EB' }
      },
      y: {
        beginAtZero: true,
        ticks: { 
          color: '#4B5563',
          callback: (value: string | number) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(Number(value)) 
        },
        grid: { color: '#E5E7EB' },
        title: { display: true, text: 'Corridas Estimadas', color: '#111827' }
      }
    },
  };

  return (
    <div className="space-y-6">
       <div>
        <h3 className="font-bold text-lg mb-3 flex items-center">
            Informações Gerais (IBGE)
            <a 
                href={`https://cidades.ibge.gov.br/brasil/mt/${slugify(city.name)}/panorama`} 
                target="_blank" 
                rel="noreferrer"
                className="ml-2 text-primary hover:text-primary-focus transition-colors"
                title="Ver no IBGE Cidades"
            >
                <FiExternalLink className="w-4 h-4" />
            </a>
        </h3>
        <div 
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg"
            style={{
                backgroundColor: 'rgb(0 0 0 / 30%)',
                border: '1px solid rgb(255 255 255 / 10%)'
            }}
        >
            <InfoItem 
                icon={<FiHash />} 
                label="Código Município" 
                value={city.id} 
            />
            <InfoItem 
                icon={<FiFlag />} 
                label="Gentílico" 
                value={city.gentilic} 
            />
            <InfoItem 
                icon={<FiCalendar />} 
                label="Aniversário" 
                value={city.anniversary} 
            />
            <InfoItem 
                icon={<FiAward />} 
                label="Prefeito(a)" 
                value={city.mayor} 
            />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <KpiCard icon={<FiUsers />} title="População Total" value={city.population.toLocaleString('pt-BR')} tooltipText="População total do município, de acordo com o Censo 2022 do IBGE." />
        <KpiCard icon={<FiUsers />} title="População Alvo (15-44)" value={city.population15to44.toLocaleString('pt-BR')} tooltipText="Público-alvo principal para o serviço, com base na faixa etária economicamente ativa." />
        <KpiCard icon={<FiGrid />} title="% de Urbanização" value={`${(city.urbanizationIndex * 100).toFixed(0)}%`} tooltipText="Porcentagem da população que vive em áreas urbanas, indicando a concentração de potenciais usuários." />
        <KpiCard icon={<FiMaximize />} title="Área Urbanizada" value={`${city.urbanizedAreaKm2?.toLocaleString('pt-BR') || 'N/D'} km²`} tooltipText="Extensão da mancha urbana da cidade, útil para estimar a complexidade logística e a área de cobertura." />
        <KpiCard icon={<FiDollarSign />} title="Salário Médio (Formal)" value={city.averageFormalSalary.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} tooltipText="Salário médio mensal dos trabalhadores com carteira assinada, um forte indicador do poder de compra." />
        <KpiCard icon={<FiDollarSign />} title="Renda Per Capita (Est.)" value={city.averageIncome.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} tooltipText="Estimativa mensal da renda per capita baseada no PIB per capita municipal dividido por 12." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
       <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">Projeções de Receita</h3>
                <InfoTooltip text="Receita mensal estimada com base em diferentes cenários de penetração de mercado (de 2% a 20%) sobre a população alvo."/>
            </div>
            <div 
                className="p-4 rounded-lg flex-grow"
                style={{
                    backgroundColor: 'rgb(0 0 0 / 30%)',
                    border: '1px solid rgb(255 255 255 / 10%)'
                }}
            >
                <ul className="space-y-2">
                    {financialProjections.map((proj, index) => {
                        const details = scenarioDetails[proj.scenario as keyof typeof scenarioDetails];
                        const correspondingRides = marketPotential[index]?.rides || 0;
                        return (
                            <li 
                                key={index} 
                                className="flex justify-between items-center text-sm p-2 rounded-md"
                                style={{ backgroundColor: index % 2 === 0 ? 'transparent' : 'rgb(255 255 255 / 5%)' }}
                            >
                                <div className="flex items-center">
                                    <span className={`w-3 h-3 rounded-full mr-3 ${details?.color || 'bg-gray-400'}`}></span>
                                    <span className="w-32" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                                        ({details?.percentage}%) {proj.scenario}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-base" style={{ color: '#ffffff' }}>{proj.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    <span className="text-xs block" style={{ color: 'rgb(255 255 255 / 70%)' }}>{Math.round(correspondingRides).toLocaleString('pt-BR')} corridas/mês</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
      </div>

       <div className="h-full flex flex-col">
            <h3 className="font-bold text-lg mb-3" style={{ color: '#ffffff' }}>Comparativo (vs. Estado)</h3>
            <div 
                className="space-y-4 p-4 rounded-lg flex-grow"
                style={{
                    backgroundColor: 'rgb(0 0 0 / 30%)',
                    border: '1px solid rgb(255 255 255 / 10%)'
                }}
            >
                <ComparisonBar 
                    label="População Total"
                    cityValue={city.population}
                    stateValue={stateAverages.averagePopulation}
                    formatFn={(val) => val.toLocaleString('pt-BR')}
                />
                <ComparisonBar 
                    label="Renda Média Familiar"
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
      </div>

      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg" style={{ color: '#ffffff' }}>Crescimento (6 Meses)</h3>
            <div className="flex items-center space-x-2">
              <InfoTooltip text="Projeção de crescimento de corridas para os primeiros 6 meses."/>
            </div>
        </div>
        <div 
            className="h-64 p-4 rounded-lg"
            style={{
                backgroundColor: 'rgb(0 0 0 / 30%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgb(255 255 255 / 10%)'
            }}
        >
          <Line ref={chartRef} options={growthChartOptions} data={growthChartData} />
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-3">Ações Rápidas</h3>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleAddPlan}
            disabled={!canAddPlan}
            className="flex items-center py-2 px-4 rounded-lg transition disabled:cursor-not-allowed"
            style={{
                backgroundColor: !canAddPlan ? 'rgb(255 255 255 / 20%)' : '#3b82f6',
                color: '#ffffff'
            }}
          >
            <FiPlusCircle className="mr-2"/>
            {!canAddPlan ? 'Plano já Adicionado' : 'Adicionar ao Planejamento'}
          </button>
          <button
            onClick={handleAddToIntelligence}
            className="flex items-center py-2 px-4 rounded-lg hover:shadow-lg hover:scale-105 transition-all"
            style={{
                background: 'linear-gradient(to right, #6f42c1, #3b82f6)',
                color: '#ffffff'
            }}
          >
            <FiBriefcase className="mr-2"/>
            Inteligência de Mercado
          </button>
          <button
            onClick={() => updateCity(city.id)}
            disabled={isUpdating === city.id}
            className="flex items-center py-2 px-4 rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-wait disabled:hover:scale-100"
            style={{
                background: 'linear-gradient(to right, #3b82f6, #17a2b8)',
                color: '#ffffff'
            }}
            >
            {isUpdating === city.id ? (
                <Spinner className="w-5 h-5 mr-2" />
            ) : (
                <FiRefreshCw className="mr-2 h-5 w-5" />
            )}
            {isUpdating === city.id ? 'Atualizando...' : 'Atualizar Dados'}
            </button>
          <button 
            className="flex items-center py-2 px-4 rounded-lg hover:shadow-lg hover:scale-105 transition-all"
            style={{
                background: 'linear-gradient(to right, #ffc107, #f62718)',
                color: '#ffffff'
            }}
          >
            <FiMessageSquare className="mr-2"/>Análise com IA
          </button>
        </div>
      </div>

      <div className="text-center pt-4" style={{ borderTop: '1px solid rgb(255 255 255 / 10%)' }}>
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

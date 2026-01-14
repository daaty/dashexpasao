
import React, { useContext, useMemo } from 'react';
import { City, CityStatus, CityPlan } from '../types';
import { DataContext } from '../context/DataContext';
import Card from '../components/ui/Card';
import { FiList } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const getPhaseProgress = (plan: CityPlan, phaseName: string) => {
    const phase = plan.phases.find(p => p.name === phaseName);
    if (!phase || phase.actions.length === 0) return { progress: 0, completionDate: null };
    const completedCount = phase.actions.filter(a => a.completed).length;
    return {
        progress: (completedCount / phase.actions.length) * 100,
        completionDate: phase.completionDate,
    };
};

const PlanningProgressBar: React.FC<{ plan: CityPlan }> = ({ plan }) => {
    const { progress: analysisProgress, completionDate: analysisDate } = getPhaseProgress(plan, 'Análise & Viabilidade');
    const { progress: prepProgress } = getPhaseProgress(plan, 'Preparação Operacional');

    return (
        <div className="w-full bg-base-300 rounded-full h-4 dark:bg-dark-200 mt-2 flex relative text-white text-[10px] items-center overflow-hidden font-bold">
            <div className="bg-green-500 h-full flex items-center justify-center" style={{ width: `${analysisProgress / 2}%` }} title={`Análise & Viabilidade: ${analysisProgress.toFixed(0)}%`}>
                {analysisProgress > 25 && `${analysisProgress.toFixed(0)}%`}
            </div>
            <div className="bg-blue-500 h-full flex items-center justify-center" style={{ width: `${prepProgress / 2}%` }} title={`Preparação Operacional: ${prepProgress.toFixed(0)}%`}>
                {prepProgress > 25 && `${prepProgress.toFixed(0)}%`}
            </div>
             {analysisDate && (
                <div className="absolute h-full w-0.5 bg-white/70 top-0 shadow-lg" style={{ left: `50%` }} title={`Análise concluída em: ${new Date(analysisDate).toLocaleDateString('pt-BR')}`}></div>
            )}
        </div>
    );
};

const ImplementationProgressBar: React.FC<{ plan: CityPlan, city: City }> = ({ plan, city }) => {
    const { progress: driversProgress } = getPhaseProgress(plan, 'Aquisição de Motoristas');
    const { progress: marketingProgress } = getPhaseProgress(plan, 'Marketing & Lançamento');
    const { progress: passengersProgress } = getPhaseProgress(plan, 'Aquisição de Passageiros');
    const { progress: optimizationProgress } = getPhaseProgress(plan, 'Pós-Lançamento & Otimização');

    const differenceInMonths = (dateLeft: Date, dateRight: Date) => {
        let diff = (dateLeft.getFullYear() - dateRight.getFullYear()) * 12;
        diff -= dateRight.getMonth();
        diff += dateLeft.getMonth();
        return diff <= 0 ? 0 : diff;
    }

    const monthsSinceStart = city.implementationStartDate ? differenceInMonths(new Date(), new Date(city.implementationStartDate)) : 0;

    const phases = [
        { progress: driversProgress, color: 'bg-blue-500', title: `Aquisição de Motoristas: ${driversProgress.toFixed(0)}%` },
        { progress: marketingProgress, color: 'bg-sky-500', title: `Marketing & Lançamento: ${marketingProgress.toFixed(0)}%` },
        { progress: passengersProgress, color: 'bg-green-500', title: `Aquisição de Passageiros: ${passengersProgress.toFixed(0)}%` },
        { progress: optimizationProgress, color: 'bg-teal-500', title: `Otimização: ${optimizationProgress.toFixed(0)}%` },
    ];

    return (
        <>
            <div className="text-right text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">
                Mês {Math.min(monthsSinceStart + 1, 6)} de 6
            </div>
            <div className="w-full bg-base-300 rounded-full h-4 dark:bg-dark-200 mt-1 flex overflow-hidden">
                {phases.map((phase, index) => (
                    <div key={index} className={`${phase.color} h-full`} style={{ width: `${phase.progress / 4}%` }} title={phase.title}></div>
                ))}
            </div>
        </>
    );
};

const Planning: React.FC = () => {
  const { cities, plans } = useContext(DataContext);
  const navigate = useNavigate();

  const getCitiesByStatus = (status: CityStatus) => {
    return cities
      .filter(city => city.status === status && plans.some(p => p.cityId === city.id))
      .sort((a, b) => {
        const planA = plans.find(p => p.cityId === a.id);
        const planB = plans.find(p => p.cityId === b.id);
        if (!planA || !planB) return 0;
        return new Date(planA.startDate).getTime() - new Date(planB.startDate).getTime()
      });
  };

  const planningCities = useMemo(() => getCitiesByStatus(CityStatus.Planning), [plans, cities]);
  const implementingCities = useMemo(() => getCitiesByStatus(CityStatus.Expansion), [plans, cities]);
  const consolidatedCities = useMemo(() => getCitiesByStatus(CityStatus.Consolidated), [plans, cities]);
  
  const renderCityListItem = (city: City) => {
    const cityPlan = plans.find(p => p.cityId === city.id);
    if (!cityPlan) return null;
    
    return (
      <div key={city.id} className="p-3 rounded-lg hover:bg-base-200 dark:hover:bg-dark-100 transition-colors">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => navigate(`/planejamento/${city.id}`)}
        >
          <div className="flex-grow">
            <p className="font-semibold text-lg">{city.name}</p>
            {city.status === CityStatus.Planning && <PlanningProgressBar plan={cityPlan} />}
            {city.status === CityStatus.Expansion && <ImplementationProgressBar plan={cityPlan} city={city} />}
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-sm font-medium">
              {new Date(cityPlan.startDate + '-02').toLocaleString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '').toUpperCase()}
            </p>
            <p className="text-xs text-gray-500">Início</p>
          </div>
        </div>
      </div>
    );
  };

  const renderCityList = (
    cityList: City[],
    emptyMessage: string
  ) => (
    <div className="space-y-2">
      {cityList.length > 0 ? (
        cityList.map(renderCityListItem)
      ) : (
        <div className="text-center text-gray-500 p-4 space-y-2">
            <FiList size={32} className="mx-auto opacity-30"/>
            <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">Visão Geral do Planejamento</h2>
      </div>

      <Card
        title="Cidades em Planejamento"
        tooltipText="Cidades na fase de planejamento. A barra mostra o progresso das fases de Análise (verde) e Preparação (azul). Ao completar 100%, a cidade é movida para Implementação."
      >
        {renderCityList(planningCities, "Nenhuma cidade em planejamento.")}
      </Card>
      
      <Card
        title="Cidades em Implementação"
        tooltipText="Cidades em expansão. A barra mostra o progresso das fases de Aquisição e Marketing. Após 6 meses, a cidade é movida para Consolidadas."
      >
        {renderCityList(implementingCities, "Nenhuma cidade em implementação.")}
      </Card>

      <Card
        title="Cidades Consolidadas"
        tooltipText="Cidades com operação estabelecida. Clique para revisar o plano executado."
      >
        {renderCityList(consolidatedCities, "Nenhuma cidade consolidada com plano ativo.")}
      </Card>
    </div>
  );
};

export default Planning;

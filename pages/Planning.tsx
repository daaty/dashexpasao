
import React, { useContext, useMemo } from 'react';
import { City, CityStatus, CityPlan } from '../types';
import { DataContext } from '../context/DataContext';
import Card from '../components/ui/Card';
import { FiList } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import CityRidesInline from '../components/CityRidesInline';

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
        <div 
            className="w-full rounded-full h-4 mt-2 flex relative text-[10px] items-center overflow-hidden font-bold shadow-inner"
            style={{ backgroundColor: 'rgb(255 255 255 / 15%)', color: '#ffffff' }}
        >
            <div 
                className="h-full flex items-center justify-center transition-all duration-500" 
                style={{ width: `${analysisProgress / 2}%`, backgroundColor: '#08a50e' }} 
                title={`Análise & Viabilidade: ${analysisProgress.toFixed(0)}%`}
            >
                {analysisProgress > 25 && `${analysisProgress.toFixed(0)}%`}
            </div>
            <div 
                className="h-full flex items-center justify-center transition-all duration-500" 
                style={{ width: `${prepProgress / 2}%`, backgroundColor: '#3b82f6' }} 
                title={`Preparação Operacional: ${prepProgress.toFixed(0)}%`}
            >
                {prepProgress > 25 && `${prepProgress.toFixed(0)}%`}
            </div>
             {analysisDate && (
                <div 
                    className="absolute h-full w-0.5 top-0 shadow-lg" 
                    style={{ left: `50%`, backgroundColor: 'rgb(255 255 255 / 70%)' }} 
                    title={`Análise concluída em: ${new Date(analysisDate).toLocaleDateString('pt-BR')}`}
                ></div>
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

    const monthsSinceStart = city.implementationStartDate ? (() => {
        const parts = city.implementationStartDate.split('-').map(Number);
        const year = parts[0];
        const month = parts[1];
        const day = parts[2] || 1; // Se não tiver dia, usar 1º do mês
        const impDate = new Date(year, month - 1, day);
        return differenceInMonths(new Date(), impDate);
    })() : 0;
    
    const totalProgress = (driversProgress + marketingProgress + passengersProgress + optimizationProgress) / 4;

    return (
        <>
            <div className="flex justify-between items-end mt-1">
                 <div className="text-xs font-bold" style={{ color: '#ffffff' }}>
                    Progresso: {totalProgress.toFixed(0)}%
                 </div>
                 <div className="text-xs font-bold" style={{ color: 'rgb(255 255 255 / 70%)' }}>
                    Mês {Math.min(monthsSinceStart + 1, 6)} de 6
                </div>
            </div>
            <div 
                className="w-full rounded-full h-4 mt-1 overflow-hidden shadow-inner"
                style={{ backgroundColor: 'rgb(255 255 255 / 15%)' }}
            >
                <div 
                    className="h-full transition-all duration-500 rounded-full" 
                    style={{ 
                        width: `${totalProgress}%`,
                        background: 'linear-gradient(to right, #ffc107, #3b82f6)'
                    }} 
                    title={`Progresso Total: ${totalProgress.toFixed(0)}%`}
                ></div>
            </div>
        </>
    );
};

const Planning: React.FC = () => {
  const { cities, plans, marketBlocks } = useContext(DataContext);
  const navigate = useNavigate();

  const isPlanningComplete = (cityId: string) => {
    const plan = plans.find(p => p.cityId === cityId);
    if (!plan) return false;
    
    const analysis = getPhaseProgress(plan, 'Análise & Viabilidade');
    const prep = getPhaseProgress(plan, 'Preparação Operacional');

    return analysis.progress >= 100 && prep.progress >= 100;
  };

  const sortCitiesByDate = (a: City, b: City) => {
    const planA = plans.find(p => p.cityId === a.id);
    const planB = plans.find(p => p.cityId === b.id);
    if (!planA || !planB) return 0;
    return new Date(planA.startDate).getTime() - new Date(planB.startDate).getTime()
  };

  const getCitiesByStatus = (status: CityStatus) => {
    return cities
      .filter(city => city.status === status && plans.some(p => p.cityId === city.id))
      .sort(sortCitiesByDate);
  };

  const planningCities = useMemo(() => {
    return cities.filter(city => {
        const hasPlan = plans.some(p => p.cityId === city.id);
        // Only include in Planning list if status is Planning AND not effectively complete
        return hasPlan && city.status === CityStatus.Planning && !isPlanningComplete(city.id);
    }).sort(sortCitiesByDate);
  }, [plans, cities]);

  const implementingCities = useMemo(() => {
    return cities.filter(city => {
        const hasPlan = plans.some(p => p.cityId === city.id);
        const isExpansion = city.status === CityStatus.Expansion;
        // Include if explicitly Expansion OR (Planning status but effectively complete)
        const isPlanningDone = city.status === CityStatus.Planning && isPlanningComplete(city.id);
        return hasPlan && (isExpansion || isPlanningDone);
    }).sort(sortCitiesByDate);
  }, [plans, cities]);

  const consolidatedCities = useMemo(() => getCitiesByStatus(CityStatus.Consolidated), [plans, cities]);
  
  const renderCityListItem = (city: City) => {
    const cityPlan = plans.find(p => p.cityId === city.id);
    if (!cityPlan) return null;
    
    const isPlanningDone = isPlanningComplete(city.id);
    const effectiveStatus = (city.status === CityStatus.Expansion || isPlanningDone) 
        ? CityStatus.Expansion 
        : CityStatus.Planning;

    // Use actual phase start date if available, otherwise fallback to plan general date
    // Para cidades em expansão, usar a data de implementação salva
    let startDate: Date;
    if (effectiveStatus === CityStatus.Expansion && city.implementationStartDate) {
        const parts = city.implementationStartDate.split('-').map(Number);
        const year = parts[0];
        const month = parts[1];
        const day = parts[2] || 1;
        startDate = new Date(year, month - 1, day);
    } else {
        const analysisPhase = cityPlan.phases.find(p => p.name === 'Análise & Viabilidade');
        startDate = analysisPhase?.startDate 
            ? new Date(analysisPhase.startDate) 
            : new Date(cityPlan.startDate + '-02');
    }

    const block = marketBlocks.find(b => b.cityIds.includes(city.id));

    return (
      <div 
        key={city.id} 
        className="p-3 rounded-lg transition-colors cursor-pointer"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(255 255 255 / 10%)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div 
          className="flex flex-col gap-2"
          onClick={() => navigate(`/planejamento/${city.id}`)}
        >
          <div className="flex justify-between items-center">
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-lg" style={{ color: '#ffffff' }}>{city.name}</p>
                {block && (
                  <span 
                    className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: '#17a2b8',
                      backgroundColor: 'rgba(23, 162, 184, 0.1)',
                      border: '1px solid rgba(23, 162, 184, 0.3)'
                    }}
                  >
                    {block.name}
                  </span>
                )}
              </div>
              {effectiveStatus === CityStatus.Planning && <PlanningProgressBar plan={cityPlan} />}
              {effectiveStatus === CityStatus.Expansion && <ImplementationProgressBar plan={cityPlan} city={city} />}
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-sm font-medium" style={{ color: '#ffffff' }}>
                {startDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '').toUpperCase()}
              </p>
              <p className="text-xs" style={{ color: 'rgb(255 255 255 / 60%)' }}>Início</p>
            </div>
          </div>
          
          {/* Dados Reais de Corridas */}
          <CityRidesInline cityName={city.name} className="pl-1 border-l-2 border-green-500/30" />
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
        <div className="text-center p-4 space-y-2" style={{ color: 'rgb(255 255 255 / 60%)' }}>
            <FiList size={32} className="mx-auto opacity-30"/>
            <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold" style={{ color: '#ffffff' }}>Visão Geral do Planejamento</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Cidades em Planejamento"
          className="h-full"
          style={{ borderLeft: '4px solid #3b82f6' }}
          tooltipText="Cidades na fase de planejamento. A barra mostra o progresso das fases de Análise (verde) e Preparação (azul). Ao completar 100%, a cidade é movida para Implementação."
        >
          {renderCityList(planningCities, "Nenhuma cidade em planejamento.")}
        </Card>
        
        <Card
          title="Cidades em Implementação"
          className="h-full"
          style={{ borderLeft: '4px solid #ffc107' }}
          tooltipText="Cidades em expansão. A barra mostra o progresso das fases de Aquisição e Marketing. Após 6 meses, a cidade é movida para Consolidadas."
        >
          {renderCityList(implementingCities, "Nenhuma cidade em implementação.")}
        </Card>

        <Card
          title="Cidades Consolidadas"
          className="h-full"
          style={{ borderLeft: '4px solid #08a50e' }}
          tooltipText="Cidades com operação estabelecida. Clique para revisar o plano executado."
        >
          {renderCityList(consolidatedCities, "Nenhuma cidade consolidada com plano ativo.")}
        </Card>
      </div>
    </div>
  );
};

export default Planning;

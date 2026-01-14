
import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { FiArrowLeft, FiClipboard, FiPlusCircle, FiChevronDown, FiChevronUp, FiEdit, FiTrash2, FiCheckSquare, FiSquare, FiSave, FiCalendar, FiClock, FiX, FiUsers, FiDollarSign, FiRefreshCw, FiLink, FiExternalLink, FiTrendingUp, FiTrendingDown, FiActivity, FiTarget, FiTag, FiUser, FiZap, FiAlertCircle } from 'react-icons/fi';
import { getFinancialProjections, calculatePotentialRevenue, getMarketPotential, getGrowthRoadmap } from '../services/calculationService';
import { PENETRATION_SCENARIOS, PHASE_COLORS } from '../constants';
import InfoTooltip from '../components/ui/InfoTooltip';
import { Line, getElementAtEvent } from 'react-chartjs-2';
import type { Chart as ChartJS } from 'chart.js';
import { PlanningAction, PlanningPhase, MonthResult } from '../types';

// --- Components Helpers ---

const ActionItem: React.FC<{
  action: PlanningAction;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (action: PlanningAction) => void;
  onDelete: (id: string) => void;
}> = ({ action, onToggle, onEdit, onDelete }) => {
  const [remainingTime, setRemainingTime] = useState('');
  const [progress, setProgress] = useState(0);
  const { tags, responsibles } = useContext(DataContext);

  useEffect(() => {
    const calculateTimes = () => {
      if (!action.estimatedCompletionDate) {
        setRemainingTime('Sem prazo definido');
        setProgress(0);
        return;
      }

      const now = new Date();
      const start = new Date(action.createdAt);
      const end = new Date(action.estimatedCompletionDate);

      if (action.completed) {
        setRemainingTime('Concluído');
        setProgress(100);
        return;
      }
      
      if (now >= end) {
        setRemainingTime('Atrasado');
        setProgress(100);
        return;
      }

      if (start >= end) {
        setRemainingTime('Data inválida');
        setProgress(0);
        return;
      }

      const totalDuration = end.getTime() - start.getTime();
      const elapsedDuration = now.getTime() - start.getTime();
      setProgress(Math.min(100, (elapsedDuration / totalDuration) * 100));

      const remainingMs = end.getTime() - now.getTime();
      const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let remainingString = '';
      if (days > 0) remainingString += `${days}d `;
      if (hours > 0) remainingString += `${hours}h `;
      if (minutes > 0) remainingString += `${minutes}m `;
      
      setRemainingTime(remainingString.trim() ? `${remainingString.trim()} restantes` : 'Menos de um minuto');
    };

    calculateTimes();
    const interval = setInterval(calculateTimes, 60000); 
    return () => clearInterval(interval);
  }, [action]);

  const isOverdue = remainingTime === 'Atrasado';

  const actionTags = action.tagIds 
    ? action.tagIds.map(id => tags.find(t => t.id === id)).filter(Boolean)
    : [];
  
  const responsible = action.responsibleId ? responsibles.find(r => r.id === action.responsibleId) : null;

  return (
    <div className="p-2 rounded hover:bg-base-200 dark:hover:bg-dark-100 group">
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1 min-w-0">
          <button onClick={() => onToggle(action.id, !action.completed)} className="mr-3 flex-shrink-0 mt-1">
            {action.completed ? <FiCheckSquare className="text-primary h-5 w-5"/> : <FiSquare className="text-gray-400 h-5 w-5"/>}
          </button>
          <div className="flex-grow min-w-0">
             <div className="flex items-center flex-wrap gap-2 mb-1">
                 <span className={`break-words ${action.completed ? 'line-through text-gray-500' : ''}`}>{action.description}</span>
                 {action.driveLink && (
                     <a href={action.driveLink} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-blue-600 flex-shrink-0" title="Abrir Documento/Drive">
                         <FiExternalLink size={14} />
                     </a>
                 )}
                 {responsible && (
                     <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm flex-shrink-0 cursor-help" style={{ backgroundColor: responsible.color }} title={`Responsável: ${responsible.name}`}>
                         {responsible.initials}
                     </div>
                 )}
                 {actionTags.map((tag) => (
                    <span key={tag?.id} className="text-[10px] px-1.5 py-0.5 rounded text-white font-medium flex-shrink-0" style={{ backgroundColor: tag?.color }}>
                        {tag?.label}
                    </span>
                 ))}
             </div>
            <p className="text-xs text-gray-400">
              Criado em: {new Date(action.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2 flex-shrink-0 flex items-center ml-2">
          <button onClick={() => onEdit(action)} className="p-1 hover:text-primary" title="Editar Ação"><FiEdit size={16}/></button>
          <button onClick={() => onDelete(action.id)} className="p-1 hover:text-red-500" title="Excluir Ação"><FiTrash2 size={16}/></button>
        </div>
      </div>
      {action.estimatedCompletionDate && (
        <div className="mt-2 pl-8">
          <div className="w-full bg-base-300 rounded-full h-2 dark:bg-dark-200">
            <div className={`h-2 rounded-full transition-all duration-300 ${isOverdue && !action.completed ? 'bg-red-500' : action.completed ? 'bg-primary' : 'bg-secondary'}`} style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex justify-between items-center">
            <p className={`text-xs mt-1 ${isOverdue && !action.completed ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
              {remainingTime}
            </p>
            <p className="text-xs text-gray-400">
              Prazo: {new Date(action.estimatedCompletionDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface PhaseAccordionProps {
  phase: PlanningPhase;
  cityId: number;
}

const PhaseAccordion: React.FC<PhaseAccordionProps> = ({ phase, cityId }) => {
  const { updatePlanAction, updatePlanPhase, tags, responsibles } = useContext(DataContext);
  const [isOpen, setIsOpen] = useState(phase.actions.some(a => !a.completed));
  const [newActionText, setNewActionText] = useState('');
  const [newActionDate, setNewActionDate] = useState('');
  const [editingAction, setEditingAction] = useState<PlanningAction | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDate, setEditingDate] = useState('');
  const [editingLink, setEditingLink] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [editingResponsibleId, setEditingResponsibleId] = useState<string>(''); 
  const [isEditingPhaseDate, setIsEditingPhaseDate] = useState(false);
  const [editedPhaseDate, setEditedPhaseDate] = useState('');

  const progress = useMemo(() => {
    if (phase.actions.length === 0) return 0;
    const completedCount = phase.actions.filter(a => a.completed).length;
    return (completedCount / phase.actions.length) * 100;
  }, [phase.actions]);

  const calculateDuration = (start?: string, end?: string): string => {
    if (!start || !end) return 'N/D';
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 'N/D';
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} dias`;
  };

  const handleToggleAction = (actionId: string, completed: boolean) => {
    updatePlanAction(cityId, phase.name, actionId, { completed });
  };
  
  const handleAddAction = () => {
    if (newActionText.trim() === '') return;
    updatePlanAction(cityId, phase.name, '', { 
        description: newActionText,
        estimatedCompletionDate: newActionDate ? new Date(newActionDate).toISOString() : undefined
    });
    setNewActionText('');
    setNewActionDate('');
  };
  
  const handleDeleteAction = (actionId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ação?')) {
      updatePlanAction(cityId, phase.name, actionId, { delete: true });
    }
  };

  const handleStartEdit = (action: PlanningAction) => {
    setEditingAction(action);
    setEditingText(action.description);
    setEditingLink(action.driveLink || '');
    setEditingTags(action.tagIds || []);
    setEditingResponsibleId(action.responsibleId || '');
    if (action.estimatedCompletionDate) {
        const d = new Date(action.estimatedCompletionDate);
        setEditingDate(d.toISOString().slice(0, 16));
    } else {
        setEditingDate('');
    }
  };
  
  const handleSaveEdit = () => {
    if (!editingAction) return;
    updatePlanAction(cityId, phase.name, editingAction.id, { 
        description: editingText,
        estimatedCompletionDate: editingDate ? new Date(editingDate).toISOString() : undefined,
        driveLink: editingLink,
        tagIds: editingTags,
        responsibleId: editingResponsibleId || undefined
    });
    setEditingAction(null);
  };

  const toggleTagSelection = (tagId: string) => {
      setEditingTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  return (
    <div className={`border border-base-300 dark:border-dark-100 rounded-lg border-l-4 ${PHASE_COLORS[phase.name]?.borderL || 'border-l-gray-400'}`}>
      <div className="p-4 bg-base-200 dark:bg-dark-100 rounded-t-lg">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <h3 className="font-semibold">{phase.name}</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <div className="w-24 bg-base-300 rounded-full h-2.5 dark:bg-dark-200">
                    <div className="bg-primary h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
                </div>
                <span className="text-sm font-bold w-10 text-right">{Math.round(progress)}%</span>
            </div>
            {isOpen ? <FiChevronUp /> : <FiChevronDown />}
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="p-4 space-y-1">
          {phase.actions.map(action => (
            <ActionItem key={action.id} action={action} onToggle={handleToggleAction} onEdit={handleStartEdit} onDelete={handleDeleteAction} />
          ))}
           <div className="flex flex-wrap items-center pt-4 border-t border-base-200 dark:border-dark-200 mt-4 gap-2">
              <input type="text" value={newActionText} onChange={e => setNewActionText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddAction()} placeholder="Adicionar nova ação..." className="flex-grow p-2 rounded-md bg-base-200 dark:bg-dark-300 border border-base-300 dark:border-dark-100 focus:ring-primary focus:border-primary" />
              <input type="datetime-local" value={newActionDate} onChange={e => setNewActionDate(e.target.value)} title="Prazo estimado (opcional)" className="p-2 rounded-md bg-base-200 dark:bg-dark-300 border border-base-300 dark:border-dark-100 focus:ring-primary focus:border-primary text-gray-500" />
              <button onClick={handleAddAction} className="ml-2 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition">Adicionar</button>
          </div>
        </div>
      )}
      {editingAction && (
        <Modal isOpen={!!editingAction} onClose={() => setEditingAction(null)} title="Editar Ação">
          <div className="space-y-4">
             <div>
                <label className="text-sm font-semibold">Descrição da Ação</label>
                <textarea value={editingText} onChange={e => setEditingText(e.target.value)} className="w-full p-2 rounded-md bg-base-200 dark:bg-dark-300 border border-base-300 dark:border-dark-100 mt-1" rows={3} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                     <label className="text-sm font-semibold flex items-center mb-1"><FiUser className="mr-1"/> Responsável</label>
                     <select value={editingResponsibleId} onChange={(e) => setEditingResponsibleId(e.target.value)} className="w-full p-2 rounded-md bg-base-200 dark:bg-dark-300 border border-base-300 dark:border-dark-100 focus:ring-primary focus:border-primary">
                         <option value="">Sem responsável</option>
                         {responsibles.map(resp => <option key={resp.id} value={resp.id}>{resp.name}</option>)}
                     </select>
                 </div>
                 <div>
                     <label className="text-sm font-semibold flex items-center mb-1"><FiLink className="mr-1"/> Link (Drive/Doc)</label>
                     <input type="url" value={editingLink} onChange={e => setEditingLink(e.target.value)} placeholder="https://..." className="w-full p-2 rounded-md bg-base-200 dark:bg-dark-300 border border-base-300 dark:border-dark-100" />
                 </div>
             </div>
             <div>
                 <label className="text-sm font-semibold flex items-center mb-2"><FiTag className="mr-1"/> Etiquetas</label>
                 <div className="flex flex-wrap gap-2">
                     {tags.map(tag => {
                         const isSelected = editingTags.includes(tag.id);
                         return (
                            <button key={tag.id} onClick={() => toggleTagSelection(tag.id)} className={`text-xs px-2 py-1 rounded-full border transition-all ${isSelected ? 'ring-2 ring-offset-1 text-white' : 'bg-base-100 dark:bg-dark-200 border-base-300 dark:border-dark-100 hover:bg-base-200'}`} style={{ backgroundColor: isSelected ? tag.color : undefined, borderColor: isSelected ? tag.color : undefined }}>{tag.label}</button>
                         );
                     })}
                 </div>
             </div>
              <div className="flex justify-end space-x-2 pt-2">
                  <button onClick={() => setEditingAction(null)} className="py-2 px-4 rounded-lg hover:bg-base-200 dark:hover:bg-dark-100 transition">Cancelar</button>
                  <button onClick={handleSaveEdit} className="flex items-center bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition"><FiSave className="mr-2"/>Salvar</button>
              </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

const SummaryKpi = ({ icon, label, value }: { icon: React.ReactElement, label: string, value: string }) => (
    <div className="flex items-center p-3 bg-base-200 dark:bg-dark-100 rounded-lg">
        <div className="p-3 rounded-full bg-primary/20 text-primary mr-4">{icon}</div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    </div>
);

// --- Main Page Component ---

const PlanningDetails: React.FC = () => {
    const { cityId } = useParams<{ cityId: string }>();
    const navigate = useNavigate();
    const chartRef = useRef<ChartJS<'line'>>(null);
    const { cities, plans, addPlanForCity, updatePlanResults } = useContext(DataContext);
    const [isEditingResults, setIsEditingResults] = useState(false);
    const [localResults, setLocalResults] = useState<{ [key: string]: MonthResult }>({});

    const parsedCityId = Number(cityId);
    const selectedCity = cities.find(c => c.id === parsedCityId);
    const selectedPlan = plans.find(p => p.cityId === parsedCityId);
    
    const growthRoadmapMedia = useMemo(() => selectedCity ? getGrowthRoadmap(selectedCity, PENETRATION_SCENARIOS['Média']) : [], [selectedCity]);
    const growthRoadmapMuitoBaixa = useMemo(() => selectedCity ? getGrowthRoadmap(selectedCity, PENETRATION_SCENARIOS['Muito Baixa']) : [], [selectedCity]);
    const growthRoadmapMuitoAlta = useMemo(() => selectedCity ? getGrowthRoadmap(selectedCity, PENETRATION_SCENARIOS['Muito Alta']) : [], [selectedCity]);

    useEffect(() => {
        if (selectedPlan && selectedPlan.results) {
            setLocalResults(selectedPlan.results);
        } else if (growthRoadmapMedia.length > 0) {
            const demoData: {[key: string]: MonthResult} = {};
            growthRoadmapMedia.forEach((item, index) => {
                if (index < 4) {
                    const factor = 0.9 + (Math.random() * 0.3);
                    const rides = Math.round(item.rides * factor);
                    demoData[`Mes${item.month}`] = {
                        rides,
                        marketingCost: rides * (3 + Math.random() * 2),
                        operationalCost: rides * (1.5 + Math.random() * 1)
                    };
                }
            });
            setLocalResults(demoData);
        }
    }, [selectedPlan, growthRoadmapMedia]);

    const marketPotential = useMemo(() => selectedCity ? getMarketPotential(selectedCity) : [], [selectedCity]);

    const growthChartData = useMemo(() => {
        const labels = growthRoadmapMedia.map(d => `Mês ${d.month}`);
        return {
          labels,
          datasets: [
            { label: 'Meta - Média', data: growthRoadmapMedia.map(d => d.rides), borderColor: '#3b82f6', fill: false, tension: 0.3 },
            { label: 'Resultados Reais (Passageiros)', data: labels.map((_, index) => localResults[`Mes${index + 1}`]?.rides ?? null), borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: false, tension: 0.3, borderDash: [5, 5] },
          ],
        };
    }, [growthRoadmapMedia, localResults]);

    const performanceMetrics = useMemo(() => {
        const months = Object.keys(localResults).sort();
        if (months.length === 0) return null;
        
        const latestKey = months[months.length - 1];
        const latest = localResults[latestKey];
        if (!latest || latest.rides === 0) return null;

        const cpaMarketing = latest.marketingCost / latest.rides;
        const costOps = latest.operationalCost / latest.rides;
        const costTotal = cpaMarketing + costOps;

        let insight = "Performance estável.";
        if (cpaMarketing > 8) insight = "CPA de Marketing elevado. Recomenda-se otimizar criativos ou segmentação.";
        else if (cpaMarketing < 3) insight = "Excelente eficiência de aquisição. Oportunidade de escalar investimento.";
        
        if (costOps > 5) insight += " Alerta: Custos operacionais por passageiro acima da média estadual.";

        return { cpaMarketing, costOps, costTotal, insight };
    }, [localResults]);

    const mediumMonthlyTarget = useMemo(() => marketPotential.find(p => p.scenario === 'Média')?.rides || 0, [marketPotential]);
    const latestRealValue = useMemo(() => {
        const keys = Object.keys(localResults).sort();
        return keys.length > 0 ? localResults[keys[keys.length-1]].rides : 0;
    }, [localResults]);
    const overallProgress = mediumMonthlyTarget > 0 ? (latestRealValue / mediumMonthlyTarget) * 100 : 0;

    const handleLocalChange = (month: number, field: keyof MonthResult, value: string) => {
        const val = parseFloat(value) || 0;
        setLocalResults(prev => ({
            ...prev,
            [`Mes${month}`]: { ...(prev[`Mes${month}`] || { rides: 0, marketingCost: 0, operationalCost: 0 }), [field]: val }
        }));
    };

    const handleSaveChanges = () => {
        if (selectedCity) {
            Object.entries(localResults).forEach(([key, result]) => updatePlanResults(selectedCity.id, key, result));
        }
        setIsEditingResults(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-2">
                <button onClick={() => navigate('/planejamento')} className="p-2 rounded-full hover:bg-base-200 dark:hover:bg-dark-100 transition"><FiArrowLeft className="w-6 h-6"/></button>
                <h2 className="text-2xl font-bold">Planejamento Financeiro: {selectedCity.name}</h2>
            </div>

            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <SummaryKpi icon={<FiUsers/>} label="População Alvo" value={selectedCity.population15to44.toLocaleString('pt-BR')} />
                            <SummaryKpi icon={<FiDollarSign/>} label="Meta Receita" value={calculatePotentialRevenue(selectedCity, 'Média').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                        </div>

                        {/* FINANCE PERFORMANCE SECTION */}
                        {performanceMetrics && (
                            <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-xl border border-primary/20">
                                <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                                    <FiZap /> Análise de Eficiência e CAC
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                    <div className="bg-white dark:bg-dark-300 p-3 rounded-lg shadow-sm border border-base-300 dark:border-dark-100">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">CPA Marketing</p>
                                        <p className="text-lg font-bold text-secondary">{performanceMetrics.cpaMarketing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        <p className="text-[9px] text-gray-400">por passageiro</p>
                                    </div>
                                    <div className="bg-white dark:bg-dark-300 p-3 rounded-lg shadow-sm border border-base-300 dark:border-dark-100">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Ops / Passageiro</p>
                                        <p className="text-lg font-bold text-tertiary">{performanceMetrics.costOps.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        <p className="text-[9px] text-gray-400">eficiência local</p>
                                    </div>
                                    <div className="bg-white dark:bg-dark-300 p-3 rounded-lg shadow-sm border border-base-300 dark:border-dark-100">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Custo Total (CAC)</p>
                                        <p className="text-lg font-bold text-primary">{performanceMetrics.costTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        <p className="text-[9px] text-gray-400">métrica combinada</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 bg-white/50 dark:bg-dark-200/50 p-3 rounded-lg border border-primary/10">
                                    <FiAlertCircle className="text-primary flex-shrink-0 mt-0.5" />
                                    <p className="text-xs italic text-gray-600 dark:text-gray-300">
                                        <strong>Insights Urban AI:</strong> {performanceMetrics.insight}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-base-200 dark:bg-dark-100 p-6 rounded-xl border border-base-300 dark:border-dark-100">
                         <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 flex items-center mb-4">
                            <FiTarget className="mr-1.5 text-primary"/> Progresso de Metas (Mês Atual)
                        </h4>
                        <div className="w-full bg-base-300 dark:bg-dark-300 rounded-full h-4 mb-2">
                            <div className="bg-gradient-to-r from-blue-500 to-primary h-4 rounded-full transition-all duration-700 shadow-sm" style={{ width: `${Math.min(100, overallProgress)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-500">
                            <span>0 passageiros</span>
                            <span className="text-primary">{overallProgress.toFixed(1)}% da meta atingida</span>
                            <span>{Math.round(mediumMonthlyTarget)} passageiros</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-base-300 dark:border-dark-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">Lançamento de Resultados e Investimentos</h4>
                        {!isEditingResults ? (
                            <button onClick={() => setIsEditingResults(true)} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"><FiEdit size={14}/> Editar Dados</button>
                        ) : (
                            <div className="flex gap-3">
                                <button onClick={() => setIsEditingResults(false)} className="text-sm text-gray-500 hover:underline">Cancelar</button>
                                <button onClick={handleSaveChanges} className="bg-primary text-white text-sm px-4 py-1 rounded-lg hover:bg-primary-600 flex items-center gap-1"><FiSave size={14}/> Salvar Todos</button>
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="text-[10px] text-gray-400 uppercase border-b border-base-300 dark:border-dark-100">
                                    <th className="pb-2 font-bold">Período</th>
                                    <th className="pb-2 font-bold">Passageiros (Rides)</th>
                                    <th className="pb-2 font-bold">Invest. Marketing (R$)</th>
                                    <th className="pb-2 font-bold">Gasto Operacional (R$)</th>
                                    <th className="pb-2 font-bold">Eficiência Total (R$/Pass)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {growthRoadmapMedia.map(d => {
                                    const res = localResults[`Mes${d.month}`] || { rides: 0, marketingCost: 0, operationalCost: 0 };
                                    const efficiency = res.rides > 0 ? (res.marketingCost + res.operationalCost) / res.rides : 0;
                                    
                                    return (
                                        <tr key={d.month} className="border-b border-base-200 dark:border-dark-200 last:border-0">
                                            <td className="py-4 font-bold text-gray-500">Mês {d.month}</td>
                                            <td className="py-2">
                                                <input 
                                                    type="number" 
                                                    disabled={!isEditingResults} 
                                                    value={res.rides || ''} 
                                                    onChange={e => handleLocalChange(d.month, 'rides', e.target.value)}
                                                    className="w-24 p-1.5 rounded-lg border border-base-300 dark:border-dark-100 bg-base-100 dark:bg-dark-300 disabled:bg-transparent disabled:border-transparent text-sm font-bold"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="py-2">
                                                <input 
                                                    type="number" 
                                                    disabled={!isEditingResults} 
                                                    value={res.marketingCost || ''} 
                                                    onChange={e => handleLocalChange(d.month, 'marketingCost', e.target.value)}
                                                    className="w-24 p-1.5 rounded-lg border border-base-300 dark:border-dark-100 bg-base-100 dark:bg-dark-300 disabled:bg-transparent disabled:border-transparent text-sm"
                                                    placeholder="R$ 0,00"
                                                />
                                            </td>
                                            <td className="py-2">
                                                <input 
                                                    type="number" 
                                                    disabled={!isEditingResults} 
                                                    value={res.operationalCost || ''} 
                                                    onChange={e => handleLocalChange(d.month, 'operationalCost', e.target.value)}
                                                    className="w-24 p-1.5 rounded-lg border border-base-300 dark:border-dark-100 bg-base-100 dark:bg-dark-300 disabled:bg-transparent disabled:border-transparent text-sm"
                                                    placeholder="R$ 0,00"
                                                />
                                            </td>
                                            <td className="py-2">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${efficiency > 10 ? 'bg-red-100 text-red-700' : efficiency > 0 ? 'bg-green-100 text-green-700' : 'text-gray-300'}`}>
                                                    {efficiency > 0 ? efficiency.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

            <div>
                <h3 className="text-lg font-bold mb-4 ml-1">Fases Operacionais do Plano</h3>
                <div className="space-y-4">
                    {selectedPlan?.phases.map(phase => <PhaseAccordion key={phase.name} phase={phase} cityId={selectedCity.id} />)}
                </div>
            </div>
        </div>
    );
};

export default PlanningDetails;

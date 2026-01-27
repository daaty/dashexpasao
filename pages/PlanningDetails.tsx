import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import FinancialProjection from '../components/FinancialProjection';
import { FiArrowLeft, FiClipboard, FiPlusCircle, FiChevronDown, FiChevronUp, FiEdit, FiTrash2, FiCheckSquare, FiSquare, FiSave, FiCalendar, FiClock, FiX, FiUsers, FiDollarSign, FiRefreshCw, FiLink, FiExternalLink, FiTrendingUp, FiTrendingDown, FiActivity, FiTarget, FiTag, FiUser, FiZap, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { getFinancialProjections, calculatePotentialRevenue, getMarketPotential, getGrowthRoadmap } from '../services/calculationService';
import { PENETRATION_SCENARIOS, PHASE_COLORS, MONTHS } from '../constants';
import InfoTooltip from '../components/ui/InfoTooltip';
import { Line, getElementAtEvent } from 'react-chartjs-2';
import type { Chart as ChartJS } from 'chart.js';
import { PlanningAction, PlanningPhase, MonthResult, CityStatus } from '../types';
import CityRidesData from '../components/CityRidesData';
import { getMonthlyRevenueData } from '../services/revenueService';

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
  const [editedPhaseStartDate, setEditedPhaseStartDate] = useState('');
  const [editedPhaseEstimatedDate, setEditedPhaseEstimatedDate] = useState('');
  const [editedPhaseCompletionDate, setEditedPhaseCompletionDate] = useState('');

  const progress = useMemo(() => {
    if (phase.actions.length === 0) return 0;
    const completedCount = phase.actions.filter(a => a.completed).length;
    return (completedCount / phase.actions.length) * 100;
  }, [phase.actions]);

  const handleStartEditPhaseDate = () => {
    setIsEditingPhaseDate(true);
    setEditedPhaseStartDate(phase.startDate ? new Date(phase.startDate).toISOString().slice(0, 10) : '');
    setEditedPhaseEstimatedDate(phase.estimatedCompletionDate ? new Date(phase.estimatedCompletionDate).toISOString().slice(0, 10) : '');
    setEditedPhaseCompletionDate(phase.completionDate ? new Date(phase.completionDate).toISOString().slice(0, 10) : '');
  };

  const handleSavePhaseDate = () => {
    updatePlanPhase(cityId, phase.name, {
      startDate: editedPhaseStartDate ? new Date(editedPhaseStartDate).toISOString() : undefined,
      estimatedCompletionDate: editedPhaseEstimatedDate ? new Date(editedPhaseEstimatedDate).toISOString() : undefined,
      completionDate: editedPhaseCompletionDate ? new Date(editedPhaseCompletionDate).toISOString() : undefined,
    });
    setIsEditingPhaseDate(false);
  };

  const handleCancelEditPhaseDate = () => {
    setIsEditingPhaseDate(false);
  };

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
          <div className="flex-1">
            <h3 className="font-semibold mb-2">{phase.name}</h3>
            {!isEditingPhaseDate ? (
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <FiCalendar size={12} />
                  <span>Início: {phase.startDate ? new Date(phase.startDate).toLocaleDateString('pt-BR') : 'Não definido'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiClock size={12} />
                  <span>Previsão: {phase.estimatedCompletionDate ? new Date(phase.estimatedCompletionDate).toLocaleDateString('pt-BR') : 'Não definido'}</span>
                </div>
                {phase.completionDate && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <FiCheckSquare size={12} />
                    <span>Concluído: {new Date(phase.completionDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleStartEditPhaseDate(); }}
                  className="ml-2 p-1 hover:bg-base-300 dark:hover:bg-dark-200 rounded transition"
                  title="Editar datas da fase"
                >
                  <FiEdit size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <label className="text-xs">Início:</label>
                  <input 
                    type="date" 
                    value={editedPhaseStartDate}
                    onChange={(e) => setEditedPhaseStartDate(e.target.value)}
                    className="p-1 text-xs rounded border border-base-300 dark:border-dark-100 bg-base-100 dark:bg-dark-300"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs">Previsão:</label>
                  <input 
                    type="date" 
                    value={editedPhaseEstimatedDate}
                    onChange={(e) => setEditedPhaseEstimatedDate(e.target.value)}
                    className="p-1 text-xs rounded border border-base-300 dark:border-dark-100 bg-base-100 dark:bg-dark-300"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs">Conclusão:</label>
                  <input 
                    type="date" 
                    value={editedPhaseCompletionDate}
                    onChange={(e) => setEditedPhaseCompletionDate(e.target.value)}
                    className="p-1 text-xs rounded border border-base-300 dark:border-dark-100 bg-base-100 dark:bg-dark-300"
                  />
                </div>
                <button 
                  onClick={handleSavePhaseDate}
                  className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  title="Salvar datas"
                >
                  <FiSave size={12} />
                </button>
                <button 
                  onClick={handleCancelEditPhaseDate}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  title="Cancelar"
                >
                  <FiX size={12} />
                </button>
              </div>
            )}
          </div>
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
    const { cities, plans, addPlanForCity, deletePlan, updatePlanResults, updatePlanResultsBatch, updatePlanStartDate, updateCityImplementationDate } = useContext(DataContext);
    const [isEditingResults, setIsEditingResults] = useState(false);
    const [localResults, setLocalResults] = useState<{ [key: string]: MonthResult }>({});
    const [realRidesData, setRealRidesData] = useState<{ [key: string]: number }>({});
    const [realRevenueData, setRealRevenueData] = useState<{ [key: string]: number }>({});
    const [realMonthlyCosts, setRealMonthlyCosts] = useState<{ [key: string]: { marketingCost: number; operationalCost: number } }>({});
    const [selectedChartMonth, setSelectedChartMonth] = useState<number | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isEditingMonthlyCosts, setIsEditingMonthlyCosts] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [zoomRange, setZoomRange] = useState<{min: number, max: number} | null>(null);
    const [activeZoomPeriod, setActiveZoomPeriod] = useState<'3m' | '6m' | '1a' | 'all'>('all');
    const [isEditingImplementationDate, setIsEditingImplementationDate] = useState(false);
    const [editedImplementationDate, setEditedImplementationDate] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'costs'>('overview');

    const parsedCityId = Number(cityId);
    const selectedCity = cities.find(c => c.id === parsedCityId);
    const selectedPlan = plans.find(p => p.cityId === parsedCityId);
    
    const growthRoadmapMedia = useMemo(() => selectedCity ? getGrowthRoadmap(selectedCity, PENETRATION_SCENARIOS['Média']) : [], [selectedCity, selectedCity?.implementationStartDate]);
    const growthRoadmapMuitoBaixa = useMemo(() => selectedCity ? getGrowthRoadmap(selectedCity, PENETRATION_SCENARIOS['Muito Baixa']) : [], [selectedCity, selectedCity?.implementationStartDate]);
    const growthRoadmapMuitoAlta = useMemo(() => selectedCity ? getGrowthRoadmap(selectedCity, PENETRATION_SCENARIOS['Muito Alta']) : [], [selectedCity, selectedCity?.implementationStartDate]);

    // Inicializar data de implementação quando a cidade for selecionada ou quando a data mudar
    useEffect(() => {
        if (selectedCity?.implementationStartDate) {
            setEditedImplementationDate(selectedCity.implementationStartDate);
            console.log(`📍 Data de implementação sincronizada: ${selectedCity.implementationStartDate}`);
        } else {
            setEditedImplementationDate('');
        }
    }, [selectedCity?.id, selectedCity?.implementationStartDate, selectedCity]);

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

    // Auto-preencher rides dos dados reais se disponíveis
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

    // Auto-save com debounce quando os dados mudarem
    useEffect(() => {
        if (!hasUnsavedChanges || !selectedCity) return;

        const timer = setTimeout(() => {
            console.log('💾 Salvamento automático ativado...');
            updatePlanResultsBatch(selectedCity.id, localResults);
            setHasUnsavedChanges(false);
        }, 2000); // Salva automaticamente após 2 segundos de inatividade

        return () => clearTimeout(timer);
    }, [localResults, hasUnsavedChanges, selectedCity, updatePlanResultsBatch]);

    const marketPotential = useMemo(() => selectedCity ? getMarketPotential(selectedCity) : [], [selectedCity]);

    const applyZoom = (period: '3m' | '6m' | '1a' | 'all') => {
        setActiveZoomPeriod(period);
        
        if (period === 'all') {
            setZoomRange(null);
            return;
        }
        
        const totalMonths = growthRoadmapMedia.length;
        const periodMonths = period === '3m' ? 3 : period === '6m' ? 6 : 12;
        
        // Mostra os últimos N meses com dados
        const max = totalMonths - 1;
        const min = Math.max(0, max - periodMonths + 1);
        
        setZoomRange({ min, max });
    };

    const growthChartData = useMemo(() => {
        const labels = ['Mês 0', ...growthRoadmapMedia.map(d => `Mês ${d.month}`)];
        
        // Função para criar dados com crescimento gradual até mês 6, depois linha reta
        const createGoalData = (roadmap: typeof growthRoadmapMedia) => {
            const data = [0]; // Mês 0
            for (let i = 0; i < roadmap.length; i++) {
                if (i < 6) {
                    // Primeiros 6 meses: crescimento gradual
                    data.push(roadmap[i].rides);
                } else {
                    // Após mês 6: mantém o valor do mês 6 (linha reta)
                    data.push(roadmap[5].rides);
                }
            }
            return data;
        };
        
        // Criar gradiente para o preenchimento
        const ctx = chartRef.current?.ctx;
        let gradient = undefined;
        if (ctx) {
            gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(34, 211, 238, 0.4)'); // Cyan claro
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0.05)'); // Cyan escuro com transparência
        }
        
        return {
          labels,
          datasets: [
            {
                label: 'Meta - Muito Alta (20%)',
                data: createGoalData(growthRoadmapMuitoAlta),
                borderColor: '#64748b',
                backgroundColor: 'rgba(100, 116, 139, 0.05)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#64748b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
            { 
                label: 'Meta - Média (10%)', 
                data: createGoalData(growthRoadmapMedia), 
                borderColor: '#3b82f6',
                backgroundColor: gradient || 'rgba(34, 211, 238, 0.15)',
                borderWidth: 2.5,
                fill: true, 
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
            {
                label: 'Meta - Muito Baixa (2%)',
                data: createGoalData(growthRoadmapMuitoBaixa),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#f59e0b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
            { 
                label: 'Resultados Reais', 
                data: [0, ...labels.slice(1).map((_, index) => localResults[`Mes${index + 1}`]?.rides ?? null)], 
                borderColor: '#10b981',
                backgroundColor: gradient || 'rgba(34, 211, 238, 0.2)', 
                fill: true, 
                tension: 0.4,
                borderWidth: 3.5,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointStyle: 'circle',
            },
          ],
        };
    }, [growthRoadmapMedia, growthRoadmapMuitoAlta, growthRoadmapMuitoBaixa, localResults]);

    const growthChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: { 
                display: true, 
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    padding: 18,
                    boxWidth: 12,
                    boxHeight: 12,
                    font: {
                        size: 13,
                        weight: 700 as any,
                        family: "'Inter', sans-serif"
                    },
                    color: '#ffffff'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(6, 32, 64, 0.98)',
                padding: 16,
                borderColor: 'rgba(34, 211, 238, 0.5)',
                borderWidth: 2,
                titleFont: {
                    size: 14,
                    weight: 700 as any,
                    family: "'Inter', sans-serif"
                },
                bodyFont: {
                    size: 13,
                    family: "'Inter', sans-serif"
                },
                displayColors: true,
                boxWidth: 10,
                boxHeight: 10,
                boxPadding: 6,
                cornerRadius: 8,
                callbacks: {
                    title: function(context: any) {
                        return `📊 ${context[0].label}`;
                    },
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += context.parsed.y;
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255,255,255,0.1)',
                    lineWidth: 1,
                    drawBorder: false,
                },
                border: {
                    display: false,
                },
                ticks: {
                    callback: (value: string | number) => `${value}`,
                    font: { size: 13, weight: 600 as any, family: 'Inter, sans-serif' },
                    color: 'rgba(255, 255, 255, 0.8)',
                    padding: 8,
                },
                title: {
                    display: false,
                },
            },
            x: {
                min: zoomRange?.min,
                max: zoomRange?.max,
                grid: {
                    color: 'rgba(255,255,255,0.08)',
                    lineWidth: 0.5,
                    drawBorder: false,
                },
                border: {
                    display: false,
                },
                ticks: {
                    font: { size: 13, weight: 600 as any, family: 'Inter, sans-serif' },
                    color: 'rgba(255, 255, 255, 0.8)',
                    padding: 8,
                    maxRotation: 0,
                    autoSkip: zoomRange ? false : true,
                    autoSkipPadding: 10
                },
                title: {
                    display: false,
                },
            },
        },
        title: { 
            display: true, 
            text: '📊 Número de Corridas',
            font: {
                size: 13,
                weight: 700 as any,
                family: "'Inter', sans-serif"
            },
            color: '#ffffff',
            padding: { top: 5, bottom: 10 }
        }
    } as any), [zoomRange, localResults, growthRoadmapMedia]);

    // Calcular latestMonthIndex e latestRides
    const { latestMonthIndex, latestRides } = useMemo(() => {
        let monthIndex = 0;
        let rides = 0;
        
        Object.keys(localResults).forEach(key => {
            if (key.startsWith('Mes')) {
                const index = parseInt(key.replace('Mes', ''));
                const data = localResults[key];
                if (data && data.rides > 0 && index > monthIndex) {
                    monthIndex = index;
                    rides = data.rides;
                }
            }
        });
        
        return { latestMonthIndex: monthIndex, latestRides: rides };
    }, [localResults]);

    const mediumMonthlyTarget = useMemo(() => {
        if (growthRoadmapMedia.length === 0) return 0;
        // Use the target for month 1 (first month after start)
        return growthRoadmapMedia[0]?.rides || 0;
    }, [growthRoadmapMedia]);

    const { currentRides, currentMonthLabel } = useMemo(() => {
        const startDate = selectedCity?.implementationStartDate || selectedPlan?.startDate;
        if (!startDate) return { currentRides: 0, currentMonthLabel: 'N/A' };
        
        const start = new Date(startDate.replace(/-/g, '/'));
        if (isNaN(start.getTime())) return { currentRides: 0, currentMonthLabel: 'N/A' };
        
        if (latestMonthIndex === 0) {
            const now = new Date();
            const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
            const monthIndex = Math.max(1, diffMonths + 1);
            const monthName = MONTHS[(start.getMonth() + monthIndex - 1) % 12];
            return { currentRides: 0, currentMonthLabel: monthName };
        }
        const targetDate = new Date(start);
        targetDate.setMonth(start.getMonth() + (latestMonthIndex - 1));
        const monthName = MONTHS[targetDate.getMonth()];
        return { currentRides: latestRides, currentMonthLabel: monthName };
    }, [selectedPlan?.startDate, selectedCity?.implementationStartDate, localResults, latestMonthIndex, latestRides]);

    const overallProgress = mediumMonthlyTarget > 0 ? (currentRides / mediumMonthlyTarget) * 100 : 0;

    const handleLocalChange = (month: number, field: keyof MonthResult, value: string) => {
        const val = parseFloat(value) || 0;
        setLocalResults(prev => ({
            ...prev,
            [`Mes${month}`]: { ...(prev[`Mes${month}`] || { rides: 0, marketingCost: 0, operationalCost: 0 }), [field]: val }
        }));
        setHasUnsavedChanges(true); // Marca que há mudanças não salvas
    };

    const handleMonthChange = (monthOffset: number, newDateValue: string) => {
        if (!selectedPlan?.startDate || !newDateValue) return;
        
        // Calculate new Plan Start Date based on the edited month row
        // If row is month 1, newStartDate = newDateValue
        // If row is month 2, newStartDate = newDateValue - 1 month
        const selectedDate = new Date(newDateValue + '-02');
        selectedDate.setMonth(selectedDate.getMonth() - (monthOffset - 1));
        
        const newStartDateStr = selectedDate.toISOString().slice(0, 7); // YYYY-MM
        updatePlanStartDate(parsedCityId, newStartDateStr);
    };

    const handleSaveChanges = () => {
        if (selectedCity) {
            updatePlanResultsBatch(selectedCity.id, localResults);
            setHasUnsavedChanges(false);
        }
        setIsEditingResults(false);
    };

    const handleDeletePlan = async () => {
        if (selectedCity) {
            await deletePlan(selectedCity.id);
            navigate('/planejamento');
        }
    };

    const handleSaveImplementationDate = async () => {
        if (!selectedCity || !editedImplementationDate) return;
        
        // Garantir formato YYYY-MM-DD (adicionar dia 01 se necessário)
        const dateToSave = editedImplementationDate.includes('-01') || editedImplementationDate.split('-').length === 3
            ? editedImplementationDate
            : `${editedImplementationDate}-01`;
        
        // Atualizar a data de implementação usando o contexto
        updateCityImplementationDate(selectedCity.id, dateToSave);
        
        // Fechar modo edição e aguardar re-renderização
        setIsEditingImplementationDate(false);
        
        console.log(`✅ Data de implementação salva: ${editedImplementationDate}`);
        
        // Forçar update visual aguardando um frame
        setTimeout(() => {
            // Isso garante que o React processou o update
            console.log('✅ Card atualizado');
        }, 100);
    };

    const handleMonthlyCostChange = (monthKey: string, field: 'marketingCost' | 'operationalCost', value: number, isReal?: boolean) => {
        if (!selectedPlan?.startDate) return;
        
        // Se for custo real, salvar no estado separado
        if (isReal) {
            setRealMonthlyCosts(prev => ({
                ...prev,
                [monthKey]: {
                    ...prev[monthKey] || { marketingCost: 0, operationalCost: 0 },
                    [field]: value
                }
            }));
            setHasUnsavedChanges(true);
            return;
        }
        
        // Convert monthKey (YYYY-MM) back to Mes1, Mes2, etc
        const [targetYear, targetMonth] = monthKey.split('-').map(Number);
        const [startYear, startMonth] = selectedPlan.startDate.split('-').map(Number);
        
        // Calculate month difference (Mes1 = month before start, so target - start + 2)
        // Converter para 0-indexed antes de calcular
        const targetTotalMonths = targetYear * 12 + (targetMonth - 1);
        const startTotalMonths = startYear * 12 + (startMonth - 1);
        const diffMonths = targetTotalMonths - startTotalMonths + 2;
        
        if (diffMonths >= 1 && diffMonths <= 36) {
            const key = `Mes${diffMonths}`;
            setLocalResults(prev => ({
                ...prev,
                [key]: {
                    ...(prev[key] || { rides: 0, marketingCost: 0, operationalCost: 0 }),
                    [field]: value
                }
            }));
            setHasUnsavedChanges(true);
        }
    };

    // Handler para quando dados reais forem carregados do componente CityRidesData
    const handleRidesDataLoad = (data: { monthKey: string; rides: number; revenue: number }[]) => {
        // Armazenar dados reais em estado separado (não sobrescrever as metas)
        const realData: { [key: string]: number } = {};
        const realRevenue: { [key: string]: number } = {};
        
        data.forEach(({ monthKey, rides, revenue }) => {
            realData[monthKey] = rides;
            realRevenue[monthKey] = revenue;
        });
        
        setRealRidesData(realData);
        setRealRevenueData(realRevenue);
    };

    // Handler para clique no gráfico
    const handleChartClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!chartRef.current) return;
        
        try {
            const points = getElementAtEvent(chartRef.current, event as any);
            if (points.length > 0) {
                const monthIndex = points[0].index;
                setSelectedChartMonth(monthIndex);
            }
        } catch (err) {
            console.log('Chart click error:', err);
        }
    };

    // Usar receita real do banco (dashboard.transactions) - não recalcular
    const calculatedActualRevenue = useMemo(() => {
        // Retornar receita real diretamente do banco de dados
        return realRevenueData;
    }, [realRevenueData]);

    // Calcular receita projetada baseada nas metas (para FinancialProjection)
    const calculatedProjectedRevenue = useMemo(() => {
        const PRICE_PER_RIDE = 2.50;
        const revByDate: { [key: string]: number } = {};
        const startDate = selectedCity?.implementationStartDate || selectedPlan?.startDate;
        if (startDate && growthRoadmapMedia.length > 0) {
            growthRoadmapMedia.forEach((roadmapItem) => {
                const [startYear, startMonth] = startDate.split('-').map(Number);
                const totalMonths = (startYear * 12 + startMonth - 1) + roadmapItem.month;
                const targetYear = Math.floor(totalMonths / 12);
                const targetMonth = (totalMonths % 12) + 1;
                const dateKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
                revByDate[dateKey] = roadmapItem.rides * PRICE_PER_RIDE;
            });
        }
        return revByDate;
    }, [selectedCity?.implementationStartDate, selectedPlan?.startDate, growthRoadmapMedia]);

    // Calcular metas de corridas (para FinancialProjection)
    const calculatedExpectedRides = useMemo(() => {
        const ridesByDate: { [key: string]: number } = {};
        const startDate = selectedCity?.implementationStartDate || selectedPlan?.startDate;
        if (startDate && growthRoadmapMedia.length > 0) {
            growthRoadmapMedia.forEach((roadmapItem) => {
                const [startYear, startMonth] = startDate.split('-').map(Number);
                const totalMonths = (startYear * 12 + startMonth - 1) + roadmapItem.month;
                const targetYear = Math.floor(totalMonths / 12);
                const targetMonth = (totalMonths % 12) + 1;
                const dateKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
                ridesByDate[dateKey] = roadmapItem.rides;
            });
        }
        return ridesByDate;
    }, [selectedCity?.implementationStartDate, selectedPlan?.startDate, growthRoadmapMedia]);

    // Calcular custos mensais (para FinancialProjection)
    const calculatedMonthlyCosts = useMemo(() => {
        const costsByDate: { [key: string]: { marketingCost: number; operationalCost: number } } = {};
        const startDate = selectedCity?.implementationStartDate || selectedPlan?.startDate;
        if (startDate) {
            Object.keys(localResults).forEach(key => {
                if (key.startsWith('Mes')) {
                    const monthNum = parseInt(key.replace('Mes', ''));
                    const [startYear, startMonth] = startDate.split('-').map(Number);
                    const totalMonths = (startYear * 12 + startMonth - 1) + (monthNum - 1);
                    const targetYear = Math.floor(totalMonths / 12);
                    const targetMonth = (totalMonths % 12) + 1;
                    const dateKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
                    const result = localResults[key];
                    costsByDate[dateKey] = {
                        marketingCost: result?.marketingCost || 0,
                        operationalCost: result?.operationalCost || 0
                    };
                }
            });
        }
        return costsByDate;
    }, [selectedCity?.implementationStartDate, selectedPlan?.startDate, localResults]);

    const getPhaseProgress = (phaseName: string) => {
        if (!selectedPlan) return 0;
        const phase = selectedPlan.phases.find(p => p.name === phaseName);
        if (!phase || phase.actions.length === 0) return 0;
        const completedCount = phase.actions.filter(a => a.completed).length;
        return (completedCount / phase.actions.length) * 100;
    };

    const renderProgressBar = () => {
        if (!selectedCity) return null;

        if (selectedCity.status === CityStatus.Consolidated) {
             return (
                 <div className="w-full bg-base-300 dark:bg-dark-300 rounded-full h-4 mb-2">
                    <div className="bg-gradient-to-r from-blue-500 to-primary h-4 rounded-full transition-all duration-700 shadow-sm" style={{ width: `${Math.min(100, overallProgress)}%` }}></div>
                </div>
             );
        }
        
        const pAnalysis = getPhaseProgress('Análise & Viabilidade');
        const pPrep = getPhaseProgress('Preparação Operacional');
        const isPlanningComplete = pAnalysis >= 100 && pPrep >= 100;

        const isEffectiveExpansion = selectedCity.status === CityStatus.Expansion || (selectedCity.status === CityStatus.Planning && isPlanningComplete);

        if (!isEffectiveExpansion) {
             const p1 = pAnalysis;
             const p2 = pPrep;
             return (
                <div className="w-full bg-base-300 rounded-full h-4 dark:bg-dark-200 mt-2 flex relative text-white text-[10px] items-center overflow-hidden font-bold mb-2">
                    <div className="bg-green-500 h-full flex items-center justify-center" style={{ width: `${p1 / 2}%` }} title={`Análise: ${p1.toFixed(0)}%`}>
                        {p1 > 25 && `${p1.toFixed(0)}%`}
                    </div>
                    <div className="bg-blue-500 h-full flex items-center justify-center" style={{ width: `${p2 / 2}%` }} title={`Preparação: ${p2.toFixed(0)}%`}>
                        {p2 > 25 && `${p2.toFixed(0)}%`}
                    </div>
                </div>
             );
        } else {
             const p1 = getPhaseProgress('Aquisição de Motoristas');
             const p2 = getPhaseProgress('Marketing & Lançamento');
             const p3 = getPhaseProgress('Aquisição de Passageiros');
             const p4 = getPhaseProgress('Pós-Lançamento & Otimização');
             return (
                <div className="w-full bg-base-300 rounded-full h-4 dark:bg-dark-200 mt-2 flex relative text-white text-[10px] items-center overflow-hidden font-bold mb-2">
                    <div className="bg-blue-500 h-full flex items-center justify-center" style={{ width: `${p1 / 4}%` }} title={`Motoristas: ${p1.toFixed(0)}%`}>{p1 > 25 && `${p1.toFixed(0)}%`}</div>
                    <div className="bg-sky-500 h-full flex items-center justify-center" style={{ width: `${p2 / 4}%` }} title={`Marketing: ${p2.toFixed(0)}%`}>{p2 > 25 && `${p2.toFixed(0)}%`}</div>
                    <div className="bg-green-500 h-full flex items-center justify-center" style={{ width: `${p3 / 4}%` }} title={`Passageiros: ${p3.toFixed(0)}%`}>{p3 > 25 && `${p3.toFixed(0)}%`}</div>
                    <div className="bg-teal-500 h-full flex items-center justify-center" style={{ width: `${p4 / 4}%` }} title={`Otimização: ${p4.toFixed(0)}%`}>{p4 > 25 && `${p4.toFixed(0)}%`}</div>
                </div>
             );
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/planejamento')} className="p-2 rounded-full hover:bg-base-200 dark:hover:bg-dark-100 transition"><FiArrowLeft className="w-6 h-6"/></button>
                    <h2 className="text-2xl font-bold">Planejamento Financeiro: {selectedCity.name}</h2>
                </div>
                <button
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition"
                    title="Remover cidade do planejamento"
                >
                    <FiTrash2 className="w-4 h-4" />
                    <span>Remover Planejamento</span>
                </button>
            </div>

            {/* Card para Editar Data de Implementação */}
            <Card className="mb-6" key={`impl-date-${selectedCity?.implementationStartDate}`}>
                <div className="bg-gradient-to-br from-base-100 to-base-200 dark:from-dark-200 dark:to-dark-100 p-6 rounded-xl border border-base-300 dark:border-dark-100 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FiCalendar className="text-primary w-5 h-5" />
                            <div>
                                <h4 className="font-bold text-base text-gray-800 dark:text-gray-100">Data Inicial de Atividades</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Define o ponto de início para contagem de metas graduais</p>
                            </div>
                        </div>
                        {!isEditingImplementationDate ? (
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                        {(() => {
                                            console.log('🔍 Card render:', { 
                                                cityName: selectedCity?.name, 
                                                implDate: selectedCity?.implementationStartDate,
                                                editedDate: editedImplementationDate
                                            });
                                            if (!selectedCity?.implementationStartDate) return 'Não definida';
                                            
                                            // Parse sem timezone issues
                                            const parts = selectedCity.implementationStartDate.split('-').map(Number);
                                            const year = parts[0];
                                            const month = parts[1];
                                            const day = parts[2] || 1; // Se não tiver dia, usar 1º do mês
                                            const date = new Date(year, month - 1, day);
                                            return date.toLocaleDateString('pt-BR');
                                        })()}
                                    </p>
                                    {selectedCity?.implementationStartDate && (
                                        <p className="text-xs text-gray-500">
                                            {(() => {
                                                const [year, month] = selectedCity.implementationStartDate.split('-').map(Number);
                                                const monthDiff = (new Date().getFullYear() - year) * 12 + (new Date().getMonth() + 1 - month) + 1;
                                                return `Mês ${Math.min(monthDiff, 6)} de 6`;
                                            })()}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsEditingImplementationDate(true)}
                                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
                                    title="Editar data de implementação"
                                >
                                    <FiEdit className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={editedImplementationDate}
                                    onChange={(e) => setEditedImplementationDate(e.target.value)}
                                    className="p-2 rounded-lg border border-base-300 dark:border-dark-100 bg-base-100 dark:bg-dark-300 text-gray-800 dark:text-gray-100"
                                />
                                <button
                                    onClick={handleSaveImplementationDate}
                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                                    title="Salvar data"
                                >
                                    <FiSave className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsEditingImplementationDate(false)}
                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                    title="Cancelar"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Tabs Navigation */}
            <div className="flex gap-2 mb-6 border-b border-base-300 dark:border-dark-100 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
                        activeTab === 'overview'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <FiTrendingUp className="w-5 h-5" />
                        Visão Geral
                    </div>
                </button>
            </div>

            {/* Tab Content: Overview */}
            {activeTab === 'overview' && (
                <>
                {/* Dados Reais de Corridas */}
                <CityRidesData 
                cityName={selectedCity.name} 
                population15to44={selectedCity.population15to44}
                metaReceita={calculatePotentialRevenue(selectedCity, 'Média')}
                monthlyCosts={(() => {
                    // Converter localResults para formato de data YYYY-MM
                    const costsByDate: { [key: string]: { marketingCost: number; operationalCost: number } } = {};
                    if (selectedPlan?.startDate) {
                        Object.keys(localResults).forEach(key => {
                            if (key.startsWith('Mes')) {
                                const monthNum = parseInt(key.replace('Mes', ''));
                                // Parse start date components
                                const [startYear, startMonth] = selectedPlan.startDate.split('-').map(Number);
                                // Calculate target month (Mes1 = month before start, so startMonth + (monthNum - 2))
                                // Converter startMonth de 1-indexed para 0-indexed antes de calcular
                                const totalMonths = (startYear * 12 + (startMonth - 1)) + (monthNum - 2);
                                const targetYear = Math.floor(totalMonths / 12);
                                const targetMonth = (totalMonths % 12) + 1;
                                const dateKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
                                const result = localResults[key];
                                // SEMPRE incluir, mesmo sem dados
                                costsByDate[dateKey] = {
                                    marketingCost: result?.marketingCost || 0,
                                    operationalCost: result?.operationalCost || 0
                                };
                            }
                        });
                    }
                    return costsByDate;
                })()}
                planResults={(() => {
                    // Usar growthRoadmapMedia (metas oficiais) para preencher os dados esperados
                    const resultsByDate: { [key: string]: { rides: number; marketingCost: number; operationalCost: number } } = {};
                    if (selectedPlan?.startDate && growthRoadmapMedia.length > 0) {
                        growthRoadmapMedia.forEach((roadmapItem) => {
                            const [startYear, startMonth] = selectedPlan.startDate.split('-').map(Number);
                            const totalMonths = (startYear * 12 + (startMonth - 1)) + (roadmapItem.month - 1);
                            const targetYear = Math.floor(totalMonths / 12);
                            const targetMonth = (totalMonths % 12) + 1;
                            const dateKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
                            
                            // Pegar valores de custo de localResults se existir, senão usar 0
                            let marketingCost = 0;
                            let operationalCost = 0;
                            const mesKey = `Mes${roadmapItem.month}`;
                            if (localResults[mesKey]) {
                                marketingCost = localResults[mesKey].marketingCost || 0;
                                operationalCost = localResults[mesKey].operationalCost || 0;
                            }
                            
                            resultsByDate[dateKey] = {
                                rides: roadmapItem.rides,
                                marketingCost,
                                operationalCost
                            };
                        });
                    }
                    return resultsByDate;
                })()}
                onCostsChange={handleMonthlyCostChange}
                isEditingCosts={isEditingMonthlyCosts}
                onToggleEditCosts={() => {
                    if (isEditingMonthlyCosts && hasUnsavedChanges) {
                        handleSaveChanges();
                    }
                    setIsEditingMonthlyCosts(!isEditingMonthlyCosts);
                }}
                onRidesDataLoad={handleRidesDataLoad}
            />

            {/* Projeção vs Realidade Financeira */}
            <FinancialProjection
                key={selectedCity.name + '-' + (selectedPlan?.startDate || '')}
                cityName={selectedCity.name}
                monthlyCosts={calculatedMonthlyCosts}
                monthlyRealCosts={realMonthlyCosts}
                expectedRides={calculatedExpectedRides}
                actualRides={realRidesData}
                projectedRevenue={Object.fromEntries(Object.entries(calculatedProjectedRevenue).slice(0, 6))}
                actualRevenue={calculatedActualRevenue}
                onCostsChange={handleMonthlyCostChange}
                isEditing={isEditingMonthlyCosts}
                onToggleEdit={() => {
                    if (isEditingMonthlyCosts && hasUnsavedChanges) {
                        handleSaveChanges();
                    }
                    setIsEditingMonthlyCosts(!isEditingMonthlyCosts);
                }}
            />

            <Card className="mb-6">
                {/* GRÁFICO DE PROGRESSO DE METAS */}
                <div className="bg-gradient-to-br from-base-100 to-base-200 dark:from-dark-200 dark:to-dark-100 p-6 rounded-xl border border-base-300 dark:border-dark-100 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-base text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <FiTarget className="text-primary text-xl"/> 
                            <span>Progresso de Metas - {currentMonthLabel}</span>
                        </h4>
                        <span className="text-2xl font-bold text-primary">{overallProgress.toFixed(1)}%</span>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="mb-6">
                        <div className="w-full bg-base-300 dark:bg-dark-300 rounded-full h-6 mb-3 shadow-inner">
                            <div 
                                className="bg-gradient-to-r from-blue-500 via-primary to-purple-500 h-6 rounded-full transition-all duration-700 shadow-lg flex items-center justify-end pr-3" 
                                style={{ width: `${Math.min(100, overallProgress)}%` }}
                            >
                                {overallProgress > 10 && (
                                    <span className="text-white text-xs font-bold">{overallProgress.toFixed(1)}%</span>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                            <div className="text-gray-600 dark:text-gray-400">
                                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{currentRides}</span>
                                <span className="text-xs ml-1">passageiros</span>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-right">
                                <span className="text-xs mr-1">meta:</span>
                                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{Math.round(mediumMonthlyTarget)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Gráfico de Evolução */}
                    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#164e63] p-6 rounded-2xl border border-cyan-500/20 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="text-base font-bold text-white flex items-center gap-2.5">
                                <div className="p-2 bg-cyan-400/20 rounded-lg border border-cyan-400/30">
                                    <FiTrendingUp className="text-cyan-300 w-5 h-5"/>
                                </div>
                                Evolução Real vs Metas
                            </h5>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-full font-semibold text-xs">
                                    {Object.keys(localResults).length} meses
                                </span>
                                <div className="flex items-center gap-1 bg-dark-100/50 border border-cyan-500/20 rounded-lg p-1">
                                    <button
                                        onClick={() => applyZoom('3m')}
                                        className={`px-3 py-1.5 rounded-md font-semibold text-xs transition ${
                                            activeZoomPeriod === '3m'
                                                ? 'bg-cyan-500/40 text-white border border-cyan-400/50'
                                                : 'text-gray-300 hover:bg-cyan-500/20 border border-transparent hover:border-cyan-400/30'
                                        }`}
                                    >
                                        3M
                                    </button>
                                    <button
                                        onClick={() => applyZoom('6m')}
                                        className={`px-3 py-1.5 rounded-md font-semibold text-xs transition ${
                                            activeZoomPeriod === '6m'
                                                ? 'bg-cyan-500/40 text-white border border-cyan-400/50'
                                                : 'text-gray-300 hover:bg-cyan-500/20 border border-transparent hover:border-cyan-400/30'
                                        }`}
                                    >
                                        6M
                                    </button>
                                    <button
                                        onClick={() => applyZoom('1a')}
                                        className={`px-3 py-1.5 rounded-md font-semibold text-xs transition ${
                                            activeZoomPeriod === '1a'
                                                ? 'bg-cyan-500/40 text-white border border-cyan-400/50'
                                                : 'text-gray-300 hover:bg-cyan-500/20 border border-transparent hover:border-cyan-400/30'
                                        }`}
                                    >
                                        1A
                                    </button>
                                    <button
                                        onClick={() => applyZoom('all')}
                                        className={`px-3 py-1.5 rounded-md font-semibold text-xs transition ${
                                            activeZoomPeriod === 'all'
                                                ? 'bg-cyan-500/40 text-white border border-cyan-400/50'
                                                : 'text-gray-300 hover:bg-cyan-500/20 border border-transparent hover:border-cyan-400/30'
                                        }`}
                                    >
                                        Todos
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="h-80" onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                            <Line 
                                ref={chartRef}
                                data={growthChartData} 
                                options={growthChartOptions}
                            />
                        </div>
                        
                        {/* Informações do Mês Selecionado */}
                        {selectedChartMonth !== null && (
                            <div className="mt-6 pt-6 border-t border-cyan-500/20">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2">Mês Selecionado</p>
                                        <p className="text-2xl font-bold text-cyan-300">Mês {selectedChartMonth}</p>
                                    </div>
                                    
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2">Resultado Real</p>
                                        <p className="text-2xl font-bold text-blue-300">
                                            {growthChartData.datasets[3].data[selectedChartMonth] !== null 
                                                ? Math.round(growthChartData.datasets[3].data[selectedChartMonth] as number).toLocaleString('pt-BR') 
                                                : '-'}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2">Meta Média (10%)</p>
                                        <p className="text-2xl font-bold text-amber-300">
                                            {growthChartData.datasets[1].data[selectedChartMonth] !== null && growthChartData.datasets[1].data[selectedChartMonth] !== undefined
                                                ? Math.round(growthChartData.datasets[1].data[selectedChartMonth] as number).toLocaleString('pt-BR') 
                                                : '-'}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2">Variação %</p>
                                        {(() => {
                                            const real = growthChartData.datasets[3].data[selectedChartMonth];
                                            const meta = growthChartData.datasets[1].data[selectedChartMonth];
                                            if (real === null || meta === 0) return <p className="text-2xl font-bold text-slate-300">-</p>;
                                            const variacaoPercent = ((real as number / (meta as number)) * 100).toFixed(1);
                                            const isPositive = (real as number) >= (meta as number);
                                            return (
                                                <p className={`text-2xl font-bold ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                                                    {variacaoPercent}%
                                                </p>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </Card>

            <div>
                <h3 className="text-lg font-bold mb-4 ml-1">Fases Operacionais do Plano</h3>
                <div className="space-y-4">
                    {selectedPlan?.phases.map(phase => <PhaseAccordion key={phase.name} phase={phase} cityId={selectedCity.id} />)}
                </div>
            </div>

            </>
            )}

            {/* Modal de Confirmação de Exclusão */}
            <Modal isOpen={showDeleteConfirmation} onClose={() => setShowDeleteConfirmation(false)}>
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <FiAlertCircle className="w-6 h-6 text-red-500" />
                        <h3 className="text-xl font-bold">Remover Planejamento</h3>
                    </div>
                    <p className="text-base-content/70 dark:text-dark-text-secondary mb-6">
                        Tem certeza que deseja remover o planejamento de <strong>{selectedCity?.name}</strong>? 
                        Esta ação não pode ser desfeita e todos os dados de planejamento e resultados serão excluídos.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowDeleteConfirmation(false)}
                            className="px-4 py-2 rounded-lg bg-base-200 hover:bg-base-300 dark:bg-dark-100 dark:hover:bg-dark-200 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDeletePlan}
                            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
                        >
                            Remover
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PlanningDetails;

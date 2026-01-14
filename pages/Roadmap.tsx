
import React, { useState, useContext, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import { DataContext } from '../context/DataContext';
import { PHASE_COLORS } from '../constants';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiList, FiX, FiCheckCircle, FiLink, FiEdit2, FiAlertCircle, FiChevronDown, FiChevronUp, FiActivity, FiSun, FiMove, FiFilter, FiSearch, FiEye, FiEyeOff, FiStar, FiCheckSquare, FiSquare, FiClock, FiAlertTriangle, FiArrowRight, FiTag } from 'react-icons/fi';
import { 
    addMonths, 
    getMonthName, 
    daysInMonth,
    addDays,
    startOfMonth,
    endOfMonth,
    isSameDay,
    isToday
} from '../utils/dateUtils';
import { PlanningPhase, CityStatus, Mesorregion, Tag, Responsible } from '../types';
import { formatMesorregion } from '../utils/textUtils';
import Modal from '../components/ui/Modal';

type ViewMode = 'month' | 'timeline';

// Helper to get color class
const getPhaseColor = (phaseName: string) => {
    return PHASE_COLORS[phaseName]?.bg || 'bg-gray-500';
};

interface CalendarEvent {
    id: string;
    title: string;
    city: string;
    cityId: number;
    type: 'phase';
    startDate: string;
    endDate?: string;
    color: string;
    phase: PlanningPhase;
    isCompleted: boolean;
    progress: number;
    isOverdue: boolean;
}

interface DraggedItem {
    id: string;
    cityId: number;
    phaseName: string;
    originalStart: string;
    originalEnd?: string;
    durationDays: number;
}

// Interfaces para a nova Agenda Diária
interface DailyActionItem {
    id: string;
    description: string;
    cityId: number;
    cityName: string;
    cityStatus: CityStatus;
    phaseName: string;
    completed: boolean;
    dueDate?: string;
    status: 'overdue' | 'today' | 'upcoming' | 'completed';
    simulatedTime: string; // Para dar a sensação de agenda
    tagIds?: string[]; // IDs das etiquetas
    responsibleId?: string; // ID do responsável
}

// Sub-componente para Legenda de Etiquetas
const TagSummary: React.FC<{ actions: DailyActionItem[], allTags: Tag[] }> = ({ actions, allTags }) => {
    const counts = useMemo(() => {
        const c: Record<string, number> = {};
        actions.forEach(a => {
            a.tagIds?.forEach(id => {
                c[id] = (c[id] || 0) + 1;
            });
        });
        return c;
    }, [actions]);

    const activeTagIds = Object.keys(counts);

    if (activeTagIds.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-4 px-1 pb-2 border-b border-base-200 dark:border-dark-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase self-center mr-1">Resumo:</span>
            {activeTagIds.map(id => {
                const tag = allTags.find(t => t.id === id);
                if (!tag) return null;
                return (
                    <div key={id} className="text-[10px] pl-2 pr-1 py-0.5 rounded-full text-white font-medium flex items-center shadow-sm" style={{ backgroundColor: tag.color }}>
                        <span className="mr-1.5">{tag.label}</span>
                        <span className="bg-white/30 px-1.5 rounded-full text-[9px] min-w-[16px] text-center">{counts[id]}</span>
                    </div>
                );
            })}
        </div>
    );
};

const Roadmap: React.FC = () => {
    const { cities, plans, updatePlanPhase, updatePlanAction, tags, responsibles } = useContext(DataContext);
    
    // View State
    const [selectedDayDate, setSelectedDayDate] = useState(new Date());
    const [roadmapDate, setRoadmapDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('timeline');
    
    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<CityStatus | 'Todos'>('Todos');
    const [filterRegion, setFilterRegion] = useState<Mesorregion | 'Todos'>('Todos');
    const [hideEmptyRows, setHideEmptyRows] = useState(true);
    const [showFilters, setShowFilters] = useState(true);

    // Edit Modal State
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [editingLinkActionId, setEditingLinkActionId] = useState<string | null>(null);
    const [tempLinkValue, setTempLinkValue] = useState('');
    
    // Drag and Drop State
    const [draggedAction, setDraggedAction] = useState<DraggedItem | null>(null);
    
    // Expanded States
    const [expandedPhaseIds, setExpandedPhaseIds] = useState<Set<string>>(new Set());

    // Real-time
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000); 
        return () => clearInterval(interval);
    }, []);

    // Helper para resolver Tags
    const getActionTags = (tagIds?: string[]) => {
        if (!tagIds || tagIds.length === 0) return [];
        return tagIds.map(id => tags.find(t => t.id === id)).filter(Boolean) as Tag[];
    };
    
    // Helper para resolver Responsible
    const getResponsible = (id?: string) => {
        if (!id) return null;
        return responsibles.find(r => r.id === id);
    };

    // --- FILTER LOGIC ---
    
    const filteredData = useMemo(() => {
        const monthStart = startOfMonth(roadmapDate);
        const monthEnd = endOfMonth(roadmapDate);

        // 1. Filter Cities/Plans based on static criteria
        let activePlans = plans.filter(plan => {
            const city = cities.find(c => c.id === plan.cityId);
            if (!city) return false;

            const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'Todos' || city.status === filterStatus;
            const matchesRegion = filterRegion === 'Todos' || city.mesorregion === filterRegion;

            return matchesSearch && matchesStatus && matchesRegion;
        });

        // 2. Filter based on Activity in the current month (Hide Empty Rows)
        if (hideEmptyRows) {
            activePlans = activePlans.filter(plan => {
                return plan.phases.some(phase => {
                    const pStart = new Date(phase.startDate);
                    const pEnd = phase.estimatedCompletionDate 
                        ? new Date(phase.estimatedCompletionDate) 
                        : new Date(pStart.getTime() + (30 * 24 * 60 * 60 * 1000));
                    
                    // Check overlap
                    return (pStart <= monthEnd && pEnd >= monthStart);
                });
            });
        }

        // Return combined data for rendering
        return activePlans.map(plan => {
            const city = cities.find(c => c.id === plan.cityId);
            return { city, plan };
        }).filter(item => item.city !== undefined) as { city: any, plan: any }[];

    }, [plans, cities, searchTerm, filterStatus, filterRegion, hideEmptyRows, roadmapDate]);

    // --- DAILY ACTIONS LOGIC (Nova Lógica para a Agenda) ---
    const dailyActions = useMemo(() => {
        const actions: DailyActionItem[] = [];
        
        // Helper para simular horários baseados no ID (para consistência visual)
        const getSimulatedTime = (id: string, index: number) => {
            const hours = [9, 10, 11, 14, 15, 16];
            const hour = hours[index % hours.length];
            return `${hour.toString().padStart(2, '0')}:00`;
        };

        let actionCounter = 0;

        plans.forEach(plan => {
            const city = cities.find(c => c.id === plan.cityId);
            if (!city) return;
            
            // Aplica filtros também na agenda diária para consistência
            if (searchTerm && !city.name.toLowerCase().includes(searchTerm.toLowerCase())) return;
            if (filterStatus !== 'Todos' && city.status !== filterStatus) return;
            if (filterRegion !== 'Todos' && city.mesorregion !== filterRegion) return;

            plan.phases.forEach(phase => {
                phase.actions.forEach(action => {
                    const createdAt = new Date(action.createdAt);
                    const dueDate = action.estimatedCompletionDate ? new Date(action.estimatedCompletionDate) : null;
                    const isCompleted = action.completed;

                    let status: DailyActionItem['status'] | null = null;

                    // 1. Atrasados (Só mostramos se estivermos vendo o dia de HOJE, para não poluir histórico)
                    if (isToday(selectedDayDate) && !isCompleted && dueDate && dueDate < startOfMonth(selectedDayDate)) {
                        status = 'overdue';
                    }
                    // 2. Para Hoje (Data de vencimento é hoje OU Data de criação é hoje)
                    else if (dueDate && isSameDay(dueDate, selectedDayDate)) {
                        status = isCompleted ? 'completed' : 'today';
                    }
                    else if (isSameDay(createdAt, selectedDayDate)) {
                        status = isCompleted ? 'completed' : 'today';
                    }

                    if (status) {
                        actions.push({
                            id: action.id,
                            description: action.description,
                            cityId: city.id,
                            cityName: city.name,
                            cityStatus: city.status,
                            phaseName: phase.name,
                            completed: isCompleted,
                            dueDate: action.estimatedCompletionDate,
                            status: status,
                            simulatedTime: getSimulatedTime(action.id, actionCounter++),
                            tagIds: action.tagIds,
                            responsibleId: action.responsibleId
                        });
                    }
                });
            });
        });

        // Ordenação: Atrasados primeiro, depois por status de conclusão, depois cidade
        return actions.sort((a, b) => {
            if (a.status === 'overdue' && b.status !== 'overdue') return -1;
            if (a.status !== 'overdue' && b.status === 'overdue') return 1;
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return a.cityName.localeCompare(b.cityName);
        });
    }, [plans, cities, selectedDayDate, searchTerm, filterStatus, filterRegion]);

    // --- WEEKLY ACTIONS LOGIC (Nova Lógica para Resumo Semanal) ---
    const weeklyActions = useMemo(() => {
        // Generate next 7 days starting from selected day + 1
        const next7Days = Array.from({ length: 7 }, (_, i) => addDays(selectedDayDate, i + 1));
        const summary: { date: Date, actions: DailyActionItem[], density: number }[] = [];

        next7Days.forEach(day => {
            const dayActions: DailyActionItem[] = [];
            let density = 0;

            plans.forEach(plan => {
                const city = cities.find(c => c.id === plan.cityId);
                if (!city) return;
                
                // Apply same filters as main view for consistency
                if (searchTerm && !city.name.toLowerCase().includes(searchTerm.toLowerCase())) return;
                if (filterStatus !== 'Todos' && city.status !== filterStatus) return;
                if (filterRegion !== 'Todos' && city.mesorregion !== filterRegion) return;

                plan.phases.forEach(phase => {
                    phase.actions.forEach(action => {
                        const dueDate = action.estimatedCompletionDate ? new Date(action.estimatedCompletionDate) : null;
                        
                        // Check for Exact Match on Date (Future tasks only)
                        if (dueDate && isSameDay(dueDate, day) && !action.completed) {
                            dayActions.push({
                                id: action.id,
                                description: action.description,
                                cityId: city.id,
                                cityName: city.name,
                                cityStatus: city.status,
                                phaseName: phase.name,
                                completed: false,
                                dueDate: action.estimatedCompletionDate,
                                status: 'upcoming',
                                simulatedTime: '',
                                tagIds: action.tagIds,
                                responsibleId: action.responsibleId
                            });
                            density++;
                        }
                    });
                });
            });

            if (dayActions.length > 0 || density > 0) {
                 summary.push({
                    date: day,
                    actions: dayActions.sort((a, b) => a.cityName.localeCompare(b.cityName)),
                    density
                });
            }
        });

        return summary;
    }, [plans, cities, selectedDayDate, searchTerm, filterStatus, filterRegion]);


    // Navigation Logic
    const handlePrevDay = () => setSelectedDayDate(addDays(selectedDayDate, -1));
    const handleNextDay = () => setSelectedDayDate(addDays(selectedDayDate, 1));
    const handleTodayDay = () => setSelectedDayDate(new Date());

    const handlePrevMonth = () => setRoadmapDate(addMonths(roadmapDate, -1));
    const handleNextMonth = () => setRoadmapDate(addMonths(roadmapDate, 1));
    const handleTodayMonth = () => setRoadmapDate(new Date());

    // Modal & Edit Logic
    const openEditModal = (evt: CalendarEvent) => {
        setSelectedEvent(evt);
        setEditStartDate(evt.startDate.split('T')[0]);
        const end = evt.endDate ? evt.endDate.split('T')[0] : '';
        setEditEndDate(end);
        setEditingLinkActionId(null);
    };

    const handleSaveChanges = () => {
        if (selectedEvent) {
            updatePlanPhase(selectedEvent.cityId, selectedEvent.title, {
                startDate: new Date(editStartDate).toISOString(),
                estimatedCompletionDate: editEndDate ? new Date(editEndDate).toISOString() : undefined,
            });
            setSelectedEvent(null);
        }
    };

    const handleToggleAction = (item: DailyActionItem) => {
        updatePlanAction(item.cityId, item.phaseName, item.id, { completed: !item.completed });
    };

    // Expansion Logic
    const togglePhaseExpansion = (phaseId: string) => {
        setExpandedPhaseIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(phaseId)) newSet.delete(phaseId);
            else newSet.add(phaseId);
            return newSet;
        });
    };

    const toggleCityAllPhases = (cityId: number, phaseCount: number) => {
        setExpandedPhaseIds(prev => {
            const newSet = new Set(prev);
            const cityPhaseIds = Array.from({ length: phaseCount }, (_, i) => `${cityId}-${i}`);
            const allOpen = cityPhaseIds.every(id => newSet.has(id));

            if (allOpen) cityPhaseIds.forEach(id => newSet.delete(id));
            else cityPhaseIds.forEach(id => newSet.add(id));
            return newSet;
        });
    };

    // Drag & Drop
    const handleDragStart = (e: React.DragEvent, action: any, cityId: number, phaseName: string) => {
        const start = new Date(action.createdAt);
        const end = action.estimatedCompletionDate 
            ? new Date(action.estimatedCompletionDate) 
            : new Date(start.getTime() + (5 * 24 * 60 * 60 * 1000));
        const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

        setDraggedAction({
            id: action.id, cityId, phaseName,
            originalStart: action.createdAt,
            originalEnd: action.estimatedCompletionDate,
            durationDays
        });
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, cityId: number, phaseName: string) => {
        e.preventDefault();
        if (!draggedAction || draggedAction.cityId !== cityId || draggedAction.phaseName !== phaseName) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const scrollLeft = e.currentTarget.scrollLeft;
        const PIXELS_PER_DAY = 40;
        
        const daysOffset = Math.floor((offsetX + scrollLeft) / PIXELS_PER_DAY);
        const monthStart = startOfMonth(roadmapDate);
        
        const newStartDate = new Date(monthStart);
        newStartDate.setDate(newStartDate.getDate() + daysOffset);
        
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + draggedAction.durationDays);
        
        updatePlanAction(cityId, phaseName, draggedAction.id, {
            estimatedCompletionDate: newEndDate.toISOString(),
            // In a real app we might also update createdAt if the logic allows moving start date
        });
        setDraggedAction(null);
    };

    // --- RENDERERS ---

    const renderFilterBar = () => (
        <div className={`bg-base-100 dark:bg-dark-200 border-b border-base-300 dark:border-dark-100 transition-all duration-300 overflow-hidden ${showFilters ? 'p-4 max-h-40 opacity-100' : 'max-h-0 p-0 opacity-0'}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Buscar Cidade</label>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Ex: Sinop" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 p-2 rounded-lg bg-base-200 dark:bg-dark-300 border border-base-300 dark:border-dark-100 focus:ring-primary focus:border-primary text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Status</label>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="w-full p-2 rounded-lg bg-base-200 dark:bg-dark-300 border border-base-300 dark:border-dark-100 focus:ring-primary focus:border-primary text-sm"
                    >
                        <option value="Todos">Todos os Status</option>
                        {Object.values(CityStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Região</label>
                    <select 
                        value={filterRegion}
                        onChange={(e) => setFilterRegion(e.target.value as any)}
                        className="w-full p-2 rounded-lg bg-base-200 dark:bg-dark-300 border border-base-300 dark:border-dark-100 focus:ring-primary focus:border-primary text-sm"
                    >
                        <option value="Todos">Todas as Regiões</option>
                        {Object.values(Mesorregion).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="flex items-center pb-2">
                    <button 
                        onClick={() => setHideEmptyRows(!hideEmptyRows)}
                        className={`flex items-center text-sm font-medium transition-colors ${hideEmptyRows ? 'text-primary' : 'text-gray-500'}`}
                    >
                        {hideEmptyRows ? <FiEyeOff className="mr-2"/> : <FiEye className="mr-2"/>}
                        {hideEmptyRows ? 'Ocultando sem atividade' : 'Mostrando tudo'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderActionCard = (action: DailyActionItem) => {
        const isOverdue = action.status === 'overdue';
        const actionTags = getActionTags(action.tagIds);
        const responsible = getResponsible(action.responsibleId);

        return (
            <div key={action.id} className={`flex items-start p-3 mb-2 rounded-lg border transition-all hover:shadow-md ${action.completed ? 'bg-gray-500/5 dark:bg-dark-200 border-gray-200 dark:border-dark-100 opacity-75' : isOverdue ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-base-100 dark:bg-dark-200 border-base-300 dark:border-dark-100'}`}>
                {/* Time Column (Simulated) */}
                <div className={`flex flex-col items-center justify-center mr-4 w-12 pt-1 ${action.completed ? 'text-gray-400' : isOverdue ? 'text-red-500' : 'text-primary'}`}>
                    <span className="text-xs font-bold">{action.simulatedTime}</span>
                    <FiClock className="w-3 h-3 mt-1 opacity-50"/>
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex-grow">
                             <div className="flex items-center mb-1 flex-wrap gap-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${
                                    action.cityStatus === 'Consolidada' ? 'bg-green-100 text-green-800' : 
                                    action.cityStatus === 'Em expansão' ? 'bg-orange-100 text-orange-800' : 
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                    {action.cityName}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">{action.phaseName}</span>
                            </div>
                            <h4 className={`text-sm font-medium ${action.completed ? 'line-through text-gray-500' : isOverdue ? 'text-red-700 dark:text-red-400' : 'text-content dark:text-dark-content'}`}>
                                {action.description}
                            </h4>
                            
                            {/* Tags & Responsible Display */}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {/* Responsible Avatar */}
                                {responsible && (
                                    <div 
                                        className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-gray-700"
                                        title={`Responsável: ${responsible.name}`}
                                    >
                                        <div 
                                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                                            style={{ backgroundColor: responsible.color }}
                                        >
                                            {responsible.initials}
                                        </div>
                                    </div>
                                )}

                                {/* Tags */}
                                {actionTags.length > 0 && actionTags.map(tag => (
                                    <span 
                                        key={tag.id} 
                                        className="text-[9px] px-1.5 py-0.5 rounded text-white font-medium flex items-center shadow-sm"
                                        style={{ backgroundColor: tag.color }}
                                    >
                                        <FiTag size={8} className="mr-1" /> {tag.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button 
                            onClick={() => handleToggleAction(action)}
                            className={`ml-3 p-1 rounded-full transition-colors flex-shrink-0 ${action.completed ? 'text-primary hover:text-primary-600' : 'text-gray-300 hover:text-primary'}`}
                        >
                            {action.completed ? <FiCheckSquare className="w-6 h-6" /> : <FiSquare className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const overdueActions = dailyActions.filter(a => a.status === 'overdue');
        const todayActions = dailyActions.filter(a => a.status !== 'overdue');

        return (
            <Card className="h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-base-300 dark:border-dark-100 pb-4 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <FiSun className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Agenda Operacional</h2>
                            <p className="text-xs text-gray-500 capitalize">
                                {selectedDayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center bg-base-200 dark:bg-dark-300 rounded-lg p-1">
                        <button onClick={handlePrevDay} className="p-2 hover:bg-base-300 dark:hover:bg-dark-100 rounded-md"><FiChevronLeft /></button>
                        <button onClick={handleTodayDay} className="px-3 text-sm font-semibold hover:bg-base-300 dark:hover:bg-dark-100 rounded-md">Hoje</button>
                        <button onClick={handleNextDay} className="p-2 hover:bg-base-300 dark:hover:bg-dark-100 rounded-md"><FiChevronRight /></button>
                    </div>
                </div>

                {/* Tags Summary for Day View */}
                <TagSummary actions={dailyActions} allTags={tags} />

                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {dailyActions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <FiCalendar className="w-12 h-12 mb-2 opacity-50" />
                            <p className="font-medium">Nenhuma ação planejada para este dia.</p>
                            <p className="text-xs">Verifique o Roadmap Geral para adicionar tarefas.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Section: Overdue (Only if Today) */}
                            {overdueActions.length > 0 && (
                                <div>
                                    <div className="flex items-center mb-2 text-red-600 font-bold text-xs uppercase tracking-wider">
                                        <FiAlertTriangle className="mr-1" /> Atrasadas / Atenção
                                    </div>
                                    {overdueActions.map(renderActionCard)}
                                </div>
                            )}

                            {/* Section: Scheduled Today */}
                            {todayActions.length > 0 && (
                                <div>
                                     <div className="flex items-center mb-2 text-gray-500 font-bold text-xs uppercase tracking-wider">
                                        <FiClock className="mr-1" /> Cronograma do Dia
                                    </div>
                                    {todayActions.map(renderActionCard)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        );
    }

    const renderWeeklyView = () => {
         // Flatten all weekly actions for summary
         const allWeeklyActions = weeklyActions.flatMap(d => d.actions);

         return (
            <Card className="h-[500px] flex flex-col bg-base-100/50 dark:bg-dark-200/50 border-l border-base-300 dark:border-dark-100">
                 <div className="flex items-center mb-4 border-b border-base-300 dark:border-dark-100 pb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-3">
                        <FiCalendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Próximos Passos</h2>
                        <p className="text-xs text-gray-500">Visão de 7 dias</p>
                    </div>
                </div>
                
                {/* Tags Summary for Weekly View */}
                <TagSummary actions={allWeeklyActions} allTags={tags} />

                <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-4">
                    {weeklyActions.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-gray-400">
                             <p className="text-sm">Sem atividades futuras próximas.</p>
                        </div>
                    ) : (
                        weeklyActions.map((dayGroup, idx) => (
                            <div key={idx} className="relative pl-4 border-l-2 border-base-300 dark:border-dark-100">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${dayGroup.density > 0 ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                
                                <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 flex justify-between items-center">
                                    <span>{dayGroup.date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' })}</span>
                                    {dayGroup.density > 0 && <span className="px-1.5 py-0.5 bg-base-200 dark:bg-dark-300 rounded text-[9px]">{dayGroup.density} ações</span>}
                                </h4>

                                {dayGroup.actions.length === 0 ? (
                                    <p className="text-[10px] text-gray-400 italic mb-4">--</p>
                                ) : (
                                    <div className="space-y-2 mb-4">
                                        {dayGroup.actions.slice(0, 4).map(action => {
                                            const itemTags = getActionTags(action.tagIds);
                                            const responsible = getResponsible(action.responsibleId);
                                            
                                            return (
                                                <div key={action.id} className="bg-white dark:bg-dark-300 p-2 rounded border border-base-200 dark:border-dark-100 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-center">
                                                        <span className={`w-1 h-6 rounded-full mr-2 flex-shrink-0 ${
                                                            action.cityStatus === 'Consolidada' ? 'bg-green-500' : 
                                                            action.cityStatus === 'Em expansão' ? 'bg-orange-500' : 
                                                            'bg-blue-500'
                                                        }`}></span>
                                                        <div className="min-w-0 flex-grow">
                                                            <div className="flex items-center mb-0.5 justify-between">
                                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide truncate">{action.cityName}</span>
                                                                {responsible && (
                                                                     <div 
                                                                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm flex-shrink-0"
                                                                        style={{ backgroundColor: responsible.color }}
                                                                        title={responsible.name}
                                                                    >
                                                                        {responsible.initials}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-medium leading-tight line-clamp-1">{action.description}</p>
                                                        </div>
                                                    </div>
                                                    {/* Small Tags in Weekly View */}
                                                    {itemTags.length > 0 && (
                                                        <div className="flex gap-1 mt-1 pl-3">
                                                            {itemTags.slice(0, 2).map(tag => (
                                                                <span key={tag.id} className="block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} title={tag.label}></span>
                                                            ))}
                                                            {itemTags.length > 2 && <span className="text-[8px] text-gray-400">...</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {dayGroup.actions.length > 4 && (
                                            <div className="text-xs text-center text-primary font-medium cursor-pointer hover:underline flex items-center justify-center">
                                                + {dayGroup.actions.length - 4} mais <FiArrowRight className="ml-1 w-3 h-3"/>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Card>
         )
    }

    const renderTimelineView = () => {
        const daysCount = daysInMonth(roadmapDate);
        const days = Array.from({ length: daysCount }, (_, i) => i + 1);
        const PIXELS_PER_DAY = 40;
        const BASE_ROW_HEIGHT = 64;
        const ACTION_ROW_HEIGHT = 36;
        const SIDEBAR_WIDTH = 240; 

        // Current time line calculation
        const isCurrentMonth = roadmapDate.getMonth() === now.getMonth() && roadmapDate.getFullYear() === now.getFullYear();
        let redLineLeft = -1;
        if (isCurrentMonth) {
            const currentDay = now.getDate();
            const currentHour = now.getHours();
            const dayOffset = (currentDay - 1) * PIXELS_PER_DAY;
            const timeOffset = (currentHour / 24) * PIXELS_PER_DAY;
            redLineLeft = dayOffset + timeOffset;
        }

        if (filteredData.length === 0) {
            return (
                <div className="text-center py-20 bg-base-100 dark:bg-dark-200 rounded-xl border border-base-300 dark:border-dark-100">
                    <FiCalendar className="mx-auto text-4xl text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-semibold">Nenhuma atividade encontrada.</p>
                    <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros ou selecionar outro mês.</p>
                </div>
            );
        }

        return (
            <div className="bg-base-100 dark:bg-dark-200 rounded-b-xl shadow-sm border border-base-300 dark:border-dark-100 flex flex-col h-[600px] relative overflow-hidden">
                <div className="overflow-auto flex-grow custom-scrollbar relative h-full">
                    <div className="min-w-max relative">
                        
                        {/* Header Row */}
                        <div className="flex sticky top-0 z-40 bg-base-200 dark:bg-dark-300 border-b border-base-300 dark:border-dark-100 shadow-sm">
                            <div className="sticky left-0 w-[240px] flex-shrink-0 p-4 font-bold border-r border-base-300 dark:border-dark-100 bg-base-200 dark:bg-dark-300 z-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                Cidade / Fase
                            </div>
                            <div className="flex relative">
                                {days.map(day => {
                                    const d = new Date(roadmapDate.getFullYear(), roadmapDate.getMonth(), day);
                                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                    return (
                                        <div 
                                            key={day} 
                                            className={`flex-shrink-0 w-[40px] text-center border-r border-base-300 dark:border-dark-100 py-2 text-xs ${isWeekend ? 'bg-base-300/50 dark:bg-dark-100/50 text-gray-500' : ''} ${isToday(d) ? 'bg-primary/10 text-primary font-bold' : ''}`}
                                        >
                                            <div className="font-bold">{day}</div>
                                            <div className="text-[10px] uppercase">{d.toLocaleString('pt-BR', { weekday: 'narrow' })}</div>
                                        </div>
                                    );
                                })}
                                {/* Red Triangle Indicator in Header */}
                                {redLineLeft >= 0 && (
                                    <div className="absolute bottom-0 z-50 transform -translate-x-1/2 pointer-events-none" style={{ left: `${redLineLeft}px` }}>
                                         <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-red-500"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="relative">
                             {/* Red Line Overlay */}
                            {redLineLeft >= 0 && (
                                <div className="absolute top-0 bottom-0 w-px bg-red-500 z-0 pointer-events-none" style={{ left: `${SIDEBAR_WIDTH + redLineLeft}px` }}></div>
                            )}

                            {filteredData.map(({ city, plan }) => {
                                // Expansion Logic for this city row
                                const allPhasesIds = plan.phases.map((_, i) => `${city.id}-${i}`);
                                const isCityExpanded = allPhasesIds.length > 0 && allPhasesIds.every(id => expandedPhaseIds.has(id));

                                let totalHeight = BASE_ROW_HEIGHT;
                                let maxExpandedHeight = 0; 
                                let phasesRenderData: any[] = [];

                                plan.phases.forEach((phase: PlanningPhase, idx: number) => {
                                    const phaseId = `${city.id}-${idx}`;
                                    const isExpanded = expandedPhaseIds.has(phaseId);
                                    
                                    const pStart = new Date(phase.startDate);
                                    const pEnd = phase.estimatedCompletionDate 
                                        ? new Date(phase.estimatedCompletionDate) 
                                        : new Date(pStart.getTime() + (30 * 24 * 60 * 60 * 1000));

                                    const monthStart = startOfMonth(roadmapDate);
                                    const startDiff = (pStart.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24);
                                    const duration = (pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24);
                                    
                                    const left = Math.max(0, startDiff * PIXELS_PER_DAY);
                                    let width = duration * PIXELS_PER_DAY;
                                    if (startDiff < 0) width += (startDiff * PIXELS_PER_DAY);
                                    
                                    const isVisible = (startDiff * PIXELS_PER_DAY + width) > 0;
                                    
                                    let actionRowsHeight = 0;
                                    if (isExpanded) {
                                        actionRowsHeight = phase.actions.length * ACTION_ROW_HEIGHT;
                                        maxExpandedHeight = Math.max(maxExpandedHeight, actionRowsHeight);
                                    }

                                    phasesRenderData.push({
                                        phase, idx, id: phaseId, isExpanded, left, width: Math.max(PIXELS_PER_DAY, width), isVisible, actionRowsHeight
                                    });
                                });
                                
                                totalHeight += maxExpandedHeight;
                                if (maxExpandedHeight > 0) totalHeight += 24; 

                                return (
                                    <div key={city.id} className="flex border-b border-base-200 dark:border-dark-100 group relative" style={{ height: `${totalHeight}px` }}>
                                        {/* Sidebar */}
                                        <div 
                                            className="sticky left-0 w-[240px] flex-shrink-0 p-3 border-r border-base-300 dark:border-dark-100 bg-base-100 dark:bg-dark-200 z-30 font-medium text-sm hover:bg-base-200 dark:hover:bg-dark-100 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.05)] cursor-pointer group/city"
                                            onClick={() => toggleCityAllPhases(city.id, plan.phases.length)}
                                        >
                                            <div className="flex items-center justify-between h-10 w-full">
                                                <div className="flex items-center overflow-hidden mr-2">
                                                    <div className={`w-1.5 h-8 rounded-full mr-3 flex-shrink-0 shadow-sm ${city.status === 'Consolidada' ? 'bg-green-500' : city.status === 'Em expansão' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                                    <div>
                                                        <div className="truncate font-bold text-gray-700 dark:text-gray-200">{city.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-normal">{formatMesorregion(city.mesorregion)}</div>
                                                    </div>
                                                </div>
                                                <div className="text-gray-400 group-hover/city:text-primary transition-colors">
                                                    {isCityExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline Area */}
                                        <div className="flex relative flex-grow">
                                            {/* Grid Background */}
                                            <div className="absolute inset-0 flex h-full pointer-events-none z-0">
                                                {days.map(day => {
                                                    const d = new Date(roadmapDate.getFullYear(), roadmapDate.getMonth(), day);
                                                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                                    return <div key={day} className={`flex-shrink-0 w-[40px] border-r border-base-200 dark:border-dark-100 h-full ${isWeekend ? 'bg-base-200/20 dark:bg-dark-100/20' : ''}`}></div>;
                                                })}
                                            </div>

                                            {/* Render Items */}
                                            <div className="relative w-full h-full z-10">
                                                {phasesRenderData.map((data) => {
                                                    if (!data.isVisible) return null;
                                                    const { phase, id, isExpanded, left, width } = data;
                                                    const isFullyComplete = !!phase.completionDate;
                                                    const totalActions = phase.actions.length;
                                                    const completedActions = phase.actions.filter((a: any) => a.completed).length;
                                                    const progress = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

                                                    return (
                                                        <React.Fragment key={id}>
                                                            {/* Phase Bar with improved visuals */}
                                                            <div 
                                                                className={`absolute h-9 rounded-md shadow-sm text-white text-xs flex flex-col justify-center transition-all overflow-hidden border border-white/10 hover:shadow-md hover:translate-y-[-1px] z-20`}
                                                                style={{ 
                                                                    left: `${left}px`, 
                                                                    width: `${width}px`,
                                                                    top: '14px',
                                                                }}
                                                            >
                                                                <div 
                                                                    className="absolute inset-0 cursor-pointer"
                                                                    onClick={() => togglePhaseExpansion(id)}
                                                                >
                                                                    {/* Base Color with Gradient */}
                                                                    <div className={`absolute inset-0 ${getPhaseColor(phase.name)} opacity-20`}></div>
                                                                    <div 
                                                                        className={`absolute inset-y-0 left-0 ${getPhaseColor(phase.name)} ${isFullyComplete ? 'saturate-50' : ''} bg-gradient-to-r from-transparent to-white/10`} 
                                                                        style={{ width: `${isFullyComplete ? 100 : progress}%` }}
                                                                    ></div>
                                                                </div>

                                                                <div className="relative z-10 px-2 flex items-center justify-between w-full pointer-events-none">
                                                                    <div className="flex items-center overflow-hidden">
                                                                        {isExpanded ? <FiChevronUp className="mr-1 flex-shrink-0"/> : <FiChevronDown className="mr-1 flex-shrink-0"/>}
                                                                        <span className="truncate font-medium text-shadow-sm">{phase.name}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Expanded Actions */}
                                                            {isExpanded && (
                                                                <div 
                                                                    className="absolute w-full z-10" 
                                                                    style={{ top: '56px', height: `${data.actionRowsHeight}px` }}
                                                                    onDragOver={handleDragOver}
                                                                    onDrop={(e) => handleDrop(e, city.id, phase.name)}
                                                                >
                                                                    <div className="absolute border-l-2 border-dashed border-gray-300 dark:border-gray-600" style={{ left: `${left + 15}px`, top: '-4px', bottom: '10px' }}></div>

                                                                    {phase.actions.map((action: any, aIdx: number) => {
                                                                        const aStart = new Date(action.createdAt);
                                                                        let aEnd = action.estimatedCompletionDate ? new Date(action.estimatedCompletionDate) : null;
                                                                        if (!aEnd) { aEnd = new Date(aStart); aEnd.setDate(aEnd.getDate() + 5); }

                                                                        const monthStart = startOfMonth(roadmapDate);
                                                                        const aStartDiff = (aStart.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24);
                                                                        const aDuration = (aEnd.getTime() - aStart.getTime()) / (1000 * 60 * 60 * 24);

                                                                        const aLeft = Math.max(0, aStartDiff * PIXELS_PER_DAY);
                                                                        
                                                                        // Resolve Tags for Tooltip
                                                                        const itemTags = getActionTags(action.tagIds);
                                                                        const tagNames = itemTags.map(t => `[${t.label}]`).join(' ');
                                                                        const responsible = getResponsible(action.responsibleId);
                                                                        
                                                                        // MILESTONE LOGIC
                                                                        const isMilestone = ['inauguração', 'lançamento', 'evento', 'contrato'].some(keyword => action.description.toLowerCase().includes(keyword));
                                                                        
                                                                        const isDragging = draggedAction?.id === action.id;
                                                                        const isOverdue = !action.completed && aEnd && aEnd < new Date();

                                                                        if (isMilestone) {
                                                                            return (
                                                                                 <div
                                                                                    key={action.id}
                                                                                    draggable="true"
                                                                                    onDragStart={(e) => handleDragStart(e, action, city.id, phase.name)}
                                                                                    className={`absolute w-5 h-5 flex items-center justify-center transform rotate-45 border-2 shadow-md cursor-pointer hover:scale-110 transition-transform z-30
                                                                                        ${action.completed ? 'bg-green-500 border-white' : isOverdue ? 'bg-red-500 border-white animate-pulse' : 'bg-tertiary border-white'}
                                                                                    `}
                                                                                    style={{
                                                                                        left: `${aLeft + (PIXELS_PER_DAY/2) - 10}px`, // Centered on day
                                                                                        top: `${aIdx * ACTION_ROW_HEIGHT + 7}px`
                                                                                    }}
                                                                                    title={`${tagNames ? tagNames + ' ' : ''}MARCO: ${action.description} - ${new Date(action.estimatedCompletionDate).toLocaleDateString()}`}
                                                                                 >
                                                                                     <FiStar className="text-white transform -rotate-45 w-3 h-3" />
                                                                                 </div>
                                                                            );
                                                                        }

                                                                        // Normal Bar
                                                                        const aWidth = Math.max(20, aDuration * PIXELS_PER_DAY);
                                                                        if ((aStartDiff + aDuration) < 0) return null;

                                                                        return (
                                                                            <div 
                                                                                key={action.id}
                                                                                draggable="true"
                                                                                onDragStart={(e) => handleDragStart(e, action, city.id, phase.name)}
                                                                                className={`absolute h-6 rounded-full flex items-center px-2 text-[10px] shadow-sm border cursor-move transition-all overflow-hidden
                                                                                    ${action.completed ? 'bg-green-100 border-green-300 text-green-800' : 
                                                                                    isOverdue ? 'bg-red-50 dark:bg-red-900/20 border-red-500 border-l-4 text-red-700 dark:text-red-400' :
                                                                                    'bg-white dark:bg-dark-300 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}
                                                                                    ${isDragging ? 'opacity-50 border-dashed border-primary ring-2 ring-primary ring-offset-2' : 'hover:border-primary'}
                                                                                `}
                                                                                style={{
                                                                                    left: `${aLeft}px`,
                                                                                    width: `${aWidth}px`,
                                                                                    top: `${aIdx * ACTION_ROW_HEIGHT + 4}px`, 
                                                                                }}
                                                                                title={`${tagNames ? tagNames + ' ' : ''}${action.description} ${isOverdue ? '(Atrasado)' : ''} ${responsible ? `- Resp: ${responsible.name}` : ''}`}
                                                                            >
                                                                                <FiMove className="mr-1 text-gray-400 flex-shrink-0 cursor-move opacity-0 group-hover:opacity-100" size={10} />
                                                                                {action.completed ? <FiCheckCircle className="mr-1 text-green-500 flex-shrink-0" /> : <FiActivity className="mr-1 text-gray-400 flex-shrink-0" />}
                                                                                <span className="truncate flex-grow flex items-center">
                                                                                    {/* Show Tiny Dot for Tags in Timeline */}
                                                                                    {itemTags.length > 0 && (
                                                                                         <span className="flex mr-1 gap-0.5">
                                                                                             {itemTags.slice(0, 2).map(t => (
                                                                                                 <span key={t.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }}></span>
                                                                                             ))}
                                                                                         </span>
                                                                                    )}
                                                                                     {/* Show Responsible Avatar in Timeline */}
                                                                                    {responsible && (
                                                                                         <span 
                                                                                            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shadow-sm flex-shrink-0 mr-1"
                                                                                            style={{ backgroundColor: responsible.color }}
                                                                                        >
                                                                                            {responsible.initials}
                                                                                        </span>
                                                                                    )}
                                                                                    {action.description}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                    {renderDayView()}
                </div>
                <div className="lg:col-span-1">
                    {renderWeeklyView()}
                </div>
            </div>

            <Card>
                {/* Header with Navigation and Toggles */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                        <h2 className="text-xl font-bold capitalize w-48 truncate">
                            {getMonthName(roadmapDate)} <span className="text-gray-500 ml-1">{roadmapDate.getFullYear()}</span>
                        </h2>
                        <div className="flex items-center bg-base-200 dark:bg-dark-300 rounded-lg p-1">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-base-300 dark:hover:bg-dark-100 rounded-md"><FiChevronLeft /></button>
                            <button onClick={handleTodayMonth} className="px-3 text-sm font-semibold hover:bg-base-300 dark:hover:bg-dark-100 rounded-md">Atual</button>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-base-300 dark:hover:bg-dark-100 rounded-md"><FiChevronRight /></button>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-base-200 text-primary' : 'hover:bg-base-200 text-gray-600'}`}
                            title="Alternar filtros"
                        >
                            <FiFilter className="mr-2"/> Filtros
                        </button>
                        <div className="h-6 w-px bg-gray-300 mx-2"></div>
                        <div className="flex bg-base-200 dark:bg-dark-300 rounded-lg p-1">
                            <button 
                                onClick={() => setViewMode('timeline')}
                                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'timeline' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-content'}`}
                            >
                                <FiList className="mr-2" /> Cronograma
                            </button>
                            {/* Disabled Month view for now to focus on Timeline enhancements */}
                             <button 
                                onClick={() => setViewMode('month')}
                                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'month' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-content'}`}
                            >
                                <FiCalendar className="mr-2" /> Mês
                            </button>
                        </div>
                    </div>
                </div>

                {renderFilterBar()}
                
                <div className="flex-grow relative mt-4">
                     {/* Currently only showing timeline as it is the main focus, Month view logic exists but kept simple for this update */}
                    {viewMode === 'timeline' ? renderTimelineView() : (
                        <div className="p-10 text-center text-gray-500">Visualização de calendário mensal simplificada (Use o cronograma para recursos avançados).</div>
                    )}
                </div>
            </Card>

             {/* Footer Legend */}
            <div className="flex flex-wrap gap-4 text-xs mt-4 p-4 bg-base-100 dark:bg-dark-200 rounded-lg border border-base-300 dark:border-dark-100">
                <div className="flex items-center font-bold text-gray-500 uppercase mr-4">Legenda:</div>
                {Object.entries(PHASE_COLORS).map(([name, colors]) => (
                    <div key={name} className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${colors.bg}`}></div>
                        <span className="truncate">{name}</span>
                    </div>
                ))}
                 <div className="flex items-center ml-4 border-l pl-4 border-gray-300">
                    <div className="w-3 h-3 transform rotate-45 bg-tertiary border border-white shadow-sm mr-2"></div>
                    <span>Marco Crítico (Inauguração/Evento)</span>
                </div>
            </div>
        </div>
    );
};

export default Roadmap;

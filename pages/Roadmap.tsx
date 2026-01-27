
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
    resizeMode?: 'move' | 'resize-start' | 'resize-end';
    initialOffsetDays?: number;
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
        <div className="flex flex-wrap gap-2 mb-4 px-1 pb-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span className="text-[10px] font-bold uppercase self-center mr-1 tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Resumo:</span>
            {activeTagIds.map(id => {
                const tag = allTags.find(t => t.id === id);
                if (!tag) return null;
                return (
                    <div key={id} className="text-[10px] pl-2.5 pr-1.5 py-1 rounded-full text-white font-semibold flex items-center shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: tag.color }}>
                        <span className="mr-1.5">{tag.label}</span>
                        <span className="px-2 rounded-full text-[9px] min-w-[18px] text-center font-bold" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>{counts[id]}</span>
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
    const [resizingAction, setResizingAction] = useState<{ id: string, mode: 'start' | 'end' } | null>(null);
    
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

            plan.phases.forEach((phase, phaseIdx) => {
                phase.actions.forEach((action, actionIdx) => {
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
                            id: `${city.id}-${phaseIdx}-${actionIdx}`, // ID único composto
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

                plan.phases.forEach((phase, phaseIdx) => {
                    phase.actions.forEach((action, actionIdx) => {
                        const dueDate = action.estimatedCompletionDate ? new Date(action.estimatedCompletionDate) : null;
                        
                        // Check for Exact Match on Date (Future tasks only)
                        if (dueDate && isSameDay(dueDate, day) && !action.completed) {
                            dayActions.push({
                                id: `${city.id}-${phaseIdx}-${actionIdx}-weekly`, // ID único com sufixo
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
    const handleDragStart = (e: React.DragEvent, action: any, cityId: number, phaseName: string, mode: 'move' | 'resize-start' | 'resize-end' = 'move') => {
        const start = new Date(action.createdAt);
        const end = action.estimatedCompletionDate 
            ? new Date(action.estimatedCompletionDate) 
            : new Date(start.getTime() + (5 * 24 * 60 * 60 * 1000));
        const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

        // Calcular onde o clique ocorreu relativo ao início da ação (para manter a posição relativa ao arrastar pelo meio)
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const initialOffsetDays = Math.floor(offsetX / 40); // 40 = PIXELS_PER_DAY

        setDraggedAction({
            id: action.id, cityId, phaseName,
            originalStart: action.createdAt,
            originalEnd: end.toISOString(),
            durationDays,
            resizeMode: mode,
            initialOffsetDays: mode === 'move' ? initialOffsetDays : 0
        });
        e.dataTransfer.effectAllowed = mode === 'move' ? 'move' : 'copy';
        
        // Use a transparent drag image to prevent visual clutter
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
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
        const PIXELS_PER_DAY = 40;
        
        const daysOffset = Math.floor(offsetX / PIXELS_PER_DAY);
        const monthStart = startOfMonth(roadmapDate);
        
        if (draggedAction.resizeMode === 'move') {
            // Ajustar o deslocamento subtraindo onde o usuário clicou na ação
            const adjustedDaysOffset = daysOffset - (draggedAction.initialOffsetDays || 0);

            // Mover a ação mantendo a duração
            const newStartDate = new Date(monthStart);
            newStartDate.setDate(newStartDate.getDate() + adjustedDaysOffset);
            
            const newEndDate = new Date(newStartDate);
            newEndDate.setDate(newEndDate.getDate() + draggedAction.durationDays);
            
            // ATENÇÃO: Atualizo tanto o início quanto o fim para mover
            updatePlanAction(cityId, phaseName, draggedAction.id, {
                createdAt: newStartDate.toISOString(),
                estimatedCompletionDate: newEndDate.toISOString(),
            } as any);
        } else if (draggedAction.resizeMode === 'resize-end') {
            // Redimensionar alterando a data final
            const originalStart = new Date(draggedAction.originalStart);
            const newEndDate = new Date(monthStart);
            newEndDate.setDate(newEndDate.getDate() + daysOffset);
            
            // Garantir que a data final seja pelo menos 1 dia após o início
            if (newEndDate > originalStart) {
                updatePlanAction(cityId, phaseName, draggedAction.id, {
                    estimatedCompletionDate: newEndDate.toISOString(),
                } as any);
            }
        } else if (draggedAction.resizeMode === 'resize-start') {
            // Redimensionar alterando a data inicial
            const originalEnd = new Date(draggedAction.originalEnd || draggedAction.originalStart);
            const newStartDate = new Date(monthStart);
            newStartDate.setDate(newStartDate.getDate() + daysOffset);
            
            // Garantir que a data inicial seja pelo menos 1 dia antes do fim
            if (newStartDate < originalEnd) {
                updatePlanAction(cityId, phaseName, draggedAction.id, {
                    createdAt: newStartDate.toISOString(),
                } as any);
            }
        }
        
        setDraggedAction(null);
    };

    // --- RENDERERS ---

    const renderFilterBar = () => (
        <div 
            className={`transition-all duration-300 overflow-hidden ${showFilters ? 'p-4 max-h-40 opacity-100' : 'max-h-0 p-0 opacity-0'}`}
            style={{ 
                backgroundColor: '#151313', 
                borderBottom: showFilters ? '1px solid rgba(255, 255, 255, 0.1)' : 'none' 
            }}
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="text-xs font-bold uppercase mb-1 block" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Buscar Cidade</label>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-2.5" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                        <input 
                            type="text" 
                            placeholder="Ex: Sinop" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 p-2 rounded-lg text-sm"
                            style={{ 
                                background: 'rgba(0, 0, 0, 0.2)', 
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#ffffff'
                            }}
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase mb-1 block" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status</label>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="w-full p-2 rounded-lg text-sm"
                        style={{ 
                            background: 'rgba(0, 0, 0, 0.2)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#ffffff'
                        }}
                    >
                        <option value="Todos">Todos os Status</option>
                        {Object.values(CityStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase mb-1 block" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Região</label>
                    <select 
                        value={filterRegion}
                        onChange={(e) => setFilterRegion(e.target.value as any)}
                        className="w-full p-2 rounded-lg text-sm"
                        style={{ 
                            background: 'rgba(0, 0, 0, 0.2)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#ffffff'
                        }}
                    >
                        <option value="Todos">Todas as Regiões</option>
                        {Object.values(Mesorregion).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="flex items-center pb-2">
                    <button 
                        onClick={() => setHideEmptyRows(!hideEmptyRows)}
                        className="flex items-center text-sm font-medium transition-colors"
                        style={{ color: hideEmptyRows ? '#3b82f6' : 'rgba(255, 255, 255, 0.7)' }}
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
            <div 
                key={action.id} 
                className={`flex items-start p-3.5 mb-3 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-[1.01] ${action.completed ? 'opacity-75' : isOverdue ? 'shadow-md' : 'shadow-sm'}`}
                style={{
                    background: action.completed 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : isOverdue 
                            ? 'linear-gradient(to right, rgba(246, 39, 24, 0.1), rgba(246, 39, 24, 0.05))' 
                            : 'rgba(0, 0, 0, 0.2)',
                    backdropFilter: 'blur(10px)',
                    borderColor: action.completed 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : isOverdue 
                            ? '#f62718' 
                            : 'rgba(255, 255, 255, 0.1)'
                }}
            >
                {/* Time Column (Simulated) */}
                <div className={`flex flex-col items-center justify-center mr-4 w-14 pt-1 ${action.completed ? 'text-slate-400' : isOverdue ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    <span className="text-xs font-black">{action.simulatedTime}</span>
                    <FiClock className="w-3.5 h-3.5 mt-1 opacity-60"/>
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex-grow">
                             <div className="flex items-center mb-1.5 flex-wrap gap-1.5">
                                <span className={`text-xs font-black px-2.5 py-1 rounded-lg mr-2 shadow-sm ${
                                    action.cityStatus === 'Consolidada' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/40 dark:to-green-800/40 dark:text-green-300' : 
                                    action.cityStatus === 'Em expansão' ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 dark:from-orange-900/40 dark:to-orange-800/40 dark:text-orange-300' : 
                                    'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300'
                                }`}>
                                    {action.cityName}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{action.phaseName}</span>
                            </div>
                            <h4 className={`text-sm font-semibold ${action.completed ? 'line-through text-slate-500 dark:text-slate-400' : isOverdue ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                {action.description}
                            </h4>
                            
                            {/* Tags & Responsible Display */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {/* Responsible Avatar */}
                                {responsible && (
                                    <div 
                                        className="flex items-center gap-1.5 pr-2.5 border-r-2 border-slate-200 dark:border-slate-700"
                                        title={`Responsável: ${responsible.name}`}
                                    >
                                        <div 
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-lg ring-2 ring-white dark:ring-slate-800"
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
                                        className="text-[9px] px-2 py-1 rounded-md text-white font-bold flex items-center shadow-md hover:shadow-lg transition-shadow"
                                        style={{ backgroundColor: tag.color }}
                                    >
                                        <FiTag size={9} className="mr-1" /> {tag.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button 
                            onClick={() => handleToggleAction(action)}
                            className={`ml-3 p-1.5 rounded-lg transition-all flex-shrink-0 hover:scale-110`}
                            style={{
                                color: action.completed ? '#3b82f6' : 'rgba(255, 255, 255, 0.8)',
                                backgroundColor: action.completed ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                if (!action.completed) {
                                    e.currentTarget.style.color = '#3b82f6';
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!action.completed) {
                                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
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
            <Card className="h-[500px] flex flex-col shadow-lg">
                <div className="flex justify-between items-center mb-4 border-b-2 border-slate-200 dark:border-slate-700 pb-4 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl shadow-lg">
                            <FiSun className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Agenda Operacional</h2>
                            <p className="text-xs text-slate-600 dark:text-slate-400 capitalize font-medium">
                                {selectedDayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-inner">
                        <button onClick={handlePrevDay} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><FiChevronLeft className="w-5 h-5" /></button>
                        <button onClick={handleTodayDay} className="px-4 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-300">Hoje</button>
                        <button onClick={handleNextDay} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><FiChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Tags Summary for Day View */}
                <TagSummary actions={dailyActions} allTags={tags} />

                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {dailyActions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                            <FiCalendar className="w-14 h-14 mb-3 opacity-40" />
                            <p className="font-bold text-slate-600 dark:text-slate-400">Nenhuma ação planejada para este dia</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Verifique o Roadmap Geral para adicionar tarefas.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Section: Overdue (Only if Today) */}
                            {overdueActions.length > 0 && (
                                <div>
                                    <div className="flex items-center mb-3 text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-wider">
                                        <FiAlertTriangle className="mr-1.5 w-4 h-4" /> Atrasadas / Atenção
                                    </div>
                                    {overdueActions.map(renderActionCard)}
                                </div>
                            )}

                            {/* Section: Scheduled Today */}
                            {todayActions.length > 0 && (
                                <div>
                                     <div className="flex items-center mb-2 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-wider">
                                        <FiClock className="mr-1.5 w-3.5 h-3.5" /> Cronograma do Dia
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
            <Card 
                className="h-[500px] flex flex-col border-l-2 shadow-xl"
                style={{ 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    backdropFilter: 'blur(10px)',
                    borderLeftColor: 'rgba(255, 255, 255, 0.1)'
                }}
            >
                 <div className="flex items-center mb-4 border-b-2 border-slate-200 dark:border-slate-700 pb-4">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl mr-3 shadow-lg">
                        <FiCalendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Próximos Passos</h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Visão de 7 dias</p>
                    </div>
                </div>
                
                {/* Tags Summary for Weekly View */}
                <TagSummary actions={allWeeklyActions} allTags={tags} />

                <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-4">
                    {weeklyActions.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                             <p className="text-sm font-medium">Sem atividades futuras próximas.</p>
                        </div>
                    ) : (
                        weeklyActions.map((dayGroup, idx) => (
                            <div key={idx} className="relative pl-4 border-l-2 border-slate-300 dark:border-slate-700">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[5px] top-0 w-3 h-3 rounded-full shadow-lg ${dayGroup.density > 0 ? 'bg-gradient-to-br from-blue-500 to-blue-700 ring-2 ring-blue-300 dark:ring-blue-900' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                
                                <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 mb-2 flex justify-between items-center">
                                    <span>{dayGroup.date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' })}</span>
                                    {dayGroup.density > 0 && <span className="px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-[10px] font-bold shadow-sm">{dayGroup.density} ações</span>}
                                </h4>

                                {dayGroup.actions.length === 0 ? (
                                    <p className="text-[10px] italic mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>--</p>
                                ) : (
                                    <div className="space-y-2 mb-4">
                                        {dayGroup.actions.slice(0, 4).map(action => {
                                            const itemTags = getActionTags(action.tagIds);
                                            const responsible = getResponsible(action.responsibleId);
                                            
                                            return (
                                                <div 
                                                    key={action.id} 
                                                    className="p-2.5 rounded-lg border-2 flex flex-col shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                                                    style={{ 
                                                        background: 'rgba(0, 0, 0, 0.2)', 
                                                        backdropFilter: 'blur(10px)',
                                                        borderColor: 'rgba(255, 255, 255, 0.1)'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                                >
                                                    <div className="flex items-center">
                                                        <span className={`w-1 h-6 rounded-full mr-2.5 flex-shrink-0 shadow-md ${
                                                            action.cityStatus === 'Consolidada' ? 'bg-gradient-to-b from-green-400 to-green-600' : 
                                                            action.cityStatus === 'Em expansão' ? 'bg-gradient-to-b from-orange-400 to-orange-600' : 
                                                            'bg-gradient-to-b from-blue-400 to-blue-600'
                                                        }`}></span>
                                                        <div className="min-w-0 flex-grow">
                                                            <div className="flex items-center mb-0.5 justify-between">
                                                                <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider truncate">{action.cityName}</span>
                                                                {responsible && (
                                                                     <div 
                                                                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg flex-shrink-0 ring-2 ring-white dark:ring-slate-800"
                                                                        style={{ backgroundColor: responsible.color }}
                                                                        title={responsible.name}
                                                                    >
                                                                        {responsible.initials}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-medium leading-tight line-clamp-1 text-slate-900 dark:text-slate-100">{action.description}</p>
                                                        </div>
                                                    </div>
                                                    {/* Small Tags in Weekly View */}
                                                    {itemTags.length > 0 && (
                                                        <div className="flex gap-1.5 mt-1.5 pl-3">
                                                            {itemTags.slice(0, 2).map(tag => (
                                                                <span key={tag.id} className="block w-2 h-2 rounded-full shadow-sm ring-1 ring-white dark:ring-slate-800" style={{ backgroundColor: tag.color }} title={tag.label}></span>
                                                            ))}
                                                            {itemTags.length > 2 && <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold">+{itemTags.length - 2}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {dayGroup.actions.length > 4 && (
                                            <div className="text-xs text-center text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline flex items-center justify-center hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
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
                <div 
                    className="text-center py-24 rounded-xl shadow-lg"
                    style={{ 
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.05))',
                        border: '2px solid rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <div className="relative inline-block">
                        <div className="absolute inset-0 blur-2xl" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}></div>
                        <FiCalendar className="relative mx-auto text-5xl mb-6" style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
                    </div>
                    <p className="text-xl font-bold mb-2" style={{ color: '#ffffff' }}>Nenhuma atividade encontrada</p>
                    <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Tente ajustar os filtros ou selecionar outro mês.</p>
                </div>
            );
        }

        return (
            <div 
                className="rounded-xl shadow-xl flex flex-col h-[600px] relative overflow-hidden"
                style={{ 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <div className="overflow-auto flex-grow custom-scrollbar relative h-full">
                    <div className="min-w-max relative">
                        
                        {/* Header Row */}
                        <div className="flex sticky top-0 z-40 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b-2 border-slate-300 dark:border-slate-700 shadow-md">
                            <div className="sticky left-0 w-[240px] flex-shrink-0 p-4 font-bold border-r-2 border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 z-50 shadow-[4px_0_10px_rgba(0,0,0,0.1)] text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                                Cidade / Fase
                            </div>
                            <div className="flex relative">
                                {days.map(day => {
                                    const d = new Date(roadmapDate.getFullYear(), roadmapDate.getMonth(), day);
                                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                    return (
                                        <div 
                                            key={day} 
                                            className={`flex-shrink-0 w-[40px] text-center border-r border-slate-300 dark:border-slate-700 py-2 text-xs font-semibold transition-colors ${
                                                isWeekend ? 'bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'
                                            } ${
                                                isToday(d) ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-md font-black' : ''
                                            }`}
                                        >
                                            <div className="font-bold">{day}</div>
                                            <div className="text-[10px] uppercase font-medium">{d.toLocaleString('pt-BR', { weekday: 'narrow' })}</div>
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
                                <div className="absolute top-0 bottom-0 w-px z-0 pointer-events-none" style={{ left: `${SIDEBAR_WIDTH + redLineLeft}px`, backgroundColor: '#f62718' }}></div>
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
                                    <div key={city.id} className="flex border-b border-slate-200 dark:border-slate-800 group relative hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors" style={{ height: `${totalHeight}px` }}>
                                        {/* Sidebar */}
                                        <div 
                                            className="sticky left-0 w-[240px] flex-shrink-0 p-4 z-30 font-medium text-sm transition-all shadow-[2px_0_8px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_8px_rgba(0,0,0,0.3)] cursor-pointer group/city"
                                            style={{ 
                                                backgroundColor: '#151313',
                                                borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#151313'}
                                            onClick={() => toggleCityAllPhases(city.id, plan.phases.length)}
                                        >
                                            <div className="flex items-center justify-between h-10 w-full">
                                                <div className="flex items-center overflow-hidden mr-2">
                                                    <div className={`w-1 h-10 rounded-full mr-3 flex-shrink-0 shadow-lg ${city.status === 'Consolidada' ? 'bg-gradient-to-b from-green-400 to-green-600' : city.status === 'Em expansão' ? 'bg-gradient-to-b from-orange-400 to-orange-600' : 'bg-gradient-to-b from-blue-500 to-blue-700'}`}></div>
                                                    <div>
                                                        <div className="truncate font-bold text-slate-900 dark:text-slate-100">{city.name}</div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">{formatMesorregion(city.mesorregion)}</div>
                                                    </div>
                                                </div>
                                                <div className="text-slate-400 group-hover/city:text-blue-600 dark:group-hover/city:text-blue-400 transition-colors">
                                                    {isCityExpanded ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
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
                                                    return <div key={day} className={`flex-shrink-0 w-[40px] border-r border-slate-200 dark:border-slate-800 h-full ${isWeekend ? 'bg-slate-100/40 dark:bg-slate-950/40' : ''}`}></div>;
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
                                                                className={`absolute h-10 rounded-xl shadow-lg text-white text-xs flex flex-col justify-center transition-all overflow-hidden border-2 border-white/20 hover:shadow-2xl hover:scale-105 hover:z-30 z-20 cursor-pointer`}
                                                                style={{ 
                                                                    left: `${left}px`, 
                                                                    width: `${width}px`,
                                                                    top: '12px',
                                                                }}
                                                                onClick={() => togglePhaseExpansion(id)}
                                                            >
                                                                {/* Base Color with Gradient */}
                                                                <div className={`absolute inset-0 ${getPhaseColor(phase.name)} opacity-20`}></div>
                                                                <div 
                                                                    className={`absolute inset-y-0 left-0 ${getPhaseColor(phase.name)} ${isFullyComplete ? 'saturate-50' : ''} bg-gradient-to-r from-transparent to-white/10`} 
                                                                    style={{ width: `${isFullyComplete ? 100 : progress}%` }}
                                                                ></div>

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
                                                                    <div className="absolute border-l-2 border-dashed border-slate-300 dark:border-slate-600" style={{ left: `${left + 15}px`, top: '-4px', bottom: '10px' }}></div>

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
                                                                        ${isOverdue ? 'animate-pulse' : ''}
                                                                    `}
                                                                    style={{
                                                                        left: `${aLeft + (PIXELS_PER_DAY/2) - 10}px`,
                                                                        top: `${aIdx * ACTION_ROW_HEIGHT + 7}px`,
                                                                        backgroundColor: action.completed ? '#08a50e' : isOverdue ? '#f62718' : '#3b82f6',
                                                                        borderColor: '#ffffff'
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
                                                                onDragStart={(e) => {
                                                                    handleDragStart(e, action, city.id, phase.name, 'move');
                                                                }}
                                                                className={`absolute h-7 rounded-lg flex items-center px-2.5 text-[10px] shadow-md border-2 cursor-move transition-all overflow-visible hover:shadow-lg hover:scale-105 hover:z-40 group/action
                                                                    ${action.completed ? 'bg-gradient-to-r from-green-100 to-green-200 border-green-400 text-green-900 dark:from-green-900/30 dark:to-green-800/30 dark:border-green-700 dark:text-green-300' : 
                                                                    isOverdue ? 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-500 border-l-4 text-red-700 dark:text-red-400 animate-pulse' :
                                                                    ''}
                                                                    ${isDragging ? 'opacity-50 border-dashed border-blue-600 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2' : 'hover:border-blue-500 dark:hover:border-blue-400'}
                                                                `}
                                                                style={{
                                                                    left: `${aLeft}px`,
                                                                    width: `${aWidth}px`,
                                                                    top: `${aIdx * ACTION_ROW_HEIGHT + 4}px`,
                                                                    ...((!action.completed && !isOverdue) && {
                                                                        background: 'rgba(0, 0, 0, 0.2)',
                                                                        backdropFilter: 'blur(10px)',
                                                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                                                        color: 'rgba(255, 255, 255, 0.8)'
                                                                    })
                                                                }}
                                                                title={`${tagNames ? tagNames + ' ' : ''}${action.description} ${isOverdue ? '(Atrasado)' : ''} ${responsible ? `- Resp: ${responsible.name}` : ''}`}
                                                            >
                                                                {/* Resize Handle - Left (Explicit) */}
                                                                <div
                                                                    draggable="true"
                                                                    onDragStart={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDragStart(e, action, city.id, phase.name, 'resize-start');
                                                                    }}
                                                                    className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize transition-all z-50 group-hover/action:opacity-100 opacity-0"
                                                                    style={{ backgroundColor: 'transparent' }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    title="Arrastar para ajustar data inicial"
                                                                />
                                                                
                                                                {/* Visuals */}
                                                                <FiMove className="mr-1 text-slate-400 dark:text-slate-500 flex-shrink-0 cursor-move opacity-0 group-hover/action:opacity-100" size={10} />
                                                                {action.completed ? <FiCheckCircle className="mr-1 text-green-600 dark:text-green-400 flex-shrink-0" /> : <FiActivity className="mr-1 text-slate-400 dark:text-slate-500 flex-shrink-0" />}
                                                                <span className="truncate flex-grow flex items-center font-medium pointer-events-none">
                                                                    {/* Show Tiny Dot for Tags in Timeline */}
                                                                    {itemTags.length > 0 && (
                                                                         <span className="flex mr-1.5 gap-0.5">
                                                                             {itemTags.slice(0, 2).map(t => (
                                                                                 <span key={t.id} className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: t.color }}></span>
                                                                             ))}
                                                                         </span>
                                                                    )}
                                                                     {/* Show Responsible Avatar in Timeline */}
                                                                    {responsible && (
                                                                         <span 
                                                                            className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shadow-md flex-shrink-0 mr-1.5 ring-1 ring-white dark:ring-slate-800"
                                                                            style={{ backgroundColor: responsible.color }}
                                                                        >
                                                                            {responsible.initials}
                                                                        </span>
                                                                    )}
                                                                    {action.description}
                                                                </span>

                                                                {/* Resize Handle - Right (Explicit) */}
                                                                <div
                                                                    draggable="true"
                                                                    onDragStart={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDragStart(e, action, city.id, phase.name, 'resize-end');
                                                                    }}
                                                                    className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize transition-all z-50 group-hover/action:opacity-100 opacity-0"
                                                                    style={{ backgroundColor: 'transparent' }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    title="Arrastar para ajustar data final"
                                                                />
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
                        <h2 className="text-xl font-black capitalize w-48 truncate text-slate-900 dark:text-slate-100">
                            {getMonthName(roadmapDate)} <span className="text-slate-500 dark:text-slate-400 ml-1 font-bold">{roadmapDate.getFullYear()}</span>
                        </h2>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-inner">
                            <button onClick={handlePrevMonth} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><FiChevronLeft className="w-4 h-4" /></button>
                            <button onClick={handleTodayMonth} className="px-4 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-300">Atual</button>
                            <button onClick={handleNextMonth} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><FiChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg ${showFilters ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                            title="Alternar filtros"
                        >
                            <FiFilter className="mr-2"/> Filtros
                        </button>
                        <div className="h-8 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-inner">
                            <button 
                                onClick={() => setViewMode('timeline')}
                                className={`flex items-center px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                            >
                                <FiList className="mr-2" /> Cronograma
                            </button>
                            {/* Disabled Month view for now to focus on Timeline enhancements */}
                             <button 
                                onClick={() => setViewMode('month')}
                                className={`flex items-center px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${viewMode === 'month' ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
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
                        <div className="p-10 text-center text-slate-500 dark:text-slate-400 font-medium">Visualização de calendário mensal simplificada (Use o cronograma para recursos avançados).</div>
                    )}
                </div>
            </Card>

             {/* Footer Legend */}
            <div 
                className="flex flex-col gap-4 text-xs mt-4 p-5 rounded-xl shadow-lg"
                style={{ 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center font-black text-slate-600 dark:text-slate-400 uppercase mr-4 tracking-wider">Legenda:</div>
                    {Object.entries(PHASE_COLORS).map(([name, colors]) => (
                        <div key={name} className="flex items-center font-medium text-slate-700 dark:text-slate-300">
                            <div className={`w-3.5 h-3.5 rounded-full mr-2 ${colors.bg} shadow-md ring-2 ring-white dark:ring-slate-900`}></div>
                            <span className="truncate">{name}</span>
                        </div>
                    ))}
                    <div className="flex items-center ml-4 border-l-2 pl-4 font-medium" style={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.8)' }}>
                        <div className="w-3 h-3 transform rotate-45 border border-white shadow-md mr-2" style={{ backgroundColor: '#3b82f6' }}></div>
                        <span>Marco Crítico (Inauguração/Evento)</span>
                    </div>
                </div>
                
                {/* Drag & Drop Instructions */}
                <div className="flex flex-wrap gap-6 items-center pt-3 border-t-2 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center font-black text-blue-600 dark:text-blue-400 uppercase mr-2 tracking-wider">
                        <FiMove className="mr-2 w-4 h-4" /> Interação:
                    </div>
                    <div className="flex items-center font-medium" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        <div 
                            className="px-3 py-1.5 text-white rounded-lg mr-2 shadow-md font-bold text-[10px]"
                            style={{ background: 'linear-gradient(to right, #3b82f6, #17a2b8)' }}
                        >
                            CENTRO
                        </div>
                        <span>Arraste pelo <strong>centro</strong> para mover a ação</span>
                    </div>
                    <div className="flex items-center font-medium" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        <div className="flex gap-1 mr-2 items-center">
                            <div className="w-3 h-6 rounded-l-lg border-2" style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)', borderColor: '#3b82f6' }}></div>
                            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>...</span>
                            <div className="w-3 h-6 rounded-r-lg border-2" style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)', borderColor: '#3b82f6' }}></div>
                        </div>
                        <span>Clique nas <strong>extremidades</strong> (8px) para redimensionar</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Roadmap;

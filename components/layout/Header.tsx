
import React, { useContext, useState } from 'react';
import { FiBell, FiMenu, FiUser, FiSun, FiMoon, FiSettings, FiTrash2, FiPlus, FiRefreshCw, FiSave, FiTag, FiCheck, FiX, FiUsers } from 'react-icons/fi';
import Modal from '../ui/Modal';
import { DataContext } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { PhaseTemplate, Tag, Responsible } from '../../types';
import InfoTooltip from '../ui/InfoTooltip';

interface HeaderProps {
  toggleSidebar: () => void;
}

const COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#d946ef', // fuchsia
    '#f43f5e', // rose
    '#64748b', // slate
];

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { 
        phaseTemplates, updatePhaseTemplate, resetPhaseTemplates, 
        tags, addTag, updateTag, deleteTag,
        responsibles, addResponsible, updateResponsible, deleteResponsible
    } = useContext(DataContext);
    
    // Settings Local State
    const [activeTab, setActiveTab] = useState<'phases' | 'tags' | 'responsibles'>('phases');
    
    // Phases State
    const [selectedPhaseName, setSelectedPhaseName] = useState<string>(phaseTemplates[0]?.name || '');
    const [newActionText, setNewActionText] = useState('');
    
    // Tags State
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState(COLORS[0]);
    const [editingTagId, setEditingTagId] = useState<string | null>(null);
    const [editingTagName, setEditingTagName] = useState('');
    const [editingTagColor, setEditingTagColor] = useState('');

    // Responsibles State
    const [newRespName, setNewRespName] = useState('');
    const [newRespColor, setNewRespColor] = useState(COLORS[5]);
    const [editingRespId, setEditingRespId] = useState<string | null>(null);
    const [editingRespName, setEditingRespName] = useState('');
    const [editingRespColor, setEditingRespColor] = useState('');

    
    const selectedTemplate = phaseTemplates.find(t => t.name === selectedPhaseName);

    // --- Phases Handlers ---
    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val > 0) {
            updatePhaseTemplate(selectedPhaseName, { durationDays: val });
        }
    };

    const handleAddAction = () => {
        if (!selectedTemplate || !newActionText.trim()) return;
        updatePhaseTemplate(selectedPhaseName, {
            actions: [...selectedTemplate.actions, newActionText]
        });
        setNewActionText('');
    };

    const handleDeleteAction = (indexToRemove: number) => {
        if (!selectedTemplate) return;
        updatePhaseTemplate(selectedPhaseName, {
            actions: selectedTemplate.actions.filter((_, i) => i !== indexToRemove)
        });
    };

    const handleReset = () => {
        if(window.confirm("Isso irá restaurar todas as ações e durações para o padrão original da Urban. Suas personalizações serão perdidas. Continuar?")) {
            resetPhaseTemplates();
            if (phaseTemplates.length > 0) setSelectedPhaseName(phaseTemplates[0].name);
        }
    };
    
    // --- Tags Handlers ---
    const handleAddTag = () => {
        if (!newTagName.trim()) return;
        addTag({ label: newTagName, color: newTagColor });
        setNewTagName('');
    };
    
    const startEditingTag = (tag: Tag) => {
        setEditingTagId(tag.id);
        setEditingTagName(tag.label);
        setEditingTagColor(tag.color);
    };

    const saveEditingTag = () => {
        if (editingTagId && editingTagName.trim()) {
            updateTag(editingTagId, { label: editingTagName, color: editingTagColor });
            setEditingTagId(null);
        }
    };
    
    const handleDeleteTag = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta etiqueta? Ela será removida de todas as ações associadas.")) {
            deleteTag(id);
        }
    };

    // --- Responsibles Handlers ---
    const handleAddResp = () => {
        if (!newRespName.trim()) return;
        addResponsible({ name: newRespName, color: newRespColor });
        setNewRespName('');
    };

    const startEditingResp = (resp: Responsible) => {
        setEditingRespId(resp.id);
        setEditingRespName(resp.name);
        setEditingRespColor(resp.color);
    };

    const saveEditingResp = () => {
        if (editingRespId && editingRespName.trim()) {
            updateResponsible(editingRespId, { name: editingRespName, color: editingRespColor });
            setEditingRespId(null);
        }
    };

    const handleDeleteResp = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este responsável? A atribuição será removida das ações.")) {
            deleteResponsible(id);
        }
    };
  
  return (
    <>
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 lg:px-10 py-4 backdrop-blur-lg shadow-sm" style={{ 
            background: 'rgb(255 255 255 / 5%)', 
            borderBottom: '1px solid rgb(255 255 255 / 8%)' 
        }}>
            <div className="flex items-center gap-4">
                <h1 className="font-black text-2xl text-white">
                    Urban<span className="font-light text-white/70">Passageiro</span>
                </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                 <button 
                    onClick={toggleDarkMode} 
                    className="p-2.5 rounded-full transition-all duration-200 hover:scale-105"
                    style={{ color: '#ffffff', background: 'rgb(255 255 255 / 10%)' }}
                    title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
                >
                    {isDarkMode ? <FiSun className="h-5 w-5"/> : <FiMoon className="h-5 w-5"/>}
                </button>

                <div className="h-6 w-px mx-1 hidden sm:block" style={{ background: 'rgb(255 255 255 / 10%)' }}></div>

                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2.5 rounded-full transition-all duration-200 hover:scale-105"
                    style={{ color: '#ffffff', background: 'rgb(255 255 255 / 10%)' }}
                    title="Configurações"
                >
                    <FiSettings className="h-5 w-5" />
                </button>
                
                <button className="relative p-2.5 rounded-full transition-all duration-200 hover:scale-105 group" style={{ color: '#ffffff', background: 'rgb(255 255 255 / 10%)' }}>
                    <FiBell className="h-5 w-5 group-hover:text-blue-400 transition-colors" />
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" style={{ border: '2px solid rgb(0 20 45 / 50%)' }}></span>
                    </span>
                </button>
                
                <div className="h-8 mx-2 hidden sm:block" style={{ borderLeft: '1px solid rgb(255 255 255 / 10%)' }}></div>

                <div className="flex items-center gap-3 pl-2 cursor-pointer py-1 px-3 rounded-xl transition-all duration-200" style={{ background: 'rgb(255 255 255 / 8%)' }}>
                    <div className="h-9 w-9 rounded-full p-[2px]" style={{ background: 'linear-gradient(45deg, #1565C0, #1E88E5)' }}>
                        <div className="h-full w-full rounded-full flex items-center justify-center" style={{ background: 'rgb(15 35 60 / 70%)' }}>
                             <FiUser className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className="hidden sm:block text-left">
                         <p className="text-sm font-bold text-white leading-none">Admin</p>
                         <p className="text-xs mt-1 leading-none" style={{ color: 'rgb(255 255 255 / 64%)' }}>Gestor de Expansão</p>
                    </div>
                </div>
            </div>
        </header>

        {/* SETTINGS MODAL */}
        <Modal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)}
            title="Configurações do Sistema"
        >
            <div className="flex h-[60vh]">
                {/* Sidebar Navigation */}
                <div className="w-48 pr-4 flex flex-col space-y-2" style={{ borderRight: '1px solid rgb(255 255 255 / 15%)' }}>
                     <button
                        onClick={() => setActiveTab('phases')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center`}
                        style={{ 
                            background: activeTab === 'phases' ? '#3b82f6' : 'transparent',
                            color: activeTab === 'phases' ? '#fff' : 'rgb(255 255 255 / 85%)'
                        }}
                    >
                       <FiRefreshCw className="mr-2" /> Fases & Processos
                    </button>
                    <button
                        onClick={() => setActiveTab('tags')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center`}
                        style={{ 
                            background: activeTab === 'tags' ? '#3b82f6' : 'transparent',
                            color: activeTab === 'tags' ? '#fff' : 'rgb(255 255 255 / 85%)'
                        }}
                    >
                       <FiTag className="mr-2" /> Etiquetas
                    </button>
                    <button
                        onClick={() => setActiveTab('responsibles')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center`}
                        style={{ 
                            background: activeTab === 'responsibles' ? '#3b82f6' : 'transparent',
                            color: activeTab === 'responsibles' ? '#fff' : 'rgb(255 255 255 / 85%)'
                        }}
                    >
                       <FiUsers className="mr-2" /> Responsáveis
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 pl-6 overflow-hidden flex flex-col">
                    
                    {/* --- TAB: PHASES --- */}
                    {activeTab === 'phases' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                            {/* Inner Sidebar: Phase List */}
                            <div className="md:col-span-1 pr-4 flex flex-col h-full overflow-hidden" style={{ borderRight: '1px solid rgb(255 255 255 / 15%)' }}>
                                <h4 className="text-xs font-bold text-white uppercase mb-3">Fases do Roadmap</h4>
                                <div className="space-y-1 flex-grow overflow-y-auto">
                                    {phaseTemplates.map(template => (
                                        <button
                                            key={template.name}
                                            onClick={() => setSelectedPhaseName(template.name)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors`}
                                            style={{
                                                background: selectedPhaseName === template.name ? 'rgb(255 255 255 / 12%)' : 'transparent',
                                                color: selectedPhaseName === template.name ? '#3b82f6' : 'rgb(255 255 255 / 85%)',
                                                fontWeight: selectedPhaseName === template.name ? '500' : 'normal'
                                            }}
                                        >
                                            {template.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="pt-4 mt-2" style={{ borderTop: '1px solid rgb(255 255 255 / 15%)' }}>
                                     <button 
                                        onClick={handleReset}
                                        className="w-full flex items-center justify-center text-xs py-2 rounded-lg transition"
                                        style={{ color: '#f62718', border: '1px solid rgba(246, 39, 24, 0.3)', background: 'rgba(246, 39, 24, 0.1)' }}
                                    >
                                        <FiRefreshCw className="mr-2" /> Restaurar Padrões
                                    </button>
                                </div>
                            </div>

                            {/* Inner Content: Phase Config */}
                            <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
                                {selectedTemplate ? (
                                    <>
                                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-base-300 dark:border-dark-100">
                                            <div>
                                                <h3 className="text-lg font-bold text-primary">{selectedTemplate.name}</h3>
                                                <p className="text-sm text-gray-700 font-medium">Configure os padrões para novos planos.</p>
                                            </div>
                                            <div className="flex items-center bg-base-200 dark:bg-dark-100 p-2 rounded-lg">
                                                <label className="text-sm font-semibold mr-3">Duração (Dias):</label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="365"
                                                    value={selectedTemplate.durationDays} 
                                                    onChange={handleDurationChange}
                                                    className="w-16 p-1 text-center rounded border border-base-300 dark:border-dark-200 focus:ring-primary focus:border-primary"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-grow overflow-y-auto pr-2">
                                            <h4 className="font-bold text-sm mb-3 flex items-center justify-between">
                                                <span>Ações Padrão ({selectedTemplate.actions.length})</span>
                                                <InfoTooltip text="Estas ações serão criadas automaticamente." />
                                            </h4>
                                            
                                            <div className="space-y-2 mb-4">
                                                {selectedTemplate.actions.map((action, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-base-200 dark:bg-dark-100 rounded-lg group">
                                                        <span className="text-sm">{action}</span>
                                                        <button 
                                                            onClick={() => handleDeleteAction(index)}
                                                            className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                ))}
                                                {selectedTemplate.actions.length === 0 && (
                                                    <p className="text-sm text-gray-700 italic text-center py-4">Nenhuma ação padrão.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-base-300 dark:border-dark-100">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Nova ação padrão..." 
                                                    value={newActionText}
                                                    onChange={(e) => setNewActionText(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleAddAction()}
                                                    className="flex-grow p-2 rounded-lg border border-base-300 dark:border-dark-100 bg-base-100 dark:bg-dark-300 focus:ring-primary focus:border-primary"
                                                />
                                                <button 
                                                    onClick={handleAddAction}
                                                    disabled={!newActionText.trim()}
                                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:bg-gray-400 transition"
                                                >
                                                    <FiPlus/>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        Selecione uma fase para configurar.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* --- TAB: TAGS --- */}
                    {activeTab === 'tags' && (
                        <div className="flex flex-col h-full overflow-hidden">
                             <div className="mb-4">
                                <h3 className="text-lg font-bold mb-1">Gerenciar Etiquetas</h3>
                                <p className="text-sm text-gray-700 font-medium">Crie etiquetas personalizadas para organizar as ações do planejamento.</p>
                            </div>

                            {/* Create New Tag */}
                            <div className="bg-base-200 dark:bg-dark-100 p-4 rounded-lg mb-6 border border-base-300 dark:border-dark-100">
                                <h4 className="text-sm font-bold mb-3">Nova Etiqueta</h4>
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-grow w-full">
                                        <label className="text-xs text-gray-900 font-bold mb-1 block">Nome</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: Urgente, Financeiro..." 
                                            value={newTagName}
                                            onChange={(e) => setNewTagName(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                            className="w-full p-2 rounded-lg border border-base-300 dark:border-dark-200 bg-base-100 dark:bg-dark-300 focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div className="flex-grow-0">
                                        <label className="text-xs text-gray-900 font-bold mb-1 block">Cor</label>
                                        <div className="flex gap-2 p-2 bg-base-100 dark:bg-dark-300 rounded-lg border border-base-300 dark:border-dark-200">
                                            {COLORS.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setNewTagColor(color)}
                                                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${newTagColor === color ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-dark-300' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleAddTag}
                                        disabled={!newTagName.trim()}
                                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:bg-gray-400 transition flex items-center h-10"
                                    >
                                        <FiPlus className="mr-2"/> Criar
                                    </button>
                                </div>
                            </div>

                            {/* Tags List */}
                            <div className="flex-grow overflow-y-auto">
                                <h4 className="text-sm font-bold mb-3">Etiquetas Existentes ({tags.length})</h4>
                                <div className="space-y-2">
                                    {tags.map(tag => (
                                        <div key={tag.id} className="flex items-center justify-between p-3 bg-white dark:bg-dark-300 border border-base-200 dark:border-dark-100 rounded-lg shadow-sm">
                                            {editingTagId === tag.id ? (
                                                <div className="flex items-center gap-3 flex-grow">
                                                    <input 
                                                        type="text" 
                                                        value={editingTagName} 
                                                        onChange={(e) => setEditingTagName(e.target.value)}
                                                        className="flex-grow p-1 rounded border border-base-300 dark:border-dark-100 bg-base-100 dark:bg-dark-200 text-sm"
                                                    />
                                                     <div className="flex gap-1">
                                                        {COLORS.slice(0, 5).map(color => (
                                                            <button
                                                                key={color}
                                                                onClick={() => setEditingTagColor(color)}
                                                                className={`w-4 h-4 rounded-full ${editingTagColor === color ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <button onClick={saveEditingTag} className="text-green-500 p-1"><FiCheck/></button>
                                                    <button onClick={() => setEditingTagId(null)} className="text-red-500 p-1"><FiX/></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                                        <span className="font-medium">{tag.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => startEditingTag(tag)} className="p-1 text-gray-700 hover:text-primary transition">
                                                            <FiSettings size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteTag(tag.id)} className="p-1 text-gray-700 hover:text-red-500 transition">
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {tags.length === 0 && (
                                        <p className="text-center text-gray-700 py-8 italic">Nenhuma etiqueta criada.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: RESPONSIBLES --- */}
                    {activeTab === 'responsibles' && (
                        <div className="flex flex-col h-full overflow-hidden">
                             <div className="mb-4">
                                <h3 className="text-lg font-bold mb-1">Gerenciar Equipe</h3>
                                <p className="text-sm text-gray-700 font-medium">Adicione os responsáveis pelas tarefas de expansão.</p>
                            </div>

                            {/* Create New Responsible */}
                            <div className="bg-base-200 dark:bg-dark-100 p-4 rounded-lg mb-6 border border-base-300 dark:border-dark-100">
                                <h4 className="text-sm font-bold mb-3">Novo Responsável</h4>
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-grow w-full">
                                        <label className="text-xs text-gray-900 font-bold mb-1 block">Nome / Cargo</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: Gerente de Projetos, Ana Silva..." 
                                            value={newRespName}
                                            onChange={(e) => setNewRespName(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddResp()}
                                            className="w-full p-2 rounded-lg border border-base-300 dark:border-dark-200 bg-base-100 dark:bg-dark-300 focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div className="flex-grow-0">
                                        <label className="text-xs text-gray-900 font-bold mb-1 block">Cor do Avatar</label>
                                        <div className="flex gap-2 p-2 bg-base-100 dark:bg-dark-300 rounded-lg border border-base-300 dark:border-dark-200">
                                            {COLORS.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setNewRespColor(color)}
                                                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center text-[10px] text-white font-bold ${newRespColor === color ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-dark-300' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {newRespColor === color && <FiUser size={12}/>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleAddResp}
                                        disabled={!newRespName.trim()}
                                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:bg-gray-400 transition flex items-center h-10"
                                    >
                                        <FiPlus className="mr-2"/> Adicionar
                                    </button>
                                </div>
                            </div>

                            {/* Responsibles List */}
                            <div className="flex-grow overflow-y-auto">
                                <h4 className="text-sm font-bold mb-3">Equipe ({responsibles.length})</h4>
                                <div className="space-y-2">
                                    {responsibles.map(resp => (
                                        <div key={resp.id} className="flex items-center justify-between p-3 bg-white dark:bg-dark-300 border border-base-200 dark:border-dark-100 rounded-lg shadow-sm">
                                            {editingRespId === resp.id ? (
                                                <div className="flex items-center gap-3 flex-grow">
                                                    <input 
                                                        type="text" 
                                                        value={editingRespName} 
                                                        onChange={(e) => setEditingRespName(e.target.value)}
                                                        className="flex-grow p-1 rounded border border-base-300 dark:border-dark-100 bg-base-100 dark:bg-dark-200 text-sm"
                                                    />
                                                     <div className="flex gap-1">
                                                        {COLORS.slice(0, 5).map(color => (
                                                            <button
                                                                key={color}
                                                                onClick={() => setEditingRespColor(color)}
                                                                className={`w-4 h-4 rounded-full ${editingRespColor === color ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <button onClick={saveEditingResp} className="text-green-500 p-1"><FiCheck/></button>
                                                    <button onClick={() => setEditingRespId(null)} className="text-red-500 p-1"><FiX/></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" 
                                                            style={{ backgroundColor: resp.color }}
                                                        >
                                                            {resp.initials}
                                                        </div>
                                                        <span className="font-medium">{resp.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => startEditingResp(resp)} className="p-1 text-gray-700 hover:text-primary transition">
                                                            <FiSettings size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteResp(resp.id)} className="p-1 text-gray-700 hover:text-red-500 transition">
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {responsibles.length === 0 && (
                                        <p className="text-center text-gray-700 py-8 italic">Nenhum responsável cadastrado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </Modal>
    </>
  );
};

export default Header;


import React, { useContext, useMemo, useState } from 'react';
import { DataContext } from '../context/DataContext';
import Card from '../components/ui/Card';
import { FiBriefcase, FiMapPin, FiSearch, FiArrowRight, FiActivity, FiPlus, FiGrid, FiMoreHorizontal, FiTrash2, FiEdit2, FiX, FiCheck, FiMove, FiMinusCircle, FiDownload, FiClipboard } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { CityStatus, MarketBlock, City, CityPlan } from '../types';
import Modal from '../components/ui/Modal';
import { calculatePotentialRevenue, getMarketPotential } from '../services/calculationService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Subcomponent: City Card ---
const CityCard: React.FC<{ 
    city: City; 
    blocks: MarketBlock[];
    currentBlockId: string | null;
    hasPlan: boolean;
    onMove: (cityId: number, blockId: string | null) => void;
    onRemove: (cityId: number) => void;
    onPlan: (cityId: number) => void;
    navigate: (path: string) => void;
}> = ({ city, blocks, currentBlockId, hasPlan, onMove, onRemove, onPlan, navigate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const getStatusColor = (status: CityStatus) => {
        switch(status) {
            case CityStatus.Consolidated: return 'bg-green-100 text-green-800';
            case CityStatus.Expansion: return 'bg-orange-100 text-orange-800';
            case CityStatus.Planning: return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('cityId', city.id.toString());
        e.dataTransfer.effectAllowed = 'move';
        const target = e.currentTarget as HTMLElement;
        setTimeout(() => {
            target.style.opacity = '0.4';
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
    };

    return (
        <div 
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className="bg-base-100 dark:bg-dark-200 p-4 rounded-xl shadow-sm border border-base-300 dark:border-dark-100 hover:shadow-md hover:border-primary transition-all group relative flex flex-col h-full cursor-grab active:cursor-grabbing"
        >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-30 transition-opacity">
                <FiMove size={12} />
            </div>

            <div className="flex justify-between items-start mb-3">
                <div 
                    className="flex items-center cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/inteligencia/${city.id}`)}
                >
                    <div className="p-2 bg-base-200 dark:bg-dark-100 rounded-full mr-2 text-primary group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
                        <FiMapPin size={18} />
                    </div>
                    <div className="truncate">
                        <h3 className="font-bold text-base leading-tight truncate">{city.name}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(city.status)}`}>
                            {city.status}
                        </span>
                    </div>
                </div>
                
                <div className="relative flex items-center gap-1">
                    {!hasPlan && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); onPlan(city.id); }}
                            className="p-1.5 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-colors"
                            title="Mandar para Planejamento"
                        >
                            <FiClipboard size={14} />
                        </button>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                        className="p-1 rounded-full hover:bg-base-200 dark:hover:bg-dark-100 text-gray-400"
                    >
                        <FiMoreHorizontal />
                    </button>
                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-dark-300 border border-base-200 dark:border-dark-100 rounded-lg shadow-lg z-20 py-1 text-sm shadow-xl">
                                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase border-b border-base-200 dark:border-dark-100 mb-1">Mover para...</div>
                                {currentBlockId !== null && (
                                     <button 
                                        onClick={() => { onMove(city.id, null); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 hover:bg-base-100 dark:hover:bg-dark-200"
                                    >
                                        Sem Grupo (Geral)
                                    </button>
                                )}
                                {blocks.filter(b => b.id !== currentBlockId).map(block => (
                                    <button 
                                        key={block.id}
                                        onClick={() => { onMove(city.id, block.id); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 hover:bg-base-100 dark:hover:bg-dark-200 truncate"
                                    >
                                        {block.name}
                                    </button>
                                ))}
                                <div className="border-t border-base-200 dark:border-dark-100 my-1"></div>
                                <button 
                                    onClick={() => { onRemove(city.id); setIsMenuOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                                >
                                    <FiMinusCircle size={14}/> Remover da Inteligência
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <div className="space-y-1 mb-4 flex-grow pointer-events-none">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">População:</span>
                    <span className="font-semibold">{city.population.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Renda Est.:</span>
                    <span className="font-semibold">{city.averageIncome.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</span>
                </div>
            </div>

            <div 
                onClick={() => navigate(`/inteligencia/${city.id}`)}
                className="pt-3 border-t border-base-200 dark:border-dark-100 flex justify-between items-center text-primary font-medium cursor-pointer group-hover:text-primary-600 transition-colors"
            >
                <span className="text-xs flex items-center">
                    <FiActivity className="mr-1"/> Ver Dados
                </span>
                <FiArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    );
};

// --- Subcomponent: Market Block ---
const BlockSection: React.FC<{
    block: MarketBlock;
    cities: City[];
    allBlocks: MarketBlock[];
    plans: CityPlan[];
    onRename: (id: string, name: string) => void;
    onDelete: (id: string) => void;
    onMoveCity: (cityId: number, blockId: string | null) => void;
    onRemoveCity: (cityId: number) => void;
    onPlanCity: (cityId: number) => void;
    navigate: (path: string) => void;
}> = ({ block, cities, allBlocks, plans, onRename, onDelete, onMoveCity, onRemoveCity, onPlanCity, navigate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(block.name);
    const [isOver, setIsOver] = useState(false);

    const handleSaveName = () => {
        if (editName.trim()) {
            onRename(block.id, editName);
            setIsEditing(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const cityId = e.dataTransfer.getData('cityId');
        if (cityId) {
            onMoveCity(parseInt(cityId), block.id);
        }
    };

    const handlePlanAllInBlock = () => {
        const citiesToPlan = cities.filter(city => !plans.some(p => p.cityId === city.id));
        if (citiesToPlan.length === 0) {
            alert("Todas as cidades deste bloco já estão em planejamento.");
            return;
        }
        if (window.confirm(`Isso iniciará o planejamento para ${citiesToPlan.length} cidades. Confirmar?`)) {
            citiesToPlan.forEach(city => onPlanCity(city.id));
            navigate('/planejamento');
        }
    };

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const exportBlockPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const date = new Date().toLocaleDateString('pt-BR');

        doc.setFontSize(18);
        doc.text(`Relatório Estratégico: ${block.name}`, 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Urban Passageiro - Gerado em: ${date}`, 14, 27);

        const tableColumn = [
            "Cidade", 
            "Pop. Total", 
            "Pop. Alvo (15-44)", 
            "Corridas (Média)", 
            "Receita Baixa", 
            "Receita Média", 
            "Receita Alta"
        ];

        const tableRows = cities.map(city => {
            const rides = getMarketPotential(city).find(p => p.scenario === 'Média')?.rides || 0;
            return [
                city.name,
                city.population.toLocaleString('pt-BR'),
                city.population15to44.toLocaleString('pt-BR'),
                Math.round(rides).toLocaleString('pt-BR'),
                formatCurrency(calculatePotentialRevenue(city, 'Baixa')),
                formatCurrency(calculatePotentialRevenue(city, 'Média')),
                formatCurrency(calculatePotentialRevenue(city, 'Alta'))
            ];
        });

        // Totais
        const totals = cities.reduce((acc, city) => {
            const rides = getMarketPotential(city).find(p => p.scenario === 'Média')?.rides || 0;
            return {
                pop: acc.pop + city.population,
                target: acc.target + city.population15to44,
                rides: acc.rides + rides,
                baixa: acc.baixa + calculatePotentialRevenue(city, 'Baixa'),
                media: acc.media + calculatePotentialRevenue(city, 'Média'),
                alta: acc.alta + calculatePotentialRevenue(city, 'Alta'),
            };
        }, { pop: 0, target: 0, rides: 0, baixa: 0, media: 0, alta: 0 });

        const footerRow = [
            { content: 'TOTAIS DO GRUPO', styles: { fontStyle: 'bold', halign: 'right' } },
            totals.pop.toLocaleString('pt-BR'),
            totals.target.toLocaleString('pt-BR'),
            Math.round(totals.rides).toLocaleString('pt-BR'),
            formatCurrency(totals.baixa),
            formatCurrency(totals.media),
            formatCurrency(totals.alta)
        ];

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            foot: [footerRow],
            startY: 35,
            theme: 'striped',
            headStyles: { fillColor: [34, 197, 94], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
        });

        doc.save(`Urban_Relatorio_${block.name.replace(/\s+/g, '_')}_${date}.pdf`);
    };

    return (
        <div 
            className={`mb-8 p-4 rounded-2xl transition-all border-2 ${isOver ? 'border-primary bg-primary/5 shadow-inner' : 'border-transparent bg-base-200/30 dark:bg-dark-100/10'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-base-300 dark:border-dark-100">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <FiGrid />
                    </div>
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="p-1 text-lg font-bold bg-base-100 dark:bg-dark-200 border border-base-300 dark:border-dark-100 rounded focus:ring-primary focus:border-primary"
                                autoFocus
                            />
                            <button onClick={handleSaveName} className="p-1 text-green-500 hover:bg-green-50 rounded"><FiCheck/></button>
                            <button onClick={() => { setIsEditing(false); setEditName(block.name); }} className="p-1 text-red-500 hover:bg-red-50 rounded"><FiX/></button>
                        </div>
                    ) : (
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            {block.name}
                            <span className="text-sm font-normal text-gray-400 bg-base-300 dark:bg-dark-100 px-2 py-0.5 rounded-full">{cities.length}</span>
                        </h3>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isEditing && (
                        <>
                            <button 
                                onClick={handlePlanAllInBlock}
                                disabled={cities.length === 0}
                                className="flex items-center gap-2 bg-secondary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition shadow-sm disabled:opacity-50"
                            >
                                <FiClipboard size={14}/> Planejar Bloco
                            </button>
                            <button 
                                onClick={exportBlockPDF}
                                disabled={cities.length === 0}
                                className="flex items-center gap-2 bg-white dark:bg-dark-200 border border-base-300 dark:border-dark-100 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-base-100 dark:hover:bg-dark-100 transition shadow-sm disabled:opacity-50"
                            >
                                <FiDownload size={14}/> Exportar PDF
                            </button>
                            <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-primary transition" title="Renomear"><FiEdit2 size={16}/></button>
                            <button onClick={() => onDelete(block.id)} className="p-2 text-gray-400 hover:text-red-500 transition" title="Excluir Bloco"><FiTrash2 size={16}/></button>
                        </>
                    )}
                </div>
            </div>

            {cities.length === 0 ? (
                <div className="border-2 border-dashed border-base-300 dark:border-dark-100 rounded-xl p-10 text-center text-gray-400 italic">
                    Solte uma cidade aqui para agrupar.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cities.map(city => (
                        <CityCard 
                            key={city.id} 
                            city={city} 
                            blocks={allBlocks}
                            currentBlockId={block.id}
                            hasPlan={plans.some(p => p.cityId === city.id)}
                            onMove={onMoveCity}
                            onRemove={onRemoveCity}
                            onPlan={onPlanCity}
                            navigate={navigate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


const MarketIntelligence: React.FC = () => {
    const { cities, plans, marketData, marketBlocks, addMarketBlock, updateMarketBlock, deleteMarketBlock, moveCityToBlock, removeCityFromIntelligence, addPlanForCity } = useContext(DataContext);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newBlockName, setNewBlockName] = useState('');
    const [isUnassignedOver, setIsUnassignedOver] = useState(false);

    // --- Lógica para obter as cidades relevantes para esta tela ---
    const strategicCities = useMemo(() => {
        // Obter todos os IDs de cidades que já estão em algum bloco
        const assignedCityIds = new Set(marketBlocks.flatMap(b => b.cityIds));

        return cities.filter(city => {
            const hasPlan = plans.some(p => p.cityId === city.id);
            const hasIntelligenceData = marketData.some(m => m.cityId === city.id);
            const isRelevantStatus = [CityStatus.Planning, CityStatus.Expansion, CityStatus.Consolidated].includes(city.status);
            // CRÍTICO: Incluir se a cidade estiver em um bloco, mesmo que não tenha plano/status especial
            const isInBlock = assignedCityIds.has(city.id);
            
            return (hasPlan || isRelevantStatus || hasIntelligenceData || isInBlock);
        }).sort((a, b) => b.population - a.population);
    }, [cities, plans, marketData, marketBlocks]);

    // --- Organização por blocos ---
    const organizedData = useMemo(() => {
        const assignedCityIds = new Set(marketBlocks.flatMap(b => b.cityIds));
        
        // Cidades que são estratégicas mas não estão em nenhum bloco específico
        const unassigned = strategicCities.filter(c => !assignedCityIds.has(c.id));
        
        const blocksWithCities = marketBlocks.map(block => ({
            ...block,
            cities: block.cityIds
                .map(id => cities.find(c => c.id === id)) // Busca na lista total para garantir que encontramos IDs recém-adicionados
                .filter(Boolean) as City[]
        }));

        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            const filterFn = (c: City) => c.name.toLowerCase().includes(lowerTerm);
            
            return {
                unassigned: unassigned.filter(filterFn),
                blocks: blocksWithCities.map(b => ({
                    ...b,
                    cities: b.cities.filter(filterFn)
                }))
            };
        }

        return { unassigned, blocks: blocksWithCities };

    }, [strategicCities, marketBlocks, searchTerm, cities]);

    const handleCreateBlock = () => {
        if (newBlockName.trim()) {
            addMarketBlock(newBlockName);
            setNewBlockName('');
            setIsCreateModalOpen(false);
        }
    };

    const handleDeleteBlock = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este grupo? As cidades voltarão para a lista geral.")) {
            deleteMarketBlock(id);
        }
    };

    const handleRemoveFromIntelligence = (cityId: number) => {
        if (window.confirm("Isso removerá a cidade de todos os blocos e resetará as notas de inteligência. A cidade voltará para a lista de consulta geral. Continuar?")) {
            removeCityFromIntelligence(cityId);
        }
    };

    const handlePlanCity = (cityId: number) => {
        addPlanForCity(cityId);
    };

    const handleUnassignedDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsUnassignedOver(true);
    };

    const handleUnassignedDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsUnassignedOver(false);
        const cityId = e.dataTransfer.getData('cityId');
        if (cityId) {
            moveCityToBlock(parseInt(cityId), null);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center">
                        <FiBriefcase className="mr-3 text-primary"/> Inteligência de Mercado
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Organize as cidades estrategicamente arrastando-as entre os grupos.
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <FiSearch className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar cidade..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 p-2 rounded-lg bg-base-100 dark:bg-dark-200 border border-base-300 dark:border-dark-100 focus:ring-primary focus:border-primary shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition shadow-md whitespace-nowrap"
                    >
                        <FiPlus className="mr-2"/> Novo Grupo
                    </button>
                </div>
            </div>

            {/* Áreas de Blocos Customizados */}
            <div className="space-y-4">
                {organizedData.blocks.map(block => (
                    <BlockSection 
                        key={block.id}
                        block={block}
                        cities={block.cities}
                        allBlocks={marketBlocks}
                        plans={plans}
                        onRename={updateMarketBlock}
                        onDelete={handleDeleteBlock}
                        onMoveCity={moveCityToBlock}
                        onRemoveCity={handleRemoveFromIntelligence}
                        onPlanCity={handlePlanCity}
                        navigate={navigate}
                    />
                ))}
            </div>

            {/* Área Geral / Não Agrupadas */}
            <div 
                className={`mt-10 p-6 rounded-2xl transition-all border-2 ${isUnassignedOver ? 'border-primary bg-primary/5 shadow-inner' : 'border-dashed border-base-300 dark:border-dark-100 bg-base-200/20'}`}
                onDragOver={handleUnassignedDragOver}
                onDragLeave={() => setIsUnassignedOver(false)}
                onDrop={handleUnassignedDrop}
            >
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-base-300 dark:border-dark-100">
                    <div className="bg-gray-200 dark:bg-dark-100 text-gray-600 dark:text-gray-300 p-2 rounded-lg">
                        <FiGrid />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">
                        Cidades Não Agrupadas (Geral)
                        <span className="text-sm font-normal ml-2 text-gray-400 bg-base-300 dark:bg-dark-100 px-2 py-0.5 rounded-full">{organizedData.unassigned.length}</span>
                    </h3>
                </div>

                {organizedData.unassigned.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 italic">
                        Nenhuma cidade estratégica pendente de agrupamento.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {organizedData.unassigned.map(city => (
                            <CityCard 
                                key={city.id} 
                                city={city} 
                                blocks={marketBlocks}
                                currentBlockId={null}
                                hasPlan={plans.some(p => p.cityId === city.id)}
                                onMove={moveCityToBlock}
                                onRemove={handleRemoveFromIntelligence}
                                onPlan={handlePlanCity}
                                navigate={navigate}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Criação de Bloco */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Criar Novo Grupo Estratégico">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Organize cidades por prioridade, região ou fase (ex: "Expansão Norte", "Alta Prioridade").</p>
                    <div>
                        <label className="block text-sm font-bold mb-1">Nome do Grupo</label>
                        <input 
                            type="text" 
                            value={newBlockName}
                            onChange={(e) => setNewBlockName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateBlock()}
                            placeholder="Ex: Expansão Norte"
                            className="w-full p-2 rounded-lg border border-base-300 dark:border-dark-100 bg-base-100 dark:bg-dark-200 focus:ring-primary focus:border-primary"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-base-200 dark:hover:bg-dark-100 rounded-lg transition-colors">Cancelar</button>
                        <button onClick={handleCreateBlock} disabled={!newBlockName.trim()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors shadow-md">Criar Grupo</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MarketIntelligence;

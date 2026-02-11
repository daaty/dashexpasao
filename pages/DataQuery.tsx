
import React, { useState, useMemo, useEffect, useContext } from 'react';
import { City, CityStatus, Mesorregion, MarketBlock } from '../types';
import { calculatePotentialRevenue } from '../services/calculationService';
import Card from '../components/ui/Card';
import { FiFilter, FiX, FiDownload, FiBarChart2, FiChevronUp, FiChevronDown, FiArrowDown, FiArrowUp, FiExternalLink, FiBriefcase, FiPlusCircle, FiPackage, FiUsers, FiDollarSign, FiGrid, FiFolderPlus, FiCheck } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { slugify, formatMesorregion } from '../utils/textUtils';
import InfoTooltip from '../components/ui/InfoTooltip';
import { DataContext } from '../context/DataContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};


const DataQuery: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { cities, plans, addPlanForCity, addCityToIntelligence, marketBlocks, addCitiesToBlock } = useContext(DataContext);

    // Initialize state from URL or with defaults
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [selectedMesorregions, setSelectedMesorregions] = useState<Mesorregion[]>(searchParams.getAll('mesorregioes') as Mesorregion[] || []);
    const [minPopulation, setMinPopulation] = useState(Number(searchParams.get('pop')) || 0);
    const [minRevenue, setMinRevenue] = useState(Number(searchParams.get('rev')) || 0);
    const [selectedStatuses, setSelectedStatuses] = useState<CityStatus[]>(searchParams.getAll('status') as CityStatus[] || []);
    
    const [selectedCities, setSelectedCities] = useState<number[]>([]);
    const [isFiltersOpen, setIsFiltersOpen] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
    
    // State for Grouping Dropdowns
    const [activeCityMenu, setActiveCityMenu] = useState<number | null>(null);
    const [showBulkMenu, setShowBulkMenu] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Mapeamento de Cidades para seus Blocos para busca rápida
    const cityBlockMap = useMemo(() => {
        const map: Record<number, string> = {};
        marketBlocks.forEach(block => {
            block.cityIds.forEach(id => {
                map[id] = block.name;
            });
        });
        return map;
    }, [marketBlocks]);

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.set('q', debouncedSearchTerm);
        if (minPopulation > 0) params.set('pop', String(minPopulation));
        if (minRevenue > 0) params.set('rev', String(minRevenue));
        selectedMesorregions.forEach(r => params.append('mesorregioes', r));
        selectedStatuses.forEach(s => params.append('status', s));
        
        setSearchParams(params, { replace: true });
    }, [debouncedSearchTerm, selectedMesorregions, minPopulation, minRevenue, selectedStatuses, setSearchParams]);


    const handleMesorregionChange = (mesorregion: Mesorregion) => {
        setSelectedMesorregions(prev => 
            prev.includes(mesorregion) ? prev.filter(r => r !== mesorregion) : [...prev, mesorregion]
        );
    };

    const handleStatusChange = (status: CityStatus) => {
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedMesorregions([]);
        setMinPopulation(0);
        setMinRevenue(0);
        setSelectedStatuses([]);
    };

    const filteredCities = useMemo(() => {
        return cities.filter(city => {
            const potentialRevenue = calculatePotentialRevenue(city);
            return (
                (debouncedSearchTerm === '' || city.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) &&
                (selectedMesorregions.length === 0 || selectedMesorregions.includes(city.mesorregion)) &&
                (city.population >= minPopulation) && 
                (potentialRevenue >= minRevenue) &&
                (selectedStatuses.length === 0 || selectedStatuses.includes(city.status))
            );
        });
    }, [debouncedSearchTerm, selectedMesorregions, minPopulation, minRevenue, selectedStatuses, cities]);
    
    // Resumo GERAL - todas as cidades do MT
    const globalSummary = useMemo(() => {
        const totalCities = cities.length;
        const totalTargetPopulation = cities.reduce((acc, city) => acc + city.population15to44, 0);
        const totalFullPopulation = cities.reduce((acc, city) => acc + city.population, 0);
        
        const totalRevenue = cities.reduce((acc, city) => {
            acc.baixa += calculatePotentialRevenue(city, 'Baixa');
            acc.media += calculatePotentialRevenue(city, 'Média');
            acc.alta += calculatePotentialRevenue(city, 'Alta');
            return acc;
        }, { baixa: 0, media: 0, alta: 0 });

        return {
            totalCities,
            totalFullPopulation,
            totalTargetPopulation,
            averageTargetPopulation: totalCities > 0 ? totalTargetPopulation / totalCities : 0,
            totalRevenue,
        };
    }, [cities]);

    // Resumo FILTRADO - cidades que passaram nos filtros ou selecionadas
    const citiesForSummary = useMemo(() => {
        if (selectedCities.length > 0) {
            return cities.filter(city => selectedCities.includes(city.id));
        }
        return filteredCities;
    }, [selectedCities, filteredCities, cities]);

    const summary = useMemo(() => {
        const statusOrder = [CityStatus.Consolidated, CityStatus.Expansion, CityStatus.NotServed, CityStatus.Planning];

        const statusCounts = citiesForSummary.reduce((acc, city) => {
            acc[city.status] = (acc[city.status] || 0) + 1;
            return acc;
        }, {} as Record<CityStatus, number>);

        const totalCities = citiesForSummary.length;
        const totalTargetPopulation = citiesForSummary.reduce((acc, city) => acc + city.population15to44, 0);
        const totalFullPopulation = citiesForSummary.reduce((acc, city) => acc + city.population, 0);
        
        const totalRevenue = citiesForSummary.reduce((acc, city) => {
            acc.baixa += calculatePotentialRevenue(city, 'Baixa');
            acc.media += calculatePotentialRevenue(city, 'Média');
            acc.alta += calculatePotentialRevenue(city, 'Alta');
            return acc;
        }, { baixa: 0, media: 0, alta: 0 });

        return {
            totalCities: totalCities,
            totalFullPopulation: totalFullPopulation,
            totalTargetPopulation: totalTargetPopulation,
            averageTargetPopulation: totalCities > 0 ? totalTargetPopulation / totalCities : 0,
            totalRevenue,
            statusCounts,
            sortedStatuses: statusOrder.filter(status => statusCounts[status] > 0),
        };
    }, [citiesForSummary]);
    
    const sortedAndFilteredCities = useMemo(() => {
        let sortableItems = [...filteredCities];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                if (sortConfig.key === 'potentialRevenue') {
                    aValue = calculatePotentialRevenue(a, 'Média');
                    bValue = calculatePotentialRevenue(b, 'Média');
                } else {
                    aValue = a[sortConfig.key as keyof City];
                    bValue = b[sortConfig.key as keyof City];
                }
                
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                    const comparison = aValue.localeCompare(bValue, 'pt-BR');
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                }

                return 0;
            });
        }
        return sortableItems;
    }, [filteredCities, sortConfig]);

    const handleSelectCity = (cityId: number) => {
        setSelectedCities(prev => 
            prev.includes(cityId) ? prev.filter(id => id !== cityId) : [...prev, cityId]
        );
    };
    
    const handleSelectAllFiltered = (e: React.ChangeEvent<HTMLInputElement>) => {
        const filteredCityIds = sortedAndFilteredCities.map(c => c.id);
        if (e.target.checked) {
            setSelectedCities(prev => [...new Set([...prev, ...filteredCityIds])]);
        } else {
            setSelectedCities(prev => prev.filter(id => !filteredCityIds.includes(id)));
        }
    };
    
    const isAllFilteredSelected = sortedAndFilteredCities.length > 0 && sortedAndFilteredCities.every(c => selectedCities.includes(c.id));

    const handleCompare = () => {
        if (selectedCities.length > 0 && selectedCities.length <= 5) {
            localStorage.setItem('compareCityIds', JSON.stringify(selectedCities));
            navigate('/comparacao');
        } else if (selectedCities.length > 5) {
            alert('Selecione no máximo 5 cidades para comparar.');
        }
    };

    const handleAddPlan = (cityId: number) => {
        addPlanForCity(cityId);
        navigate('/planejamento');
    };

    const handleAddToBlock = (cityId: number, blockId: string) => {
        addCitiesToBlock([cityId], blockId);
        setActiveCityMenu(null);
    };

    const handleBulkAddToBlock = (blockId: string) => {
        addCitiesToBlock(selectedCities, blockId);
        setSelectedCities([]);
        setShowBulkMenu(false);
    };

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (columnKey: string) => {
        if (sortConfig?.key !== columnKey) {
            return <FiChevronDown className="ml-1 opacity-20" />;
        }
        return sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1" style={{ color: '#3b82f6' }} /> : <FiChevronDown className="ml-1" style={{ color: '#3b82f6' }} />;
    };

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const handleExportPDF = () => {
        const exportSource = selectedCities.length > 0 
            ? cities.filter(c => selectedCities.includes(c.id)).sort((a, b) => a.name.localeCompare(b.name))
            : sortedAndFilteredCities;

        if (exportSource.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });

        const tableColumns = [
            "Cidade", 
            "Status", 
            "Pop. Total", 
            "Pop. 15-44", 
            "Receita Pot. (Baixa)", 
            "Receita Pot. (Média)", 
            "Receita Pot. (Alta)"
        ];

        const tableRows = exportSource.map(city => [
            city.name,
            city.status,
            (city.population ?? 0).toLocaleString('pt-BR'),
            (city.population15to44 ?? 0).toLocaleString('pt-BR'),
            formatCurrency(calculatePotentialRevenue(city, 'Baixa')),
            formatCurrency(calculatePotentialRevenue(city, 'Média')),
            formatCurrency(calculatePotentialRevenue(city, 'Alta'))
        ]);

        // Calculate totals
        const totals = exportSource.reduce((acc, city) => {
            acc.population += city.population ?? 0;
            acc.population15to44 += city.population15to44 ?? 0;
            acc.revenueBaixa += calculatePotentialRevenue(city, 'Baixa');
            acc.revenueMedia += calculatePotentialRevenue(city, 'Média');
            acc.revenueAlta += calculatePotentialRevenue(city, 'Alta');
            return acc;
        }, {
            population: 0,
            population15to44: 0,
            revenueBaixa: 0,
            revenueMedia: 0,
            revenueAlta: 0,
        });

        // Create footer row
        const tableFooter = [[
            { content: 'TOTAIS', colSpan: 2, styles: { halign: 'right' } },
            totals.population.toLocaleString('pt-BR'),
            totals.population15to44.toLocaleString('pt-BR'),
            formatCurrency(totals.revenueBaixa),
            formatCurrency(totals.revenueMedia),
            formatCurrency(totals.revenueAlta)
        ]];


        const date = new Date().toLocaleDateString("pt-BR");
        const title = selectedCities.length > 0 ? "Relatório de Cidades Selecionadas" : "Relatório de Consulta de Cidades";

        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${date}`, 14, 29);
        if (selectedCities.length > 0) {
             doc.setFontSize(10);
             doc.text(`(Exportação de ${selectedCities.length} itens selecionados)`, 14, 34);
        }

        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            foot: tableFooter,
            startY: selectedCities.length > 0 ? 40 : 35,
            theme: 'striped',
            headStyles: { fillColor: [34, 197, 94], fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            footStyles: { fillColor: [229, 231, 235], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7 },
            styles: { cellPadding: 1.5 },
        });

        const fileName = selectedCities.length > 0 
            ? `cidades_selecionadas_urban_${new Date().toISOString().split('T')[0]}.pdf`
            : `consulta_cidades_urban_${new Date().toISOString().split('T')[0]}.pdf`;

        doc.save(fileName);
    };

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <Card 
                title={selectedCities.length > 0 ? "Resumo da Seleção" : "Resumo dos Filtros"}
                tooltipText="Este card resume os dados das cidades que atendem aos critérios de filtro. Cidades marcadas com riscado já pertencem a um bloco de inteligência."
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                    <div 
                        className="p-4 rounded-lg relative"
                        style={{
                            backgroundColor: 'rgb(0 0 0 / 30%)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgb(255 255 255 / 10%)'
                        }}
                    >
                        <InfoTooltip text={selectedCities.length > 0 ? "Quantidade de cidades selecionadas." : "Total de municípios do Mato Grosso."} className="absolute top-2 right-2" />
                        <FiPackage className="mx-auto text-3xl mb-2" style={{ color: '#3b82f6' }} />
                        <p className="text-2xl font-bold" style={{ color: '#ffffff' }}>{(selectedCities.length > 0 ? summary.totalCities : globalSummary.totalCities).toLocaleString('pt-BR')}</p>
                        <p className="text-sm" style={{ color: 'rgb(255 255 255 / 70%)' }}>{selectedCities.length > 0 ? 'Cidades Selecionadas' : 'Cidades MT'}</p>
                    </div>
                     <div 
                        className="p-4 rounded-lg relative"
                        style={{
                            backgroundColor: 'rgb(0 0 0 / 30%)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgb(255 255 255 / 10%)'
                        }}
                    >
                        <InfoTooltip text={selectedCities.length > 0 ? "População total das cidades selecionadas." : "População total somada de todos os municípios do Mato Grosso."} className="absolute top-2 right-2" />
                        <FiUsers className="mx-auto text-3xl mb-2" style={{ color: '#17a2b8' }} />
                        <p className="text-2xl font-bold" style={{ color: '#ffffff' }}>{(selectedCities.length > 0 ? summary.totalFullPopulation : globalSummary.totalFullPopulation).toLocaleString('pt-BR')}</p>
                        <p className="text-sm" style={{ color: 'rgb(255 255 255 / 70%)' }}>{selectedCities.length > 0 ? 'População Total' : 'População Total MT'}</p>
                    </div>
                     <div 
                        className="p-4 rounded-lg relative"
                        style={{
                            backgroundColor: 'rgb(0 0 0 / 30%)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgb(255 255 255 / 10%)'
                        }}
                    >
                        <InfoTooltip text={selectedCities.length > 0 ? "População alvo (15-44 anos) das cidades selecionadas." : "Soma total da população entre 15-44 anos (público-alvo) de todas as cidades do MT."} className="absolute top-2 right-2" />
                        <FiUsers className="mx-auto text-3xl mb-2" style={{ color: '#ffc107' }} />
                        <p className="text-2xl font-bold" style={{ color: '#ffffff' }}>{(selectedCities.length > 0 ? summary.totalTargetPopulation : globalSummary.totalTargetPopulation).toLocaleString('pt-BR')}</p>
                        <p className="text-sm" style={{ color: 'rgb(255 255 255 / 70%)' }}>Pop. Alvo Total (15-44)</p>
                        <p className="text-xs mt-1" style={{ color: 'rgb(255 255 255 / 60%)' }}>Média: {Math.round(selectedCities.length > 0 ? summary.averageTargetPopulation : globalSummary.averageTargetPopulation).toLocaleString('pt-BR')}</p>
                    </div>
                     <div 
                        className="p-4 rounded-lg relative"
                        style={{
                            backgroundColor: 'rgb(0 0 0 / 30%)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgb(255 255 255 / 10%)'
                        }}
                    >
                        <InfoTooltip text={selectedCities.length > 0 ? "Receita potencial das cidades selecionadas." : "Receita potencial estimada somando todas as cidades do Mato Grosso."} className="absolute top-2 right-2" />
                        <FiDollarSign className="mx-auto text-3xl mb-2" style={{ color: '#08a50e' }} />
                        <p className="text-2xl font-bold" style={{ color: '#ffffff' }}>{formatCurrency((selectedCities.length > 0 ? summary.totalRevenue : globalSummary.totalRevenue).media)}</p>
                        <p className="text-sm" style={{ color: 'rgb(255 255 255 / 70%)' }}>{selectedCities.length > 0 ? 'Receita Potencial' : 'Receita Potencial MT'}</p>
                         <div className="flex justify-between text-xs mt-2 px-2">
                            <span className="flex items-center font-semibold" style={{ color: '#f62718' }}>
                                <FiArrowDown className="mr-1" /> {formatCurrency((selectedCities.length > 0 ? summary.totalRevenue : globalSummary.totalRevenue).baixa)}
                            </span>
                            <span className="flex items-center font-semibold" style={{ color: '#08a50e' }}>
                                <FiArrowUp className="mr-1" /> {formatCurrency((selectedCities.length > 0 ? summary.totalRevenue : globalSummary.totalRevenue).alta)}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            <Card
                title="Exploração de Mercado"
                tooltipText="Use os filtros abaixo para encontrar o próximo alvo da Urban. Cidades com o nome riscado já foram adicionadas a blocos estratégicos."
            >
                {/* Collapsible Filters Section */}
                <div className="mb-6 pb-6" style={{ borderBottom: '1px solid rgb(255 255 255 / 10%)' }}>
                    <div 
                        className="flex justify-between items-center cursor-pointer" 
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    >
                        <div className="flex items-center">
                            <h2 className="text-lg font-semibold flex items-center" style={{ color: '#ffffff' }}><FiFilter className="mr-2"/>Filtros Inteligentes</h2>
                            {!isFiltersOpen && <span className="ml-4 text-sm hidden sm:inline" style={{ color: 'rgb(255 255 255 / 70%)' }}>Clique para expandir</span>}
                        </div>
                        <button 
                            className="p-2 rounded-full transition-colors"
                            style={{ color: 'rgb(255 255 255 / 80%)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(255 255 255 / 10%)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {isFiltersOpen ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                    </div>
                    
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isFiltersOpen ? 'max-h-[500px] pt-6' : 'max-h-0'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="font-semibold text-sm mb-1 block" style={{ color: 'rgb(255 255 255 / 80%)' }}>Busca por Nome</label>
                                    <input 
                                        type="text" 
                                        value={searchTerm} 
                                        onChange={e => setSearchTerm(e.target.value)} 
                                        placeholder="Ex: Cuiabá" 
                                        className="w-full p-2 rounded-md focus:outline-none"
                                        style={{
                                            backgroundColor: 'rgb(0 0 0 / 30%)',
                                            border: '1px solid rgb(255 255 255 / 15%)',
                                            color: '#ffffff'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-sm mb-2 block" style={{ color: 'rgb(255 255 255 / 80%)' }}>Mesorregião</label>
                                    <div className="space-y-2">
                                        {(Object.values(Mesorregion) as Mesorregion[]).map(mesorregion => (
                                            <label key={mesorregion} className="flex items-center space-x-2 text-sm cursor-pointer" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedMesorregions.includes(mesorregion)} 
                                                    onChange={() => handleMesorregionChange(mesorregion)} 
                                                    className="form-checkbox h-4 w-4 rounded"
                                                    style={{ accentColor: '#3b82f6' }}
                                                />
                                                <span>{formatMesorregion(mesorregion)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="font-semibold text-sm mb-2 block" style={{ color: 'rgb(255 255 255 / 80%)' }}>Status</label>
                                    <div className="space-y-2">
                                        {(Object.values(CityStatus) as CityStatus[]).filter(s => s !== CityStatus.Planning).map(status => (
                                            <label key={status} className="flex items-center space-x-2 text-sm cursor-pointer" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedStatuses.includes(status)} 
                                                    onChange={() => handleStatusChange(status)} 
                                                    className="form-checkbox h-4 w-4 rounded"
                                                    style={{ accentColor: '#3b82f6' }}
                                                />
                                                <span>{status}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="font-semibold text-sm" style={{ color: 'rgb(255 255 255 / 80%)' }}>População Total Mínima</label>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="200000" 
                                        step="10000" 
                                        value={minPopulation} 
                                        onChange={e => setMinPopulation(Number(e.target.value))} 
                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer mt-1"
                                        style={{ backgroundColor: 'rgb(255 255 255 / 20%)', accentColor: '#3b82f6' }}
                                    />
                                    <div className="text-right text-sm" style={{ color: 'rgb(255 255 255 / 80%)' }}>{minPopulation.toLocaleString('pt-BR')}</div>
                                </div>
                                <div>
                                    <label className="font-semibold text-sm" style={{ color: 'rgb(255 255 255 / 80%)' }}>Receita Potencial Mínima</label>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="50000" 
                                        step="1000" 
                                        value={minRevenue} 
                                        onChange={e => setMinRevenue(Number(e.target.value))} 
                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer mt-1"
                                        style={{ backgroundColor: 'rgb(255 255 255 / 20%)', accentColor: '#3b82f6' }}
                                    />
                                    <div className="text-right text-sm" style={{ color: 'rgb(255 255 255 / 80%)' }}>{minRevenue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</div>
                                </div>
                                <div className="pt-4">
                                    <button 
                                        onClick={clearFilters} 
                                        className="w-full flex items-center justify-center py-2 px-4 rounded-lg transition-colors"
                                        style={{
                                            backgroundColor: 'rgb(255 255 255 / 15%)',
                                            color: '#ffffff',
                                            border: '1px solid rgb(255 255 255 / 20%)'
                                        }}
                                    >
                                        <FiX className="mr-2"/>Limpar Filtros
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                 <div className="flex flex-wrap justify-end items-center mb-4 gap-2">
                    <div className="flex space-x-2 items-center">
                        {/* BULK ACTIONS MENU */}
                        {selectedCities.length > 0 && (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowBulkMenu(!showBulkMenu)}
                                    className="flex items-center py-2 px-4 rounded-lg transition-colors"
                                    style={{
                                        backgroundColor: '#3b82f6',
                                        color: '#ffffff'
                                    }}
                                >
                                    <FiFolderPlus className="mr-2"/> Agrupar ({selectedCities.length})
                                </button>
                                {showBulkMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowBulkMenu(false)}></div>
                                        <div 
                                            className="absolute right-0 top-full mt-1 w-56 rounded-lg shadow-xl z-20 py-1 text-sm"
                                            style={{
                                                backgroundColor: '#1e1e1e',
                                                border: '1px solid rgb(255 255 255 / 10%)'
                                            }}
                                        >
                                            <div className="px-3 py-1 text-xs font-semibold uppercase" style={{ color: 'rgb(255 255 255 / 70%)' }}>Mover selecionadas para...</div>
                                            {marketBlocks.length === 0 && (
                                                <div className="px-4 py-2 italic" style={{ color: 'rgb(255 255 255 / 60%)' }}>Crie blocos na aba Inteligência</div>
                                            )}
                                            {marketBlocks.map(block => (
                                                <button 
                                                    key={block.id}
                                                    onClick={() => handleBulkAddToBlock(block.id)}
                                                    className="w-full text-left px-4 py-2 truncate transition-colors"
                                                    style={{ color: 'rgb(255 255 255 / 80%)' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(255 255 255 / 10%)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    {block.name}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <button 
                            onClick={handleCompare} 
                            disabled={selectedCities.length === 0 || selectedCities.length > 5} 
                            className="flex items-center py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: selectedCities.length === 0 || selectedCities.length > 5 ? 'rgb(255 255 255 / 20%)' : '#17a2b8',
                                color: '#ffffff',
                                opacity: selectedCities.length === 0 || selectedCities.length > 5 ? 0.5 : 1
                            }}
                        >
                            <FiBarChart2 className="mr-2"/>Comparar ({selectedCities.length})
                        </button>
                         <button 
                            onClick={handleExportPDF} 
                            disabled={sortedAndFilteredCities.length === 0 && selectedCities.length === 0}
                            className="flex items-center py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                            style={{
                                backgroundColor: 'transparent',
                                border: '1px solid rgb(255 255 255 / 20%)',
                                color: 'rgb(255 255 255 / 80%)'
                            }}
                         >
                            <FiDownload className="mr-2"/>PDF
                         </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto min-h-[400px] dt-table-container">
                    <table className="w-full text-left min-w-[1024px] dt-table">
                        <thead style={{ background: 'rgba(55, 65, 81, 0.9)', borderBottom: '2px solid rgba(59, 130, 246, 0.5)' }}>
                            <tr>
                                <th className="p-3 w-12">
                                    <input 
                                        type="checkbox" 
                                        className="form-checkbox h-4 w-4 rounded" 
                                        style={{ accentColor: '#3b82f6' }}
                                        onChange={handleSelectAllFiltered} 
                                        checked={isAllFilteredSelected} 
                                    />
                                </th>
                                <th className="p-3">
                                    <button onClick={() => requestSort('name')} className="flex items-center text-xs font-semibold uppercase tracking-wider text-left transition-colors" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                                        Cidade {getSortIndicator('name')}
                                    </button>
                                </th>
                                <th className="p-3">
                                    <button onClick={() => requestSort('population')} className="flex items-center text-xs font-semibold uppercase tracking-wider text-left transition-colors" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                                        Pop. Total {getSortIndicator('population')}
                                    </button>
                                </th>
                                <th className="p-3">
                                    <button onClick={() => requestSort('population15to44')} className="flex items-center text-xs font-semibold uppercase tracking-wider text-left transition-colors" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                                        Pop. 15-44 {getSortIndicator('population15to44')}
                                    </button>
                                </th>
                                <th className="p-3">
                                    <button onClick={() => requestSort('potentialRevenue')} className="flex items-center text-xs font-semibold uppercase tracking-wider text-left transition-colors" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                                        Receita Potencial {getSortIndicator('potentialRevenue')}
                                    </button>
                                </th>
                                <th className="p-3">
                                    <button onClick={() => requestSort('status')} className="flex items-center text-xs font-semibold uppercase tracking-wider text-left transition-colors" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                                        Status {getSortIndicator('status')}
                                    </button>
                                </th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredCities.map((city, index) => {
                                const hasPlan = plans.some(p => p.cityId === city.id);
                                // Permitir adicionar se não tem plano OU se tem plano mas status não é Planning
                                const canAddPlan = !hasPlan || (hasPlan && city.status !== CityStatus.Planning);
                                const blockName = cityBlockMap[city.id];
                                const isInBlock = !!blockName;

                                return (
                                    <tr 
                                        key={city.id} 
                                        className="transition-colors hover:bg-gray-700/40"
                                        style={{
                                            borderBottom: '1px solid rgb(255 255 255 / 8%)',
                                            backgroundColor: selectedCities.includes(city.id) 
                                                ? 'rgba(59, 130, 246, 0.15)' 
                                                : isInBlock 
                                                    ? 'rgba(23, 162, 184, 0.1)' 
                                                    : index % 2 === 0 
                                                        ? 'rgba(55, 65, 81, 0.3)' 
                                                        : 'transparent',
                                            opacity: isInBlock ? 0.85 : 1
                                        }}
                                    >
                                        <td className="p-3">
                                            <input 
                                                type="checkbox" 
                                                className="form-checkbox h-4 w-4 rounded" 
                                                style={{ accentColor: '#3b82f6' }}
                                                checked={selectedCities.includes(city.id)} 
                                                onChange={() => handleSelectCity(city.id)}
                                            />
                                        </td>
                                        <td className="p-3 font-semibold">
                                            <div className="flex flex-col">
                                                <button 
                                                    onClick={() => navigate(`/cidades/${city.id}`)}
                                                    className={`text-left transition-colors duration-200 ${isInBlock ? 'line-through decoration-2' : ''}`}
                                                    style={{ 
                                                        color: isInBlock ? 'rgb(255 255 255 / 70%)' : 'rgb(255 255 255 / 90%)',
                                                        textDecorationColor: isInBlock ? '#f62718' : undefined
                                                    }}
                                                >
                                                    {city.name}
                                                </button>
                                                {isInBlock && (
                                                    <span className="text-[10px] font-bold uppercase mt-1 flex items-center" style={{ color: '#17a2b8' }}>
                                                        <FiCheck className="mr-1"/> No bloco: {blockName}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3" style={{ color: 'rgb(255 255 255 / 80%)' }}>{city.population?.toLocaleString('pt-BR') ?? '-'}</td>
                                        <td className="p-3" style={{ color: 'rgb(255 255 255 / 80%)' }}>{city.population15to44?.toLocaleString('pt-BR') ?? '-'}</td>
                                        <td className="p-3">
                                            <div className="flex flex-col text-sm">
                                                <span className="font-semibold" style={{ color: '#ffffff' }}>{formatCurrency(calculatePotentialRevenue(city, 'Média'))}</span>
                                                <div className="flex justify-between items-center text-[10px] mt-1" style={{ color: 'rgb(255 255 255 / 70%)' }}>
                                                    <span>Min: {formatCurrency(calculatePotentialRevenue(city, 'Baixa'))}</span>
                                                    <span style={{ color: '#08a50e' }}>Max: {formatCurrency(calculatePotentialRevenue(city, 'Alta'))}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm">
                                            <span 
                                                className="px-2 py-0.5 rounded-full"
                                                style={{
                                                    backgroundColor: city.status === CityStatus.Consolidated ? 'rgba(8, 165, 14, 0.2)' :
                                                        city.status === CityStatus.Expansion ? 'rgba(255, 193, 7, 0.2)' :
                                                        city.status === CityStatus.Planning ? 'rgba(23, 162, 184, 0.2)' :
                                                        'rgb(255 255 255 / 15%)',
                                                    color: city.status === CityStatus.Consolidated ? '#08a50e' :
                                                        city.status === CityStatus.Expansion ? '#ffc107' :
                                                        city.status === CityStatus.Planning ? '#17a2b8' :
                                                        'rgb(255 255 255 / 80%)'
                                                }}
                                            >
                                                {city.status}
                                            </span>
                                        </td>
                                        <td className="p-3 flex items-center space-x-3">
                                            <a 
                                                href={`https://cidades.ibge.gov.br/brasil/mt/${slugify(city.name)}/panorama`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={`Ver ${city.name} no IBGE Cidades`}
                                                className="transition-colors"
                                                style={{ color: 'rgb(255 255 255 / 70%)' }}
                                            >
                                                <FiExternalLink className="h-4 w-4" />
                                            </a>
                                            
                                            {/* ADD TO BLOCK DROPDOWN */}
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setActiveCityMenu(activeCityMenu === city.id ? null : city.id)}
                                                    className="transition-colors"
                                                    style={{ color: isInBlock ? '#17a2b8' : 'rgb(255 255 255 / 70%)' }}
                                                    title={isInBlock ? "Mudar de Bloco" : "Mover para Bloco Estratégico"}
                                                >
                                                    <FiGrid className="h-4 w-4" />
                                                </button>
                                                {activeCityMenu === city.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setActiveCityMenu(null)}></div>
                                                        <div 
                                                            className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl z-20 py-1 text-xs"
                                                            style={{
                                                                backgroundColor: '#1e1e1e',
                                                                border: '1px solid rgb(255 255 255 / 10%)'
                                                            }}
                                                        >
                                                            <div className="px-3 py-1 font-bold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 70%)' }}>Selecionar Bloco</div>
                                                            {marketBlocks.length === 0 && (
                                                                <div className="px-3 py-2 italic" style={{ color: 'rgb(255 255 255 / 60%)' }}>Vá em Inteligência para criar blocos</div>
                                                            )}
                                                            {marketBlocks.map(block => (
                                                                <button 
                                                                    key={block.id}
                                                                    onClick={() => handleAddToBlock(city.id, block.id)}
                                                                    className="w-full text-left px-4 py-2 flex justify-between items-center transition-colors"
                                                                    style={{ color: 'rgb(255 255 255 / 80%)' }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(255 255 255 / 10%)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                >
                                                                    <span className="truncate">{block.name}</span>
                                                                    {blockName === block.name && <FiCheck style={{ color: '#08a50e' }}/>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleAddPlan(city.id); }}
                                                disabled={!canAddPlan}
                                                className="transition-colors"
                                                style={{ 
                                                    color: !canAddPlan ? 'rgb(255 255 255 / 30%)' : '#17a2b8',
                                                    cursor: !canAddPlan ? 'not-allowed' : 'pointer'
                                                }}
                                                title={!canAddPlan ? "Já está no planejamento" : "Iniciar Expansão"}
                                            >
                                                <FiPlusCircle className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default DataQuery;

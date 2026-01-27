import React, { useState, useMemo } from 'react';
import { FiDollarSign, FiTrendingUp, FiDollarSign as FiCost, FiTarget, FiBarChart2, FiZap } from 'react-icons/fi';
import Card from './ui/Card';

// ========================================
// INTERFACES
// ========================================

interface MonthData {
    month: string;
    expectedRides: number;
    marketingProjected: number;
    operationalProjected: number;
    projectedRevenue: number;
    actualRides: number;
    marketingReal: number;
    operationalReal: number;
    actualRevenue: number;
    totalCostProjected: number;
    totalCostReal: number;
    costPerRideProjected: number;
    costPerRideReal: number;
}

interface FinancialProjectionProps {
    cityName: string;
    monthlyCosts: { [key: string]: { marketingCost: number; operationalCost: number } };
    monthlyRealCosts?: { [key: string]: { marketingCost: number; operationalCost: number } };
    expectedRides: { [key: string]: number };
    actualRides?: { [key: string]: number };
    projectedRevenue?: { [key: string]: number };
    actualRevenue?: { [key: string]: number };
    onCostsChange: (monthKey: string, field: 'marketingCost' | 'operationalCost', value: number, isReal?: boolean) => void;
    isEditing: boolean;
    onToggleEdit: () => void;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

const formatCurrency = (value: number, compact = false): string => {
    if (compact && Math.abs(value) >= 1000) {
        return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
    }).format(value);
};

const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value));
};

const getPercentageColor = (percent: number): string => {
    if (percent >= 100) return 'text-green-600 dark:text-green-400';
    if (percent >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
};

const formatMonthDisplay = (monthKey: string): { monthName: string; monthYear: string } => {
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const [year, month] = monthKey.split('-');
    const monthIndex = parseInt(month) - 1;
    const monthName = monthNames[monthIndex] || monthKey;
    const monthYear = `${month}/${year}`;
    
    return { monthName, monthYear };
};

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

const FinancialProjection: React.FC<FinancialProjectionProps> = ({
    monthlyCosts,
    monthlyRealCosts = {},
    expectedRides,
    actualRides = {},
    projectedRevenue = {},
    actualRevenue = {},
    onCostsChange,
    isEditing,
    onToggleEdit,
}) => {
    const [editingCell, setEditingCell] = useState<{ month: string; field: string } | null>(null);
    const [editValue, setEditValue] = useState<number>(0);

    // ========================================
    // PROCESSAMENTO DE DADOS
    // ========================================

    const monthsData = useMemo<MonthData[]>(() => {
        const months = Object.keys(monthlyCosts).sort();
        
        return months.map(monthKey => {
            const costs = monthlyCosts[monthKey] || { marketingCost: 0, operationalCost: 0 };
            const realCosts = monthlyRealCosts[monthKey] || { marketingCost: 0, operationalCost: 0 };
            const rides = expectedRides[monthKey] || 0;
            const realRides = actualRides[monthKey] || 0;
            const projRev = projectedRevenue[monthKey] || 0;
            const actRev = actualRevenue[monthKey] || 0;
            const totalCostProjected = costs.marketingCost + costs.operationalCost;
            const totalCostReal = realCosts.marketingCost + realCosts.operationalCost;
            const costPerRideProjected = rides > 0 ? totalCostProjected / rides : 0;
            const costPerRideReal = realRides > 0 ? totalCostReal / realRides : 0;
            
            return {
                month: monthKey,
                expectedRides: rides,
                marketingProjected: costs.marketingCost,
                operationalProjected: costs.operationalCost,
                projectedRevenue: projRev,
                actualRides: realRides,
                marketingReal: realCosts.marketingCost,
                operationalReal: realCosts.operationalCost,
                actualRevenue: actRev,
                totalCostProjected,
                totalCostReal,
                costPerRideProjected,
                costPerRideReal,
            };
        });
    }, [monthlyCosts, monthlyRealCosts, expectedRides, actualRides, projectedRevenue, actualRevenue]);

    // ========================================
    // TOTAIS
    // ========================================

    const totals = useMemo(() => {
        const result = {
            expectedRides: 0, actualRides: 0,
            marketingProjected: 0, operationalProjected: 0,
            marketingReal: 0, operationalReal: 0,
            projectedRevenue: 0, actualRevenue: 0,
            totalCostProjected: 0, totalCostReal: 0,
        };
        monthsData.forEach(m => {
            result.expectedRides += m.expectedRides;
            result.actualRides += m.actualRides;
            result.marketingProjected += m.marketingProjected;
            result.operationalProjected += m.operationalProjected;
            result.marketingReal += m.marketingReal;
            result.operationalReal += m.operationalReal;
            result.projectedRevenue += m.projectedRevenue;
            result.actualRevenue += m.actualRevenue;
            result.totalCostProjected += m.totalCostProjected;
            result.totalCostReal += m.totalCostReal;
        });
        return result;
    }, [monthsData]);

    const avgCostPerRideProjected = totals.expectedRides > 0 ? totals.totalCostProjected / totals.expectedRides : 0;
    const avgCostPerRideReal = totals.actualRides > 0 ? totals.totalCostReal / totals.actualRides : 0;

    // ========================================
    // HANDLERS DE EDIÇÃO
    // ========================================

    const handleStartEdit = (month: string, field: string, currentValue: number) => {
        if (!isEditing) return;
        setEditingCell({ month, field });
        setEditValue(currentValue);
    };

    const handleSaveEdit = () => {
        if (editingCell) {
            onCostsChange(editingCell.month, editingCell.field as 'marketingCost' | 'operationalCost', editValue, true);
            setEditingCell(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingCell(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSaveEdit();
        if (e.key === 'Escape') handleCancelEdit();
    };

    // ========================================
    // RENDER HELPERS
    // ========================================

    const renderComparisonCell = (actual: number, projected: number) => {
        if (actual === 0) return <span className="text-gray-400">-</span>;
        const percent = projected > 0 ? (actual / projected) * 100 : 0;
        const diff = actual - projected;
        const color = getPercentageColor(percent);
        return (
            <div className="flex flex-col items-end">
                <span className={`font-semibold ${color}`}>{formatNumber(actual)}</span>
                {projected > 0 && (
                    <span className={`text-[10px] ${color}`}>
                        {diff > 0 ? '+' : ''}{formatNumber(diff)} ({percent.toFixed(0)}%)
                    </span>
                )}
            </div>
        );
    };

    const renderRevenueComparisonCell = (actual: number, projected: number) => {
        if (actual === 0) return <span className="text-gray-400">-</span>;
        const percent = projected > 0 ? (actual / projected) * 100 : 0;
        const color = getPercentageColor(percent);
        return (
            <div className="flex flex-col items-end">
                <span className={`font-semibold ${color}`}>{formatCurrency(actual)}</span>
                {projected > 0 && (
                    <span className={`text-[10px] ${color}`}>{percent.toFixed(0)}% da meta</span>
                )}
            </div>
        );
    };

    const renderEditableCell = (month: string, field: string, value: number) => {
        const isCurrentlyEditing = editingCell?.month === month && editingCell?.field === field;
        if (isCurrentlyEditing) {
            return (
                <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveEdit}
                    className="w-20 px-2 py-1 text-right text-sm rounded border border-green-400 dark:border-green-600 bg-white dark:bg-dark-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoFocus
                />
            );
        }
        return (
            <span 
                className={`cursor-pointer transition hover:bg-green-100 dark:hover:bg-green-900/30 px-1 rounded ${
                    value > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'
                }`}
                onClick={() => handleStartEdit(month, field, value)}
                title={isEditing ? 'Clique para editar' : 'Ative o modo de edição'}
            >
                {value > 0 ? formatCurrency(value) : '-'}
            </span>
        );
    };

    // ========================================
    // RENDER
    // ========================================

    return (
        <Card className="mb-6">
            <div className="bg-gradient-to-br from-base-100 to-base-200 dark:from-dark-200 dark:to-dark-100 p-6 rounded-xl border border-base-300 dark:border-dark-100 shadow-lg">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                            <FiDollarSign className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                Projeção vs Realidade Financeira
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Comparação entre metas e resultados reais
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onToggleEdit}
                        className={`px-4 py-2 rounded-lg font-medium transition-all shadow-md ${
                            isEditing
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                        {isEditing ? 'Finalizar Edição' : 'Editar Custos Reais'}
                    </button>
                </div>

                {/* KPIs Resumo */}
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
                    {/* Total Corridas */}
                    <Card gradient>
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                                <div 
                                    className="p-3 rounded-xl mr-3 shadow-sm"
                                    style={{ background: 'rgb(255 255 255 / 15%)' }}
                                >
                                    <FiTrendingUp className="w-5 h-5" style={{ color: '#c084fc' }} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(255 255 255 / 50%)' }}>Corridas</p>
                                    <p className="text-2xl font-black" style={{ color: '#c084fc' }}>
                                        {formatNumber(totals.actualRides)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-2 text-xs" style={{ borderTop: '1px solid rgb(255 255 255 / 15%)', color: 'rgb(255 255 255 / 50%)' }}>
                            {totals.expectedRides > 0 && (
                                <span className={getPercentageColor((totals.actualRides / totals.expectedRides) * 100)}>
                                    {((totals.actualRides / totals.expectedRides) * 100).toFixed(0)}% da meta
                                </span>
                            )}
                        </div>
                    </Card>
                    
                    {/* Total Custos */}
                    <Card gradient>
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                                <div 
                                    className="p-3 rounded-xl mr-3 shadow-sm"
                                    style={{ background: 'rgb(255 255 255 / 15%)' }}
                                >
                                    <FiDollarSign className="w-5 h-5" style={{ color: '#93c5fd' }} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(255 255 255 / 50%)' }}>Custos</p>
                                    <p className="text-2xl font-black" style={{ color: '#93c5fd' }}>
                                        {formatCurrency(totals.totalCostProjected, true)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-2 text-xs" style={{ borderTop: '1px solid rgb(255 255 255 / 15%)', color: 'rgb(255 255 255 / 50%)' }}>
                            Real: {formatCurrency(totals.totalCostReal, true)}
                        </div>
                    </Card>
                    
                    {/* Receita Projetada */}
                    <Card gradient>
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                                <div 
                                    className="p-3 rounded-xl mr-3 shadow-sm"
                                    style={{ background: 'rgb(255 255 255 / 15%)' }}
                                >
                                    <FiTarget className="w-5 h-5" style={{ color: '#fed7aa' }} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(255 255 255 / 50%)' }}>Receita</p>
                                    <p className="text-2xl font-black" style={{ color: '#fed7aa' }}>
                                        {formatCurrency(totals.projectedRevenue, true)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-2 text-xs" style={{ borderTop: '1px solid rgb(255 255 255 / 15%)', color: 'rgb(255 255 255 / 50%)' }}>
                            {totals.actualRevenue > 0 && (
                                <span>Real: {formatCurrency(totals.actualRevenue, true)}</span>
                            )}
                        </div>
                    </Card>
                    
                    {/* Custo por Corrida */}
                    <Card gradient>
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                                <div 
                                    className="p-3 rounded-xl mr-3 shadow-sm"
                                    style={{ background: 'rgb(255 255 255 / 15%)' }}
                                >
                                    <FiBarChart2 className="w-5 h-5" style={{ color: '#67e8f9' }} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(255 255 255 / 50%)' }}>Custo/Corrida</p>
                                    <p className="text-2xl font-black" style={{ color: '#67e8f9' }}>
                                        R$ {avgCostPerRideProjected.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-2 text-xs" style={{ borderTop: '1px solid rgb(255 255 255 / 15%)', color: 'rgb(255 255 255 / 50%)' }}>
                            {avgCostPerRideReal > 0 && (
                                <span>Real: R$ {avgCostPerRideReal.toFixed(2)}</span>
                            )}
                        </div>
                    </Card>

                    {/* CPA Marketing */}
                    {(() => {
                        let totalMarketing = 0;
                        let totalRides = totals.expectedRides || 1;
                        Object.values(monthlyCosts).forEach(costs => {
                            totalMarketing += costs.marketingCost || 0;
                        });
                        const cpaMarketing = totalRides > 0 ? totalMarketing / totalRides : 0;
                        if (totalMarketing === 0) return null;
                        return (
                            <Card gradient>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center">
                                        <div 
                                            className="p-3 rounded-xl mr-3 shadow-sm"
                                            style={{ background: 'rgb(255 255 255 / 15%)' }}
                                        >
                                            <FiZap className="w-5 h-5" style={{ color: '#93c5fd' }} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(255 255 255 / 50%)' }}>CPA Marketing</p>
                                            <p className="text-2xl font-black" style={{ color: '#93c5fd' }}>
                                                {cpaMarketing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 text-xs" style={{ borderTop: '1px solid rgb(255 255 255 / 15%)', color: 'rgb(255 255 255 / 50%)' }}>
                                    por passageiro
                                </div>
                            </Card>
                        );
                    })()}

                    {/* Ops / Passageiro */}
                    {(() => {
                        let totalOperational = 0;
                        let totalRides = totals.expectedRides || 1;
                        Object.values(monthlyCosts).forEach(costs => {
                            totalOperational += costs.operationalCost || 0;
                        });
                        const opsPerPassenger = totalRides > 0 ? totalOperational / totalRides : 0;
                        if (totalOperational === 0) return null;
                        return (
                            <Card gradient>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center">
                                        <div 
                                            className="p-3 rounded-xl mr-3 shadow-sm"
                                            style={{ background: 'rgb(255 255 255 / 15%)' }}
                                        >
                                            <FiTrendingUp className="w-5 h-5" style={{ color: '#c084fc' }} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(255 255 255 / 50%)' }}>Ops / Passageiro</p>
                                            <p className="text-2xl font-black" style={{ color: '#c084fc' }}>
                                                {opsPerPassenger.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 text-xs" style={{ borderTop: '1px solid rgb(255 255 255 / 15%)', color: 'rgb(255 255 255 / 50%)' }}>
                                    eficiência local
                                </div>
                            </Card>
                        );
                    })()}

                    {/* Custo Total (CAC) */}
                    {(() => {
                        let totalMarketing = 0;
                        let totalOperational = 0;
                        let totalRides = totals.expectedRides || 1;
                        Object.values(monthlyCosts).forEach(costs => {
                            totalMarketing += costs.marketingCost || 0;
                            totalOperational += costs.operationalCost || 0;
                        });
                        const cacTotal = totalRides > 0 ? (totalMarketing + totalOperational) / totalRides : 0;
                        if (totalMarketing === 0 && totalOperational === 0) return null;
                        return (
                            <Card gradient>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center">
                                        <div 
                                            className="p-3 rounded-xl mr-3 shadow-sm"
                                            style={{ background: 'rgb(255 255 255 / 15%)' }}
                                        >
                                            <FiDollarSign className="w-5 h-5" style={{ color: '#67e8f9' }} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgb(255 255 255 / 50%)' }}>Custo Total</p>
                                            <p className="text-2xl font-black" style={{ color: '#67e8f9' }}>
                                                {cacTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 text-xs" style={{ borderTop: '1px solid rgb(255 255 255 / 15%)', color: 'rgb(255 255 255 / 50%)' }}>
                                    métrica combinada
                                </div>
                            </Card>
                        );
                    })()}
                </div>

                {/* Tabela Detalhada */}
                <div className="dt-table-container overflow-x-auto rounded-lg -mx-6 px-6">
                    <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: 'rgb(255 255 255 / 8%)' }}>
                            <tr>
                                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide border-r" style={{ color: '#ffffff', borderColor: 'rgb(255 255 255 / 10%)' }}>
                                    Mês
                                </th>
                                <th colSpan={2} className="px-3 py-3 text-center font-semibold text-xs uppercase tracking-wide border-r" style={{ color: '#ffffff', borderColor: 'rgb(255 255 255 / 10%)' }}>
                                    Corridas
                                </th>
                                <th colSpan={3} className="px-3 py-3 text-center font-semibold text-xs uppercase tracking-wide border-r" style={{ color: '#ffffff', borderColor: 'rgb(255 255 255 / 10%)' }}>
                                    Marketing
                                </th>
                                <th colSpan={3} className="px-3 py-3 text-center font-semibold text-xs uppercase tracking-wide border-r" style={{ color: '#ffffff', borderColor: 'rgb(255 255 255 / 10%)' }}>
                                    Operacional
                                </th>
                                <th colSpan={2} className="px-3 py-3 text-center font-semibold text-xs uppercase tracking-wide border-r" style={{ color: '#ffffff', borderColor: 'rgb(255 255 255 / 10%)' }}>
                                    Receita
                                </th>
                                <th colSpan={2} className="px-3 py-3 text-center font-semibold text-xs uppercase tracking-wide" style={{ color: '#ffffff' }}>
                                    Custo/Corrida
                                </th>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgb(255 255 255 / 15%)' }}>
                                {/* Corridas */}
                                <th className="px-3 py-2 text-left font-semibold text-xs" style={{ color: 'rgb(255 255 255 / 70%)' }}>Meta</th>
                                <th className="px-3 py-2 text-left font-semibold text-xs border-r" style={{ color: 'rgb(255 255 255 / 70%)', borderColor: 'rgb(255 255 255 / 10%)' }}>Real</th>
                                {/* Marketing */}
                                <th className="px-3 py-2 text-left font-semibold text-xs" style={{ color: 'rgb(255 255 255 / 70%)' }}>Proj.</th>
                                <th className="px-3 py-2 text-left font-semibold text-xs" style={{ color: 'rgb(255 255 255 / 70%)' }}>Real</th>
                                <th className="px-3 py-2 text-left font-semibold text-xs border-r" style={{ color: 'rgb(255 255 255 / 70%)', borderColor: 'rgb(255 255 255 / 10%)' }}>%</th>
                                {/* Operacional */}
                                <th className="px-3 py-2 text-left font-semibold text-xs" style={{ color: 'rgb(255 255 255 / 70%)' }}>Proj.</th>
                                <th className="px-3 py-2 text-left font-semibold text-xs" style={{ color: 'rgb(255 255 255 / 70%)' }}>Real</th>
                                <th className="px-3 py-2 text-left font-semibold text-xs border-r" style={{ color: 'rgb(255 255 255 / 70%)', borderColor: 'rgb(255 255 255 / 10%)' }}>%</th>
                                {/* Receita */}
                                <th className="px-3 py-2 text-left font-semibold text-xs" style={{ color: 'rgb(255 255 255 / 70%)' }}>Proj.</th>
                                <th className="px-3 py-2 text-left font-semibold text-xs border-r" style={{ color: 'rgb(255 255 255 / 70%)', borderColor: 'rgb(255 255 255 / 10%)' }}>Real</th>
                                {/* Custo/Corrida */}
                                <th className="px-3 py-2 text-left font-semibold text-xs" style={{ color: 'rgb(255 255 255 / 70%)' }}>Proj.</th>
                                <th className="px-3 py-2 text-left font-semibold text-xs" style={{ color: 'rgb(255 255 255 / 70%)' }}>Real</th>
                            </tr>
                        </thead>
                        <tbody className="dt-table-body">
                            {monthsData.map((row, index) => (
                                <tr 
                                    key={row.month} 
                                    style={{ 
                                        borderBottom: '1px solid rgb(255 255 255 / 8%)',
                                        backgroundColor: index % 2 === 0 ? 'rgb(255 255 255 / 3%)' : 'transparent',
                                        transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.4)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'rgb(255 255 255 / 3%)' : 'transparent'; }}
                                >
                                    {/* Mês */}
                                    <td className="px-4 py-3 font-medium" style={{ color: '#e5e7eb' }}>
                                        <div className="flex flex-col">
                                            <span className="text-xs" style={{ color: 'rgb(255 255 255 / 60%)', fontWeight: 'normal' }}>
                                                {formatMonthDisplay(row.month).monthName}
                                            </span>
                                            <span className="text-sm font-semibold" style={{ color: '#fff' }}>
                                                {formatMonthDisplay(row.month).monthYear}
                                            </span>
                                        </div>
                                    </td>
                                    
                                    {/* Meta de Corridas */}
                                    <td className="px-3 py-3 text-left font-medium" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                                        {formatNumber(row.expectedRides)}
                                    </td>
                                    
                                    {/* Corridas Reais */}
                                    <td className="px-3 py-3 text-left" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                                        {renderComparisonCell(row.actualRides, row.expectedRides)}
                                    </td>
                                    
                                    {/* Marketing Projetado (editável) */}
                                    <td className="px-3 py-3 text-left">
                                        {isEditing && editingCell?.month === row.month && editingCell?.field === 'marketingProjected' ? (
                                            <input
                                                type="number"
                                                className="bg-dark-700 text-white rounded px-2 py-1 w-20 border border-cyan-400 outline-none"
                                                value={editValue}
                                                onChange={e => setEditValue(Number(e.target.value))}
                                                onKeyDown={handleKeyDown}
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                {formatCurrency(row.marketingProjected)}
                                                {isEditing && (
                                                    <button
                                                        className="ml-1 text-cyan-400 hover:text-cyan-300"
                                                        onClick={() => handleStartEdit(row.month, 'marketingProjected', row.marketingProjected)}
                                                        title="Editar projeção"
                                                    >
                                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M4 20h4l10.5-10.5a2.121 2.121 0 0 0-3-3L5 17v3z"/></svg>
                                                    </button>
                                                )}
                                            </span>
                                        )}
                                    </td>
                                    
                                    {/* Marketing Real (editável) */}
                                    <td className="px-3 py-3 text-left">
                                        {renderEditableCell(row.month, 'marketingCost', row.marketingReal)}
                                    </td>
                                    
                                    {/* Marketing Variância % */}
                                    <td className="px-3 py-3 text-left font-semibold" style={{ 
                                        color: (row.marketingReal - row.marketingProjected) / row.marketingProjected * 100 < 0 ? '#86efac' : '#fca5a5'
                                    }}>
                                        {row.marketingProjected > 0 
                                            ? ((row.marketingReal - row.marketingProjected) / row.marketingProjected * 100).toFixed(1) + '%'
                                            : '-'
                                        }
                                    </td>
                                    
                                    {/* Operacional Projetado (editável) */}
                                    <td className="px-3 py-3 text-left">
                                        {isEditing && editingCell?.month === row.month && editingCell?.field === 'operationalProjected' ? (
                                            <input
                                                type="number"
                                                className="bg-dark-700 text-white rounded px-2 py-1 w-20 border border-cyan-400 outline-none"
                                                value={editValue}
                                                onChange={e => setEditValue(Number(e.target.value))}
                                                onKeyDown={handleKeyDown}
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                {formatCurrency(row.operationalProjected)}
                                                {isEditing && (
                                                    <button
                                                        className="ml-1 text-cyan-400 hover:text-cyan-300"
                                                        onClick={() => handleStartEdit(row.month, 'operationalProjected', row.operationalProjected)}
                                                        title="Editar projeção"
                                                    >
                                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M4 20h4l10.5-10.5a2.121 2.121 0 0 0-3-3L5 17v3z"/></svg>
                                                    </button>
                                                )}
                                            </span>
                                        )}
                                    </td>

                                    {/* Operacional Real (editável) */}
                                    <td className="px-3 py-3 text-left">
                                        {renderEditableCell(row.month, 'operationalCost', row.operationalReal)}
                                    </td>
                                    
                                    {/* Operacional Variância % */}
                                    <td className="px-3 py-3 text-left font-semibold" style={{ 
                                        color: (row.operationalReal - row.operationalProjected) / row.operationalProjected * 100 < 0 ? '#86efac' : '#fca5a5'
                                    }}>
                                        {row.operationalProjected > 0 
                                            ? ((row.operationalReal - row.operationalProjected) / row.operationalProjected * 100).toFixed(1) + '%'
                                            : '-'
                                        }
                                    </td>
                                    
                                    {/* Receita Projetada */}
                                    <td className="px-3 py-3 text-left" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                                        {formatCurrency(row.projectedRevenue)}
                                    </td>
                                    
                                    {/* Receita Real */}
                                    <td className="px-3 py-3 text-left">
                                        {renderRevenueComparisonCell(row.actualRevenue, row.projectedRevenue)}
                                    </td>
                                    
                                    {/* Custo/Corrida Projetado */}
                                    <td className="px-3 py-3 text-left" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                                        R$ {row.costPerRideProjected.toFixed(2)}
                                    </td>
                                    
                                    {/* Custo/Corrida Real */}
                                    <td className="px-3 py-3 text-left">
                                        {row.costPerRideReal > 0 ? (
                                            <span style={{ color: '#86efac', fontWeight: 'bold' }}>
                                                R$ {row.costPerRideReal.toFixed(2)}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'rgb(255 255 255 / 30%)' }}>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            
                            {/* Linha de Totais */}
                            <tr style={{ borderBottom: '1px solid rgb(255 255 255 / 10%)', backgroundColor: 'rgba(13, 110, 253, 0.15)', transition: 'all 0.2s' }}>
                                <td className="px-4 py-3 font-bold" style={{ color: 'rgb(255 255 255 / 90%)' }}>
                                    TOTAL
                                </td>
                                
                                {/* Total Meta Corridas */}
                                <td className="px-3 py-3 text-left font-bold" style={{ color: 'rgb(255 255 255 / 90%)' }}>
                                    {formatNumber(totals.expectedRides)}
                                </td>
                                
                                {/* Total Corridas Reais */}
                                <td className="px-3 py-3 text-left font-bold" style={{ color: 'rgb(255 255 255 / 90%)' }}>
                                    <div className="flex flex-col items-start">
                                        <span>{formatNumber(totals.actualRides)}</span>
                                        {totals.expectedRides > 0 && totals.actualRides > 0 && (
                                            <span style={{ fontSize: '10px', color: totals.actualRides >= totals.expectedRides ? '#86efac' : '#fca5a5' }}>
                                                {((totals.actualRides / totals.expectedRides) * 100).toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                </td>
                                
                                {/* Total Marketing Projetado */}
                                <td className="px-3 py-3 text-left font-bold" style={{ color: 'rgb(255 255 255 / 90%)' }}>
                                    {formatCurrency(totals.marketingProjected, true)}
                                </td>
                                
                                {/* Total Marketing Real */}
                                <td className="px-3 py-3 text-left font-bold" style={{ color: '#86efac' }}>
                                    {formatCurrency(totals.marketingReal, true)}
                                </td>
                                
                                {/* Total Marketing Variância % */}
                                <td className="px-3 py-3 text-left font-bold" style={{ 
                                    color: totals.marketingProjected > 0 && (totals.marketingReal - totals.marketingProjected) / totals.marketingProjected * 100 < 0 ? '#86efac' : '#fca5a5'
                                }}>
                                    {totals.marketingProjected > 0
                                        ? ((totals.marketingReal - totals.marketingProjected) / totals.marketingProjected * 100).toFixed(1) + '%'
                                        : '-'
                                    }
                                </td>
                                
                                {/* Total Operacional Projetado */}
                                <td className="px-3 py-3 text-left font-bold" style={{ color: 'rgb(255 255 255 / 90%)' }}>
                                    {formatCurrency(totals.operationalProjected, true)}
                                </td>

                                {/* Total Operacional Real */}
                                <td className="px-3 py-3 text-left font-bold" style={{ color: '#86efac' }}>
                                    {formatCurrency(totals.operationalReal, true)}
                                </td>
                                
                                {/* Total Operacional Variância % */}
                                <td className="px-3 py-3 text-left font-bold" style={{ 
                                    color: totals.operationalProjected > 0 && (totals.operationalReal - totals.operationalProjected) / totals.operationalProjected * 100 < 0 ? '#86efac' : '#fca5a5'
                                }}>
                                    {totals.operationalProjected > 0
                                        ? ((totals.operationalReal - totals.operationalProjected) / totals.operationalProjected * 100).toFixed(1) + '%'
                                        : '-'
                                    }
                                </td>
                                
                                {/* Total Receita Projetada */}
                                <td className="px-3 py-3 text-left font-bold" style={{ color: 'rgb(255 255 255 / 90%)' }}>
                                    {formatCurrency(totals.projectedRevenue, true)}
                                </td>
                                
                                {/* Total Receita Real */}
                                <td className="px-3 py-3 text-left font-bold" style={{ color: 'rgb(255 255 255 / 90%)' }}>
                                    <div className="flex flex-col items-start">
                                        <span>{formatCurrency(totals.actualRevenue, true)}</span>
                                        {totals.projectedRevenue > 0 && totals.actualRevenue > 0 && (
                                            <span style={{ fontSize: '10px', color: totals.actualRevenue >= totals.projectedRevenue ? '#86efac' : '#fca5a5' }}>
                                                {((totals.actualRevenue / totals.projectedRevenue) * 100).toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                </td>
                                
                                {/* Média Custo/Corrida Projetado */}
                                <td className="px-3 py-3 text-left font-bold" style={{ color: 'rgb(255 255 255 / 90%)' }}>
                                    R$ {avgCostPerRideProjected.toFixed(2)}
                                </td>
                                
                                {/* Média Custo/Corrida Real */}
                                <td className="px-3 py-3 text-left font-bold" style={{ color: 'rgb(255 255 255 / 90%)' }}>
                                    {avgCostPerRideReal > 0 ? `R$ ${avgCostPerRideReal.toFixed(2)}` : '-'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Dica */}
                <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgb(59 130 246 / 20%)' }}>
                    <p className="text-xs" style={{ color: '#93c5fd' }}>
                        💡 <strong>Dica:</strong> {isEditing 
                            ? 'Clique em qualquer célula de "Custos Reais" para editá-la. Pressione Enter para salvar ou Esc para cancelar.' 
                            : 'Clique em "Editar Custos Reais" para inserir os valores reais de marketing e operacional.'}
                    </p>
                </div>
            </div>
        </Card>
    );
};

export default FinancialProjection;

import React, { useEffect, useState } from 'react';
import { getRideStatsByCity, getMonthlyRidesByCity, cityHasRidesData } from '../services/ridesApiService';
import type { RideStats, MonthlyRideData } from '../services/ridesApiService';
import { FiTrendingUp, FiDollarSign, FiActivity, FiCalendar, FiUsers } from 'react-icons/fi';
import Card from './ui/Card';
import FinancialProjection from './FinancialProjection';

interface CityRidesDataProps {
  cityName: string;
  showMonthlyChart?: boolean;
  months?: number;
  population15to44?: number;
  metaReceita?: number;
  monthlyCosts?: { [key: string]: { marketingCost: number; operationalCost: number } };
  onCostsChange?: (monthKey: string, field: 'marketingCost' | 'operationalCost', value: number) => void;
  isEditingCosts?: boolean;
  onToggleEditCosts?: () => void;
  onRidesDataLoad?: (data: { monthKey: string; rides: number; revenue: number }[]) => void;
  planResults?: { [key: string]: { rides: number; marketingCost: number; operationalCost: number } };
}

/**
 * Componente completo para exibir dados de corridas de uma cidade
 * Usado na página de detalhes do planejamento
 */
const CityRidesData: React.FC<CityRidesDataProps> = ({ 
  cityName, 
  showMonthlyChart = true,
  months = 6,
  population15to44,
  metaReceita,
  monthlyCosts = {},
  onCostsChange,
  isEditingCosts = false,
  onToggleEditCosts,
  onRidesDataLoad,
  planResults = {}
}) => {
  const [stats, setStats] = useState<RideStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRideData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cityHasData, setCityHasData] = useState<boolean | null>(null);
  const [localCosts, setLocalCosts] = useState<{ [key: string]: { marketingCost: string; operationalCost: string } }>({});

  // Sincronizar localCosts com monthlyCosts quando entrar em modo de edição
  useEffect(() => {
    console.log('useEffect sincronização - isEditingCosts:', isEditingCosts, 'monthlyCosts keys:', Object.keys(monthlyCosts));
    if (isEditingCosts) {
      const costs: { [key: string]: { marketingCost: string; operationalCost: string } } = {};
      Object.keys(monthlyCosts).forEach(key => {
        costs[key] = {
          marketingCost: String(monthlyCosts[key]?.marketingCost || 0),
          operationalCost: String(monthlyCosts[key]?.operationalCost || 0)
        };
      });
      console.log('Sincronizando localCosts:', costs);
      setLocalCosts(costs);
    }
  }, [isEditingCosts]);

  // Garantir que localCosts tenha entrada para todos os meses visíveis
  useEffect(() => {
    console.log('useEffect meses visíveis - isEditingCosts:', isEditingCosts, 'monthlyData length:', monthlyData.length);
    if (isEditingCosts && monthlyData.length > 0) {
      setLocalCosts(prev => {
        const updated = { ...prev };
        monthlyData.forEach(month => {
          const monthKey = `${month.year}-${String(month.monthNumber).padStart(2, '0')}`;
          if (!updated[monthKey]) {
            const costs = monthlyCosts[monthKey] || { marketingCost: 0, operationalCost: 0 };
            updated[monthKey] = {
              marketingCost: String(costs.marketingCost || 0),
              operationalCost: String(costs.operationalCost || 0)
            };
            console.log('Adicionando entrada para mês:', monthKey, updated[monthKey]);
          }
        });
        return updated;
      });
    }
  }, [isEditingCosts, monthlyData, monthlyCosts]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Primeiro verifica se a cidade tem dados disponíveis
        const hasData = await cityHasRidesData(cityName);
        
        if (mounted) {
          setCityHasData(hasData);
        }

        // Se não tem dados, não faz as requisições
        if (!hasData) {
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        const [statsData, monthlyDataResult] = await Promise.all([
          getRideStatsByCity(cityName),
          showMonthlyChart ? getMonthlyRidesByCity(cityName, months, undefined, currentPage) : Promise.resolve([])
        ]);

        if (mounted) {
          setStats(statsData);
          setMonthlyData(monthlyDataResult);
          
          // Notificar componente pai com os dados carregados
          if (onRidesDataLoad && monthlyDataResult.length > 0) {
            const ridesData = monthlyDataResult.map(month => ({
              monthKey: `${month.year}-${String(month.monthNumber).padStart(2, '0')}`,
              rides: month.rides,
              revenue: month.revenue
            }));
            onRidesDataLoad(ridesData);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados de corridas:', err);
        if (mounted) {
          setError('Erro ao carregar dados');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [cityName, showMonthlyChart, months, currentPage]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-48 bg-gray-100 rounded"></div>
      </Card>
    );
  }

  // Mensagem amigável quando a cidade não tem dados disponíveis
  if (cityHasData === false) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3 text-blue-800">
          <FiActivity className="text-2xl" />
          <div>
            <h3 className="font-semibold">Dados de Corridas Não Disponíveis</h3>
            <p className="text-sm text-blue-600">
              Ainda não há dados de corridas registrados para {cityName}.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Os cálculos de viabilidade estão usando estimativas baseadas em dados demográficos do IBGE.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-3 text-yellow-800">
          <FiActivity className="text-2xl" />
          <div>
            <h3 className="font-semibold">Erro ao Carregar Dados</h3>
            <p className="text-sm text-yellow-600">
              {error || 'Ocorreu um erro ao buscar os dados de corridas.'}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Tente novamente mais tarde.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho com Badge */}
      <Card gradient className="dt-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-lg text-white"
              style={{ background: 'rgb(255 255 255 / 15%)' }}
            >
              <FiActivity className="text-2xl" style={{ color: '#69bb03' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>
                Dados Reais de Operação
              </h3>
              <p className="text-sm" style={{ color: 'rgb(255 255 255 / 60%)' }}>
                Informações do banco de dados de corridas
              </p>
            </div>
          </div>
          <div 
            className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
            style={{ background: 'rgba(105, 187, 3, 0.2)', color: '#69bb03' }}
          >
            ✓ Dados Verificados
          </div>
        </div>
      </Card>

      {/* Estatísticas Principais - Linha 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <FiTrendingUp className="text-3xl text-blue-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Total de Corridas</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.totalRides.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.averageRidesPerDay.toFixed(1)} por dia
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <FiDollarSign className="text-3xl text-green-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Receita Total</p>
              <p className="text-2xl font-bold text-gray-800">
                R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Ticket médio: R$ {stats.averageValue.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <FiActivity className="text-3xl text-purple-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Média Mensal</p>
              <p className="text-2xl font-bold text-gray-800">
                {Math.round(stats.averageRidesPerMonth).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                corridas/mês
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <FiCalendar className="text-3xl text-orange-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Período Ativo</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.activeMonths}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.activeMonths === 1 ? 'mês' : 'meses'}
              </p>
            </div>
          </div>
        </Card>

        {population15to44 && (
          <Card className="border-l-4 border-indigo-500">
            <div className="flex items-center gap-3">
              <FiUsers className="text-3xl text-indigo-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">População Alvo</p>
                <p className="text-2xl font-bold text-gray-800">
                  {population15to44.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  faixa 15-44 anos
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Estatísticas Principais - Linha 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metaReceita && (
          <Card className="border-l-4 border-cyan-500">
            <div className="flex items-center gap-3">
              <FiDollarSign className="text-3xl text-cyan-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Meta Receita</p>
                <p className="text-2xl font-bold text-gray-800">
                  {metaReceita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  cenário médio
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* KPIs removidos - agora estão no FinancialProjection */}
      </div>

      {/* Tabela original (comentada para referência) */}
      {false && showMonthlyChart && monthlyData.length > 0 && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-semibold text-gray-800">
              Evolução Mensal (Últimos {months} meses)
            </h4>
            {onToggleEditCosts && (
              <button
                onClick={onToggleEditCosts}
                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
              >
                {isEditingCosts ? '✓ Concluir Edição' : '✏️ Editar Custos'}
              </button>
            )}
          </div>
          <div className="overflow-x-auto dt-table-container">
            <table className="w-full text-sm dt-table">
              <thead style={{ background: 'rgba(55, 65, 81, 0.9)', borderBottom: '2px solid rgba(59, 130, 246, 0.5)' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                    Mês
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                    Corridas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                    Receita
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                    Ticket Médio
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                    Dias Ativos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)', borderLeft: '1px solid rgba(255, 255, 255, 0.15)' }}>
                    Invest. Marketing (R$)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                    Gasto Operacional (R$)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                    Eficiência Total (R$/Pass)
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month, index) => {
                  const monthName = new Date(month.year, month.monthNumber - 1).toLocaleDateString('pt-BR', { 
                    month: 'long', 
                    year: 'numeric' 
                  });
                  
                  // Buscar custos para este mês (formato: "YYYY-MM")
                  const monthKey = `${month.year}-${String(month.monthNumber).padStart(2, '0')}`;
                  const costs = monthlyCosts[monthKey] || { marketingCost: 0, operationalCost: 0 };
                  const localCost = localCosts[monthKey] || { marketingCost: '0', operationalCost: '0' };
                  const totalCost = costs.marketingCost + costs.operationalCost;
                  const efficiency = month.rides > 0 ? totalCost / month.rides : 0;
                  
                  return (
                    <tr 
                      key={index} 
                      className="hover:bg-gray-700/40 transition-colors"
                      style={{ 
                        background: index % 2 === 0 ? 'rgba(55, 65, 81, 0.3)' : 'transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <td className="px-4 py-3 capitalize" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                        {monthName}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: '#ffffff' }}>
                        {month.rides.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: '#22c55e' }}>
                        R$ {month.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                        R$ {month.averageValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: 'rgb(255 255 255 / 70%)' }}>
                        {month.uniqueDays}
                      </td>
                      {/* Colunas de Custos */}
                      <td className="px-4 py-3 text-right" style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        {isEditingCosts && onCostsChange ? (
                          <input
                            type="text"
                            value={localCost.marketingCost || '0'}
                            onChange={(e) => {
                              console.log('Marketing onChange:', monthKey, e.target.value);
                              setLocalCosts(prev => ({
                                ...prev,
                                [monthKey]: {
                                  ...(prev[monthKey] || { marketingCost: '0', operationalCost: '0' }),
                                  marketingCost: e.target.value
                                }
                              }));
                            }}
                            onBlur={(e) => {
                              console.log('Marketing onBlur:', monthKey, e.target.value);
                              const value = parseFloat(e.target.value) || 0;
                              console.log('Chamando onCostsChange com:', monthKey, 'marketingCost', value);
                              onCostsChange(monthKey, 'marketingCost', value);
                            }}
                            onFocus={(e) => {
                              console.log('Marketing onFocus:', monthKey);
                              e.target.select();
                            }}
                            className="w-28 px-2 py-1 text-right rounded text-sm"
                            style={{ 
                              background: 'rgba(59, 130, 246, 0.2)', 
                              border: '1px solid rgba(59, 130, 246, 0.5)',
                              color: '#ffffff'
                            }}
                            placeholder="0"
                          />
                        ) : (
                          <span style={{ color: '#3b82f6' }}>
                            {costs.marketingCost > 0 
                              ? `R$ ${costs.marketingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : 'R$ 0,00'
                            }
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditingCosts && onCostsChange ? (
                          <input
                            type="text"
                            value={localCost.operationalCost || '0'}
                            onChange={(e) => {
                              console.log('Operacional onChange:', monthKey, e.target.value);
                              setLocalCosts(prev => ({
                                ...prev,
                                [monthKey]: {
                                  ...(prev[monthKey] || { marketingCost: '0', operationalCost: '0' }),
                                  operationalCost: e.target.value
                                }
                              }));
                            }}
                            onBlur={(e) => {
                              console.log('Operacional onBlur:', monthKey, e.target.value);
                              const value = parseFloat(e.target.value) || 0;
                              console.log('Chamando onCostsChange com:', monthKey, 'operationalCost', value);
                              onCostsChange(monthKey, 'operationalCost', value);
                            }}
                            onFocus={(e) => {
                              console.log('Operacional onFocus:', monthKey);
                              e.target.select();
                            }}
                            className="w-28 px-2 py-1 text-right rounded text-sm"
                            style={{ 
                              background: 'rgba(168, 85, 247, 0.2)', 
                              border: '1px solid rgba(168, 85, 247, 0.5)',
                              color: '#ffffff'
                            }}
                            placeholder="0"
                          />
                        ) : (
                          <span style={{ color: '#a855f7' }}>
                            {costs.operationalCost > 0 
                              ? `R$ ${costs.operationalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : 'R$ 0,00'
                            }
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {efficiency > 0 ? (
                          <span 
                            className="px-2 py-1 rounded text-xs font-bold"
                            style={{ 
                              background: efficiency > 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                              color: efficiency > 10 ? '#ef4444' : '#22c55e'
                            }}
                          >
                            R$ {efficiency.toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ color: 'rgb(255 255 255 / 40%)' }}>--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Controles de Paginação */}
          <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid rgb(255 255 255 / 10%)' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium rounded-md transition-all"
              style={{ 
                background: 'rgb(255 255 255 / 8%)',
                color: 'rgb(255 255 255 / 70%)',
                border: '1px solid rgb(255 255 255 / 12%)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(255 255 255 / 12%)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgb(255 255 255 / 8%)'}
            >
              ← Anteriores
            </button>
            
            <span className="text-sm" style={{ color: 'rgb(255 255 255 / 50%)' }}>
              Página {currentPage}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={monthlyData.length < months}
              className="px-4 py-2 text-sm font-medium rounded-md transition-all"
              style={{ 
                background: 'rgb(255 255 255 / 8%)',
                color: 'rgb(255 255 255 / 70%)',
                border: '1px solid rgb(255 255 255 / 12%)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(255 255 255 / 12%)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgb(255 255 255 / 8%)'}
            >
              Próximos →
            </button>
          </div>
        </Card>
      )}

      {/* Informação sobre Período */}
      {stats.firstRide && stats.lastRide && (
        <Card gradient>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#3b82f6' }}>
            <FiCalendar />
            <span>
              <strong>Período dos dados:</strong>{' '}
              {new Date(stats.firstRide).toLocaleDateString('pt-BR')} até{' '}
              {new Date(stats.lastRide).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CityRidesData;

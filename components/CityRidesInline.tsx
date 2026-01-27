import React, { useEffect, useState } from 'react';
import { getRideStatsByCity } from '../services/ridesApiService';
import { RideStats } from '../services/ridesApiService';

interface CityRidesInlineProps {
  cityName: string;
}

/**
 * Componente inline para mostrar dados de corridas na lista de planejamento
 * Exibe informações resumidas em uma única linha
 */
const CityRidesInline: React.FC<CityRidesInlineProps> = ({ cityName }) => {
  const [stats, setStats] = useState<RideStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getRideStatsByCity(cityName);
        if (mounted) {
          setStats(data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados de corridas:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [cityName]);

  if (loading) {
    return (
      <div className="text-xs text-gray-400 animate-pulse">
        Carregando dados...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-xs text-gray-400">
        Sem dados de corridas
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1 text-green-600 font-semibold">
        ✓ Dados Reais
      </span>
      <span className="text-gray-600">
        {(stats.totalRides || 0).toLocaleString()} corridas
      </span>
      <span className="text-gray-600">
        R$ {(stats.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
      <span className="text-gray-500">
        Ticket: R$ {(stats.averageValue || 0).toFixed(2)}
      </span>
    </div>
  );
};

export default CityRidesInline;

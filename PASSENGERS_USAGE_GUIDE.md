# 🚀 Guia Prático: Usando Dados de Passageiros no Dashboard

## 📌 Quick Start

### 1. Renderizar Lista de Cidades com Passageiros

```typescript
// pages/PassengersDashboard.tsx
import React, { useEffect, useState } from 'react';
import { getAllPassengers, formatPassengerCount } from '@/services/passengerService';

export function PassengersDashboard() {
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAllPassengers();
        setPassengers(data);
      } catch (error) {
        console.error('Erro ao carregar passageiros:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {passengers.map(city => (
        <div key={city.id} className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-lg">{city.cityName}</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatPassengerCount(city.totalPassengers)}
          </p>
          <div className="mt-2 text-sm text-gray-600">
            <p>📊 Média diária: {city.dailyAverage.toLocaleString()}</p>
            <p>📈 Retenção: {(city.retentionRate * 100).toFixed(1)}%</p>
            <p>🔄 Recompra: {(city.repurchaseRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### 2. Exibir Estatísticas Agregadas

```typescript
// components/PassengerStats.tsx
import { getPassengerStats, calculateRetentionPercentage } from '@/services/passengerService';

export async function PassengerStats() {
  const stats = await getPassengerStats();

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-gray-600 text-sm">Total Passageiros</p>
        <p className="text-3xl font-bold text-blue-600">
          {stats._sum.totalPassengers.toLocaleString()}
        </p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-gray-600 text-sm">Retenção Média</p>
        <p className="text-3xl font-bold text-green-600">
          {(stats._avg.retentionRate * 100).toFixed(1)}%
        </p>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-gray-600 text-sm">Recompra Média</p>
        <p className="text-3xl font-bold text-purple-600">
          {(stats._avg.repurchaseRate * 100).toFixed(1)}%
        </p>
      </div>

      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-gray-600 text-sm">Churn Médio</p>
        <p className="text-3xl font-bold text-red-600">
          {(stats._avg.churnRate * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
```

---

### 3. Top 5 Cidades com Melhor Retenção

```typescript
// components/TopCitiesRetention.tsx
import { getTopCitiesByPassengers } from '@/services/passengerService';

export async function TopCitiesRetention() {
  const topCities = await getTopCitiesByPassengers(5);

  // Ordenar por taxa de retenção
  const sortedByRetention = [...topCities].sort(
    (a, b) => b.retentionRate - a.retentionRate
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">🏆 Top 5 Cidades por Retenção</h2>
      <div className="space-y-3">
        {sortedByRetention.map((city, index) => (
          <div key={city.cityName} className="flex items-center justify-between bg-gray-50 p-3 rounded">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold">{index + 1}</span>
              <div>
                <p className="font-semibold">{city.cityName}</p>
                <p className="text-sm text-gray-600">
                  {city.totalPassengers.toLocaleString()} passageiros
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">
                {(city.retentionRate * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600">Retenção</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 4. Filtrar Cidades por Critérios

```typescript
// hooks/usePassengerFilter.ts
import { getPassengersByMultipleCities } from '@/services/passengerService';

export function usePassengerFilter() {
  const [passengers, setPassengers] = useState([]);

  // Filtrar cidades com retenção acima de 75%
  const highRetentionCities = passengers.filter(
    city => city.retentionRate > 0.75
  );

  // Filtrar cidades com mais de 20k passageiros
  const largeCities = passengers.filter(
    city => city.totalPassengers > 20000
  );

  // Filtrar cidades com churn abaixo de 25%
  const stableCities = passengers.filter(
    city => city.churnRate < 0.25
  );

  return {
    highRetentionCities,
    largeCities,
    stableCities,
    passengers
  };
}
```

---

### 5. Gráfico de Comparação de Cidades

```typescript
// components/PassengersChart.tsx
import { Chart } from 'react-chartjs-2';
import { getTopCitiesByPassengers } from '@/services/passengerService';

export async function PassengersChart() {
  const topCities = await getTopCitiesByPassengers(10);

  const data = {
    labels: topCities.map(city => city.cityName),
    datasets: [
      {
        label: 'Total de Passageiros',
        data: topCities.map(city => city.totalPassengers),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: 'Taxa de Retenção (%)',
        data: topCities.map(city => city.retentionRate * 100),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📊 Comparação de Cidades</h2>
      <Chart type="bar" data={data} />
    </div>
  );
}
```

---

### 6. Integrar com MarketIntelligence

```typescript
// pages/MarketIntelligence.tsx - Adicionar seção de passageiros

import { getPassengerStats, getTopCitiesByPassengers } from '@/services/passengerService';

export function MarketIntelligence() {
  const [passengerStats, setPassengerStats] = useState(null);
  const [topCities, setTopCities] = useState([]);

  useEffect(() => {
    Promise.all([
      getPassengerStats(),
      getTopCitiesByPassengers(5)
    ]).then(([stats, cities]) => {
      setPassengerStats(stats);
      setTopCities(cities);
    });
  }, []);

  return (
    <div>
      {/* ... seções existentes ... */}

      {/* NOVA SEÇÃO: Passageiros */}
      <section className="mt-8 p-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg text-white">
        <h2 className="text-2xl font-bold mb-4">👥 Inteligência de Passageiros</h2>
        
        {passengerStats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-blue-100">Total</p>
              <p className="text-3xl font-bold">
                {(passengerStats._sum.totalPassengers / 1000).toFixed(0)}K
              </p>
            </div>
            <div>
              <p className="text-blue-100">Retenção</p>
              <p className="text-3xl font-bold">
                {(passengerStats._avg.retentionRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-blue-100">Recompra</p>
              <p className="text-3xl font-bold">
                {(passengerStats._avg.repurchaseRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-blue-100">Churn</p>
              <p className="text-3xl font-bold">
                {(passengerStats._avg.churnRate * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-3">🏆 Cidades com Maior Demanda</h3>
          <div className="space-y-2">
            {topCities.map(city => (
              <div key={city.cityName} className="flex justify-between">
                <span>{city.cityName}</span>
                <span className="font-bold">{city.totalPassengers.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

---

### 7. Hook para Buscar Dados de Passageiros

```typescript
// hooks/usePassengers.ts
import { useEffect, useState } from 'react';
import {
  getAllPassengers,
  getPassengersByCity,
  getPassengerStats,
  getTopCitiesByPassengers
} from '@/services/passengerService';

export function usePassengers() {
  const [all, setAll] = useState([]);
  const [stats, setStats] = useState(null);
  const [topCities, setTopCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allData, statsData, topData] = await Promise.all([
          getAllPassengers(),
          getPassengerStats(),
          getTopCitiesByPassengers(10)
        ]);

        setAll(allData);
        setStats(statsData);
        setTopCities(topData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { all, stats, topCities, loading, error };
}

// Uso:
function MyComponent() {
  const { all, stats, topCities, loading } = usePassengers();
  
  if (loading) return <div>Carregando...</div>;
  
  return (
    <div>
      <p>Total: {stats._sum.totalPassengers}</p>
      {/* ... */}
    </div>
  );
}
```

---

### 8. Buscar Dados de Uma Cidade Específica

```typescript
// hooks/usePassengerCity.ts
import { useEffect, useState } from 'react';
import { getPassengersByCity } from '@/services/passengerService';

export function usePassengerCity(cityName: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cityData = await getPassengersByCity(cityName);
        setData(cityData);
      } finally {
        setLoading(false);
      }
    };

    if (cityName) {
      loadData();
    }
  }, [cityName]);

  return { data, loading };
}

// Uso em CityDetailsPage:
function CityDetailsPage({ cityName }) {
  const { data, loading } = usePassengerCity(cityName);

  if (!data) return null;

  return (
    <div>
      <h1>{data.cityName}</h1>
      <p>Passageiros: {data.totalPassengers.toLocaleString()}</p>
      <p>Retenção: {(data.retentionRate * 100).toFixed(1)}%</p>
    </div>
  );
}
```

---

## 🎨 Tailwind Classes Úteis

```typescript
// Cards de métrica
className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-lg text-white"

// Números grandes
className="text-4xl font-bold text-blue-600"

// Grid responsivo
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"

// Barras de progresso (retenção)
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-green-500 h-2 rounded-full"
    style={{ width: `${data.retentionRate * 100}%` }}
  />
</div>
```

---

## 🔗 Endpoints Rápidos

```
GET  /api/passengers                    → Todos os passageiros
GET  /api/passengers/:cityName          → Dados de uma cidade
POST /api/passengers/batch              → Múltiplas cidades
GET  /api/passengers/stats              → Estatísticas aggregadas
GET  /api/passengers/top/:limit         → Top N cidades
POST /api/passengers                    → Criar/atualizar
DELETE /api/passengers/:cityName        → Deletar
```

---

## 💡 Dicas

1. **Use `formatPassengerCount()`** para exibir números grandes: `45000 → "45.0K"`
2. **Multiplique por 100** para converter taxas decimais em percentuais: `0.82 → "82%"`
3. **Use `safeGetPassengersByCity()`** para busca com fallback seguro
4. **Cache com React Query** para melhor performance
5. **Combine com `useContext`** para compartilhar dados globalmente

---

**Pronto para usar! Todos os dados estão disponíveis na API.** 🎉

# 🔗 Conectando Frontend ao Backend

## Mudanças Necessárias no Frontend

Para conectar o frontend React ao backend criado, você precisa fazer algumas alterações.

---

## 1️⃣ Criar Arquivo de Configuração da API

Crie `src/config/api.ts`:

```typescript
// src/config/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logging (opcional)
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
```

---

## 2️⃣ Atualizar Services para Usar o Backend

### **a) Atualizar `services/ibgeService.ts`**

Substitua as chamadas diretas ao IBGE por chamadas ao backend:

```typescript
// services/ibgeService.ts
import api from '../config/api';
import { City } from '../types';

/**
 * Atualiza dados de uma cidade com informações do IBGE via backend
 */
export const fetchSingleCityUpdate = async (cityId: number): Promise<City> => {
  try {
    const response = await api.put(`/cities/${cityId}/update-ibge`);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao atualizar cidade do IBGE:', error);
    throw error;
  }
};

/**
 * Busca todas as cidades
 */
export const fetchAllCities = async (params?: {
  status?: string;
  mesorregion?: string;
  page?: number;
  limit?: number;
}): Promise<{ cities: City[]; pagination: any }> => {
  try {
    const response = await api.get('/cities', { params });
    return {
      cities: response.data.data,
      pagination: response.data.pagination,
    };
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    throw error;
  }
};

/**
 * Busca cidade por ID
 */
export const fetchCityById = async (cityId: number): Promise<City> => {
  try {
    const response = await api.get(`/cities/${cityId}`);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar cidade:', error);
    throw error;
  }
};
```

### **b) Atualizar `services/geminiService.ts`**

```typescript
// services/geminiService.ts
import api from '../config/api';

export const generateAiResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await api.post('/ai/chat', { prompt });
    return response.data.data.response;
  } catch (error) {
    console.error('Erro ao gerar resposta da IA:', error);
    return 'Erro ao processar sua solicitação. Tente novamente.';
  }
};

/**
 * Gera análise de viabilidade para uma cidade
 */
export const generateCityAnalysis = async (cityId: number): Promise<string> => {
  try {
    const response = await api.get(`/ai/analysis/${cityId}`);
    return response.data.data.analysis;
  } catch (error) {
    console.error('Erro ao gerar análise:', error);
    throw error;
  }
};
```

### **c) Criar Service de Planning**

Crie `services/planningService.ts`:

```typescript
// services/planningService.ts
import api from '../config/api';

export interface Planning {
  id: string;
  cityId: number;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: string;
  priority: string;
  tags: string[];
  estimatedBudget?: number;
  actualBudget?: number;
  progressPercentage: number;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
}

/**
 * Buscar todos os planejamentos
 */
export const getAllPlannings = async (filters?: {
  cityId?: number;
  status?: string;
}): Promise<Planning[]> => {
  try {
    const response = await api.get('/plannings', { params: filters });
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar planejamentos:', error);
    throw error;
  }
};

/**
 * Buscar planejamento por ID
 */
export const getPlanningById = async (id: string): Promise<Planning> => {
  try {
    const response = await api.get(`/plannings/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar planejamento:', error);
    throw error;
  }
};

/**
 * Criar novo planejamento
 */
export const createPlanning = async (planningData: Partial<Planning>): Promise<Planning> => {
  try {
    const response = await api.post('/plannings', planningData);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao criar planejamento:', error);
    throw error;
  }
};

/**
 * Atualizar planejamento
 */
export const updatePlanning = async (
  id: string,
  planningData: Partial<Planning>
): Promise<Planning> => {
  try {
    const response = await api.put(`/plannings/${id}`, planningData);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao atualizar planejamento:', error);
    throw error;
  }
};

/**
 * Deletar planejamento
 */
export const deletePlanning = async (id: string): Promise<void> => {
  try {
    await api.delete(`/plannings/${id}`);
  } catch (error) {
    console.error('Erro ao deletar planejamento:', error);
    throw error;
  }
};

/**
 * Adicionar tarefa ao planejamento
 */
export const addTask = async (planningId: string, taskData: Partial<Task>): Promise<Task> => {
  try {
    const response = await api.post(`/plannings/${planningId}/tasks`, taskData);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao adicionar tarefa:', error);
    throw error;
  }
};

/**
 * Atualizar tarefa
 */
export const updateTask = async (taskId: string, taskData: Partial<Task>): Promise<Task> => {
  try {
    const response = await api.put(`/plannings/tasks/${taskId}`, taskData);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    throw error;
  }
};

/**
 * Deletar tarefa
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await api.delete(`/plannings/tasks/${taskId}`);
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    throw error;
  }
};
```

---

## 3️⃣ Atualizar DataContext

Modifique `context/DataContext.tsx` para usar o backend:

```typescript
// context/DataContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import { City } from '../types';
import { fetchAllCities } from '../services/ibgeService';

interface DataContextType {
  cities: City[];
  isLoading: boolean;
  loadingStatus: string;
  refreshCities: () => Promise<void>;
}

export const DataContext = createContext<DataContextType>({
  cities: [],
  isLoading: true,
  loadingStatus: 'Inicializando...',
  refreshCities: async () => {},
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Inicializando...');

  const loadCities = async () => {
    try {
      setIsLoading(true);
      setLoadingStatus('Carregando cidades do servidor...');
      
      const { cities: fetchedCities } = await fetchAllCities({ limit: 100 });
      
      setCities(fetchedCities);
      setLoadingStatus('Dados carregados com sucesso!');
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      setLoadingStatus('Erro ao carregar dados. Usando dados locais...');
      // Fallback para dados locais se necessário
      const { internalCitiesData } = await import('../services/internalData');
      setCities(internalCitiesData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  const refreshCities = async () => {
    await loadCities();
  };

  return (
    <DataContext.Provider value={{ cities, isLoading, loadingStatus, refreshCities }}>
      {children}
    </DataContext.Provider>
  );
};
```

---

## 4️⃣ Adicionar Variável de Ambiente

Crie ou edite `.env.local` na raiz do frontend:

```env
# .env.local
VITE_API_URL=http://localhost:3001/api
VITE_API_KEY=your_gemini_key_here
```

---

## 5️⃣ Atualizar Componentes (Exemplos)

### **AIAssistant.tsx**

```typescript
// Trocar:
const response = await generateAiResponse(userMessage, cities);

// Por:
const response = await generateAiResponse(userMessage);
```

### **CityMarketAnalysis.tsx**

Adicionar botão para análise de IA:

```typescript
import { generateCityAnalysis } from '../services/geminiService';

// Dentro do componente:
const [aiAnalysis, setAiAnalysis] = useState<string>('');
const [loadingAnalysis, setLoadingAnalysis] = useState(false);

const handleGenerateAnalysis = async (cityId: number) => {
  setLoadingAnalysis(true);
  try {
    const analysis = await generateCityAnalysis(cityId);
    setAiAnalysis(analysis);
  } catch (error) {
    console.error('Erro ao gerar análise:', error);
  } finally {
    setLoadingAnalysis(false);
  }
};
```

---

## 6️⃣ Testar a Integração

### **a) Iniciar o Backend**
```bash
cd backend
npm run dev
```

### **b) Iniciar o Frontend**
```bash
cd ..
npm run dev
```

### **c) Verificar Console do Navegador**
- Abra o DevTools (F12)
- Verifique se as chamadas à API estão sendo feitas
- Verifique se não há erros CORS

---

## 7️⃣ Checklist de Integração

- [ ] Backend rodando em http://localhost:3001
- [ ] Frontend rodando em http://localhost:5173
- [ ] Variável VITE_API_URL configurada
- [ ] CORS configurado no backend para permitir origem do frontend
- [ ] api.ts criado e importado nos services
- [ ] Services atualizados para usar api.ts
- [ ] DataContext atualizado
- [ ] Teste de health check funcionando: `curl http://localhost:3001/api/health`
- [ ] Teste de listagem de cidades funcionando

---

## 8️⃣ Troubleshooting

### **Erro CORS**
Se aparecer erro de CORS, verifique no backend `.env`:
```env
CORS_ORIGIN=http://localhost:5173
```

### **Backend não conecta**
Verifique se o backend está rodando:
```bash
curl http://localhost:3001/api/health
```

### **Dados não aparecem**
1. Abra DevTools → Network
2. Verifique se as requisições estão sendo feitas
3. Verifique se o backend está retornando dados
4. Verifique se o PostgreSQL está rodando

---

## 9️⃣ Melhorias Opcionais

### **Loading States**
Adicione estados de loading em componentes:
```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await api.post('/endpoint', data);
  } finally {
    setLoading(false);
  }
};
```

### **Error Handling**
Crie um hook customizado para erros:
```typescript
// hooks/useApiError.ts
export const useApiError = () => {
  const handleError = (error: any) => {
    const message = error.response?.data?.error || 'Erro desconhecido';
    alert(message); // ou use um toast notification
  };
  
  return { handleError };
};
```

### **React Query (Opcional)**
Para melhor gestão de cache e estados:
```bash
npm install @tanstack/react-query
```

---

## 🎉 Resultado Final

Após seguir estes passos:
- ✅ Frontend conectado ao backend
- ✅ Dados vindo do PostgreSQL
- ✅ IA funcionando via backend
- ✅ Sistema de planejamento integrado
- ✅ Dados do IBGE atualizados via backend

**Seu dashboard está completamente funcional e integrado!**

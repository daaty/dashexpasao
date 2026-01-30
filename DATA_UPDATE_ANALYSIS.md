# Análise de Atualização de Dados - Transações e Corridas Reais

## 🔴 PROBLEMA ENCONTRADO

Os dados **NÃO estão sendo atualizados constantemente**. Há um carregamento único na inicialização e depois não há refresh automático.

---

## 📊 Situação Atual

### 1. **Dados de Cidades (Cities)**
**Arquivo:** `context/DataContext.tsx` (linhas 203-300+)

- ✅ Carregam **UMA VEZ** na inicialização via `fetchAllCities()`
- ❌ **NÃO HÁ POLLING** ou `setInterval` para atualizar automaticamente
- ❌ **NÃO HÁ REFETCH** ao focar a aba do navegador
- ⚠️ Dados desincronizados com o backend após mudanças

### 2. **Dados de Corridas Reais**
**Arquivo:** `components/CityRidesData.tsx` (linhas 85-150)

- ✅ Carregam **UMA VEZ** quando componente é montado
- ❌ **NÃO HÁ POLLING** para buscar dados novos
- ⚠️ Apenas refazem fetch ao mudar `cityName` ou `currentPage`
- ❌ Sem atualização mesmo com novos dados no banco

### 3. **Dados de Transações (Dashboard)**
**Arquivo:** `pages/Dashboard.tsx` (linhas 136-534)

- ✅ Usa dados do contexto (`DataContext`)
- ❌ **NÃO HÁ ATUALIZAÇÃO PERIÓDICA** 
- ❌ Dados apenas vêm do carregamento inicial
- ⚠️ Precisa fazer F5 (refresh completo) para ver dados novos

### 4. **Serviço de API de Corridas**
**Arquivo:** `services/ridesApiService.ts` (linhas 50-80)

```typescript
// Cache com duração de 5 minutos (problema!)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
```

- ✅ Tem cache para evitar requisições excessivas
- ❌ Cache dura 5 minutos = dados defasados
- ❌ Sem invalidação automática ao focar aba

---

## 🔄 Fluxo Atual vs Ideal

### Fluxo Atual (SEM POLLING)
```
Usuário abre app
    ↓
DataContext carrega dados (UMA VEZ)
    ↓
Dashboard/CityRidesData renderizam com esses dados
    ↓
[NADA] - Dados presos na tela
    ↓
Backend tem novos dados (transações, corridas)
    ↓
Usuário NÃO vê mudanças até F5
```

### Fluxo Ideal (COM POLLING)
```
Usuário abre app
    ↓
DataContext carrega dados
    ↓
Dashboard/CityRidesData renderizam
    ↓
[POLLING A CADA N SEGUNDOS]
    ↓
Busca novos dados do backend
    ↓
Se houver mudança → atualiza estado
    ↓
Componentes rerendem com dados frescos
    ↓
Usuário vê atualizações em tempo real
```

---

## ✅ Soluções Necessárias

### 1. **Adicionar Polling no DataContext**
- Fazer fetch periódico de cidades a cada 30-60 segundos
- Atualizar estado apenas se houver mudanças (diff)
- Usar `setInterval` com cleanup

### 2. **Adicionar Refetch ao ganhar foco**
- Detectar quando aba volta de background (`visibilitychange`)
- Invalidar cache e refetch imediatamente
- Evitar requisições desnecessárias

### 3. **Adicionar Polling em CityRidesData**
- Fetch periódico de dados de corridas a cada 30 segundos
- Apenas se o componente estiver montado
- Com fallback para quando serviço cair

### 4. **Reduzir Cache Duration**
- De 5 minutos → 30 segundos
- Ou fazer cache inteligente baseado em timestamp do servidor

### 5. **Adicionar Badge de "Atualizando"**
- Mostrar ao usuário que dados estão sendo atualizados
- "Atualizado há X segundos"
- Ícone de sync girando durante fetch

---

## 📍 Linhas a Serem Alteradas

### DataContext.tsx
- Linha 203+: Adicionar `setInterval` para polling
- Linha 228: `fetchAllCities` deve ser chamado periodicamente
- Adicionar cleanup de interval

### CityRidesData.tsx
- Linha 85-150: Adicionar `setInterval` para refetch
- Linha 109-110: Encapsular `getRideStatsByCity` em polling

### ridesApiService.ts
- Linha 50: Reduzir `CACHE_DURATION` de 5min → 30seg
- Adicionar função `invalidateCache()`

### Todos os componentes
- Adicionar visual feedback "Atualizado às HH:MM:SS"

---

## ⏱️ Recomendações de Timing

| Dados | Intervalo | Motivo |
|-------|-----------|--------|
| Cidades | 60s | Mudança de status rara |
| Corridas Reais | 30s | Alta frequência de dados |
| Dashboard (Transações) | 30s | Alto valor para decisão |
| Cache API | 30s | Equilíbrio entre latência e load |


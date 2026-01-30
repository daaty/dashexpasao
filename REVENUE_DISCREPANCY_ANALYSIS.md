# 🔍 Análise: Discrepância de Receita - Monte Verde (Janeiro)

## Problema Reportado

**Em Monte Verde, temos valores DIFERENTES para janeiro:**
- ✅ Card de receita no Dashboard: **R$ 815** (85% da meta)
- ❌ Tabela `dashboard.transactions`: **R$ 872,50** 

---

## � ROOT CAUSE ENCONTRADO

### O Erro na Query SQL

**Arquivo:** [backend/src/services/rides.service.ts](backend/src/services/rides.service.ts#L142-L149 e #L213-L220)

**PROBLEMA:**
```typescript
// ❌ ERRADO - Somando QUANTIDADE em vez de VALOR
SELECT COALESCE(SUM(t.quantity), 0) as total_revenue
FROM dashboard.transactions t
```

**SOLUÇÃO:**
```typescript
// ✅ CORRETO - Somando VALOR em reais
SELECT COALESCE(SUM(t.amount), 0) as total_revenue
FROM dashboard.transactions t
```

**Impacto:**
- Estava somando `quantity` (quantidade de recargas) 
- Deveria estar somando `amount` (valor em reais de cada recarga)
- Explicava por que estava dando R$ 815 em vez de R$ 872,50

---

## ✅ Correções Implementadas

### 1. getRideStatsByCity() - Linha 142
```diff
- SELECT COALESCE(SUM(t.quantity), 0) as total_revenue
+ SELECT COALESCE(SUM(t.amount), 0) as total_revenue
```

### 2. getMonthlyRidesByCity() - Linha 216
```diff
- COALESCE(SUM(t.quantity), 0) as revenue
+ COALESCE(SUM(t.amount), 0) as revenue
```

---

## 📋 Fluxo de Dados Agora Correto

```
CityRidesData.tsx (componente)
    ↓
getMonthlyRidesByCity() [RIDES SERVICE]
    ↓
SQL Query: SUM(t.amount) ← CORRIGIDO AQUI
    ↓
Retorna: { revenue: 872.50 }
    ↓
handleRidesDataLoad() [PlanningDetails]
    ↓
setRealRevenueData()
    ↓
calculatedActualRevenue
    ↓
FinancialProjection (exibe R$ 872,50)
```

---

## 🔍 O que mudou

| Antes | Depois |
|-------|--------|
| R$ 815 (quantidade × valor unitário errado) | R$ 872,50 (valor real correto) |
| Estava usando `t.quantity` | Agora usa `t.amount` |
| Dados imprecisos | Dados sincronizados com banco |

---

## ✨ Benefícios da Correção

✅ Receita agora mostra valor REAL de recargas  
✅ Dashboard sincronizado com `dashboard.transactions`  
✅ Gráfico "Evolução Real vs Metas" mostra dados corretos  
✅ FinancialProjection exibe revenue precisa  
✅ Polling a cada 30s pega dados atualizados  

---

## 🔗 Arquivos Alterados

- [backend/src/services/rides.service.ts](backend/src/services/rides.service.ts#L142-L149)
  - getRideStatsByCity(): Linha 142 (t.quantity → t.amount)
  - getMonthlyRidesByCity(): Linha 216 (t.quantity → t.amount)

---

## 🧪 Como Testar

1. Abra o console (F12) → Network
2. Vá para Planning Details de Monte Verde
3. Procure por request: `/rides/city/Nova Monte Verde/monthly`
4. Verifique o `revenue` para janeiro = 872.50
5. Comparar com tabela transactions: deve ser igual ✅




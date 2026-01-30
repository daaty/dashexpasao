# Correção: Cálculo de Custos Projetados Mês a Mês

## ✅ O que foi corrigido

### Antes (Incorreto)
```javascript
// Custos projetados ACUMULADOS totalmente
projectedMarketingCost += cityAccumulatedGoal * marketingCostPerRide;
projectedOperationalCost += cityAccumulatedGoal * operationalCostPerRide;
```
- Multiplicava a meta ACUMULADA total por um único custo
- Não respeitava a graduação mês a mês
- Resultado: Custos projetados estavam super-inflacionados

### Depois (Correto)
```javascript
// Iteração MÊS A MÊS desde a implementação até hoje
let monthlyIterYear = impYear;
let monthlyIterMonth = impMonth;

for (let m = 1; m <= monthsSinceStart; m++) {
    // Meta graduada para este mês específico
    const monthFactor = m <= 6 ? curveFactors[m - 1] : 1.0;
    const monthGoal = Math.round(cityBaseGoal * monthFactor);
    
    // Custo projetado para ESTE MÊS = meta mensal * custo por corrida
    projectedMarketingCost += monthGoal * marketingCostPerRide;
    projectedOperationalCost += monthGoal * operationalCostPerRide;
    
    // Avançar para próximo mês
    monthlyIterMonth++;
    if (monthlyIterMonth > 12) {
        monthlyIterMonth = 1;
        monthlyIterYear++;
    }
}
```

## 📊 Exemplo de Cálculo

**Cidade: Nova Monte Verde**
- Data de implementação: 01/08/2025
- População 15-44: 10.000
- Meta base (10% penetração): 1.000 corridas/mês após ramp-up
- Custos: Marketing = R$0.15/corrida, Operacional = R$0.20/corrida

### Mês 1 (Agosto/2025): Fator 4.5%
- Meta: 1.000 × 0.045 = 45 corridas
- Custo Marketing: 45 × R$0.15 = R$6.75
- Custo Operacional: 45 × R$0.20 = R$9.00

### Mês 2 (Setembro/2025): Fator 9%
- Meta: 1.000 × 0.09 = 90 corridas
- Custo Marketing: 90 × R$0.15 = R$13.50
- Custo Operacional: 90 × R$0.20 = R$18.00

### Mês 3 (Outubro/2025): Fator 18%
- Meta: 1.000 × 0.18 = 180 corridas
- Custo Marketing: 180 × R$0.15 = R$27.00
- Custo Operacional: 180 × R$0.20 = R$36.00

... e assim por diante, MÊS A MÊS

## 🎯 Fluxo de Dados Completo

```
Para cada cidade com implementationStartDate configurada:
├─ Buscar dados mensais reais de corridas (getMonthlyRidesByCity)
├─ Iterar cada mês desde a data de implementação até hoje
│  ├─ Calcular meta graduada do mês
│  ├─ Somar custo de marketing projetado (meta × R$0.15)
│  ├─ Somar custo operacional projetado (meta × R$0.20)
│  └─ Somar receita projetada (meta × R$8)
├─ Agregar dados reais de corridas concluídas (status='Concluída')
├─ Agregar custos reais do plano de cada cidade
└─ Validar: só conta dados a partir da data de implementação

Se city.implementationStartDate === null ou undefined:
└─ IGNORAR completamente os dados dessa cidade
```

## 💡 Cidades Ignoradas

Se uma cidade NÃO tem `implementationStartDate` configurada:
- ❌ Sua meta NÃO é somada
- ❌ Seus custos projetados NÃO são calculados
- ❌ Seus dados reais NÃO são contabilizados
- ✅ Mensagem aparece no console se houver erro

## 🔍 Como Verificar

Abra o DevTools (F12) → Console e veja:
1. Se há erros ao buscar dados das cidades
2. Os valores agregados devem ser muito mais realistas agora
3. Os custos projetados devem ser menores (antes era bem maior)

## 📝 Constantes Utilizadas

```javascript
const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0]; // Gradação 6 meses
const targetPenetration = 0.10; // 10% da população 15-44
const revenuePerRide = 8; // R$ 8 por corrida
const marketingCostPerRide = 0.15; // R$ 0.15
const operationalCostPerRide = 0.20; // R$ 0.20
```

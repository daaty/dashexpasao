# 🚀 Manual de Uso - Bloco Corridas Realizadas Hoje

**Versão:** 1.0  
**Data:** 31/01/2026  
**Status:** ✅ Implementado e Testado

---

## 📍 Localização

**Onde encontrar:** Na página **Dashboard** principal  
**Posição:** Logo após os 4 cards de KPI (Cobertura, Receita, População, Oportunidades)  
**Seção:** "Visão Geral das Operações"

---

## 🎯 Funcionalidades Principais

### 1. Visualização de Corridas Realizadas (Hoje)
- **Métrica:** Número total de corridas concluídas no dia
- **Atualização:** A cada 1 minuto
- **Formato:** Número formatado (ex: "1.237")
- **Ícone:** 🚗

### 2. Receita Real e Concluída (Hoje) ⭐
- **Métrica:** Receita total concluída nas corridas do dia
- **Atualização:** A cada 1 minuto
- **Formato:** Moeda brasileira sem decimais (ex: "R$ 45.820")
- **Ícone:** 💰
- **Destaque:** Este é o card principal para monitorar receita do dia

### 3. Cidades em Operação (Hoje)
- **Métrica:** Quantas cidades tiveram operação no dia
- **Atualização:** A cada 1 minuto
- **Formato:** Número inteiro (ex: "42")
- **Ícone:** 🏙️

---

## ⏰ Sistema de Atualização

### Como Funciona

```
Você abre o Dashboard
        ↓
[Imediato] Carrega dados das corridas de hoje
        ↓
[00:00] Mostra dados iniciais
        ↓
[01:00] Atualiza automaticamente (você vê "⟳ Atualizando...")
        ↓
[01:02] Dados atualizados e exibidos
        ↓
[02:00] Próxima atualização...
```

### Intervalos de Atualização

- **Primeira Carga:** Imediata (quando você abre o Dashboard)
- **Atualizações Periódicas:** A cada **60 segundos (1 minuto)**
- **Próxima Atualização:** Indicada no rodapé do bloco

---

## 🔍 Entendendo os Indicadores

### Status Visual Durante Sincronização

#### Quando está atualizando:
```
Bloco mostra: ⟳ Atualizando...
Cards ganham: Efeito pulse (animação suave)
Comportamento: Dados temporariamente em "refresh"
```

#### Quando termina a atualização:
```
Indicador desaparece
Hora é atualizada: "📊 Última atualização: 31/01/2026 14:35:42"
Cards voltam ao normal
Dados refletem situação atual
```

### Indicadores de Verificação

Cada card mostra um indicador:

| Card | Indicador | Significado |
|------|-----------|-------------|
| Corridas | ✓ Dados em tempo real | Corridas sincronizadas com banco |
| Receita Real | ✓ Receita verificada | Receita confirmada e concluída |
| Cidades | ✓ Ativas hoje | Cidades que operaram hoje |

---

## 📊 Interpretando os Dados

### Corridas Realizadas
- **O que é:** Número total de corridas concluídas
- **Quando atualiza:** A cada 1 minuto
- **Exemplo:** "1.237 corridas concluídas hoje"
- **Uso:** Monitorar volume de operações diárias

### Receita Real e Concluída
- **O que é:** Valor total de receita gerada nas corridas
- **Quando atualiza:** A cada 1 minuto
- **Exemplo:** "R$ 45.820 receita concluída hoje"
- **Uso:** Acompanhar faturamento real do dia
- **Nota:** Mostra apenas receita de corridas concluídas (não pendentes)

### Cidades em Operação
- **O que é:** Quantas cidades tiveram pelo menos uma corrida
- **Quando atualiza:** A cada 1 minuto
- **Exemplo:** "42 cidades com operação hoje"
- **Uso:** Verificar abrangência de operações

---

## 🕐 Lendo o Timestamp

### Localização
O timestamp está no **rodapé do bloco**, em duas formas:

```
1. Hora no topo-direito: 14:35
   └─ Mostra hora da última atualização

2. No rodapé completo: "📊 Última atualização: 31/01/2026 14:35:42"
   └─ Data e hora precisas da última sincronização
```

### Exemplo de Leitura

```
Bloco atualizado às 14:35 (5 horas e 35 minutos da tarde)
Próxima atualização em ~1 minuto
Será às 14:36 aproximadamente
```

---

## 🎬 Ciclo Completo de Atualização

### Minuto 1 (00:00 - 01:00)
```
14:00:00 → Dashboard carregado
14:00:02 → Dados das corridas carregadas
14:00:05 → Bloco renderizado com valores
14:00:05 → "📊 Última atualização: 31/01/2026 14:00:05"
14:00:05 → Timer começa contagem para próximo fetch
```

### Minuto 2 (01:00 - 02:00)
```
14:01:00 → ⟳ Atualizando... (indicador ativo)
14:01:00 → Cards ganham efeito pulse
14:01:03 → Resposta do backend recebida
14:01:03 → Dados atualizados nos cards
14:01:03 → "📊 Última atualização: 31/01/2026 14:01:03"
14:01:03 → Indicador "⟳ Atualizando..." desaparece
```

### Minuto 3 (02:00 - 03:00)
```
[Repete o ciclo do Minuto 2]
```

---

## ✅ Checklist de Uso

Ao acessar o Dashboard:

- [ ] Você vê o bloco "Corridas Realizadas Hoje"?
- [ ] Há 3 cards visíveis (Corridas, Receita, Cidades)?
- [ ] Os números estão visíveis (ex: "1.237", "R$ 45.820", "42")?
- [ ] Há um indicador "🔄 Atualiza a cada 1 min" no topo?
- [ ] O timestamp aparece no rodapé com data/hora?
- [ ] Os cards têm cores diferentes (ciano, verde, roxo)?

Se todos estão marcados ✓, o sistema está funcionando!

---

## 🔧 Troubleshooting

### Problema: Os dados não estão atualizando

**Solução:**
1. Verifique se o **backend está rodando** (`npm run dev` ou `npm run start`)
2. Verifique se há **conexão de rede**
3. Abra o **Developer Tools** (F12) → Console
4. Veja se há erros em vermelho
5. Tente **recarregar a página** (Ctrl+F5)

### Problema: Indicador "Atualizando..." nunca desaparece

**Solução:**
1. Pode haver **erro na API**
2. Abra Developer Tools → Network
3. Veja se o endpoint `/rides/today` retorna erro
4. Verifique o backend

### Problema: Timestamp não muda

**Solução:**
1. Espere **1 minuto completo** (60 segundos)
2. Se não mudar, verifique se a página está ativa
3. Você pode clicar em outro abas? Se sim, volte para o Dashboard

### Problema: Números mostram 0 ou N/A

**Solução:**
1. Pode não haver **dados de corridas no dia**
2. Verifique se há corridas ativas no sistema
3. Tente fazer uma corrida de teste
4. Espere ~1 minuto pela atualização

---

## 📱 Comportamento em Diferentes Dispositivos

### Desktop
- ✅ Cards em 3 colunas
- ✅ Texto totalmente visível
- ✅ Todas as animações funcionam

### Tablet (Medium)
- ✅ Cards em 3 colunas
- ✅ Fonte ajustada
- ✅ Toque responsivo

### Mobile (Small)
- ✅ Cards em 1 coluna
- ✅ Texto adaptado
- ✅ Toque responsivo

---

## 🎨 Personalizações Possíveis

### Se você quiser mudar:

1. **Intervalo de Atualização** (de 1 minuto para outro valor)
   - Arquivo: [pages/Dashboard.tsx](../pages/Dashboard.tsx#L285)
   - Mudança: `setInterval(loadTodayRides, 60000)` → `60000` é 1 minuto
   - Para 30 segundos: `30000`
   - Para 2 minutos: `120000`

2. **Cores dos Cards**
   - Arquivo: [pages/Dashboard.tsx](../pages/Dashboard.tsx#L630-L675)
   - Procure por `rgba(6, 182, 212, ...)` para cores

3. **Tamanho das Fontes**
   - Procure por `text-3xl` ou `text-4xl`
   - Mude para `text-2xl` (menor) ou `text-5xl` (maior)

---

## 📞 Suporte Técnico

### Se algo der errado:

1. **Verificar Erros:**
   - Abra: Ctrl+Shift+K (DevTools Console)
   - Procure por mensagens em vermelho

2. **Ver Requisições:**
   - Abra: Ctrl+Shift+E (DevTools Network)
   - Filtre por "rides"
   - Veja se `/rides/today` retorna dados

3. **Reiniciar:**
   - Recarregue: Ctrl+F5 (força recarregamento)
   - Se persistir, reinicie o servidor

---

## 📝 Anotações Importantes

- ✅ O sistema funciona **mesmo se você sair da página e voltar**
- ✅ A atualização **não para enquanto o Dashboard está aberto**
- ✅ Se você **fechar o Dashboard**, a atualização para
- ✅ **Sem conexão de internet** = Dados congelam (não atualizam)
- ✅ Dados mostram apenas **corridas de HOJE** (dia atual)

---

## 🎓 Resumo Rápido

| Aspecto | Descrição |
|--------|-----------|
| **O que mostra** | Corridas, Receita e Cidades de hoje |
| **Frequência** | A cada 1 minuto (60 segundos) |
| **Fonte de dados** | Endpoint `/rides/today` do backend |
| **Horário** | Hora exata da última sincronização |
| **Status** | Indicador "⟳ Atualizando..." durante sync |
| **Descrição** | "concluídas/concluída hoje" |
| **Verificação** | Indicadores ✓ em cada card |

---

## 🎯 Próximos Passos

1. **Você pode:** Acompanhar receita em tempo real durante o dia
2. **Você pode:** Monitorar quantidade de corridas por minuto
3. **Você pode:** Verificar abrangência de cidades ativas
4. **Futuro:** Adicionar gráficos históricos de receita
5. **Futuro:** Adicionar alertas quando receita atingir meta

---

**Versão:** 1.0  
**Data:** 31/01/2026  
**Status:** ✅ PRONTO PARA USO


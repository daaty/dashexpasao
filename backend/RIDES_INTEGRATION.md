# Implementação de Dados Reais de Corridas do N8N

## 📊 Objetivo
Integrar dados reais de corridas do banco de dados PostgreSQL do N8N (`dashboard.rides`) para substituir ou complementar os dados simulados no dashboard.

## 🗄️ Informações do Banco de Dados

**Connection String:** 
```
postgresql://n8n_user:n8n_pw@n8n_postgres:5432/postgres?schema=dashboard&sslmode=disable
```

**Tabela:** `dashboard.rides`

## 🚀 Plano de Implementação

### Fase 1: Análise e Preparação ✅

1. **Verificar Acesso ao Banco**
   - [ ] Garantir que o container `n8n_postgres` está rodando
   - [ ] Verificar se a porta 5432 está exposta e acessível
   - [ ] Testar conexão com diferentes hosts (localhost, IP específico)

2. **Analisar Estrutura da Tabela `rides`**
   - [ ] Identificar colunas disponíveis
   - [ ] Verificar campos de data/timestamp
   - [ ] Identificar campo de cidade
   - [ ] Verificar dados relacionados (valor, status, etc.)

### Fase 2: Configuração do Projeto

1. **Adicionar Configuração Dupla de Banco** ✅
   ```typescript
   // Banco principal (cidades, planejamento)
   DATABASE_URL="postgresql://urbanexpansao:urban2026@..."
   
   // Banco N8N (dados de corridas)
   N8N_DATABASE_URL="postgresql://n8n_user:n8n_pw@..."
   ```

2. **Criar Cliente Prisma/PG Separado para N8N** ✅
   - Manter Prisma Client existente para banco principal
   - Adicionar cliente PG nativo para consultas ao N8N

### Fase 3: Implementação do Serviço

1. **Criar Serviço de Corridas** (`ridesService.ts`)
   ```typescript
   interface RideData {
     city: string;
     date: Date;
     value: number;
     status: string;
     // ... outros campos
   }
   
   class RidesService {
     async getRidesByCity(cityName: string): Promise<RideData[]>
     async getRidesStatsByCity(cityName: string): Promise<RidesStats>
     async getTotalRidesByPeriod(startDate: Date, endDate: Date): Promise<RidesSummary>
     async getMonthlyRidesByCity(cityName: string, months: number): Promise<MonthlyData[]>
   }
   ```

2. **Criar Modelos/Types**
   ```typescript
   interface RidesStats {
     totalRides: number;
     totalRevenue: number;
     averageValue: number;
     firstRide: Date;
     lastRide: Date;
     activeMonths: number;
   }
   
   interface MonthlyData {
     month: string;
     rides: number;
     revenue: number;
   }
   ```

### Fase 4: Integração com API

1. **Criar Rotas de Corridas** (`rides.routes.ts`)
   ```
   GET /api/rides/city/:cityId/stats
   GET /api/rides/city/:cityId/monthly
   GET /api/rides/city/:cityId/history
   GET /api/rides/summary
   ```

2. **Criar Controller** (`rides.controller.ts`)

### Fase 5: Integração no Frontend

1. **Atualizar Serviço de API**
   ```typescript
   // services/ridesApiService.ts
   export const getRidesStats = async (cityId: number) => {...}
   export const getMonthlyRides = async (cityId: number) => {...}
   ```

2. **Atualizar Componentes**
   - `CityDetails.tsx` - Mostrar dados reais de corridas
   - `Dashboard.tsx` - Indicadores com dados reais
   - `CityMarketAnalysis.tsx` - Análise baseada em dados reais

### Fase 6: Mapeamento de Cidades

1. **Criar Tabela de Mapeamento**
   - Nomes de cidades no N8N podem ser diferentes
   - Criar serviço de normalização de nomes
   - Exemplo:
     ```typescript
     const cityMapping = {
       'Cuiaba': 'Cuiabá',
       'Varzea Grande': 'Várzea Grande',
       // ...
     }
     ```

## 📋 Checklist de Implementação

### Pré-requisitos
- [ ] Docker Desktop rodando
- [ ] Container `n8n_postgres` acessível
- [ ] Credenciais validadas
- [ ] Estrutura da tabela `dashboard.rides` documentada

### Desenvolvimento
- [ ] Script de análise executado com sucesso
- [ ] Configuração de ambiente atualizada
- [ ] Cliente de banco separado criado
- [ ] Serviço de corridas implementado
- [ ] Rotas de API criadas
- [ ] Controller implementado
- [ ] Testes de integração
- [ ] Serviço de mapeamento de cidades

### Frontend
- [ ] Serviço de API criado
- [ ] Componentes atualizados
- [ ] Indicadores conectados a dados reais
- [ ] Gráficos com dados reais
- [ ] Loading states
- [ ] Error handling

### Deploy
- [ ] Variáveis de ambiente configuradas
- [ ] Conexão de rede entre containers
- [ ] Testes em produção

## 🔧 Como Proceder Agora

### Opção 1: Container Local
Se o banco está em um container Docker local:
```bash
# Iniciar Docker Desktop
# Verificar containers rodando
docker ps

# Se n8n_postgres não estiver rodando
docker start n8n_postgres

# Verificar IP do container
docker inspect n8n_postgres | findstr IPAddress

# Verificar porta exposta
docker port n8n_postgres
```

### Opção 2: Servidor Remoto
Se o banco está em um servidor remoto:
```
postgresql://n8n_user:n8n_pw@[IP_DO_SERVIDOR]:5432/postgres?sslmode=disable
```

### Opção 3: Port Forwarding
Se estiver usando Kubernetes ou Docker Compose com rede isolada:
```bash
# Criar port forward
kubectl port-forward service/n8n-postgres 5432:5432

# ou com Docker
docker run --network [NETWORK_NAME] -p 5432:5432 ...
```

## 📝 Próximos Passos

1. **Informe sobre o ambiente:**
   - O banco n8n_postgres está rodando local ou remoto?
   - Em qual porta está exposto?
   - Qual o IP ou hostname correto?

2. **Após conectar com sucesso:**
   - Executar script de análise
   - Documentar estrutura da tabela
   - Iniciar implementação do serviço

3. **Implementação incremental:**
   - Começar com endpoint simples (total de corridas por cidade)
   - Adicionar estatísticas mensais
   - Integrar no frontend gradualmente
   - Manter fallback para dados mockados se conexão falhar

## 🎯 Benefícios Esperados

✅ Dados reais de operação em cada cidade
✅ Histórico preciso de corridas
✅ Análise de tendências baseada em dados reais
✅ Métricas de receita reais
✅ Insights de sazonalidade
✅ Validação de projeções vs realidade

## ⚠️ Considerações

- Manter backup dos dados mockados
- Implementar cache para não sobrecarregar banco N8N
- Adicionar tratamento de erros robusto
- Considerar sincronização periódica vs consultas em tempo real
- Documentar diferenças entre cidades com/sem dados reais

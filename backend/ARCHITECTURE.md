# Arquitetura do Backend - Urban Expansão

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (Frontend)                     │
│                   React + Vite + TypeScript                   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       API GATEWAY                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express Server (Port 3001)                           │  │
│  │  - CORS, Helmet, Compression                          │  │
│  │  - Rate Limiting                                       │  │
│  │  - Request Validation (Joi)                            │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        ROUTES LAYER                           │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐            │
│  │  /cities │  │   /ai    │  │  /plannings    │            │
│  └──────────┘  └──────────┘  └────────────────┘            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     CONTROLLERS LAYER                         │
│  ┌────────────────┐  ┌───────────┐  ┌──────────────┐       │
│  │ city.controller│  │ai.controller│ │plan.controller│      │
│  └────────────────┘  └───────────┘  └──────────────┘       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICES LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │city.service  │  │ ibge.service │  │ ai.service   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│  ┌──────▼─────────────────▼──────────────────▼──────┐       │
│  │         planning.service                          │       │
│  └───────────────────────────────────────────────────┘       │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌─────────────────┐  ┌──────────────┐
│   PRISMA ORM │   │  EXTERNAL APIs  │  │   LOGGING    │
└──────┬───────┘   └─────────────────┘  └──────────────┘
       │           │                 │
       │           │ - Gemini AI     │
       │           │ - IBGE API      │
       ▼           └─────────────────┘
┌──────────────┐
│ PostgreSQL   │
│   Database   │
└──────────────┘
```

## 🗂️ Estrutura de Diretórios

```
backend/
│
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados
│   └── seed.ts                # Dados iniciais
│
├── src/
│   ├── config/                # Configurações globais
│   │   ├── config.ts          # Variáveis de ambiente
│   │   ├── database.ts        # Conexão Prisma
│   │   └── logger.ts          # Winston logger
│   │
│   ├── controllers/           # Controllers REST
│   │   ├── city.controller.ts
│   │   ├── ai.controller.ts
│   │   └── planning.controller.ts
│   │
│   ├── services/              # Lógica de negócio
│   │   ├── city.service.ts    # CRUD de cidades + viabilidade
│   │   ├── ibge.service.ts    # Integração IBGE
│   │   ├── ai.service.ts      # Integração Gemini
│   │   └── planning.service.ts # Gestão de planejamentos
│   │
│   ├── routes/                # Definição de rotas
│   │   ├── city.routes.ts
│   │   ├── ai.routes.ts
│   │   ├── planning.routes.ts
│   │   └── index.ts
│   │
│   ├── middleware/            # Middlewares
│   │   ├── errorHandler.ts    # Tratamento de erros
│   │   └── validation.ts      # Validação de requests
│   │
│   ├── types/                 # Tipos TypeScript
│   │   └── index.ts
│   │
│   ├── utils/                 # Utilitários
│   │   └── validators.ts      # Schemas Joi
│   │
│   └── server.ts              # Entry point
│
├── logs/                      # Arquivos de log (gerado)
├── dist/                      # Build output (gerado)
├── node_modules/              # Dependências (gerado)
│
├── .env                       # Variáveis de ambiente (local)
├── .env.example               # Template de variáveis
├── .gitignore
├── package.json
├── tsconfig.json
├── docker-compose.yml
├── Dockerfile
├── README.md
└── INSTALL.md
```

## 🔄 Fluxo de Requisição

### Exemplo: GET /api/cities

```
1. Cliente faz requisição → GET /api/cities?status=NOT_SERVED&page=1

2. Express Server (server.ts)
   ├─ Middleware: CORS, Helmet, Rate Limiter
   ├─ Body Parser
   └─ Morgan (logging)

3. Routes (city.routes.ts)
   ├─ Validação: validateRequest(cityQuerySchema)
   └─ Direciona para: cityController.getAllCities

4. Controller (city.controller.ts)
   ├─ Extrai parâmetros do req.query
   ├─ Chama: cityService.getAllCities()
   └─ Retorna ApiResponse

5. Service (city.service.ts)
   ├─ Monta query do Prisma
   ├─ Executa: prisma.city.findMany()
   └─ Retorna: { cities, pagination }

6. Database (PostgreSQL)
   ├─ Executa SQL query
   └─ Retorna resultados

7. Response
   └─ JSON: { success: true, data: [...], pagination: {...} }
```

## 🗄️ Modelos do Banco

### City (Cidade)
- Dados demográficos
- Status de atendimento
- Indicadores econômicos
- Relacionamentos: plannings[], comparisons[]

### Planning (Planejamento)
- Informações do projeto
- Datas, orçamento, progresso
- Relacionamentos: city, tasks[]

### Task (Tarefa)
- Tarefas do planejamento
- Status de conclusão
- Relacionamento: planning

### AIQuery (Consulta IA)
- Histórico de prompts
- Respostas geradas
- Contexto utilizado

### IBGECache (Cache IBGE)
- Cache de dados do IBGE
- Timestamp de atualização
- Reduz chamadas à API

## 🔐 Segurança

### Camadas de Proteção

1. **Helmet** - Headers HTTP seguros
2. **CORS** - Controle de origens
3. **Rate Limiting** - 100 req/15min por IP
4. **Input Validation** - Joi schemas
5. **Error Handling** - Sem vazamento de info sensível
6. **Environment Variables** - Credenciais protegidas

## 🚀 APIs Externas

### IBGE API
- **Endpoint**: servicodados.ibge.gov.br
- **Uso**: Dados atualizados de municípios
- **Agregados**: População, PIB, Empregos, Salários
- **Cache**: IBGECache model

### Gemini AI (Google)
- **Modelo**: gemini-2.0-flash-exp
- **Uso**: Análises de viabilidade, chat assistente
- **Context**: Top 50 cidades por população
- **Rate**: Controlado pelo Google

## 📊 Performance

### Otimizações

1. **Compression** - Gzip nos responses
2. **Prisma Pooling** - Connection pool
3. **IBGE Cache** - Evita requisições redundantes
4. **Pagination** - Limite de 100 items por página
5. **Indexes** - No schema Prisma (status, mesorregion, population)

## 🐳 Deploy

### Docker Compose
```yaml
services:
  - postgres (Database)
  - backend (API Server)
volumes:
  - postgres_data (Persistência)
```

### Portas
- **Backend**: 3001
- **PostgreSQL**: 5432
- **Prisma Studio**: 5555

## 📈 Monitoramento

### Logs (Winston)
- **error.log**: Apenas erros
- **combined.log**: Todos os eventos
- **Console**: Desenvolvimento colorizado

### Health Check
```
GET /api/health
Response: { success: true, timestamp: "..." }
```

## 🔄 CI/CD Sugerido

```
1. Git Push → GitHub
2. GitHub Actions
   ├─ Install dependencies
   ├─ Run linter
   ├─ Run tests
   ├─ Build Docker image
   └─ Deploy to cloud
3. Migration execution
4. Server restart
```

## 📚 Tecnologias Principais

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Node.js | 18+ | Runtime |
| TypeScript | 5.8+ | Type safety |
| Express | 4.21+ | Web framework |
| Prisma | 6.3+ | ORM |
| PostgreSQL | 15+ | Database |
| Gemini AI | Latest | IA generativa |
| Winston | 3.17+ | Logging |
| Joi | 17.14+ | Validation |
| Helmet | 8+ | Security |

## 🎯 Próximas Melhorias

- [ ] Autenticação JWT
- [ ] WebSockets para updates real-time
- [ ] Testes unitários (Jest)
- [ ] Testes de integração
- [ ] Swagger/OpenAPI documentation
- [ ] Redis para caching avançado
- [ ] Elasticsearch para busca avançada
- [ ] Métricas com Prometheus
- [ ] Monitoramento com Grafana

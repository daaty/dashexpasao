# Urban Expansão Backend API

Backend API para o Dashboard de Expansão Urbana da Urban Passageiro em Mato Grosso.

## 📋 Características

- **Node.js + TypeScript** - Desenvolvimento type-safe
- **Express** - Framework web minimalista e flexível
- **Prisma ORM** - ORM moderno para PostgreSQL
- **Gemini AI** - Integração com IA para análises
- **IBGE API** - Dados atualizados de municípios
- **Rate Limiting** - Proteção contra abuso
- **Validation** - Validação de dados com Joi
- **Logging** - Sistema completo de logs com Winston

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### Instalação

1. Instale as dependências:
```bash
cd backend
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/urban_expansao"
GEMINI_API_KEY=sua_chave_aqui
PORT=3001
```

3. Execute as migrações do banco:
```bash
npm run prisma:migrate
```

4. (Opcional) Popule o banco com dados iniciais:
```bash
npm run prisma:seed
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

A API estará disponível em `http://localhost:3001`

## 📁 Estrutura do Projeto

```
backend/
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   └── seed.ts            # Script de seed
├── src/
│   ├── config/            # Configurações (database, logger, env)
│   ├── controllers/       # Controllers da API
│   ├── services/          # Lógica de negócio
│   ├── routes/            # Definição de rotas
│   ├── middleware/        # Middlewares (error, validation)
│   ├── types/             # Tipos TypeScript
│   ├── utils/             # Utilitários e validators
│   └── server.ts          # Entry point da aplicação
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔌 Endpoints da API

### Cities (Cidades)

- `GET /api/cities` - Listar cidades com filtros e paginação
- `GET /api/cities/:id` - Buscar cidade por ID
- `GET /api/cities/viability` - Cidades ordenadas por score de viabilidade
- `POST /api/cities` - Criar/atualizar cidade
- `PUT /api/cities/:id/update-ibge` - Atualizar dados do IBGE

### AI (Inteligência Artificial)

- `POST /api/ai/chat` - Gerar resposta baseada em prompt
- `GET /api/ai/analysis/:id` - Análise de viabilidade de cidade

### Planning (Planejamentos)

- `GET /api/plannings` - Listar planejamentos
- `GET /api/plannings/:id` - Buscar planejamento por ID
- `POST /api/plannings` - Criar planejamento
- `PUT /api/plannings/:id` - Atualizar planejamento
- `DELETE /api/plannings/:id` - Deletar planejamento
- `POST /api/plannings/:id/tasks` - Adicionar tarefa
- `PUT /api/plannings/tasks/:taskId` - Atualizar tarefa
- `DELETE /api/plannings/tasks/:taskId` - Deletar tarefa

### Health Check

- `GET /api/health` - Status da API
- `GET /` - Informações da API

## 🗄️ Schema do Banco de Dados

### Modelos Principais:

- **City** - Dados das cidades
- **Planning** - Planejamentos de expansão
- **Task** - Tarefas dos planejamentos
- **AIQuery** - Histórico de consultas à IA
- **IBGECache** - Cache de dados do IBGE
- **Comparison** - Comparações entre cidades

## 🔧 Scripts Disponíveis

```bash
npm run dev              # Inicia servidor em modo desenvolvimento
npm run build            # Compila TypeScript para JavaScript
npm start                # Inicia servidor de produção
npm run prisma:generate  # Gera Prisma Client
npm run prisma:migrate   # Executa migrações
npm run prisma:studio    # Interface visual do banco
npm run prisma:seed      # Popula banco com dados iniciais
```

## 🛡️ Segurança

- **Helmet** - Headers de segurança HTTP
- **CORS** - Configuração de origens permitidas
- **Rate Limiting** - Limite de requisições por IP
- **Input Validation** - Validação de dados de entrada
- **Error Handling** - Tratamento centralizado de erros

## 📊 Logs

Os logs são salvos em:
- `logs/error.log` - Apenas erros
- `logs/combined.log` - Todos os logs

## 🌐 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | 3001 |
| `NODE_ENV` | Ambiente | development |
| `DATABASE_URL` | URL do PostgreSQL | - |
| `GEMINI_API_KEY` | Chave da API Gemini | - |
| `CORS_ORIGIN` | Origens permitidas | http://localhost:5173 |
| `RATE_LIMIT_WINDOW_MS` | Janela do rate limit | 900000 (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | Máx de requisições | 100 |

## 🚀 Deploy

### Usando Docker

```bash
docker-compose up -d
```

### Manual

1. Build do projeto:
```bash
npm run build
```

2. Configure as variáveis de ambiente de produção

3. Execute as migrações:
```bash
npm run prisma:migrate
```

4. Inicie o servidor:
```bash
npm start
```

## 📝 Desenvolvimento

### Adicionando uma Nova Rota

1. Crie o service em `src/services/`
2. Crie o controller em `src/controllers/`
3. Adicione as rotas em `src/routes/`
4. Adicione validações em `src/utils/validators.ts`

### Modificando o Schema

1. Edite `prisma/schema.prisma`
2. Execute `npm run prisma:migrate`
3. Execute `npm run prisma:generate`

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

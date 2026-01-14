# Dashboard de Expansão Urbana - Mato Grosso

Sistema completo para análise e planejamento de expansão urbana em municípios de Mato Grosso, com dados do IBGE e inteligência artificial.

## 🚀 Tecnologias

### Frontend
- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- Axios
- React Router

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Google Gemini AI
- APIs do IBGE

## 📁 Estrutura do Projeto

```
├── backend/           # API Node.js + Express
│   ├── src/          # Código fonte
│   ├── prisma/       # Schema e migrations
│   ├── scripts/      # Scripts de setup e população de dados
│   └── Dockerfile    # Container Docker
├── components/       # Componentes React
├── pages/           # Páginas da aplicação
├── services/        # Serviços e APIs
└── utils/           # Utilitários
```

## 🎯 Funcionalidades

- ✅ **Dashboard Interativo**: Visualização de dados de 141 municípios de MT
- ✅ **Filtros por Mesorregião**: 5 mesorregiões do IBGE
- ✅ **Análise de Mercado**: Dados populacionais e indicadores
- ✅ **Planejamento**: Gestão de planos de expansão
- ✅ **IA Assistant**: Integração com Google Gemini para análises
- ✅ **Comparação de Cidades**: Análise comparativa entre municípios
- ✅ **Roadmap**: Visualização de cronogramas

## 🔧 Instalação Local

### Backend

```bash
cd backend
npm install
npx prisma generate

# Configurar .env
DATABASE_URL="postgresql://user:pass@host:5432/db"
GEMINI_API_KEY="sua-chave-aqui"
CORS_ORIGIN="http://localhost:3000"

# Executar migração e popular banco
npx tsx scripts/setup-database.ts

# Iniciar servidor
npm run dev
```

### Frontend

```bash
npm install
npm run dev
```

## 🐳 Deploy com Docker

### Easy Panel

Consulte [backend/DEPLOY_EASYPANEL.md](backend/DEPLOY_EASYPANEL.md) para instruções completas de deploy.

**Resumo:**
1. Crie uma aplicação Node.js no Easy Panel
2. Configure as variáveis de ambiente
3. Faça deploy do código
4. Execute: `npx tsx scripts/setup-database.ts`

## 📊 Dados

O sistema trabalha com:
- **141 municípios** de Mato Grosso
- **5 mesorregiões**: Norte, Nordeste, Centro-Sul, Sudeste, Sudoeste
- **Dados do IBGE**: População, área, PIB
- **APIs IBGE**: Atualização em tempo real

## 🌐 APIs

### Endpoints Principais

```
GET  /api/cities              # Listar cidades
GET  /api/cities/:id          # Detalhes da cidade
POST /api/planning            # Criar planejamento
GET  /api/planning/:id        # Detalhes do planejamento
POST /api/ai/query            # Consulta ao assistente IA
```

Veja [backend/API_EXAMPLES.md](backend/API_EXAMPLES.md) para documentação completa.

## 📝 Scripts Úteis

```bash
# Popular banco com dados do IBGE
npx tsx scripts/populate-ibge-data.ts

# Executar apenas migração
npx tsx scripts/run-migration.ts

# Setup completo (migração + população)
npx tsx scripts/setup-database.ts
```

## 🔐 Variáveis de Ambiente

### Backend (.env)

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db
CORS_ORIGIN=http://localhost:3000
GEMINI_API_KEY=sua-chave-google-ai
```

## 📦 Build

```bash
# Frontend
npm run build

# Backend
cd backend
npm run build
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Add nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

MIT

## 👨‍💻 Autor

Dashboard de Expansão Urbana - 2026

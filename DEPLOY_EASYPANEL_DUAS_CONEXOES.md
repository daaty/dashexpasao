# 🚀 Deploy Easypanel - Configuração com Duas Conexões de Banco

## ✅ Commit Realizado
```
Commit: 046d118
Mensagem: fix: corrigir persistencia CPA/OPS e separar configuracao de bancos - Urban (planejamentos) + N8N (rides/transactions)
```

## 🗄️ Configuração de Bancos

### Banco 1: Urban (Principal - Planejamentos)
- **HOST**: `148.230.73.27`
- **PORTA**: `5434`
- **DATABASE**: `urbantmt`
- **USER**: `urbanmt`
- **PASSWORD**: `urban2025`
- **FUNÇÃO**: Dados de planejamento, resultados, CPA/OPS persistência

### Banco 2: N8N (Leitura - Corridas Reais)
- **HOST**: `148.230.73.27`
- **PORTA**: `5432`
- **DATABASE**: `postgres`
- **USER**: `n8n_user`
- **PASSWORD**: `n8n_pw`
- **FUNÇÃO**: Leitura de `dashboard.rides` e `dashboard.transactions`

## 🔧 Variáveis de Ambiente para Easypanel

### Backend Environment Variables:
```env
NODE_ENV=production
PORT=3001

# Banco Principal (Urban) - Para Prisma
DATABASE_URL=postgres://urbanmt:urban2025@148.230.73.27:5434/urbantmt?sslmode=disable

# Banco N8N - Para consultas de corridas
N8N_DATABASE_URL=postgres://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable

# CORS
CORS_ORIGIN=http://expansao.urban.com.br,https://expansao.urban.com.br

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# IBGE API
IBGE_API_BASE_URL=https://servicodados.ibge.gov.br/api/v3

# Logging
LOG_LEVEL=info

# API Keys (opcional)
GEMINI_API_KEY=
```

### Frontend Environment Variables:
```env
VITE_API_URL=http://api.expansao.urban.com.br/api
```

## 📋 Checklist de Deploy

### 1. ✅ Backend (api.expansao.urban.com.br)
- [ ] Configurar todas as variáveis de ambiente acima
- [ ] Verificar se o Dockerfile está correto (usar backend como context)
- [ ] Deploy automático via GitHub

### 2. ✅ Frontend (expansao.urban.com.br)
- [ ] Configurar VITE_API_URL
- [ ] Deploy automático via GitHub

### 3. 🗄️ Testes Após Deploy
```bash
# Testar conexão com banco Urban (planejamentos)
curl "http://api.expansao.urban.com.br/api/plannings/results/5103403"

# Testar conexão com N8N (corridas)
curl "http://api.expansao.urban.com.br/api/cities/5103403/revenue"

# Testar health check geral
curl "http://api.expansao.urban.com.br/api/health"
```

## 🔍 Funcionalidades Testadas

### ✅ Persistência CPA/OPS
- Agora os valores editados de CPA e OPS por corrida são salvos no banco Urban
- Carregamento prioriza valores salvos sobre defaults hardcoded

### ✅ Separação de Bancos
- **Planejamentos**: Salvos no banco Urban (porta 5434)
- **Corridas Reais**: Consultadas no N8N (porta 5432)
- **Sem conflitos**: Cada banco tem sua responsabilidade específica

## 🚨 Pontos de Atenção

1. **Duas conexões simultâneas**: Backend conecta em ambos os bancos
2. **SSL Mode**: `sslmode=disable` para ambas as conexões
3. **Prisma**: Usa apenas DATABASE_URL (banco Urban)
4. **Queries diretas**: Usam N8N_DATABASE_URL para dashboard.rides/transactions

## 📊 Arquitetura Final

```
Frontend (expansao.urban.com.br)
    ↓ HTTP
Backend (api.expansao.urban.com.br)
    ↓ DATABASE_URL (porta 5434)
Urban DB (planejamentos, CPA/OPS)
    +
    ↓ N8N_DATABASE_URL (porta 5432)  
N8N DB (dashboard.rides, dashboard.transactions)
```

## 🎯 Resultado Esperado

Após o deploy:
- ✅ CPA/OPS editados são persistidos permanentemente
- ✅ Dados de corridas continuam sendo lidos do N8N
- ✅ Planejamentos salvos no banco correto (Urban)
- ✅ Separação clara de responsabilidades entre bancos
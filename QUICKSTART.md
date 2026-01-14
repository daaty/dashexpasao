# ⚡ Quick Start - Urban Expansão

## 🚀 Iniciar Projeto em 5 Minutos

### 1️⃣ PostgreSQL (Docker)
```powershell
docker run -d --name urban-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=urban_expansao -p 5432:5432 postgres:15-alpine
```

### 2️⃣ Backend
```powershell
cd backend
npm install
cp .env.example .env
# Editar .env e adicionar GEMINI_API_KEY
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### 3️⃣ Frontend
```powershell
# Em novo terminal
cd ..
npm install
echo "VITE_API_URL=http://localhost:3001/api" > .env.local
npm run dev
```

### 4️⃣ Verificar
```powershell
# Backend health check
curl http://localhost:3001/api/health

# Frontend
# Abrir navegador: http://localhost:5173
```

---

## 🔧 Comandos Úteis

### Backend
```powershell
# Desenvolvimento
cd backend
npm run dev                    # Iniciar servidor
npm run prisma:studio          # Interface do banco
npm run prisma:migrate         # Executar migrações
npm run prisma:seed            # Popular banco

# Produção
npm run build                  # Build TypeScript
npm start                      # Iniciar produção
```

### Frontend
```powershell
npm run dev                    # Desenvolvimento
npm run build                  # Build produção
npm run preview                # Preview build
```

### Docker
```powershell
cd backend
docker-compose up -d           # Iniciar tudo
docker-compose logs -f         # Ver logs
docker-compose down            # Parar tudo
```

---

## 🧪 Testar API

### PowerShell
```powershell
# Health check
Invoke-RestMethod http://localhost:3001/api/health

# Listar cidades
Invoke-RestMethod http://localhost:3001/api/cities

# Chat IA
$body = @{ prompt = "Melhores cidades?" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3001/api/ai/chat -Method Post -Body $body -ContentType "application/json"
```

### cURL
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/cities
curl -X POST http://localhost:3001/api/ai/chat -H "Content-Type: application/json" -d '{"prompt":"Melhores cidades?"}'
```

---

## 🐛 Troubleshooting Rápido

### Backend não inicia
```powershell
# Verificar PostgreSQL
docker ps | Select-String postgres

# Testar conexão
Test-NetConnection localhost -Port 5432

# Verificar .env
cat backend\.env
```

### Frontend não conecta
```powershell
# Verificar backend
curl http://localhost:3001/api/health

# Verificar .env.local
cat .env.local

# Limpar cache
Remove-Item -Recurse -Force node_modules\.vite
```

### Erro CORS
```powershell
# Verificar CORS_ORIGIN no backend/.env
CORS_ORIGIN=http://localhost:5173
```

---

## 📊 URLs Importantes

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| API Health | http://localhost:3001/api/health |
| Prisma Studio | http://localhost:5555 |
| PostgreSQL | localhost:5432 |

---

## 🔑 Obter Chave Gemini API

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com conta Google
3. Clique em "Get API Key"
4. Copie a chave
5. Cole no `backend/.env`:
```env
GEMINI_API_KEY=sua_chave_aqui
```

---

## ✅ Checklist

- [ ] PostgreSQL rodando (porta 5432)
- [ ] Backend rodando (porta 3001)
- [ ] Frontend rodando (porta 5173)
- [ ] GEMINI_API_KEY configurado
- [ ] Health check OK
- [ ] Frontend carregando dados

**Tudo OK? Comece a usar! 🎉**

---

## 📚 Documentação Completa

- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Visão geral
- [backend/README.md](backend/README.md) - Backend detalhado
- [backend/INSTALL.md](backend/INSTALL.md) - Instalação completa
- [backend/API_EXAMPLES.md](backend/API_EXAMPLES.md) - Exemplos de API
- [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md) - Arquitetura
- [backend/FRONTEND_INTEGRATION.md](backend/FRONTEND_INTEGRATION.md) - Integração

---

**Desenvolvido com ❤️ para Urban Passageiro**

# 🚀 Deploy no EasyPanel - Guia Completo Atualizado

## 📋 Pré-requisitos

- ✅ Conta no EasyPanel
- ✅ Repositório GitHub com o código
- ✅ Chave API do Google Gemini
- ✅ Domínio configurado (opcional, mas recomendado)

---

## 🗂️ PARTE 1: Preparar o Projeto

### 1. Verificar arquivos essenciais

Certifique-se de que você tem:
- ✅ `backend/Dockerfile` 
- ✅ `Dockerfile.frontend`
- ✅ `.gitignore` (para não enviar node_modules)

### 2. Fazer commit e push para o GitHub

```powershell
cd "C:\Users\Herbert\OneDrive\Desktop\Dash-Expansão"
git add .
git commit -m "deploy: preparar para EasyPanel"
git push origin main
```

---

## 🔧 PARTE 2: Deploy do Backend

### Passo 1: Criar Projeto no EasyPanel

1. Acesse seu EasyPanel
2. Clique em **"Create New Project"**
3. Nome do projeto: `dashboard-expansao`

### Passo 2: Adicionar PostgreSQL Database

1. Dentro do projeto, clique em **"+ Add Service"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `db-expansao`
   - **Database**: `dashboard_de_Expansao`
   - **Username**: `urbanexpansao`
   - **Password**: `urban2026`
   - **Version**: `16` (ou mais recente)
4. Clique em **"Create"**
5. ⚠️ **IMPORTANTE**: Anote a **URL de conexão interna** que aparece (algo como `postgresql://urbanexpansao:urban2026@db-expansao:5432/dashboard_de_Expansao`)

### Passo 3: Criar Aplicação Backend

1. No mesmo projeto, clique em **"+ Add Service"**
2. Selecione **"App"**
3. Escolha **"GitHub"** como source

#### Configurações Gerais:
- **Name**: `backend`
- **GitHub Repository**: Selecione seu repositório
- **Branch**: `main`

#### Build Settings:
- **Build Type**: `dockerfile`
- **Dockerfile Path**: `backend/Dockerfile`
- **Build Context**: `.` (raiz do repositório)

#### Deploy Settings:
- **Port**: `3001`
- **Health Check**: 
  - **Path**: `/api/health`
  - **Port**: `3001`
  - **Interval**: `30s`

#### Environment Variables:
Clique em **"Add Variable"** e adicione:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://urbanexpansao:urban2026@db-expansao:5432/dashboard_de_Expansao?sslmode=disable
CORS_ORIGIN=*
GEMINI_API_KEY=sua_chave_gemini_aqui
```

⚠️ **IMPORTANTE**: 
- Substitua `db-expansao` pelo nome exato do serviço de banco de dados
- Substitua `sua_chave_gemini_aqui` pela sua chave real

4. Clique em **"Create"**
5. Aguarde o build e deploy (2-5 minutos)

### Passo 4: Configurar Domínio do Backend

1. No serviço `backend`, vá em **"Domains"**
2. Clique em **"Add Domain"**
3. Configure:
   - **Domain**: `api.expansao.urban.com.br` (ou seu domínio)
   - **Port**: `3001`
   - **HTTPS**: Ativado (Let's Encrypt)
4. Clique em **"Add"**

### Passo 5: Popular o Banco de Dados

1. No serviço `backend`, clique em **"Console"** ou **"Terminal"**
2. Execute os comandos:

```bash
# Gerar Prisma Client
npx prisma generate

# Executar migrations
npx prisma migrate deploy

# Popular com dados do IBGE
npx tsx populate-only.ts

# Popular com dados internos
npx tsx populate-internal.ts

# Corrigir dados se necessário
npx tsx populate-fixed.ts
```

3. Aguarde cada comando terminar (pode levar alguns minutos)

### Passo 6: Testar o Backend

Abra no navegador ou use curl:
```bash
curl https://api.expansao.urban.com.br/api/health
curl https://api.expansao.urban.com.br/api/cities
```

✅ Deve retornar dados em JSON

---

## 🎨 PARTE 3: Deploy do Frontend

### Passo 1: Criar Aplicação Frontend

1. No mesmo projeto `dashboard-expansao`, clique em **"+ Add Service"**
2. Selecione **"App"**
3. Escolha **"GitHub"** como source

#### Configurações Gerais:
- **Name**: `frontend`
- **GitHub Repository**: Mesmo repositório
- **Branch**: `main`

#### Build Settings:
- **Build Type**: `dockerfile`
- **Dockerfile Path**: `Dockerfile.frontend`
- **Build Context**: `.` (raiz do repositório)

#### Deploy Settings:
- **Port**: `3000`

#### Environment Variables:
```env
VITE_API_URL=https://api.expansao.urban.com.br/api
```

⚠️ **IMPORTANTE**: Use a URL completa do backend com HTTPS

4. Clique em **"Create"**
5. Aguarde o build e deploy (3-7 minutos - Vite builds demoram mais)

### Passo 2: Configurar Domínio do Frontend

1. No serviço `frontend`, vá em **"Domains"**
2. Clique em **"Add Domain"**
3. Configure:
   - **Domain**: `expansao.urban.com.br` (ou seu domínio)
   - **Port**: `3000`
   - **HTTPS**: Ativado (Let's Encrypt)
4. Clique em **"Add"**

### Passo 3: Testar o Frontend

1. Acesse `https://expansao.urban.com.br` no navegador
2. Verifique:
   - ✅ Dashboard carrega
   - ✅ Dados das cidades aparecem
   - ✅ Gráficos funcionam
   - ✅ Navegação funciona

---

## 🔒 PARTE 4: Configurações de Segurança (Opcional)

### 1. Restringir CORS do Backend

No backend, atualize a variável de ambiente:
```env
CORS_ORIGIN=https://expansao.urban.com.br
```

### 2. Adicionar Secrets (Recomendado)

Para variáveis sensíveis como `GEMINI_API_KEY`:
1. Vá em **Project Settings** → **Secrets**
2. Adicione secrets e referencie no env como `${GEMINI_API_KEY}`

---

## 📊 PARTE 5: Monitoramento e Logs

### Ver Logs em Tempo Real

1. **Backend Logs**:
   - Vá em `backend` → **"Logs"**
   - Veja requisições, erros e status

2. **Frontend Logs**:
   - Vá em `frontend` → **"Logs"**
   - Veja builds e serving

### Métricas

1. Cada serviço mostra:
   - CPU Usage
   - Memory Usage
   - Network I/O
   - Request Count

---

## 🔄 PARTE 6: Atualizações Automáticas

### Configurar Auto Deploy

1. Em cada serviço (backend e frontend)
2. Vá em **"Settings"** → **"Build"**
3. Ative **"Auto Deploy on Push"**
4. Escolha a branch: `main`

Agora, sempre que você fizer `git push`, o EasyPanel vai automaticamente:
1. Detectar as mudanças
2. Fazer rebuild
3. Fazer redeploy

### Fazer Push de Atualizações

```powershell
cd "C:\Users\Herbert\OneDrive\Desktop\Dash-Expansão"

# Fazer suas alterações no código...

git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# EasyPanel vai rebuildar automaticamente!
```

---

## 🐛 Troubleshooting

### Backend não conecta ao banco

**Problema**: Erro de conexão com PostgreSQL

**Solução**:
1. Verifique se o serviço `db-expansao` está rodando
2. Confirme a `DATABASE_URL` no backend:
   ```
   postgresql://usuario:senha@NOME-DO-SERVICO:5432/nome_do_banco
   ```
3. Use o nome interno do serviço (não a URL externa)

### Frontend não carrega dados

**Problema**: Dashboard vazio ou erros de API

**Solução**:
1. Verifique a variável `VITE_API_URL` no frontend
2. Teste a API diretamente no navegador
3. Verifique CORS no backend
4. Veja os logs do frontend e backend

### Build falha

**Problema**: Erro durante build no EasyPanel

**Solução**:
1. Veja os logs de build
2. Verifique se o Dockerfile está correto
3. Teste o build localmente:
   ```powershell
   # Backend
   docker build -f backend/Dockerfile -t backend-test .
   
   # Frontend
   docker build -f Dockerfile.frontend -t frontend-test .
   ```

### SSL/HTTPS não funciona

**Problema**: Certificado SSL não gerado

**Solução**:
1. Aguarde 2-3 minutos após adicionar o domínio
2. Verifique se o DNS está apontando para o servidor EasyPanel
3. Use `nslookup seu-dominio.com` para verificar
4. Tente forçar renovação nas configurações de domínio

---

## ✅ Checklist Final

Antes de considerar concluído:

- [ ] Backend rodando e respondendo em `/api/health`
- [ ] Banco de dados populado (142 cidades)
- [ ] Frontend carregando e mostrando dados
- [ ] HTTPS funcionando (cadeado verde)
- [ ] CORS configurado corretamente
- [ ] Auto-deploy ativado
- [ ] Logs limpos (sem erros críticos)
- [ ] Todos os serviços com status "Running" ✅

---

## 📞 URLs Finais

Após completar tudo:

- **Frontend**: https://expansao.urban.com.br
- **Backend API**: https://api.expansao.urban.com.br/api
- **Health Check**: https://api.expansao.urban.com.br/api/health
- **Cidades**: https://api.expansao.urban.com.br/api/cities

---

## 💡 Dicas Profissionais

1. **Use Staging**: Crie um projeto separado para testes
2. **Backup do Banco**: Configure backups automáticos no PostgreSQL
3. **Monitoring**: Configure alertas para quando os serviços caírem
4. **Environment per Branch**: Use branches diferentes para dev/staging/prod
5. **Secrets Management**: Nunca commite chaves de API no código

---

## 🎉 Pronto!

Seu dashboard agora está no ar! 🚀

Acesse: **https://expansao.urban.com.br**

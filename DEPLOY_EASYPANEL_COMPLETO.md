# 🚀 Deploy Completo no Easy Panel - Passo a Passo

## 📋 Informações Necessárias

- **URL Easy Panel**: http://148.230.73.27:3000
- **Email**: urbansuportemt@gmail.com
- **Senha**: HHimense.95
- **Repositório GitHub**: https://github.com/daaty/dashexpasao

---

## 🔧 PARTE 1: Deploy do Backend (API)

### Passo 1: Acessar Easy Panel
1. Abra o navegador e acesse: http://148.230.73.27:3000
2. Faça login com:
   - Email: `urbansuportemt@gmail.com`
   - Senha: `HHimense.95`

### Passo 2: Criar Nova Aplicação para o Backend
1. No painel, clique em **"Projects"** (se não estiver já)
2. Clique no botão **"+ New"** ou **"Create App"**
3. Escolha o tipo: **"App"** → **"From GitHub"** (ou similar)

### Passo 3: Conectar o Repositório GitHub
1. Se for a primeira vez, conecte sua conta do GitHub
2. Selecione o repositório: **`daaty/dashexpasao`**
3. Escolha a branch: **`main`**

### Passo 4: Configurar o Backend
Preencha os campos:

**Nome/Name:**
```
dashboard-backend
```

**Source Directory / Root Directory:**
```
backend
```
⚠️ **IMPORTANTE**: Este campo define que o Easy Panel deve usar apenas a pasta `backend/` do repositório

**Build Command:**
```
npm ci && npm run build
```

**Start Command:**
```
npm start
```

**Port / Porta:**
```
3001
```

### Passo 5: Adicionar Variáveis de Ambiente
Na seção de **Environment Variables** ou **Variables**, adicione:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://urbanexpansao:urban2026@dashboard_de_expansao_db-expansao:5432/dashboard_de_Expansao?sslmode=disable
CORS_ORIGIN=http://148.230.73.27:3000,http://148.230.73.27:5173
GEMINI_API_KEY=SUA_CHAVE_GEMINI_AQUI
```

⚠️ **Atenção**: Substitua `SUA_CHAVE_GEMINI_AQUI` pela sua chave real da API do Google Gemini

### Passo 6: Fazer Deploy do Backend
1. Clique em **"Deploy"** ou **"Create"**
2. Aguarde o build terminar (pode levar 2-5 minutos)
3. Verifique os logs para garantir que não há erros

### Passo 7: Configurar o Banco de Dados
Após o deploy do backend estar completo:

1. No Easy Panel, vá até a aplicação `dashboard-backend`
2. Procure por **"Terminal"**, **"Console"** ou **"Shell"** (geralmente um ícone de terminal)
3. Abra o terminal e execute:

```bash
npx tsx scripts/setup-database.ts
```

4. Aguarde a execução (vai aparecer):
   - ✅ Migração executada
   - ✅ 142 municípios encontrados
   - ✅ População concluída

### Passo 8: Testar o Backend
1. No Easy Panel, veja qual é a **URL pública** da aplicação (algo como `dashboard-backend.algo.easypanel.host`)
2. Teste no navegador:
```
https://SUA-URL-BACKEND/api/cities
```

Deve retornar um JSON com as cidades.

---

## 🎨 PARTE 2: Deploy do Frontend (React)

### Passo 1: Criar Nova Aplicação para o Frontend
1. No Easy Panel, clique novamente em **"+ New"** ou **"Create App"**
2. Escolha **"App"** → **"From GitHub"**

### Passo 2: Conectar o Mesmo Repositório
1. Selecione o repositório: **`daaty/dashexpasao`**
2. Escolha a branch: **`main`**

### Passo 3: Configurar o Frontend
Preencha os campos:

**Nome/Name:**
```
dashboard-frontend
```

**Source Directory / Root Directory:**
```
/
```
⚠️ **IMPORTANTE**: Deixe vazio ou use `/` pois o frontend está na raiz do repositório

**Build Command:**
```
npm ci && npm run build
```

**Start Command:**
```
npm run preview
```
OU (dependendo da configuração do Easy Panel para apps estáticos):
```
npx serve -s dist -p 3000
```

**Port / Porta:**
```
3000
```

### Passo 4: Adicionar Variáveis de Ambiente do Frontend
Na seção de **Environment Variables**, adicione:

```env
VITE_API_URL=https://SUA-URL-BACKEND
```

⚠️ **Atenção**: Substitua `SUA-URL-BACKEND` pela URL pública do backend que você obteve no Passo 8 da Parte 1

### Passo 5: Verificar arquivo de configuração da API

Antes do deploy, você precisa garantir que o frontend usa a variável de ambiente. 

**O arquivo já está configurado?** Verifique `services/api.ts`:
- Deve usar `import.meta.env.VITE_API_URL` ou similar
- Se não estiver, precisa ajustar antes do deploy

### Passo 6: Fazer Deploy do Frontend
1. Clique em **"Deploy"** ou **"Create"**
2. Aguarde o build terminar (pode levar 2-5 minutos)
3. Verifique os logs

### Passo 7: Testar o Frontend
1. No Easy Panel, veja a **URL pública** do frontend
2. Acesse no navegador
3. Teste se:
   - ✅ A página carrega
   - ✅ Os dados das cidades aparecem
   - ✅ Os filtros funcionam

---

## 🔄 Atualizações Futuras

Sempre que você fizer alterações no código:

### Para Backend:
```bash
cd "C:\Users\Herbert\OneDrive\Desktop\Dash-Expansão"
git add .
git commit -m "feat: sua alteração"
git push origin main
```

O Easy Panel vai rebuildar automaticamente (se configurado para auto-deploy).

### Para Frontend:
Mesmo processo de push. O Easy Panel rebuildará ambos automaticamente.

---

## 🐛 Troubleshooting

### Backend não conecta ao PostgreSQL
- ✅ Verifique se `DATABASE_URL` está correta
- ✅ Certifique-se de usar o host **interno**: `dashboard_de_expansao_db-expansao`

### Frontend não carrega dados
- ✅ Verifique se `VITE_API_URL` aponta para a URL correta do backend
- ✅ Verifique CORS no backend (variável `CORS_ORIGIN`)

### Build falha
- ✅ Verifique os logs no Easy Panel
- ✅ Teste localmente: `npm run build` na pasta correspondente

### Script setup-database.ts não roda
- ✅ Certifique-se de estar no terminal do **backend** no Easy Panel
- ✅ Verifique se todas as dependências foram instaladas

---

## 📝 Resumo dos Comandos Importantes

**No Terminal do Backend (Easy Panel):**
```bash
# Setup completo do banco (migração + população)
npx tsx scripts/setup-database.ts

# Ou separadamente:
npx tsx scripts/run-migration.ts          # Apenas migração
npx tsx scripts/populate-ibge-data.ts     # Apenas população
```

**Local (sua máquina):**
```bash
# Atualizar código
git add .
git commit -m "sua mensagem"
git push origin main
```

---

## ✅ Checklist Final

### Backend:
- [ ] Aplicação criada no Easy Panel
- [ ] Repositório conectado
- [ ] Source Directory = `backend`
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Script `setup-database.ts` executado
- [ ] Endpoint `/api/cities` retorna dados

### Frontend:
- [ ] Aplicação criada no Easy Panel
- [ ] Repositório conectado
- [ ] Source Directory = `/` (raiz)
- [ ] `VITE_API_URL` configurada
- [ ] Deploy realizado com sucesso
- [ ] Interface carrega corretamente
- [ ] Dados aparecem na tela

---

## 🎉 Pronto!

Seu dashboard está online e funcionando!

**URLs finais:**
- Backend: `https://sua-url-backend.easypanel.host`
- Frontend: `https://sua-url-frontend.easypanel.host`

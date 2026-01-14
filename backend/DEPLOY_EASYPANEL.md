# Deploy no Easy Panel

## 📋 Informações de Acesso

- **URL**: http://148.230.73.27:3000/projects
- **Email**: urbansuportemt@gmail.com
- **Senha**: HHimense.95

## 🚀 Passos para Deploy

### 1. Acessar Easy Panel
1. Acesse http://148.230.73.27:3000/projects
2. Faça login com as credenciais acima
3. Vá para a seção de projetos

### 2. Criar Nova Aplicação
1. Clique em "New App" ou "Create Application"
2. Escolha **"Node.js"** como tipo de aplicação
3. Configure:
   - **Name**: `dashboard-expansao-backend`
   - **Port**: `3001`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### 3. Configurar Variáveis de Ambiente
Adicione as seguintes variáveis de ambiente:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://urbanexpansao:urban2026@dashboard_de_expansao_db-expansao:5432/dashboard_de_Expansao?sslmode=disable
CORS_ORIGIN=http://148.230.73.27:3000,http://localhost:3000,http://localhost:5173
GEMINI_API_KEY=(sua chave Gemini)
```

### 4. Conectar ao GitHub (Recomendado)
Se seu código estiver no GitHub:
1. Conecte o repositório
2. Configure a branch principal (main/master)
3. Habilite deploy automático

### 5. Deploy Manual (Alternativa)
Se preferir upload manual:
1. Faça zip do diretório `backend/`
2. Exclua `node_modules/`, `dist/`, `.env`, `dev.db`
3. Faça upload no Easy Panel

### 6. Executar Migração e População

Após o deploy, acesse o terminal do container no Easy Panel e execute:

```bash
# Configurar banco de dados completo (migração + população)
npx tsx scripts/setup-database.ts
```

Ou execute separadamente:

```bash
# Apenas migração
npx tsx scripts/run-migration.ts

# Apenas população
npx tsx scripts/populate-ibge-data.ts
```

### 7. Verificar Funcionamento

Teste a API:
```bash
curl http://148.230.73.27:3001/api/cities
```

## 🔧 Troubleshooting

### Erro de conexão com PostgreSQL
- Verifique se o nome do serviço está correto: `dashboard_de_expansao_db-expansao`
- Confirme que backend e banco estão na mesma rede Docker

### Erro no build
- Verifique os logs do Easy Panel
- Certifique-se de que todas as dependências estão no `package.json`

### CORS Error
- Adicione o domínio do frontend na variável `CORS_ORIGIN`
- Reinicie a aplicação após alterar variáveis de ambiente

## 📦 Arquivos Importantes

- `Dockerfile` - Configuração do container
- `.dockerignore` - Arquivos excluídos do build
- `migration.sql` - Schema PostgreSQL
- `scripts/setup-database.ts` - Migração + População completa
- `scripts/run-migration.ts` - Apenas migração
- `scripts/populate-ibge-data.ts` - Apenas população IBGE

## 🔄 Atualizar Aplicação

1. Faça push das alterações para o GitHub (se conectado)
2. Ou faça novo upload manual
3. Easy Panel rebuilda automaticamente
4. A aplicação reinicia com as novas alterações

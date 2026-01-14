# Urban Expansão Backend - Guia de Instalação

## 📦 Instalação Rápida

### 1. Instalar Dependências
```powershell
cd backend
npm install
```

### 2. Configurar Banco de Dados PostgreSQL

#### Opção A: Usando Docker (Recomendado)
```powershell
docker run --name urban-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=urban_expansao -p 5432:5432 -d postgres:15-alpine
```

#### Opção B: PostgreSQL Local
Certifique-se de ter PostgreSQL instalado e crie o banco:
```sql
CREATE DATABASE urban_expansao;
```

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env` e adicione sua chave do Gemini:
```env
GEMINI_API_KEY=sua_chave_aqui
```

Para obter a chave: https://aistudio.google.com/app/apikey

### 4. Executar Migrações
```powershell
npm run prisma:migrate
```

### 5. Popular Banco (Opcional)
```powershell
npm run prisma:seed
```

### 6. Iniciar Servidor
```powershell
npm run dev
```

## ✅ Verificação

Acesse: http://localhost:3001

Você deve ver:
```json
{
  "message": "Urban Expansão API",
  "version": "1.0.0",
  "status": "running"
}
```

## 🧪 Testar Endpoints

### Health Check
```powershell
curl http://localhost:3001/api/health
```

### Listar Cidades
```powershell
curl http://localhost:3001/api/cities
```

### Consultar IA
```powershell
curl -X POST http://localhost:3001/api/ai/chat -H "Content-Type: application/json" -d "{\"prompt\": \"Quais as melhores cidades para expansão?\"}"
```

## 🐛 Troubleshooting

### Erro de conexão com banco
- Verifique se PostgreSQL está rodando
- Confirme o `DATABASE_URL` no arquivo `.env`
- Teste: `npm run prisma:studio`

### Erro com Gemini API
- Verifique se `GEMINI_API_KEY` está configurado
- Confirme que a chave é válida

### Porta já em uso
- Mude `PORT=3001` para outra porta no `.env`

## 📚 Próximos Passos

1. Conectar o frontend à API
2. Adicionar autenticação (se necessário)
3. Configurar deploy em produção

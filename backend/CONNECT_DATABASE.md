# 🔌 Conectar ao PostgreSQL Existente

## Situação Atual

Você tem um PostgreSQL rodando com estas credenciais:
- **Usuário:** urbanexpansao
- **Senha:** urban2026
- **Banco:** dashboard_de_Expansao
- **Host:** dashboard_de_expansao_db-expansao
- **Porta:** 5432

## ⚠️ Problema

O host `dashboard_de_expansao_db-expansao` é um nome de container Docker interno. Para conectar do seu backend Node.js, você precisa:

---

## ✅ Soluções

### **Opção 1: Encontrar a Porta Mapeada (Recomendado)**

Se o PostgreSQL está rodando em Docker, ele deve ter uma porta mapeada para o host.

#### 1. Verificar o container:
```powershell
# Se Docker Desktop está instalado
docker ps

# Procure por uma linha com postgres
# Exemplo: 0.0.0.0:5433->5432/tcp
```

#### 2. Atualizar o `.env`:
```env
# Se a porta mapeada é 5433:
DATABASE_URL="postgresql://urbanexpansao:urban2026@localhost:5433/dashboard_de_Expansao?schema=public"
```

---

### **Opção 2: Conectar via Docker Network**

Se o backend também rodar em Docker:

#### 1. Atualizar `docker-compose.yml`:
```yaml
services:
  backend:
    # ... outras configs
    networks:
      - expansao-network
    environment:
      DATABASE_URL: "postgresql://urbanexpansao:urban2026@dashboard_de_expansao_db-expansao:5432/dashboard_de_Expansao?schema=public"

networks:
  expansao-network:
    external: true  # Se a rede já existe
```

---

### **Opção 3: Usar PostgreSQL Local**

Se preferir criar um novo PostgreSQL:

#### 1. Iniciar PostgreSQL com Docker:
```powershell
docker run -d `
  --name urban-postgres `
  -e POSTGRES_USER=urbanexpansao `
  -e POSTGRES_PASSWORD=urban2026 `
  -e POSTGRES_DB=dashboard_de_Expansao `
  -p 5432:5432 `
  postgres:15-alpine
```

#### 2. `.env` já está configurado:
```env
DATABASE_URL="postgresql://urbanexpansao:urban2026@localhost:5432/dashboard_de_Expansao?schema=public"
```

---

### **Opção 4: Descobrir o IP do Container**

#### 1. Listar containers:
```powershell
docker ps
# Copie o CONTAINER ID ou NAME
```

#### 2. Inspecionar o container:
```powershell
docker inspect <container_id_ou_name> | Select-String "IPAddress"
```

#### 3. Usar o IP no `.env`:
```env
DATABASE_URL="postgresql://urbanexpansao:urban2026@172.17.0.2:5432/dashboard_de_Expansao?schema=public"
```

---

## 🧪 Testar Conexão

Depois de configurar, teste:

```powershell
cd backend
npx prisma db pull
```

Se funcionar, você verá: "Introspected X models..."

---

## 🚀 Executar Migrações

Quando a conexão estiver funcionando:

```powershell
# Gerar Prisma Client
npx prisma generate

# Criar migração inicial
npx prisma migrate dev --name init

# Popular banco
npm run prisma:seed

# Iniciar backend
npm run dev
```

---

## 📊 Verificar Banco

Abrir Prisma Studio para visualizar os dados:

```powershell
npx prisma studio
```

Abre em: http://localhost:5555

---

## ❓ Onde Está Meu PostgreSQL?

### Procurar no Docker Desktop:
1. Abra Docker Desktop
2. Vá em "Containers"
3. Procure por "postgres" ou "expansao"
4. Veja a porta mapeada (ex: 5432:5432 ou 5433:5432)

### Procurar no Terminal:
```powershell
# Listar todos os containers (incluindo parados)
docker ps -a | Select-String postgres

# Ver logs de um container
docker logs <container_name>
```

---

## 🆘 Ainda com Problema?

**Me informe:**
1. Resultado de `docker ps`
2. Como você iniciou o PostgreSQL?
3. Está usando Docker Desktop, WSL2, ou outro?

**Ou vamos:**
- Criar um novo PostgreSQL limpo
- Configurar tudo do zero
- Garantir que funcione 100%

---

## ✨ Quick Fix

Se quiser começar do zero com PostgreSQL novo:

```powershell
# 1. Parar qualquer postgres antigo (se houver)
docker stop urban-postgres 2>$null
docker rm urban-postgres 2>$null

# 2. Criar novo
docker run -d `
  --name urban-postgres `
  -e POSTGRES_USER=urbanexpansao `
  -e POSTGRES_PASSWORD=urban2026 `
  -e POSTGRES_DB=dashboard_de_Expansao `
  -p 5432:5432 `
  postgres:15-alpine

# 3. Aguardar 5 segundos
Start-Sleep -Seconds 5

# 4. Testar
cd backend
npx prisma migrate dev --name init
```

---

**Próximo passo:** Me diga qual opção prefere ou mostre o resultado de `docker ps`!

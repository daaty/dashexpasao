# ✅ Configuração Easy Panel - COMPLETA

## 🎉 Backend - CONFIGURADO E FUNCIONANDO

### Domínio
- **URL**: `http://api.expansao.urban.com.br`
- **Porta**: 3001
- **HTTPS**: Desabilitado (HTTP apenas)

### Status
✅ Backend respondendo corretamente
✅ Health check: `{"success":true,"message":"API is running"}`
✅ 133 cidades no banco de dados
✅ PostgreSQL funcionando

### Teste do Backend
```bash
curl http://api.expansao.urban.com.br/api/health
curl http://api.expansao.urban.com.br/api/cities
```

---

## 🔄 Frontend - PRECISA CONFIGURAR

### 1. Adicionar Variável de Ambiente

No Easy Panel, **Frontend → Environment**:

```
VITE_API_URL=http://api.expansao.urban.com.br/api
```

### 2. Configurar Domínio

**Frontend → Domains**:
- **Host**: `expansao.urban.com.br`
- **HTTPS**: Desabilitado (HTTP apenas por enquanto)
- **Porta**: 80

### 3. Implantar (Deploy)

Após adicionar a variável de ambiente, clique em **"Implantar"** (Deploy) para reconstruir o frontend com a nova configuração.

---

## 🧪 Como Testar

### 1. Aguardar DNS (15-30 minutos)

Verifique se o DNS está propagado:

```bash
nslookup expansao.urban.com.br 1.1.1.1
nslookup api.expansao.urban.com.br 1.1.1.1
```

Ambos devem retornar: `Address: 148.230.73.27`

### 2. Testar Backend

```bash
curl http://api.expansao.urban.com.br/api/health
```

Esperado:
```json
{"success":true,"message":"API is running","timestamp":"..."}
```

### 3. Testar Frontend

Abrir no navegador:
```
http://expansao.urban.com.br
```

Deve carregar o dashboard com as cidades da API.

---

## 🔐 Configurações Opcionais

### Habilitar HTTPS (Recomendado)

Depois que o DNS propagar:

1. **Backend → Domain → Editar**:
   - Ativar **HTTPS**
   - Selecionar **Let's Encrypt**

2. **Frontend → Domain → Editar**:
   - Ativar **HTTPS**
   - Selecionar **Let's Encrypt**

3. **Atualizar variável de ambiente do frontend**:
   ```
   VITE_API_URL=https://api.expansao.urban.com.br/api
   ```

4. **Reimplantar frontend**

### Habilitar Proxy Cloudflare (Recomendado)

No Cloudflare DNS:
1. Mudar de **DNS Only** ☁️ para **Proxied** ☁️🔥
2. Isso adiciona:
   - DDoS protection
   - CDN global
   - Cache automático
   - SSL/TLS automático

---

## 📊 Status Atual

| Componente | Status | URL |
|------------|--------|-----|
| Backend | ✅ Funcionando | http://api.expansao.urban.com.br |
| Frontend | ⚠️ Requer config env | http://expansao.urban.com.br |
| PostgreSQL | ✅ 133 cidades | dashboard_de_Expansao |
| DNS | ⏳ Propagando | Cloudflare |

---

## 🚀 Próximos Passos

1. ⏳ Aguardar DNS propagar (15-30 min)
2. ✅ Adicionar `VITE_API_URL` no frontend
3. ✅ Configurar domínio do frontend
4. ✅ Reimplantar frontend
5. ✅ Testar aplicação completa
6. 🔐 Habilitar HTTPS (opcional)
7. ☁️ Habilitar Cloudflare proxy (opcional)

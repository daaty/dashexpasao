# API Usage Examples - Urban Expansão Backend

## 📖 Exemplos de Uso da API

### Base URL
```
http://localhost:3001/api
```

---

## 🏙️ Cities (Cidades)

### 1. Listar Todas as Cidades
```http
GET /api/cities
```

**Query Parameters:**
- `page` (number): Número da página (default: 1)
- `limit` (number): Items por página (default: 20, max: 100)
- `status` (string): Filtrar por status (CONSOLIDATED, EXPANSION, NOT_SERVED, PLANNING)
- `mesorregion` (string): Filtrar por mesorregião
- `minPopulation` (number): População mínima

**Exemplo:**
```bash
curl "http://localhost:3001/api/cities?page=1&limit=10&status=NOT_SERVED"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5103403,
      "name": "Cuiabá",
      "population": 650912,
      "status": "NOT_SERVED",
      "averageIncome": 3500,
      "mesorregion": "CENTRO_SUL"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### 2. Buscar Cidade por ID
```http
GET /api/cities/:id
```

**Exemplo:**
```bash
curl "http://localhost:3001/api/cities/5103403"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5103403,
    "name": "Cuiabá",
    "population": 650912,
    "population15to44": 273383,
    "averageIncome": 3500,
    "urbanizationIndex": 0.98,
    "status": "NOT_SERVED",
    "mesorregion": "CENTRO_SUL",
    "gentilic": "cuiabano",
    "anniversary": "8 de abril",
    "mayor": "Abilio Jacques Brunini Moumer",
    "plannings": []
  }
}
```

### 3. Cidades por Viabilidade
```http
GET /api/cities/viability
```

**Query Parameters:**
- `limit` (number): Número de cidades (default: 20)

**Exemplo:**
```bash
curl "http://localhost:3001/api/cities/viability?limit=5"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5103403,
      "name": "Cuiabá",
      "viabilityScore": 8.7,
      "population": 650912,
      "status": "NOT_SERVED"
    }
  ]
}
```

### 4. Criar/Atualizar Cidade
```http
POST /api/cities
```

**Body:**
```json
{
  "id": 5103403,
  "name": "Cuiabá",
  "population": 650912,
  "population15to44": 273383,
  "averageIncome": 3500,
  "urbanizationIndex": 0.98,
  "status": "NOT_SERVED",
  "mesorregion": "CENTRO_SUL",
  "gentilic": "cuiabano",
  "anniversary": "8 de abril",
  "mayor": "Abilio Jacques Brunini Moumer",
  "monthlyRevenue": 215000,
  "averageFormalSalary": 3960,
  "formalJobs": 236759,
  "urbanizedAreaKm2": 155
}
```

**Exemplo:**
```bash
curl -X POST "http://localhost:3001/api/cities" \
  -H "Content-Type: application/json" \
  -d @city.json
```

### 5. Atualizar Dados do IBGE
```http
PUT /api/cities/:id/update-ibge
```

**Exemplo:**
```bash
curl -X PUT "http://localhost:3001/api/cities/5103403/update-ibge"
```

**Response:**
```json
{
  "success": true,
  "message": "Dados atualizados com sucesso do IBGE",
  "data": {
    "id": 5103403,
    "name": "Cuiabá",
    "population": 652000,
    "updatedAt": "2024-01-14T10:30:00Z"
  }
}
```

---

## 🤖 AI (Inteligência Artificial)

### 1. Chat com IA
```http
POST /api/ai/chat
```

**Body:**
```json
{
  "prompt": "Quais são as 3 melhores cidades para expansão em Mato Grosso?"
}
```

**Exemplo:**
```bash
curl -X POST "http://localhost:3001/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Quais as melhores cidades para expansão?"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Com base nos dados disponíveis, as 3 melhores cidades para expansão são:\n\n1. **Cuiabá** (Pop: 650.912)\n   - Alta renda média (R$ 3.500)\n   - Urbanização de 98%\n   - Grande mercado potencial\n\n2. **Rondonópolis** (Pop: 244.897)\n   - Economia forte\n   - Centro regional importante\n   - Boa infraestrutura\n\n3. **Sinop** (Pop: 196.067)\n   - Crescimento acelerado\n   - Alta renda per capita (R$ 4.100)\n   - Mercado em expansão"
  }
}
```

### 2. Análise de Viabilidade
```http
GET /api/ai/analysis/:id
```

**Exemplo:**
```bash
curl "http://localhost:3001/api/ai/analysis/5103403"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": "## Análise de Viabilidade - Cuiabá, MT\n\n**Potencial de Mercado: 9.2/10**\n\n### Principais Oportunidades:\n- Capital do estado com alto poder aquisitivo\n- Grande população economicamente ativa (273.383 pessoas entre 15-44 anos)\n- Índice de urbanização muito alto (98%)\n- Mais de 236 mil empregos formais\n\n### Desafios:\n- Concorrência já estabelecida no mercado\n- Necessidade de forte investimento inicial\n- Regulamentação municipal específica\n\n### Recomendação Estratégica:\n**Altamente recomendada para expansão imediata**\n\n### Investimento Estimado:\nR$ 800.000 - R$ 1.200.000 para implementação completa"
  }
}
```

---

## 📋 Planning (Planejamentos)

### 1. Listar Planejamentos
```http
GET /api/plannings
```

**Query Parameters:**
- `cityId` (number): Filtrar por cidade
- `status` (string): Filtrar por status (active, completed, cancelled)

**Exemplo:**
```bash
curl "http://localhost:3001/api/plannings?cityId=5103403"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "cityId": 5103403,
      "title": "Expansão em Cuiabá - Fase 1",
      "description": "Planejamento inicial...",
      "startDate": "2024-01-01T00:00:00Z",
      "status": "active",
      "priority": "high",
      "progressPercentage": 25,
      "city": {
        "id": 5103403,
        "name": "Cuiabá"
      },
      "tasks": []
    }
  ]
}
```

### 2. Buscar Planejamento
```http
GET /api/plannings/:id
```

**Exemplo:**
```bash
curl "http://localhost:3001/api/plannings/uuid-123"
```

### 3. Criar Planejamento
```http
POST /api/plannings
```

**Body:**
```json
{
  "cityId": 5103403,
  "title": "Expansão em Cuiabá - Fase 1",
  "description": "Planejamento inicial para implementação do serviço em Cuiabá",
  "startDate": "2024-01-01",
  "endDate": "2024-06-30",
  "status": "active",
  "priority": "high",
  "tags": ["expansão", "capital", "fase1"],
  "estimatedBudget": 500000,
  "tasks": [
    {
      "title": "Análise de mercado",
      "description": "Realizar análise detalhada do mercado local",
      "dueDate": "2024-02-01"
    },
    {
      "title": "Reunião com prefeitura",
      "dueDate": "2024-02-15"
    }
  ]
}
```

**Exemplo:**
```bash
curl -X POST "http://localhost:3001/api/plannings" \
  -H "Content-Type: application/json" \
  -d @planning.json
```

**Response:**
```json
{
  "success": true,
  "message": "Planejamento criado com sucesso",
  "data": {
    "id": "uuid-456",
    "cityId": 5103403,
    "title": "Expansão em Cuiabá - Fase 1",
    "progressPercentage": 0,
    "tasks": [
      {
        "id": "task-uuid-1",
        "title": "Análise de mercado",
        "completed": false
      }
    ]
  }
}
```

### 4. Atualizar Planejamento
```http
PUT /api/plannings/:id
```

**Body:**
```json
{
  "status": "completed",
  "actualBudget": 480000,
  "progressPercentage": 100
}
```

**Exemplo:**
```bash
curl -X PUT "http://localhost:3001/api/plannings/uuid-123" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### 5. Deletar Planejamento
```http
DELETE /api/plannings/:id
```

**Exemplo:**
```bash
curl -X DELETE "http://localhost:3001/api/plannings/uuid-123"
```

---

## ✅ Tasks (Tarefas)

### 1. Adicionar Tarefa
```http
POST /api/plannings/:id/tasks
```

**Body:**
```json
{
  "title": "Contratar equipe operacional",
  "description": "Contratar motoristas e atendentes",
  "dueDate": "2024-03-01"
}
```

**Exemplo:**
```bash
curl -X POST "http://localhost:3001/api/plannings/uuid-123/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title": "Contratar equipe", "dueDate": "2024-03-01"}'
```

### 2. Atualizar Tarefa
```http
PUT /api/plannings/tasks/:taskId
```

**Body:**
```json
{
  "completed": true
}
```

**Exemplo:**
```bash
curl -X PUT "http://localhost:3001/api/plannings/tasks/task-uuid-1" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### 3. Deletar Tarefa
```http
DELETE /api/plannings/tasks/:taskId
```

**Exemplo:**
```bash
curl -X DELETE "http://localhost:3001/api/plannings/tasks/task-uuid-1"
```

---

## 🏥 Health & Status

### Health Check
```http
GET /api/health
```

**Exemplo:**
```bash
curl "http://localhost:3001/api/health"
```

**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-14T10:00:00.000Z"
}
```

### API Info
```http
GET /
```

**Exemplo:**
```bash
curl "http://localhost:3001"
```

**Response:**
```json
{
  "message": "Urban Expansão API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "health": "/api/health",
    "cities": "/api/cities",
    "ai": "/api/ai",
    "plannings": "/api/plannings"
  }
}
```

---

## ❌ Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validação falhou",
  "message": "[{\"field\":\"population\",\"message\":\"population is required\"}]"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Cidade não encontrada"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Erro interno do servidor"
}
```

### Rate Limit (429)
```json
{
  "success": false,
  "error": "Muitas requisições deste IP, tente novamente mais tarde."
}
```

---

## 🧪 Testing com Postman

Importe a collection Postman:

```json
{
  "info": {
    "name": "Urban Expansão API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Cities",
      "item": [
        {
          "name": "Get All Cities",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/cities"
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001"
    }
  ]
}
```

---

## 📊 PowerShell Examples

### Listar cidades
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/cities" -Method Get
```

### Criar planejamento
```powershell
$body = @{
    cityId = 5103403
    title = "Expansão Teste"
    description = "Teste de planejamento"
    startDate = "2024-01-01"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/plannings" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### Consultar IA
```powershell
$body = @{
    prompt = "Qual a melhor cidade para expansão?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/ai/chat" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

# 🚀 API de Passageiros - Dashboard de Expansão

## Visão Geral
A API de Passageiros permite gerenciar e consultar dados de passageiros por cidade, incluindo estatísticas de retenção, recompra e churn.

---

## 📋 Endpoints

### 1. **GET /api/passengers**
Busca todos os passageiros cadastrados.

**Exemplo de Requisição:**
```bash
curl http://localhost:3001/api/passengers
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "cityName": "Cuiabá",
      "totalPassengers": 45000,
      "dailyAverage": 1500,
      "peakHourPassengers": 3200,
      "offPeakPassengers": 1100,
      "retentionRate": 0.82,
      "repurchaseRate": 0.76,
      "churnRate": 0.18,
      "createdAt": "2026-01-23T22:31:27.427Z",
      "updatedAt": "2026-01-23T22:31:27.427Z"
    }
  ],
  "message": "10 registros de passageiros encontrados"
}
```

---

### 2. **GET /api/passengers/:cityName**
Busca dados de passageiros de uma cidade específica.

**Parâmetros:**
- `cityName` (string, obrigatório): Nome da cidade

**Exemplo de Requisição:**
```bash
curl http://localhost:3001/api/passengers/Cuiabá
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "cityName": "Cuiabá",
    "totalPassengers": 45000,
    "dailyAverage": 1500,
    "peakHourPassengers": 3200,
    "offPeakPassengers": 1100,
    "retentionRate": 0.82,
    "repurchaseRate": 0.76,
    "churnRate": 0.18,
    "createdAt": "2026-01-23T22:31:27.427Z",
    "updatedAt": "2026-01-23T22:31:27.427Z"
  }
}
```

---

### 3. **POST /api/passengers/batch**
Busca dados de passageiros de múltiplas cidades.

**Corpo da Requisição:**
```json
{
  "cityNames": ["Cuiabá", "Várzea Grande", "Rondonópolis"]
}
```

**Exemplo de Requisição:**
```bash
curl -X POST http://localhost:3001/api/passengers/batch \
  -H "Content-Type: application/json" \
  -d '{"cityNames": ["Cuiabá", "Várzea Grande"]}'
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": [
    { /* Cuiabá data */ },
    { /* Várzea Grande data */ }
  ],
  "message": "Dados de 2 cidades encontrados"
}
```

---

### 4. **GET /api/passengers/stats**
Busca estatísticas agregadas de passageiros.

**Exemplo de Requisição:**
```bash
curl http://localhost:3001/api/passengers/stats
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "_sum": {
      "totalPassengers": 204000,
      "peakHourPassengers": 14550,
      "offPeakPassengers": 4430
    },
    "_avg": {
      "dailyAverage": 728.5,
      "retentionRate": 0.77,
      "repurchaseRate": 0.688,
      "churnRate": 0.23
    },
    "_count": 10
  }
}
```

---

### 5. **GET /api/passengers/top/:limit**
Busca as top N cidades por número de passageiros.

**Parâmetros:**
- `limit` (number, obrigatório): Número de cidades (máximo 100)

**Exemplo de Requisição:**
```bash
curl http://localhost:3001/api/passengers/top/5
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "cityName": "Cuiabá",
      "totalPassengers": 45000,
      "dailyAverage": 1500,
      "retentionRate": 0.82,
      "repurchaseRate": 0.76
    },
    {
      "cityName": "Várzea Grande",
      "totalPassengers": 32000,
      "dailyAverage": 1100,
      "retentionRate": 0.78,
      "repurchaseRate": 0.71
    }
  ],
  "message": "Top 5 cidades por passageiros"
}
```

---

### 6. **POST /api/passengers**
Cria ou atualiza um registro de passageiros.

**Corpo da Requisição:**
```json
{
  "cityName": "Novo Rio",
  "totalPassengers": 5000,
  "dailyAverage": 180,
  "peakHourPassengers": 450,
  "offPeakPassengers": 130,
  "retentionRate": 0.75,
  "repurchaseRate": 0.68,
  "churnRate": 0.25
}
```

**Exemplo de Requisição:**
```bash
curl -X POST http://localhost:3001/api/passengers \
  -H "Content-Type: application/json" \
  -d '{
    "cityName": "Novo Rio",
    "totalPassengers": 5000,
    "dailyAverage": 180,
    "peakHourPassengers": 450,
    "offPeakPassengers": 130,
    "retentionRate": 0.75,
    "repurchaseRate": 0.68,
    "churnRate": 0.25
  }'
```

**Resposta (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-456",
    "cityName": "Novo Rio",
    "totalPassengers": 5000,
    "dailyAverage": 180,
    "peakHourPassengers": 450,
    "offPeakPassengers": 130,
    "retentionRate": 0.75,
    "repurchaseRate": 0.68,
    "churnRate": 0.25,
    "createdAt": "2026-01-23T22:35:00.000Z",
    "updatedAt": "2026-01-23T22:35:00.000Z"
  },
  "message": "Passageiro de Novo Rio salvo com sucesso"
}
```

---

### 7. **DELETE /api/passengers/:cityName**
Deleta um registro de passageiros.

**Parâmetros:**
- `cityName` (string, obrigatório): Nome da cidade

**Exemplo de Requisição:**
```bash
curl -X DELETE http://localhost:3001/api/passengers/Novo%20Rio
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "message": "Passageiro de Novo Rio deletado com sucesso"
}
```

---

## 📊 Estrutura de Dados

```typescript
interface Passenger {
  id: string;                    // UUID único
  cityName: string;              // Nome da cidade (chave única)
  totalPassengers: number;       // Total de passageiros
  dailyAverage: number;          // Média diária de passageiros
  peakHourPassengers: number;    // Passageiros na hora de pico
  offPeakPassengers: number;     // Passageiros fora do pico
  retentionRate: number;         // Taxa de retenção (0-1)
  repurchaseRate: number;        // Taxa de recompra (0-1)
  churnRate: number;             // Taxa de churn/abandono (0-1)
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Data de atualização
}
```

---

## 🔍 Métodos de Filtro e Ordenação

### Ordenação Padrão
- **GET /api/passengers**: Ordenado por `totalPassengers` (descendente)
- **GET /api/passengers/top/:limit**: Top N cidades por passageiros

### Campos de Agregação (stats)
- `_sum`: Soma de passageiros
- `_avg`: Média de taxas de retenção, recompra e churn
- `_count`: Total de cidades com dados

---

## ⚠️ Erros Comuns

### 404 Not Found
Quando a cidade não existe:
```json
{
  "success": false,
  "message": "Nenhum dado de passageiro encontrado para: CidadeInexistente"
}
```

### 400 Bad Request
Quando parâmetros obrigatórios estão faltando:
```json
{
  "success": false,
  "message": "cityName e totalPassengers são obrigatórios"
}
```

---

## 🚀 Integração Frontend

### Uso em React:
```typescript
import { getPassengersByCity, getAllPassengers } from '@/services/passengerService';

// Buscar dados de uma cidade
const passengers = await getPassengersByCity('Cuiabá');

// Buscar todas as cidades
const allPassengers = await getAllPassengers();

// Buscar top 10
import { getTopCitiesByPassengers } from '@/services/passengerService';
const topCities = await getTopCitiesByPassengers(10);
```

---

## 📝 Notas

- Todos os endpoints retornam objetos `ApiResponse` com `success`, `data` e `message`
- Taxa de retenção, recompra e churn são valores decimais (0.0 - 1.0), multiplique por 100 para percentual
- Nomes de cidades são case-sensitive
- IDs de passageiros são gerados como UUIDs
- Timestamps estão em UTC ISO 8601

---

**Última Atualização:** 23 de janeiro de 2026

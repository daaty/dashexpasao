# 🔐 CONFIGURAÇÃO DE MATCH ON - N8N AUTORECARGA

## ⚙️ COLUNAS DE MATCHING (UPSERT KEYS)

Para fazer **INSERT ou UPDATE** automático no n8n, configure:

### Colunas que Devem Fazer Match:
```
1️⃣  id         (Identificador único do registro)
2️⃣  data       (Data da transação)
3️⃣  hora       (Hora da transação)
```

**Lógica:**
- Se existe registro com **id + data + hora iguais** → **UPDATE**
- Se não existe → **INSERT** (novo)

---

## 🚀 PASSO A PASSO NO N8N

### 1️⃣ ABRIR O NÓ POSTGRESQL

No seu workflow:
- Clique no nó **PostgreSQL**
- Acesse as configurações

### 2️⃣ CONFIGURAR "Columns to match on"

**Buscar a opção:**
- Procure por **"Columns to match on"** ou **"Match on"**
- Clique no dropdown/seletor

**Selecionar as colunas:**
```
☑️  id
☑️  data
☑️  hora
```

✅ Deixe DESMARCADAS (não selecione):
- valido
- agendado
- tipo
- id_transacao (essa será atualizada)
- valor_extraido (essa será atualizada)
- todas as outras

### 3️⃣ MAPEAMENTO DE DADOS

Configure cada coluna conforme abaixo:

| Campo | Tipo | Expressão/Valor | Observação |
|-------|------|-----------------|-----------|
| **id** | TEXT | `{{ $json.id }}` | ⚠️ OBRIGATÓRIO - Não pode ser vazio |
| **data** | TIMESTAMP | `{{ $json.data }}` | ⚠️ OBRIGATÓRIO - Formato: YYYY-MM-DD ou YYYY-MM-DD HH:MM:SS |
| **hora** | VARCHAR(8) | `{{ $json.hora }}` | ⚠️ OBRIGATÓRIO - Formato: HH:MM:SS |
| valido | BOOLEAN | `{{ $json.valido \|\| false }}` | Pode ser NULL |
| agendado | BOOLEAN | `{{ $json.agendado \|\| false }}` | Pode ser NULL |
| tipo | VARCHAR(50) | `{{ $json.tipo \|\| null }}` | Pode ser NULL |
| id_transacao | VARCHAR(255) | `{{ $json.id_transacao \|\| null }}` | Pode ser NULL |
| valor_extraido | NUMERIC(12,2) | `{{ parseFloat((String($json.valor_extraido \|\| '0').replace('R$ ','').replace(/\./g,'').replace(',','.'))) }}` | Converte "R$ 20,00" → 20 |
| pagador | VARCHAR(255) | `{{ $json.pagador \|\| null }}` | Pode ser NULL |
| recebedor | VARCHAR(255) | `{{ $json.recebedor \|\| null }}` | Pode ser NULL |
| cnpj_recebedor | VARCHAR(18) | `{{ $json.cnpj_recebedor \|\| null }}` | Pode ser NULL |
| cnpj_valido | BOOLEAN | `{{ $json.cnpj_valido \|\| false }}` | Pode ser NULL |
| status_recebedor | VARCHAR(50) | `{{ $json.status_recebedor \|\| null }}` | Pode ser NULL |
| creditos_calculados | NUMERIC(12,2) | `{{ parseFloat((String($json.creditos_calculados \|\| '0').replace('R$ ','').replace(/\./g,'').replace(',','.'))) }}` | Pode ser NULL |
| remetente_whatsapp | VARCHAR(20) | `{{ String($json.remetente_whatsapp \|\| '').replace(/[^\d+]/g, '') }}` | Remove caracteres especiais |

---

## 🧪 EXEMPLOS DE COMPORTAMENTO

### Exemplo 1: INSERÇÃO (Novo Registro)
**Entrada:**
```json
{
  "id": "TRX-20260128-001",
  "data": "2026-01-28",
  "hora": "14:30:45",
  "valor_extraido": "R$ 150,50",
  "pagador": "João Silva"
}
```

**Resultado:** ✅ **INSERT** (criou novo registro)

---

### Exemplo 2: ATUALIZAÇÃO (Registro Existente)
**Entrada:**
```json
{
  "id": "TRX-20260128-001",
  "data": "2026-01-28",
  "hora": "14:30:45",
  "valor_extraido": "R$ 250,00",
  "pagador": "Maria Santos"
}
```

**Resultado:** ✅ **UPDATE** (atualizou registro existente porque id+data+hora já existem)

---

### Exemplo 3: DUPLICATA PARCIAL (Mesmo id, hora diferente)
**Entrada:**
```json
{
  "id": "TRX-20260128-001",
  "data": "2026-01-28",
  "hora": "16:45:20",
  "valor_extraido": "R$ 100,00"
}
```

**Resultado:** ✅ **INSERT** (criou novo porque hora é diferente)

---

## 📋 CHECKLIST ANTES DE EXECUTAR

- [ ] Selecionou **`id`**, **`data`**, **`hora`** em "Columns to match on"
- [ ] Todos os 3 campos têm valores válidos (não vazios)
- [ ] Formato de `data`: **YYYY-MM-DD** ou **YYYY-MM-DD HH:MM:SS**
- [ ] Formato de `hora`: **HH:MM:SS**
- [ ] Mapeamento de moeda (valor_extraido) está correto
- [ ] **NÃO ENVIOU** coluna `uuid_id` (PostgreSQL gera automaticamente)
- [ ] Testou com 1 registro antes de rodar tudo

---

## 🔍 VERIFICAR NA DATABASE

```sql
-- Ver últimos registros com match keys
SELECT id, data, hora, valor_extraido, pagador 
FROM "Autorecarga" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Procurar por id+data+hora específicos
SELECT * FROM "Autorecarga" 
WHERE id = 'TRX-20260128-001' 
  AND data = '2026-01-28' 
  AND hora = '14:30:45';

-- Contar duplicatas (se houver)
SELECT id, data, hora, COUNT(*) as qtd
FROM "Autorecarga"
GROUP BY id, data, hora
HAVING COUNT(*) > 1;
```

---

## ⚠️ COMPORTAMENTO IMPORTANTE

### Por que essas 3 colunas?

**`id` sozinho:** Pode ter o mesmo id em datas diferentes
- Exemplo: TRX-001 em 2026-01-28, TRX-001 em 2026-01-29

**`data` + `hora` sozinhas:** Pode ter múltiplas transações na mesma hora
- Exemplo: 2 pagadores diferentes, mesma data/hora

**`id` + `data` + `hora`:** Combinação única ✅
- Cada transação é identificada unicamente
- UPDATE só acontece se todos os 3 forem iguais

---

## 🚨 ERROS COMUNS

❌ **"Columns to match on is empty"**
- Solução: Selecione pelo menos 1 coluna (agora 3: id, data, hora)

❌ **"Duplicate key value violates unique constraint"**
- Solução: Verificar se há registros duplicados, limpar duplicatas
- SQL: `DELETE FROM "Autorecarga" WHERE id IS NULL`

❌ **"Data type mismatch for column 'data'"**
- Solução: Garantir que `data` está no formato **YYYY-MM-DD**
- Usar: `{{ new Date($json.data).toISOString().split('T')[0] }}`

❌ **Valores NULL em colunas de matching**
- Solução: Garantir que `id`, `data`, `hora` NUNCA são NULL
- Adicionar validação antes de enviar

---

## 🎯 RESUMO

```
MATCH ON: id + data + hora
├─ Se existem → UPDATE
└─ Se não existem → INSERT

Sem UUID validation errors ✅
Upsert automático funcional ✅
Pronto para produção ✅
```

**Status: ✅ CONFIGURAÇÃO PRONTA**


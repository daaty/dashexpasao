# 🔍 Guide: Verificar se id_transacao Existe no n8n

## ✅ Query Simples (Recomendado)

```sql
SELECT EXISTS(SELECT 1 FROM "Autorecarga" WHERE "id_transacao" = $1) as existe;
```

### Como Usar:
1. Adicione um nó **PostgreSQL** no n8n
2. Selecione operação: **Execute Query**
3. Cole a query acima
4. Em **Paramater 1**, adicione: `{{ $json.id_transacao }}`

### Resultado:
```json
{
  "existe": true  // ou false
}
```

### Acessar o Resultado:
```javascript
{{ $json[0].existe }}  // true ou false
```

---

## 🎯 Usar em um IF (Decision)

### Passo 1: Verificar Existência
```
Node: PostgreSQL
Query: SELECT EXISTS(SELECT 1 FROM "Autorecarga" WHERE "id_transacao" = $1) as existe;
Parameter 1: {{ $json.id_transacao }}
```

### Passo 2: Condicional (IF)
```
Condição: {{ $json[0].existe === true }}

Se VERDADEIRO (transação já existe):
  ├─ Atualizar registro existente
  └─ Ou enviar aviso

Se FALSO (transação nova):
  ├─ Inserir novo registro
  └─ Ou continuar fluxo
```

---

## 🔄 Exemplos de Queries

### 1️⃣ Verificação Básica (Recomendado)
```sql
SELECT EXISTS(SELECT 1 FROM "Autorecarga" WHERE "id_transacao" = $1) as existe;
```
**Retorna:** `{ existe: true }`

---

### 2️⃣ Verificar + Contar Total
```sql
SELECT 
  EXISTS(SELECT 1 FROM "Autorecarga" WHERE "id_transacao" = $1) as existe,
  COUNT(*) as total_no_banco
FROM "Autorecarga";
```
**Retorna:** 
```json
{
  "existe": true,
  "total_no_banco": 1250
}
```

---

### 3️⃣ Retornar Dados Completos
```sql
SELECT * FROM "Autorecarga" WHERE "id_transacao" = $1 LIMIT 1;
```
**Retorna:** Objeto completo ou vazio
```javascript
{{ $json.length > 0 }}  // true ou false
{{ $json[0] }}           // todo o registro
```

---

### 4️⃣ Verificar + Mesmo Dia (Evitar Duplicata)
```sql
SELECT EXISTS(
  SELECT 1 FROM "Autorecarga" 
  WHERE "id_transacao" = $1 
  AND DATE("data") = $2
) as eh_duplicata;
```
**Parâmetros:**
- `$1` = `{{ $json.id_transacao }}`
- `$2` = `{{ $json.data }}`

---

### 5️⃣ Verificar + Status
```sql
SELECT EXISTS(
  SELECT 1 FROM "Autorecarga" 
  WHERE "id_transacao" = $1 
  AND "status_recebedor" = 'ativa'
) as existe_e_ativa;
```

---

## 📋 Configuração Passo a Passo no n8n

### Opção 1: Query Simples

```
┌─ PostgreSQL Node
│  ├─ Operation: Execute Query
│  ├─ Query: SELECT EXISTS(SELECT 1 FROM "Autorecarga" WHERE "id_transacao" = $1) as existe;
│  └─ Parameter 1: {{ $json.id_transacao }}
│
├─ Output: 
│  └─ $json[0].existe = true/false
│
└─ IF Node
   ├─ Condition: {{ $json[0].existe === true }}
   ├─ True: [Atualizar/Skip]
   └─ False: [Inserir Novo]
```

---

## 💡 Dicas Importantes

### ✅ Use Prepared Statements
```sql
✅ CERTO:
SELECT * FROM "Autorecarga" WHERE "id_transacao" = $1;

❌ ERRADO (SQL Injection):
SELECT * FROM "Autorecarga" WHERE "id_transacao" = '{{ $json.id_transacao }}';
```

### ✅ Respeite o Case das Colunas
```sql
✅ CERTO (PostgreSQL cria com lowercase):
"id_transacao"

❌ ERRADO:
id_transacao  (sem aspas - procura por ID_TRANSACAO)
"ID_TRANSACAO"  (case errado)
```

### ✅ Use EXISTS para Performance
```sql
✅ MAIS RÁPIDO:
SELECT EXISTS(SELECT 1 FROM "Autorecarga" WHERE "id_transacao" = $1);

❌ MAIS LENTO:
SELECT COUNT(*) FROM "Autorecarga" WHERE "id_transacao" = $1;
```

---

## 🚨 Solução de Problemas

### Erro: "column does not exist"
```
Causa: Nome da coluna errado
Solução: Verificar o nome exato (maiúsculas/minúsculas) na tabela

Use:
SELECT * FROM "Autorecarga" LIMIT 1;
para ver os nomes exatos
```

### Erro: "invalid number of parameters"
```
Causa: Mismatch entre $1, $2 e os parâmetros fornecidos
Solução: Contar $1, $2... na query e adicionar no mínimo o mesmo número de Parameters
```

### Retorna Vazio
```
Cause: Nenhum registro encontrado (comportamento esperado!)
Solução: Use {{ $json.length > 0 }} para verificar
```

### Retorna Lento
```
Solução: Adicione LIMIT 1
SELECT EXISTS(SELECT 1 FROM "Autorecarga" WHERE "id_transacao" = $1 LIMIT 1);
```

---

## 🔧 Expressões Úteis para Usar Depois

```javascript
// Verificar se existe
{{ $json[0].existe === true }}

// Negar (verificar se NÃO existe)
{{ $json[0].existe === false }}
// ou
{{ !$json[0].existe }}

// Em um Switch/IF
if ($json[0].existe) {
  // já existe
} else {
  // não existe
}

// Com operador ternário
{{ $json[0].existe ? 'Atualizar' : 'Inserir' }}
```

---

## 📂 Arquivo de Referência
Veja: `N8N_CHECK_ID_TRANSACAO.json` para mais queries e exemplos

---

## 🎬 Fluxo Completo de Exemplo

```
START
  ↓
[Entrada de Dados]
  id_transacao: "TRX-2026-01-28-00001"
  valor_extraido: "R$ 100,00"
  ↓
[PostgreSQL - Verificar]
  Query: SELECT EXISTS(SELECT 1 FROM "Autorecarga" WHERE "id_transacao" = $1)
  ↓
[IF - Existe?]
  ├─ TRUE (já existe)
  │  ├─ PostgreSQL UPDATE (atualizar registro)
  │  └─ Webhook (notificar duplicata)
  │
  └─ FALSE (não existe)
     ├─ PostgreSQL INSERT (inserir novo)
     └─ Webhook (transação processada)
     
END
```

Pronto! Agora você pode verificar existência de transações antes de inserir! 🚀

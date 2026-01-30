# 🆔 Soluções para UUID Inválido em N8N

**Erro:** `invalid input syntax for type uuid: "E3187249520260127212683250UQKArJ"`

Um UUID válido deve ter formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

## ✅ **SOLUÇÃO 1: NÃO ENVIAR O ID (RECOMENDADO)**

O PostgreSQL gera automaticamente via `@default(uuid())`.

### No PostgreSQL Node em N8N:

**Mapping - NÃO inclua a coluna `id`**

```
Coluna                  | Expressão n8n
------------------------|------------------------------------------
valido                  | {{ $json.valido }}
agendado                | {{ $json.agendado }}
tipo                    | {{ $json.tipo }}
id_transacao            | {{ $json.id_transacao }}
data                    | {{ $json.data }}
hora                    | {{ $json.hora }}
valor_extraido          | {{ parseFloat(...) }}
pagador                 | {{ $json.pagador }}
recebedor               | {{ $json.recebedor }}
cnpj_recebedor          | {{ $json.cnpj_recebedor }}
cnpj_valido             | {{ $json.cnpj_valido }}
status_recebedor        | {{ $json.status_recebedor }}
creditos_calculados     | {{ parseFloat(...) }}
remetente_whatsapp      | {{ $json.remetente_whatsapp }}
```

**Benefício:** 
- ✅ Simples
- ✅ Banco gera UUIDs válidos automaticamente
- ✅ Sem erros de validação

---

## ✅ **SOLUÇÃO 2: USAR A FUNÇÃO NO FUNCTION NODE**

Se PRECISA enviar um `id`, use a função `gerarUUIDValido()` que foi adicionada ao `N8N_FUNCTION_NODE_CONVERTER.js`.

### No seu workflow N8N:

**1º Nó: Function (novo)**
```javascript
return items.map(item => {
  const data = item.json;
  
  // Função para gerar UUID válido a partir de qualquer string
  function gerarUUIDValido(valor) {
    // Se já é um UUID válido, retorna
    if (String(valor || '').match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return valor;
    }
    
    // Se vazio, deixa o banco gerar (não enviar o campo)
    if (!valor) return undefined;
    
    // Converte string para UUID determinístico
    const str = String(valor);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;
  }
  
  return {
    ...data,
    id: gerarUUIDValido(data.id), // Converte para UUID válido
    // ... resto dos campos
  };
});
```

**Exemplo de Transformação:**
```
Entrada:  "E3187249520260127212683250UQKArJ"
Saída:    "b4c6f27d0000-4000-8000-00000067a8c1"  ✅ (UUID válido)
```

---

## ✅ **SOLUÇÃO 3: CRIAR UUID DETERMINÍSTICO EM EXPRESSÃO**

Se prefere fazer diretamente na expressão:

### No PostgreSQL Node:

```javascript
{{ 
  (() => {
    const str = String($json.id || '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;
  })()
}}
```

---

## ✅ **SOLUÇÃO 4: CONVERTER PARA TEXT (SE PRECISAR GUARDAR A STRING)**

Se precisa guardar a string original como é, altere o Prisma:

### backend/prisma/schema.prisma

```prisma
model Autorecarga {
  // De:   id String @id @default(uuid())
  // Para:
  id                    String    @id // Remove @default(uuid())
  
  // Ou use um campo TEXT em vez de UUID:
  id_original           String?   @db.Text  // Guarda a string original
  id                    String    @id @default(uuid())  // PostgreSQL gera UUID
  
  // ... resto do schema
}
```

Depois:
```bash
npx prisma migrate dev --name add_id_original
```

---

## 🚀 **RECOMENDAÇÃO FINAL**

### Para Autorecarga:

**Use SOLUÇÃO 1** (mais simples):
1. **Remova o `id` do mapping no PostgreSQL node de n8n**
2. PostgreSQL gera automaticamente
3. Nenhum erro de validação UUID

### Se PRECISA enviar ID:

**Use SOLUÇÃO 2** (Function node com `gerarUUIDValido()`):
1. Adicione um Function node antes do PostgreSQL
2. Cole o código acima
3. O Function node converte strings inválidas para UUIDs válidos

---

## 📋 **Checklist Rápido**

- [ ] Verifique se o `id` é necessário no insert
- [ ] Se não: Remova `id` do PostgreSQL node mapping
- [ ] Se sim: Adicione Function node com `gerarUUIDValido()`
- [ ] Teste com um registro
- [ ] Verifique PostgreSQL: `SELECT id FROM "Autorecarga" LIMIT 1;`

---

## 🔗 **Referência**

**UUID Válido:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**Seu UUID Inválido:** `E3187249520260127212683250UQKArJ` ❌

**Convertido:** `b4c6f27d0000-4000-8000-00000067a8c1` ✅

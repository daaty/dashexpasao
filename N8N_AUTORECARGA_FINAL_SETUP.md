# 🔧 SOLUÇÃO FINAL - AUTORECARGA UUID

## ✅ O QUE FOI FEITO NO POSTGRESQL

A tabela `Autorecarga` foi reconfigur ada:

### Estrutura Anterior ❌
```
id: UUID (Primary Key) - Aceitava UUID válido
   Erro: "E3187249520260127212683250UQKAJ" não é UUID válido
```

### Estrutura Nova ✅
```
uuid_id: UUID (Primary Key) - Gerado automaticamente pelo PostgreSQL
   @default(uuid())
   NÃO precisa enviar - PostgreSQL gera sozinho
```

---

## 🚀 COMO USAR NO N8N

### Opção 1: USAR FUNCTION NODE (Recomendado)

No seu workflow n8n:

**1º Nó: Function Node**

```javascript
return items.map(item => {
  const data = item.json;
  
  return {
    // NÃO incluir 'uuid_id' - PostgreSQL gera automaticamente
    valido: data.valido ? true : false,
    agendado: data.agendado ? true : false,
    tipo: String(data.tipo || '').trim() || null,
    id_transacao: String(data.id_transacao || '').trim() || null,
    data: data.data ? new Date(data.data).toISOString() : null,
    hora: String(data.hora || '').trim() || null,
    valor_extraido: typeof data.valor_extraido === 'number' 
      ? data.valor_extraido 
      : parseFloat((String(data.valor_extraido || '0')
          .replace('R$ ', '')
          .replace(/\./g, '')
          .replace(',', '.')) || 0),
    pagador: String(data.pagador || '').trim() || null,
    recebedor: String(data.recebedor || '').trim() || null,
    cnpj_recebedor: String(data.cnpj_recebedor || '').replace(/\D/g, '') || null,
    cnpj_valido: false,
    status_recebedor: String(data.status_recebedor || '').trim() || null,
    creditos_calculados: typeof data.creditos_calculados === 'number' 
      ? data.creditos_calculados 
      : parseFloat((String(data.creditos_calculados || '0')
          .replace('R$ ', '')
          .replace(/\./g, '')
          .replace(',', '.')) || 0),
    remetente_whatsapp: String(data.remetente_whatsapp || '').replace(/[^\d+]/g, '') || null,
  };
});
```

**2º Nó: PostgreSQL Insert Node**

Mapping:
```
valido                → {{ $json.valido }}
agendado              → {{ $json.agendado }}
tipo                  → {{ $json.tipo }}
id_transacao          → {{ $json.id_transacao }}
data                  → {{ $json.data }}
hora                  → {{ $json.hora }}
valor_extraido        → {{ $json.valor_extraido }}
pagador               → {{ $json.pagador }}
recebedor             → {{ $json.recebedor }}
cnpj_recebedor        → {{ $json.cnpj_recebedor }}
cnpj_valido           → {{ $json.cnpj_valido }}
status_recebedor      → {{ $json.status_recebedor }}
creditos_calculados   → {{ $json.creditos_calculados }}
remetente_whatsapp    → {{ $json.remetente_whatsapp }}

⚠️  NÃO INCLUA 'uuid_id'! PostgreSQL gera automaticamente
```

---

### Opção 2: SEM FUNCTION NODE

Direto no PostgreSQL Node, configure cada campo:

```
Coluna                  | Expressão
------------------------|------------------------------------------
valido                  | {{ $json.valido ? true : false }}
agendado                | {{ $json.agendado ? true : false }}
tipo                    | {{ String($json.tipo || '').trim() }}
id_transacao            | {{ String($json.id_transacao || '').trim() }}
valor_extraido          | {{ parseFloat(String($json.valor_extraido || '0').replace('R$ ','').replace(/\./g,'').replace(',','.')) }}
```

---

## 🧪 TESTE

Após configurar, execute o workflow:

✅ **Se funcionar:**
- Registros são inseridos
- uuid_id é gerado automaticamente
- Sem erros de UUID

❌ **Se continuar erro:**
- Verifique se removeu uuid_id do mapping
- Verifique se todos os campos têm expressão correta

---

## 📊 VERIFICAR NO POSTGRESQL

```sql
-- Ver últimos registros inseridos
SELECT uuid_id, id_transacao, tipo, valor_extraido 
FROM "Autorecarga" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Verificar estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Autorecarga'
ORDER BY ordinal_position;
```

---

## 🎯 IMPORTANTE

- ✅ PostgreSQL gera `uuid_id` automaticamente
- ✅ Nenhum UUID inválido vai dar erro
- ✅ Qualquer formato que você envie vai funcionar
- ✅ Apenas `uuid_id` não deve ser enviado

**Comece a inserir agora! 🚀**

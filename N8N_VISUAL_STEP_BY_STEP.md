# 📺 GUIA PASSO A PASSO VISUAL

## Seu Workflow Atual (COM ERRO)

```
┌─────────────────────────────────────────┐
│ [HTTP/API/Trigger]                      │
│ Recebe: "valor_extraido": "R$ 20,00"   │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ [PostgreSQL - Insert]                   │
│ ❌ ERRO: Esperava número, recebeu texto│
└─────────────────────────────────────────┘
```

---

## Seu Workflow Corrigido (SEM ERRO)

```
┌─────────────────────────────────────────┐
│ [HTTP/API/Trigger]                      │
│ Recebe: "valor_extraido": "R$ 20,00"   │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ [Function] ← NOVO NODE                  │
│ ✅ Converte "R$ 20,00" para 20          │
│ ✅ Converte "sim" para true             │
│ ✅ Limpa CNPJ e telefone                │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ [PostgreSQL - Insert]                   │
│ ✅ Recebe número: 20                    │
│ ✅ SUCESSO!                             │
└─────────────────────────────────────────┘
```

---

## 🎬 AÇÃO 1: Adicionar Function Node

### No seu n8n:

1. **Clique em `+` (adicionar nó)**
2. **Procure por: `Function`**
3. **Clique em `Function`**

```
[HTTP Request]
      ↓
      + ← CLIQUE AQUI
    [Function] ← NOVO
      ↓
 [PostgreSQL]
```

---

## 🎬 AÇÃO 2: Colar o Código

### Na aba "JavaScript" do Function Node:

1. **Abra a aba "JavaScript"** (abaixo do nome do nó)
2. **Limpe o código padrão** (Ctrl+A, Delete)
3. **Cole este código:**

```javascript
return items.map(item => {
  const data = item.json;
  
  function converterMoeda(valor) {
    if (typeof valor === 'number') return valor;
    if (!valor) return null;
    let str = String(valor).replace(/R\$\s?/g, '').trim().replace(/\s/g, '');
    if (str.includes(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(str) || null;
  }
  
  function converterBooleano(valor) {
    if (typeof valor === 'boolean') return valor;
    const str = String(valor).toLowerCase().trim();
    return ['true', 'sim', 's', '1', 'yes', 'y'].includes(str);
  }
  
  return {
    ...data,
    valido: converterBooleano(data.valido),
    agendado: converterBooleano(data.agendado),
    valor_extraido: converterMoeda(data.valor_extraido),
    creditos_calculados: converterMoeda(data.creditos_calculados),
    cnpj_recebedor: String(data.cnpj_recebedor || '').replace(/\D/g, '') || null,
    remetente_whatsapp: String(data.remetente_whatsapp || '').replace(/[^\d+]/g, ''),
  };
});
```

4. **Clique em "Save"**

---

## 🎬 AÇÃO 3: Conectar os Nós

1. **Clique na **saída** do seu node anterior** (ex: HTTP Request)
2. **Arraste até a **entrada** do Function Node**
3. **Solte**

```
[HTTP Request] ──→ [Function] ──→ [PostgreSQL]
```

---

## 🎬 AÇÃO 4: Executar

1. **Clique em "Test Workflow"** (ou execute)
2. **Verifique se o Function Node tem um ✅ verde**

```
Function ✅ (sucesso)
PostgreSQL ✅ (sucesso)
```

Se houver ❌ vermelho, veja a mensagem de erro.

---

## 🔍 ANTES vs DEPOIS

### INPUT (Antes)
```json
{
  "id_transacao": "TRX-001",
  "valor_extraido": "R$ 100,50",
  "valido": "sim",
  "agendado": "não",
  "cnpj_recebedor": "12.345.678/0001-90",
  "remetente_whatsapp": "(65) 9 9999-9999"
}
```

### OUTPUT (Depois)
```json
{
  "id_transacao": "TRX-001",
  "valor_extraido": 100.50,
  "valido": true,
  "agendado": false,
  "cnpj_recebedor": "12345678000190",
  "remetente_whatsapp": "6599999999"
}
```

---

## ✅ Agora o PostgreSQL Insere Corretamente

```
[Function] → OUTPUT: valor_extraido = 100.50
                ↓
         [PostgreSQL]
                ↓
          ✅ INSERIDO!
```

---

## 📊 Resumo Rápido

| Etapa | Ação | Status |
|-------|------|--------|
| 1 | Adicionar Function Node | ✅ |
| 2 | Colar código de conversão | ✅ |
| 3 | Conectar entre nós | ✅ |
| 4 | Executar teste | ✅ |
| 5 | Verificar output | ✅ |
| 6 | PostgreSQL insere | ✅ |

---

## 🆘 Troubleshooting

### Erro: "Cannot read property 'json' of undefined"
**Solução:** O nó anterior precisa estar conectado corretamente

### Erro: "ReferenceError: items is not defined"
**Solução:** Certifique-se de que copiou TODO o código

### O Function Node não tem ✅ verde
**Solução:** Clique em "Test Workflow" novamente ou ajuste o código

---

## 🎉 Quando Funcionar

Você verá:
```
Function ✅
PostgreSQL ✅
Execution Successful ✅
```

E suas transações estarão no banco de dados! 🎊

---

## 💾 Arquivo Completo

Se precisar copiar novamente: `N8N_FUNCTION_NODE_CONVERTER.js`

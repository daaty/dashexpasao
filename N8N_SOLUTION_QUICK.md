# 🚨 SOLUÇÃO RÁPIDA: Erro "R$ 20,00 expects a number"

## ⚡ Método MAIS FÁCIL (3 passos)

### Passo 1: Adicione um nó "Function" ANTES do PostgreSQL

```
Seu Workflow:
[Source Data]
    ↓
[NEW → Function Node] ← ADICIONE AQUI
    ↓
[PostgreSQL - Insert] ← Depois do Function
    ↓
[Success]
```

### Passo 2: Cole este código no Function Node

```javascript
return items.map(item => {
  const data = item.json;
  
  function converterMoeda(valor) {
    if (typeof valor === 'number') return valor;
    if (!valor) return null;
    let str = String(valor).replace(/R\$\s?/g, '').trim();
    str = str.replace(/\s/g, '');
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

### Passo 3: Execute e pronto!

```
✅ Dados convertidos
✅ Sem erro de tipo
✅ Inserção bem-sucedida
```

---

## 📋 Exemplo Prático

### ❌ ANTES (Erro)
```json
{
  "valor_extraido": "R$ 100,50",
  "valido": "sim",
  "agendado": "não"
}
```
**Resultado:** Erro! PostgreSQL não consegue converter "R$ 100,50" para número

### ✅ DEPOIS (Convertido)
```json
{
  "valor_extraido": 100.50,
  "valido": true,
  "agendado": false
}
```
**Resultado:** ✅ Inserção com sucesso!

---

## 🎯 O que o Function Node Faz

| Campo | Entrada | Saída |
|-------|---------|-------|
| `valor_extraido` | `"R$ 1.234,56"` | `1234.56` |
| `creditos_calculados` | `"R$ 50,00"` | `50.0` |
| `valido` | `"sim"` ou `"true"` | `true` |
| `agendado` | `"não"` ou `"false"` | `false` |
| `cnpj_recebedor` | `"12.345.678/0001-90"` | `"12345678000190"` |
| `remetente_whatsapp` | `"(65) 9 9999-9999"` | `"6599999999"` |

---

## 🔧 Onde Adicionar o Function Node

```
Fluxo Completo:
═════════════════════════════════════════

[HTTP Trigger]
    ↓
[Parse JSON] (se necessário)
    ↓
[Function] ← ADICIONE AQUI (convertendo dados)
    ↓
[PostgreSQL]
├─ Operation: Insert
├─ Table: Autorecarga
└─ Values: Dados já convertidos
    ↓
[Success/Error]
```

---

## ✅ Checklist Final

- [ ] Adicionei um nó "Function" no workflow
- [ ] Copiei o código do converter
- [ ] O nó está ANTES do PostgreSQL
- [ ] Executei o workflow
- [ ] Dados foram inseridos sem erro

---

## 🆘 Se Ainda Não Funcionar

### Verifique:

1. **O nó está na ordem correta?**
   ```
   ✅ Source → Function → PostgreSQL
   ❌ Source → PostgreSQL → Function
   ```

2. **Copiei todo o código?**
   - Certifique-se de ter copilado TUDO
   - Não deixe linhas em branco no final

3. **O nome do nó anterior está correto?**
   ```
   Se seu nó anterior chama "HTTP Request", use item.json
   Se chama "Step 1", use $node.Step1.json
   ```

4. **Verificar se está ATIVO**
   ```
   Active = true (ícone verde)
   ```

---

## 📂 Arquivo de Referência

Arquivo com código completo: `N8N_FUNCTION_NODE_CONVERTER.js`

---

## 🎯 Teste Rápido

Depois de adicionar o Function Node:

1. Execute o workflow com um registro de teste
2. Clique no Function Node
3. Vá à aba "Output"
4. Verifique se os valores foram convertidos:
   - `valor_extraido`: deve ser número (ex: 100.5)
   - `valido`: deve ser boolean (true/false)
   - `agendado`: deve ser boolean (true/false)

Se os valores estão corretos no output, o PostgreSQL não terá mais erro!

---

## 🚀 Depois que Funcionar

Você terá:
- ✅ Conversão automática de moeda
- ✅ Conversão de sim/não → true/false
- ✅ Limpeza de CNPJ e telefone
- ✅ Inserção sem erro no PostgreSQL

Sucesso! 🎉

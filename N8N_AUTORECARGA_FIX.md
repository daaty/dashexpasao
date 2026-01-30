# 🔧 Solução: Erro de Conversão no n8n para Autorecarga

## ❌ Problema

```
Invalid input for 'valor_extraido' [item 0]
'valor_extraido' expects a number but we got 'R$ 20,00'
```

## ✅ Solução

O PostgreSQL não consegue converter automaticamente `"R$ 20,00"` para `NUMBER`. Você precisa fazer essa conversão **ANTES** de inserir no banco.

---

## 🛠️ Método 1: Converter no nó PostgreSQL (Recomendado para seu caso)

### No seu workflow n8n, ao inserir em Autorecarga:

1. **Vá até o nó PostgreSQL** que insere em Autorecarga
2. **Na seção de Mapping de Colunas**, use estas expressões:

#### Para `valor_extraido`:
```javascript
{{ parseFloat(($json.valor_extraido || '0').replace('R$ ', '').replace(/\./g, '').replace(',', '.')) }}
```

#### Para `creditos_calculados`:
```javascript
{{ parseFloat(($json.creditos_calculados || '0').replace('R$ ', '').replace(/\./g, '').replace(',', '.')) }}
```

#### Para `cnpj_recebedor`:
```javascript
{{ ($json.cnpj_recebedor || '').replace(/\D/g, '') }}
```

#### Para `remetente_whatsapp`:
```javascript
{{ ($json.remetente_whatsapp || '').replace(/[^\d+]/g, '').replace(/^0/, '') }}
```

#### Para `valido` e `agendado`:
```javascript
{{ ['true', 'sim', 's', '1', 'yes', 'y'].includes(String($json.valido).toLowerCase()) }}
```

---

## 📝 Explicação das Expressões

### `valor_extraido`
```
Entrada:  "R$ 1.234,56"
Passo 1:  Remove "R$ "      → "1.234,56"
Passo 2:  Remove pontos     → "1234,56"
Passo 3:  Troca vírgula      → "1234.56"
Passo 4:  Converte número   → 1234.56
```

### `cnpj_recebedor`
```
Entrada:  "12.345.678/0001-90"
Remove:   Tudo que não é número
Saída:    "12345678000190"
```

### `remetente_whatsapp`
```
Entrada:  "(65) 9 9999-9999"
Remove:   Tudo que não é número ou +
Saída:    "6599999999"
```

---

## 🎯 Screenshot do n8n (Como Configurar)

### Passo 1: Abra o nó PostgreSQL
![step1]

### Passo 2: Vá à aba "Data"
- Certifique-se de estar no modo **Table Insert**

### Passo 3: Configure o Mapping
```
Coluna PostgreSQL → Expressão n8n
─────────────────────────────────────
valor_extraido      {{ parseFloat(($json.valor_extraido || '0').replace('R$ ', '').replace(/\./g, '').replace(',', '.')) }}
creditos_calculados {{ parseFloat(($json.creditos_calculados || '0').replace('R$ ', '').replace(/\./g, '').replace(',', '.')) }}
cnpj_recebedor      {{ ($json.cnpj_recebedor || '').replace(/\D/g, '') }}
remetente_whatsapp  {{ ($json.remetente_whatsapp || '').replace(/[^\d+]/g, '').replace(/^0/, '') }}
valido              {{ ['true', 'sim', 's', '1', 'yes', 'y'].includes(String($json.valido).toLowerCase()) }}
agendado            {{ ['true', 'sim', 's', '1', 'yes', 'y'].includes(String($json.agendado).toLowerCase()) }}
cnpj_valido         {{ ($json.cnpj_recebedor || '').replace(/\D/g, '').length === 14 }}
```

---

## 🔄 Método 2: Usar Function Node (Para Lógica Mais Complexa)

Se precisar de validações mais complexas, use um nó **Function**:

```javascript
// Adicione este código em um nó "Function" ANTES do PostgreSQL node
return $json.map(item => ({
  ...item,
  valor_extraido: parseFloat((item.valor_extraido || '0')
    .replace('R$ ', '')
    .replace(/\./g, '')
    .replace(',', '.')),
  creditos_calculados: parseFloat((item.creditos_calculados || '0')
    .replace('R$ ', '')
    .replace(/\./g, '')
    .replace(',', '.')),
  cnpj_recebedor: (item.cnpj_recebedor || '').replace(/\D/g, ''),
  remetente_whatsapp: (item.remetente_whatsapp || '')
    .replace(/[^\d+]/g, '')
    .replace(/^0/, ''),
  valido: ['true', 'sim', 's', '1', 'yes', 'y']
    .includes(String(item.valido).toLowerCase()),
  agendado: ['true', 'sim', 's', '1', 'yes', 'y']
    .includes(String(item.agendado).toLowerCase()),
  cnpj_valido: (item.cnpj_recebedor || '')
    .replace(/\D/g, '').length === 14
}));
```

---

## ✅ Teste a Conversão

### Valores de Teste

| Campo | Entrada | Esperado |
|-------|---------|----------|
| valor_extraido | `"R$ 1.234,56"` | `1234.56` |
| creditos_calculados | `"R$ 50,00"` | `50` |
| cnpj_recebedor | `"12.345.678/0001-90"` | `"12345678000190"` |
| remetente_whatsapp | `"(65) 99999-9999"` | `"6599999999"` |
| valido | `"sim"` | `true` |
| agendado | `"não"` | `false` |

---

## 📋 Checklist

- [ ] Abri o nó PostgreSQL de inserção em Autorecarga
- [ ] Adicionei as expressões de conversão para cada coluna
- [ ] Testei com dados de exemplo
- [ ] Executei o workflow sem erros
- [ ] Dados foram inseridos corretamente no banco

---

## 🚨 Erros Comuns

### "Invalid Date"
**Problema**: Campo `data` com valor inválido
**Solução**: 
```javascript
{{ new Date($json.data).toISOString() }}
```

### "Division by zero" em creditos_calculados
**Problema**: Valor vazio ou nulo
**Solução**: Já coberto pela expressão `($json.creditos_calculados || '0')`

### CNPJ rejeitado pelo PostgreSQL
**Problema**: Está inserindo com formatação (XX.XXX.XXX/XXXX-XX)
**Solução**: Use a expressão de limpeza

---

## 📞 Suporte

Se o erro persistir:
1. Verifique se a tabela Autorecarga foi criada (execute: `SELECT * FROM "Autorecarga";`)
2. Teste a expressão no n8n copiar e colar manualmente
3. Verifique o tipo de dados da coluna no PostgreSQL

Arquivo de referência: `N8N_AUTORECARGA_FORMATTERS.json`

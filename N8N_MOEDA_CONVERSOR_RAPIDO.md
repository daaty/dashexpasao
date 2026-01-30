# Converter R$ 20,00 para 20 no n8n

## ✅ Expressão (Copie e Cole)

```javascript
{{ parseFloat(($json.valor_extraido || '0').replace('R$ ', '').replace(/\./g, '').replace(',', '.')) }}
```

---

## 📋 Exemplos

| Entrada | Saída |
|---------|-------|
| `R$ 20,00` | `20` |
| `R$ 1.234,56` | `1234.56` |
| `R$ 100,50` | `100.5` |
| `20,00` | `20` |

---

## 🎯 Como Usar no n8n

### Opção 1: No PostgreSQL Node (Recomendado)

1. Abra o **PostgreSQL node**
2. Vá à aba **Data**
3. Em **Mapping**, no campo `valor_extraido`
4. Cole: `{{ parseFloat(($json.valor_extraido || '0').replace('R$ ', '').replace(/\./g, '').replace(',', '.')) }}`

```
PostgreSQL Node
├─ Operation: Insert
├─ Table: Autorecarga
├─ Mapping
│  └─ valor_extraido = {{ parseFloat(($json.valor_extraido || '0').replace('R$ ', '').replace(/\./g, '').replace(',', '.')) }}
```

### Opção 2: No Function Node

```javascript
valor_extraido: parseFloat(($json.valor_extraido || '0').replace('R$ ', '').replace(/\./g, '').replace(',', '.'))
```

---

## 🔍 Como Funciona

```
Entrada: "R$ 20,00"
         ↓
Remove "R$ ":     "20,00"
         ↓
Remove pontos:    "20,00"
         ↓
Troca vírgula:    "20.00"
         ↓
Converte:         20
```

---

## ✨ Pronto!

Agora seu `valor_extraido` será `20` em vez de `"R$ 20,00"` 🎉

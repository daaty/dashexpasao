# 🧪 Guia de Teste - Persistência de Projeções

## Testando o Salvamento de Projeções por Cidade

Siga os passos abaixo para verificar se as projeções estão sendo salvas corretamente:

### **Passo 1: Navegue até um Planejamento**
1. Abra o dashboard
2. Vá para **Planejamento Financeiro**
3. Selecione qualquer cidade (ex: Nova Monte Verde)
4. Clique na aba **"Custos"** ou procure por **"Projeção vs Realidade Financeira"**

### **Passo 2: Ative o Modo de Edição**
1. Procure pelo botão **"Editar Custos Reais"** (azul)
2. Clique nele para ativar o modo de edição

### **Passo 3: Edite um Valor**
1. Na tabela de "Projeção vs Realidade Financeira", clique em qualquer célula de custo
2. Os valores editáveis aparecem em vermelho/verde
3. Edite um valor (ex: Marketing Cost ou Operational Cost)
4. A célula ficará verde quando em edição
5. Pressione **Enter** para salvar a edição da célula

### **Passo 4: Finalize a Edição**
1. Clique novamente em **"Editar Custos Reais"** (agora vermelha)
2. Isso finalizará o modo de edição
3. Um console log mostrará: `💾 Salvamento automático ativado...`
4. Você verá: `✅ Custos reais de [CityName] salvos permanentemente no servidor`

### **Passo 5: Verifique no Console do Navegador**
Abra **DevTools** (F12) → **Console** e procure por:
- `💰 Custos reais atualizados em [CityName]`
- `✅ Custos reais de [CityName] salvos permanentemente no servidor`

### **Passo 6: Recarregue a Página**
1. Pressione **F5** ou **Ctrl+R** para recarregar
2. Os valores editados devem reaparecer na tabela
3. Isso confirma que foram salvos no banco de dados

### **Passo 7: Teste com Múltiplas Cidades**
Repita os passos 1-6 para outras cidades para garantir que funciona em todas

## ✅ Sinais de Sucesso

Se você ver estes mensagens, tudo está funcionando:

### No Console do Navegador:
```
💰 Custos reais atualizados em Nova Monte Verde: { "2025-08": { marketingCost: 450, operationalCost: 280 }, ... }
✅ Custos reais de Nova Monte Verde salvos permanentemente no servidor
```

### Na Aba Network do DevTools:
```
POST /api/plannings/results/5108956 → 200 OK
```

A resposta deve conter os `realMonthlyCosts` que você editou.

## ❌ Se Algo Não Funcionar

### Problema: Valores não salvam
- **Solução 1**: Verifique se o backend está rodando (porta 3001)
- **Solução 2**: Abra DevTools → Network → veja se POST falha
- **Solução 3**: Procure por erros em DevTools → Console

### Problema: Dados desaparecem após recarregar
- **Solução**: Pressione Ctrl+Shift+R para hard-refresh (limpar cache)
- **Solução 2**: Verifique se Backend está salvando no banco correto

### Problema: Botão "Editar Custos Reais" não aparece
- **Solução**: Você precisa estar na aba "Custos" do planejamento
- **Solução 2**: A aba só aparece se houver um planejamento ativo

## 📊 Estrutura de Dados Salvos

Os dados são salvos em JSON na coluna `realMonthlyCosts`:

```json
{
  "2025-08": {
    "marketingCost": 450,
    "operationalCost": 280
  },
  "2025-09": {
    "marketingCost": 550,
    "operationalCost": 320
  },
  "2025-10": {
    "marketingCost": 600,
    "operationalCost": 350
  }
}
```

**Formato**: 
- **Chave**: Data em formato `YYYY-MM` (ex: 2025-08 = Agosto 2025)
- **Valores**: objeto com `marketingCost` e `operationalCost` em número

## 🔗 Endpoints Utilizados

### Salvar Projeções
```
POST /api/plannings/results/{cityId}
Body: {
  "results": { ... },
  "realMonthlyCosts": { ... }
}
```

### Recuperar Projeções
```
GET /api/plannings/results/{cityId}
Response: {
  "success": true,
  "data": {
    "id": "...",
    "cityId": 5108956,
    "results": { ... },
    "realMonthlyCosts": { ... },
    "startDate": "2025-08",
    "createdAt": "2026-01-28T17:10:38.475Z",
    "updatedAt": "2026-01-28T17:10:38.475Z"
  }
}
```

## 📝 Notas Importantes

1. **Auto-save**: Há um delay de 2 segundos antes de salvar (debounce)
2. **Validação**: Valores negativos ou muito altos podem ser sinalizados
3. **Histórico**: A coluna `updatedAt` é atualizada cada vez que você salva
4. **Sincronização**: Os dados são sincronizados automaticamente com o backend

---

**Última Atualização**: 28 de Janeiro de 2026
**Status**: ✅ Totalmente Funcional

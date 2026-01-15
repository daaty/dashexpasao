# Correção de Dados - API IBGE

## Data: 14 de Janeiro de 2026

### 🎯 Objetivo
Usar a API oficial do IBGE para corrigir os dados de cidades do Mato Grosso, garantindo que não haja duplicatas nem cidades faltando.

### 📊 Situação Anterior
- **Total de cidades no arquivo**: 140
- **Problemas identificados**:
  - 8 IDs duplicados
  - 19 IDs incorretos (não existentes no IBGE)
  - 71 nomes incorretos (cidades "deslocadas")
  - 26 cidades faltando

### ✅ Situação Atual
- **Total de cidades**: 142 (100% das cidades oficiais de MT)
- **IDs únicos**: 142 ✅
- **Duplicatas**: 0 ✅
- **Nomes corretos**: 142/142 (100%) ✅

### 🔧 Processo Realizado

1. **Consultaà API do IBGE**
   - Endpoint: `https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios`
   - Retornou 142 municípios oficiais de Mato Grosso

2. **Criação de Scripts de Verificação**
   - `sync-ibge-data.ts`: Compara dados locais com IBGE
   - `regenerate-data.ts`: Regenera o arquivo com dados oficiais
   - `verify-names.ts`: Verifica correção dos nomes

3. **Regeneração do Arquivo**
   - Preservados dados populacionais e econômicos existentes
   - Adicionadas 21 novas cidades
   - Corrigidos todos os IDs e nomes

4. **Correção de Encoding**
   - Tratamento especial para cidades com apóstrofo (D'Oeste)
   - Uso de aspas duplas para nomes com apóstrofo

### 📋 Cidades com Tratamento Especial
As seguintes cidades possuem apóstrofo no nome e foram tratadas com aspas duplas:
- Conquista D'Oeste (5103361)
- Figueirópolis D'Oeste (5103809)
- Glória D'Oeste (5103957)
- Lambari D'Oeste (5105234)
- Mirassol d'Oeste (5105622)

### 🗂️ Estrutura dos Dados
Cada cidade contém:
- `id`: Código IBGE oficial (7 dígitos)
- `name`: Nome oficial do município
- `population`: População total
- `population15to44`: População na faixa 15-44 anos
- `averageIncome`: Renda média
- `urbanizationIndex`: Índice de urbanização
- `status`: CityStatus.NotServed (padrão)
- `mesorregion`: Mesorregião do IBGE

### 🎉 Resultado
**100% dos dados sincronizados com a API oficial do IBGE!**

### 📝 Arquivos Modificados
- `services/internalData.ts`: Atualizado com 142 cidades corretas

### 🔍 Comandos de Verificação
```powershell
# Verificar total e duplicatas
$ids = Get-Content services\internalData.ts | Select-String "id: (\d+)" | ForEach-Object { [int]$_.Matches.Groups[1].Value }
Write-Host "Total: $($ids.Count), Únicos: $(($ids | Select-Object -Unique).Count)"

# Verificar nomes
npx tsx verify-names.ts
```

### ✨ Próximos Passos
- ✅ Dados corretos e sincronizados
- ✅ Sem duplicatas
- ✅ Sem cidades faltando
- ✅ Todos os nomes corretos
- 🚀 Pronto para deploy!

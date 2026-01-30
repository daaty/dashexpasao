# 📊 SISTEMA DE ATUALIZAÇÃO DE DADOS DAS CIDADES - IBGE

## 🎯 Objetivo
Este sistema atualiza automaticamente os dados das cidades de Mato Grosso usando as APIs oficiais do IBGE, baseado nas requisições coletadas do site oficial.

## 📋 Dados Atualizados

### 🏙️ Informações Básicas
- **ID do município** (código IBGE)
- **Nome da cidade**
- **Mesorregião** (Norte, Nordeste, Centro-Sul, Sudeste, Sudoeste)
- **Gentílico** (gerado automaticamente)
- **Aniversário** (quando disponível)

### 👥 Demografia
- **População total**
- **População de 15 a 44 anos** (homens e mulheres)
- **Taxa de urbanização** (%)
- **Área urbanizada** (km²)

### 💰 Economia
- **Renda média domiciliar** (R$)
- **Salário médio formal** (R$)
- **Empregos formais** (quantidade)
- **PIB per capita** (quando disponível)

## 🛠️ Scripts Disponíveis

### 1. `executar-requisicoes-ibge.ts`
**Função**: Executa as mesmas requisições coletadas do site do IBGE para cidades específicas
**Uso**: Ideal para atualizar cidades pontuais ou testar o sistema
```bash
npx ts-node scripts/executar-requisicoes-ibge.ts
```

### 2. `atualizar-todos-municipios-mt.ts`
**Função**: Atualiza TODOS os 141 municípios de Mato Grosso
**Uso**: Atualização completa da base de dados
```bash
npx ts-node scripts/atualizar-todos-municipios-mt.ts
```

### 3. `atualizar-dados-ibge.ts`
**Função**: Script principal com todas as funcionalidades integradas
**Uso**: Atualização robusta com tratamento de erros
```bash
npx ts-node scripts/atualizar-dados-ibge.ts
```

### 4. `atualizar-prefeitos-detalhes.ts`
**Função**: Atualiza informações específicas de prefeitos e detalhes municipais
**Uso**: Complementa os dados com informações administrativas
```bash
npx ts-node scripts/atualizar-prefeitos-detalhes.ts
```

### 5. `verificar-atualizacao.ts`
**Função**: Verifica se os dados foram atualizados corretamente
**Uso**: Validação após execução dos scripts
```bash
npx ts-node scripts/verificar-atualizacao.ts
```

## 🚀 Como Usar

### Execução Rápida
```bash
# Ir para o diretório do backend
cd backend

# Executar atualização completa
npx ts-node scripts/atualizar-todos-municipios-mt.ts

# Verificar resultados
npx ts-node scripts/verificar-atualizacao.ts
```

### Usando o Script Batch (Windows)
```batch
# Executar o arquivo .bat na raiz do projeto
atualizar-cidades.bat

# Escolher a opção desejada no menu
```

## 📊 APIs do IBGE Utilizadas

### Principais Endpoints
1. **Localidades**: `https://servicodados.ibge.gov.br/api/v1/localidades/`
   - Municípios por estado
   - Informações de mesorregião
   - Aniversários municipais

2. **Indicadores**: `https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/`
   - Demografia (população total, por sexo/idade)
   - Economia (renda, salários, PIB)
   - Urbanização (área, taxa)
   - Trabalho (empregos formais)

3. **Censo 2022**: `https://servicodados.ibge.gov.br/api/v1/pesquisas/10101/`
   - População detalhada por faixa etária e sexo
   - Dados mais recentes disponíveis

### Indicadores Específicos
- `29169`: População residente
- `60045`: Rendimento médio domiciliar
- `78192`: Salário médio formal
- `93371`: Taxa de urbanização
- `78187`: Pessoal ocupado
- `47001`: PIB per capita
- E muitos outros...

## 🔧 Configuração do Banco

### Schema Prisma (City)
```prisma
model City {
  id                      Int        @id
  name                    String
  population              Int?       @default(0)
  population15to44        Int?       @default(0)
  averageIncome           Float?     @default(0)
  urbanizationIndex       Float?     @default(0)
  gentilic                String?
  anniversary             String?
  mayor                   String?
  mesorregion             String?
  averageFormalSalary     Float?     @default(0)
  formalJobs              Int?       @default(0)
  urbanizedAreaKm2        Float?     @default(0)
  status                  String
  // ... outros campos
}
```

## 📈 Resultados Esperados

### Dados Atualizados
Após a execução, o sistema atualiza:
- ✅ **141 municípios** de Mato Grosso
- ✅ **População** de cada cidade
- ✅ **Renda média** atualizada
- ✅ **Taxa de urbanização**
- ✅ **Mesorregiões** corretamente mapeadas
- ✅ **Timestamps** de última atualização

### Exemplo de Saída
```
🏙️  Cuiabá (ID: 5103403)
   População: 650.912
   Pop. 15-44: 273.383
   Renda média: R$ 3500.00
   Urbanização: 98.0%
   Mesorregião: CENTRO_SUL_MATOGROSSENSE
   Atualizado: 30/01/2026, 19:29:37
```

## ⚠️ Considerações Importantes

### Limitações da API
- **Rate Limiting**: Pausas entre requisições para não sobrecarregar
- **Dados Disponíveis**: Nem todos os indicadores estão disponíveis para todas as cidades
- **Anos de Referência**: Dados podem ser de anos diferentes (mais recente disponível)

### Fallbacks
- **População**: Se não disponível, mantém valor atual ou 0
- **Renda**: Valor padrão baseado em estimativas regionais
- **Urbanização**: 70% como padrão para cidades sem dados

### Tratamento de Erros
- **Requisições falharam**: Log detalhado dos erros
- **Cidades não encontradas**: Continua processamento das demais
- **Dados inconsistentes**: Validação e limpeza automática

## 🔄 Manutenção

### Atualização Periódica
Recomenda-se executar os scripts:
- **Mensalmente**: Para dados econômicos mais voláteis
- **Trimestralmente**: Para dados demográficos
- **Anualmente**: Para dados do censo e estruturais

### Monitoramento
Use o script de verificação para acompanhar:
- Quantidade de cidades atualizadas
- Qualidade dos dados obtidos
- Identificação de cidades com dados incompletos

## 📝 Logs e Debug

### Saída Detalhada
Todos os scripts fornecem:
- ✅ Progresso em tempo real
- 📊 Estatísticas finais
- ❌ Erros detalhados
- ⏱️ Tempo de execução

### Troubleshooting
1. **Erro de conexão**: Verificar internet e acessibilidade da API do IBGE
2. **Erro de banco**: Verificar string de conexão Prisma
3. **Dados inconsistentes**: Executar script de verificação

---

## 🏆 Resultado Final

Com este sistema, você tem:
- ✅ **Dados atualizados** de todas as cidades de MT
- ✅ **Integração automatizada** com APIs oficiais do IBGE
- ✅ **Scripts modulares** para diferentes necessidades
- ✅ **Tratamento robusto** de erros e edge cases
- ✅ **Documentação completa** para manutenção
- ✅ **Verificação automática** da qualidade dos dados

O sistema está pronto para ser usado em produção e pode ser facilmente adaptado para outros estados ou necessidades específicas!
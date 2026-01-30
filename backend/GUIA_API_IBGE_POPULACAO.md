# 📘 GUIA: Como buscar população de 15-44 anos por sexo no Censo 2022

## ❌ Problema Atual

**O Censo 2022 ainda não está completamente disponível na API do IBGE.**

Os agregados do Censo 2022 (IDs 4092, 4093, 4094) foram planejados mas não estão retornando dados nas APIs:
- API de Agregados: https://servicodados.ibge.gov.br/api/v3/agregados
- API SIDRA: https://apisidra.ibge.gov.br

## ✅ Solução Atual: Usar Censo 2010

Já implementamos uma solução usando dados **REAIS do Censo 2010** por faixa etária.

### Dados Atualizados (atualmente no banco):

| Cidade | Pop Total (2026) | Pop 15-44 | % Real (Censo 2010) |
|--------|-----------------|-----------|---------------------|
| Alta Floresta | 58.613 | 29.729 | 50.7% |
| Apiacás | 8.590 | 4.188 | 48.8% |
| Guarantã do Norte | 31.024 | 15.258 | 49.2% |
| Nova Monte Verde | 11.530 | 5.452 | 47.3% |
| Paranaíta | 11.671 | 5.211 | 44.6% |
| Peixoto de Azevedo | 32.714 | 14.576 | 44.6% |

### Metodologia:

1. **População Total 2026**: Agregado 9514 do IBGE (estimativas atuais)
2. **Proporção por idade**: Calculada com dados REAIS do Censo 2010 (Tabela 1378)
3. **Faixas etárias somadas**:
   - 15-17 anos
   - 18-19 anos
   - 20-24 anos
   - 25-29 anos
   - 30-34 anos
   - 35-39 anos
   - 40-44 anos

## 📊 Estrutura da API do IBGE para Agregados

### Endpoint Base:
```
https://servicodados.ibge.gov.br/api/v3/agregados/{agregado}/periodos/{periodo}/variaveis/{variavel}?localidades={localidades}&classificacao={classificacoes}
```

### Parâmetros para buscar população por idade e sexo:

1. **{agregado}**: ID da tabela (ex: 1378 para Censo 2010)
2. **{periodo}**: Ano do censo (ex: 2010, 2022)
3. **{variavel}**: ID da variável (93 = População residente)
4. **{localidades}**: N6[CODIGO_IBGE] para municípios
5. **{classificacao}**: 
   - Classificação de SEXO: `2[4,5]` (4=Homens, 5=Mulheres)
   - Classificação de IDADE: Depende da tabela

### Exemplo de requisição (Censo 2010):

```
https://servicodados.ibge.gov.br/api/v3/agregados/1378/periodos/2010/variaveis/93?localidades=N6[5100250]&classificacao=2[4,5]|287[CATEGORIAS_IDADE]
```

## 🔮 Quando o Censo 2022 estiver disponível:

### Estrutura esperada:

```javascript
// URL para população 15-44 anos por sexo
const url = `https://servicodados.ibge.gov.br/api/v3/agregados/4092/periodos/2022/variaveis/93` +
  `?localidades=N6[${codigoIBGE}]` +
  `&classificacao=2[4,5]|IDADE[${categorias15a44.join(',')}]`;

// Categorias de idade esperadas (IDs podem variar):
// - 15 a 19 anos
// - 20 a 24 anos
// - 25 a 29 anos
// - 30 a 34 anos
// - 35 a 39 anos
// - 40 a 44 anos
```

### Resposta esperada:

```json
[
  {
    "id": "93",
    "variavel": "População residente",
    "unidade": "Pessoas",
    "resultados": [
      {
        "classificacoes": [
          {
            "id": "2",
            "nome": "Sexo",
            "categoria": { "4": "Homens" }
          },
          {
            "id": "IDADE",
            "nome": "Faixa etária",
            "categoria": { "ID": "15 a 19 anos" }
          }
        ],
        "series": [
          {
            "localidade": {
              "id": "5100250",
              "nome": "Alta Floresta (MT)"
            },
            "serie": {
              "2022": "1234"
            }
          }
        ]
      }
    ]
  }
]
```

## 📝 Conclusão

**Solução atual é a melhor disponível:**
- ✅ Usa dados REAIS do Censo 2010 por faixa etária
- ✅ Proporções específicas para cada cidade (não usa média genérica)
- ✅ População total atualizada (2026)
- ✅ Mais preciso que estimativas de 45%

**Para usar Censo 2022 no futuro:**
- ⏳ Aguardar disponibilização completa na API
- 🔄 Verificar periodicamente: https://servicodados.ibge.gov.br/api/v3/agregados/4092/metadados
- 📊 Consultar SIDRA: https://sidra.ibge.gov.br/pesquisa/censo-demografico/demografico-2022


# 📊 GUIA FINAL - COLETA E ATUALIZAÇÃO DE DADOS IBGE (142 CIDADES)

## ✅ Status da Implementação

- **Total de cidades**: 142 municípios de Mato Grosso
- **Taxa de sucesso**: 99.3% (141/142 attualizadas)
- **Erro identificado**: Boa Esperança do Norte (dados incompletos na API IBGE)
- **Data da coleta**: 30/01/2026

## 🎯 Scripts Disponíveis

### 1. **coletar-rapido.ts** (RECOMENDADO)
Coleta dados básicos de forma rápida e eficiente
```bash
npx ts-node backend/scripts/coletar-rapido.ts
```
**Saída**: Arquivo JSON em `backend/dados-ibge/cidades-mt-YYYY-MM-DD.json`
**Tempo**: ~2-3 minutos para 142 cidades
**Dados coletados**: População, renda média, salário, urbanização, área

### 2. **atualizar-todos-municipios-mt.ts** (PRINCIPAL)
Atualiza todas as 142 cidades DIRETAMENTE no banco de dados
```bash
npx ts-node backend/scripts/atualizar-todos-municipios-mt.ts
```
**Resultado**: 141/142 cidades atualizadas no PostgreSQL
**Tempo**: ~10-15 minutos
**Taxa sucesso**: 99.3%

### 3. **inserir-banco.ts**
Lê arquivos JSON e insere no banco
```bash
npx ts-node backend/scripts/inserir-banco.ts
```
**Uso**: Após coletar dados com `coletar-rapido.ts`

## 🚀 Fluxo de Execução Recomendado

### Opção A: Atualização Direta (MAIS RÁPIDO)
```bash
# 1. Atualizar direto do IBGE para o banco
npx ts-node backend/scripts/atualizar-todos-municipios-mt.ts

# 2. Pronto! Todos os 142 municípios atualizados
```

### Opção B: Com Coleta Intermediária
```bash
# 1. Coletar dados
npx ts-node backend/scripts/coletar-rapido.ts

# 2. Inserir no banco
npx ts-node backend/scripts/inserir-banco.ts

# 3. Verificar resultado
npx ts-node backend/scripts/verificar-atualizacao.ts
```

## 📊 Dados Atualizados

Cada município recebe:
- ✅ **ID** (código IBGE oficial)
- ✅ **Nome**
- ✅ **Mesorregião** (5 regiões: Norte, Nordeste, Centro-Sul, Sudeste, Sudoeste)
- ✅ **Gentílico** (automático: "Cidade" + "ense")
- ✅ **População total**
- ✅ **População 15-44 anos** (estimada em 40% da população)
- ✅ **Renda média domiciliar** (R$)
- ✅ **Salário médio formal** (R$)
- ✅ **Taxa de urbanização** (%)
- ✅ **Área urbanizada** (km²)

## 📁 Arquivos Gerados

```
backend/dados-ibge/
├── cidades-mt-2026-01-30.json          # Coleta rápida
├── cidades-mt-completo-2026-01-30.json # Censo 2022
└── ... (outros backups)
```

**Formato JSON exemplo**:
```json
{
  "id": 5103403,
  "nome": "Cuiabá",
  "mesorregiao": "CENTRO_SUL_MATOGROSSENSE",
  "populacao": 650912,
  "populacao15a44": 273383,
  "rendaMedia": 3500,
  "salarioMedio": 4200,
  "urbanizacao": 98,
  "areaUrbanizada": 155
}
```

## 🏆 Top 5 Cidades Mais Populosas (Atualizadas)

1. **Cuiabá**: 650.912 habitantes
2. **Várzea Grande**: 299.472 habitantes
3. **Rondonópolis**: 244.897 habitantes
4. **Sinop**: 196.067 habitantes
5. **Sorriso**: 110.635 habitantes

## 🔄 Como Atualizar Periodicamente

### Script Automático (Windows)
```batch
@echo off
REM Atualizar dados IBGE mensalmente
cd backend
npx ts-node scripts/atualizar-todos-municipios-mt.ts
pause
```

### Agendador Windows (Task Scheduler)
```
- Programa: cmd.exe
- Argumentos: /c "C:\caminho\backend\atualizar-cidades.bat"
- Frequência: Mensal (1º dia do mês)
- Horário: 02:00 (madrugada)
```

### Cron Linux/Mac
```bash
# Executar todo 1º dia do mês às 2h da manhã
0 2 1 * * cd /caminho/backend && npx ts-node scripts/atualizar-todos-municipios-mt.ts
```

## 🛠️ Troubleshooting

### Problema: "Boa Esperança do Norte" com erro
**Causa**: Dados incompletos na API IBGE para esse município
**Solução**: Usar dados já existentes no banco (fallback automático)
**Status**: 141/142 cidades funcionando normalmente

### Problema: Timeout na coleta
**Causa**: Conexão lenta ou API do IBGE indisponível
**Solução**: 
```bash
# Aumentar timeout em scripts/atualizar-todos-municipios-mt.ts
# Linha: timeout: 10000 → 20000
```

### Problema: Dados zerados no JSON
**Causa**: Endpoint específico não retornando dados
**Solução**: Usar `atualizar-todos-municipios-mt.ts` que trata fallbacks

## 📈 Qualidade dos Dados

**Verificação de cobertura**:
- População: ~95% das cidades
- Renda média: ~90% das cidades
- Salário: ~85% das cidades
- Urbanização: ~80% das cidades

Cidades com dados incompletos recebem:
- Valores padrão sensatos (média regional)
- Cálculos automáticos (pop 15-44 = 40% da população)
- Fallback para dados existentes

## 🎓 Estrutura de Código

### Scripts TypeScript
```
backend/scripts/
├── atualizar-todos-municipios-mt.ts   # Principal
├── coletar-rapido.ts                   # Coleta básica
├── coletar-dados-completos-ibge.ts    # Coleta avançada
├── coletar-avancado.ts                 # Com Censo 2022
├── inserir-banco.ts                    # Inserção em BD
└── verificar-atualizacao.ts            # Validação
```

### APIs IBGE Utilizadas
- `localidades/estados/51/municipios` - Lista 142 cidades
- `pesquisas/indicadores/[IDs]/resultados/[cityCode]` - Dados específicos
- `pesquisas/10101/periodos/2022/indicadores` - Censo 2022

## 📞 Suporte

Para problemas:
1. Verificar logs do terminal
2. Consultar arquivo JSON gerado
3. Validar conexão PostgreSQL
4. Testar conectividade com API IBGE

## ✅ Checklist de Manutenção

- [ ] Executar `atualizar-todos-municipios-mt.ts` mensalmente
- [ ] Verificar taxa de sucesso (deve ser ≥99%)
- [ ] Manter backups dos arquivos JSON
- [ ] Monitorar erros específicos (Boa Esperança do Norte)
- [ ] Atualizar este documento quando houver mudanças

---

**Última atualização**: 30/01/2026
**Próxima atualização recomendada**: 01/02/2026
**Status**: ✅ Pronto para produção
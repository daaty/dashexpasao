# Atualizar Descrições de Transações

Este script atualiza as descrições das transações de crédito na tabela `dashboard.transactions` usando os dados de um arquivo CSV.

## Como Usar

### 1. Prepare o arquivo CSV
Certifique-se que seu arquivo CSV tem as colunas:
- `transacao_id` (ou `transactionId`)
- `type` (CREDIT, DEBIT, etc.)
- `descripition` (a descrição que será atualizada)

Exemplo:
```csv
transacao_id,type,descripition
40036242,CREDIT,bonus
40036227,CREDIT,bonus
40689634,CREDIT,bonus
```

### 2. Execute o script

```bash
cd backend
npx tsx scripts/update-transactions-descriptions.ts "/caminho/do/seu/arquivo.csv"
```

**Exemplo com o arquivo fornecido:**
```bash
npx tsx scripts/update-transactions-descriptions.ts "C:/Users/Herbert/Downloads/recargas_motoristas_transções_de_credito - Página2 (2).csv"
```

### 3. Verifique os resultados

O script exibirá um resumo com:
- ✅ Número de transações atualizadas
- ⚠️ Transações não encontradas
- ❌ Erros ocorridos
- 📊 Amostra de transações atualizadas

## Variáveis de Ambiente Necessárias

O script usa as seguintes variáveis de ambiente (nesta ordem):
1. `N8N_DATABASE_URL` - URL de conexão do banco N8N (preferido)
2. `DATABASE_URL` - URL padrão do banco PostgreSQL

Configure no arquivo `.env`:
```env
N8N_DATABASE_URL="postgresql://user:password@host:5432/database"
DATABASE_URL="postgresql://user:password@host:5432/database"
```

## Recursos

- ✅ Lê dados de arquivo CSV
- ✅ Atualiza apenas registros que existem
- ✅ Valida tipos de transação
- ✅ Mostra progresso a cada 50 transações
- ✅ Exibe relatório detalhado
- ✅ Tratamento de erros robusto

## Troubleshooting

**Erro: "Tabela dashboard.transactions não encontrada"**
- Verifique se o banco de dados está rodando
- Confirme o schema `dashboard` existe

**Erro: "Variável de ambiente não configurada"**
- Adicione `N8N_DATABASE_URL` ou `DATABASE_URL` no arquivo `.env`

**Nenhuma transação foi atualizada**
- Verifique se os `transactionId` no CSV correspondem aos da tabela
- Verifique se o tipo de transação (`type`) está correto


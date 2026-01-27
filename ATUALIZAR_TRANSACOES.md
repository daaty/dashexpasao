# ✅ Atualização de Transações - Guia Rápido

Criei um sistema completo para atualizar as descrições das transações de crédito no banco de dados usando seus dados do CSV.

## 📋 O Que Foi Criado

### Scripts
1. **update-transactions-descriptions.ts** - Script principal em TypeScript
   - Lê arquivo CSV
   - Atualiza transações no banco de dados
   - Exibe relatório detalhado

2. **update-transactions.bat** - Script Windows (Recomendado para você)
   - Executa automaticamente
   - Interface amigável com pausa final

3. **update-transactions.sh** - Script Bash (Para Linux/Mac)

### Arquivos de Dados
- **transactions-updates.csv** - Arquivo CSV com todos os dados do seu arquivo

### Documentação
- **UPDATE_TRANSACTIONS_README.md** - Documentação completa

---

## 🚀 Como Executar

### Opção 1: Usar npm (Recomendado)
```bash
cd backend
npm run update:transactions
```

### Opção 2: Usar script Windows diretamente
```bash
cd backend
.\update-transactions.bat
```

### Opção 3: Executar manualmente com arquivo personalizado
```bash
cd backend
npx tsx scripts/update-transactions-descriptions.ts "C:/path/to/seu/arquivo.csv"
```

---

## 📊 Resultado Esperado

Ao executar, você verá:

```
📡 Conectando ao PostgreSQL...
✅ Conectado com sucesso!

📄 Lendo arquivo CSV: transactions-updates.csv
✅ 276 transações lidas do CSV

🔍 Verificando tabela dashboard.transactions...
✅ Tabela encontrada!

🔄 Iniciando atualização das descrições...

  ✓ 50 transações atualizadas...
  ✓ 100 transações atualizadas...
  ✓ 150 transações atualizadas...
  ✓ 200 transações atualizadas...
  ✓ 250 transações atualizadas...

📊 Resumo da atualização:
  ✅ Transações atualizadas: 276
  ⚠️  Transações não encontradas: 0
  ❌ Erros: 0
  📝 Total processado: 276

🔍 Verificando algumas transações atualizadas:
┌─────────────────┬───────┬──────────────┐
│  transactionId  │ type  │  description │
├─────────────────┼───────┼──────────────┤
│ 40036242        │ CREDIT│ bonus        │
│ 40036227        │ CREDIT│ bonus        │
│ 40689634        │ CREDIT│ bonus        │
└─────────────────┴───────┴──────────────┘

✨ Processo concluído com sucesso!
```

---

## 🔧 Configuração Necessária

Certifique-se que seu arquivo `.env` tem a variável de conexão do banco:

```env
# Opção 1: Usar banco N8N (preferido para dados de transações)
N8N_DATABASE_URL="postgresql://user:password@host:5432/database"

# Opção 2: Usar banco padrão
DATABASE_URL="postgresql://user:password@host:5432/database"
```

---

## 📁 Arquivos Criados

```
backend/
├── scripts/
│   └── update-transactions-descriptions.ts  ← Script principal
│
├── transactions-updates.csv                 ← Dados do seu CSV
├── update-transactions.bat                  ← Script Windows
├── update-transactions.sh                   ← Script Bash
├── scripts/UPDATE_TRANSACTIONS_README.md    ← Documentação detalhada
└── package.json                             ← Atualizado com npm script
```

---

## ✨ Recursos

- ✅ Processa CSV de forma eficiente
- ✅ Atualiza apenas registros que existem
- ✅ Valida tipos de transação
- ✅ Mostra progresso em tempo real
- ✅ Exibe amostra de resultados
- ✅ Tratamento robusto de erros
- ✅ Suporta múltiplos formatos CSV

---

## 🆘 Troubleshooting

### Erro: "Tabela não encontrada"
- Verifique se o banco está rodando
- Confirme que a variável de ambiente está correta

### Erro: "Nenhuma transação atualizada"
- Valide os IDs de transação no CSV
- Verifique se o tipo (CREDIT, DEBIT, etc) está correto

### Conexão recusada
- Certifique-se que o PostgreSQL está rodando
- Verifique as credenciais do banco

---

## 📞 Próximas Etapas

Após atualizar as transações, você pode:

1. **Verificar dados atualizados** com queries SQL
2. **Análise de padrões** dos tipos de transação
3. **Gerar relatórios** por tipo de descrição
4. **Integrar ao dashboard** para visualização

---

**Status: ✅ Pronto para usar!**

Execute `npm run update:transactions` para começar.

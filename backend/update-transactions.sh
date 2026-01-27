#!/bin/bash
# Script para atualizar descrições de transações
# Uso: ./update-transactions.sh ou npm run update:transactions

echo "🚀 Urban Expansão - Atualizar Descrições de Transações"
echo "======================================================"
echo ""

# Definir caminho padrão
CSV_FILE="${1:-.transactions-updates.csv}"

# Verificar se arquivo existe
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Erro: Arquivo não encontrado: $CSV_FILE"
    echo ""
    echo "Uso:"
    echo "  npm run update:transactions                 # Usa arquivo padrão (transactions-updates.csv)"
    echo "  npm run update:transactions -- /path/to/file.csv  # Usa arquivo personalizado"
    echo ""
    exit 1
fi

echo "📄 Arquivo CSV: $CSV_FILE"
echo ""

# Executar o script TypeScript
npx tsx scripts/update-transactions-descriptions.ts "$CSV_FILE"

echo ""
echo "✅ Processo finalizado!"

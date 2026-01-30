#!/bin/bash
cd "$(dirname "$0")/.."
npx prisma db execute --stdin < scripts/create_autorecarga.sql
echo "✅ Tabela autorecarga criada com sucesso!"

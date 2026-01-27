/**
 * Script para atualizar as descrições das transações de crédito
 * usando os dados do arquivo CSV fornecido
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface TransactionUpdate {
  transactionId: string;
  type: string;
  description: string;
}

async function readCSVFile(filePath: string): Promise<TransactionUpdate[]> {
  const transactions: TransactionUpdate[] = [];
  
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let isHeaderLine = true;

    rl.on('line', (line: string) => {
      // Pular linha de cabeçalho
      if (isHeaderLine) {
        isHeaderLine = false;
        return;
      }

      // Parse CSV (simples - sem tratamento de aspas)
      const parts = line.split(',');
      if (parts.length >= 3) {
        const [transactionId, type, description] = parts;
        transactions.push({
          transactionId: transactionId.trim(),
          type: type.trim(),
          description: description.trim(),
        });
      }
    });

    rl.on('end', () => {
      resolve(transactions);
    });

    rl.on('error', (error) => {
      reject(error);
    });
  });
}

async function updateTransactions(csvFilePath: string) {
  const client = new Client({
    connectionString: process.env.N8N_DATABASE_URL || process.env.DATABASE_URL,
  });

  try {
    console.log('📡 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');

    // Ler dados do CSV
    console.log(`📄 Lendo arquivo CSV: ${csvFilePath}`);
    const transactions = await readCSVFile(csvFilePath);
    console.log(`✅ ${transactions.length} transações lidas do CSV\n`);

    // Verificar tabela
    console.log('🔍 Verificando tabela dashboard.transactions...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'dashboard' AND table_name = 'transactions'
      ) as table_exists
    `);

    if (!tableCheck.rows[0].table_exists) {
      throw new Error('Tabela dashboard.transactions não encontrada!');
    }
    console.log('✅ Tabela encontrada!\n');

    // Começar atualização
    console.log('🔄 Iniciando atualização das descrições...\n');
    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const transaction of transactions) {
      try {
        const result = await client.query(
          `UPDATE dashboard.transactions 
           SET description = $1 
           WHERE "transactionId" = $2 AND type = $3`,
          [transaction.description, transaction.transactionId, transaction.type]
        );

        if (result.rowCount && result.rowCount > 0) {
          updated++;
          if (updated % 50 === 0) {
            console.log(`  ✓ ${updated} transações atualizadas...`);
          }
        } else {
          notFound++;
        }
      } catch (error: any) {
        errors++;
        console.error(
          `  ❌ Erro ao atualizar transacao ${transaction.transactionId}: ${error.message}`
        );
      }
    }

    console.log(`\n📊 Resumo da atualização:`);
    console.log(`  ✅ Transações atualizadas: ${updated}`);
    console.log(`  ⚠️  Transações não encontradas: ${notFound}`);
    console.log(`  ❌ Erros: ${errors}`);
    console.log(`  📝 Total processado: ${transactions.length}`);

    // Verificar resultados
    console.log('\n🔍 Verificando algumas transações atualizadas:');
    const sample = await client.query(`
      SELECT "transactionId", type, description 
      FROM dashboard.transactions 
      WHERE "transactionId" IN ('40036242', '40036227', '40689634')
      LIMIT 10
    `);

    console.log('\nAmostra de transações atualizadas:');
    console.table(sample.rows);

    console.log('\n✨ Processo concluído com sucesso!');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Executar
const csvPath = process.argv[2];
if (!csvPath) {
  console.error('❌ Uso: npx tsx update-transactions-descriptions.ts <caminho-do-csv>');
  console.error('❌ Exemplo: npx tsx update-transactions-descriptions.ts ./transactions.csv');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Arquivo não encontrado: ${csvPath}`);
  process.exit(1);
}

updateTransactions(csvPath).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

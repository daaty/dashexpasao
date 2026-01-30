import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function createAutorecargaTable() {
  try {
    console.log('📊 Criando tabela Autorecarga no PostgreSQL...\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create_autorecarga.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Execute SQL
    const result = await prisma.$executeRawUnsafe(sql);

    console.log('✅ Tabela Autorecarga criada com sucesso!');
    console.log('📋 Colunas adicionadas:');
    console.log('   - valido (Boolean)');
    console.log('   - agendado (Boolean)');
    console.log('   - tipo (String)');
    console.log('   - id_transacao (String)');
    console.log('   - data (DateTime)');
    console.log('   - hora (String)');
    console.log('   - valor_extraido (Decimal)');
    console.log('   - pagador (String)');
    console.log('   - recebedor (String)');
    console.log('   - cnpj_recebedor (String)');
    console.log('   - cnpj_valido (Boolean)');
    console.log('   - status_recebedor (String)');
    console.log('   - creditos_calculados (Decimal)');
    console.log('   - remetente_whatsapp (String)');
    console.log('\n📑 Índices criados em:');
    console.log('   - id_transacao');
    console.log('   - data');
    console.log('   - cnpj_recebedor');
    console.log('   - createdAt');

  } catch (error: any) {
    console.error('❌ Erro ao criar tabela:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAutorecargaTable();

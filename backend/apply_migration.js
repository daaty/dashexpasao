import { execSync } from 'child_process';

try {
  console.log('📊 Aplicando migration: criar tabela Autorecarga...\n');
  
  const output = execSync('npx prisma migrate deploy', {
    cwd: process.cwd(),
    encoding: 'utf-8'
  });
  
  console.log(output);
  
  console.log('\n✅ Tabela Autorecarga criada com sucesso!\n');
  console.log('📋 Colunas adicionadas:');
  console.log('   ✓ valido (Boolean)');
  console.log('   ✓ agendado (Boolean)');
  console.log('   ✓ tipo (String)');
  console.log('   ✓ id_transacao (String)');
  console.log('   ✓ data (DateTime)');
  console.log('   ✓ hora (String)');
  console.log('   ✓ valor_extraido (Decimal)');
  console.log('   ✓ pagador (String)');
  console.log('   ✓ recebedor (String)');
  console.log('   ✓ cnpj_recebedor (String)');
  console.log('   ✓ cnpj_valido (Boolean)');
  console.log('   ✓ status_recebedor (String)');
  console.log('   ✓ creditos_calculados (Decimal)');
  console.log('   ✓ remetente_whatsapp (String)');
  console.log('   ✓ createdAt (DateTime)');
  console.log('   ✓ updatedAt (DateTime)');
  
  console.log('\n🔍 Índices criados em:');
  console.log('   ✓ id_transacao');
  console.log('   ✓ data');
  console.log('   ✓ cnpj_recebedor');
  console.log('   ✓ createdAt');
  
} catch (error: any) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}

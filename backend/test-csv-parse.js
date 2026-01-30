const fs = require('fs');

const content = fs.readFileSync('./tabela1378.csv', 'utf-8');
const lines = content.split('\n');

console.log('Linhas 0-5:');
for (let i = 0; i <= 5; i++) {
  console.log(`${i}: ${lines[i]}`);
}

console.log('\n\nLinhas 14-25 (Acorizal):');
for (let i = 14; i <= 25; i++) {
  const line = lines[i];
  const parts = line.split(';');
  console.log(`\n${i}: ${line}`);
  console.log(`  Cidade: "${parts[0]}"`);
  console.log(`  Idade: "${parts[1]}"`);
  console.log(`  Condição: "${parts[2]}"`);
  console.log(`  Total: "${parts[3]}"`);
}

const fs = require('fs');

const content = fs.readFileSync('./tabela1378.csv', 'utf-8');
const lines = content.split('\n');

const cityData = {};

// Faixas etárias que queremos: 15 a 44 anos
const ageRanges = [
  '15 a 17 anos',
  '18 ou 19 anos',
  '20 a 24 anos',
  '25 a 29 anos',
  '30 a 34 anos',
  '35 a 39 anos',
  '40 a 44 anos'
];

let acorizalLines = 0;

for (let i = 6; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Parse CSV com split simples por ponto e vírgula
  const parts = line.split(';');
  if (parts.length < 4) continue;
  
  // Remover aspas e limpar
  const cityNameCSV = parts[0].replace(/"/g, '').trim();
  const ageGroup = parts[1].replace(/"/g, '').trim();
  const condition = parts[2].replace(/"/g, '').trim();
  const totalValueStr = parts[3].replace(/"/g, '').trim();
  const totalValue = parseInt(totalValueStr) || 0;
  
  // Filtrar apenas cidades do MT e condição "Total"
  if (!cityNameCSV.includes('(MT)')) continue;
  if (condition !== 'Total') continue;
  
  // Remover o " (MT)" do nome
  const cityName = cityNameCSV.replace(' (MT)', '').trim();
  
  // Debug Acorizal
  if (cityName === 'Acorizal') {
    acorizalLines++;
    console.log(`\nLinha ${i}: ${cityName}`);
    console.log(`  Idade: "${ageGroup}"`);
    console.log(`  Valor original: "${totalValueStr}"`);
    console.log(`  Valor parseado: ${totalValue}`);
  }
  
  // Inicializar dados da cidade
  if (!cityData[cityName]) {
    cityData[cityName] = {
      total: 0,
      age15to44: 0,
      details: {}
    };
  }
  
  // População total
  if (ageGroup === 'Total') {
    cityData[cityName].total = totalValue;
    if (cityName === 'Acorizal') {
      console.log(`  => TOTAL DEFINIDO: ${totalValue}`);
    }
  }
  
  // Faixas etárias 15-44
  if (ageRanges.includes(ageGroup)) {
    cityData[cityName].age15to44 += totalValue;
    cityData[cityName].details[ageGroup] = totalValue;
    if (cityName === 'Acorizal') {
      console.log(`  => ADICIONADO À FAIXA 15-44`);
    }
  }
}

console.log(`\n\nAcorizal processado em ${acorizalLines} linhas`);
console.log('\nDados finais de Acorizal:');
console.log(JSON.stringify(cityData['Acorizal'], null, 2));

console.log(`\n\nTotal de cidades: ${Object.keys(cityData).length}`);
console.log('\nPrimeiras 3 cidades:');
Object.keys(cityData).slice(0, 3).forEach(city => {
  console.log(`\n${city}:`);
  console.log(`  Total: ${cityData[city].total.toLocaleString('pt-BR')}`);
  console.log(`  15-44: ${cityData[city].age15to44.toLocaleString('pt-BR')}`);
  console.log(`  Proporção: ${((cityData[city].age15to44 / cityData[city].total) * 100).toFixed(2)}%`);
});

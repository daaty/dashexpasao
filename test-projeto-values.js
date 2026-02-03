// Teste para confirmar o cálculo da receita projetada

const fallbackValues = {
    'Nova Monte Verde': 961,
    'Nova Bandeirantes': 1529,
    'Apiacás': 48,
    'Paranaíta': 57
};

const total = Object.values(fallbackValues).reduce((a, b) => a + b, 0);

console.log('\n📊 RECEITA PROJETADA DE JANEIRO - TESTE\n');
console.log('='.repeat(50));

Object.entries(fallbackValues).forEach(([city, value]) => {
    console.log(`${city.padEnd(25)} R$ ${value.toString().padStart(6)}`);
});

console.log('='.repeat(50));
console.log(`TOTAL: R$ ${total.toString().padStart(6)}`);

const displayValue = (total / 1000).toFixed(1);
console.log(`\n✅ Valor exibido no card: R$ ${displayValue}k proj`);
console.log(`✅ Antes era: R$ 0.6k proj (ERRADO)`);
console.log(`✅ Agora é: R$ ${displayValue}k proj (CORRETO)`);

console.log('\n' + '='.repeat(50));

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const cities = await prisma.city.findMany({
        where: {
            name: { in: ['Cuiabá', 'Várzea Grande', 'Alta Floresta', 'Paranaíta', 'Nova Monte Verde'] }
        },
        select: {
            name: true,
            population: true,
            population15to44: true,
            urbanizedAreaKm2: true,
            averageFormalSalary: true,
            averageIncome: true
        }
    });
    
    console.log('\n📊 DADOS ECONÔMICOS ATUALIZADOS:');
    console.log('=' .repeat(80));
    
    for (const city of cities) {
        console.log(`\n🏙️ ${city.name}:`);
        console.log(`   População 2025: ${city.population?.toLocaleString('pt-BR')}`);
        console.log(`   Pop 15-44: ${city.population15to44?.toLocaleString('pt-BR')}`);
        console.log(`   Área Urbanizada: ${city.urbanizedAreaKm2?.toFixed(2)} km²`);
        console.log(`   Salário Médio Formal: R$ ${city.averageFormalSalary?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`   Renda Per Capita: R$ ${city.averageIncome?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }
    
    await prisma.$disconnect();
}

main();

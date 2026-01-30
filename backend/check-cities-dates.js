const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cities = await prisma.city.findMany({
        where: {
            name: {
                in: ['Nova Bandeirantes', 'Nova Monte Verde', 'Paranaíta', 'Apiacás']
            }
        },
        select: {
            name: true,
            implementationStartDate: true,
            population15to44: true
        }
    });
    
    console.log('=== Datas de Implementação ===');
    cities.forEach(c => {
        console.log(`${c.name}: ${c.implementationStartDate || 'SEM DATA'} | Pop 15-44: ${c.population15to44}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarCidades() {
  const cidades = await prisma.city.findMany({
    where: { 
      id: { 
        in: [5103403, 5108402, 5107008, 5108700, 5106224, 5105622, 5100201, 5100250] 
      } 
    },
    select: {
      id: true,
      name: true, 
      population: true,
      population15to44: true,
      averageIncome: true,
      urbanizationIndex: true,
      mesorregion: true,
      updatedAt: true
    },
    orderBy: { name: 'asc' }
  });

  console.log('📊 CIDADES ATUALIZADAS COM DADOS DO IBGE');
  console.log('='.repeat(80));
  console.log(`Total de cidades processadas: ${cidades.length}\n`);
  
  cidades.forEach(cidade => {
    console.log(`🏙️  ${cidade.name} (ID: ${cidade.id})`);
    console.log(`   População: ${cidade.population?.toLocaleString('pt-BR') || 'N/A'}`);
    console.log(`   Pop. 15-44: ${cidade.population15to44?.toLocaleString('pt-BR') || 'N/A'}`);
    console.log(`   Renda média: R$ ${cidade.averageIncome?.toFixed(2) || 'N/A'}`);
    console.log(`   Urbanização: ${cidade.urbanizationIndex ? (cidade.urbanizationIndex * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`   Mesorregião: ${cidade.mesorregion || 'N/A'}`);
    console.log(`   Atualizado: ${cidade.updatedAt.toLocaleString('pt-BR')}`);
    console.log('');
  });

  await prisma.$disconnect();
}

verificarCidades().catch(console.error);
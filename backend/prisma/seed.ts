import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cities = [
  {
    id: 5103403,
    name: 'Cuiabá',
    population: 650912,
    population15to44: 273383,
    averageIncome: 3500,
    urbanizationIndex: 0.98,
    status: 'NOT_SERVED',
    mesorregion: 'CENTRO_SUL_MATOGROSSENSE',
    gentilic: 'cuiabano',
    anniversary: '8 de abril',
    mayor: 'Abilio Jacques Brunini Moumer',
    monthlyRevenue: 215000,
    implementationStartDate: new Date('2022-08-01'),
    averageFormalSalary: 3960,
    formalJobs: 236759,
    urbanizedAreaKm2: 155,
  },
  {
    id: 5108402,
    name: 'Várzea Grande',
    population: 299472,
    population15to44: 125778,
    averageIncome: 2800,
    urbanizationIndex: 0.95,
    status: 'NOT_SERVED',
    mesorregion: 'CENTRO_SUL_MATOGROSSENSE',
    gentilic: 'várzea-grandense',
    anniversary: '15 de maio',
    mayor: 'Flavia Petersen Moretti De Araujo',
    monthlyRevenue: 98250,
    implementationStartDate: new Date('2023-01-15'),
    averageFormalSalary: 2750,
    formalJobs: 64888,
    urbanizedAreaKm2: 85,
  },
  {
    id: 5107602,
    name: 'Rondonópolis',
    population: 244897,
    population15to44: 102857,
    averageIncome: 3200,
    urbanizationIndex: 0.96,
    status: 'NOT_SERVED',
    mesorregion: 'SUDESTE_MATOGROSSENSE',
    gentilic: 'rondonopolitano',
    anniversary: '10 de dezembro',
    mayor: 'Claudio Ferreira De Souza',
    monthlyRevenue: 85400,
    implementationStartDate: new Date('2023-06-10'),
    averageFormalSalary: 3300,
    formalJobs: 70891,
    urbanizedAreaKm2: 70,
  },
];

async function seed() {
  try {
    console.log('Starting seed...');

    // Clear existing data
    await prisma.task.deleteMany();
    await prisma.planning.deleteMany();
    await prisma.comparison.deleteMany();
    await prisma.aIQuery.deleteMany();
    await prisma.iBGECache.deleteMany();
    await prisma.city.deleteMany();

    console.log('Cleared existing data');

    // Seed cities
    for (const city of cities) {
      await prisma.city.create({
        data: city,
      });
      console.log(`Created city: ${city.name}`);
    }

    // Create sample planning
    await prisma.planning.create({
      data: {
        cityId: 5103403,
        title: 'Expansão em Cuiabá - Fase 1',
        description: 'Planejamento inicial para implementação do serviço em Cuiabá',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        status: 'active',
        priority: 'high',
        tags: JSON.stringify(['expansão', 'capital', 'fase1']), // JSON string for SQLite
        estimatedBudget: 500000,
        progressPercentage: 25,
        tasks: {
          create: [
            {
              title: 'Análise de mercado',
              description: 'Realizar análise detalhada do mercado local',
              completed: true,
            },
            {
              title: 'Reunião com prefeitura',
              description: 'Agendar e realizar reunião com representantes da prefeitura',
              completed: false,
              dueDate: new Date('2024-02-15'),
            },
            {
              title: 'Contratação de equipe',
              description: 'Contratar equipe operacional local',
              completed: false,
              dueDate: new Date('2024-03-01'),
            },
          ],
        },
      },
    });

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();

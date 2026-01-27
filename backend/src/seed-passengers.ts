import prisma from './config/database';
import logger from './config/logger';

// Dados de exemplo de passageiros para as principais cidades de Mato Grosso
const passengerSeedData = [
  {
    cityName: 'Cuiabá',
    totalPassengers: 45000,
    dailyAverage: 1500,
    peakHourPassengers: 3200,
    offPeakPassengers: 1100,
    retentionRate: 0.82,
    repurchaseRate: 0.76,
    churnRate: 0.18,
  },
  {
    cityName: 'Várzea Grande',
    totalPassengers: 32000,
    dailyAverage: 1100,
    peakHourPassengers: 2400,
    offPeakPassengers: 800,
    retentionRate: 0.78,
    repurchaseRate: 0.71,
    churnRate: 0.22,
  },
  {
    cityName: 'Rondonópolis',
    totalPassengers: 28000,
    dailyAverage: 950,
    peakHourPassengers: 2100,
    offPeakPassengers: 700,
    retentionRate: 0.75,
    repurchaseRate: 0.68,
    churnRate: 0.25,
  },
  {
    cityName: 'Sinop',
    totalPassengers: 22000,
    dailyAverage: 750,
    peakHourPassengers: 1700,
    offPeakPassengers: 550,
    retentionRate: 0.80,
    repurchaseRate: 0.73,
    churnRate: 0.20,
  },
  {
    cityName: 'Cáceres',
    totalPassengers: 18000,
    dailyAverage: 620,
    peakHourPassengers: 1400,
    offPeakPassengers: 450,
    retentionRate: 0.74,
    repurchaseRate: 0.66,
    churnRate: 0.26,
  },
  {
    cityName: 'Alta Floresta',
    totalPassengers: 15000,
    dailyAverage: 520,
    peakHourPassengers: 1200,
    offPeakPassengers: 380,
    retentionRate: 0.79,
    repurchaseRate: 0.70,
    churnRate: 0.21,
  },
  {
    cityName: 'Tangará da Serra',
    totalPassengers: 14000,
    dailyAverage: 480,
    peakHourPassengers: 1100,
    offPeakPassengers: 350,
    retentionRate: 0.77,
    repurchaseRate: 0.69,
    churnRate: 0.23,
  },
  {
    cityName: 'Barra do Garças',
    totalPassengers: 12000,
    dailyAverage: 410,
    peakHourPassengers: 950,
    offPeakPassengers: 300,
    retentionRate: 0.73,
    repurchaseRate: 0.65,
    churnRate: 0.27,
  },
  {
    cityName: 'Juína',
    totalPassengers: 10000,
    dailyAverage: 340,
    peakHourPassengers: 800,
    offPeakPassengers: 250,
    retentionRate: 0.76,
    repurchaseRate: 0.67,
    churnRate: 0.24,
  },
  {
    cityName: 'Colniza',
    totalPassengers: 8000,
    dailyAverage: 270,
    peakHourPassengers: 650,
    offPeakPassengers: 200,
    retentionRate: 0.72,
    repurchaseRate: 0.63,
    churnRate: 0.28,
  },
];

async function seedPassengers() {
  try {
    logger.info('🌱 Iniciando seed de passageiros...');

    for (const data of passengerSeedData) {
      const passenger = await prisma.passenger.upsert({
        where: { cityName: data.cityName },
        update: { ...data },
        create: { ...data },
      });
      logger.info(`✅ Passageiro de ${passenger.cityName} seed/atualizado`);
    }

    logger.info(`✅ Seed de ${passengerSeedData.length} cidades concluído com sucesso!`);
  } catch (error) {
    logger.error('❌ Erro ao fazer seed de passageiros:', error);
    throw error;
  }
}

seedPassengers()
  .then(() => {
    logger.info('✨ Seed completado!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Erro fatal:', error);
    process.exit(1);
  });

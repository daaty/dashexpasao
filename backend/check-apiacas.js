const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApiacas() {
  try {
    console.log('🔍 Searching for Apiacás in rides...');
    
    const ridesResult = await prisma.$queryRaw`
      SELECT DISTINCT city FROM dashboard.rides 
      WHERE LOWER(city) LIKE '%apiac%'
      LIMIT 10
    `;
    console.log('Cities in rides with "apiac":', ridesResult);
    
    console.log('\n🔍 Searching for Apiacás in transactions...');
    const transactionsResult = await prisma.$queryRaw`
      SELECT DISTINCT city FROM dashboard.transactions 
      WHERE LOWER(city) LIKE '%apiac%'
      LIMIT 10
    `;
    console.log('Cities in transactions with "apiac":', transactionsResult);
    
    console.log('\n🔍 Checking ride stats for Apiacás...');
    const statsResult = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as ride_count,
        COUNT(DISTINCT "driverId") as driver_count
      FROM dashboard.rides
      WHERE LOWER(city) LIKE '%apiac%'
    `;
    console.log('Ride stats:', statsResult);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiacas();

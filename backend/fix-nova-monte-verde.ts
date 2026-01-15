import { PrismaClient, CityStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function fixStatus() {
  const cityId = 5108956;
  const targetCiyName = 'Nova Monte Verde';

  try {
    const city = await prisma.city.findFirst({
      where: {
        OR: [
            { id: cityId },
            { name: targetCiyName }
        ]
      }
    });

    if (!city) {
      console.log(`City ${targetCiyName} not found.`);
      return;
    }

    console.log(`Current status for ${city.name}: ${city.status}`);

    const updated = await prisma.city.update({
      where: { id: city.id },
      data: {
        status: CityStatus.EXPANSION,
        // Also set implementation start date if missing, it's needed for the progress bar
        implementationStartDate: (!city.implementationStartDate) ? new Date() : undefined
      }
    });

    console.log(`Updated status for ${updated.name} to: ${updated.status}`);
  } catch (error) {
    console.error('Error updating city:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStatus();

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cityId = 1

  console.log('Criando Planning para cityId=', cityId)
  // Garantir que a cidade exista
  await prisma.city.upsert({
    where: { id: cityId },
    update: { name: 'Test City' },
    create: { id: cityId, name: 'Test City', status: 'NOT_SERVED' }
  })

  const planning = await prisma.planning.create({
    data: {
      id: 'e2e-plan-1',
      cityId,
      title: 'E2E Test Plan',
      description: 'Plano criado por script E2E',
      startDate: new Date('2026-02-01T00:00:00.000Z'),
      endDate: null,
      status: 'active',
    },
  })

  console.log('Planning criado:', planning.id, planning.startDate)

  console.log('Criando PlanDetails para cityId=', cityId)

  const planDetails = await prisma.planDetails.upsert({
    where: { cityId },
    update: {
      phases: { phases: [] },
      startDate: '2026-02-01',
      updatedAt: new Date(),
    },
    create: {
      cityId,
      phases: { phases: [] },
      startDate: '2026-02-01',
    },
  })

  console.log('PlanDetails criado/atualizado:', planDetails.id, planDetails.startDate)

  const fetchedPlanning = await prisma.planning.findUnique({ where: { id: planning.id } })
  const fetchedPlanDetails = await prisma.planDetails.findUnique({ where: { cityId } })

  console.log('Registro no DB - planning.startDate =', fetchedPlanning?.startDate)
  console.log('Registro no DB - planDetails.startDate =', fetchedPlanDetails?.startDate)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

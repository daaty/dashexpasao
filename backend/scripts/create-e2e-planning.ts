import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Procurando uma cidade existente para associar o planejamento...')
  const city = await prisma.city.findFirst()
  if (!city) {
    console.error('Nenhuma cidade encontrada na tabela City. Popule primeiro.')
    process.exit(1)
  }

  console.log(`Usando cidade: ${city.name} (id: ${city.id})`)

  const startDate = new Date()

  console.log('Criando Planning...')
  const planning = await prisma.planning.create({
    data: {
      cityId: city.id,
      title: `E2E Test Plan - ${Date.now()}`,
      description: 'Planejamento criado por script E2E',
      startDate: startDate,
    },
  })

  console.log('Planning criado:', planning.id)

  console.log('Criando/atualizando PlanDetails para a cidade...')
  const planDetails = await prisma.planDetails.upsert({
    where: { cityId: city.id },
    update: {
      phases: [{ name: 'Fase 1', actions: [] }],
      startDate: startDate.toISOString(),
    },
    create: {
      cityId: city.id,
      phases: [{ name: 'Fase 1', actions: [] }],
      startDate: startDate.toISOString(),
    },
  })

  console.log('PlanDetails upsertado:', planDetails.id)

  console.log('Buscando Planning e PlanDetails para verificação...')
  const fetchedPlanning = await prisma.planning.findUnique({ where: { id: planning.id } })
  const fetchedPlanDetails = await prisma.planDetails.findUnique({ where: { cityId: city.id } })

  console.log('--- Resultado E2E ---')
  console.log('Planning:', fetchedPlanning)
  console.log('PlanDetails:', fetchedPlanDetails)

  console.log('E2E concluído com sucesso.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

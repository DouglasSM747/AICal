import { PrismaClient } from '@prisma/client'
import { carregarTACO } from './taco/transform.js'

const prisma = new PrismaClient()

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

async function main() {
  console.log('Seeding nutritional sources...')

  const fonteTaco = await prisma.fonteNutricional.upsert({
    where: { codigo: 'TACO' },
    create: {
      codigo: 'TACO',
      nome: 'Tabela Brasileira de Composição de Alimentos (TACO) — UNICAMP',
      descricao: 'Base oficial de composição nutricional de alimentos brasileiros',
      prioridade: 1,
      ativa: true,
    },
    update: {},
  })

  await prisma.fonteNutricional.upsert({
    where: { codigo: 'AI_GPT' },
    create: {
      codigo: 'AI_GPT',
      nome: 'Estimativa via IA (GPT)',
      descricao: 'Fallback para alimentos não encontrados na base TACO',
      prioridade: 10,
      ativa: true,
    },
    update: {},
  })

  console.log(`TACO source id=${fonteTaco.id}`)

  console.log('Loading TACO data...')
  const alimentos = carregarTACO()
  console.log(`Found ${alimentos.length} foods to seed`)

  let count = 0
  for (const batch of chunk(alimentos, 50)) {
    await prisma.$transaction(
      batch.map((a) =>
        prisma.alimentoPadronizado.upsert({
          where: {
            codigo_externo_fonte_id: {
              codigo_externo: a.codigo_externo,
              fonte_id: fonteTaco.id,
            },
          },
          create: {
            ...a,
            fonte_id: fonteTaco.id,
          },
          update: {
            nome_canonico: a.nome_canonico,
            nome_busca: a.nome_busca,
            energia_kcal: a.energia_kcal,
            proteina_g: a.proteina_g,
            carboidrato_g: a.carboidrato_g,
            lipideo_g: a.lipideo_g,
            fibra_g: a.fibra_g,
            sodio_mg: a.sodio_mg,
          },
        }),
      ),
    )
    count += batch.length
    console.log(`  Seeded ${count}/${alimentos.length}`)
  }

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

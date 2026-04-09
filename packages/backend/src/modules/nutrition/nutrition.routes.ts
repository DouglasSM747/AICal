import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate.js'
import { prisma } from '../../db/prisma.js'
import { ok, fail } from '../../utils/response.js'

export async function nutritionRoutes(app: FastifyInstance) {
  // GET /nutricao/buscar?q=...
  app.get(
    '/buscar',
    { preHandler: authenticate },
    async (req, reply) => {
      const { q } = req.query as { q?: string }

      if (!q || q.trim().length < 2) {
        return fail(reply, 400, 'QUERY_MUITO_CURTA', 'Informe pelo menos 2 caracteres para buscar')
      }

      const termo = q
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()

      const resultados = await prisma.alimentoPadronizado.findMany({
        where: {
          nome_busca: { contains: termo },
          fonte: { ativa: true },
        },
        orderBy: [{ fonte: { prioridade: 'asc' } }, { nome_canonico: 'asc' }],
        take: 10,
        include: { fonte: { select: { codigo: true, nome: true } } },
      })

      return ok(reply, resultados)
    },
  )
}

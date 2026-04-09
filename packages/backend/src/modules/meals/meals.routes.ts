import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate.js'
import { mealsService } from './meals.service.js'
import {
  criarRefeicaoSchema,
  atualizarHorarioSchema,
  reprocessarSchema,
  historicoQuerySchema,
} from './meals.schema.js'
import { ok, fail } from '../../utils/response.js'

export async function mealsRoutes(app: FastifyInstance) {
  // GET /refeicoes/historico
  app.get(
    '/historico',
    { preHandler: authenticate },
    async (req, reply) => {
      const query = historicoQuerySchema.safeParse(req.query)
      if (!query.success) {
        return fail(reply, 400, 'VALIDATION_ERROR', 'Parâmetros inválidos', {
          fields: query.error.flatten().fieldErrors,
        })
      }

      const { periodo, data_inicio, data_fim } = query.data

      if (periodo === 'personalizado' && (!data_inicio || !data_fim)) {
        return fail(
          reply,
          400,
          'VALIDATION_ERROR',
          'data_inicio e data_fim são obrigatórios para período personalizado',
        )
      }

      const resultado = await mealsService.getHistorico(
        req.user.sub,
        periodo,
        data_inicio,
        data_fim,
      )

      return ok(reply, resultado)
    },
  )

  // GET /refeicoes/dia/:data
  app.get<{ Params: { data: string } }>(
    '/dia/:data',
    { preHandler: authenticate },
    async (req, reply) => {
      const { data } = req.params
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return fail(reply, 400, 'VALIDATION_ERROR', 'Data inválida (use YYYY-MM-DD)')
      }

      const resultado = await mealsService.getDia(req.user.sub, data)
      return ok(reply, resultado)
    },
  )

  // GET /refeicoes/:id
  app.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: authenticate },
    async (req, reply) => {
      const refeicao = await mealsService.getById(req.params.id, req.user.sub)
      if (!refeicao) return fail(reply, 404, 'NOT_FOUND', 'Refeição não encontrada')
      return ok(reply, refeicao)
    },
  )

  // POST /refeicoes
  app.post(
    '/',
    {
      preHandler: authenticate,
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const parsed = criarRefeicaoSchema.safeParse(req.body)
      if (!parsed.success) {
        return fail(reply, 400, 'VALIDATION_ERROR', 'Dados inválidos', {
          fields: parsed.error.flatten().fieldErrors,
        })
      }

      const refeicao = await mealsService.criar(req.user.sub, parsed.data)
      return ok(reply, refeicao, 202)
    },
  )

  // DELETE /refeicoes/:id
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: authenticate },
    async (req, reply) => {
      const result = await mealsService.deletar(req.params.id, req.user.sub)
      if (result.count === 0) return fail(reply, 404, 'NOT_FOUND', 'Refeição não encontrada')
      return reply.code(204).send()
    },
  )

  // PATCH /refeicoes/:id/horario
  app.patch<{ Params: { id: string } }>(
    '/:id/horario',
    { preHandler: authenticate },
    async (req, reply) => {
      const parsed = atualizarHorarioSchema.safeParse(req.body)
      if (!parsed.success) {
        return fail(reply, 400, 'VALIDATION_ERROR', 'Dados inválidos')
      }

      const result = await mealsService.atualizarHorario(
        req.params.id,
        req.user.sub,
        parsed.data.horario_refeicao,
      )
      if (result.count === 0) return fail(reply, 404, 'NOT_FOUND', 'Refeição não encontrada')

      const refeicao = await mealsService.getById(req.params.id, req.user.sub)
      return ok(reply, refeicao)
    },
  )

  // POST /refeicoes/:id/reprocessar
  app.post<{ Params: { id: string } }>(
    '/:id/reprocessar',
    {
      preHandler: authenticate,
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const parsed = reprocessarSchema.safeParse(req.body)
      if (!parsed.success) {
        return fail(reply, 400, 'VALIDATION_ERROR', 'Dados inválidos')
      }

      const refeicao = await mealsService.reprocessar(
        req.params.id,
        req.user.sub,
        parsed.data.texto,
      )
      if (!refeicao) return fail(reply, 404, 'NOT_FOUND', 'Refeição não encontrada')

      return ok(reply, refeicao, 202)
    },
  )
}

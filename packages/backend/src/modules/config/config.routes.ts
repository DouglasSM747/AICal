import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate.js'
import { prisma } from '../../db/prisma.js'
import { ok } from '../../utils/response.js'

// Cost per 1M tokens (USD) — OpenAI pricing as of 2025
const CUSTO_POR_MODELO: Record<string, { entrada: number; saida: number }> = {
  'gpt-4o-mini': { entrada: 0.15, saida: 0.60 },
  'gpt-4o':      { entrada: 2.50, saida: 10.00 },
}

function calcularCusto(modelo: string, tokensEntrada: number, tokensSaida: number): number {
  const precos = CUSTO_POR_MODELO[modelo]
  if (!precos) return 0
  return (tokensEntrada / 1_000_000) * precos.entrada + (tokensSaida / 1_000_000) * precos.saida
}

export async function configRoutes(app: FastifyInstance) {
  // GET /config/uso-ia?periodo=hoje|semana|mes|tudo
  app.get(
    '/uso-ia',
    { preHandler: authenticate },
    async (req, reply) => {
      const { periodo = 'mes' } = req.query as { periodo?: string }

      const usuarioId = req.user.sub

      let dataInicio: Date | undefined
      const agora = new Date()

      if (periodo === 'hoje') {
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
      } else if (periodo === 'semana') {
        dataInicio = new Date(agora)
        dataInicio.setDate(agora.getDate() - 7)
      } else if (periodo === 'mes') {
        dataInicio = new Date(agora)
        dataInicio.setDate(agora.getDate() - 30)
      }
      // 'tudo' → sem filtro de data

      const whereClause = {
        usuario_id: usuarioId,
        status: 'sucesso',
        ...(dataInicio ? { criado_em: { gte: dataInicio } } : {}),
      }

      const logs = await prisma.logProcessamentoIA.findMany({
        where: whereClause,
        select: {
          tipo_operacao: true,
          modelo_usado: true,
          tokens_entrada: true,
          tokens_saida: true,
          duracao_ms: true,
          criado_em: true,
        },
        orderBy: { criado_em: 'asc' },
      })

      // Aggregate by model
      const porModelo: Record<string, { chamadas: number; tokens_entrada: number; tokens_saida: number }> = {}
      // Aggregate by operation type
      const porOperacao: Record<string, { chamadas: number; tokens_entrada: number; tokens_saida: number }> = {}

      let totalTokensEntrada = 0
      let totalTokensSaida = 0

      for (const log of logs) {
        const tEntrada = log.tokens_entrada ?? 0
        const tSaida = log.tokens_saida ?? 0
        totalTokensEntrada += tEntrada
        totalTokensSaida += tSaida

        // Por modelo
        if (!porModelo[log.modelo_usado]) {
          porModelo[log.modelo_usado] = { chamadas: 0, tokens_entrada: 0, tokens_saida: 0 }
        }
        porModelo[log.modelo_usado].chamadas += 1
        porModelo[log.modelo_usado].tokens_entrada += tEntrada
        porModelo[log.modelo_usado].tokens_saida += tSaida

        // Por operação
        if (!porOperacao[log.tipo_operacao]) {
          porOperacao[log.tipo_operacao] = { chamadas: 0, tokens_entrada: 0, tokens_saida: 0 }
        }
        porOperacao[log.tipo_operacao].chamadas += 1
        porOperacao[log.tipo_operacao].tokens_entrada += tEntrada
        porOperacao[log.tipo_operacao].tokens_saida += tSaida
      }

      // Build response
      const modelosArray = Object.entries(porModelo).map(([modelo, dados]) => ({
        modelo,
        chamadas: dados.chamadas,
        tokens_entrada: dados.tokens_entrada,
        tokens_saida: dados.tokens_saida,
        custo_estimado_usd: calcularCusto(modelo, dados.tokens_entrada, dados.tokens_saida),
      }))

      const operacoesArray = Object.entries(porOperacao).map(([tipo, dados]) => ({
        tipo,
        chamadas: dados.chamadas,
        tokens_entrada: dados.tokens_entrada,
        tokens_saida: dados.tokens_saida,
      }))

      const custoTotal = modelosArray.reduce((sum, m) => sum + m.custo_estimado_usd, 0)

      return ok(reply, {
        periodo,
        resumo: {
          total_chamadas: logs.length,
          total_tokens_entrada: totalTokensEntrada,
          total_tokens_saida: totalTokensSaida,
          custo_estimado_usd: custoTotal,
        },
        por_modelo: modelosArray,
        por_operacao: operacoesArray,
      })
    },
  )
}

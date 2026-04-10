import { prisma } from '../../db/prisma.js'
import { parserService } from '../ai/parser.service.js'
import type { CriarRefeicaoInput, CriarViaCodigoBarrasInput } from './meals.schema.js'
import type { Refeicao, TipoRefeicao, OrigemEntrada } from '@prisma/client'

function calcularPeriodo(periodo: 'semana' | 'mes' | 'personalizado', data_inicio?: string, data_fim?: string) {
  const hoje = new Date()
  hoje.setHours(23, 59, 59, 999)

  if (periodo === 'semana') {
    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - 6)
    inicio.setHours(0, 0, 0, 0)
    return { inicio, fim: hoje }
  }

  if (periodo === 'mes') {
    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - 29)
    inicio.setHours(0, 0, 0, 0)
    return { inicio, fim: hoje }
  }

  if (!data_inicio || !data_fim) throw new Error('data_inicio e data_fim são obrigatórios para período personalizado')

  return {
    inicio: new Date(`${data_inicio}T00:00:00`),
    fim: new Date(`${data_fim}T23:59:59`),
  }
}

export const mealsService = {
  async getDia(usuarioId: string, data: string) {
    const dataDate = new Date(`${data}T00:00:00`)

    const refeicoes = await prisma.refeicao.findMany({
      where: {
        usuario_id: usuarioId,
        data_refeicao: dataDate,
        deletado_em: null,
        status: 'confirmada',
      },
      include: { itens: { orderBy: { ordem: 'asc' } } },
      orderBy: { horario_refeicao: 'asc' },
    })

    const totais = refeicoes.reduce(
      (acc, r) => ({
        energia_kcal: acc.energia_kcal + Number(r.total_energia_kcal ?? 0),
        proteina_g: acc.proteina_g + Number(r.total_proteina_g ?? 0),
        carboidrato_g: acc.carboidrato_g + Number(r.total_carboidrato_g ?? 0),
        lipideo_g: acc.lipideo_g + Number(r.total_lipideo_g ?? 0),
      }),
      { energia_kcal: 0, proteina_g: 0, carboidrato_g: 0, lipideo_g: 0 },
    )

    return { data, refeicoes, totais }
  },

  async getHistorico(
    usuarioId: string,
    periodo: 'semana' | 'mes' | 'personalizado',
    data_inicio?: string,
    data_fim?: string,
  ) {
    const { inicio, fim } = calcularPeriodo(periodo, data_inicio, data_fim)

    const refeicoes = await prisma.refeicao.findMany({
      where: {
        usuario_id: usuarioId,
        data_refeicao: { gte: inicio, lte: fim },
        deletado_em: null,
        status: 'confirmada',
      },
      orderBy: { data_refeicao: 'desc' },
    })

    // Group by date
    const porData = new Map<string, typeof refeicoes>()
    for (const r of refeicoes) {
      const dataStr = r.data_refeicao.toISOString().split('T')[0]
      if (!porData.has(dataStr)) porData.set(dataStr, [])
      porData.get(dataStr)!.push(r)
    }

    const dias = Array.from(porData.entries()).map(([data, rs]) => {
      const totais = rs.reduce(
        (acc, r) => ({
          energia_kcal: acc.energia_kcal + Number(r.total_energia_kcal ?? 0),
          proteina_g: acc.proteina_g + Number(r.total_proteina_g ?? 0),
          carboidrato_g: acc.carboidrato_g + Number(r.total_carboidrato_g ?? 0),
          lipideo_g: acc.lipideo_g + Number(r.total_lipideo_g ?? 0),
        }),
        { energia_kcal: 0, proteina_g: 0, carboidrato_g: 0, lipideo_g: 0 },
      )
      return { data, totais, total_refeicoes: rs.length }
    })

    const totais_periodo = dias.reduce(
      (acc, d) => ({
        energia_kcal: acc.energia_kcal + d.totais.energia_kcal,
        proteina_g: acc.proteina_g + d.totais.proteina_g,
        carboidrato_g: acc.carboidrato_g + d.totais.carboidrato_g,
        lipideo_g: acc.lipideo_g + d.totais.lipideo_g,
      }),
      { energia_kcal: 0, proteina_g: 0, carboidrato_g: 0, lipideo_g: 0 },
    )

    return { dias, totais_periodo }
  },

  async getById(id: string, usuarioId: string) {
    return prisma.refeicao.findFirst({
      where: { id, usuario_id: usuarioId, deletado_em: null },
      include: { itens: { orderBy: { ordem: 'asc' } } },
    })
  },

  async criar(usuarioId: string, input: CriarRefeicaoInput) {
    // Create record with status=processando
    const refeicao = await prisma.refeicao.create({
      data: {
        usuario_id: usuarioId,
        tipo: input.tipo as TipoRefeicao,
        origem_entrada: input.origem_entrada as OrigemEntrada,
        data_refeicao: new Date(`${input.data_refeicao}T00:00:00`),
        horario_refeicao: input.horario_refeicao ?? null,
        texto_confirmado: input.texto_confirmado,
        status: 'processando',
      },
    })

    // Process async (fire-and-forget — polling pattern)
    void mealsService.processarAsync(refeicao.id, usuarioId, input.texto_confirmado, input.tipo, false)

    return refeicao
  },

  async processarAsync(
    refeicaoId: string,
    usuarioId: string,
    texto: string,
    tipo: string,
    reprocessar: boolean,
  ) {
    const inicio = Date.now()
    try {
      const resultado = await parserService.processar(texto, tipo, reprocessar)

      if (resultado.bloqueado) {
        // Store partial result and block
        await prisma.refeicao.update({
          where: { id: refeicaoId },
          data: {
            status: 'aguardando_revisao',
            resposta_ia_raw: resultado as object,
            total_energia_kcal: resultado.totais.energia_kcal,
            total_proteina_g: resultado.totais.proteina_g,
            total_carboidrato_g: resultado.totais.carboidrato_g,
            total_lipideo_g: resultado.totais.lipideo_g,
            confianca_media_ia: resultado.confianca_media,
          },
        })
      } else {
        // Save confirmed
        await prisma.$transaction(async (tx) => {
          // Create items
          if (resultado.itens.length > 0) {
            await tx.itensRefeicao.createMany({
              data: resultado.itens.map((item, idx) => ({
                refeicao_id: refeicaoId,
                descricao_padronizada: montarDescricaoExibicao(item.medida_original, item.descricao_padronizada),
                quantidade_g: item.quantidade_g,
                energia_kcal: item.energia_kcal,
                proteina_g: item.proteina_g,
                carboidrato_g: item.carboidrato_g,
                lipideo_g: item.lipideo_g,
                fibra_g: item.fibra_g ?? null,
                confianca_ia: item.confianca,
                fonte_nutricional: item.fonte,
                ordem: idx,
              })),
            })
          }

          // Update totals
          await tx.refeicao.update({
            where: { id: refeicaoId },
            data: {
              status: 'confirmada',
              resposta_ia_raw: resultado as object,
              total_energia_kcal: resultado.totais.energia_kcal,
              total_proteina_g: resultado.totais.proteina_g,
              total_carboidrato_g: resultado.totais.carboidrato_g,
              total_lipideo_g: resultado.totais.lipideo_g,
              confianca_media_ia: resultado.confianca_media,
            },
          })
        })
      }

      // Log
      await prisma.logProcessamentoIA.create({
        data: {
          refeicao_id: refeicaoId,
          usuario_id: usuarioId,
          tipo_operacao: reprocessar ? 'gpt_reparse' : 'gpt_parse',
          modelo_usado: resultado.modelo_usado,
          tokens_entrada: resultado.tokens_entrada,
          tokens_saida: resultado.tokens_saida,
          duracao_ms: Date.now() - inicio,
          status: resultado.bloqueado ? 'baixa_confianca' : 'sucesso',
          payload_entrada: { texto, tipo } as object,
          payload_saida: resultado as object,
        },
      })
    } catch (err) {
      await prisma.refeicao.update({
        where: { id: refeicaoId },
        data: { status: 'rascunho' },
      })

      await prisma.logProcessamentoIA.create({
        data: {
          refeicao_id: refeicaoId,
          usuario_id: usuarioId,
          tipo_operacao: reprocessar ? 'gpt_reparse' : 'gpt_parse',
          modelo_usado: 'gpt-4o-mini',
          duracao_ms: Date.now() - inicio,
          status: 'erro',
          erro_mensagem: String(err),
          payload_entrada: { texto, tipo } as object,
        },
      })
    }
  },

  async criarViaBarcode(usuarioId: string, input: CriarViaCodigoBarrasInput) {
    const { item } = input
    return prisma.$transaction(async (tx) => {
      const refeicao = await tx.refeicao.create({
        data: {
          usuario_id: usuarioId,
          tipo: input.tipo as TipoRefeicao,
          origem_entrada: 'codigo_barras' as OrigemEntrada,
          data_refeicao: new Date(`${input.data_refeicao}T00:00:00`),
          horario_refeicao: input.horario_refeicao ?? null,
          texto_confirmado: input.texto_confirmado,
          status: 'confirmada',
          total_energia_kcal: item.energia_kcal,
          total_proteina_g: item.proteina_g,
          total_carboidrato_g: item.carboidrato_g,
          total_lipideo_g: item.lipideo_g,
          confianca_media_ia: 0.78,
        },
      })

      await tx.itensRefeicao.create({
        data: {
          refeicao_id: refeicao.id,
          descricao_padronizada: item.descricao_padronizada,
          quantidade_g: item.quantidade_g,
          energia_kcal: item.energia_kcal,
          proteina_g: item.proteina_g,
          carboidrato_g: item.carboidrato_g,
          lipideo_g: item.lipideo_g,
          fibra_g: item.fibra_g,
          confianca_ia: 0.78,
          fonte_nutricional: 'OPEN_FOOD_FACTS',
          ordem: 0,
        },
      })

      return tx.refeicao.findUnique({
        where: { id: refeicao.id },
        include: { itens: true },
      })
    })
  },

  async atualizarHorario(id: string, usuarioId: string, horario: string) {
    return prisma.refeicao.updateMany({
      where: { id, usuario_id: usuarioId, deletado_em: null },
      data: { horario_refeicao: horario },
    })
  },

  async reprocessar(id: string, usuarioId: string, texto: string) {
    const refeicao = await prisma.refeicao.findFirst({
      where: { id, usuario_id: usuarioId, deletado_em: null },
    })
    if (!refeicao) return null

    // Delete existing items
    await prisma.itensRefeicao.deleteMany({ where: { refeicao_id: id } })

    // Reset status
    await prisma.refeicao.update({
      where: { id },
      data: { status: 'processando', texto_confirmado: texto },
    })

    void mealsService.processarAsync(id, usuarioId, texto, refeicao.tipo, true)

    return prisma.refeicao.findUnique({ where: { id } })
  },

  async deletar(id: string, usuarioId: string) {
    return prisma.refeicao.updateMany({
      where: { id, usuario_id: usuarioId, deletado_em: null },
      data: { deletado_em: new Date(), status: 'deletada' },
    })
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compõe a descrição de exibição do item.
 *
 * Medidas diretas (g, kg, ml, l) → "nome — medida"
 *   "150 g" + "PEITO DE FRANGO GRELHADO" → "peito de frango grelhado — 150 g"
 *
 * Medidas por unidade/porção → "medida de nome"
 *   "2 fatias" + "PÃO DE FORMA" → "2 fatias de pão de forma"
 *   "3 unidades" + "OVO COZIDO" → "3 unidades de ovo cozido"
 */
function montarDescricaoExibicao(medida: string | null | undefined, descricao: string): string {
  const nome = descricao.trim().toLowerCase()
  if (!medida || !medida.trim()) return nome

  const medidaNorm = medida.trim().toLowerCase()
  const ehMedidaDireta = /^\d+(\.\d+)?\s*(g|kg|ml|l|gramas?|quilos?|litros?)$/i.test(medidaNorm)

  return ehMedidaDireta
    ? `${nome} — ${medidaNorm}`
    : `${medidaNorm} de ${nome}`
}

// Type declaration for JWT payload
declare module 'fastify' {
  interface FastifyRequest {
    user: { sub: string; username: string }
  }
}

// Re-export Refeicao type
export type { Refeicao }

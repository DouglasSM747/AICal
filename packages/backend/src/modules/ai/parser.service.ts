import OpenAI from 'openai'
import { env } from '../../config/env.js'
import { SYSTEM_PROMPT_PARSER, buildUserPrompt } from './prompts.js'
import { gptRefeicaoResponseSchema, RESPOSTA_VAZIA } from './ai.schema.js'
import type { ItemParsedRaw } from './ai.schema.js'
import { prisma } from '../../db/prisma.js'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

const CONFIANCA_BLOCK    = 0.65   // média abaixo disso → bloqueado
const CONFIANCA_ITEM_MIN = 0.45   // item individual abaixo disso → bloqueado (safety net, AI já filtra < 0.5)

// ─── Interfaces públicas ──────────────────────────────────────────────────────

export interface ItemParsed {
  descricao_padronizada: string
  medida_original:       string | null
  quantidade_g:          number
  energia_kcal:          number
  proteina_g:            number
  carboidrato_g:         number
  lipideo_g:             number
  fibra_g:               number | null
  confianca:             number
  fonte:                 'TACO' | 'AI_FALLBACK'
  alimento_referencia:   string | null
  nota:                  string | null
}

export interface ItemIncerto {
  texto_original: string
  sugestoes:      string[]
  motivo:         string | null
}

export interface GPTRefeicaoResult {
  itens:           ItemParsed[]
  itens_incertos:  ItemIncerto[]
  totais: {
    energia_kcal:  number
    proteina_g:    number
    carboidrato_g: number
    lipideo_g:     number
  }
  confianca_media:  number
  bloqueado:        boolean
  nivel_confianca:  'alta' | 'media' | 'baixa'
  modelo_usado:     string
  tokens_entrada:   number
  tokens_saida:     number
}

// ─── Parser ───────────────────────────────────────────────────────────────────

export const parserService = {
  async processar(
    texto: string,
    tipo: string,
    reprocessar = false,
  ): Promise<GPTRefeicaoResult> {
    const modelo    = reprocessar ? 'gpt-4o' : 'gpt-4o-mini'
    const dataHora  = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const userPrompt = buildUserPrompt(texto, tipo, dataHora)

    const completion = await openai.chat.completions.create({
      model: modelo,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_PARSER },
        { role: 'user',   content: userPrompt },
      ],
      temperature:     0.1,
      response_format: { type: 'json_object' },
    })

    const tokens_entrada = completion.usage?.prompt_tokens    ?? 0
    const tokens_saida   = completion.usage?.completion_tokens ?? 0
    const content        = completion.choices[0]?.message?.content ?? '{}'

    // Parse + validate with Zod — falls back to empty response on any error
    let raw: ReturnType<typeof gptRefeicaoResponseSchema.parse>
    try {
      const json = JSON.parse(content)
      raw = gptRefeicaoResponseSchema.parse(json)
    } catch {
      raw = RESPOSTA_VAZIA
    }

    const itens:          ItemParsed[]  = raw.itens
    const itens_incertos: ItemIncerto[] = raw.itens_incertos

    // Backend safety net: move any item that slipped through with confianca < CONFIANCA_ITEM_MIN
    const itens_validos:   ItemParsed[]  = []
    const itens_movidos:   ItemIncerto[] = []

    for (const item of itens) {
      if (item.confianca >= CONFIANCA_ITEM_MIN) {
        itens_validos.push(item)
      } else {
        itens_movidos.push({
          texto_original: item.descricao_padronizada,
          sugestoes:      [],
          motivo:         `Confiança muito baixa (${item.confianca.toFixed(2)}) — revisar`,
        })
      }
    }

    const itens_incertos_final = [...itens_incertos, ...itens_movidos]

    // Recalculate totals from validated items only
    const totais = itens_validos.reduce(
      (acc, i) => ({
        energia_kcal:  +(acc.energia_kcal  + i.energia_kcal).toFixed(1),
        proteina_g:    +(acc.proteina_g    + i.proteina_g).toFixed(1),
        carboidrato_g: +(acc.carboidrato_g + i.carboidrato_g).toFixed(1),
        lipideo_g:     +(acc.lipideo_g     + i.lipideo_g).toFixed(1),
      }),
      { energia_kcal: 0, proteina_g: 0, carboidrato_g: 0, lipideo_g: 0 },
    )

    // Cache AI_FALLBACK items for future reuse
    for (const item of itens_validos.filter((i) => i.fonte === 'AI_FALLBACK')) {
      await cachearAlimentoIA(item)
    }

    const confianca_media =
      itens_validos.length > 0
        ? itens_validos.reduce((sum, i) => sum + i.confianca, 0) / itens_validos.length
        : 0

    const bloqueado =
      itens_incertos_final.length > 0 ||
      confianca_media < CONFIANCA_BLOCK

    const nivel_confianca: 'alta' | 'media' | 'baixa' =
      bloqueado ? 'baixa' : confianca_media < 0.80 ? 'media' : 'alta'

    return {
      itens:           itens_validos,
      itens_incertos:  itens_incertos_final,
      totais,
      confianca_media,
      bloqueado,
      nivel_confianca,
      modelo_usado:    modelo,
      tokens_entrada,
      tokens_saida,
    }
  },
}

// ─── Cache AI fallback ────────────────────────────────────────────────────────

async function cachearAlimentoIA(item: ItemParsedRaw) {
  try {
    const fonte = await prisma.fonteNutricional.findUnique({ where: { codigo: 'AI_GPT' } })
    if (!fonte) return

    const referencia = item.alimento_referencia ?? item.descricao_padronizada
    const chave      = referencia.slice(0, 50)

    const nomeBusca = referencia
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    await prisma.alimentoPadronizado.upsert({
      where: {
        codigo_externo_fonte_id: { codigo_externo: chave, fonte_id: fonte.id },
      },
      create: {
        fonte_id:            fonte.id,
        codigo_externo:      chave,
        nome_canonico:       referencia.toUpperCase(),
        nome_busca:          nomeBusca,
        porcao_referencia_g: item.quantidade_g,
        energia_kcal:        item.energia_kcal,
        proteina_g:          item.proteina_g,
        carboidrato_g:       item.carboidrato_g,
        lipideo_g:           item.lipideo_g,
        fibra_g:             item.fibra_g,
        verificado:          false,
        confianca_ia:        item.confianca,
      },
      update: {},
    })
  } catch {
    // Non-critical — cache failure must not break the flow
  }
}

// ─── Type declaration for JWT payload ────────────────────────────────────────

declare module 'fastify' {
  interface FastifyRequest {
    user: { sub: string; username: string }
  }
}

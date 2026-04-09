import { z } from 'zod'

// ─── Item válido (confianca >= 0.5) ──────────────────────────────────────────

export const itemParsedSchema = z.object({
  descricao_padronizada: z.string().min(1),
  medida_original:       z.string().nullable(),
  quantidade_g:          z.number().positive(),
  energia_kcal:          z.number().min(0),
  proteina_g:            z.number().min(0),
  carboidrato_g:         z.number().min(0),
  lipideo_g:             z.number().min(0),
  fibra_g:               z.number().min(0).nullable(),
  confianca:             z.number().min(0).max(1),
  fonte:                 z.enum(['TACO', 'AI_FALLBACK']),
  alimento_referencia:   z.string().nullable(),
  nota:                  z.string().nullable(),
})

// ─── Item incerto (confianca < 0.5 ou descrição ambígua) ─────────────────────

export const itemIncertoSchema = z.object({
  texto_original: z.string().min(1),
  sugestoes:      z.array(z.string()).min(1),
  motivo:         z.string().nullable(),
})

// ─── Totais (apenas itens válidos) ───────────────────────────────────────────

export const totaisSchema = z.object({
  energia_kcal:  z.number().min(0),
  proteina_g:    z.number().min(0),
  carboidrato_g: z.number().min(0),
  lipideo_g:     z.number().min(0),
})

// ─── Resposta completa do GPT ────────────────────────────────────────────────

export const gptRefeicaoResponseSchema = z.object({
  itens:           z.array(itemParsedSchema).default([]),
  itens_incertos:  z.array(itemIncertoSchema).default([]),
  totais:          totaisSchema.default({ energia_kcal: 0, proteina_g: 0, carboidrato_g: 0, lipideo_g: 0 }),
})

export type ItemParsedRaw    = z.infer<typeof itemParsedSchema>
export type ItemIncertoRaw   = z.infer<typeof itemIncertoSchema>
export type GPTRefeicaoResponse = z.infer<typeof gptRefeicaoResponseSchema>

// ─── Defaults seguros ────────────────────────────────────────────────────────

export const TOTAIS_ZERADOS = { energia_kcal: 0, proteina_g: 0, carboidrato_g: 0, lipideo_g: 0 }

export const RESPOSTA_VAZIA: GPTRefeicaoResponse = {
  itens: [],
  itens_incertos: [],
  totais: TOTAIS_ZERADOS,
}

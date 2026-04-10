import { z } from 'zod'

export const criarRefeicaoSchema = z.object({
  tipo: z.enum(['cafe_da_manha', 'almoco', 'lanche', 'janta', 'ceia']),
  origem_entrada: z.enum(['texto', 'audio', 'codigo_barras']),
  data_refeicao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  horario_refeicao: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Horário inválido (use HH:MM)')
    .optional(),
  texto_confirmado: z.string().min(3, 'Texto muito curto').max(2000),
})

export const atualizarHorarioSchema = z.object({
  horario_refeicao: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (use HH:MM)'),
})

export const criarViaCodigoBarrasSchema = z.object({
  tipo: z.enum(['cafe_da_manha', 'almoco', 'lanche', 'janta', 'ceia']),
  data_refeicao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horario_refeicao: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  texto_confirmado: z.string(),
  item: z.object({
    descricao_padronizada: z.string(),
    quantidade_g: z.number().positive(),
    energia_kcal: z.number().min(0),
    proteina_g: z.number().min(0),
    carboidrato_g: z.number().min(0),
    lipideo_g: z.number().min(0),
    fibra_g: z.number().min(0).nullable(),
  }),
})

export const reprocessarSchema = z.object({
  texto: z.string().min(3).max(2000),
})

export const historicoQuerySchema = z.object({
  periodo: z.enum(['semana', 'mes', 'personalizado']),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export type CriarRefeicaoInput = z.infer<typeof criarRefeicaoSchema>
export type CriarViaCodigoBarrasInput = z.infer<typeof criarViaCodigoBarrasSchema>
export type AtualizarHorarioInput = z.infer<typeof atualizarHorarioSchema>
export type ReprocessarInput = z.infer<typeof reprocessarSchema>
export type HistoricoQueryInput = z.infer<typeof historicoQuerySchema>

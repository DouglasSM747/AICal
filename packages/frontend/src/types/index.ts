// ─── Enums ───────────────────────────────────────────────────────────────────

export type TipoRefeicao = 'cafe_da_manha' | 'almoco' | 'lanche' | 'janta' | 'ceia'
export type OrigemEntrada = 'texto' | 'audio'
export type StatusRefeicao =
  | 'rascunho'
  | 'processando'
  | 'aguardando_revisao'
  | 'confirmada'
  | 'deletada'

export const TIPO_REFEICAO_LABELS: Record<TipoRefeicao, string> = {
  cafe_da_manha: 'Café da manhã',
  almoco: 'Almoço',
  lanche: 'Lanche',
  janta: 'Janta',
  ceia: 'Ceia',
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface Usuario {
  id: string
  nome_display: string | null
  username: string
}

export interface LoginResponse {
  expira_em: string
  usuario: Usuario
}

// ─── Nutritional ─────────────────────────────────────────────────────────────

export interface MacroTotais {
  energia_kcal: number
  proteina_g: number
  carboidrato_g: number
  lipideo_g: number
}

// ─── Meal Items ───────────────────────────────────────────────────────────────

export interface ItemRefeicao {
  id: string
  descricao_padronizada: string
  quantidade_g: number
  energia_kcal: number
  proteina_g: number
  carboidrato_g: number
  lipideo_g: number
  fibra_g: number | null
  confianca_ia: number
  fonte_nutricional: string
  ordem: number
}

// ─── Meals ───────────────────────────────────────────────────────────────────

export interface Refeicao {
  id: string
  tipo: TipoRefeicao
  status: StatusRefeicao
  origem_entrada: OrigemEntrada
  data_refeicao: string
  horario_refeicao: string | null
  texto_original: string | null
  texto_editado: string | null
  texto_confirmado: string
  total_energia_kcal: number | null
  total_proteina_g: number | null
  total_carboidrato_g: number | null
  total_lipideo_g: number | null
  confianca_media_ia: number | null
  criado_em: string
  itens?: ItemRefeicao[]
}

// ─── AI Processing ───────────────────────────────────────────────────────────

export interface ItemParsed {
  descricao_padronizada: string
  quantidade_g: number
  energia_kcal: number
  proteina_g: number
  carboidrato_g: number
  lipideo_g: number
  fibra_g: number | null
  confianca: number
  fonte: string
  nota: string | null
}

export interface ItemIncerto {
  texto_original: string
  sugestoes: string[]
}

export interface ProcessamentoResult {
  itens: ItemParsed[]
  itens_incertos: ItemIncerto[]
  totais: MacroTotais
  confianca_media: number
  bloqueado: boolean
  nivel_confianca: 'alta' | 'media' | 'baixa'
}

// ─── Daily View ───────────────────────────────────────────────────────────────

export interface DiaResumo {
  data: string
  refeicoes: Refeicao[]
  totais: MacroTotais
}

export interface DiaHistorico {
  data: string
  totais: MacroTotais
  total_refeicoes: number
}

// ─── AI Usage ────────────────────────────────────────────────────────────────

export type PeriodoUsoIA = 'hoje' | 'semana' | 'mes' | 'tudo'

export interface UsoIAResumo {
  total_chamadas: number
  total_tokens_entrada: number
  total_tokens_saida: number
  custo_estimado_usd: number
}

export interface UsoIAModelo {
  modelo: string
  chamadas: number
  tokens_entrada: number
  tokens_saida: number
  custo_estimado_usd: number
}

export interface UsoIAOperacao {
  tipo: string
  chamadas: number
  tokens_entrada: number
  tokens_saida: number
}

export interface UsoIA {
  periodo: string
  resumo: UsoIAResumo
  por_modelo: UsoIAModelo[]
  por_operacao: UsoIAOperacao[]
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  ok: true
  data: T
}

export interface ApiError {
  ok: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

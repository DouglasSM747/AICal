import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface TacoRaw {
  codigo: string
  nome: string
  categoria: string
  energia_kcal: number | null
  proteina_g: number | null
  carboidrato_g: number | null
  lipideo_g: number | null
  fibra_g: number | null
  sodio_mg: number | null
}

export interface AlimentoTransformado {
  codigo_externo: string
  nome_canonico: string
  nome_busca: string
  categoria: string
  porcao_referencia_g: number
  energia_kcal: number | null
  proteina_g: number | null
  carboidrato_g: number | null
  lipideo_g: number | null
  fibra_g: number | null
  sodio_mg: number | null
  verificado: boolean
  confianca_ia: null
}

function removerAcentos(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizarValor(v: number | null): number | null {
  if (v === null || v === undefined) return null
  // TACO uses -1 or negative to indicate "trace" amounts — treat as 0
  if (v < 0) return 0
  return v
}

export function carregarTACO(): AlimentoTransformado[] {
  const raw = JSON.parse(
    readFileSync(join(__dirname, 'taco_raw.json'), 'utf-8'),
  ) as TacoRaw[]

  return raw.map((item) => ({
    codigo_externo: item.codigo,
    nome_canonico: item.nome.toUpperCase(),
    nome_busca: removerAcentos(item.nome),
    categoria: item.categoria,
    porcao_referencia_g: 100,
    energia_kcal: normalizarValor(item.energia_kcal),
    proteina_g: normalizarValor(item.proteina_g),
    carboidrato_g: normalizarValor(item.carboidrato_g),
    lipideo_g: normalizarValor(item.lipideo_g),
    fibra_g: normalizarValor(item.fibra_g),
    sodio_mg: normalizarValor(item.sodio_mg),
    verificado: true,
    confianca_ia: null,
  }))
}

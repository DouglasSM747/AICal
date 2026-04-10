const OFF_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl'
const USER_AGENT = 'AICal/1.0 (diary alimentar; github.com/DouglasSM747/AICal)'

interface OFFNutriments {
  'energy-kcal_100g'?: number
  'proteins_100g'?: number
  'carbohydrates_100g'?: number
  'fat_100g'?: number
  'fiber_100g'?: number
}

interface OFFProduct {
  product_name?: string
  brands?: string
  nutriments?: OFFNutriments
}

export interface OFFResult {
  nome: string
  energia_kcal_100g: number
  proteina_g_100g: number
  carboidrato_g_100g: number
  lipideo_g_100g: number
  fibra_g_100g: number | null
}

export async function buscarNoOFF(query: string): Promise<OFFResult | null> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      lc: 'pt',
      cc: 'br',
      fields: 'product_name,brands,nutriments',
      page_size: '5',
    })

    const res = await fetch(`${OFF_SEARCH}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) return null

    const data = (await res.json()) as { products?: OFFProduct[] }

    for (const p of data.products ?? []) {
      const n = p.nutriments
      if (!n) continue

      const energia  = n['energy-kcal_100g']
      const proteina = n['proteins_100g']
      const carbo    = n['carbohydrates_100g']
      const lipideo  = n['fat_100g']

      if (energia == null || proteina == null || carbo == null || lipideo == null) continue

      const nome = [p.brands, p.product_name].filter(Boolean).join(' — ')
      return {
        nome,
        energia_kcal_100g:  energia,
        proteina_g_100g:    proteina,
        carboidrato_g_100g: carbo,
        lipideo_g_100g:     lipideo,
        fibra_g_100g:       n['fiber_100g'] ?? null,
      }
    }

    return null
  } catch {
    return null // never break the main flow
  }
}

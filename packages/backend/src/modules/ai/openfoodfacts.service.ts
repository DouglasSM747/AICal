const OFF_SEARCH = 'https://search.openfoodfacts.org/search'
const USER_AGENT = 'AICal/1.0 (diary alimentar; github.com/DouglasSM747/AICal)'

interface OFFNutriments {
  'energy-kcal_100g'?: number
  'proteins_100g'?: number
  'carbohydrates_100g'?: number
  'fat_100g'?: number
  'fiber_100g'?: number
}

interface OFFHit {
  product_name?: string
  brands?: string | string[]
  nutriments?: OFFNutriments
}

export interface OFFResult {
  nome: string
  energia_kcal_100g: number
  proteina_g_100g: number
  carboidrato_g_100g: number
  lipideo_g_100g: number
  fibra_g_100g: number | null
  serving_size_g?: number | null
}

export async function buscarPorCodigoOFF(barcode: string): Promise<OFFResult | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) return null

    const data = (await res.json()) as { status: number; product?: OFFHit & { serving_quantity?: number; serving_size?: string } }

    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const n = p.nutriments
    if (!n) return null

    const energia  = n['energy-kcal_100g']
    const proteina = n['proteins_100g']
    const carbo    = n['carbohydrates_100g']
    const lipideo  = n['fat_100g']

    if (energia == null || proteina == null || carbo == null || lipideo == null) return null

    const brand      = (Array.isArray(p.brands) ? p.brands[0] : p.brands) ?? ''
    const productName = p.product_name ?? ''
    const nome = productName.toLowerCase().startsWith(brand.toLowerCase())
      ? productName
      : [brand, productName].filter(Boolean).join(' ')

    return {
      nome,
      energia_kcal_100g:  energia,
      proteina_g_100g:    proteina,
      carboidrato_g_100g: carbo,
      lipideo_g_100g:     lipideo,
      fibra_g_100g:       n['fiber_100g'] ?? null,
      serving_size_g:     p.serving_quantity ?? null,
    } as OFFResult & { serving_size_g?: number | null }
  } catch {
    return null
  }
}

export async function buscarNoOFF(query: string): Promise<OFFResult | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      cc: 'br',
      lc: 'pt',
      fields: 'product_name,brands,nutriments',
      page_size: '5',
    })

    const res = await fetch(`${OFF_SEARCH}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) return null

    const data = (await res.json()) as { hits?: OFFHit[] }

    for (const p of data.hits ?? []) {
      const n = p.nutriments
      if (!n) continue

      const energia  = n['energy-kcal_100g']
      const proteina = n['proteins_100g']
      const carbo    = n['carbohydrates_100g']
      const lipideo  = n['fat_100g']

      if (energia == null || proteina == null || carbo == null || lipideo == null) continue

      const brand      = (Array.isArray(p.brands) ? p.brands[0] : p.brands) ?? ''
      const productName = p.product_name ?? ''
      // Avoid repeating the brand if product_name already starts with it
      const nome = productName.toLowerCase().startsWith(brand.toLowerCase())
        ? productName
        : [brand, productName].filter(Boolean).join(' ')


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

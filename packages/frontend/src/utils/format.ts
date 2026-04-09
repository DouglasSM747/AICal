export function formatarKcal(valor: number | string | null | undefined): string {
  if (valor == null) return '—'
  return `${Math.round(Number(valor))} kcal`
}

export function formatarGrama(valor: number | string | null | undefined, casas = 1): string {
  if (valor == null) return '—'
  return `${Number(valor).toFixed(casas)}g`
}

export function formatarConfianca(valor: number | string): string {
  return `${Math.round(Number(valor) * 100)}%`
}

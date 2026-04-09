import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatarData(data: string): string {
  const date = parseISO(data)
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
}

export function formatarDataCurta(data: string): string {
  return format(parseISO(data), 'dd/MM', { locale: ptBR })
}

export function formatarHorario(horario: string | null): string {
  if (!horario) return ''
  return horario.slice(0, 5) // "HH:MM"
}

export function dataHoje(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function dataAnterior(data: string): string {
  const d = parseISO(data)
  d.setDate(d.getDate() - 1)
  return format(d, 'yyyy-MM-dd')
}

export function dataProxima(data: string): string {
  const d = parseISO(data)
  d.setDate(d.getDate() + 1)
  return format(d, 'yyyy-MM-dd')
}

export function isDataFutura(data: string): boolean {
  return parseISO(data) > new Date()
}

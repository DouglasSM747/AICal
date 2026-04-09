import { formatarKcal, formatarGrama } from '@/utils/format'
import type { MacroTotais } from '@/types'

interface MacroBarProps {
  totais: MacroTotais
  compact?: boolean
}

export function MacroBar({ totais, compact = false }: MacroBarProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span className="font-semibold text-gray-900">{formatarKcal(totais.energia_kcal)}</span>
        <span>P {formatarGrama(totais.proteina_g)}</span>
        <span>C {formatarGrama(totais.carboidrato_g)}</span>
        <span>G {formatarGrama(totais.lipideo_g)}</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      <MacroCard label="Calorias" value={formatarKcal(totais.energia_kcal)} highlight />
      <MacroCard label="Proteína" value={formatarGrama(totais.proteina_g)} />
      <MacroCard label="Carboidrato" value={formatarGrama(totais.carboidrato_g)} />
      <MacroCard label="Gordura" value={formatarGrama(totais.lipideo_g)} />
    </div>
  )
}

function MacroCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl p-3 text-center ${
        highlight ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'
      }`}
    >
      <p className={`text-xs mb-1 ${highlight ? 'text-brand-100' : 'text-gray-500'}`}>{label}</p>
      <p className="text-sm font-semibold leading-tight">{value}</p>
    </div>
  )
}

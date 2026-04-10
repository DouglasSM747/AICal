import type { ItemRefeicao } from '@/types'
import { formatarKcal, formatarGrama } from '@/utils/format'

interface MealItemListProps {
  itens: ItemRefeicao[]
}

const FONTE_BADGE: Record<string, { label: string; className: string }> = {
  TACO:             { label: 'TACO',  className: 'bg-green-100 text-green-700' },
  AI_FALLBACK:      { label: 'IA',    className: 'bg-yellow-100 text-yellow-700' },
  OPEN_FOOD_FACTS:  { label: 'OFF',   className: 'bg-blue-100 text-blue-700' },
}

export function MealItemList({ itens }: MealItemListProps) {
  return (
    <ul className="space-y-2">
      {itens.map((item) => {
        const badge = FONTE_BADGE[item.fonte_nutricional]
        return (
          <li key={item.id} className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm text-gray-800 font-medium truncate">{item.descricao_padronizada}</p>
                {badge && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                P {formatarGrama(item.proteina_g)} · C {formatarGrama(item.carboidrato_g)} · G{' '}
                {formatarGrama(item.lipideo_g)}
              </p>
            </div>
            <span className="text-sm font-semibold text-gray-700 shrink-0">
              {formatarKcal(item.energia_kcal)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

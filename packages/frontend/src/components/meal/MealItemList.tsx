import type { ItemRefeicao } from '@/types'
import { formatarKcal, formatarGrama } from '@/utils/format'

interface MealItemListProps {
  itens: ItemRefeicao[]
}

export function MealItemList({ itens }: MealItemListProps) {
  return (
    <ul className="space-y-2">
      {itens.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 font-medium truncate">{item.descricao_padronizada}</p>
            <p className="text-xs text-gray-400">
              P {formatarGrama(item.proteina_g)} · C {formatarGrama(item.carboidrato_g)} · G{' '}
              {formatarGrama(item.lipideo_g)}
            </p>
          </div>
          <span className="text-sm font-semibold text-gray-700 shrink-0">
            {formatarKcal(item.energia_kcal)}
          </span>
        </li>
      ))}
    </ul>
  )
}

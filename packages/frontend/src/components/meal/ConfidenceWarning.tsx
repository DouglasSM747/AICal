import { AlertTriangle } from 'lucide-react'
import type { ItemIncerto } from '@/types'

interface ConfidenceWarningProps {
  itensIncertos: ItemIncerto[]
}

export function ConfidenceWarning({ itensIncertos }: ConfidenceWarningProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-2 mb-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Itens não identificados com clareza</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Corrija o texto e processe novamente para salvar.
          </p>
        </div>
      </div>

      {itensIncertos.map((item, i) => (
        <div key={i} className="mt-2 pl-2 border-l-2 border-amber-300">
          <p className="text-xs text-gray-600 italic">"{item.texto_original}"</p>
          {item.sugestoes.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Sugestões: {item.sugestoes.join(', ')}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

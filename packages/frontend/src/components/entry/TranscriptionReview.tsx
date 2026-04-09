import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface TranscriptionReviewProps {
  transcricao: string
  onConfirmar: (textoFinal: string) => void
  onRegravar: () => void
  loading?: boolean
}

export function TranscriptionReview({
  transcricao,
  onConfirmar,
  onRegravar,
  loading,
}: TranscriptionReviewProps) {
  const [texto, setTexto] = useState(transcricao)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Transcrição do áudio</p>
        <p className="text-xs text-gray-500 mb-3">
          Revise e edite o texto antes de processar. Quanto mais preciso, melhor o resultado.
        </p>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          placeholder="Edite o texto transcrito..."
        />
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onRegravar}>
          <RotateCcw size={14} />
          Regravar
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          loading={loading}
          disabled={!texto.trim()}
          onClick={() => onConfirmar(texto.trim())}
        >
          Processar refeição
        </Button>
      </div>
    </div>
  )
}

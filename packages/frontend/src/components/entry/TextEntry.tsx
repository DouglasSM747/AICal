import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface TextEntryProps {
  onConfirmar: (texto: string) => void
  loading?: boolean
}

export function TextEntry({ onConfirmar, loading }: TextEntryProps) {
  const [texto, setTexto] = useState('')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Descreva sua refeição</p>
        <p className="text-xs text-gray-500 mb-3">
          Ex: "2 ovos mexidos, 2 fatias de pão integral com manteiga e 1 xícara de café com leite"
        </p>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={5}
          autoFocus
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          placeholder="Descreva os alimentos, quantidades e preparações..."
        />
      </div>

      <Button
        variant="primary"
        loading={loading}
        disabled={!texto.trim()}
        onClick={() => onConfirmar(texto.trim())}
        className="w-full"
      >
        Processar refeição
      </Button>
    </div>
  )
}

import { useState } from 'react'
import { ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { ProdutoBarcode } from '@/types'

type Unidade = 'g' | 'ml' | 'unidade'

interface BarcodeReviewProps {
  produto: ProdutoBarcode
  onConfirmar: (quantidade: number, unidade: Unidade) => void
  onRescanear: () => void
  onDigitarManual: () => void
  loading?: boolean
}

export function BarcodeReview({ produto, onConfirmar, onRescanear, onDigitarManual, loading }: BarcodeReviewProps) {
  const defaultQtd = produto.serving_size_g ?? 100
  const [quantidade, setQuantidade] = useState(defaultQtd)
  const [unidade, setUnidade] = useState<Unidade>('g')

  const fator = unidade === 'unidade' ? defaultQtd / 100 : quantidade / 100
  const kcalPreview = +(produto.energia_kcal_100g * fator).toFixed(0)
  const protPreview  = +(produto.proteina_g_100g  * fator).toFixed(1)
  const carbPreview  = +(produto.carboidrato_g_100g * fator).toFixed(1)
  const gordPreview  = +(produto.lipideo_g_100g   * fator).toFixed(1)

  function handleConfirmar() {
    if (quantidade <= 0) return
    onConfirmar(quantidade, unidade)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Product card */}
      <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{produto.nome || 'Produto encontrado'}</p>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">OFF</span>
        </div>
        <p className="text-xs text-gray-500">
          Por 100g: <span className="font-medium text-gray-700">{produto.energia_kcal_100g} kcal</span>
          {' · '}P {produto.proteina_g_100g}g
          {' · '}C {produto.carboidrato_g_100g}g
          {' · '}G {produto.lipideo_g_100g}g
        </p>
      </div>

      {/* Quantity selector */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-500">Quantidade consumida</p>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={9999}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
            disabled={unidade === 'unidade'}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100 disabled:text-gray-400"
          />
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value as Unidade)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="g">g</option>
            <option value="ml">ml</option>
            {produto.serving_size_g && <option value="unidade">unidade</option>}
          </select>
        </div>
        {unidade === 'unidade' && produto.serving_size_g && (
          <p className="text-xs text-gray-400">1 unidade = {produto.serving_size_g}g</p>
        )}
      </div>

      {/* Live preview */}
      <div className="bg-brand-50 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-brand-700 font-medium">Estimativa</span>
        <div className="text-right">
          <p className="text-lg font-bold text-brand-700">{kcalPreview} kcal</p>
          <p className="text-xs text-brand-500">P {protPreview}g · C {carbPreview}g · G {gordPreview}g</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onRescanear} disabled={loading}>
          <ScanLine size={15} className="mr-1" />
          Outro
        </Button>
        <Button variant="primary" size="sm" className="flex-1" onClick={handleConfirmar} loading={loading}>
          Salvar
        </Button>
      </div>

      <button
        onClick={onDigitarManual}
        className="text-xs text-gray-400 underline text-center hover:text-gray-600 transition-colors"
      >
        Produto errado? Digitar manualmente
      </button>
    </div>
  )
}

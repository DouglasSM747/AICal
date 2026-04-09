import { useState } from 'react'
import { ChevronRight, Trash2, Clock, Check, X } from 'lucide-react'
import type { Refeicao } from '@/types'
import { TIPO_REFEICAO_LABELS } from '@/types'
import { MacroBar } from './MacroBar'
import { formatarHorario } from '@/utils/date'
import { MealItemList } from './MealItemList'
import { Button } from '@/components/ui/Button'

interface MealCardProps {
  refeicao: Refeicao
  onDelete: (id: string) => void
  onEditHorario: (id: string, horario: string) => void
}

export function MealCard({ refeicao, onDelete, onEditHorario }: MealCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingHorario, setEditingHorario] = useState(false)
  const [novoHorario, setNovoHorario] = useState(refeicao.horario_refeicao ?? '')

  const totais = {
    energia_kcal: refeicao.total_energia_kcal ?? 0,
    proteina_g: refeicao.total_proteina_g ?? 0,
    carboidrato_g: refeicao.total_carboidrato_g ?? 0,
    lipideo_g: refeicao.total_lipideo_g ?? 0,
  }

  function handleSalvarHorario() {
    if (novoHorario) {
      onEditHorario(refeicao.id, novoHorario)
    }
    setEditingHorario(false)
  }

  function handleCancelarHorario() {
    setNovoHorario(refeicao.horario_refeicao ?? '')
    setEditingHorario(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
              {TIPO_REFEICAO_LABELS[refeicao.tipo]}
            </span>
            {refeicao.horario_refeicao && (
              <span className="text-xs text-gray-400">{formatarHorario(refeicao.horario_refeicao)}</span>
            )}
          </div>
          <MacroBar totais={totais} compact />
        </div>
        <ChevronRight
          size={18}
          className={`text-gray-400 transition-transform shrink-0 ml-2 ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4">
          {refeicao.itens && refeicao.itens.length > 0 && (
            <div className="mt-3 mb-4">
              <MealItemList itens={refeicao.itens} />
            </div>
          )}

          {/* Actions */}
          {confirmDelete ? (
            <div className="flex gap-2 mt-2">
              <Button variant="danger" size="sm" className="flex-1" onClick={() => onDelete(refeicao.id)}>
                Confirmar exclusão
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
            </div>
          ) : editingHorario ? (
            <div className="flex items-center gap-2 mt-2">
              <Clock size={14} className="text-gray-400 shrink-0" />
              <input
                type="time"
                value={novoHorario}
                onChange={(e) => setNovoHorario(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
                autoFocus
              />
              <button
                onClick={handleSalvarHorario}
                className="p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                aria-label="Salvar horário"
              >
                <Check size={14} />
              </button>
              <button
                onClick={handleCancelarHorario}
                className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                aria-label="Cancelar"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => setEditingHorario(true)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors"
              >
                <Clock size={14} />
                {refeicao.horario_refeicao ? 'Editar horário' : 'Adicionar horário'}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

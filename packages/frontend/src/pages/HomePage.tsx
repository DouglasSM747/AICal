import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mealsService } from '@/services/meals.service'
import { dataHoje, dataAnterior, dataProxima, formatarData, isDataFutura } from '@/utils/date'
import { formatarKcal } from '@/utils/format'
import { MacroBar } from '@/components/meal/MacroBar'
import { MealCard } from '@/components/meal/MealCard'
import { useUIStore } from '@/store/ui.store'

export default function HomePage() {
  const [dataSelecionada, setDataSelecionada] = useState(dataHoje())
  const queryClient = useQueryClient()
  const openEntryModal = useUIStore((s) => s.openEntryModal)

  const { data, isLoading } = useQuery({
    queryKey: ['dia', dataSelecionada],
    queryFn: () => mealsService.getDia(dataSelecionada),
    placeholderData: null,
  })

  const deletarMutation = useMutation({
    mutationFn: mealsService.deletar,
    onSuccess: () => {
      toast.success('Refeição excluída')
      queryClient.invalidateQueries({ queryKey: ['dia', dataSelecionada] })
    },
    onError: () => toast.error('Erro ao excluir refeição'),
  })

  const editarHorarioMutation = useMutation({
    mutationFn: ({ id, horario }: { id: string; horario: string }) =>
      mealsService.atualizarHorario(id, horario),
    onSuccess: () => {
      toast.success('Horário atualizado')
      queryClient.invalidateQueries({ queryKey: ['dia', dataSelecionada] })
    },
    onError: () => toast.error('Erro ao atualizar horário'),
  })

  const ehHoje = dataSelecionada === dataHoje()
  const ehFuturo = isDataFutura(dataSelecionada)

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Navegação de datas */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setDataSelecionada(dataAnterior(dataSelecionada))}
          className="p-2 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        <div className="text-center">
          <p className="text-base font-semibold text-gray-900 capitalize">
            {formatarData(dataSelecionada)}
          </p>
          <p className="text-xs text-gray-400">{dataSelecionada}</p>
        </div>

        <button
          onClick={() => !ehFuturo && setDataSelecionada(dataProxima(dataSelecionada))}
          disabled={ehHoje}
          className="p-2 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Resumo do dia */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-4 mb-4 animate-pulse">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      ) : data?.totais ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <p className="text-xs font-medium text-gray-500 mb-3">Total do dia</p>
          <MacroBar totais={data.totais} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
            <span>{data.refeicoes.length} refeição(ões) registrada(s)</span>
            <span className="text-right">
              {formatarKcal(data.totais.energia_kcal)} totais
            </span>
          </div>
        </div>
      ) : null}

      {/* Lista de refeições */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : data?.refeicoes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-gray-400 text-sm">Nenhuma refeição registrada {ehHoje ? 'hoje' : 'neste dia'}</p>
          {ehHoje && (
            <button
              onClick={openEntryModal}
              className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:underline"
            >
              <Plus size={16} />
              Registrar primeira refeição
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.refeicoes.map((refeicao) => (
            <MealCard
              key={refeicao.id}
              refeicao={refeicao}
              onDelete={(id) => deletarMutation.mutate(id)}
              onEditHorario={(id, horario) => editarHorarioMutation.mutate({ id, horario })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

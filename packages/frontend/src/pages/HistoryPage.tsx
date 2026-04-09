import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mealsService } from '@/services/meals.service'
import { formatarDataCurta } from '@/utils/date'
import { formatarKcal, formatarGrama } from '@/utils/format'

type Periodo = 'semana' | 'mes' | 'personalizado'

export default function HistoryPage() {
  const [periodo, setPeriodo] = useState<Periodo>('semana')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['historico', periodo, dataInicio, dataFim],
    queryFn: () =>
      mealsService.getHistorico({
        periodo,
        data_inicio: periodo === 'personalizado' ? dataInicio : undefined,
        data_fim: periodo === 'personalizado' ? dataFim : undefined,
      }),
    enabled: periodo !== 'personalizado' || (!!dataInicio && !!dataFim),
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">Histórico</h1>

      {/* Filtro de período */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
        <div className="flex gap-2 mb-3">
          {(['semana', 'mes', 'personalizado'] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`flex-1 py-2 text-xs font-medium rounded-xl transition-colors ${
                periodo === p
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'semana' ? 'Semana' : p === 'mes' ? 'Mês' : 'Personalizado'}
            </button>
          ))}
        </div>

        {periodo === 'personalizado' && (
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">De</p>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Até</p>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Total do período */}
      {data?.totais_periodo && (
        <div className="bg-brand-600 text-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-xs text-brand-200 mb-2">Total do período</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold">{formatarKcal(data.totais_periodo.energia_kcal)}</span>
          </div>
          <div className="flex gap-3 text-sm text-brand-100">
            <span>P {formatarGrama(data.totais_periodo.proteina_g)}</span>
            <span>C {formatarGrama(data.totais_periodo.carboidrato_g)}</span>
            <span>G {formatarGrama(data.totais_periodo.lipideo_g)}</span>
          </div>
        </div>
      )}

      {/* Lista de dias */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : data?.dias.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">
          Nenhuma refeição encontrada neste período
        </p>
      ) : (
        <div className="space-y-2">
          {data?.dias.map((dia) => (
            <div
              key={dia.data}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{formatarDataCurta(dia.data)}</p>
                <p className="text-xs text-gray-400">{dia.total_refeicoes} refeição(ões)</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatarKcal(dia.totais.energia_kcal)}
                </p>
                <p className="text-xs text-gray-400">
                  P {formatarGrama(dia.totais.proteina_g, 0)} · C{' '}
                  {formatarGrama(dia.totais.carboidrato_g, 0)} · G{' '}
                  {formatarGrama(dia.totais.lipideo_g, 0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

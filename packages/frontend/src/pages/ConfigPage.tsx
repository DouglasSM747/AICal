import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { User, Brain, TrendingUp, Zap, DollarSign, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/services/api'
import { authService } from '@/services/auth.service'
import type { UsoIA, PeriodoUsoIA, ApiResponse } from '@/types'

const PERIODO_LABELS: Record<PeriodoUsoIA, string> = {
  hoje: 'Hoje',
  semana: 'Últimos 7 dias',
  mes: 'Últimos 30 dias',
  tudo: 'Todo o período',
}

const OPERACAO_LABELS: Record<string, string> = {
  whisper_transcricao: 'Transcrições (Áudio)',
  gpt_parse: 'Análise de refeição',
  gpt_reparse: 'Reanálise',
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function formatUsd(valor: number): string {
  if (valor < 0.001) return '< $0,001'
  return `$${valor.toFixed(4)}`
}

export default function ConfigPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const [periodo, setPeriodo] = useState<PeriodoUsoIA>('mes')

  async function handleLogout() {
    try {
      await authService.logout()
    } finally {
      clearAuth()
    }
  }

  const { data: usoIA, isLoading } = useQuery({
    queryKey: ['uso-ia', periodo],
    queryFn: async () => {
      const res = await api.get<ApiResponse<UsoIA>>(`/config/uso-ia?periodo=${periodo}`)
      return res.data.data
    },
    staleTime: 1000 * 60 * 5, // 5 min
  })

  const nomeExibicao = usuario?.nome_display ?? usuario?.username ?? '—'

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
      </div>

      {/* User card */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <User size={28} className="text-brand-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-gray-900 truncate">{nomeExibicao}</p>
            {usuario?.nome_display && (
              <p className="text-sm text-gray-500 truncate">@{usuario.username}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Sair da conta
        </button>
      </section>

      {/* AI Usage section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-brand-600" />
          <h2 className="text-base font-semibold text-gray-900">Uso de IA</h2>
        </div>

        {/* Period filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(PERIODO_LABELS) as PeriodoUsoIA[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                periodo === p
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {PERIODO_LABELS[p]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : !usoIA || usoIA.resumo.total_chamadas === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <Brain size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Nenhum uso de IA registrado neste período.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap size={14} className="text-yellow-500" />
                  <span className="text-xs text-gray-500 font-medium">Chamadas</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{usoIA.resumo.total_chamadas}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign size={14} className="text-green-500" />
                  <span className="text-xs text-gray-500 font-medium">Custo estimado</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatUsd(usoIA.resumo.custo_estimado_usd)}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={14} className="text-blue-500" />
                  <span className="text-xs text-gray-500 font-medium">Tokens entrada</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTokens(usoIA.resumo.total_tokens_entrada)}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={14} className="text-purple-500" />
                  <span className="text-xs text-gray-500 font-medium">Tokens saída</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTokens(usoIA.resumo.total_tokens_saida)}
                </p>
              </div>
            </div>

            {/* By model */}
            {usoIA.por_modelo.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Por modelo</p>
                {usoIA.por_modelo.map((m) => (
                  <div key={m.modelo} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.modelo}</p>
                      <p className="text-xs text-gray-500">
                        {formatTokens(m.tokens_entrada + m.tokens_saida)} tokens · {m.chamadas}{' '}
                        {m.chamadas === 1 ? 'chamada' : 'chamadas'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                      {formatUsd(m.custo_estimado_usd)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* By operation */}
            {usoIA.por_operacao.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Por tipo de operação</p>
                {usoIA.por_operacao.map((op) => (
                  <div key={op.tipo} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {OPERACAO_LABELS[op.tipo] ?? op.tipo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {op.chamadas} {op.chamadas === 1 ? 'chamada' : 'chamadas'}
                        {op.tokens_entrada + op.tokens_saida > 0 &&
                          ` · ${formatTokens(op.tokens_entrada + op.tokens_saida)} tokens`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 text-center px-4">
              Custo calculado com base nos preços da OpenAI (whisper não incluso). Apenas chamadas
              com sucesso são contabilizadas.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

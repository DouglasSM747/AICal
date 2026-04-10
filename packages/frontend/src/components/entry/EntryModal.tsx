import { useState } from 'react'
import { Mic, Type, ScanBarcode } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextEntry } from './TextEntry'
import { AudioRecorder } from './AudioRecorder'
import { TranscriptionReview } from './TranscriptionReview'
import { BarcodeScanner } from './BarcodeScanner'
import { BarcodeReview } from './BarcodeReview'
import { ConfidenceWarning } from '@/components/meal/ConfidenceWarning'
import { MacroBar } from '@/components/meal/MacroBar'
import { MealItemList } from '@/components/meal/MealItemList'

import { mealsService } from '@/services/meals.service'
import { useUIStore } from '@/store/ui.store'
import { dataHoje } from '@/utils/date'
import type {
  TipoRefeicao,
  OrigemEntrada,
  Refeicao,
  ItemIncerto,
  MacroTotais,
  ProdutoBarcode,
} from '@/types'
import { TIPO_REFEICAO_LABELS } from '@/types'

type Etapa =
  | 'escolha_modo'
  | 'entrada_texto'
  | 'gravacao_audio'
  | 'revisao_transcricao'
  | 'leitura_codigo_barras'
  | 'revisao_codigo_barras'
  | 'produto_nao_encontrado'
  | 'processando'
  | 'resultado'
  | 'bloqueado'
  | 'salvo'

interface ResultadoTemp {
  refeicao: Refeicao
  itensIncertos: ItemIncerto[]
  totais: MacroTotais
  textoPendente: string
}

const TIPOS: TipoRefeicao[] = ['cafe_da_manha', 'almoco', 'lanche', 'janta', 'ceia']

export function EntryModal() {
  const { entryModalOpen, closeEntryModal } = useUIStore()
  const queryClient = useQueryClient()

  const [etapa, setEtapa] = useState<Etapa>('escolha_modo')
  const [origem, setOrigem] = useState<OrigemEntrada>('texto')
  const [transcricao, setTranscricao] = useState('')
  const [resultado, setResultado] = useState<ResultadoTemp | null>(null)
  const [tipo, setTipo] = useState<TipoRefeicao>('almoco')
  const [horario, setHorario] = useState('')
  const [loading, setLoading] = useState(false)
  const [, setTextoPendente] = useState('')
  const [produtoBarcode, setProdutoBarcode] = useState<ProdutoBarcode | null>(null)

  function handleClose() {
    closeEntryModal()
    setTimeout(() => {
      setEtapa('escolha_modo')
      setResultado(null)
      setTranscricao('')
      setTextoPendente('')
      setProdutoBarcode(null)
      setLoading(false)
    }, 300)
  }

  async function handleBarcodeScanned(barcode: string) {
    setLoading(true)
    try {
      const produto = await mealsService.buscarPorCodigoBarras(barcode)
      if (produto) {
        setProdutoBarcode(produto)
        setEtapa('revisao_codigo_barras')
      } else {
        setEtapa('produto_nao_encontrado')
      }
    } catch {
      setEtapa('produto_nao_encontrado')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmarBarcode(quantidade: number, unidade: 'g' | 'ml' | 'unidade') {
    if (!produtoBarcode) return
    setLoading(true)
    setEtapa('processando')
    try {
      const fator = unidade === 'unidade'
        ? (produtoBarcode.serving_size_g ?? 100) / 100
        : quantidade / 100

      const qtdG = unidade === 'unidade' ? (produtoBarcode.serving_size_g ?? 100) : quantidade
      const nome = produtoBarcode.nome || 'produto'
      const descricao = unidade === 'unidade' ? `1 unidade de ${nome}` : `${quantidade}${unidade} de ${nome}`

      await mealsService.criarViaBarcode({
        tipo,
        data_refeicao: dataHoje(),
        horario_refeicao: horario || undefined,
        texto_confirmado: descricao,
        item: {
          descricao_padronizada: descricao,
          quantidade_g: qtdG,
          energia_kcal: +(produtoBarcode.energia_kcal_100g * fator).toFixed(1),
          proteina_g:   +(produtoBarcode.proteina_g_100g   * fator).toFixed(1),
          carboidrato_g: +(produtoBarcode.carboidrato_g_100g * fator).toFixed(1),
          lipideo_g:    +(produtoBarcode.lipideo_g_100g    * fator).toFixed(1),
          fibra_g: produtoBarcode.fibra_g_100g != null
            ? +(produtoBarcode.fibra_g_100g * fator).toFixed(1)
            : null,
        },
      })

      toast.success('Refeição registrada com sucesso!')
      await queryClient.invalidateQueries({ queryKey: ['dia', dataHoje()] })
      handleClose()
    } catch {
      toast.error('Erro ao salvar refeição. Tente novamente.')
      setEtapa('revisao_codigo_barras')
    } finally {
      setLoading(false)
    }
  }

  async function processarTexto(texto: string, refeicaoId?: string) {
    setLoading(true)
    setTextoPendente(texto)
    setEtapa('processando')

    try {
      let refeicao: Refeicao

      if (refeicaoId) {
        refeicao = await mealsService.reprocessar(refeicaoId, texto)
      } else {
        refeicao = await mealsService.criar({
          tipo,
          origem_entrada: origem,
          data_refeicao: dataHoje(),
          horario_refeicao: horario || undefined,
          texto_confirmado: texto,
        })
      }

      // Poll até status final
      const final = await pollStatus(refeicao.id)

      if (final.status === 'aguardando_revisao') {
        const raw = final as Refeicao & { itens_incertos?: ItemIncerto[] }
        setResultado({
          refeicao: final,
          itensIncertos: raw.itens_incertos ?? [],
          totais: {
            energia_kcal: final.total_energia_kcal ?? 0,
            proteina_g: final.total_proteina_g ?? 0,
            carboidrato_g: final.total_carboidrato_g ?? 0,
            lipideo_g: final.total_lipideo_g ?? 0,
          },
          textoPendente: texto,
        })
        setEtapa('bloqueado')
      } else {
        setResultado({
          refeicao: final,
          itensIncertos: [],
          totais: {
            energia_kcal: final.total_energia_kcal ?? 0,
            proteina_g: final.total_proteina_g ?? 0,
            carboidrato_g: final.total_carboidrato_g ?? 0,
            lipideo_g: final.total_lipideo_g ?? 0,
          },
          textoPendente: texto,
        })
        setEtapa('resultado')
      }
    } catch {
      toast.error('Erro ao processar a refeição. Tente novamente.')
      setEtapa(origem === 'audio' ? 'revisao_transcricao' : 'entrada_texto')
    } finally {
      setLoading(false)
    }
  }

  async function pollStatus(id: string): Promise<Refeicao> {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      const r = await mealsService.getById(id)
      if (r.status === 'confirmada' || r.status === 'aguardando_revisao') return r
    }
    throw new Error('Timeout no processamento')
  }

  async function handleTranscreverAudio(blob: Blob) {
    setLoading(true)
    try {
      const { transcricao: t } = await mealsService.transcreverAudio(blob)
      setTranscricao(t)
      setEtapa('revisao_transcricao')
    } catch {
      toast.error('Erro na transcrição. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSalvar() {
    if (!resultado) return
    // Já está salvo no backend quando status=confirmada
    toast.success('Refeição registrada com sucesso!')
    await queryClient.invalidateQueries({ queryKey: ['dia', dataHoje()] })
    handleClose()
  }

  async function handleReprocessar(novoTexto: string) {
    if (!resultado) return
    await processarTexto(novoTexto, resultado.refeicao.id)
  }

  const titulo: Record<Etapa, string> = {
    escolha_modo: 'Nova refeição',
    entrada_texto: 'Registrar por texto',
    gravacao_audio: 'Registrar por áudio',
    revisao_transcricao: 'Revisar transcrição',
    leitura_codigo_barras: 'Escanear produto',
    revisao_codigo_barras: 'Produto encontrado',
    produto_nao_encontrado: 'Produto não encontrado',
    processando: 'Processando...',
    resultado: 'Resultado',
    bloqueado: 'Itens não identificados',
    salvo: 'Refeição salva',
  }

  return (
    <Modal open={entryModalOpen} onClose={handleClose} title={titulo[etapa]}>
      <div className="flex flex-col gap-5">

        {/* Seletor de tipo e horário — visível nas etapas de entrada */}
        {(etapa === 'escolha_modo' || etapa === 'entrada_texto' || etapa === 'gravacao_audio' || etapa === 'leitura_codigo_barras' || etapa === 'revisao_codigo_barras') && (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Tipo de refeição</p>
              <div className="flex gap-1.5 flex-wrap">
                {TIPOS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipo(t)}
                    className={`px-3 py-1.5 text-xs rounded-full font-medium border transition-colors ${
                      tipo === t
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
                    }`}
                  >
                    {TIPO_REFEICAO_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Horário (opcional)</p>
              <input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

        {/* Escolha do modo */}
        {etapa === 'escolha_modo' && (
          <div className="flex gap-3">
            <button
              onClick={() => { setOrigem('texto'); setEtapa('entrada_texto') }}
              className="flex-1 flex flex-col items-center gap-2 py-6 border-2 border-gray-200 rounded-2xl hover:border-brand-400 hover:bg-brand-50 transition-colors"
            >
              <Type size={28} className="text-brand-600" />
              <span className="text-sm font-medium text-gray-700">Texto</span>
            </button>
            <button
              onClick={() => { setOrigem('audio'); setEtapa('gravacao_audio') }}
              className="flex-1 flex flex-col items-center gap-2 py-6 border-2 border-gray-200 rounded-2xl hover:border-brand-400 hover:bg-brand-50 transition-colors"
            >
              <Mic size={28} className="text-brand-600" />
              <span className="text-sm font-medium text-gray-700">Áudio</span>
            </button>
            <button
              onClick={() => { setOrigem('codigo_barras'); setEtapa('leitura_codigo_barras') }}
              className="flex-1 flex flex-col items-center gap-2 py-6 border-2 border-gray-200 rounded-2xl hover:border-brand-400 hover:bg-brand-50 transition-colors"
            >
              <ScanBarcode size={28} className="text-brand-600" />
              <span className="text-sm font-medium text-gray-700">Código</span>
            </button>
          </div>
        )}

        {/* Entrada por texto */}
        {etapa === 'entrada_texto' && (
          <TextEntry
            onConfirmar={(texto) => processarTexto(texto)}
            loading={loading}
          />
        )}

        {/* Gravação de áudio */}
        {etapa === 'gravacao_audio' && (
          <AudioRecorder onTranscricaoReady={handleTranscreverAudio} loading={loading} />
        )}

        {/* Revisão da transcrição */}
        {etapa === 'revisao_transcricao' && (
          <TranscriptionReview
            transcricao={transcricao}
            onConfirmar={(texto) => processarTexto(texto)}
            onRegravar={() => setEtapa('gravacao_audio')}
            loading={loading}
          />
        )}

        {/* Leitura de código de barras */}
        {etapa === 'leitura_codigo_barras' && (
          <BarcodeScanner
            onBarcodeScanned={handleBarcodeScanned}
            onCancelar={() => setEtapa('escolha_modo')}
            loading={loading}
          />
        )}

        {/* Revisão do produto encontrado */}
        {etapa === 'revisao_codigo_barras' && produtoBarcode && (
          <BarcodeReview
            produto={produtoBarcode}
            onConfirmar={handleConfirmarBarcode}
            onRescanear={() => setEtapa('leitura_codigo_barras')}
            onDigitarManual={() => { setOrigem('texto'); setEtapa('entrada_texto') }}
            loading={loading}
          />
        )}

        {/* Produto não encontrado */}
        {etapa === 'produto_nao_encontrado' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <ScanBarcode size={48} className="text-gray-300" />
            <div>
              <p className="text-sm font-medium text-gray-800">Produto não encontrado</p>
              <p className="text-xs text-gray-500 mt-1">Este código de barras não está no nosso banco de dados.</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Button variant="primary" onClick={() => setEtapa('leitura_codigo_barras')}>
                Tentar outro código
              </Button>
              <Button variant="secondary" onClick={() => { setOrigem('texto'); setEtapa('entrada_texto') }}>
                Digitar manualmente
              </Button>
            </div>
          </div>
        )}

        {/* Processando */}
        {etapa === 'processando' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <svg
              className="animate-spin h-10 w-10 text-brand-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-600">
              {origem === 'codigo_barras' ? 'Salvando refeição...' : 'Analisando alimentos e calculando macros...'}
            </p>
          </div>
        )}

        {/* Resultado */}
        {etapa === 'resultado' && resultado && (
          <div className="flex flex-col gap-4">
            <MacroBar totais={resultado.totais} />

            {resultado.refeicao.itens && resultado.refeicao.itens.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Alimentos identificados</p>
                <MealItemList itens={resultado.refeicao.itens} />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-500">Ajustar horário</p>
              <input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const novoTexto = prompt('Edite o texto da refeição:', resultado.textoPendente)
                  if (novoTexto) handleReprocessar(novoTexto)
                }}
              >
                Reprocessar
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={handleSalvar}>
                Salvar refeição
              </Button>
            </div>
          </div>
        )}

        {/* Bloqueado por baixa confiança */}
        {etapa === 'bloqueado' && resultado && (
          <div className="flex flex-col gap-4">
            <ConfidenceWarning itensIncertos={resultado.itensIncertos} />

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Texto atual</p>
              <textarea
                defaultValue={resultado.textoPendente}
                id="texto-reprocessar"
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <Button
              variant="primary"
              loading={loading}
              onClick={() => {
                const el = document.getElementById('texto-reprocessar') as HTMLTextAreaElement
                handleReprocessar(el.value)
              }}
            >
              Reprocessar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

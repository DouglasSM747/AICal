import api from './api'
import type { DiaResumo, DiaHistorico, Refeicao, TipoRefeicao, OrigemEntrada, ProdutoBarcode } from '@/types'

export interface CriarRefeicaoPayload {
  tipo: TipoRefeicao
  origem_entrada: OrigemEntrada
  data_refeicao: string
  horario_refeicao?: string
  texto_confirmado: string
}

export const mealsService = {
  async getDia(data: string): Promise<DiaResumo | null> {
    const res = await api.get<{ ok: true; data: DiaResumo }>(`/refeicoes/dia/${data}`)
    return res.data.data ?? null
  },

  async getHistorico(params: {
    periodo: 'semana' | 'mes' | 'personalizado'
    data_inicio?: string
    data_fim?: string
  }): Promise<{ dias: DiaHistorico[]; totais_periodo: DiaResumo['totais'] }> {
    const res = await api.get('/refeicoes/historico', { params })
    return res.data.data
  },

  async getById(id: string): Promise<Refeicao> {
    const res = await api.get<{ ok: true; data: Refeicao }>(`/refeicoes/${id}`)
    return res.data.data
  },

  async criar(payload: CriarRefeicaoPayload): Promise<Refeicao> {
    const res = await api.post<{ ok: true; data: Refeicao }>('/refeicoes', payload)
    return res.data.data
  },

  async deletar(id: string): Promise<void> {
    await api.delete(`/refeicoes/${id}`)
  },

  async atualizarHorario(id: string, horario_refeicao: string): Promise<Refeicao> {
    const res = await api.patch<{ ok: true; data: Refeicao }>(`/refeicoes/${id}/horario`, {
      horario_refeicao,
    })
    return res.data.data
  },

  async reprocessar(id: string, texto: string): Promise<Refeicao> {
    const res = await api.post<{ ok: true; data: Refeicao }>(`/refeicoes/${id}/reprocessar`, {
      texto,
    })
    return res.data.data
  },

  async criarViaBarcode(payload: {
    tipo: string
    data_refeicao: string
    horario_refeicao?: string
    texto_confirmado: string
    item: {
      descricao_padronizada: string
      quantidade_g: number
      energia_kcal: number
      proteina_g: number
      carboidrato_g: number
      lipideo_g: number
      fibra_g: number | null
    }
  }): Promise<Refeicao> {
    const res = await api.post<{ ok: true; data: Refeicao }>('/refeicoes/barcode', payload)
    return res.data.data
  },

  async buscarPorCodigoBarras(barcode: string): Promise<ProdutoBarcode | null> {
    try {
      const res = await api.post<{ ok: true; data: ProdutoBarcode }>('/ai/barcode', { barcode })
      return res.data.data
    } catch {
      return null
    }
  },

  async transcreverAudio(audioBlob: Blob): Promise<{ transcricao: string }> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    const res = await api.post<{ ok: true; data: { transcricao: string } }>(
      '/ai/transcrever',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return res.data.data
  },
}

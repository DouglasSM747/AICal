import api from './api'
import type { LoginResponse } from '@/types'

export const authService = {
  async login(username: string, senha: string): Promise<LoginResponse> {
    const { data } = await api.post<{ ok: true; data: LoginResponse }>('/auth/login', {
      username,
      senha,
    })
    return data.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },
}

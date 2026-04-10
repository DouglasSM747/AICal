import { create } from 'zustand'
import type { Usuario } from '@/types'

interface AuthState {
  usuario: Usuario | null
  isAuthenticated: boolean
  setAuth: (usuario: Usuario, token: string) => void
  clearAuth: () => void
  getToken: () => string | null
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: (() => {
    const raw = sessionStorage.getItem('aical_usuario')
    return raw ? (JSON.parse(raw) as Usuario) : null
  })(),
  isAuthenticated: !!sessionStorage.getItem('aical_token'),

  setAuth: (usuario, token) => {
    sessionStorage.setItem('aical_usuario', JSON.stringify(usuario))
    sessionStorage.setItem('aical_token', token)
    set({ usuario, isAuthenticated: true })
  },

  clearAuth: () => {
    sessionStorage.removeItem('aical_usuario')
    sessionStorage.removeItem('aical_token')
    set({ usuario: null, isAuthenticated: false })
  },

  getToken: () => sessionStorage.getItem('aical_token'),
}))

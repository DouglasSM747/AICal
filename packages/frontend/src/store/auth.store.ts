import { create } from 'zustand'
import type { Usuario } from '@/types'

interface AuthState {
  usuario: Usuario | null
  isAuthenticated: boolean
  setAuth: (usuario: Usuario) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: (() => {
    const raw = sessionStorage.getItem('aical_usuario')
    return raw ? (JSON.parse(raw) as Usuario) : null
  })(),
  isAuthenticated: !!sessionStorage.getItem('aical_usuario'),

  setAuth: (usuario) => {
    // Token lives in httpOnly cookie (set by backend) — never stored in JS
    sessionStorage.setItem('aical_usuario', JSON.stringify(usuario))
    set({ usuario, isAuthenticated: true })
  },

  clearAuth: () => {
    sessionStorage.removeItem('aical_usuario')
    set({ usuario: null, isAuthenticated: false })
  },
}))

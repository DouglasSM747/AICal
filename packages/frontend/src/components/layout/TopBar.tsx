import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'

export default function TopBar() {
  const { usuario, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
      <span className="text-brand-600 font-bold text-lg tracking-tight">AICal</span>
      <div className="flex items-center gap-3">
        {usuario?.nome_display && (
          <span className="text-sm text-gray-500 hidden sm:inline">{usuario.nome_display}</span>
        )}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}

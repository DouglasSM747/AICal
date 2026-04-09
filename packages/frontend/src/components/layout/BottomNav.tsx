import { NavLink } from 'react-router-dom'
import { Home, PlusCircle, History, Settings } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'
import { cn } from '@/utils/cn'

export default function BottomNav() {
  const openEntryModal = useUIStore((s) => s.openEntryModal)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-colors',
              isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700',
            )
          }
        >
          <Home size={22} />
          <span className="text-[10px] font-medium">Início</span>
        </NavLink>

        <button
          onClick={openEntryModal}
          className="flex flex-col items-center gap-0.5 px-5 py-2 text-brand-600 hover:text-brand-700 transition-colors"
          aria-label="Registrar refeição"
        >
          <PlusCircle size={28} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">Registrar</span>
        </button>

        <NavLink
          to="/historico"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-colors',
              isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700',
            )
          }
        >
          <History size={22} />
          <span className="text-[10px] font-medium">Histórico</span>
        </NavLink>

        <NavLink
          to="/config"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-colors',
              isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700',
            )
          }
        >
          <Settings size={22} />
          <span className="text-[10px] font-medium">Config</span>
        </NavLink>
      </div>
    </nav>
  )
}

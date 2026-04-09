import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import TopBar from './TopBar'

export default function AppShell() {
  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      <TopBar />
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

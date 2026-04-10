import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import AppShell from '@/components/layout/AppShell'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import HistoryPage from '@/pages/HistoryPage'
import ConfigPage from '@/pages/ConfigPage'
import { EntryModal } from '@/components/entry/EntryModal'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      retry: false, // don't retry on 401/403
    },
  },
})

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// Listens for 401 from any API call and clears session via React Router (no full reload)
function AuthGuard() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  useEffect(() => {
    function handleUnauthorized() {
      clearAuth()
      navigate('/login', { replace: true })
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [clearAuth, navigate])

  return null
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthGuard />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppShell />
              </PrivateRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="historico" element={<HistoryPage />} />
            <Route path="config" element={<ConfigPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <EntryModal />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

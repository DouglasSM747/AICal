import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface FormData {
  username: string
  senha: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  async function onSubmit({ username, senha }: FormData) {
    setLoading(true)
    try {
      const response = await authService.login(username, senha)
      setAuth(response.usuario)
      navigate('/')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401) {
        toast.error('Usuário ou senha incorretos')
      } else if (status === 403) {
        toast.error('Usuário inativo. Entre em contato com o administrador.')
      } else {
        toast.error('Erro ao fazer login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-gradient-to-br from-brand-50 to-green-100 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700 tracking-tight">AICal</h1>
          <p className="text-sm text-gray-500 mt-1">Diário alimentar inteligente</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Entrar</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Usuário"
              type="text"
              autoComplete="username"
              error={errors.username?.message}
              {...register('username', { required: 'Informe o usuário' })}
            />

            <Input
              label="Senha"
              type="password"
              autoComplete="current-password"
              error={errors.senha?.message}
              {...register('senha', { required: 'Informe a senha' })}
            />

            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

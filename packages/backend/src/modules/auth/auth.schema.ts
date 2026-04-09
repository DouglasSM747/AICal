import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Usuário obrigatório').max(50),
  senha: z.string().min(1, 'Senha obrigatória').max(128),
})

export type LoginInput = z.infer<typeof loginSchema>

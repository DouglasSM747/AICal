import type { FastifyInstance } from 'fastify'
import { loginSchema } from './auth.schema.js'
import { authService } from './auth.service.js'
import { authenticate } from '../../middleware/authenticate.js'
import { ok, fail } from '../../utils/response.js'

const COOKIE_NAME = 'aical_token'
const EXPIRES_IN_SECONDS = 14 * 24 * 60 * 60 // 14 days

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  app.post(
    '/login',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const parsed = loginSchema.safeParse(req.body)
      if (!parsed.success) {
        return fail(reply, 400, 'VALIDATION_ERROR', 'Dados inválidos', {
          fields: parsed.error.flatten().fieldErrors,
        })
      }

      const { username, senha } = parsed.data
      const resultado = await authService.autenticar(username, senha)

      if (!resultado.sucesso) {
        if (resultado.motivo === 'usuario_inativo') {
          return fail(reply, 403, 'USUARIO_INATIVO', 'Usuário inativo. Contate o administrador.')
        }
        return fail(reply, 401, 'CREDENCIAIS_INVALIDAS', 'Usuário ou senha incorretos.')
      }

      const { usuario } = resultado

      const token = app.jwt.sign(
        { sub: usuario.id, username: usuario.username },
        { expiresIn: EXPIRES_IN_SECONDS },
      )

      reply.setCookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: EXPIRES_IN_SECONDS,
      })

      const expira_em = new Date(Date.now() + EXPIRES_IN_SECONDS * 1000).toISOString()

      // Return token in body so clients that can't use cross-origin cookies (e.g. iOS Safari ITP)
      // can fall back to Authorization header
      return ok(reply, { token, expira_em, usuario })
    },
  )

  // POST /auth/logout
  app.post(
    '/logout',
    { preHandler: authenticate },
    async (_req, reply) => {
      reply.clearCookie(COOKIE_NAME, { path: '/' })
      return ok(reply, { mensagem: 'Logout realizado.' })
    },
  )
}

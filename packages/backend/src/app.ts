import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyMultipart from '@fastify/multipart'

import { env } from './config/env.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { mealsRoutes } from './modules/meals/meals.routes.js'
import { aiRoutes } from './modules/ai/ai.routes.js'
import { nutritionRoutes } from './modules/nutrition/nutrition.routes.js'
import { configRoutes } from './modules/config/config.routes.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  })

  // ─── Security ─────────────────────────────────────────────────────────────

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        // Pure JSON API — block everything else
      },
    },
  })

  await app.register(fastifyCors, {
    origin: [env.FRONTEND_URL, 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(fastifyRateLimit, {
    global: false, // applied per-route
    max: 100,
    timeWindow: '1 minute',
  })

  // ─── Cookies (must be before JWT) ────────────────────────────────────────────

  await app.register(fastifyCookie)

  // ─── Auth ──────────────────────────────────────────────────────────────────

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { algorithm: 'HS256' },
    cookie: { cookieName: 'aical_token', signed: false },
  })

  // ─── File upload ──────────────────────────────────────────────────────────

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB (Whisper API limit)
      files: 1,
    },
  })

  // ─── Health check ─────────────────────────────────────────────────────────

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // ─── Routes ───────────────────────────────────────────────────────────────

  await app.register(authRoutes, { prefix: '/api/v1/auth' })

  await app.register(mealsRoutes, { prefix: '/api/v1/refeicoes' })
  await app.register(aiRoutes, { prefix: '/api/v1/ai' })
  await app.register(nutritionRoutes, { prefix: '/api/v1/nutricao' })
  await app.register(configRoutes, { prefix: '/api/v1/config' })

  // ─── Error handler ────────────────────────────────────────────────────────

  app.setErrorHandler((error: Error & { statusCode?: number }, _req, reply) => {
    app.log.error(error)
    reply.code(error.statusCode ?? 500).send({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          env.NODE_ENV === 'production'
            ? 'Erro interno do servidor'
            : error.message,
      },
    })
  })

  return app
}

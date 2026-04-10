import type { FastifyRequest, FastifyReply } from 'fastify'

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    // Accept Bearer token (Authorization header) OR httpOnly cookie
    // Bearer is needed for iOS Safari which blocks cross-origin cookies (ITP)
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      req.user = req.server.jwt.verify(token)
    } else {
      await req.jwtVerify()
    }
  } catch {
    return reply.code(401).send({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Token inválido ou expirado.' },
    })
  }
}

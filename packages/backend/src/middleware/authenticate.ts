import type { FastifyRequest, FastifyReply } from 'fastify'

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
  } catch {
    return reply.code(401).send({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Token inválido ou expirado.' },
    })
  }
}

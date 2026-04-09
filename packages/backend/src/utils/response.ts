import type { FastifyReply } from 'fastify'

export function ok<T>(reply: FastifyReply, data: T, statusCode = 200) {
  return reply.code(statusCode).send({ ok: true, data })
}

export function fail(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return reply.code(statusCode).send({
    ok: false,
    error: { code, message, ...(details ? { details } : {}) },
  })
}

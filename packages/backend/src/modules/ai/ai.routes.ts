import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate.js'
import { whisperService } from './whisper.service.js'
import { ok, fail } from '../../utils/response.js'

export async function aiRoutes(app: FastifyInstance) {
  // POST /ai/transcrever — audio to text (Whisper)
  app.post(
    '/transcrever',
    {
      preHandler: authenticate,
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const data = await req.file()

      if (!data) {
        return fail(reply, 400, 'AUDIO_AUSENTE', 'Arquivo de áudio não encontrado.')
      }

      const mimetype = data.mimetype
      const allowed = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/mpeg']
      if (!allowed.some((m) => mimetype.startsWith(m.split('/')[0]) && mimetype.includes(m.split('/')[1]))) {
        return fail(reply, 400, 'FORMATO_INVALIDO', 'Formato de áudio não suportado.')
      }

      const buffer = await data.toBuffer()

      if (buffer.length > 25 * 1024 * 1024) {
        return fail(reply, 400, 'ARQUIVO_MUITO_GRANDE', 'Áudio deve ter no máximo 25MB.')
      }

      const inicio = Date.now()
      const transcricao = await whisperService.transcrever(buffer, mimetype)
      const duracao_ms = Date.now() - inicio

      return ok(reply, { transcricao, duracao_ms })
    },
  )
}

import OpenAI from 'openai'
import { env } from '../../config/env.js'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

export const whisperService = {
  async transcrever(audioBuffer: Buffer, mimetype: string): Promise<string> {
    const extension = mimetype.includes('mp4')
      ? 'm4a'
      : mimetype.includes('ogg')
        ? 'ogg'
        : mimetype.includes('wav')
          ? 'wav'
          : 'webm'

    // OpenAI SDK accepts a File-like object
    const file = new File([audioBuffer], `recording.${extension}`, { type: mimetype })

    const response = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'text',
    })

    return (response as unknown as string).trim()
  },
}

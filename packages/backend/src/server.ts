import 'dotenv/config'
import { buildApp } from './app.js'
import { env } from './config/env.js'
import { prisma } from './db/prisma.js'

async function main() {
  const app = await buildApp()

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    app.log.info(`Server running on port ${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, shutting down...`)
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main()

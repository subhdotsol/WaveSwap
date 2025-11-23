import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'

import { config } from '@/lib/config'
import { logger } from '@/lib/logger'
import { DatabaseService } from '@/database'
import { RedisService } from '@/services/redis'
import { QuoteService } from '@/services/quote'
import { SwapService } from '@/services/swap'
import { WebSocketService } from '@/services/websocket'

// Routes
import { swapRoutes } from '@/routes/swap'
import { healthRoutes } from '@/routes/health'
import { quoteRoutes } from '@/routes/quote'

async function createServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: config.NODE_ENV === 'production' ? logger : false,
    trustProxy: true,
  })

  // Register plugins
  await server.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
  })

  await server.register(helmet, {
    contentSecurityPolicy: false, // Disable for development
  })

  await server.register(rateLimit, {
    max: config.API_RATE_LIMIT_REQUESTS_PER_MINUTE,
    timeWindow: '1 minute',
    skipOnError: true,
  })

  await server.register(cookie)
  await server.register(jwt, {
    secret: config.JWT_SECRET,
  })
  await server.register(websocket)

  // Initialize services
  const dbService = new DatabaseService()
  const redisService = new RedisService()
  const quoteService = new QuoteService(redisService)
  const swapService = new SwapService(dbService, redisService)
  const wsService = new WebSocketService(server)

  // Make services available globally
  server.decorate('db', dbService)
  server.decorate('redis', redisService)
  server.decorate('quoteService', quoteService)
  server.decorate('swapService', swapService)
  server.decorate('wsService', wsService)

  // Register routes
  await server.register(healthRoutes, { prefix: '/health' })
  await server.register(quoteRoutes, { prefix: '/api/v1/quote' })
  await server.register(swapRoutes, { prefix: '/api/v1/swap' })

  // WebSocket route for real-time updates
  server.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection, req) => {
      wsService.handleConnection(connection, req)
    })
  })

  // Error handler
  server.setErrorHandler((error, request, reply) => {
    server.log.error(error)

    if (error.validation) {
      reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      })
      return
    }

    reply.status(500).send({
      error: 'Internal Server Error',
      message: config.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
    })
  })

  // Health check endpoint
  server.get('/ping', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  return server
}

async function start() {
  try {
    const server = await createServer()

    await server.listen({
      port: config.API_PORT,
      host: config.API_HOST,
    })

    console.log(`🚀 WaveSwap API Server listening on http://${config.API_HOST}:${config.API_PORT}`)
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

// Start server if this file is run directly
if (import.meta.main) {
  start()
}

export { createServer }
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/ping', async (request: FastifyRequest, reply: FastifyReply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    const db = fastify.db as any
    const redis = fastify.redis as any

    try {
      const [dbHealth, redisHealth] = await Promise.all([
        db.healthCheck(),
        redis.healthCheck(),
      ])

      const isHealthy = dbHealth && redisHealth

      const statusCode = isHealthy ? 200 : 503
      const response = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealth ? 'healthy' : 'unhealthy',
          redis: redisHealth ? 'healthy' : 'unhealthy',
        },
      }

      reply.code(statusCode).send(response)
    } catch (error) {
      fastify.log.error('Health check failed', error)
      reply.code(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      })
    }
  })

  fastify.get('/detailed', async (request: FastifyRequest, reply: FastifyReply) => {
    const db = fastify.db as any
    const redis = fastify.redis as any
    const wsService = fastify.wsService as any

    try {
      const [dbHealth, redisHealth] = await Promise.all([
        db.healthCheck(),
        redis.healthCheck(),
      ])

      const wsStats = wsService.getStats()

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: {
          database: {
            status: dbHealth ? 'healthy' : 'unhealthy',
            url: process.env.DATABASE_URL ? 'configured' : 'not configured',
          },
          redis: {
            status: redisHealth ? 'healthy' : 'unhealthy',
            url: process.env.REDIS_URL ? 'configured' : 'not configured',
          },
          websocket: wsStats,
        },
      }
    } catch (error) {
      fastify.log.error('Detailed health check failed', error)
      reply.code(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      })
    }
  })
}
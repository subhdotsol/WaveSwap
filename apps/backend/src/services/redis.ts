import { createClient, RedisClientType } from 'redis'
import { logger } from '@/lib/logger'
import { config } from '@/lib/config'

export class RedisService {
  private client: RedisClientType
  private isConnected = false

  constructor() {
    this.client = createClient({
      url: config.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts')
            return new Error('Redis reconnection failed')
          }
          return Math.min(retries * 100, 3000)
        },
      },
    })

    this.client.on('error', (error) => {
      logger.error('Redis error', { error })
      this.isConnected = false
    })

    this.client.on('connect', () => {
      logger.info('Redis connected')
      this.isConnected = true
    })

    this.client.on('disconnect', () => {
      logger.warn('Redis disconnected')
      this.isConnected = false
    })
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect()
    } catch (error) {
      logger.error('Failed to connect to Redis', { error })
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect()
      this.isConnected = false
      logger.info('Redis disconnected')
    } catch (error) {
      logger.error('Failed to disconnect from Redis', { error })
    }
  }

  isClientConnected(): boolean {
    return this.isConnected
  }

  // Generic key-value operations
  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    try {
      if (expireInSeconds) {
        await this.client.setEx(key, expireInSeconds, value)
      } else {
        await this.client.set(key, value)
      }
    } catch (error) {
      logger.error('Redis SET error', { key, error })
      throw error
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key)
    } catch (error) {
      logger.error('Redis GET error', { key, error })
      throw error
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key)
    } catch (error) {
      logger.error('Redis DEL error', { key, error })
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error })
      throw error
    }
  }

  // Hash operations
  async hSet(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hSet(key, field, value)
    } catch (error) {
      logger.error('Redis HSET error', { key, field, error })
      throw error
    }
  }

  async hGet(key: string, field: string): Promise<string | undefined> {
    try {
      return await this.client.hGet(key, field)
    } catch (error) {
      logger.error('Redis HGET error', { key, field, error })
      throw error
    }
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key)
    } catch (error) {
      logger.error('Redis HGETALL error', { key, error })
      throw error
    }
  }

  async hDel(key: string, field: string): Promise<number> {
    try {
      return await this.client.hDel(key, field)
    } catch (error) {
      logger.error('Redis HDEL error', { key, field, error })
      throw error
    }
  }

  // List operations
  async lPush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lPush(key, values)
    } catch (error) {
      logger.error('Redis LPUSH error', { key, error })
      throw error
    }
  }

  async rPop(key: string): Promise<string | null> {
    try {
      return await this.client.rPop(key)
    } catch (error) {
      logger.error('Redis RPOP error', { key, error })
      throw error
    }
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lRange(key, start, stop)
    } catch (error) {
      logger.error('Redis LRANGE error', { key, start, stop, error })
      throw error
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    try {
      return await this.client.publish(channel, message)
    } catch (error) {
      logger.error('Redis PUBLISH error', { channel, error })
      throw error
    }
  }

  // Swap-specific operations
  async cacheQuote(key: string, quote: any, ttlSeconds = 30): Promise<void> {
    try {
      await this.set(key, JSON.stringify(quote), ttlSeconds)
    } catch (error) {
      logger.error('Failed to cache quote', { key, error })
      throw error
    }
  }

  async getCachedQuote(key: string): Promise<any | null> {
    try {
      const cached = await this.get(key)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      logger.error('Failed to get cached quote', { key, error })
      return null
    }
  }

  async setSwapStatus(swapId: string, status: string, data?: any): Promise<void> {
    const key = `swap:${swapId}:status`
    const value = JSON.stringify({
      status,
      timestamp: new Date().toISOString(),
      ...(data && { data }),
    })
    await this.set(key, value, 3600) // 1 hour TTL
  }

  async getSwapStatus(swapId: string): Promise<any | null> {
    const key = `swap:${swapId}:status`
    try {
      const status = await this.get(key)
      return status ? JSON.parse(status) : null
    } catch (error) {
      logger.error('Failed to get swap status', { swapId, error })
      return null
    }
  }

  // Rate limiting
  async incrementRateLimit(key: string, windowSeconds = 60): Promise<number> {
    try {
      const count = await this.client.incr(key)
      if (count === 1) {
        await this.client.expire(key, windowSeconds)
      }
      return count
    } catch (error) {
      logger.error('Rate limit increment error', { key, error })
      throw error
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping()
      return true
    } catch (error) {
      logger.error('Redis health check failed', { error })
      return false
    }
  }

  // Cleanup operations
  async clearPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length === 0) return 0
      return await this.client.del(keys)
    } catch (error) {
      logger.error('Redis clear pattern error', { pattern, error })
      throw error
    }
  }
}
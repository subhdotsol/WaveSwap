import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'
import { config } from '@/lib/config'

export class DatabaseService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.DATABASE_URL,
        },
      },
      log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

    // Handle graceful shutdown
    process.on('beforeExit', async () => {
      await this.prisma.$disconnect()
    })
  }

  get client(): PrismaClient {
    return this.prisma
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      logger.error('Database health check failed', { error })
      return false
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
    logger.info('Database disconnected')
  }

  // User operations
  async getUserOrCreate(address: string) {
    return this.prisma.user.upsert({
      where: { address },
      update: { updatedAt: new Date() },
      create: {
        address,
      },
    })
  }

  // Swap operations
  async createSwap(data: {
    userAddress: string
    inputToken: string
    outputToken: string
    inputAmount: bigint
    feeBps: number
    privacyMode: boolean
    routeId?: number
    slippageBps: number
    intentId?: string
  }) {
    return this.prisma.swap.create({
      data: {
        userAddress: data.userAddress,
        inputToken: data.inputToken,
        outputToken: data.outputToken,
        inputAmount: data.inputAmount,
        feeBps: data.feeBps,
        privacyMode: data.privacyMode,
        routeId: data.routeId,
        slippageBps: data.slippageBps,
        intentId: data.intentId,
      },
    })
  }

  async updateSwap(id: string, data: Partial<{
    outputAmount: bigint
    status: string
    txHash: string
    mxeRequestId: string
    mxeResultId: string
    arciumProof: string
    computationHash: string
    error: string
    settledAt: Date
  }>) {
    return this.prisma.swap.update({
      where: { id },
      data,
    })
  }

  async getSwap(id: string) {
    return this.prisma.swap.findUnique({
      where: { id },
      include: {
        stages: true,
        user: true,
      },
    })
  }

  async getSwapByIntentId(intentId: string) {
    return this.prisma.swap.findUnique({
      where: { intentId },
      include: {
        stages: true,
        user: true,
      },
    })
  }

  async getSwapsByUser(userAddress: string, limit = 50, offset = 0) {
    return this.prisma.swap.findMany({
      where: { userAddress },
      include: {
        stages: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  async getPendingSwaps() {
    return this.prisma.swap.findMany({
      where: {
        status: 'ENCRYPTED_PENDING',
      },
      include: {
        stages: true,
      },
    })
  }

  // Swap stage operations
  async createSwapStage(data: {
    swapId: string
    name: string
    status?: string
  }) {
    return this.prisma.swapStage.create({
      data,
    })
  }

  async updateSwapStage(id: string, data: {
    status?: string
    completedAt?: Date
    error?: string
  }) {
    return this.prisma.swapStage.update({
      where: { id },
      data,
    })
  }

  // Quote cache operations
  async cacheQuote(data: {
    inputToken: string
    outputToken: string
    inputAmount: bigint
    outputAmount: bigint
    routeId?: number
    priceImpact: number
    feeBps: number
    validForMs: number
  }) {
    const expiresAt = new Date(Date.now() + data.validForMs)

    return this.prisma.quoteCache.create({
      data: {
        inputToken: data.inputToken,
        outputToken: data.outputToken,
        inputAmount: data.inputAmount,
        outputAmount: data.outputAmount,
        routeId: data.routeId,
        priceImpact: data.priceImpact,
        feeBps: data.feeBps,
        expiresAt,
      },
    })
  }

  async getCachedQuote(inputToken: string, outputToken: string, inputAmount: bigint) {
    return this.prisma.quoteCache.findFirst({
      where: {
        inputToken,
        outputToken,
        inputAmount,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        cachedAt: 'desc',
      },
    })
  }

  async cleanupExpiredQuotes() {
    return this.prisma.quoteCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
  }

  // Session operations
  async createSession(data: {
    userAddress: string
    authToken: string
    validUntil: Date
  }) {
    return this.prisma.session.create({
      data,
    })
  }

  async getSession(authToken: string) {
    return this.prisma.session.findUnique({
      where: { authToken },
      include: {
        user: true,
      },
    })
  }

  async deleteSession(authToken: string) {
    return this.prisma.session.delete({
      where: { authToken },
    })
  }

  async cleanupExpiredSessions() {
    return this.prisma.session.deleteMany({
      where: {
        validUntil: {
          lt: new Date(),
        },
      },
    })
  }

  // Token metadata operations
  async getTokenMetadata(mint: string) {
    return this.prisma.tokenMetadata.findUnique({
      where: { mint },
    })
  }

  async createTokenMetadata(data: {
    mint: string
    symbol: string
    name: string
    decimals: number
    logoUri?: string
    isVerified?: boolean
  }) {
    return this.prisma.tokenMetadata.create({
      data,
    })
  }

  async updateTokenMetadata(mint: string, data: {
    symbol?: string
    name?: string
    logoUri?: string
    isVerified?: boolean
  }) {
    return this.prisma.tokenMetadata.update({
      where: { mint },
      data,
    })
  }

  // Rate limit operations
  async checkRateLimit(userAddress: string | null, endpoint: string, maxRequests = 100) {
    const now = new Date()
    const windowStart = new Date(now.getTime() - 60000) // 1 minute ago

    const result = await this.prisma.rateLimit.findFirst({
      where: {
        userAddress,
        endpoint,
        windowStart: {
          gte: windowStart,
        },
        windowEnd: {
          lte: now,
        },
      },
    })

    if (result && result.requestCount >= maxRequests) {
      return false
    }

    // Update or create rate limit record
    if (result) {
      await this.prisma.rateLimit.update({
        where: { id: result.id },
        data: {
          requestCount: result.requestCount + 1,
        },
      })
    } else {
      await this.prisma.rateLimit.create({
        data: {
          userAddress,
          endpoint,
          requestCount: 1,
          windowStart,
          windowEnd: now,
        },
      })
    }

    return true
  }
}
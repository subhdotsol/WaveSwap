import { logger } from '@/lib/logger'
import { config } from '@/lib/config'
import { DatabaseService } from '@/database'
import { RedisService } from './redis'
import { QuoteService } from './quote'
import { v4 as uuidv4 } from 'uuid'

export interface SwapRequest {
  userAddress: string
  inputToken: string
  outputToken: string
  inputAmount: string
  slippageBps: number
  privacyMode: boolean
  signature?: string
}

export interface SwapResponse {
  intentId: string
  status: string
  inputAmount: string
  estimatedOutput: string
  fee: string
  privacyFee: string
  estimatedTime: number
  confirmation: {
    authToken: string
    validUntil: string
  }
}

export interface SwapStatusResponse {
  intentId: string
  status: string
  inputAmount: string
  outputAmount?: string
  fee?: string
  stages: Array<{
    name: string
    status: string
  }>
  txHash?: string
  createdAt: string
  completedAt?: string
}

export class SwapService {
  constructor(
    private db: DatabaseService,
    private redis: RedisService
  ) {}

  async submitSwap(request: SwapRequest): Promise<SwapResponse> {
    const intentId = uuidv4()
    const authToken = uuidv4()
    const validUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Get or create user
    await this.db.getUserOrCreate(request.userAddress)

    // Validate swap amount
    const inputAmount = BigInt(request.inputAmount)
    if (inputAmount < BigInt(config.MIN_SWAP_AMOUNT)) {
      throw new Error(`Minimum swap amount is ${config.MIN_SWAP_AMOUNT}`)
    }
    if (inputAmount > BigInt(config.MAX_SWAP_AMOUNT)) {
      throw new Error(`Maximum swap amount is ${config.MAX_SWAP_AMOUNT}`)
    }

    // Get quote for estimation
    const quoteService = new QuoteService(this.redis)
    const quote = await quoteService.getQuote({
      inputToken: request.inputToken,
      outputToken: request.outputToken,
      inputAmount: request.inputAmount,
      slippageBps: request.slippageBps,
      privacyMode: request.privacyMode,
    })

    // Calculate fees
    const totalFeeBps = request.privacyMode ? 35 : 25
    const inputAmountNum = parseFloat(request.inputAmount)
    const estimatedOutputNum = parseFloat(quote.outputAmount)
    const feeAmount = Math.floor((estimatedOutputNum * totalFeeBps) / 10000)
    const privacyFee = request.privacyMode ? Math.floor((estimatedOutputNum * 10) / 10000) : 0

    // Create swap record
    const swap = await this.db.createSwap({
      userAddress: request.userAddress,
      inputToken: request.inputToken,
      outputToken: request.outputToken,
      inputAmount: inputAmount,
      feeBps: totalFeeBps,
      privacyMode: request.privacyMode,
      slippageBps: request.slippageBps,
      intentId,
    })

    // Create initial stages
    await this.createSwapStages(swap.id)

    // Create session for confirmation
    await this.db.createSession({
      userAddress: request.userAddress,
      authToken,
      validUntil,
    })

    // Cache swap status
    await this.redis.setSwapStatus(intentId, 'submitted', {
      swapId: swap.id,
      userAddress: request.userAddress,
    })

    logger.info('Swap submitted', {
      intentId,
      swapId: swap.id,
      userAddress: request.userAddress,
      inputToken: request.inputToken,
      outputToken: request.outputToken,
      inputAmount: request.inputAmount,
      privacyMode: request.privacyMode,
    })

    return {
      intentId,
      status: 'submitted',
      inputAmount: request.inputAmount,
      estimatedOutput: quote.outputAmount,
      fee: feeAmount.toString(),
      privacyFee: privacyFee.toString(),
      estimatedTime: request.privacyMode ? 8000 : 5000, // Privacy takes longer
      confirmation: {
        authToken,
        validUntil: validUntil.toISOString(),
      },
    }
  }

  private async createSwapStages(swapId: string): Promise<void> {
    const stages = [
      'Quote Fetched',
      'User Confirmation',
      'Token Wrapping',
      'Encrypted Computation',
      'Settlement',
      'Transaction Confirmation',
    ]

    for (const stageName of stages) {
      await this.db.createSwapStage({
        swapId,
        name: stageName,
        status: 'PENDING',
      })
    }
  }

  async getSwapStatus(intentId: string): Promise<SwapStatusResponse | null> {
    const swap = await this.db.getSwapByIntentId(intentId)
    if (!swap) {
      return null
    }

    const stages = swap.stages.map(stage => ({
      name: stage.name,
      status: stage.status,
    }))

    return {
      intentId,
      status: swap.status,
      inputAmount: swap.inputAmount.toString(),
      outputAmount: swap.outputAmount?.toString(),
      fee: swap.outputAmount ? ((swap.outputAmount * BigInt(swap.feeBps)) / BigInt(10000)).toString() : undefined,
      stages,
      txHash: swap.txHash || undefined,
      createdAt: swap.createdAt.toISOString(),
      completedAt: swap.settledAt?.toISOString(),
    }
  }

  async updateSwapStage(swapId: string, stageName: string, status: string, error?: string): Promise<void> {
    const swap = await this.db.getSwap(swapId)
    if (!swap) {
      logger.error('Swap not found for stage update', { swapId, stageName })
      return
    }

    const stage = swap.stages.find(s => s.name === stageName)
    if (!stage) {
      logger.error('Stage not found', { swapId, stageName })
      return
    }

    const updateData: any = {
      status,
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    if (error) {
      updateData.error = error
    }

    await this.db.updateSwapStage(stage.id, updateData)

    // Update Redis status
    await this.redis.setSwapStatus(swap.intentId || '', `stage:${stageName}:${status}`, {
      swapId,
      stageName,
      stageStatus: status,
      error,
    })
  }

  async completeSwap(intentId: string, result: {
    outputAmount: bigint
    txHash: string
    arciumProof?: string
    computationHash?: string
  }): Promise<void> {
    const swap = await this.db.getSwapByIntentId(intentId)
    if (!swap) {
      throw new Error(`Swap not found: ${intentId}`)
    }

    await this.db.updateSwap(swap.id, {
      outputAmount: result.outputAmount,
      status: 'ENCRYPTED_SETTLED',
      txHash: result.txHash,
      arciumProof: result.arciumProof,
      computationHash: result.computationHash,
      settledAt: new Date(),
    })

    // Mark all stages as completed
    for (const stage of swap.stages) {
      if (stage.status !== 'FAILED' && stage.status !== 'COMPLETED') {
        await this.db.updateSwapStage(stage.id, {
          status: 'COMPLETED',
          completedAt: new Date(),
        })
      }
    }

    // Update Redis status
    await this.redis.setSwapStatus(intentId, 'completed', {
      swapId: swap.id,
      outputAmount: result.outputAmount.toString(),
      txHash: result.txHash,
    })

    logger.info('Swap completed', {
      intentId,
      swapId: swap.id,
      userAddress: swap.userAddress,
      outputAmount: result.outputAmount.toString(),
      txHash: result.txHash,
    })
  }

  async failSwap(intentId: string, error: string): Promise<void> {
    const swap = await this.db.getSwapByIntentId(intentId)
    if (!swap) {
      throw new Error(`Swap not found: ${intentId}`)
    }

    await this.db.updateSwap(swap.id, {
      status: 'FAILED',
      error,
    })

    // Update Redis status
    await this.redis.setSwapStatus(intentId, 'failed', {
      swapId: swap.id,
      error,
    })

    logger.error('Swap failed', {
      intentId,
      swapId: swap.id,
      userAddress: swap.userAddress,
      error,
    })
  }

  async cancelSwap(intentId: string): Promise<void> {
    const swap = await this.db.getSwapByIntentId(intentId)
    if (!swap) {
      throw new Error(`Swap not found: ${intentId}`)
    }

    if (swap.status !== 'ENCRYPTED_PENDING') {
      throw new Error(`Swap cannot be cancelled in status: ${swap.status}`)
    }

    await this.db.updateSwap(swap.id, {
      status: 'CANCELLED',
    })

    // Update Redis status
    await this.redis.setSwapStatus(intentId, 'cancelled', {
      swapId: swap.id,
    })

    logger.info('Swap cancelled', {
      intentId,
      swapId: swap.id,
      userAddress: swap.userAddress,
    })
  }

  async getSwapByIntentId(intentId: string) {
    return this.db.getSwapByIntentId(intentId)
  }

  async processPendingSwaps(): Promise<void> {
    const pendingSwaps = await this.db.getPendingSwaps()
    logger.info(`Processing ${pendingSwaps.length} pending swaps`)

    for (const swap of pendingSwaps) {
      try {
        await this.processSwap(swap)
      } catch (error) {
        logger.error('Failed to process swap', {
          swapId: swap.id,
          intentId: swap.intentId,
          error,
        })
        await this.failSwap(swap.intentId || '', error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  private async processSwap(swap: any): Promise<void> {
    // This is where the actual swap processing logic would go
    // For now, we'll simulate the process

    if (swap.intentId) {
      // Step 1: Token Wrapping
      await this.updateSwapStage(swap.id, 'Token Wrapping', 'IN_PROGRESS')
      await new Promise(resolve => setTimeout(resolve, 2000))
      await this.updateSwapStage(swap.id, 'Token Wrapping', 'COMPLETED')

      // Step 2: Encrypted Computation
      await this.updateSwapStage(swap.id, 'Encrypted Computation', 'IN_PROGRESS')
      await new Promise(resolve => setTimeout(resolve, 3000))
      await this.updateSwapStage(swap.id, 'Encrypted Computation', 'COMPLETED')

      // Step 3: Settlement
      await this.updateSwapStage(swap.id, 'Settlement', 'IN_PROGRESS')
      await new Promise(resolve => setTimeout(resolve, 2000))
      await this.updateSwapStage(swap.id, 'Settlement', 'COMPLETED')

      // Complete the swap
      const mockOutputAmount = swap.inputAmount * BigInt(95) // Mock conversion
      await this.completeSwap(swap.intentId, {
        outputAmount: mockOutputAmount,
        txHash: 'mock-tx-hash-' + Math.random().toString(36).substring(7),
        arciumProof: 'mock-arcium-proof',
        computationHash: 'mock-computation-hash',
      })
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.db.cleanupExpiredSessions()
  }

  async cleanupExpiredQuotes(): Promise<void> {
    await this.db.cleanupExpiredQuotes()
  }
}
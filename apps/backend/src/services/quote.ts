import { logger } from '@/lib/logger'
import { config } from '@/lib/config'
import { RedisService } from './redis'

export interface QuoteRequest {
  inputToken: string
  outputToken: string
  inputAmount: string
  slippageBps: number
  privacyMode: boolean
}

export interface QuoteResponse {
  inputAmount: string
  outputAmount: string
  priceImpact: string
  fee: {
    baseBps: number
    privacyBps: number
    totalBps: number
  }
  routes: Array<{
    name: string
    output: string
    steps: Array<{
      pool: string
      input: string
      output: string
    }>
  }>
  timestamp: number
  validFor: number
}

export class QuoteService {
  constructor(private redis: RedisService) {}

  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const cacheKey = `quote:${request.inputToken}:${request.outputToken}:${request.inputAmount}:${request.slippageBps}:${request.privacyMode}`

    // Try to get from cache first
    const cached = await this.redis.getCachedQuote(cacheKey)
    if (cached) {
      logger.debug('Quote cache hit', { cacheKey })
      return cached
    }

    // Fetch fresh quote
    let quote: QuoteResponse

    if (config.ENABLE_MOCK_QUOTE_API) {
      quote = await this.getMockQuote(request)
    } else {
      quote = await this.getJupiterQuote(request)
    }

    // Cache the quote for 10 seconds
    await this.redis.cacheQuote(cacheKey, quote, 10)

    return quote
  }

  private async getJupiterQuote(request: QuoteRequest): Promise<QuoteResponse> {
    try {
      const jupiterUrl = `${config.JUPITER_API_BASE_URL}/quote`

      const body = {
        inputMint: request.inputToken,
        outputMint: request.outputToken,
        amount: request.inputAmount,
        slippageBps: request.slippageBps,
        onlyDirectRoutes: false,
        asLegacyTransaction: false,
        maxAccounts: 20,
      }

      const response = await fetch(jupiterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.JUPITER_API_KEY && { 'Authorization': `Bearer ${config.JUPITER_API_KEY}` }),
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Convert Jupiter response to our format
      const totalFeeBps = request.privacyMode ? 35 : 25 // Base 0.25% + privacy 0.1%
      const feeAmount = Math.floor((data.outAmount * totalFeeBps) / 10000)
      const netOutput = Math.max(data.outAmount - feeAmount, 0)

      return {
        inputAmount: request.inputAmount,
        outputAmount: netOutput.toString(),
        priceImpact: data.priceImpactPct || '0',
        fee: {
          baseBps: 25,
          privacyBps: request.privacyMode ? 10 : 0,
          totalBps,
        },
        routes: [
          {
            name: 'Jupiter Aggregated',
            output: netOutput.toString(),
            steps: data.routePlan?.map((step: any) => ({
              pool: step.swapInfo.ammKey || 'Unknown',
              input: step.swapInfo.inAmount,
              output: step.swapInfo.outAmount,
            })) || [],
          },
        ],
        timestamp: Date.now(),
        validFor: 10000, // 10 seconds
      }
    } catch (error) {
      logger.error('Jupiter quote fetch failed', { error, request })
      throw new Error('Failed to fetch quote from Jupiter API')
    }
  }

  private async getMockQuote(request: QuoteRequest): Promise<QuoteResponse> {
    // Mock exchange rates for development
    const mockRates: Record<string, number> = {
      'So11111111111111111111111111111111111111112-EPjFWdd5Au17hunJyHyer4hoi6UcsbkxNmnpDnJ55ip2': 3692.2, // SOL to USDC
      'EPjFWdd5Au17hunJyHyer4hoi6UcsbkxNmnpDnJ55ip2-So11111111111111111111111111111111111111112': 0.0002709, // USDC to SOL
      'So11111111111111111111111111111111111111112-DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 25000000, // SOL to BONK
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263-So11111111111111111111111111111111111111112': 0.00000004, // BONK to SOL
    }

    const rateKey = `${request.inputToken}-${request.outputToken}`
    const rate = mockRates[rateKey] || 1

    const inputAmount = parseInt(request.inputAmount)
    const totalFeeBps = request.privacyMode ? 35 : 25
    const grossOutput = Math.floor(inputAmount * rate)
    const feeAmount = Math.floor((grossOutput * totalFeeBps) / 10000)
    const netOutput = Math.max(grossOutput - feeAmount, 0)

    return {
      inputAmount: request.inputAmount,
      outputAmount: netOutput.toString(),
      priceImpact: '0.08',
      fee: {
        baseBps: 25,
        privacyBps: request.privacyMode ? 10 : 0,
        totalBps,
      },
      routes: [
        {
          name: 'Orca Direct',
          output: netOutput.toString(),
          steps: [
            {
              pool: `${request.inputToken}/${request.outputToken}`,
              input: request.inputAmount,
              output: netOutput.toString(),
            },
          ],
        },
      ],
      timestamp: Date.now(),
      validFor: 10000,
    }
  }

  async invalidateQuoteCache(inputToken: string, outputToken: string): Promise<void> {
    const pattern = `quote:${inputToken}:${outputToken}:*`
    await this.redis.clearPattern(pattern)
  }

  async getSupportedTokens(): Promise<Array<{ mint: string; symbol: string; name: string; decimals: number }>> {
    // Mock supported tokens for now
    return [
      {
        mint: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
      },
      {
        mint: 'EPjFWdd5Au17hunJyHyer4hoi6UcsbkxNmnpDnJ55ip2',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
      },
      {
        mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
      },
      {
        mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        symbol: 'BONK',
        name: 'Bonk',
        decimals: 5,
      },
    ]
  }

  async validateTokenPair(inputToken: string, outputToken: string): Promise<boolean> {
    const supportedTokens = await this.getSupportedTokens()
    const inputSupported = supportedTokens.some(token => token.mint === inputToken)
    const outputSupported = supportedTokens.some(token => token.mint === outputToken)

    return inputSupported && outputSupported && inputToken !== outputToken
  }
}
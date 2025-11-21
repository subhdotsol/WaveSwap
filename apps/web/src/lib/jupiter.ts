/**
 * Jupiter Swap API Integration
 *
 * This module provides integration with Jupiter's Swap API for token swapping.
 * Supports both standard swaps and privacy-aware routing for confidential tokens.
 *
 * References:
 * - Jupiter Swap API: https://hub.jup.ag/docs/swap-api/
 * - Jupiter SDK: https://www.npmjs.com/package/@jup-ag/api
 */

import { createJupiterApiClient, QuoteGetRequest, QuoteResponse } from '@jup-ag/api'
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import https from 'https'

export interface JupiterToken {
  address: string
  chainId: number
  decimals: number
  name: string
  symbol: string
  logoURI: string
  tags: string[]
  addressable?: boolean
}

export interface JupiterQuoteParams {
  inputMint: string
  outputMint: string
  amount: string
  slippageBps?: number
  feeAccount?: string
  userPublicKey?: string
  onlyDirectRoutes?: boolean
  asLegacyTransaction?: boolean
  platformFeeBps?: number
}

export interface JupiterQuoteResponse {
  inputMint: string
  inAmount: string
  outputMint: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: 'ExactIn' | 'ExactOut'
  slippageBps: number
  platformFee?: {
    amount: string
    feeBps: number
  }
  priceImpactPct: string
  routePlan: any[]

  // Additional fields for advanced routing
  contextSlot?: number
  timeTaken?: number
  computeUnitLimitMicroLamports?: number
}

export interface JupiterSwapParams {
  quoteResponse: JupiterQuoteResponse
  userPublicKey: string
  wrapAndUnwrapSol: boolean
  useSharedAccounts?: boolean
  feeAccount?: string
  skipUserAccountsRpcCalls?: boolean
  asLegacyTransaction?: boolean
  prioritizationFeeLamports?: number
}

export interface JupiterSwapResponse {
  swapTransaction: string // Base64 encoded transaction
  lastValidBlockHeight: number
  prioritizationFeeLamports?: number
  computeUnitLimitMicroLamports?: number
}

/**
 * Jupiter API Client
 * API Docs: https://hub.jup.ag/docs/swap-api/
 */
export class JupiterAPI {
  private jupiterApi: ReturnType<typeof createJupiterApiClient>
  private connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
    // Configure with new API endpoint
    // https://hub.jup.ag/docs/ - API Gateway migration
    this.jupiterApi = createJupiterApiClient({
      basePath: 'https://lite-api.jup.ag/swap/v1'
    })
  }

  /**
   * Create Jupiter API client
   * @param connection Solana connection
   * @returns Jupiter API client instance
   */
  static createClient(connection: Connection): JupiterAPI {
    return new JupiterAPI(connection)
  }

  /**
   * Get swap quote from Jupiter using direct REST API (more reliable)
   * @param params Quote parameters
   * @returns Swap quote with routing information
   */
  async getQuote(params: JupiterQuoteParams): Promise<JupiterQuoteResponse> {
    const maxRetries = 3
    const retryDelay = 1000 // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Getting Jupiter quote via REST API (attempt ${attempt}/${maxRetries}):`, params)

        // Build the URL for Jupiter REST API
        const url = new URL('https://lite-api.jup.ag/swap/v1/quote') // Use working endpoint
        url.searchParams.set('inputMint', params.inputMint)
        url.searchParams.set('outputMint', params.outputMint)
        url.searchParams.set('amount', params.amount) // Keep as string
        url.searchParams.set('slippageBps', String(params.slippageBps || 50))

        if (params.userPublicKey) {
          url.searchParams.set('userPublicKey', params.userPublicKey)
        }

        if (params.onlyDirectRoutes) {
          url.searchParams.set('onlyDirectRoutes', 'true')
        }

        if (params.asLegacyTransaction) {
          url.searchParams.set('asLegacyTransaction', 'true')
        }

        console.log('[Jupiter REST API] Request URL:', url.toString())

        // Add delay between retries to avoid rate limiting
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        }

        // Server-side compatible fetch for Jupiter API
        let response: Response

        if (typeof window === 'undefined') {
          // Server-side: use https module for Node.js
          response = await new Promise((resolve, reject) => {
            const req = https.request(url.toString(), {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WaveSwap/1.0.0',
                'Accept': 'application/json',
              },
              timeout: 15000, // Increased timeout for rate limit handling
            }, (res) => {
              let data = ''
              res.on('data', (chunk) => {
                data += chunk
              })
              res.on('end', () => {
                resolve(new Response(data, {
                  status: res.statusCode,
                  statusText: res.statusMessage,
                  headers: {
                    'Content-Type': res.headers['content-type'] || 'application/json',
                  }
                }))
              })
            })

            req.on('error', reject)
            req.on('timeout', () => {
              req.destroy()
              reject(new Error('Request timeout'))
            })

            req.end()
          })
        } else {
          // Client-side: use regular fetch
          response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'WaveSwap/1.0.0',
            }
          })
        }

        // Handle rate limiting with retry
        if (response.status === 429) {
          if (attempt < maxRetries) {
            console.log(`[Jupiter REST API] Rate limited, retrying in ${retryDelay * attempt}ms...`)
            continue
          } else {
            throw new Error('Rate limit exceeded. Please try again in a few moments.')
          }
        }

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[Jupiter REST API] Error response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          })

          // Don't retry on client errors (4xx), only on server errors (5xx)
          if (response.status === 400) {
            // Provide more specific error for 400 (bad request) which is often token-related
            if (errorText.includes('not found') || errorText.includes('invalid')) {
              throw new Error('Invalid token address. One or more tokens may not be supported by Jupiter.')
            }
            throw new Error(`Jupiter API rejected the request: ${errorText || 'Invalid parameters'}`)
          } else if (response.status >= 400 && response.status < 500) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          } else if (attempt < maxRetries) {
            continue
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        }

        const quote = await response.json()

        console.log('Jupiter REST API quote received:', {
          inAmount: quote.inAmount,
          outAmount: quote.outAmount,
          priceImpact: quote.priceImpactPct
        })

        // Return the quote directly from REST API (same format as our interface)
        return {
          inputMint: quote.inputMint,
          inAmount: quote.inAmount,
          outputMint: quote.outputMint,
          outAmount: quote.outAmount,
          otherAmountThreshold: quote.otherAmountThreshold,
          swapMode: quote.swapMode,
          slippageBps: quote.slippageBps,
          platformFee: quote.platformFee,
          priceImpactPct: quote.priceImpactPct,
          routePlan: quote.routePlan,
          contextSlot: quote.contextSlot,
          timeTaken: quote.timeTaken,
        }
      } catch (error: any) {
        console.error(`[Jupiter REST API] Quote error (attempt ${attempt}/${maxRetries}):`, {
          message: error?.message,
          name: error?.name,
        })

        // If this is our last attempt, throw the error
        if (attempt === maxRetries) {
          if (error instanceof Error) {
            throw new Error(`Jupiter quote failed: ${error.message}`)
          }
          throw new Error('Failed to get quote from Jupiter')
        }

        // Continue to next retry
        continue
      }
    }

    throw new Error('Failed to get quote after all retries')
  }

  /**
   * Execute swap transaction using Jupiter SDK
   * @param params Swap parameters
   * @returns Swap transaction ready to be signed
   */
  async getSwapTransaction(params: JupiterSwapParams): Promise<JupiterSwapResponse> {
    try {
      const url = new URL('https://lite-api.jup.ag/swap/v1/swap')

      const requestBody = {
        quoteResponse: params.quoteResponse,
        userPublicKey: params.userPublicKey,
        wrapAndUnwrapSol: params.wrapAndUnwrapSol,
        useSharedAccounts: params.useSharedAccounts,
        feeAccount: params.feeAccount,
        asLegacyTransaction: params.asLegacyTransaction,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: params.prioritizationFeeLamports,
      }

      console.log('[Jupiter REST API] Executing swap via REST:', {
        inputMint: params.quoteResponse.inputMint,
        outputMint: params.quoteResponse.outputMint,
        inAmount: params.quoteResponse.inAmount,
        outAmount: params.quoteResponse.outAmount
      })

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Jupiter REST API] Swap execution error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const swapResult = await response.json()

      if (!swapResult) {
        throw new Error('No swap transaction returned from Jupiter')
      }

      return {
        swapTransaction: swapResult.swapTransaction,
        lastValidBlockHeight: swapResult.lastValidBlockHeight,
        prioritizationFeeLamports: swapResult.prioritizationFeeLamports,
      }
    } catch (error) {
      console.error('Error getting Jupiter swap transaction:', error)
      if (error instanceof Error) {
        throw new Error(`Jupiter swap transaction failed: ${error.message}`)
      }
      throw new Error('Failed to get swap transaction from Jupiter')
    }
  }

  /**
   * Decode and prepare transaction for signing
   * @param swapResponse Response from Jupiter swap API
   * @returns Transaction object ready for signing
   */
  async prepareTransaction(swapResponse: JupiterSwapResponse): Promise<Transaction | VersionedTransaction> {
    try {
      const transactionBuffer = Buffer.from(swapResponse.swapTransaction, 'base64')

      // Try to decode as VersionedTransaction first
      try {
        return VersionedTransaction.deserialize(transactionBuffer)
      } catch {
        // If fails, try as legacy Transaction
        return Transaction.from(transactionBuffer)
      }
    } catch (error) {
      console.error('Error preparing transaction:', error)
      throw new Error('Failed to prepare transaction for signing')
    }
  }

  /**
   * Simulate transaction to verify execution
   * @param transaction Transaction to simulate
   * @returns Simulation result
   */
  async simulateTransaction(transaction: Transaction | VersionedTransaction): Promise<any> {
    try {
      let simulationPayload: any

      if ('version' in transaction) {
        // VersionedTransaction
        simulationPayload = {
          encoding: 'base64',
          commitment: 'confirmed',
          simulate: true,
        }
      } else {
        // Legacy Transaction
        simulationPayload = {
          encoding: 'base64',
          commitment: 'confirmed',
          simulate: true,
        }
      }

      let result
      if ('version' in transaction) {
        // VersionedTransaction
        result = await this.connection.simulateTransaction(transaction, simulationPayload)
      } else {
        // Legacy Transaction
        result = await this.connection.simulateTransaction(transaction, simulationPayload)
      }

      if (result.value.err) {
        throw new Error(`Transaction simulation failed: ${JSON.stringify(result.value.err)}`)
      }

      return result
    } catch (error) {
      console.error('Error simulating transaction:', error)
      throw new Error('Failed to simulate transaction')
    }
  }

}

/**
 * Utility functions for Jupiter integration
 */
export const JupiterUtils = {
  /**
   * Create Jupiter API client
   * @param connection Solana connection
   */
  createClient(connection: Connection): JupiterAPI {
    return new JupiterAPI(connection)
  },

  /**
   * Format amount for Jupiter API (in smallest unit)
   * @param amount Amount in human readable format
   * @param decimals Token decimals
   * @returns Amount in smallest unit
   */
  formatAmount(amount: number, decimals: number): string {
    return Math.floor(amount * Math.pow(10, decimals)).toString()
  },

  /**
   * Parse amount from Jupiter response
   * @param amount Amount in smallest unit
   * @param decimals Token decimals
   * @returns Human readable amount
   */
  parseAmount(amount: string, decimals: number): number {
    return parseFloat(amount) / Math.pow(10, decimals)
  },

  /**
   * Calculate price impact percentage
   * @param priceImpactStr Price impact string from Jupiter
   * @returns Price impact as number
   */
  parsePriceImpact(priceImpactStr: string): number {
    return parseFloat(priceImpactStr) * 100
  },

  /**
   * Check if route is acceptable for privacy mode
   * @param routePlan Route plan from Jupiter
   * @returns Whether route respects privacy requirements
   */
  isPrivacyCompatible(routePlan: any[]): boolean {
    // TODO: Implement privacy checks
    // For now, assume all routes are compatible
    return true
  },

  /**
   * Filter tokens for privacy compatibility
   * @param tokens Array of Jupiter tokens
   * @returns Tokens that support confidential operations
   */
  filterPrivacyCompatibleTokens(tokens: JupiterToken[]): JupiterToken[] {
    // TODO: Implement actual filtering based on Arcium support
    // For now, return major tokens
    const supportedSymbols = ['SOL', 'USDC', 'USDT', 'RAY', 'BONK']
    return tokens.filter(token => supportedSymbols.includes(token.symbol))
  }
}

// Types are already exported as interfaces above
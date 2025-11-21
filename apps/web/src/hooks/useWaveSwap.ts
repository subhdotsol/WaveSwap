'use client'

import { useState, useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'

interface QuoteRequest {
  inputMint: string
  outputMint: string
  amount: number
  slippageBps: number
  privacyMode: boolean
}

interface QuoteResponse {
  inputMint: string
  outputMint: string
  amount: number
  outputAmount: number
  priceImpact: number
  routes: Array<{
    name: string
    output: number
    steps: Array<{
      pool: string
      input: number
      output: number
    }>
  }>
  fee: {
    baseBps: number
    privacyBps: number
    totalBps: number
  }
  timestamp: number
  validFor: number
}

export function useWaveSwap() {
  const { connection } = useConnection()
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getQuote = useCallback(async (request: QuoteRequest): Promise<QuoteResponse | null> => {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual WaveSwap API call
      const response = await fetch('/api/v1/swap/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputToken: request.inputMint,
          outputToken: request.outputMint,
          inputAmount: request.amount.toString(),
          slippageBps: request.slippageBps,
          privacyMode: request.privacyMode,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setQuote(data)
      return data
    } catch (err) {
      console.error('Failed to get quote:', err)

      // Fallback to mock data for development
      const mockQuote: QuoteResponse = {
        inputMint: request.inputMint,
        outputMint: request.outputMint,
        amount: request.amount,
        outputAmount: Math.floor(request.amount * 0.95 * (1 - (request.privacyMode ? 0.0035 : 0.0025))), // Mock rate with fees
        priceImpact: 0.08,
        routes: [
          {
            name: 'Orca Direct',
            output: Math.floor(request.amount * 0.95 * (1 - (request.privacyMode ? 0.0035 : 0.0025))),
            steps: [
              {
                pool: `${request.inputMint}/${request.outputMint}`,
                input: request.amount,
                output: Math.floor(request.amount * 0.95 * (1 - (request.privacyMode ? 0.0035 : 0.0025)))
              }
            ]
          }
        ],
        fee: {
          baseBps: 25,
          privacyBps: request.privacyMode ? 10 : 0,
          totalBps: request.privacyMode ? 35 : 25
        },
        timestamp: Date.now(),
        validFor: 10000
      }

      setQuote(mockQuote)
      return mockQuote
    } finally {
      setLoading(false)
    }
  }, [])

  const clearQuote = useCallback(() => {
    setQuote(null)
    setError(null)
  }, [])

  return {
    quote,
    loading,
    error,
    getQuote,
    clearQuote,
  }
}
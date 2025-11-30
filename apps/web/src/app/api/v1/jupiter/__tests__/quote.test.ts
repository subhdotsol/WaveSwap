import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET } from '../quote/route'
import { NextRequest } from 'next/server'

// Mock the Jupiter API
vi.mock('@/lib/jupiter', () => ({
  JupiterAPI: {
    createClient: vi.fn(() => ({
      getQuote: vi.fn(),
    })),
  },
}))

// Mock the Connection
vi.mock('@solana/web3.js', () => ({
  Connection: vi.fn(() => ({})),
}))

describe('/api/v1/jupiter/swap/v1/quote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Valid Requests', () => {
    it('returns a quote with valid parameters', async () => {
      const { JupiterAPI } = await import('@/lib/jupiter')
      const mockGetQuote = vi.fn().mockResolvedValue({
        inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        outputMint: 'So11111111111111111111111111111111111111112',
        inputAmount: '1000000',
        outputAmount: '10000000',
        priceImpactPct: 0.12,
        routePlan: [
          {
            swapInfo: {
              ammKey: 'amm-key',
              label: 'Serum',
              notEnoughLiquidity: false,
              inAmount: '1000000',
              outAmount: '10000000',
              feeAmount: '1000',
              feeMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            },
          },
        ],
      })

      const mockClient = { getQuote: mockGetQuote }
      ;(JupiterAPI.createClient as any).mockReturnValue(mockClient)

      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.inputMint).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
      expect(data.outputMint).toBe('So11111111111111111111111111111111111111112')
      expect(data.inputAmount).toBe('1000000')
      expect(data.outputAmount).toBe('10000000')
      expect(mockGetQuote).toHaveBeenCalledWith({
        inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        outputMint: 'So11111111111111111111111111111111111111112',
        amount: '1000000',
        slippageBps: undefined,
        userPublicKey: undefined,
        onlyDirectRoutes: false,
        asLegacyTransaction: false,
      })
    })

    it('handles slippage parameter', async () => {
      const { JupiterAPI } = await import('@/lib/jupiter')
      const mockGetQuote = vi.fn().mockResolvedValue({
        inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        outputMint: 'So11111111111111111111111111111111111111112',
        inputAmount: '1000000',
        outputAmount: '10000000',
        priceImpactPct: 0.12,
      })

      const mockClient = { getQuote: mockGetQuote }
      ;(JupiterAPI.createClient as any).mockReturnValue(mockClient)

      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000&slippageBps=100'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockGetQuote).toHaveBeenCalledWith({
        inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        outputMint: 'So11111111111111111111111111111111111111112',
        amount: '1000000',
        slippageBps: 100,
        userPublicKey: undefined,
        onlyDirectRoutes: false,
        asLegacyTransaction: false,
      })
    })

    it('handles userPublicKey parameter', async () => {
      const { JupiterAPI } = await import('@/lib/jupiter')
      const mockGetQuote = vi.fn().mockResolvedValue({
        inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        outputMint: 'So11111111111111111111111111111111111111112',
        inputAmount: '1000000',
        outputAmount: '10000000',
        priceImpactPct: 0.12,
      })

      const mockClient = { getQuote: mockGetQuote }
      ;(JupiterAPI.createClient as any).mockReturnValue(mockClient)

      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000&userPublicKey=9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockGetQuote).toHaveBeenCalledWith({
        inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        outputMint: 'So11111111111111111111111111111111111111112',
        amount: '1000000',
        slippageBps: undefined,
        userPublicKey: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        onlyDirectRoutes: false,
        asLegacyTransaction: false,
      })
    })

    it('handles boolean parameters correctly', async () => {
      const { JupiterAPI } = await import('@/lib/jupiter')
      const mockGetQuote = vi.fn().mockResolvedValue({
        inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        outputMint: 'So11111111111111111111111111111111111111112',
        inputAmount: '1000000',
        outputAmount: '10000000',
        priceImpactPct: 0.12,
      })

      const mockClient = { getQuote: mockGetQuote }
      ;(JupiterAPI.createClient as any).mockReturnValue(mockClient)

      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000&onlyDirectRoutes=true&asLegacyTransaction=true'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockGetQuote).toHaveBeenCalledWith({
        inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        outputMint: 'So11111111111111111111111111111111111111112',
        amount: '1000000',
        slippageBps: undefined,
        userPublicKey: undefined,
        onlyDirectRoutes: true,
        asLegacyTransaction: true,
      })
    })
  })

  describe('Error Handling', () => {
    it('returns 400 for missing inputMint parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?outputMint=So11111111111111111111111111111111111111112&amount=1000000'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required parameters: inputMint, outputMint, amount')
    })

    it('returns 400 for missing outputMint parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required parameters: inputMint, outputMint, amount')
    })

    it('returns 400 for missing amount parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required parameters: inputMint, outputMint, amount')
    })

    it('handles Jupiter API 404 error', async () => {
      const { JupiterAPI } = await import('@/lib/jupiter')
      const mockGetQuote = vi.fn().mockRejectedValue(new Error('Jupiter API returned status 404'))
      const mockClient = { getQuote: mockGetQuote }
      ;(JupiterAPI.createClient as any).mockReturnValue(mockClient)

      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Jupiter API endpoint not found. Please check token addresses.')
    })

    it('handles invalid token address error', async () => {
      const { JupiterAPI } = await import('@/lib/jupiter')
      const mockGetQuote = vi.fn().mockRejectedValue(new Error('Invalid token address'))
      const mockClient = { getQuote: mockGetQuote }
      ;(JupiterAPI.createClient as any).mockReturnValue(mockClient)

      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=invalid-address&outputMint=So11111111111111111111111111111111111111112&amount=1000000'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('One or more tokens are not supported by Jupiter.')
    })

    it('handles rate limit error', async () => {
      const { JupiterAPI } = await import('@/lib/jupiter')
      const mockGetQuote = vi.fn().mockRejectedValue(new Error('Rate limit exceeded'))
      const mockClient = { getQuote: mockGetQuote }
      ;(JupiterAPI.createClient as any).mockReturnValue(mockClient)

      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Too many requests. Please try again in a moment.')
    })

    it('handles generic Jupiter API error', async () => {
      const { JupiterAPI } = await import('@/lib/jupiter')
      const mockGetQuote = vi.fn().mockRejectedValue(new Error('Generic API error'))
      const mockClient = { getQuote: mockGetQuote }
      ;(JupiterAPI.createClient as any).mockReturnValue(mockClient)

      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Generic API error')
    })

    it('handles custom error message', async () => {
      const { JupiterAPI } = await import('@/lib/jupiter')
      const mockGetQuote = vi.fn().mockRejectedValue({ message: 'Custom error message' })
      const mockClient = { getQuote: mockGetQuote }
      ;(JupiterAPI.createClient as any).mockReturnValue(mockClient)

      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Custom error message')
    })
  })

  describe('Environment Configuration', () => {
    it('uses default Solana RPC endpoint when environment variable is not set', async () => {
      const { Connection } = await import('@solana/web3.js')
      delete process.env.SOLANA_RPC_ENDPOINT

      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000'
      )

      // Mock Jupiter API to avoid real network calls
      const { JupiterAPI } = await import('@/lib/jupiter')
      const mockGetQuote = vi.fn().mockResolvedValue({})
      const mockClient = { getQuote: mockGetQuote }
      ;(JupiterAPI.createClient as any).mockReturnValue(mockClient)

      await GET(request)

      expect(Connection).toHaveBeenCalledWith('https://api.devnet.solana.com', 'confirmed')
    })

    it('uses custom Solana RPC endpoint when environment variable is set', async () => {
      const { Connection } = await import('@solana/web3.js')
      process.env.SOLANA_RPC_ENDPOINT = 'https://custom-rpc.example.com'

      const request = new NextRequest(
        'http://localhost:3000/api/v1/jupiter/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000'
      )

      // Mock Jupiter API to avoid real network calls
      const { JupiterAPI } = await import('@/lib/jupiter')
      const mockGetQuote = vi.fn().mockResolvedValue({})
      const mockClient = { getQuote: mockGetQuote }
      ;(JupiterAPI.createClient as any).mockReturnValue(mockClient)

      await GET(request)

      expect(Connection).toHaveBeenCalledWith('https://custom-rpc.example.com', 'confirmed')

      // Clean up
      delete process.env.SOLANA_RPC_ENDPOINT
    })
  })
})
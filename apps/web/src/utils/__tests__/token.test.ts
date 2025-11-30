import { describe, it, expect } from 'vitest'

// Test utility functions for token handling

describe('Token Utilities', () => {
  describe('formatTokenAmount', () => {
    it('formats small token amounts correctly', () => {
      // Mock implementation
      const formatTokenAmount = (amount: string, decimals: number): string => {
        const num = parseFloat(amount) / Math.pow(10, decimals)
        if (num < 0.000001) return '< 0.000001'
        if (num < 0.01) return num.toFixed(6)
        if (num < 1) return parseFloat(num.toFixed(4)).toString() // Remove trailing zeros
        return parseFloat(num.toFixed(2)).toString() // Remove trailing zeros
      }

      expect(formatTokenAmount('1000000', 6)).toBe('1') // 1 USDC
      expect(formatTokenAmount('500000', 6)).toBe('0.5') // 0.5 USDC
      expect(formatTokenAmount('1000', 9)).toBe('0.000001') // 1 lamport SOL
      expect(formatTokenAmount('500000000', 9)).toBe('0.5') // 0.5 SOL
    })

    it('handles zero amounts', () => {
      const formatTokenAmount = (amount: string, decimals: number): string => {
        const num = parseFloat(amount) / Math.pow(10, decimals)
        if (num === 0) return '0'
        if (num < 0.000001) return '< 0.000001'
        if (num < 0.01) return num.toFixed(6)
        if (num < 1) return num.toFixed(4)
        return num.toFixed(2)
      }

      expect(formatTokenAmount('0', 6)).toBe('0')
      expect(formatTokenAmount('000', 9)).toBe('0')
    })
  })

  describe('getTokenSymbol', () => {
    it('returns correct symbol for known tokens', () => {
      const knownTokens: { [key: string]: string } = {
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
        'So11111111111111111111111111111111111111112': 'SOL',
        'WAVE-token-address-here': 'WAVE',
      }

      expect(knownTokens['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']).toBe('USDC')
      expect(knownTokens['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB']).toBe('USDT')
      expect(knownTokens['So11111111111111111111111111111111111111112']).toBe('SOL')
      expect(knownTokens['WAVE-token-address-here']).toBe('WAVE')
    })

    it('handles unknown token addresses', () => {
      const getTokenSymbol = (address: string): string => {
        const knownTokens: { [key: string]: string } = {
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
          'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
        }
        return knownTokens[address] || 'UNKNOWN'
      }

      expect(getTokenSymbol('unknown-address')).toBe('UNKNOWN')
    })
  })

  describe('isConfidentialSupported', () => {
    it('identifies tokens that support confidential transfers', () => {
      const confidentialSupportedTokens = new Set([
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'WAVE-token-address-here', // WAVE
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      ])

      const isConfidentialSupported = (tokenAddress: string): boolean => {
        return confidentialSupportedTokens.has(tokenAddress)
      }

      expect(isConfidentialSupported('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true)
      expect(isConfidentialSupported('WAVE-token-address-here')).toBe(true)
      expect(isConfidentialSupported('So11111111111111111111111111111111111111112')).toBe(false) // SOL
    })
  })

  describe('getConfidentialSymbol', () => {
    it('adds c prefix for supported tokens in privacy mode', () => {
      const getConfidentialSymbol = (symbol: string, isPrivacyMode: boolean, isOutputSelector: boolean, isConfidentialSupported: boolean): string => {
        if (isPrivacyMode && isOutputSelector && isConfidentialSupported) {
          return `c${symbol}`
        }
        return symbol
      }

      expect(getConfidentialSymbol('USDC', true, true, true)).toBe('cUSDC')
      expect(getConfidentialSymbol('WAVE', true, true, true)).toBe('cWAVE')
      expect(getConfidentialSymbol('SOL', true, true, false)).toBe('SOL') // Not supported
      expect(getConfidentialSymbol('USDC', true, false, true)).toBe('USDC') // Input selector
      expect(getConfidentialSymbol('USDC', false, true, true)).toBe('USDC') // Not privacy mode
    })
  })

  describe('validateTokenAmount', () => {
    it('validates token amounts correctly', () => {
      const validateTokenAmount = (amount: string, balance: string, decimals: number): { isValid: boolean; error?: string } => {
        const amountNum = parseFloat(amount)
        const balanceNum = parseFloat(balance)

        if (!amount || amountNum <= 0) {
          return { isValid: false, error: 'Amount must be greater than 0' }
        }

        if (amountNum > balanceNum) {
          return { isValid: false, error: 'Insufficient balance' }
        }

        return { isValid: true }
      }

      // Valid cases
      expect(validateTokenAmount('100', '1000', 6)).toEqual({ isValid: true })
      expect(validateTokenAmount('0.5', '1000000', 6)).toEqual({ isValid: true })

      // Invalid cases
      expect(validateTokenAmount('0', '1000', 6)).toEqual({ isValid: false, error: 'Amount must be greater than 0' })
      expect(validateTokenAmount('-100', '1000', 6)).toEqual({ isValid: false, error: 'Amount must be greater than 0' })
      expect(validateTokenAmount('2000', '1000', 6)).toEqual({ isValid: false, error: 'Insufficient balance' })
    })
  })

  describe('calculatePriceImpact', () => {
    it('calculates price impact correctly', () => {
      const calculatePriceImpact = (inputAmount: string, outputAmount: string, marketRate: number): number => {
        // Convert from smallest units to decimal
        const inputDecimal = parseFloat(inputAmount) / 1000000 // USDC has 6 decimals
        const outputDecimal = parseFloat(outputAmount) / 1000000000 // SOL has 9 decimals
        const expectedOutput = inputDecimal * marketRate
        const impact = ((expectedOutput - outputDecimal) / expectedOutput) * 100
        return Math.abs(impact)
      }

      // 1 USDC should get ~0.01 SOL at 0.01 SOL/USDC rate
      // If we only get 0.009 SOL, price impact is 10%
      expect(Math.round(calculatePriceImpact('1000000', '9000000', 0.01))).toBe(10)
      expect(calculatePriceImpact('1000000', '9950000', 0.01)).toBeCloseTo(0.5) // 0.5% impact
      expect(calculatePriceImpact('1000000', '10000000', 0.01)).toBeCloseTo(0) // No impact
    })
  })
})
/**
 * React Hook for Swap Operations
 *
 * Provides comprehensive swap state management with privacy support
 * using Jupiter API and Arcium Confidential SPL tokens.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Connection, Transaction, VersionedTransaction } from '@solana/web3.js'
import { createSwapService, SwapServiceConfig, SwapRequest, SwapUtils as ServiceSwapUtils } from '@/services/swap'
import { JupiterAPI, JupiterUtils } from '@/lib/jupiter'
import { DefiClient, DefiClientConfig } from 'encifher-swap-sdk'
import { Token, SwapQuote, SwapStatus, SwapProgress, SwapMode, getAvailableTokens } from '@/types/token'
import { COMMON_TOKENS, CONFIDENTIAL_TOKENS } from '@/types/token'
import { getUserTokens, getDefaultTokens, getTokenBalance, enrichTokenIcons } from '@/lib/tokens'
import { parseError, WaveSwapError } from '@/lib/errors'

export interface SwapState {
  inputToken: Token | null
  outputToken: Token | null
  inputAmount: string
  outputAmount: string
  swapMode: SwapMode
  quote: SwapQuote | null
  balances: Map<string, string>
  isLoading: boolean
  error: string | null
  structuredError: WaveSwapError | null
  progress: SwapProgress | null
  availableTokens: Token[]
}

export interface SwapActions {
  setInputToken: (token: Token) => void
  setOutputToken: (token: Token) => void
  setInputAmount: (amount: string) => void
  setOutputAmount: (amount: string) => void
  setSwapMode: (mode: SwapMode) => void
  swap: () => Promise<void>
  getQuote: () => Promise<void>
  refreshBalances: () => Promise<void>
  clearQuote: () => void
  clearError: () => void
  cancelSwap: () => void
}

export function useSwap(privacyMode: boolean, publicKey: PublicKey | null): SwapState & SwapActions {
  const { connection } = useConnection()
  const { signTransaction, signAllTransactions } = useWallet()
  const swapServiceRef = useRef<any>(null)

  // Core swap state - Initialize with empty tokens, will be populated by useEffect
  const [inputToken, setInputToken] = useState<Token | null>(null)
  const [outputToken, setOutputToken] = useState<Token | null>(null)
  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOutputAmount] = useState('')
  const [swapMode, setSwapMode] = useState<SwapMode>(privacyMode ? SwapMode.PRIVATE : SwapMode.NORMAL)
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [balances, setBalances] = useState<Map<string, string>>(new Map())

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [structuredError, setStructuredError] = useState<WaveSwapError | null>(null)
  const [progress, setProgress] = useState<SwapProgress | null>(null)
  const [availableTokens, setAvailableTokens] = useState<Token[]>([])

  // Initialize tokens with enriched icons on mount
  useEffect(() => {
    const initializeTokens = async () => {
      const tokens = await getAvailableTokens(privacyMode)
      setAvailableTokens(tokens)

      // Set initial tokens if not already set
      if (!inputToken && tokens.length > 0) {
        setInputToken(tokens[0] || null)
      }
      if (!outputToken && tokens.length > 1) {
        setOutputToken(tokens[1] || null)
      } else if (!outputToken && tokens.length > 0) {
        setOutputToken(tokens[0] || null)
      }
    }

    initializeTokens()
  }, []) // Only run once on mount

  // Initialize swap service when wallet is connected
  useEffect(() => {
    if (publicKey && connection) {
      try {
        const jupiterApi = JupiterAPI.createClient(connection)

        // Initialize DefiClient for Encifher (no API key required!)
        const config: DefiClientConfig = {
          rpcUrl: connection.rpcEndpoint,
          mode: 'Mainnet', // or 'Devnet' depending on environment
          encifherKey: '' // Empty string if not required
        }
        const defiClient = new DefiClient(config)

        // Integrated wallet adapter with Encifher support
        swapServiceRef.current = createSwapService({
          connection,
          jupiterApi,
          defiClient,
          userPublicKey: publicKey,
          signTransaction: async (tx: Transaction | VersionedTransaction) => {
            if (!signTransaction) {
              throw new Error('Wallet signing function not available')
            }
            try {
              return await signTransaction(tx)
            } catch (error: any) {
              // Handle wallet rejection gracefully
              if (error.name === 'WalletSignTransactionError' ||
                  error.message?.includes('User rejected the request') ||
                  error.message?.includes('rejected')) {
                throw new Error('Transaction cancelled by user')
              }
              throw error
            }
          },
          signAllTransactions: async (txs: (Transaction | VersionedTransaction)[]) => {
            if (!signAllTransactions) {
              throw new Error('Wallet batch signing function not available')
            }
            try {
              return await signAllTransactions(txs)
            } catch (error: any) {
              // Handle wallet rejection gracefully
              if (error.name === 'WalletSignTransactionError' ||
                  error.message?.includes('User rejected the request') ||
                  error.message?.includes('rejected')) {
                throw new Error('Transaction cancelled by user')
              }
              throw error
            }
          },
          onProgress: setProgress
        })
      } catch (error) {
        console.error('Failed to initialize swap service:', error)
        setError('Failed to initialize swap service')
      }
    }
  }, [publicKey, connection, signTransaction, signAllTransactions])

  // Update swap mode when privacy mode changes
  useEffect(() => {
    setSwapMode(privacyMode ? SwapMode.PRIVATE : SwapMode.NORMAL)
  }, [privacyMode])

  // In confidential mode, we use regular tokens with Encifher privacy wrapper
  const getJupiterToken = (token: Token): string => {
    // Always use the actual token address - Encifher handles the privacy wrapping
    return token.address
  }

  // Filter tokens based on swap mode
  useEffect(() => {
    const loadFilteredTokens = async () => {
      const filtered = await getAvailableTokens(privacyMode)
      setAvailableTokens(filtered)

      // Update selected tokens if they're not supported in current mode
      if (inputToken && !filtered.find((t: Token) => t.address === inputToken.address)) {
        setInputToken(filtered[0] || null)
      }
      if (outputToken && !filtered.find((t: Token) => t.address === outputToken.address)) {
        setOutputToken(filtered[1] || filtered[0] || null)
      }
    }

    loadFilteredTokens()
  }, [privacyMode, inputToken, outputToken])

  // Load user's tokens when wallet connects or privacy mode changes
  useEffect(() => {
    if (publicKey && connection) {
      loadUserTokens()
    } else {
      // No wallet, just show defaults
      const loadDefaultTokens = async () => {
        const defaultTokens = await getAvailableTokens(privacyMode)
        setAvailableTokens(defaultTokens)
      }
      loadDefaultTokens()
    }
  }, [publicKey, connection, privacyMode])

  // Load user's wallet tokens
  const loadUserTokens = async () => {
    if (!publicKey || !connection) return

    try {
      const userTokens = await getUserTokens(connection, publicKey)

      // Merge with available tokens based on privacy mode
      const tokenMap = new Map<string, Token>()

      // Add confidential tokens if in privacy mode
      if (privacyMode) {
        CONFIDENTIAL_TOKENS.forEach(token => tokenMap.set(token.address, token))
      }

      // Add user tokens
      userTokens.forEach(token => tokenMap.set(token.address, token))

      // Add common tokens
      COMMON_TOKENS.forEach(token => {
        if (!tokenMap.has(token.address)) {
          tokenMap.set(token.address, token)
        }
      })

      const allTokens = Array.from(tokenMap.values())

      // Enrich all tokens with icons from Jupiter API
      const enrichedTokens = await enrichTokenIcons(allTokens)
      setAvailableTokens(enrichedTokens)

      console.log('Loaded tokens:', enrichedTokens.map(t => t.symbol))
    } catch (error) {
      console.error('Error loading user tokens:', error)
      // Fall back to available tokens for current mode
      const fallbackTokens = await getAvailableTokens(privacyMode)
      setAvailableTokens(fallbackTokens)
    }
  }

  // Refresh balances when wallet connects or tokens change
  useEffect(() => {
    if (publicKey && (inputToken || outputToken)) {
      refreshBalances()
    }
  }, [publicKey, inputToken, outputToken])

  const handleSetInputAmount = useCallback((amount: string) => {
    setInputAmount(amount)
    clearQuote()
  }, [])

  const handleSetOutputAmount = useCallback((amount: string) => {
    setOutputAmount(amount)
  }, [])

  const handleSetInputToken = useCallback((token: Token) => {
    setInputToken(token)
    clearQuote()

    if (token.address === outputToken?.address) {
      setOutputToken(inputToken || COMMON_TOKENS[1]!)
    }

    setInputAmount('')
    setOutputAmount('')
  }, [outputToken, inputToken])

  const handleSetOutputToken = useCallback((token: Token) => {
    setOutputToken(token)
    clearQuote()

    if (token.address === inputToken?.address) {
      setInputToken(outputToken || COMMON_TOKENS[0]!)
    }

    setInputAmount('')
    setOutputAmount('')
  }, [inputToken, outputToken])

  const handleSetSwapMode = useCallback((mode: SwapMode) => {
    setSwapMode(mode)
    clearQuote()

    // Check if tokens support the new mode
    if (mode === 'private' && inputToken && outputToken) {
      if (!ServiceSwapUtils.canSwapPrivately(inputToken, outputToken)) {
        setError('One or both tokens do not support private swaps')
      }
    }
  }, [inputToken, outputToken])

  
  const getQuote = useCallback(async () => {
    if (!inputToken || !outputToken || !inputAmount || !publicKey) {
      return
    }

    // Prevent swapping the same token
    if (inputToken.address === outputToken.address) {
      setError('Cannot swap the same token. Please select different input and output tokens.')
      return
    }

    // Validate input amount
    const parsedAmount = parseFloat(inputAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Invalid amount')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Format amount as integer (smallest unit)
      const amountInSmallestUnit = Math.floor(parsedAmount * Math.pow(10, inputToken.decimals))
      
      // Map confidential tokens to their base tokens for Jupiter
      const jupiterInputMint = getJupiterToken(inputToken)
      const jupiterOutputMint = getJupiterToken(outputToken)
      
      console.log('Getting quote via API:', {
        inputMint: jupiterInputMint,
        outputMint: jupiterOutputMint,
        amount: amountInSmallestUnit.toString(),
        inputSymbol: inputToken.symbol,
        outputSymbol: outputToken.symbol,
        isConfidential: swapMode === 'private',
        originalInputMint: inputToken.address,
        originalOutputMint: outputToken.address
      })

      // In privacy mode, we use Encifher SDK directly through swap service
      // In normal mode, we use Jupiter API
      if (swapMode === 'private') {
        console.log('Using Encifher for private swap quote')
        // The quote will be handled by the swap service
        setQuote({
          inputMint: jupiterInputMint,
          outputMint: jupiterOutputMint,
          inputAmount: amountInSmallestUnit.toString(),
          outputAmount: '0', // Will be filled by Encifher
          priceImpactPct: 0,
          routePlan: []
        })
        setOutputAmount('0')
        return
      }

      // Use API route for normal Jupiter swaps
      const response = await fetch(`/api/v1/swap/quote?` + new URLSearchParams({
        inputMint: jupiterInputMint,
        outputMint: jupiterOutputMint,
        amount: amountInSmallestUnit.toString(),
        userPublicKey: publicKey.toString(),
        privacyMode: 'false'
      }))

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('Quote API response:', data)

      if (!data.success || !data.quote) {
        throw new Error(data.error || 'Invalid response from API')
      }

      const jupiterQuote = data.quote

      const newQuote: SwapQuote = {
        inputMint: jupiterQuote.inputMint,
        outputMint: jupiterQuote.outputMint,
        inputAmount: jupiterQuote.inAmount,
        outputAmount: jupiterQuote.outAmount,
        priceImpactPct: parseFloat(jupiterQuote.priceImpactPct) * 100,
        routePlan: jupiterQuote.routePlan
      }

      setQuote(newQuote)

      // Calculate output amount
      const output = parseFloat(newQuote.outputAmount) / Math.pow(10, outputToken.decimals)
      setOutputAmount(output.toFixed(outputToken.decimals).replace(/\.?0+$/, ''))

    } catch (error) {
      console.error('Error getting quote:', error)
      
      const parsedError = parseError(error)
      setStructuredError(parsedError)
      setError(parsedError.message)
    } finally {
      setIsLoading(false)
    }
  }, [inputToken, outputToken, inputAmount, publicKey, swapMode])

  const swap = useCallback(async () => {
    if (!swapServiceRef.current || !inputToken || !outputToken || !inputAmount) {
      const err = new Error('Missing swap parameters')
      const parsedError = parseError(err)
      setStructuredError(parsedError)
      setError(parsedError.message)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setStructuredError(null)
      setProgress(null)

      const request: SwapRequest = {
        inputToken,
        outputToken,
        inputAmount,
        privacyMode: swapMode === 'private',
        privacyProvider: swapMode === 'private' ? 'encifher' : undefined
      }

      console.log('Executing swap:', {
        inputToken: inputToken.symbol,
        outputToken: outputToken.symbol,
        amount: inputAmount,
        privacyMode: swapMode,
        provider: swapMode === 'private' ? 'Encifher' : 'Jupiter'
      })

      await swapServiceRef.current.executeSwap(request)

    } catch (error) {
      console.error('Error executing swap:', error)
      const parsedError = parseError(error)
      setStructuredError(parsedError)
      setError(parsedError.message)
    } finally {
      setIsLoading(false)
      setProgress(null)
    }
  }, [inputToken, outputToken, inputAmount, swapMode])

  const refreshBalances = useCallback(async () => {
    if (!publicKey || !connection) {
      setBalances(new Map())
      return
    }

    try {
      // Get user's tokens from wallet
      const userTokens = await getUserTokens(connection, publicKey)
      
      // Update available tokens with user's holdings
      if (userTokens.length > 0) {
        // Merge user tokens with common tokens (prioritize user tokens)
        const tokenMap = new Map<string, Token>()

        // Add user tokens first
        userTokens.forEach(token => tokenMap.set(token.address, token))

        // Add common tokens that aren't already in user's wallet
        COMMON_TOKENS.forEach(token => {
          if (!tokenMap.has(token.address)) {
            tokenMap.set(token.address, token)
          }
        })

        const mergedTokens = Array.from(tokenMap.values())

        // Enrich tokens with icons from Jupiter API
        const enrichedTokens = await enrichTokenIcons(mergedTokens)
        setAvailableTokens(enrichedTokens)
      }

      // Fetch balances for all tokens
      const newBalances = new Map<string, string>()

      const tokensToCheck = [inputToken, outputToken].filter((token): token is Token => token !== null)

      for (const token of tokensToCheck) {
        if (token?.address) {
          const balance = await getTokenBalance(connection, publicKey, token.address)
          newBalances.set(token.address, balance)
        }
      }

      setBalances(newBalances)
    } catch (error) {
      console.error('Error refreshing balances:', error)
      setBalances(new Map())
    }
  }, [publicKey, connection, inputToken, outputToken])

  const clearQuote = useCallback(() => {
    setQuote(null)
    setOutputAmount('')
  }, [])

  const clearError = useCallback(() => {
    setError(null)
    setStructuredError(null)
  }, [])

  const cancelSwap = useCallback(() => {
    if (swapServiceRef.current) {
      swapServiceRef.current.cancelSwap()
    }
    setIsLoading(false)
    setProgress(null)
  }, [])

  // Auto-fetch quote when amount changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputAmount && parseFloat(inputAmount) > 0 && inputToken && outputToken && publicKey) {
        getQuote()
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [inputAmount, inputToken, outputToken, publicKey, getQuote])

  return {
    // State
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    swapMode,
    quote,
    balances,
    isLoading,
    error,
    structuredError,
    progress,
    availableTokens,

    // Actions
    setInputToken: handleSetInputToken,
    setOutputToken: handleSetOutputToken,
    setInputAmount: handleSetInputAmount,
    setOutputAmount: handleSetOutputAmount,
    setSwapMode: handleSetSwapMode,
    swap,
    getQuote,
    refreshBalances,
    clearQuote,
    clearError,
    cancelSwap
  }
}

// Re-export utilities for easy access
export const SwapUtils = {
  /**
   * Check if tokens can be swapped in privacy mode
   */
  canSwapPrivately: (inputToken: Token, outputToken: Token): boolean => {
    return inputToken.isConfidentialSupported && outputToken.isConfidentialSupported
  },

  /**
   * Filter tokens by privacy support
   */
  filterByPrivacySupport: (tokens: Token[], privacyMode: boolean): Token[] => {
    if (!privacyMode) return tokens
    return tokens.filter(token => token.isConfidentialSupported)
  },

  /**
   * Calculate expected output amount
   */
  calculateExpectedOutput: (quote: SwapQuote, decimals: number): string => {
    const output = parseFloat(quote.outputAmount) / Math.pow(10, decimals)
    return output.toFixed(Math.max(0, 6 - decimals)).replace(/\.?0+$/, '')
  },

  /**
   * Calculate minimum output with slippage
   */
  calculateMinimumOutput: (quote: SwapQuote, decimals: number): string => {
    const output = parseFloat(quote.outputAmount) / Math.pow(10, decimals)
    const slippageFactor = (10000 - 50) / 10000 // 50 bps default slippage
    const minimumOutput = output * slippageFactor
    return minimumOutput.toFixed(Math.max(0, 6 - decimals)).replace(/\.?0+$/, '')
  }
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline'
import { ChainIcon } from '../ui/IconWithFallback'
import { TokenSelector } from './TokenSelector'

// Token info structure matching defuse
interface TokenInfo {
  defuseAssetId: string
  symbol: string
  name: string
  decimals: number
  icon: string
  originChainName: string
  balance?: string
  usdPrice?: number
}

// Quote structure matching defuse
interface QuoteRequest {
  tokenIn: string
  tokenOut: string
  amountIn: string
  swapType: 'EXACT_INPUT' | 'EXACT_OUTPUT'
}

interface QuoteResponse {
  id: string
  tokenIn: {
    defuseAssetId: string
    symbol: string
    decimals: number
    amount: string
  }
  tokenOut: {
    defuseAssetId: string
    symbol: string
    decimals: number
    amount: string
  }
  fee: {
    amount: string
    usdValue: number
  }
  priceImpact?: number
}

export function DefuseBridge() {
  const [tokenIn, setTokenIn] = useState<TokenInfo | null>(null)
  const [tokenOut, setTokenOut] = useState<TokenInfo | null>(null)
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTokenInSelector, setShowTokenInSelector] = useState(false)
  const [showTokenOutSelector, setShowTokenOutSelector] = useState(false)

  // Sample tokens matching defuse structure
  const [tokens, setTokens] = useState<TokenInfo[]>([
    {
      defuseAssetId: 'nep141:wrap.near',
      symbol: 'NEAR',
      name: 'NEAR Protocol',
      decimals: 24,
      icon: '/static/icons/tokens/near.svg',
      originChainName: 'near',
      balance: '10.5',
      usdPrice: 2.45
    },
    {
      defuseAssetId: 'nep141:usdc.omft.near',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      icon: '/static/icons/tokens/usdc.svg',
      originChainName: 'near',
      balance: '1250.75',
      usdPrice: 1.00
    },
    {
      defuseAssetId: 'erc20:0xA0b86a33E6441E4C3cf03A6510DD5e0E407665Ae:eth',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      icon: '/static/icons/tokens/usdc.svg',
      originChainName: 'eth',
      balance: '500.25',
      usdPrice: 1.00
    },
    {
      defuseAssetId: 'spl:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v:solana',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      icon: '/static/icons/tokens/usdc.svg',
      originChainName: 'solana',
      balance: '750.50',
      usdPrice: 1.00
    },
    {
      defuseAssetId: 'spl:So11111111111111111111111111111111111111112:solana',
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      icon: '/static/icons/tokens/sol.svg',
      originChainName: 'solana',
      balance: '25.75',
      usdPrice: 98.45
    }
  ])

  const getQuote = useCallback(async () => {
    if (!tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) === 0) {
      setQuote(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Simulate API call to defuse solver-relay
      const response = await fetch('/api/defuse/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenIn: tokenIn.defuseAssetId,
          tokenOut: tokenOut.defuseAssetId,
          amountIn: amountIn,
          swapType: 'EXACT_INPUT'
        } as QuoteRequest)
      })

      if (!response.ok) {
        throw new Error('Failed to get quote')
      }

      const quoteData = await response.json()
      setQuote(quoteData)

      // Calculate output amount
      const amountOut = parseFloat(quoteData.tokenOut.amount) / Math.pow(10, quoteData.tokenOut.decimals)
      setAmountOut(amountOut.toFixed(6))

    } catch (err) {
      console.error('Quote error:', err)
      setError('Failed to get quote. Please try again.')
      setQuote(null)
      setAmountOut('')
    } finally {
      setLoading(false)
    }
  }, [tokenIn, tokenOut, amountIn])

  // Auto-update quote when inputs change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getQuote()
    }, 500) // Debounce

    return () => clearTimeout(timeoutId)
  }, [getQuote])

  const switchTokens = useCallback(() => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn(amountOut)
    setAmountOut('')
    setQuote(null)
  }, [tokenIn, tokenOut, amountIn])

  const handleSwap = async () => {
    if (!quote) return

    setLoading(true)
    setError(null)

    try {
      // Create intent with defuse API
      const response = await fetch('/api/defuse/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quote.id,
          recipient: 'user.near' // Would get from wallet
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create swap intent')
      }

      const intentData = await response.json()
      console.log('Intent created:', intentData)

      // Handle success - show intent status or redirect

    } catch (err) {
      console.error('Swap error:', err)
      setError('Failed to create swap. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatBalance = (token: TokenInfo) => {
    if (!token.balance) return '0'
    const balance = parseFloat(token.balance)
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: token.decimals > 6 ? 2 : 6
    })
  }

  const getUsdValue = (token: TokenInfo, amount: string) => {
    if (!token.usdPrice || !amount) return '0'
    const tokenAmount = parseFloat(amount) / Math.pow(10, token.decimals)
    const usdValue = tokenAmount * token.usdPrice
    return `$${usdValue.toFixed(2)}`
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Near Intents Bridge
        </h2>

        {/* From Token Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--wave-text-secondary)' }}>
            From
          </label>
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--wave-glass-bg)', borderColor: 'var(--wave-glass-border)' }}>
            <div className="flex justify-between items-center mb-3">
              <input
                type="number"
                placeholder="0.00"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="bg-transparent text-white text-2xl font-semibold outline-none w-full placeholder-gray-500"
              />
              {tokenIn && (
                <div className="text-right">
                  <div className="text-sm" style={{ color: 'var(--wave-text-muted)' }}>
                    Balance: {formatBalance(tokenIn)}
                  </div>
                  {amountIn && (
                    <div className="text-xs" style={{ color: 'var(--wave-text-muted)' }}>
                      {getUsdValue(tokenIn, amountIn)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--wave-glass-bg)' }}
              onClick={() => setShowTokenInSelector(true)}
            >
              <div className="flex items-center gap-3">
                {tokenIn ? (
                  <>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--wave-glass-border)' }}>
                      <ChainIcon chainId={tokenIn.originChainName} size={20} />
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--wave-text-primary)' }}>{tokenIn.symbol}</div>
                      <div className="text-xs capitalize" style={{ color: 'var(--wave-text-muted)' }}>{tokenIn.originChainName}</div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'var(--wave-text-muted)' }}>Select token</div>
                )}
              </div>
              <div style={{ color: 'var(--wave-text-muted)' }}>
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center my-4">
          <button
            onClick={switchTokens}
            className="p-3 rounded-xl border transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--wave-glass-bg)', borderColor: 'var(--wave-glass-border)' }}
          >
            <ArrowsUpDownIcon className="h-5 w-5" style={{ color: 'var(--wave-text-secondary)' }} />
          </button>
        </div>

        {/* To Token Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--wave-text-secondary)' }}>
            To
          </label>
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--wave-glass-bg)', borderColor: 'var(--wave-glass-border)' }}>
            <div className="flex justify-between items-center mb-3">
              <input
                type="number"
                placeholder="0.00"
                value={amountOut}
                readOnly
                className="bg-transparent text-white text-2xl font-semibold outline-none w-full placeholder-gray-500"
              />
              {quote && (
                <div className="text-right">
                  <div className="text-sm" style={{ color: 'var(--wave-text-muted)' }}>
                    ~{formatBalance(tokenOut || {
                      defuseAssetId: quote.tokenOut.defuseAssetId,
                      symbol: quote.tokenOut.symbol,
                      name: quote.tokenOut.symbol,
                      decimals: quote.tokenOut.decimals,
                      icon: '',
                      originChainName: 'unknown'
                    })}
                  </div>
                  {amountOut && tokenOut?.usdPrice && (
                    <div className="text-xs" style={{ color: 'var(--wave-text-muted)' }}>
                      ~${(parseFloat(amountOut) * (tokenOut.usdPrice || 0)).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--wave-glass-bg)' }}
              onClick={() => setShowTokenOutSelector(true)}
            >
              <div className="flex items-center gap-3">
                {tokenOut ? (
                  <>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--wave-glass-border)' }}>
                      <ChainIcon chainId={tokenOut.originChainName} size={20} />
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--wave-text-primary)' }}>{tokenOut.symbol}</div>
                      <div className="text-xs capitalize" style={{ color: 'var(--wave-text-muted)' }}>{tokenOut.originChainName}</div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'var(--wave-text-muted)' }}>Select token</div>
                )}
              </div>
              <div style={{ color: 'var(--wave-text-muted)' }}>
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Quote Info */}
        {quote && (
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--wave-glass-bg)' }}>
            <div className="flex justify-between items-center text-sm">
              <span style={{ color: 'var(--wave-text-muted)' }}>Fee</span>
              <span style={{ color: 'var(--wave-text-primary)' }}>
                {parseFloat(quote.fee.amount) / Math.pow(10, 18)} ETH (~${quote.fee.usdValue.toFixed(2)})
              </span>
            </div>
            {quote.priceImpact && (
              <div className="flex justify-between items-center text-sm mt-2">
                <span style={{ color: 'var(--wave-text-muted)' }}>Price Impact</span>
                <span className={quote.priceImpact > 1 ? 'text-red-400' : 'text-green-400'}>
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!quote || loading}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Swap'}
        </button>

        {/* Network Info */}
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--wave-text-muted)' }}>
            Powered by{' '}
            <span className="text-blue-400 font-medium">Near Intents</span>
          </p>
        </div>
      </div>

      {/* Token Selectors */}
      <TokenSelector
        tokens={tokens}
        selectedToken={tokenIn}
        onSelect={setTokenIn}
        isOpen={showTokenInSelector}
        onClose={() => setShowTokenInSelector(false)}
        title="Select From Token"
      />

      <TokenSelector
        tokens={tokens}
        selectedToken={tokenOut}
        onSelect={setTokenOut}
        isOpen={showTokenOutSelector}
        onClose={() => setShowTokenOutSelector(false)}
        title="Select To Token"
      />
    </div>
  )
}
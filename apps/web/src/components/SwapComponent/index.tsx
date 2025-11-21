'use client'

import { useState, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { ArrowsUpDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { TokenSelectorNew as TokenSelector } from './TokenSelectorNew'
import { AmountInput } from './AmountInput'
import { SwapButton } from './SwapButton'
import { useSwap } from '@/hooks/useSwap'
import { Token, SwapStatus } from '@/types/token'

interface SwapComponentProps {
  privacyMode: boolean
}

export function SwapComponent({ privacyMode }: SwapComponentProps) {
  const { publicKey } = useWallet()

  const {
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    quote,
    balances,
    isLoading,
    error,
    progress,
    availableTokens,
    setInputToken,
    setOutputToken,
    setInputAmount,
    swap,
    getQuote,
    refreshBalances,
    clearQuote,
    clearError,
    cancelSwap
  } = useSwap(privacyMode, publicKey)

  // Handle input amount change
  const handleInputChange = (amount: string) => {
    setInputAmount(amount)
  }

  // Ensure we always have valid tokens with safe fallbacks
  const safeInputToken = inputToken || availableTokens[1] || availableTokens[0] || null
  const safeOutputToken = outputToken || availableTokens[0] || availableTokens[1] || null

  // Handle token switch
  const handleTokenSwitch = () => {
    if (safeInputToken && safeOutputToken) {
      setInputToken(safeOutputToken)
      setOutputToken(safeInputToken)
      setInputAmount('')
      clearQuote()
    }
  }

  // Handle input token change
  const handleInputTokenChange = (token: Token) => {
    setInputToken(token)
    if (safeOutputToken && token.address === safeOutputToken.address) {
      // Find a different token for output
      const availableForOutput = availableTokens.filter(t => t.address !== token.address)
      if (availableForOutput.length > 0) {
        const newToken = availableForOutput[0]
        if (newToken) {
          setOutputToken(newToken)
        }
      }
    }
    setInputAmount('')
    clearQuote()
  }

  // Handle output token change
  const handleOutputTokenChange = (token: Token) => {
    setOutputToken(token)
    if (safeInputToken && token.address === safeInputToken.address) {
      // Find a different token for input
      const availableForInput = availableTokens.filter(t => t.address !== token.address)
      if (availableForInput.length > 0) {
        const newToken = availableForInput[0]
        if (newToken) {
          setInputToken(newToken)
        }
      }
    }
    setInputAmount('')
    clearQuote()
  }

  // Handle swap execution
  const handleSwap = async () => {
    try {
      await swap()
    } catch (error) {
      console.error('Swap failed:', error)
      // Error is already handled by useSwap hook
    }
  }

  // Get input and output balances
  const inputBalance = safeInputToken?.address ? (balances.get(safeInputToken.address) || '0') : '0'
  const outputBalance = safeOutputToken?.address ? (balances.get(safeOutputToken.address) || '0') : '0'

  const inputBalanceFormatted = safeInputToken ? (() => {
    const amount = parseFloat(inputBalance) / Math.pow(10, safeInputToken.decimals || 9)
    if (amount === 0) return '0'
    if (amount < 0.001) return '<0.001'
    if (amount < 1) return amount.toFixed(4)
    if (amount < 1000) return amount.toFixed(2)
    return amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
  })() : '0'

  const outputBalanceFormatted = safeOutputToken ? (() => {
    const amount = parseFloat(outputBalance) / Math.pow(10, safeOutputToken.decimals || 9)
    if (amount === 0) return '0'
    if (amount < 0.001) return '<0.001'
    if (amount < 1) return amount.toFixed(4)
    if (amount < 1000) return amount.toFixed(2)
    return amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
  })() : '0'

  // Enhanced balance formatting - show real balances always
  const displayInputBalance = inputBalanceFormatted
  const displayOutputBalance = outputBalanceFormatted

  // Check if swap is possible
  const canSwap = !!(publicKey && safeInputToken && safeOutputToken && inputAmount && parseFloat(inputAmount) > 0 && !isLoading)
  const isProgressActive = !!(progress && progress.status !== SwapStatus.IDLE && progress.status !== SwapStatus.COMPLETED)

  // Calculate price impact
  const priceImpact = quote ? quote.priceImpactPct : 0

  // Ensure token references are consistent throughout calculations
  const displayInputToken = inputToken || safeInputToken || null
  const displayOutputToken = outputToken || safeOutputToken || null

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Swap Card */}
      <div className="glass-panel p-6 sm:p-8 lg:p-10 space-y-6 w-full">
  
        {/* Progress Display */}
        {progress && isProgressActive && (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold" style={{ color: 'var(--wave-purple)' }}>
                {progress.message}
              </span>
              <button
                onClick={cancelSwap}
                className="text-xs font-medium transition-colors"
                style={{ color: '#EF4444' }}
              >
                Cancel
              </button>
            </div>
            <div className="w-full rounded-full h-2 bg-black/50">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(progress.currentStep / progress.totalSteps) * 100}%`,
                  background: 'var(--wave-purple)',
                  boxShadow: '0 0 10px rgba(162, 89, 250, 0.5)'
                }}
              />
            </div>
          </div>
        )}

        {/* You Send Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold tracking-wide" style={{ color: 'var(--wave-text)' }}>
              YOU SEND
            </label>
            <div className="flex items-center gap-3">
              {publicKey && parseFloat(inputBalance) > 0 && safeInputToken && (
                <button
                  onClick={() => {
                    const maxAmount = parseFloat(inputBalance) / Math.pow(10, safeInputToken.decimals || 9)
                    // Use 95% of balance to account for fees
                    const amountWithFees = maxAmount * 0.95
                    setInputAmount(amountWithFees.toString())
                    clearQuote()
                  }}
                  className="text-xs font-bold transition-colors px-2 py-1 rounded-md"
                  style={{
                    color: 'var(--wave-purple)',
                    backgroundColor: 'rgba(162, 89, 250, 0.1)',
                    border: '1px solid rgba(162, 89, 250, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(162, 89, 250, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(162, 89, 250, 0.1)'
                  }}
                >
                  MAX
                </button>
              )}
              {publicKey && (
                <button
                  onClick={refreshBalances}
                  className="text-xs font-medium transition-colors"
                  style={{ color: 'var(--wave-purple)' }}
                >
                  Refresh
                </button>
              )}
              <span className="text-xs opacity-60" style={{ color: 'var(--wave-text)' }}>
                {displayInputBalance}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <AmountInput
                value={inputAmount}
                onChange={handleInputChange}
                disabled={isLoading || isProgressActive}
                placeholder="0.00"
              />
            </div>
            <div className="lg:col-span-1">
              <TokenSelector
                selectedToken={safeInputToken}
                onTokenChange={handleInputTokenChange}
                tokens={availableTokens}
                disabled={isLoading || isProgressActive}
                privacyMode={privacyMode}
                showConfidentialIndicator={true}
                balances={balances}
              />
            </div>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-4 z-10">
          <button
            onClick={handleTokenSwitch}
            className="glass-card p-3 rounded-full transition-all hover:scale-110 disabled:opacity-50"
            style={{
              borderColor: 'rgba(162, 89, 250, 0.2)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !isProgressActive) {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(162, 89, 250, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
            disabled={isLoading || isProgressActive}
          >
            <ArrowsUpDownIcon 
              className="h-5 w-5" 
              style={{ color: 'var(--wave-purple)' }}
            />
          </button>
        </div>

        {/* You Receive Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold tracking-wide" style={{ color: 'var(--wave-text)' }}>
              YOU RECEIVE
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs opacity-60" style={{ color: 'var(--wave-text)' }}>
                Balance: {displayOutputBalance}
              </span>
              <span className="text-xs opacity-60" style={{ color: 'var(--wave-text)' }}>
                {quote && outputAmount ? 'Estimated' : '---'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <AmountInput
                value={outputAmount}
                onChange={() => {}} // Output is read-only
                disabled={true}
                placeholder="0.00"
                readOnly={true}
              />
            </div>
            <div className="lg:col-span-1">
              <TokenSelector
                selectedToken={safeOutputToken}
                onTokenChange={handleOutputTokenChange}
                tokens={availableTokens}
                disabled={isLoading || isProgressActive}
                privacyMode={privacyMode}
                showConfidentialIndicator={true}
                balances={balances}
              />
            </div>
          </div>
        </div>

        {/* Swap Details */}
        {quote && (
          <div className="glass-card space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-60" style={{ color: 'var(--wave-text)' }}>Rate</span>
              <span className="text-sm font-bold" style={{ color: 'var(--wave-text)' }}>
                {displayInputToken && displayOutputToken ?
                  `1 ${displayInputToken.symbol} = ${(parseFloat(quote.outputAmount) / parseFloat(quote.inputAmount) * Math.pow(10, displayInputToken.decimals - displayOutputToken.decimals)).toFixed(4)} ${displayOutputToken.symbol}`
                  : '---'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-60" style={{ color: 'var(--wave-text)' }}>Impact</span>
              <span 
                className="text-sm font-bold" 
                style={{ 
                  color: priceImpact > 5 ? '#EF4444' : priceImpact > 2 ? '#F59E0B' : 'var(--wave-purple)' 
                }}
              >
                {priceImpact.toFixed(2)}%
              </span>
            </div>
                      </div>
        )}

        {/* Error Display */}
        {error && (
          <div
            className="glass-card flex items-start gap-3 p-4"
            style={{
              borderColor: error.includes('User rejected') || error.includes('cancelled') ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              backgroundColor: error.includes('User rejected') || error.includes('cancelled') ? 'rgba(59, 130, 246, 0.05)' : 'rgba(239, 68, 68, 0.05)'
            }}
          >
            <ExclamationTriangleIcon
              className="h-5 w-5 flex-shrink-0 mt-0.5"
              style={{ color: error.includes('User rejected') || error.includes('cancelled') ? '#3B82F6' : '#EF4444' }}
            />
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: error.includes('User rejected') || error.includes('cancelled') ? '#93C5FD' : '#FCA5A5' }}>
                {error}
              </p>
              {error.includes('User rejected') && (
                <p className="text-xs mt-1 opacity-70" style={{ color: 'var(--wave-text)' }}>
                  You can safely continue using the swap interface.
                </p>
              )}
              {error.includes('insufficient') && (
                <p className="text-xs mt-1 opacity-70" style={{ color: 'var(--wave-text)' }}>
                  Please check your wallet balance and try a smaller amount.
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {error.includes('route') || error.includes('liquidity') ? (
                  <button
                    onClick={() => {
                      clearError()
                      if (inputToken && outputToken) {
                        getQuote()
                      }
                    }}
                    className="text-xs font-bold transition-opacity hover:opacity-70"
                    style={{ color: 'var(--wave-purple)' }}
                  >
                    Try Again
                  </button>
                ) : null}
                <button
                  onClick={clearError}
                  className="text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: error.includes('User rejected') || error.includes('cancelled') ? '#3B82F6' : '#EF4444' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <div className="w-full lg:max-w-md mx-auto">
          <SwapButton
            inputAmount={inputAmount}
            inputToken={safeInputToken}
            outputToken={safeOutputToken}
            quote={quote}
            loading={isLoading}
            privacyMode={privacyMode}
            canSwap={canSwap}
            onSwap={handleSwap}
            onCancel={cancelSwap}
            progress={progress}
          />
        </div>
      </div>
    </div>
  )
}
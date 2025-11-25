'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WalletIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import {
  nearIntentBridge,
  type BridgeQuote,
  SUPPORTED_CHAINS,
  COMMON_TOKENS,
  type ChainId,
  EnhancedToken
} from '../../lib/nearIntentBridge'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletModalButton } from '@solana/wallet-adapter-react-ui'
import { coingeckoService } from '../../lib/coingecko'
import { zcashWalletService } from '../../lib/wallets/zcash'
import { nearWalletService } from '../../lib/wallets/near'
import { starknetWalletService } from '../../lib/wallets/starknet'
import { ChainIcon } from '../ui/IconWithFallback'
import { useNearWallet } from '@/providers/NearWalletProvider'

interface WavePortalProps {
  privacyMode: boolean
}

export function WavePortal({ privacyMode }: WavePortalProps) {
  const { publicKey, connected, wallet } = useWallet()
  const { accountId: nearAccountId, isConnected: isNearConnected, connect: connectNear, disconnect: disconnectNear, signMessage: nearSignMessage } = useNearWallet()

  // Form state
  const [fromChain, setFromChain] = useState<ChainId>('solana')
  const [toChain, setToChain] = useState<ChainId>('near')
  const [fromToken, setFromToken] = useState<EnhancedToken>({ ...COMMON_TOKENS.solana[0], logoURI: '' })
  const [toToken, setToToken] = useState<EnhancedToken>({ ...COMMON_TOKENS.near[0], logoURI: '' })
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [slippage, setSlippage] = useState(100) // 1%

  // UI state
  const [showFromChainDropdown, setShowFromChainDropdown] = useState(false)
  const [showFromTokenDropdown, setShowFromTokenDropdown] = useState(false)
  const [showToChainDropdown, setShowToChainDropdown] = useState(false)
  const [showToTokenDropdown, setShowToTokenDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quote, setQuote] = useState<BridgeQuote | null>(null)

  // Wallet states
  const [zcashWallet, setZcashWallet] = useState<any>(null)
  const [starknetWallet, setStarknetWallet] = useState<any>(null)

  // Combine tokens with icons
  const tokensWithIcons = useMemo(() => {
    const result: Record<string, EnhancedToken> = {}
    Object.entries(COMMON_TOKENS).forEach(([chain, tokens]) => {
      tokens.forEach(token => {
        const key = `${chain}_${token.symbol}`
        result[key] = { ...token, logoURI: token.logoURI }
      })
    })
    return result
  }, [])

  // Check wallet connection status
  const isSourceWalletConnected = useMemo(() => {
    switch (fromChain) {
      case 'solana': return connected
      case 'near': return isNearConnected
      case 'zec': return zcashWallet?.connected
      case 'starknet': return starknetWallet?.connected
      default: return false
    }
  }, [fromChain, connected, isNearConnected, zcashWallet, starknetWallet])

  // Source wallet connection handler
  const handleSourceWalletConnect = async () => {
    try {
      switch (fromChain) {
        case 'solana':
          // Solana wallet handled by WalletModalButton in header
          throw new Error('Please connect your Solana wallet using the wallet button in the header')

        case 'near':
          await connectNear()
          break

        case 'zec':
          try {
            const zcashAccount = await zcashWalletService.connect()
            if (zcashAccount) {
              setZcashWallet(zcashAccount)
              setError(null)
            }
          } catch (zecashError) {
            console.error('Zcash wallet connection error:', zecashError)
            setError('Zcash wallet not available. Using demo mode for development.')
          }
          break

        case 'starknet':
          try {
            const starknetAccount = await starknetWalletService.connect()
            if (starknetAccount) {
              setStarknetWallet(starknetAccount)
              setError(null)
            }
          } catch (starknetError) {
            console.error('StarkNet wallet connection error:', starknetError)
            setError('StarkNet wallet not available. Please install Argent X or Braavos.')
          }
          break
      }
    } catch (error) {
      setError(`Failed to connect ${SUPPORTED_CHAINS.find(c => c.id === fromChain)?.name} wallet`)
    }
  }

  // Switch chains
  const switchChains = () => {
    const tempChain = fromChain
    const tempToken = fromToken

    setFromChain(toChain)
    setToChain(tempChain)
    setFromToken(toToken)
    setToToken(tempToken)

    setQuote(null)
    setRecipientAddress('')
    setError(null)
  }

  // Validate form
  const isFormValid = useMemo(() => {
    return (
      isSourceWalletConnected &&
      amount &&
      parseFloat(amount) > 0 &&
      recipientAddress &&
      fromChain !== toChain &&
      !loading
    )
  }, [isSourceWalletConnected, amount, recipientAddress, fromChain, toChain, loading])

  // Get quote
  const getQuote = async () => {
    if (!isFormValid) return

    setLoading(true)
    setError(null)

    try {
      if (!nearIntentBridge.validateAddress(recipientAddress, toChain)) {
        throw new Error(`Invalid ${SUPPORTED_CHAINS.find(c => c.id === toChain)?.name} address format`)
      }

      const quoteRequest = {
        dry: true,
        depositMode: 'SIMPLE' as const,
        swapType: 'EXACT_INPUT' as const,
        slippageTolerance: slippage,
        originAsset: `${fromChain === 'near' ? 'nep141' : 'spl'}:${fromToken.address}`,
        depositType: 'ORIGIN_CHAIN' as const,
        destinationAsset: `${toChain === 'near' ? 'nep141' : 'spl'}:${toToken.address}`,
        amount: (parseFloat(amount) * Math.pow(10, fromToken.decimals)).toString(),
        refundTo: publicKey?.toString() || '',
        refundType: 'ORIGIN_CHAIN' as const,
        recipient: recipientAddress,
        recipientType: 'DESTINATION_CHAIN' as const,
        deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      }

      const quoteResponse = await nearIntentBridge.getQuote(quoteRequest)
      setQuote(quoteResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quote')
    } finally {
      setLoading(false)
    }
  }

  // Execute bridge
  const executeBridge = async () => {
    if (!quote) return

    setLoading(true)
    try {
      if (fromChain === 'near' || toChain === 'near') {
        const response = await fetch('/api/defuse/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quoteId: quote.id,
            recipient: nearAccountId || recipientAddress
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create bridge intent')
        }

        const intentData = await response.json()
        console.log('Intent created:', intentData)

        setTransaction({
          id: intentData.id || quote.id,
          status: 'pending',
          type: 'bridge',
          amount: amount,
          fee: quote.fee?.amount || '0',
          fromChain,
          toChain,
          fromToken,
          toToken,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute bridge')
    } finally {
      setLoading(false)
    }
  }

  // Format amount display
  const formatAmount = (amount: string, decimals: number, symbol: string) => {
    const value = parseFloat(amount) / Math.pow(10, decimals)
    return `${value.toFixed(6)} ${symbol}`
  }

  // Transaction state
  const [transaction, setTransaction] = useState<any>(null)

  // Auto-update quote when inputs change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isFormValid) {
        getQuote()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [amount, fromChain, toChain, fromToken, toToken, recipientAddress])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowFromChainDropdown(false)
      setShowFromTokenDropdown(false)
      setShowToChainDropdown(false)
      setShowToTokenDropdown(false)
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Status Bar */}
      {!isSourceWalletConnected && (
        <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-orange-400" />
              <span className="text-orange-400 text-sm font-medium">
                Connect {SUPPORTED_CHAINS.find(c => c.id === fromChain)?.name} wallet
              </span>
            </div>
            <button
              onClick={handleSourceWalletConnect}
              className="px-3 py-1 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors"
            >
              Connect
            </button>
          </div>
        </div>
      )}

      {/* Main Bridge Panel */}
      <div className="glass-panel p-6">
        {/* From Section */}
        <div className="mb-4">
          <div className="space-y-3">
            {/* Chain and Token Row */}
            <div className="flex gap-3">
              {/* Chain */}
              <div className="relative flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowFromChainDropdown(!showFromChainDropdown)
                    setShowFromTokenDropdown(false)
                  }}
                  className="w-full p-3 rounded-xl bg-gray-800/60 border border-gray-700 text-left transition-all hover:border-gray-600"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChainIcon chainId={fromChain} size={20} />
                      <span className="text-white font-medium text-sm">
                        {SUPPORTED_CHAINS.find(c => c.id === fromChain)?.name}
                      </span>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                {showFromChainDropdown && (
                  <div className="absolute z-30 w-full mt-2 p-2 rounded-xl bg-gray-900/98 border border-gray-700/50 shadow-2xl backdrop-blur-xl">
                    {SUPPORTED_CHAINS.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          const newChainId = chain.id as ChainId
                          const newTokenKey = `${newChainId}_${COMMON_TOKENS[newChainId][0].symbol}`

                          if (newChainId === toChain) {
                            setError('Cannot select the same chain for both "From" and "To".')
                            setShowFromChainDropdown(false)
                            return
                          }

                          setFromChain(newChainId)
                          if (tokensWithIcons[newTokenKey]) {
                            setFromToken(tokensWithIcons[newTokenKey])
                          } else {
                            setFromToken({ ...COMMON_TOKENS[newChainId][0], logoURI: '' })
                          }

                          setShowFromChainDropdown(false)
                          setQuote(null)
                          setError(null)
                          setRecipientAddress('')
                        }}
                        className="w-full p-3 rounded-xl hover:bg-gray-700 text-left transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ChainIcon chainId={chain.id} size={20} />
                          <div>
                            <span className="text-white font-medium text-sm">{chain.name}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Token */}
              <div className="relative flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowFromTokenDropdown(!showFromTokenDropdown)
                    setShowFromChainDropdown(false)
                  }}
                  className="w-full p-3 rounded-xl bg-gray-800/60 border border-gray-700 text-left transition-all hover:border-gray-600"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {fromToken.logoURI ? (
                        <img
                          src={fromToken.logoURI}
                          alt={fromToken.symbol}
                          className="w-5 h-5 rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-5 h-5 bg-gray-600 rounded-full"></div>
                      )}
                      <span className="text-white font-medium text-sm">{fromToken.symbol}</span>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                {showFromTokenDropdown && (
                  <div className="absolute z-30 w-full mt-2 p-2 rounded-xl bg-gray-900/98 border border-gray-700/50 shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto">
                    {COMMON_TOKENS[fromChain].map((token) => {
                      const tokenKey = `${fromChain}_${token.symbol}`
                      const tokenWithIcon = tokensWithIcons[tokenKey] || { ...token, logoURI: '' }

                      return (
                        <button
                          key={token.symbol}
                          onClick={(e) => {
                            e.stopPropagation()
                            setFromToken(tokenWithIcon)
                            setShowFromTokenDropdown(false)
                            setQuote(null)
                          }}
                          className="w-full p-3 rounded-xl hover:bg-gray-700 text-left transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {tokenWithIcon.logoURI ? (
                              <img
                                src={tokenWithIcon.logoURI}
                                alt={token.symbol}
                                className="w-5 h-5 rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-5 h-5 bg-gray-600 rounded-full"></div>
                            )}
                            <div>
                              <span className="text-white font-medium text-sm">{token.symbol}</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Amount Input */}
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={!isSourceWalletConnected}
                className="w-full p-4 rounded-xl bg-gray-800/60 border border-gray-700 text-white placeholder-gray-500 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 text-xl font-bold"
                style={{ backdropFilter: 'blur(8px)' }}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                {fromToken.symbol}
              </div>
            </div>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center my-4">
          <button
            onClick={switchChains}
            className="p-2 rounded-xl bg-gray-800/60 border border-gray-700 hover:border-gray-600 transition-all hover:scale-110"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <ArrowsUpDownIcon className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        {/* To Section */}
        <div className="mb-4">
          <div className="space-y-3">
            {/* Chain and Token Row */}
            <div className="flex gap-3">
              {/* Chain */}
              <div className="relative flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowToChainDropdown(!showToChainDropdown)
                    setShowToTokenDropdown(false)
                  }}
                  className="w-full p-3 rounded-xl bg-gray-800/60 border border-gray-700 text-left transition-all hover:border-gray-600"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChainIcon chainId={toChain} size={20} />
                      <span className="text-white font-medium text-sm">
                        {SUPPORTED_CHAINS.find(c => c.id === toChain)?.name}
                      </span>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                {showToChainDropdown && (
                  <div className="absolute z-30 w-full mt-2 p-2 rounded-xl bg-gray-900/98 border border-gray-700/50 shadow-2xl backdrop-blur-xl">
                    {SUPPORTED_CHAINS.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          const newChainId = chain.id as ChainId
                          const newTokenKey = `${newChainId}_${COMMON_TOKENS[newChainId][0].symbol}`

                          if (newChainId === fromChain) {
                            setError('Cannot select the same chain for both "From" and "To".')
                            setShowToChainDropdown(false)
                            return
                          }

                          setToChain(newChainId)
                          if (tokensWithIcons[newTokenKey]) {
                            setToToken(tokensWithIcons[newTokenKey])
                          } else {
                            setToToken({ ...COMMON_TOKENS[newChainId][0], logoURI: '' })
                          }

                          setShowToChainDropdown(false)
                          setQuote(null)
                          setError(null)
                          setRecipientAddress('')
                        }}
                        className="w-full p-3 rounded-xl hover:bg-gray-700 text-left transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ChainIcon chainId={chain.id} size={20} />
                          <div>
                            <span className="text-white font-medium text-sm">{chain.name}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Token */}
              <div className="relative flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowToTokenDropdown(!showToTokenDropdown)
                    setShowToChainDropdown(false)
                  }}
                  className="w-full p-3 rounded-xl bg-gray-800/60 border border-gray-700 text-left transition-all hover:border-gray-600"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {toToken.logoURI ? (
                        <img
                          src={toToken.logoURI}
                          alt={toToken.symbol}
                          className="w-5 h-5 rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-5 h-5 bg-gray-600 rounded-full"></div>
                      )}
                      <span className="text-white font-medium text-sm">{toToken.symbol}</span>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                {showToTokenDropdown && (
                  <div className="absolute z-30 w-full mt-2 p-2 rounded-xl bg-gray-900/98 border border-gray-700/50 shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto">
                    {COMMON_TOKENS[toChain].map((token) => {
                      const tokenKey = `${toChain}_${token.symbol}`
                      const tokenWithIcon = tokensWithIcons[tokenKey] || { ...token, logoURI: '' }

                      return (
                        <button
                          key={token.symbol}
                          onClick={(e) => {
                            e.stopPropagation()
                            setToToken(tokenWithIcon)
                            setShowToTokenDropdown(false)
                            setQuote(null)
                          }}
                          className="w-full p-3 rounded-xl hover:bg-gray-700 text-left transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {tokenWithIcon.logoURI ? (
                              <img
                                src={tokenWithIcon.logoURI}
                                alt={token.symbol}
                                className="w-5 h-5 rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-5 h-5 bg-gray-600 rounded-full"></div>
                            )}
                            <div>
                              <span className="text-white font-medium text-sm">{token.symbol}</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recipient Address */}
            <div className="relative">
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder={`${SUPPORTED_CHAINS.find(c => c.id === toChain)?.name} address`}
                className="w-full p-4 rounded-xl bg-gray-800/60 border border-gray-700 text-white placeholder-gray-500 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono text-sm"
                style={{ backdropFilter: 'blur(8px)' }}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <UserIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Quote Info */}
        {quote && (
          <div className="mb-4 p-4 rounded-xl bg-gray-800/40 border border-gray-700">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">You'll receive:</span>
                <span className="text-white font-medium">
                  {formatAmount(quote.amount.out, quote.destinationAsset.decimals, quote.destinationAsset.symbol)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fee:</span>
                <span className="text-white font-medium">
                  {formatAmount(quote.amount.fee, quote.depositAsset.decimals, quote.depositAsset.symbol)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bridge Button */}
        <button
          onClick={isFormValid ? executeBridge : undefined}
          disabled={!isFormValid || loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Bridge Assets'}
        </button>
      </div>
    </div>
  )
}
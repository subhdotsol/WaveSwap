'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ArrowsUpDownIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { ChainSelectorModal } from './ChainSelectorModal'
import { TokenSelectorModal } from './TokenSelectorModal'
import {
  SUPPORTED_CHAINS,
  type ChainId
} from '../../lib/nearIntentBridge'
import {
  enhancedBridgeService,
  type CrossChainToken,
  type EnhancedBridgeQuote,
  type BridgeExecution,
  type BridgeOptions
} from '../../lib/services/enhancedBridgeService'
import { useWallet } from '@solana/wallet-adapter-react'
import { zcashWalletService } from '../../lib/wallets/zcash'
import { starknetWalletService } from '../../lib/wallets/starknet'
import { ChainIcon } from '../ui/IconWithFallback'
import { useNearWallet } from '@/providers/NearWalletProvider'
import { useThemeConfig, createGlassStyles } from '@/lib/theme'

interface WavePortalProps {
  privacyMode: boolean
}

export function WavePortal({ privacyMode }: WavePortalProps) {
  const { publicKey, connected } = useWallet()
  const { accountId: nearAccountId, isConnected: isNearConnected, connect: connectNear } = useNearWallet()
  const theme = useThemeConfig()

  // Form state
  const [fromChain, setFromChain] = useState<ChainId>('solana')
  const [toChain, setToChain] = useState<ChainId>('near')
  const [fromToken, setFromToken] = useState<CrossChainToken | null>(null)
  const [toToken, setToToken] = useState<CrossChainToken | null>(null)
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [supportedTokens, setSupportedTokens] = useState<CrossChainToken[]>([])
  const [loadingTokens, setLoadingTokens] = useState(true)

  // Modal states
  const [showFromChainModal, setShowFromChainModal] = useState(false)
  const [showFromTokenModal, setShowFromTokenModal] = useState(false)
  const [showToChainModal, setShowToChainModal] = useState(false)
  const [showToTokenModal, setShowToTokenModal] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quote, setQuote] = useState<EnhancedBridgeQuote | null>(null)
  const [execution, setExecution] = useState<BridgeExecution | null>(null)

  // Wallet states
  const [zcashWallet, setZcashWallet] = useState<any>(null)
  const [starknetWallet, setStarknetWallet] = useState<any>(null)

  // Check if source wallet is connected
  const isSourceWalletConnected = useMemo(() => {
    switch (fromChain) {
      case 'solana':
        return connected && !!publicKey
      case 'near':
        return isNearConnected && !!nearAccountId
      case 'zec':
        return !!zcashWallet?.connected
      case 'starknet':
        return !!starknetWallet?.connected
      default:
        return false
    }
  }, [fromChain, connected, publicKey, isNearConnected, nearAccountId, zcashWallet, starknetWallet])

  // Initialize tokens and wallets
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load supported tokens
        setLoadingTokens(true)
        const tokens = await enhancedBridgeService.getSupportedTokens()
        setSupportedTokens(tokens)

        // Set default tokens
        const solToken = tokens.find(t => t.chain === 'solana' && t.symbol === 'SOL')
        const nearToken = tokens.find(t => t.chain === 'near' && t.symbol === 'NEAR')

        if (solToken) setFromToken(solToken)
        if (nearToken) setToToken(nearToken)

        // Initialize wallets
        const zcash = await zcashWalletService.connect()
        setZcashWallet(zcash)

        const starknet = await starknetWalletService.connect()
        setStarknetWallet(starknet)

      } catch (error) {
        console.error('Failed to initialize:', error)
        setError('Failed to load bridge data')
      } finally {
        setLoadingTokens(false)
      }
    }
    initialize()
  }, [])

  // Handle source wallet connection
  const handleSourceWalletConnect = async () => {
    try {
      switch (fromChain) {
        case 'solana':
          // Handled by WalletModalButton
          break
        case 'near':
          await connectNear()
          break
        case 'zec':
          const zcash = await zcashWalletService.connect()
          setZcashWallet(zcash)
          break
        case 'starknet':
          const starknet = await starknetWalletService.connect()
          setStarknetWallet(starknet)
          break
      }
    } catch (error) {
      setError(`Failed to connect ${fromChain} wallet: ${error}`)
    }
  }

  // Handle chain switch
  const switchChains = () => {
    setFromChain(toChain)
    setToChain(fromChain)
    setFromToken(toToken)
    setToToken(fromToken)
    setQuote(null)
    setError(null)
  }

  // Handle bridge execution
  const handleBridge = async () => {
    if (!isSourceWalletConnected) {
      setError('Please connect your source wallet first')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!fromToken || !toToken) {
      setError('Please select tokens')
      return
    }

    // Check privacy mode
    if (privacyMode) {
      setError('Confidential Bridging Coming Soon - Please disable privacy mode for bridge transactions')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Generate enhanced quote
      const bridgeQuote = await enhancedBridgeService.generateQuote(
        fromToken,
        toToken,
        amount,
        {
          slippageBps: 50, // 0.5%
          deadline: 20 * 60, // 20 minutes
          recipientAddress: recipientAddress || undefined,
          privacyMode: false // Temporarily disabled
        }
      )

      setQuote(bridgeQuote)

      // Execute bridge transaction
      const bridgeExecution = await enhancedBridgeService.executeBridge(
        bridgeQuote,
        {
          signTransaction: async (tx) => tx, // Would integrate with wallet signing
          wallet: { publicKey, connected } // Current wallet state
        }
      )

      setExecution(bridgeExecution)

      if (bridgeExecution.status === 'COMPLETED') {
        // Success handling
        setAmount('')
        setQuote(null)
        setExecution(null)
      } else if (bridgeExecution.status === 'FAILED') {
        throw new Error(bridgeExecution.error || 'Bridge failed')
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bridge failed')
      setQuote(null)
      setExecution(null)
    } finally {
      setLoading(false)
    }
  }

  // Close modals on escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFromChainModal(false)
        setShowFromTokenModal(false)
        setShowToChainModal(false)
        setShowToTokenModal(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Bridge Card */}
      <div className="relative">
        {/* Privacy Mode Indicator */}
        {privacyMode && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm"
              style={{
                background: `${theme.colors.warning}10`,
                border: `1px solid ${theme.colors.warning}20`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: theme.colors.warning }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: theme.colors.warning }}
              >
                Confidential Bridging Coming Soon
              </span>
            </div>
          </div>
        )}

        {/* Main Bridge Card */}
        <div
          className="relative p-6 space-y-6 w-full rounded-2xl overflow-hidden"
          style={{
            background: `
              linear-gradient(135deg,
                ${theme.colors.surface}ee 0%,
                ${theme.colors.surfaceHover}cc 25%,
                ${theme.colors.surface}ee 50%,
                ${theme.colors.surfaceHover}cc 75%,
                ${theme.colors.surface}ee 100%
              ),
              radial-gradient(circle at 25% 25%,
                ${theme.colors.primary}08 0%,
                transparent 50%
              ),
              radial-gradient(circle at 75% 75%,
                ${theme.colors.success}03 0%,
                transparent 50%
              )
            `,
            border: `1px solid ${theme.colors.primary}15`,
            backdropFilter: 'blur(24px) saturate(1.8)',
            boxShadow: `
              0 20px 60px ${theme.colors.shadowHeavy},
              0 8px 24px ${theme.colors.primary}08,
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2)
            `
          }}
        >
          {/* Noise grain overlay */}
          <div
            className="absolute inset-0 opacity-4 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3Cfilter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              filter: 'contrast(1.2) brightness(1.1)'
            }}
          />

          {/* You Send Section */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-bold tracking-wide"
                style={{ color: theme.colors.textSecondary }}
              >
                You Send
              </label>
              <button
                onClick={handleSourceWalletConnect}
                className="text-xs font-medium transition-colors px-2 py-1 rounded-md hover:bg-opacity-10"
                style={{
                  color: theme.colors.primary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.primaryHover
                  e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.primary
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {isSourceWalletConnected ? 'Change Wallet' : 'Connect Wallet'}
              </button>
            </div>

            <div className="space-y-3">
              {/* Chain and Token Selection */}
              <div className="flex gap-2">
                {/* Chain */}
                <div className="relative" style={{ width: '120px' }}>
                  <button
                    onClick={() => setShowFromChainModal(true)}
                    className="w-full p-3 rounded-xl bg-gray-800/60 border border-gray-700 text-left transition-all hover:border-gray-600"
                    style={{ backdropFilter: 'blur(8px)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChainIcon chainId={fromChain} size={16} />
                        <span className="text-white font-medium text-xs">
                          {SUPPORTED_CHAINS.find(c => c.id === fromChain)?.icon}
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Token */}
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowFromTokenModal(true)}
                    className="w-full p-3 rounded-xl bg-gray-800/60 border border-gray-700 text-left transition-all hover:border-gray-600"
                    style={{ backdropFilter: 'blur(8px)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {fromToken ? (
                          <>
                            {fromToken.logoURI ? (
                              <img
                                src={fromToken.logoURI}
                                alt={fromToken.symbol}
                                className="w-4 h-4 rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                            )}
                            <span className="text-white font-medium text-sm">{fromToken.symbol}</span>
                          </>
                        ) : (
                          <>
                            <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                            <span className="text-gray-400 text-sm">Select Token</span>
                          </>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
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
                  className="w-full p-4 rounded-xl bg-gray-800/60 border border-gray-700 text-white placeholder-gray-500 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 text-lg font-medium"
                  style={{ backdropFilter: 'blur(8px)' }}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium text-sm">
                  {fromToken?.symbol || ''}
                </div>
              </div>
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center -my-2 z-10">
            <button
              onClick={switchChains}
              className="relative z-10 p-2.5 rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 bg-gray-800/50 border border-gray-700 hover:border-gray-600"
              disabled={loading}
            >
              <ArrowsUpDownIcon className="h-5 w-5 text-blue-400" />
            </button>
          </div>

          {/* You Receive Section */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold tracking-wide text-gray-300">
                You Receive
              </label>
              {quote && (
                <span className="text-xs text-green-400">
                  ✓
                </span>
              )}
            </div>

            <div className="space-y-3">
              {/* Chain and Token Selection */}
              <div className="flex gap-2">
                {/* Chain */}
                <div className="relative" style={{ width: '120px' }}>
                  <button
                    onClick={() => setShowToChainModal(true)}
                    className="w-full p-3 rounded-xl bg-gray-800/60 border border-gray-700 text-left transition-all hover:border-gray-600"
                    style={{ backdropFilter: 'blur(8px)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChainIcon chainId={toChain} size={16} />
                        <span className="text-white font-medium text-xs">
                          {SUPPORTED_CHAINS.find(c => c.id === toChain)?.icon}
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Token */}
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowToTokenModal(true)}
                    className="w-full p-3 rounded-xl bg-gray-800/60 border border-gray-700 text-left transition-all hover:border-gray-600"
                    style={{ backdropFilter: 'blur(8px)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {toToken ? (
                          <>
                            {toToken.logoURI ? (
                              <img
                                src={toToken.logoURI}
                                alt={toToken.symbol}
                                className="w-4 h-4 rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                            )}
                            <span className="text-white font-medium text-sm">{toToken.symbol}</span>
                          </>
                        ) : (
                          <>
                            <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                            <span className="text-gray-400 text-sm">Select Token</span>
                          </>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              {/* Output Amount (Read-only) */}
              <div className="relative">
                <input
                  type="text"
                  value={quote ? quote.toAmount : ''}
                  onChange={() => {}}
                  placeholder="0.00"
                  disabled={true}
                  readOnly={true}
                  className="w-full p-4 rounded-xl bg-gray-800/60 border border-gray-700 text-white placeholder-gray-500 transition-all opacity-75 text-lg font-medium"
                  style={{ backdropFilter: 'blur(8px)' }}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium text-sm">
                  {toToken?.symbol || ''}
                </div>
              </div>
            </div>
          </div>

          {/* Bridge Quote Details */}
          {quote && (
            <div
              className="relative z-10 space-y-3 p-4 rounded-xl"
              style={{
                background: `
                  linear-gradient(135deg,
                    rgba(16, 185, 129, 0.08) 0%,
                    rgba(16, 185, 129, 0.04) 50%,
                    rgba(16, 185, 129, 0.08) 100%
                  ),
                  radial-gradient(circle at 50% 0%,
                    rgba(16, 185, 129, 0.02) 0%,
                    transparent 50%
                  )
                `,
                border: '1px solid rgba(16, 185, 129, 0.15)',
                backdropFilter: 'blur(20px) saturate(1.6)',
                boxShadow: `
                  0 12px 40px rgba(0, 0, 0, 0.25),
                  inset 0 1px 0 rgba(255, 255, 255, 0.08),
                  0 0 0 1px rgba(16, 185, 129, 0.05)
                `
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">Rate</span>
                <span className="text-sm font-semibold text-white">
                  1 {fromToken?.symbol || ''} = {parseFloat(quote.toAmount || '0') > 0 ?
                    (parseFloat(quote.toAmount) / parseFloat(amount)).toFixed(6) : '---'} {toToken?.symbol || ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">Estimated Fee</span>
                <span className="text-sm font-semibold text-white">
                  ~0.1%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">Bridge Time</span>
                <span className="text-sm font-semibold text-white">
                  {quote.estimatedTime || '2-5 minutes'}
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div
              className="relative z-10 flex items-start gap-3 p-4 rounded-xl"
              style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                backdropFilter: 'blur(20px) saturate(1.6)'
              }}
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-400">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Bridge Button */}
          <div className="w-full">
            <button
              onClick={handleBridge}
              disabled={!isSourceWalletConnected || !amount || parseFloat(amount) <= 0 || loading}
              className="w-full relative font-medium py-4 px-8 rounded-2xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden disabled:cursor-not-allowed"
              style={{
                background: (!isSourceWalletConnected || !amount || parseFloat(amount) <= 0 || loading)
                  ? 'rgba(40, 40, 60, 0.5)'
                  : 'var(--wave-azul)',
                color: 'white',
                border: '1px solid rgba(33, 188, 255, 0.4)',
                boxShadow: (!isSourceWalletConnected || !amount || parseFloat(amount) <= 0 || loading)
                  ? 'none'
                  : '0 8px 32px rgba(33, 188, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (isSourceWalletConnected && amount && parseFloat(amount) > 0 && !loading) {
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(33, 188, 255, 0.6)'
                }
              }}
              onMouseLeave={(e) => {
                if (isSourceWalletConnected && amount && parseFloat(amount) > 0 && !loading) {
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(33, 188, 255, 0.3)'
                }
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  <span>Processing Bridge...</span>
                </div>
              ) : !isSourceWalletConnected ? (
                <span>Connect Wallet First</span>
              ) : !amount || parseFloat(amount) <= 0 ? (
                <span>Enter Amount</span>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span>Execute Bridge</span>
                </div>
              )}
            </button>
          </div>

          {/* Security & Info Footer */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span>Audited</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>Cross-chain</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChainSelectorModal
        isOpen={showFromChainModal}
        onClose={() => setShowFromChainModal(false)}
        onSelectChain={(chainId) => {
          setFromChain(chainId)
          const newToken = supportedTokens.find(t => t.chain === chainId)
          if (newToken) {
            setFromToken(newToken)
          }
          setQuote(null)
          setError(null)
        }}
        excludeChain={toChain}
        title="Select Source Chain"
      />

      <ChainSelectorModal
        isOpen={showToChainModal}
        onClose={() => setShowToChainModal(false)}
        onSelectChain={(chainId) => {
          setToChain(chainId)
          const newToken = supportedTokens.find(t => t.chain === chainId)
          if (newToken) {
            setToToken(newToken)
          }
          setQuote(null)
          setError(null)
        }}
        excludeChain={fromChain}
        title="Select Destination Chain"
      />

      <TokenSelectorModal
        isOpen={showFromTokenModal}
        onClose={() => setShowFromTokenModal(false)}
        onSelectToken={(token) => {
          setFromToken(token)
          setQuote(null)
        }}
        tokens={supportedTokens}
        title="Select Source Token"
        selectedChain={fromChain}
      />

      <TokenSelectorModal
        isOpen={showToTokenModal}
        onClose={() => setShowToTokenModal(false)}
        onSelectToken={(token) => {
          setToToken(token)
          setQuote(null)
        }}
        tokens={supportedTokens}
        title="Select Destination Token"
        selectedChain={toChain}
      />

      {/* Disclaimer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Cross-chain bridges transfer assets between blockchains. Please verify recipient addresses and allow sufficient time for transfers to complete.
        </p>
      </div>
    </div>
  )
}
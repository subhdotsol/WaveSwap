'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { TokenSelector } from '../SwapComponent/TokenSelector'
import { BridgeTokenSelector } from './BridgeTokenSelector'
import { BridgeAmountInput } from './BridgeAmountInput'
import { useThemeConfig, createGlassStyles, createInputStyles } from '@/lib/theme'
import { useNearWallet } from '@/providers/NearWalletProvider'
import { useStarknetWallet } from '@/providers/StarknetWalletProvider'
import { StarknetWalletModal } from '@/providers/StarknetWalletProvider'
import { Token } from '@/types/token'
import { enhancedBridgeService } from '@/lib/services/enhancedBridgeService'
import { ComingSoon } from '@/components/ui/ComingSoon'

// Helper function to get local fallback icon path
function getLocalFallbackIcon(symbol: string, address: string): string | null {
  const tokenIcons: { [key: string]: string | null } = {
    'WAVE': '/icons/fallback/token/wave.png',
    'SOL': '/icons/fallback/token/sol.png',
    'USDC': '/icons/fallback/token/usdc.png',
    'USDT': '/icons/fallback/token/usdt.png',
    'ZEC': '/icons/fallback/token/zec.png',
    'PUMP': '/icons/fallback/token/pump.png',
    'CASH': '/icons/fallback/token/cash.png',
    'WEALTH': '/icons/fallback/token/wealth.png',
    'FTP': '/icons/fallback/token/ftp.jpg',
    'AURA': '/icons/fallback/token/aura.png',
    'MEW': '/icons/fallback/token/mew.png',
    'STORE': '/icons/fallback/token/store.png'
  }

  return tokenIcons[symbol.toUpperCase()] || tokenIcons[address] || null
}

interface WavePortalProps {
  privacyMode: boolean
  comingSoon?: boolean
}

// Chain definitions
const SUPPORTED_CHAINS = [
  {
    id: 'zec',
    name: 'Zcash',
    fullName: 'Zcash Network',
    icon: '/icons/fallback/token/zec.png',
    color: '#F4B942',
    description: 'Privacy-focused cryptocurrency',
    chainId: 1
  },
  {
    id: 'solana',
    name: 'Solana',
    fullName: 'Solana Network',
    icon: '/icons/fallback/token/sol.png',
    color: '#14F195',
    description: 'High-performance blockchain',
    chainId: 101
  },
  {
    id: 'starknet',
    name: 'StarkNet',
    fullName: 'StarkNet Network',
    icon: '/icons/fallback/network/starknet.svg',
    color: '#5F8BFF',
    description: 'Layer 2 scaling solution',
    chainId: 1
  }
]

// Bridge providers mapping
const BRIDGE_PROVIDERS = {
  'zec-solana': 'near-intents',
  'solana-zec': 'near-intents',
  'solana-starknet': 'starkgate',
  'starknet-solana': 'starkgate'
} as const

// Define valid bridge routes - Zcash <> Starknet is NOT allowed
const VALID_BRIDGE_ROUTES = {
  'zec': ['solana'],      // Zcash can only bridge to/from Solana
  'solana': ['zec', 'starknet'], // Solana can bridge to/from Zcash and Starknet
  'starknet': ['solana']  // Starknet can only bridge to/from Solana
} as const

// Token mapping for different chains - BRIDGE SPECIFIC TOKENS
const CHAIN_TOKENS = {
  zec: [
    {
      address: 'zec',
      chainId: 1, // Zcash mainnet
      decimals: 8,
      name: 'Zcash',
      symbol: 'ZEC',
      logoURI: getLocalFallbackIcon('ZEC', 'zec') || '/icons/fallback/token/zec.png',
      tags: [],
      isConfidentialSupported: true,
      isNative: true,
      addressable: true
    }
  ],
  solana: [
    {
      address: 'So11111111111111111111111111111111111111112',
      chainId: 101, // Solana mainnet
      decimals: 9,
      name: 'Solana',
      symbol: 'SOL',
      logoURI: getLocalFallbackIcon('SOL', 'So11111111111111111111111111111111111111112') || '/icons/fallback/token/sol.png',
      tags: [],
      isConfidentialSupported: true,
      isNative: true,
      addressable: true
    },
    {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      chainId: 101,
      decimals: 6,
      name: 'USD Coin',
      symbol: 'USDC',
      logoURI: getLocalFallbackIcon('USDC', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') || '/icons/fallback/token/usdc.png',
      tags: [],
      isConfidentialSupported: true,
      isNative: false,
      addressable: true
    },
    {
      address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      chainId: 101,
      decimals: 6,
      name: 'USDT',
      symbol: 'USDT',
      logoURI: getLocalFallbackIcon('USDT', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') || '/icons/fallback/token/usdt.png',
      tags: [],
      isConfidentialSupported: true,
      isNative: false,
      addressable: true
    },
    {
      address: 'ZEC_TOKEN_SOLANA', // Placeholder for ZEC on Solana
      chainId: 101,
      decimals: 8,
      name: 'Zcash',
      symbol: 'ZEC',
      logoURI: getLocalFallbackIcon('ZEC', 'zec') || '/icons/fallback/token/zec.png',
      tags: [],
      isConfidentialSupported: true,
      isNative: false,
      addressable: true
    },
    {
      address: 'pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn', // Real PUMP token on Solana
      chainId: 101,
      decimals: 6,
      name: 'Pump',
      symbol: 'PUMP',
      logoURI: getLocalFallbackIcon('PUMP', 'pump') || '/icons/fallback/token/pump.png',
      tags: [],
      isConfidentialSupported: true,
      isNative: false,
      addressable: true
    }
  ],
  starknet: [
    {
      address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', // Real SOL on StarkNet
      chainId: 1, // StarkNet mainnet
      decimals: 18,
      name: 'Solana',
      symbol: 'SOL',
      logoURI: getLocalFallbackIcon('SOL', 'sol') || '/icons/fallback/token/sol.png',
      tags: [],
      isConfidentialSupported: true,
      isNative: false,
      addressable: true
    },
    {
      address: 'ZEC_TOKEN_STARKNET', // Placeholder for ZEC on Starknet
      chainId: 1, // StarkNet mainnet
      decimals: 18,
      name: 'Zcash',
      symbol: 'ZEC',
      logoURI: getLocalFallbackIcon('ZEC', 'zec') || '/icons/fallback/token/zec.png',
      tags: [],
      isConfidentialSupported: true,
      isNative: false,
      addressable: true
    },
    {
      address: 'PUMP_TOKEN_STARKNET', // Placeholder for PUMP on Starknet
      chainId: 1,
      decimals: 18,
      name: 'Pump',
      symbol: 'PUMP',
      logoURI: getLocalFallbackIcon('PUMP', 'pump') || '/icons/fallback/token/pump.png',
      tags: [],
      isConfidentialSupported: true,
      isNative: false,
      addressable: true
    }
  ]
}

export function WavePortal({ privacyMode, comingSoon = false }: WavePortalProps) {
  const { publicKey, connected: solanaConnected } = useWallet()
  const { isConnected: nearConnected, accountId, connect: connectNear, disconnect: disconnectNear } = useNearWallet()
  const { isConnected: starknetConnected, account: starknetAccount, connect: connectStarknet, disconnect: disconnectStarknet } = useStarknetWallet()
  const theme = useThemeConfig()

  // Dynamic chain tokens with theme-aware logos
  const DYNAMIC_CHAIN_TOKENS = useMemo(() => {
    const logoURI = theme.name === 'stealth' ? '/wave-stealth.png' : theme.name === 'ghost' ? '/wave-ghost.jpg' : '/wave0.png'

    return {
      ...CHAIN_TOKENS,
      solana: CHAIN_TOKENS.solana.map(token =>
        (token.address === 'wave' || token.address === 'wealth')
          ? { ...token, logoURI }
          : token
      )
    }
  }, [theme.name])

  // Helper function to get tokens for specific bridge route
  const getBridgeTokensForRoute = (from: string, to: string) => {
    const allFromTokens = DYNAMIC_CHAIN_TOKENS[from as keyof typeof DYNAMIC_CHAIN_TOKENS]
    const allToTokens = DYNAMIC_CHAIN_TOKENS[to as keyof typeof DYNAMIC_CHAIN_TOKENS]

    // Filter tokens based on bridge route requirements
    if ((from === 'zec' && to === 'solana') || (from === 'solana' && to === 'zec')) {
      // Zcash <> Solana: Only ZEC supported
      return {
        from: allFromTokens.filter(token => token.symbol === 'ZEC'),
        to: allToTokens.filter(token => token.symbol === 'ZEC')
      }
    } else if ((from === 'starknet' && to === 'solana') || (from === 'solana' && to === 'starknet')) {
      // Starknet <> Solana: SOL and PUMP supported
      return {
        from: allFromTokens.filter(token => ['SOL', 'PUMP'].includes(token.symbol)),
        to: allToTokens.filter(token => ['SOL', 'PUMP'].includes(token.symbol))
      }
    } else {
      // Default: return all tokens (shouldn't happen with our restrictions)
      return {
        from: allFromTokens,
        to: allToTokens
      }
    }
  }

  // UI State
  const [fromChain, setFromChain] = useState<string>('zec')
  const [toChain, setToChain] = useState<string>('solana')
  const [fromToken, setFromToken] = useState<Token | undefined>(DYNAMIC_CHAIN_TOKENS.zec[0])
  const [toToken, setToToken] = useState<Token | undefined>(getBridgeTokensForRoute('zec', 'solana').to[0])
  const [amount, setAmount] = useState('')
  const [isBridging, setIsBridging] = useState(false)
  const [showStarknetWalletModal, setShowStarknetWalletModal] = useState(false)
  const [isReversed, setIsReversed] = useState(false)

  // Check if a bridge route is valid
  const isValidBridgeRoute = (from: string, to: string): boolean => {
    const validDestinations = VALID_BRIDGE_ROUTES[from as keyof typeof VALID_BRIDGE_ROUTES]
    return validDestinations ? validDestinations.includes(to as 'solana' | 'zec' | 'starknet') : false
  }

  // Get available destination chains for a source chain
  const getAvailableDestinationChains = (sourceChain: string): string[] => {
    const destinations = VALID_BRIDGE_ROUTES[sourceChain as keyof typeof VALID_BRIDGE_ROUTES]
    return destinations ? [...destinations] : []
  }

  const getBridgeProvider = (from: string, to: string) => {
    const routeKey = `${from}-${to}` as keyof typeof BRIDGE_PROVIDERS
    return BRIDGE_PROVIDERS[routeKey] || 'near-intents'
  }

  const getChainName = (chainId: string) => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId)
    return chain ? chain.name : chainId.toUpperCase()
  }

  const handleChainSelect = (chainType: 'from' | 'to', chainId: string) => {
    let newFromChain = fromChain
    let newToChain = toChain

    if (chainType === 'from') {
      // Check if this is a valid bridge route
      if (!isValidBridgeRoute(chainId, toChain)) {
        // If invalid route, find the first valid destination chain
        const validDestinations = getAvailableDestinationChains(chainId)
        if (validDestinations.length > 0) {
          newFromChain = chainId
          newToChain = validDestinations[0]
          setIsReversed(chainId !== toChain) // Track if direction changed
        } else {
          return // No valid route, do nothing
        }
      } else {
        newFromChain = chainId
      }
    } else {
      // Check if this is a valid bridge route
      if (!isValidBridgeRoute(fromChain, chainId)) {
        // If invalid route, find a valid source chain for this destination
        const allChains = ['zec', 'solana', 'starknet'] as const
        const validSource = allChains.find(source =>
          source !== chainId && isValidBridgeRoute(source, chainId)
        )
        if (validSource) {
          newFromChain = validSource
          newToChain = chainId
          setIsReversed(validSource !== fromChain) // Track if direction changed
        } else {
          return // No valid route, do nothing
        }
      } else {
        newToChain = chainId
      }
    }

    setFromChain(newFromChain)
    setToChain(newToChain)
    setAmount('') // Reset amount when chains change
  }

  // Auto-update tokens when chains change - use bridge-specific filtering
  React.useEffect(() => {
    const bridgeTokens = getBridgeTokensForRoute(fromChain, toChain)

    // Set the first available token for each side
    if (bridgeTokens.from.length > 0) {
      setFromToken(bridgeTokens.from[0])
    }
    if (bridgeTokens.to.length > 0) {
      setToToken(bridgeTokens.to[0])
    }
  }, [fromChain, toChain])

  const getWalletConnectionStatus = () => {
    const sourceChain = fromChain

    switch (sourceChain) {
      case 'solana':
        return {
          connected: solanaConnected,
          address: publicKey?.toString(),
          label: 'Solana Wallet'
        }
      case 'zec':
        return {
          connected: nearConnected,
          address: accountId,
          label: 'NEAR Wallet (for Zcash)'
        }
      case 'starknet':
        return {
          connected: starknetConnected,
          address: starknetAccount?.address,
          label: 'StarkNet Wallet'
        }
      default:
        return {
          connected: false,
          address: null,
          label: 'Wallet'
        }
    }
  }

  const handleWalletConnect = async () => {
    const walletStatus = getWalletConnectionStatus()

    if (walletStatus.connected) {
      // Disconnect wallet
      switch (fromChain) {
        case 'zec':
          await disconnectNear()
          break
        case 'starknet':
          await disconnectStarknet()
          break
        case 'solana':
          // Solana disconnect is handled by wallet adapter
          alert('Please use the Solana wallet button in the header to disconnect')
          break
      }
      return
    }

    switch (fromChain) {
      case 'solana':
        // Solana wallet is handled by Solana wallet adapter in header
        alert('Please use the Solana wallet connect button in the header')
        break
      case 'zec':
        // NEAR wallet for Zcash
        try {
          await connectNear()
        } catch (error) {
          console.error('NEAR wallet connection failed:', error)
          alert('Failed to connect NEAR wallet. Please try again.')
        }
        break
      case 'starknet':
        // Show StarkNet wallet modal
        setShowStarknetWalletModal(true)
        break
    }
  }

const handleBridge = async () => {
    const walletStatus = getWalletConnectionStatus()
    const bridgeProvider = getBridgeProvider(fromChain, toChain)

    if (!walletStatus.connected) {
      alert(`Please connect your ${walletStatus.label}`)
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!fromToken || !toToken) {
      alert('Please select valid tokens')
      return
    }

    setIsBridging(true)

    try {
      const amountInSmallestUnits = parseFloat(amount) * Math.pow(10, fromToken.decimals)

      // Generate quote first
      const quote = await enhancedBridgeService.generateQuote(
        {
          symbol: fromToken.symbol,
          name: fromToken.name,
          address: fromToken.address,
          decimals: fromToken.decimals,
          chain: fromChain,
          logoURI: fromToken.logoURI,
          bridgeSupport: {
            nearIntents: bridgeProvider === 'near-intents',
            starkgate: bridgeProvider === 'starkgate',
            defuse: true,
            directBridge: false
          }
        },
        {
          symbol: toToken.symbol,
          name: toToken.name,
          address: toToken.address,
          decimals: toToken.decimals,
          chain: toChain,
          logoURI: toToken.logoURI,
          bridgeSupport: {
            nearIntents: bridgeProvider === 'near-intents',
            starkgate: bridgeProvider === 'starkgate',
            defuse: true,
            directBridge: false
          }
        },
        amountInSmallestUnits.toString(),
        {
          slippageBps: 50, // 0.5%
          recipientAddress: walletStatus.address || '',
          deadline: 20 * 60 // 20 minutes
        }
      )

      console.log('Bridge quote generated:', quote)

      // Execute the bridge
      const result = await enhancedBridgeService.executeBridge(quote, {
        recipientAddress: walletStatus.address || '',
        privacyMode: privacyMode
      })

      console.log('Bridge execution result:', result)
      alert(`Bridge initiated successfully! ${amount} ${fromToken.symbol} → ${toChain}`)
      setAmount('')

    } catch (error) {
      console.error('Bridge failed:', error)
      alert(`Bridge failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsBridging(false)
    }
  }

  const getAvailableFromTokens = () => {
    const bridgeTokens = getBridgeTokensForRoute(fromChain, toChain)
    return bridgeTokens.from
  }

  const getAvailableToTokens = () => {
    const bridgeTokens = getBridgeTokensForRoute(fromChain, toChain)
    return bridgeTokens.to
  }

  const walletStatus = getWalletConnectionStatus()

  // Show Coming Soon if enabled
  if (comingSoon) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <ComingSoon
          message="Coming Soon"
          description="Seamlessly transfer assets across Solana, NEAR, StarkNet, and more. Experience lightning-fast bridging with military-grade security."
          icon={
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
          compact={false}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg sm:max-w-xl mx-auto px-2 xs:px-0">
      {/* Enhanced Chain Selector */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
          {/* From Chain */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              From Chain
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_CHAINS.map((chain) => {
                const isDisabled = !isValidBridgeRoute(chain.id, toChain)
                return (
                <button
                  key={chain.id}
                  onClick={() => !isDisabled && handleChainSelect('from', chain.id)}
                  disabled={isDisabled}
                  className={`p-2 sm:p-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                    fromChain === chain.id
                      ? 'ring-2 ring-blue-500/20 shadow-lg'
                      : isDisabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:border-opacity-60'
                  }`}
                  style={{
                    background: fromChain === chain.id
                      ? `
                        linear-gradient(135deg,
                          ${chain.color}25 0%,
                          ${chain.color}15 50%,
                          ${chain.color}25 100%
                        ),
                        radial-gradient(circle at 30% 30%,
                          ${chain.color}20 0%,
                          transparent 50%
                        ),
                        linear-gradient(135deg,
                          rgba(255, 255, 255, 0.1) 0%,
                          rgba(255, 255, 255, 0.05) 50%,
                          rgba(255, 255, 255, 0.1) 100%
                        )
                      `
                      : `
                        linear-gradient(135deg,
                          ${theme.colors.surface}ee 0%,
                          ${theme.colors.surfaceHover}cc 50%,
                          ${theme.colors.surface}ee 100%
                        ),
                        radial-gradient(circle at 25% 25%,
                          ${theme.colors.primary}05 0%,
                          transparent 50%
                        ),
                        linear-gradient(135deg,
                          rgba(255, 255, 255, 0.05) 0%,
                          rgba(255, 255, 255, 0.02) 50%,
                          rgba(255, 255, 255, 0.05) 100%
                        )
                      `,
                    borderColor: fromChain === chain.id
                      ? `${chain.color}60`
                      : isDisabled
                      ? `${theme.colors.border}30`
                      : `${theme.colors.border}60`,
                    borderWidth: '2px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    backdropFilter: 'blur(20px) saturate(1.8)',
                    boxShadow: fromChain === chain.id
                      ? `
                        0 8px 32px ${chain.color}25,
                        inset 0 1px 0 rgba(255, 255, 255, 0.2),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                      `
                      : isDisabled
                      ? 'none'
                      : `
                        0 4px 16px ${theme.colors.shadow}20,
                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                      `
                  }}
                >
                  {fromChain === chain.id && (
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: `linear-gradient(135deg, ${chain.color} 0%, transparent 70%)`
                      }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300"
                      style={{
                        background: fromChain === chain.id
                          ? `
                            linear-gradient(135deg,
                              ${chain.color}40 0%,
                              ${chain.color}30 50%,
                              ${chain.color}40 100%
                            ),
                            radial-gradient(circle at 30% 30%,
                              ${chain.color}25 0%,
                              transparent 60%
                            )
                          `
                          : `
                            linear-gradient(135deg,
                              rgba(255, 255, 255, 0.15) 0%,
                              rgba(255, 255, 255, 0.08) 50%,
                              rgba(255, 255, 255, 0.15) 100%
                            ),
                            radial-gradient(circle at 30% 30%,
                              rgba(33, 188, 255, 0.1) 0%,
                              transparent 60%
                            )
                          `,
                        boxShadow: fromChain === chain.id
                          ? `
                            inset 0 1px 0 rgba(255, 255, 255, 0.3),
                            inset 0 -1px 0 rgba(0, 0, 0, 0.1),
                            0 4px 12px ${chain.color}30
                          `
                          : `
                            inset 0 1px 0 rgba(255, 255, 255, 0.2),
                            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                          `
                      }}
                    >
                      <img
                        src={chain.icon}
                        alt={chain.name}
                        className="w-8 h-8 transition-all duration-300"
                        style={{
                          borderRadius: '50%',
                          objectFit: 'cover',
                          filter: fromChain === chain.id
                            ? `brightness(1.3) saturate(1.2) drop-shadow(0 0 8px ${chain.color}50)`
                            : theme.name === 'light' && chain.id === 'zec'
                              ? 'brightness(0.8) contrast(1.1) saturate(1.1)'
                              : 'brightness(1.0) saturate(1.0)',
                          transform: fromChain === chain.id ? 'scale(1.1)' : 'scale(1)'
                        }}
                        onError={(e) => {
                          // Fallback to colored circle if icon fails
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div style="
                                width: 32px;
                                height: 32px;
                                background: ${chain.color};
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                color: white;
                                font-size: 12px;
                                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                              ">${chain.name.substring(0, 2).toUpperCase()}</div>
                            `
                          }
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <div
                        className="font-semibold text-sm"
                        style={{
                          color: fromChain === chain.id
                            ? theme.colors.primary
                            : theme.colors.textPrimary
                        }}
                      >
                        {chain.name}
                      </div>
                    </div>
                  </div>
                </button>
                )
              })}
            </div>
          </div>

          {/* Arrow Button */}
          <div className="flex items-center justify-center mx-4">
            <button
              onClick={() => handleChainSelect('from', toChain)}
              className="p-3 rounded-full transition-all hover:scale-110 active:scale-95"
              style={{
                ...createGlassStyles(theme),
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                cursor: 'pointer'
              }}
            >
              <svg
                className={`w-5 h-5 transition-transform ${isReversed ? 'rotate-180' : ''}`}
                style={{ color: theme.colors.primary }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To Chain */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-right" style={{ color: theme.colors.textSecondary }}>
              To
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_CHAINS.map((chain) => {
                const isDisabled = !isValidBridgeRoute(fromChain, chain.id)
                return (
                <button
                  key={chain.id}
                  onClick={() => !isDisabled && handleChainSelect('to', chain.id)}
                  disabled={isDisabled}
                  className={`p-2 sm:p-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                    toChain === chain.id
                      ? 'ring-2 ring-blue-500/20 shadow-lg'
                      : isDisabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:border-opacity-60'
                  }`}
                  style={{
                    background: toChain === chain.id
                      ? `
                        linear-gradient(135deg,
                          ${chain.color}25 0%,
                          ${chain.color}15 50%,
                          ${chain.color}25 100%
                        ),
                        radial-gradient(circle at 30% 30%,
                          ${chain.color}20 0%,
                          transparent 50%
                        ),
                        linear-gradient(135deg,
                          rgba(255, 255, 255, 0.1) 0%,
                          rgba(255, 255, 255, 0.05) 50%,
                          rgba(255, 255, 255, 0.1) 100%
                        )
                      `
                      : `
                        linear-gradient(135deg,
                          ${theme.colors.surface}ee 0%,
                          ${theme.colors.surfaceHover}cc 50%,
                          ${theme.colors.surface}ee 100%
                        ),
                        radial-gradient(circle at 25% 25%,
                          ${theme.colors.primary}05 0%,
                          transparent 50%
                        ),
                        linear-gradient(135deg,
                          rgba(255, 255, 255, 0.05) 0%,
                          rgba(255, 255, 255, 0.02) 50%,
                          rgba(255, 255, 255, 0.05) 100%
                        )
                      `,
                    borderColor: toChain === chain.id
                      ? `${chain.color}60`
                      : isDisabled
                      ? `${theme.colors.border}30`
                      : `${theme.colors.border}60`,
                    borderWidth: '2px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    backdropFilter: 'blur(20px) saturate(1.8)',
                    boxShadow: toChain === chain.id
                      ? `
                        0 8px 32px ${chain.color}25,
                        inset 0 1px 0 rgba(255, 255, 255, 0.2),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                      `
                      : isDisabled
                      ? 'none'
                      : `
                        0 4px 16px ${theme.colors.shadow}20,
                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                      `
                  }}
                >
                  {toChain === chain.id && (
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: `linear-gradient(135deg, ${chain.color} 0%, transparent 70%)`
                      }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300"
                      style={{
                        background: toChain === chain.id
                          ? `
                            linear-gradient(135deg,
                              ${chain.color}40 0%,
                              ${chain.color}30 50%,
                              ${chain.color}40 100%
                            ),
                            radial-gradient(circle at 30% 30%,
                              ${chain.color}25 0%,
                              transparent 60%
                            )
                          `
                          : `
                            linear-gradient(135deg,
                              rgba(255, 255, 255, 0.15) 0%,
                              rgba(255, 255, 255, 0.08) 50%,
                              rgba(255, 255, 255, 0.15) 100%
                            ),
                            radial-gradient(circle at 30% 30%,
                              rgba(33, 188, 255, 0.1) 0%,
                              transparent 60%
                            )
                          `,
                        boxShadow: toChain === chain.id
                          ? `
                            inset 0 1px 0 rgba(255, 255, 255, 0.3),
                            inset 0 -1px 0 rgba(0, 0, 0, 0.1),
                            0 4px 12px ${chain.color}30
                          `
                          : `
                            inset 0 1px 0 rgba(255, 255, 255, 0.2),
                            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                          `
                      }}
                    >
                      <img
                        src={chain.icon}
                        alt={chain.name}
                        className="w-8 h-8 transition-all duration-300"
                        style={{
                          borderRadius: '50%',
                          objectFit: 'cover',
                          filter: toChain === chain.id
                            ? `brightness(1.3) saturate(1.2) drop-shadow(0 0 8px ${chain.color}50)`
                            : theme.name === 'light' && chain.id === 'zec'
                              ? 'brightness(0.8) contrast(1.1) saturate(1.1)'
                              : 'brightness(1.0) saturate(1.0)',
                          transform: toChain === chain.id ? 'scale(1.1)' : 'scale(1)'
                        }}
                        onError={(e) => {
                          // Fallback to colored circle if icon fails
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div style="
                                width: 32px;
                                height: 32px;
                                background: ${chain.color};
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                color: white;
                                font-size: 12px;
                                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                              ">${chain.name.substring(0, 2).toUpperCase()}</div>
                            `
                          }
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <div
                        className="font-semibold text-sm"
                        style={{
                          color: toChain === chain.id
                            ? theme.colors.primary
                            : theme.colors.textPrimary
                        }}
                      >
                        {chain.name}
                      </div>
                    </div>
                  </div>
                </button>
                )
              })}
            </div>
          </div>
        </div>

  
        {/* Wallet Connection Status */}
        {walletStatus.connected && walletStatus.address && (
          <div className="mt-4 text-center">
            <div
              className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full text-sm"
              style={{
                ...createGlassStyles(theme),
                backgroundColor: `${theme.colors.success}10`,
                color: theme.colors.success,
                border: `1px solid ${theme.colors.success}30`
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.colors.success }} />
                <span className="font-medium">
                  {walletStatus.label}
                </span>
              </div>
              <div className="h-4 w-px" style={{ backgroundColor: `${theme.colors.success}30` }} />
              <span className="font-mono text-xs">
                {walletStatus.address.slice(0, 8)}...{walletStatus.address.slice(-6)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bridge Interface - matches swap UI exactly */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          ...createGlassStyles(theme),
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`
        }}
      >
        {/* From Token */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
              From
            </span>
            {walletStatus.connected && walletStatus.address ? (
              <div className="text-right">
                <div className="text-xs font-medium" style={{ color: theme.colors.textPrimary }}>
                  {walletStatus.label?.split(' ')[0]}
                </div>
                <div
                  className="text-xs font-mono mt-1 px-2 py-1 rounded-full inline-block"
                  style={{
                    backgroundColor: `${theme.colors.primary}15`,
                    color: theme.colors.primary,
                    border: `1px solid ${theme.colors.primary}30`
                  }}
                >
                  {walletStatus.address.slice(0, 6)}...{walletStatus.address.slice(-4)}
                </div>
              </div>
            ) : (
              <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                Not Connected
              </span>
            )}
          </div>

          <div className="space-y-4">
            <BridgeTokenSelector
              selectedToken={fromToken || null}
              onTokenChange={setFromToken}
              tokens={getAvailableFromTokens()}
              sourceChain={fromChain}
              targetChain={toChain}
            />

            <BridgeAmountInput
              value={amount}
              onChange={setAmount}
              token={fromToken}
              decimals={fromToken?.decimals}
              label="Amount"
              showBalance={false}
              quickActions={true}
            />
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="relative h-6 flex items-center justify-center px-6">
          <div className="absolute left-6 right-6 h-px" style={{ backgroundColor: theme.colors.border }} />
          <button
            onClick={() => {
              // Swap chains
              setFromChain(toChain)
              setToChain(fromChain)
              setIsReversed(!isReversed)
            }}
            className="relative z-10 p-2 rounded-full transition-all hover:scale-110"
            style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`
            }}
          >
            <svg
              className="w-4 h-4"
              style={{ color: theme.colors.primary }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To Token */}
        <div className="p-6 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
              To
            </span>
            <span className="text-xs" style={{ color: theme.colors.textMuted }}>
              {getChainName(toChain)}
            </span>
          </div>

          <BridgeTokenSelector
            selectedToken={toToken || null}
            onTokenChange={setToToken}
            tokens={getAvailableToTokens()}
            sourceChain={fromChain}
            targetChain={toChain}
          />
        </div>

        {/* Wallet Status & Bridge Button */}
        <div className="p-6 pt-0">
          {!walletStatus.connected && (
            <div
              className="p-3 rounded-lg mb-4 text-sm"
              style={{
                backgroundColor: `${theme.colors.warning}10`,
                border: `1px solid ${theme.colors.warning}20`
              }}
            >
              <span style={{ color: theme.colors.warning }}>
                Connect your {walletStatus.label} to continue
              </span>
            </div>
          )}

          <button
            onClick={!walletStatus.connected ? handleWalletConnect : handleBridge}
            disabled={isBridging}
            className="w-full relative font-medium py-4 px-6 rounded-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden"
            style={{
              ...createGlassStyles(theme),
              background: walletStatus.connected && amount && parseFloat(amount) > 0
                ? 'var(--wave-azul)'
                : `${theme.colors.surface}60`,
              border: `1px solid ${
                walletStatus.connected && amount && parseFloat(amount) > 0
                  ? theme.colors.primary
                  : theme.colors.border
              }`
            }}
          >
            {isBridging ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                <span style={{ color: theme.colors.textPrimary }}>
                  Bridging...
                </span>
              </div>
            ) : !walletStatus.connected ? (
              <div className="text-left">
                <span style={{ color: theme.colors.textPrimary }}>
                  Connect {walletStatus.label}
                </span>
                <span className="text-xs block mt-1 opacity-80" style={{ color: theme.colors.textMuted }}>
                  Required to bridge assets
                </span>
              </div>
            ) : !amount || parseFloat(amount) <= 0 ? (
              <span style={{ color: theme.colors.textMuted }}>
                Enter Amount
              </span>
            ) : (
              <div className="text-left">
                <span style={{ color: theme.colors.textPrimary }}>
                  Send to {getChainName(toChain)}
                </span>
                {walletStatus.address && (
                  <span className="text-xs block mt-1 font-mono opacity-80" style={{ color: theme.colors.textMuted }}>
                    {walletStatus.address.slice(0, 10)}...{walletStatus.address.slice(-6)}
                  </span>
                )}
              </div>
            )}
          </button>
        </div>
      </div>

  
      {/* StarkNet Wallet Modal */}
      <StarknetWalletModal
        isOpen={showStarknetWalletModal}
        onClose={() => setShowStarknetWalletModal(false)}
        onSuccess={() => setShowStarknetWalletModal(false)}
      />
    </div>
  )
}
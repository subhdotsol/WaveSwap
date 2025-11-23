'use client'

import { useState, Fragment, useMemo, useEffect, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  StarIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import {
  ChevronUpDownIcon,
  WalletIcon
} from '@heroicons/react/24/solid'
import { Token } from '@/types/token'
import { TokenIcon } from '@/components/TokenIcon'
import { TOKEN_ADDRESS_MAP, TOKEN_SYMBOL_MAP } from '@/lib/tokens'

interface TokenSelectorProps {
  selectedToken: Token | null
  onTokenChange: (token: Token) => void
  tokens: Token[]
  disabled?: boolean
  balances?: Map<string, string>
  privacyMode?: boolean
  showConfidentialIndicator?: boolean
}

// Recommended tokens to show initially
const RECOMMENDED_TOKENS = [
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
]

const JUPITER_SEARCH_API = '/api/v1/jupiter/tokens/v2/search'
const JUPITER_CDN = 'https://img-cdn.jup.ag/tokens'

export function TokenSelectorNew({
  selectedToken,
  onTokenChange,
  tokens,
  disabled = false,
  balances,
  privacyMode = false,
  showConfidentialIndicator = false
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Token[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [allTokens, setAllTokens] = useState<Token[]>([])

  // Initialize tokens on mount
  useEffect(() => {
    // Start with provided tokens (should be user tokens + recommended)
    setAllTokens(tokens)
  }, [tokens])

  // Filter tokens for initial display
  const getInitialTokens = useCallback(() => {
    // 1. User tokens with balance
    const userTokens = allTokens.filter(token => {
      if (!balances) return false
      const balance = balances.get(token.address)
      return balance && parseFloat(balance) > 0
    })

    // 2. Recommended tokens (if not already in user tokens)
    const recommendedTokens = allTokens.filter(token =>
      RECOMMENDED_TOKENS.includes(token.address) &&
      !userTokens.find(ut => ut.address === token.address)
    )

    return [...userTokens, ...recommendedTokens]
  }, [allTokens, balances])

  // Fast token lookup using precomputed maps for instant results
  const fastTokenLookup = useCallback((query: string): Token[] => {
    const lowerQuery = query.toLowerCase()
    const results: Token[] = []

    // Fast symbol lookup using map
    const symbolMatch = TOKEN_SYMBOL_MAP.get(lowerQuery)
    if (symbolMatch) {
      results.push(symbolMatch)
    }

    // Fast address lookup using map
    const addressMatch = TOKEN_ADDRESS_MAP.get(query)
    if (addressMatch && !results.find(t => t.address === addressMatch.address)) {
      results.push(addressMatch)
    }

    // Fallback to local search in user tokens
    const localMatches = allTokens.filter(token =>
      (token.name.toLowerCase().includes(lowerQuery) ||
       token.symbol.toLowerCase().includes(lowerQuery)) &&
      !results.find(t => t.address === token.address)
    )

    return [...results, ...localMatches].slice(0, 10)
  }, [allTokens])

  // Search tokens with aggressive debouncing and fast local lookup
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    // Very aggressive debouncing - prioritize instant local results
    const searchTimer = setTimeout(async () => {
      setIsSearching(true)

      // Instant local lookup using precomputed maps
      const instantResults = fastTokenLookup(searchQuery)

      if (instantResults.length > 0) {
        setSearchResults(instantResults)
        setIsSearching(false)
        return
      }

      // If no local results, try API with timeout
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout

        const response = await fetch(`${JUPITER_SEARCH_API}?query=${encodeURIComponent(searchQuery)}`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()

          if (Array.isArray(data) && data.length > 0) {
            const jupiterTokens: Token[] = data.slice(0, 20).map((t: any) => ({
              address: t.id || t.address || t.mint,
              chainId: 101,
              decimals: t.decimals || 9,
              name: t.name || 'Unknown Token',
              symbol: t.symbol || 'UNKNOWN',
              logoURI: t.icon || t.logoURI || t.image,
              tags: t.tags || [],
              isConfidentialSupported: false,
              isNative: (t.id || t.address || t.mint) === 'So11111111111111111111111111111111111111112',
              addressable: true,
            })).filter(t => t.symbol && t.name && t.address)

            setSearchResults(jupiterTokens)
          } else {
            setSearchResults([])
          }
        } else {
          setSearchResults([])
        }
      } catch (error) {
        console.warn('Jupiter API search failed, using local tokens only')
        // Show empty results when API fails - users will see the default tokens list
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 500) // Increased from 300ms to 500ms for better debouncing

    return () => clearTimeout(searchTimer)
  }, [searchQuery])

  // Get display tokens based on search state
  const displayTokens = useMemo(() => {
    if (searchQuery && searchResults.length > 0) {
      return searchResults
    } else if (searchQuery && searchResults.length === 0) {
      return []
    } else {
      return getInitialTokens()
    }
  }, [searchQuery, searchResults, getInitialTokens])

  // Group tokens by balance for better UX
  const { tokensWithBalance, tokensWithoutBalance } = useMemo(() => {
    const withBalance: Token[] = []
    const withoutBalance: Token[] = []

    displayTokens.forEach(token => {
      const balance = balances?.get(token.address)
      if (balance && parseFloat(balance) > 0) {
        withBalance.push(token)
      } else {
        withoutBalance.push(token)
      }
    })

    return { tokensWithBalance: withBalance, tokensWithoutBalance: withoutBalance }
  }, [displayTokens, balances])

  const getTokenBalance = (token: Token): string => {
    if (!balances) return '0'
    return balances.get(token.address) || '0'
  }

  const formatBalance = (balance: string, decimals: number): string => {
    try {
      const num = parseFloat(balance) / Math.pow(10, decimals)
      if (num === 0) return '0'
      if (num < 0.001) return '<0.001'
      if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
      if (num >= 1000) return `${(num / 1000).toFixed(2)}K`
      return num.toFixed(Math.max(0, 6 - Math.floor(num).toString().length))
    } catch {
      return '0'
    }
  }

  const handleTokenSelect = (token: Token) => {
    onTokenChange(token)
    setIsOpen(false)
    setSearchQuery('')
  }

  const currentToken = selectedToken || tokens[0]

  return (
    <>
      {/* Token Selector Button */}
      <button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="group relative flex items-center justify-between gap-3 px-4 py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full h-14 rounded-xl overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(30, 30, 45, 0.95) 0%,
              rgba(45, 45, 65, 0.9) 50%,
              rgba(30, 30, 45, 0.95) 100%
            ),
            radial-gradient(circle at 30% 30%,
              rgba(162, 89, 250, 0.1) 0%,
              transparent 50%
            )
          `,
          border: '1px solid rgba(162, 89, 250, 0.3)',
          backdropFilter: 'blur(20px) saturate(1.8)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 4px 12px rgba(162, 89, 250, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = `
            0 12px 40px rgba(0, 0, 0, 0.4),
            0 6px 16px rgba(162, 89, 250, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          `
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0px)'
          e.currentTarget.style.boxShadow = `
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 4px 12px rgba(162, 89, 250, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `
        }}
      >
        {/* Noise grain overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            filter: 'contrast(1.4) brightness(1.2)'
          }}
        />

        <div className="flex items-center gap-3 flex-1 relative z-10">
          {currentToken && (
            <>
              <div className="relative">
                <TokenIcon
                  symbol={currentToken.symbol}
                  mint={currentToken.address}
                  logoURI={currentToken.logoURI}
                  size={32}
                />
                {/* Glow effect for icon */}
                <div
                  className="absolute inset-0 rounded-full blur-xl opacity-30 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(162, 89, 250, 0.4) 0%, transparent 70%)'
                  }}
                />
              </div>
              <div className="flex flex-col items-start">
                <span
                  className="font-bold tracking-wide text-white/95"
                  style={{
                    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                    textShadow: '0 0 10px rgba(162, 89, 250, 0.3)'
                  }}
                >
                  {currentToken.symbol}
                </span>
              </div>
            </>
          )}
        </div>
        <ChevronDownIcon
          className="h-5 w-5 flex-shrink-0 transition-all duration-300 text-purple-300 group-hover:text-purple-200"
          style={{
            transform: isOpen ? 'rotate(180deg) translateY(1px)' : 'rotate(0deg)',
            filter: 'drop-shadow(0 0 8px rgba(162, 89, 250, 0.4))'
          }}
        />
      </button>

      {/* Token Selection Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[999999]" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className="w-full max-w-md transform overflow-hidden rounded-3xl p-0 text-left align-middle transition-all relative"
                  style={{
                    background: `
                      linear-gradient(135deg,
                        rgba(20, 20, 35, 0.98) 0%,
                        rgba(30, 30, 50, 0.95) 50%,
                        rgba(25, 25, 40, 0.98) 100%
                      ),
                      radial-gradient(circle at 50% 10%,
                        rgba(162, 89, 250, 0.08) 0%,
                        transparent 50%
                      )
                    `,
                    border: '1px solid rgba(162, 89, 250, 0.25)',
                    boxShadow: `
                      0 50px 100px -20px rgba(0, 0, 0, 0.7),
                      0 25px 50px -12px rgba(0, 0, 0, 0.5),
                      0 0 0 1px rgba(162, 89, 250, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `,
                    backdropFilter: 'blur(40px) saturate(1.5)'
                  }}
                >
                  {/* Noise grain overlay for modal */}
                  <div
                    className="absolute inset-0 opacity-8 pointer-events-none rounded-3xl"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='modal-noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23modal-noise)' opacity='1'/%3E%3C/svg%3E")`,
                      mixBlendMode: 'overlay'
                    }}
                  />
                  {/* Modal Header */}
                  <div className="relative flex items-center justify-between p-6 border-b" style={{
                    borderColor: 'rgba(162, 89, 250, 0.15)',
                    background: 'linear-gradient(to bottom, rgba(162, 89, 250, 0.05), transparent)'
                  }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" />
                      <Dialog.Title
                        className="text-xl font-bold text-white"
                        style={{
                          fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
                          letterSpacing: '0.025em',
                          textShadow: '0 0 20px rgba(162, 89, 250, 0.3)'
                        }}
                      >
                        Select Token
                      </Dialog.Title>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-xl transition-all hover:bg-white/10 group"
                      style={{ color: 'rgba(229, 231, 235, 0.7)' }}
                    >
                      <XMarkIcon className="h-5 w-5 transition-transform group-hover:rotate-90" />
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="p-6 pb-4 relative">
                    <div className="relative group">
                      <MagnifyingGlassIcon
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300/60 group-focus-within:text-purple-300 transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="Search tokens or paste address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl text-white/90 placeholder-white/40 text-sm font-medium transition-all duration-200"
                        style={{
                          background: 'rgba(10, 10, 20, 0.8)',
                          border: '1px solid rgba(162, 89, 250, 0.3)',
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxShadow: '0 0 0 0 transparent'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(162, 89, 250, 0.6)';
                          e.currentTarget.style.boxShadow = '0 0 0 1px rgba(162, 89, 250, 0.3), inset 0 0 20px rgba(162, 89, 250, 0.1)';
                          e.currentTarget.style.background = 'rgba(10, 10, 20, 0.95)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(162, 89, 250, 0.3)';
                          e.currentTarget.style.boxShadow = '0 0 0 0 transparent';
                          e.currentTarget.style.background = 'rgba(10, 10, 20, 0.8)';
                        }}
                        autoFocus
                      />
                      {/* Search icon glow */}
                      <div
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 blur-xl opacity-0 group-focus-within:opacity-40 transition-opacity rounded-full"
                        style={{
                          background: 'radial-gradient(circle, rgba(162, 89, 250, 0.3) 0%, transparent 70%)'
                        }}
                      />
                    </div>
                    {isSearching && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                        <div className="text-sm font-medium text-purple-300">
                          Searching for tokens...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Token List */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {searchQuery && searchResults.length === 0 && !isSearching && (
                      <div className="p-8 text-center">
                        <div style={{ color: 'rgba(229, 231, 235, 0.5)' }}>
                          No tokens found for "{searchQuery}"
                        </div>
                      </div>
                    )}

                    {!searchQuery && tokensWithBalance.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold" style={{
                          color: 'rgba(162, 89, 250, 0.8)',
                          fontFamily: 'Inter, system-ui, sans-serif'
                        }}>
                          Your Tokens
                        </div>
                        {tokensWithBalance.map((token) => (
                          <TokenListItem
                            key={token.address}
                            token={token}
                            balance={getTokenBalance(token)}
                            onSelect={handleTokenSelect}
                            isSelected={selectedToken?.address === token.address}
                          />
                        ))}
                      </div>
                    )}

                    {!searchQuery && tokensWithoutBalance.length > 0 && (
                      <div>
                        {tokensWithBalance.length > 0 && (
                          <div className="px-4 py-2 text-xs font-semibold mt-4" style={{
                            color: 'rgba(162, 89, 250, 0.8)',
                            fontFamily: 'Inter, system-ui, sans-serif'
                          }}>
                            Popular Tokens
                          </div>
                        )}
                        {tokensWithoutBalance.slice(0, 10).map((token) => (
                          <TokenListItem
                            key={token.address}
                            token={token}
                            balance={getTokenBalance(token)}
                            onSelect={handleTokenSelect}
                            isSelected={selectedToken?.address === token.address}
                          />
                        ))}
                      </div>
                    )}

                    {searchQuery && searchResults.map((token) => (
                      <TokenListItem
                        key={token.address}
                        token={token}
                        balance={getTokenBalance(token)}
                        onSelect={handleTokenSelect}
                        isSelected={selectedToken?.address === token.address}
                      />
                    ))}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

// Token List Item Component
interface TokenListItemProps {
  token: Token
  balance: string
  onSelect: (token: Token) => void
  isSelected: boolean
}

function TokenListItem({ token, balance, onSelect, isSelected }: TokenListItemProps) {
  const formatBalance = (balance: string, decimals: number): string => {
    try {
      const num = parseFloat(balance) / Math.pow(10, decimals)
      if (num === 0) return '0'
      if (num < 0.001) return '<0.001'
      if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
      if (num >= 1000) return `${(num / 1000).toFixed(2)}K`
      return num.toFixed(Math.max(0, 6 - Math.floor(num).toString().length))
    } catch {
      return '0'
    }
  }

  const isPopularToken = RECOMMENDED_TOKENS.includes(token.address)
  const hasBalance = parseFloat(balance) > 0

  return (
    <button
      onClick={() => onSelect(token)}
      className="group relative w-full flex items-center justify-between p-4 transition-all duration-200 hover:translate-x-1"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, rgba(162, 89, 250, 0.2) 0%, rgba(162, 89, 250, 0.1) 100%)`
          : hasBalance
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
          : 'transparent',
        borderLeft: isSelected
          ? '3px solid rgba(162, 89, 250, 0.6)'
          : hasBalance
          ? '3px solid rgba(16, 185, 129, 0.4)'
          : '2px solid transparent',
        backdropFilter: 'blur(10px)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isSelected
          ? `linear-gradient(135deg, rgba(162, 89, 250, 0.25) 0%, rgba(162, 89, 250, 0.15) 100%)`
          : `linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isSelected
          ? `linear-gradient(135deg, rgba(162, 89, 250, 0.2) 0%, rgba(162, 89, 250, 0.1) 100%)`
          : hasBalance
          ? `linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)`
          : 'transparent'
      }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-purple-500 to-purple-600 opacity-60" />
      )}

      <div className="flex items-center gap-3 flex-1">
        <div className="relative">
          <TokenIcon
            symbol={token.symbol}
            mint={token.address}
            logoURI={token.logoURI}
            size={36}
          />
          {/* Icon glow effect */}
          <div
            className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity"
            style={{
              background: isSelected
                ? 'radial-gradient(circle, rgba(162, 89, 250, 0.5) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)'
            }}
          />
          {/* Selection checkmark */}
          {isSelected && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-start flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-bold text-white/95 group-hover:text-white"
              style={{
                fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '0.025em'
              }}
            >
              {token.symbol}
            </span>
            {/* Popular token badge */}
            {isPopularToken && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                <StarIcon className="h-2.5 w-2.5 text-yellow-400" />
                <span className="text-xs font-medium text-yellow-400">Popular</span>
              </div>
            )}
          </div>
          <span
            className="text-xs font-medium text-gray-400/80 group-hover:text-gray-300"
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              letterSpacing: '0.025em'
            }}
          >
            {token.name}
          </span>
        </div>
      </div>
      <div className="text-right relative">
        <div
          className="font-bold text-white/90 group-hover:text-white mb-1"
          style={{
            fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.01em'
          }}
        >
          {formatBalance(balance, token.decimals)}
        </div>
        {/* Balance indicator */}
        {hasBalance && (
          <div className="flex items-center justify-end gap-1">
            <WalletIcon className="h-3 w-3 text-green-400" />
            <span className="text-xs text-green-400 font-medium">Has Balance</span>
          </div>
        )}
      </div>
    </button>
  )
}
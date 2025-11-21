'use client'

import { useState, Fragment, useMemo, useEffect } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Token } from '@/types/token'
import { TokenIcon } from '@/components/TokenIcon'

interface TokenSelectorProps {
  selectedToken: Token | null
  onTokenChange: (token: Token) => void
  tokens: Token[]
  disabled?: boolean
  balances?: Map<string, string>
  privacyMode?: boolean
  showConfidentialIndicator?: boolean
}

const JUPITER_SEARCH_API = 'https://lite-api.jup.ag/tokens/v2/search'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Token[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Local state to prevent controlled/uncontrolled switching
  const [internalSelectedToken, setInternalSelectedToken] = useState<Token | undefined>(undefined)

  // Update internal state when external selectedToken changes
  useEffect(() => {
    if (selectedToken && selectedToken !== internalSelectedToken) {
      setInternalSelectedToken(selectedToken)
    } else if (!selectedToken && tokens.length > 0 && !internalSelectedToken) {
      setInternalSelectedToken(tokens[0] || undefined)
    }
  }, [selectedToken, tokens, internalSelectedToken])

  // Search tokens from Jupiter API
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const searchTimer = setTimeout(async () => {
      setIsSearching(true)
      try {
        // Try the search API first
        const response = await fetch(`${JUPITER_SEARCH_API}?query=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Accept': 'application/json',
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Jupiter search results:', data)

          if (Array.isArray(data) && data.length > 0) {
            const jupiterTokens: Token[] = data.slice(0, 20).map((t: any) => ({
              address: t.id || t.address || t.mint,
              chainId: 101,
              decimals: t.decimals || 9, // Default to 9 if decimals not provided
              name: t.name || 'Unknown Token',
              symbol: t.symbol || 'UNKNOWN',
              logoURI: t.icon || t.logoURI || t.image,
              tags: t.tags || [],
              isConfidentialSupported: false, // Search results don't support confidential by default
              isNative: (t.id || t.address || t.mint) === 'So11111111111111111111111111111111111111112',
              addressable: true,
            })).filter(t => t.symbol && t.name && t.address) // Filter out invalid tokens

            console.log('Parsed Jupiter tokens:', jupiterTokens.map(t => ({ symbol: t.symbol, address: t.address })))
            setSearchResults(jupiterTokens)
          } else {
            setSearchResults([])
          }
        } else {
          console.warn('Jupiter API error:', response.status, 'trying fallback...')
          setSearchResults([])
        }
      } catch (error) {
        console.error('Token search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(searchTimer)
  }, [searchQuery])

  const { tokensWithBalance, tokensWithoutBalance } = useMemo(() => {
    let tokensToFilter = tokens

    if (searchResults.length > 0) {
      tokensToFilter = searchResults
    } else if (searchQuery) {
      const query = searchQuery.toLowerCase()
      tokensToFilter = tokens.filter(
        token =>
          token.symbol.toLowerCase().includes(query) ||
          token.name.toLowerCase().includes(query) ||
          token.address.toLowerCase().includes(query)
      )
    }

    // Split into tokens with/without balance
    const withBalance = balances ? tokensToFilter.filter(t => {
      try {
        const bal = balances.get(t.address)
        return bal && parseFloat(bal) > 0
      } catch {
        return false
      }
    }) : []

    const withoutBalance = balances ? tokensToFilter.filter(t => {
      try {
        const bal = balances.get(t.address)
        return !bal || parseFloat(bal) === 0
      } catch {
        return true
      }
    }) : tokensToFilter

    return {
      tokensWithBalance: withBalance,
      tokensWithoutBalance: withoutBalance
    }
  }, [tokens, searchQuery, searchResults, balances || new Map()])

  const getTokenBalance = (token: Token): string => {
    if (!balances) return '0'
    const balance = balances.get(token.address)
    return balance || '0'
  }

  const formatBalance = (balance: string, decimals: number): string => {
    const amount = parseFloat(balance) / Math.pow(10, decimals)
    if (amount === 0) return '0'
    if (amount < 0.001) return '<0.001'
    if (amount < 1) return amount.toFixed(4)
    if (amount < 1000) return amount.toFixed(2)
    return amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  const handleTokenChange = (token: Token) => {
    setInternalSelectedToken(token)
    onTokenChange(token)
  }

  return (
    <Listbox
      value={internalSelectedToken}
      onChange={handleTokenChange}
      disabled={disabled}
    >
      <div className="relative">
        <Listbox.Button
          className="flex items-center justify-between gap-3 px-3 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] h-12 rounded-xl"
          style={{
            background: 'rgba(30, 30, 45, 0.9)',
            border: '1px solid rgba(162, 89, 250, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1">
            {(() => {
              const displayToken = internalSelectedToken || selectedToken || tokens[0]
              if (!displayToken) return null
              return (
                <>
                  <TokenIcon
                    symbol={displayToken.symbol}
                    mint={displayToken.address}
                    logoURI={displayToken.logoURI}
                    size={36}
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className="font-bold"
                      style={{
                        color: 'var(--wave-text)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}
                    >
                      {displayToken.symbol}
                    </span>
                    {/* No PRIVATE badge for normal tokens - only show for wrapped confidential tokens */}
                  </div>
                </>
              )
            })()}
          </div>
          <ChevronDownIcon
            className="h-4 w-4 flex-shrink-0 transition-transform duration-200 ui-open:rotate-180"
            style={{ color: 'rgba(162, 89, 250, 0.8)' }}
          />
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          enter="transition ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          afterLeave={() => setSearchQuery('')}
        >
          <Listbox.Options
            className="absolute right-0 top-full z-[9999] mt-2 w-72 max-h-[400px] overflow-y-auto"
            style={{
              background: 'rgb(30, 30, 45)',
              border: '1px solid rgba(162, 89, 250, 0.15)',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(162, 89, 250, 0.1)',
            }}
          >
            {/* Search Input */}
            <div className="p-3 sticky top-0 z-10" style={{
              background: 'rgb(25, 25, 40)',
              borderBottom: '1px solid rgba(162, 89, 250, 0.1)'
            }}>
              <div className="relative">
                <MagnifyingGlassIcon
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: 'rgba(162, 89, 250, 0.6)' }}
                />
                <input
                  type="text"
                  placeholder="Search name or paste address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                  style={{
                    background: 'rgb(15, 15, 25)',
                    border: '1px solid rgba(162, 89, 250, 0.2)',
                    color: 'rgb(229, 231, 235)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(162, 89, 250, 0.4)';
                    e.currentTarget.style.boxShadow = '0 0 0 1px rgba(162, 89, 250, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(162, 89, 250, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>

            {/* Token List */}
            <div className="py-2">
              {isSearching && (
                <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--wave-purple)' }}>
                  <div className="animate-pulse">Searching tokens...</div>
                </div>
              )}

              {!isSearching && tokensWithBalance.length === 0 && tokensWithoutBalance.length === 0 && (
                <div className="px-4 py-8 text-center text-sm opacity-50" style={{ color: 'var(--wave-text)' }}>
                  No tokens found
                </div>
              )}

              {/* Tokens with balance */}
              {!isSearching && tokensWithBalance.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-bold opacity-50" style={{ color: 'var(--wave-text)' }}>
                    YOUR TOKENS
                  </div>
                  {tokensWithBalance.map((token) => {
                    const tokenBalance = balances?.get(token.address)
                    const balance = tokenBalance ? formatBalance(tokenBalance, token.decimals || 9) : '0'

                    return (
                      <Listbox.Option
                        key={`wallet-${token.address}`}
                        value={token}
                      >
                        {({ active, selected }) => (
                          <div
                            className="cursor-pointer select-none px-3 py-2 transition-all duration-150"
                            style={{
                              background: selected
                                ? 'rgba(162, 89, 250, 0.1)'
                                : active
                                ? 'rgba(162, 89, 250, 0.05)'
                                : 'transparent',
                              borderBottom: selected
                                ? '1px solid rgba(162, 89, 250, 0.3)'
                                : '1px solid transparent',
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <TokenIcon
                                  symbol={token.symbol}
                                  mint={token.address}
                                  logoURI={token.logoURI}
                                  size={32}
                                />
                                <div className="flex flex-col min-w-0">
                                  <span
                                    className="font-medium"
                                    style={{
                                      color: selected ? 'var(--wave-purple)' : 'rgb(229, 231, 235)',
                                      fontFamily: 'Inter, system-ui, sans-serif',
                                      fontSize: '0.875rem',
                                      fontWeight: 500
                                    }}
                                  >
                                    {token.symbol}
                                  </span>
                                  <span
                                    className="text-xs"
                                    style={{
                                      color: 'rgb(156, 163, 175)',
                                      fontFamily: 'Inter, system-ui, sans-serif',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    {token.name}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {token.symbol.startsWith('c') && (
                                  <div
                                    className="px-1.5 py-0.5 rounded text-xs font-medium"
                                    style={{
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      color: 'rgb(34, 197, 94)',
                                      border: '1px solid rgba(16, 185, 129, 0.2)',
                                      fontFamily: 'Inter, system-ui, sans-serif',
                                      fontSize: '0.625rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    🔒
                                  </div>
                                )}
                                {tokenBalance && parseFloat(tokenBalance) > 0 && (
                                  <span
                                    style={{
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      color: 'rgb(34, 197, 94)',
                                      fontFamily: 'Inter, system-ui, sans-serif',
                                      fontSize: '0.75rem',
                                      fontWeight: 500,
                                      padding: '2px 6px',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    {balance}
                                  </span>
                                )}
                                {selected && (
                                  <svg
                                    className="w-4 h-4 text-green-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ strokeWidth: '3px' }}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Listbox.Option>
                    )
                  })}
                </div>
              )}

              {/* Tokens without balance */}
              {!isSearching && tokensWithoutBalance.length > 0 && (
                <>
                  {tokensWithBalance.length > 0 && (
                    <div
                      className="mx-4 my-3"
                      style={{
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(162, 89, 250, 0.3), transparent)'
                      }}
                    />
                  )}
                  <div className="px-4 py-2 text-xs font-bold opacity-50" style={{ color: 'var(--wave-text)' }}>
                    OTHER TOKENS
                  </div>
                  {tokensWithoutBalance.slice(0, 20).map((token) => (
                    <Listbox.Option
                      key={`other-${token.address}`}
                      value={token}
                    >
                      {({ active, selected }) => (
                        <div
                          className="cursor-pointer select-none px-3 py-2 transition-all duration-150"
                          style={{
                            background: selected
                              ? 'rgba(162, 89, 250, 0.1)'
                              : active
                              ? 'rgba(162, 89, 250, 0.05)'
                              : 'transparent',
                            borderBottom: selected
                              ? '1px solid rgba(162, 89, 250, 0.3)'
                              : '1px solid transparent',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <TokenIcon
                                symbol={token.symbol}
                                mint={token.address}
                                logoURI={token.logoURI}
                                size={32}
                              />
                              <div className="flex flex-col min-w-0">
                                <span
                                  className="font-medium"
                                  style={{
                                    color: selected ? 'var(--wave-purple)' : 'rgb(229, 231, 235)',
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    fontSize: '0.875rem',
                                    fontWeight: 500
                                  }}
                                >
                                  {token.symbol}
                                </span>
                                <span
                                  className="text-xs"
                                  style={{
                                    color: 'rgb(156, 163, 175)',
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {token.name}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {token.symbol.startsWith('c') && (
                                <div
                                  className="px-1.5 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: 'rgb(34, 197, 94)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    fontSize: '0.625rem',
                                    fontWeight: 600
                                  }}
                                >
                                  🔒
                                </div>
                              )}
                              {selected && (
                                <svg
                                  className="w-4 h-4 text-green-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  style={{ strokeWidth: '3px' }}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </>
              )}
            </div>
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}
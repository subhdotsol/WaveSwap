'use client'

import { useState, Fragment, useMemo, useEffect } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronDownIcon, CheckIcon, MagnifyingGlassIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { Token } from '@/types/token'
import { TokenIcon } from '@/components/TokenIcon'

interface TokenSelectorProps {
  selectedToken: Token | null
  onTokenChange: (token: Token) => void
  tokens: Token[]
  disabled?: boolean
  privacyMode?: boolean
  showConfidentialIndicator?: boolean
  balances?: Map<string, string>
}

const JUPITER_SEARCH_API = '/api/v1/jupiter/tokens/v2/search'
const JUPITER_CDN = 'https://img-cdn.jup.ag/tokens'

export function TokenSelector({
  selectedToken,
  onTokenChange,
  tokens,
  disabled = false,
  privacyMode = false,
  showConfidentialIndicator = false,
  balances
}: TokenSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Token[]>([])
  const [isSearching, setIsSearching] = useState(false)

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
        const response = await fetch(`${JUPITER_SEARCH_API}?query=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          console.log('Jupiter search results:', data)
          
          if (Array.isArray(data) && data.length > 0) {
            const jupiterTokens: Token[] = data.slice(0, 30).map((t: any) => ({
              address: t.address || t.mint,
              chainId: 101,
              decimals: t.decimals,
              name: t.name,
              symbol: t.symbol,
              // Use Jupiter CDN with fallbacks
              logoURI: t.logoURI || t.image || `${JUPITER_CDN}/${t.symbol}.svg`,
              tags: t.tags || [],
              isConfidentialSupported: ['SOL', 'USDC', 'USDT', 'mSOL', 'RAY', 'BONK', 'WIF'].includes(t.symbol),
              isNative: (t.address || t.mint) === 'So11111111111111111111111111111111111111112',
              addressable: true,
            }))
            console.log('Parsed Jupiter tokens:', jupiterTokens.map(t => ({ symbol: t.symbol, logo: t.logoURI })))
            setSearchResults(jupiterTokens)
          } else {
            setSearchResults([])
          }
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
      const bal = balances.get(t.address)
      return bal && parseFloat(bal) > 0
    }) : []

    const withoutBalance = balances ? tokensToFilter.filter(t => {
      const bal = balances.get(t.address)
      return !bal || parseFloat(bal) === 0
    }) : tokensToFilter

    return {
      tokensWithBalance: withBalance,
      tokensWithoutBalance: withoutBalance
    }
  }, [tokens, searchQuery, searchResults, balances])

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

  const hasBalance = (token: Token): boolean => {
    if (!balances) return false
    const balance = balances.get(token.address)
    return balance ? parseFloat(balance) > 0 : false
  }

  return (
    <Listbox
      value={selectedToken || tokens[0]}
      onChange={onTokenChange}
      disabled={disabled}
    >
      <div className="relative">
        <Listbox.Button
          className="glass-card flex items-center gap-3 px-4 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px] h-14"
          style={{
            background: 'rgba(20, 20, 35, 0.8)',
            border: '1px solid rgba(162, 89, 250, 0.2)',
            backdropFilter: 'blur(20px)',
          }}
          disabled={disabled}
        >
          <div className="flex items-center gap-3 flex-1">
            {(() => {
              const displayToken = selectedToken || tokens[0]
              if (!displayToken) return null
              return (
                <>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.9), rgba(30, 30, 50, 0.9))',
                      borderColor: 'rgba(162, 89, 250, 0.3)',
                    }}
                  >
                    <TokenIcon
                      symbol={displayToken.symbol}
                      mint={displayToken.address}
                      logoURI={displayToken.logoURI}
                      size={40}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span
                      className="text-base font-bold leading-tight"
                      style={{
                        color: 'var(--wave-text)',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 700,
                        letterSpacing: '0.02em'
                      }}
                    >
                      {displayToken.symbol}
                    </span>
                    {balances && (
                      <span
                        className="text-xs opacity-70"
                        style={{
                          color: 'var(--wave-text)',
                          fontFamily: 'Rajdhani, sans-serif'
                        }}
                      >
                        Balance: {(() => {
                          const balance = balances.get(displayToken.address)
                          const amount = balance ? parseFloat(balance) / Math.pow(10, displayToken.decimals) : 0
                          if (amount === 0) return '0'
                          if (amount < 0.001) return '<0.001'
                          if (amount < 1) return amount.toFixed(4)
                          if (amount < 1000) return amount.toFixed(2)
                          return amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        })()}
                      </span>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
          <ChevronDownIcon
            className="h-5 w-5 flex-shrink-0 transition-transform duration-200 ui-open:rotate-180"
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
            className="absolute right-0 top-full z-50 mt-2 w-80 max-h-[420px] overflow-y-auto"
            style={{
              background: 'rgba(15, 15, 25, 0.98)',
              backdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(162, 89, 250, 0.2)',
              borderRadius: '1rem',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(162, 89, 250, 0.3)',
              maxHeight: '420px'
            }}
          >
            {/* Search Input */}
            <div className="p-4 sticky top-0 z-10" style={{ 
              background: 'rgba(15, 15, 25, 0.95)',
              borderBottom: '1px solid rgba(162, 89, 250, 0.15)' 
            }}>
              <div className="relative">
                <MagnifyingGlassIcon 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                  style={{ color: 'var(--wave-purple)' }}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(25, 25, 40, 0.6)',
                    border: '1px solid rgba(162, 89, 250, 0.2)',
                    color: 'var(--wave-text)',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(162, 89, 250, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(162, 89, 250, 0.2)';
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
              
              {!isSearching && tokensWithBalance.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-bold opacity-50" style={{ color: 'var(--wave-text)' }}>
                    YOUR TOKENS
                  </div>
                  {tokensWithBalance.map((token) => {
                    const tokenBalance = balances?.get(token.address)
                    const balance = tokenBalance ? formatBalance(tokenBalance, token.decimals) : '0'
                    
                    return (
                      <Listbox.Option
                        key={`wallet-${token.address}`}
                        value={token}
                      >
                    {({ active, selected }) => {
                      const inWallet = hasBalance(token)
                      
                      return (
                        <div
                          className="cursor-pointer select-none mx-3 my-1 px-4 py-3 rounded-xl transition-all duration-200"
                          style={{
                            background: selected
                              ? 'rgba(162, 89, 250, 0.15)'
                              : active
                              ? 'rgba(162, 89, 250, 0.08)'
                              : 'transparent',
                            border: selected
                              ? '1px solid rgba(162, 89, 250, 0.4)'
                              : '1px solid rgba(162, 89, 250, 0.1)',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            {/* Left: Icon + Token Info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Token Icon */}
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.9), rgba(20, 20, 35, 0.9))',
                                  borderColor: selected ? 'rgba(162, 89, 250, 0.4)' : 'rgba(162, 89, 250, 0.2)',
                                  borderWidth: '1px'
                                }}
                              >
                              <div 
                                className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                                style={{ background: '#000' }}
                              >
                                {token.logoURI ? (
                                  <img
                                    src={token.logoURI}
                                    alt={token.symbol}
                                    className="w-full h-full object-contain"
                                    style={{ padding: '3px' }}
                                    crossOrigin="anonymous"
                                    onLoad={(e) => {
                                      e.currentTarget.style.opacity = '1'
                                    }}
                                    onError={(e) => {
                                      const parent = e.currentTarget.parentElement
                                      if (parent) {
                                        parent.innerHTML = `<span style="font-size:1.125rem;font-weight:900;color:var(--wave-purple);font-family:Orbitron,sans-serif">${token.symbol.charAt(0)}</span>`
                                      }
                                    }}
                                  />
                                ) : (
                                  <span 
                                    className="text-lg font-black"
                                    style={{ 
                                      color: 'var(--wave-purple)',
                                      fontFamily: 'Orbitron, sans-serif'
                                    }}
                                  >
                                    {token.symbol.charAt(0)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Token Info */}
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="font-black text-base truncate"
                                  style={{ 
                                    color: selected ? 'var(--wave-purple)' : 'var(--wave-text)',
                                    fontFamily: 'Orbitron, sans-serif',
                                    letterSpacing: '0.05em'
                                  }}
                                >
                                  {token.symbol}
                                </span>
                                {showConfidentialIndicator && privacyMode && token.isConfidentialSupported && (
                                  <ShieldCheckIcon 
                                    className="h-3.5 w-3.5 flex-shrink-0" 
                                    style={{ color: 'var(--wave-purple)' }}
                                    title="Confidential" 
                                  />
                                )}
                              </div>
                              <div 
                                className="text-xs truncate"
                                style={{ 
                                  color: 'var(--wave-text)',
                                  opacity: 0.6
                                }}
                              >
                                {token.name}
                              </div>
                            </div>
                          </div>

                              {/* Balance & Checkmark */}
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div 
                                  className="text-sm font-bold"
                                  style={{ color: 'var(--wave-purple)' }}
                                >
                                  {balance}
                                </div>
                                {selected && (
                                  <CheckIcon className="h-5 w-5" style={{ color: 'var(--wave-purple)' }} />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      }}
                    </Listbox.Option>
                  )
                })}
                </>
              )}
              
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
                  {tokensWithoutBalance.slice(0, 20).map((token) => {
                    return (
                      <Listbox.Option
                        key={`other-${token.address}`}
                        value={token}
                      >
                        {({ active, selected }) => (
                          <div
                            className="cursor-pointer select-none px-4 py-3.5 mx-2 my-0.5 rounded-xl transition-all duration-150"
                            style={{
                              background: selected 
                                ? 'rgba(162, 89, 250, 0.25)' 
                                : active 
                                ? 'rgba(162, 89, 250, 0.12)' 
                                : 'transparent',
                              border: selected 
                                ? '1px solid rgba(162, 89, 250, 0.6)'
                                : '1px solid transparent',
                              boxShadow: selected ? '0 0 20px rgba(162, 89, 250, 0.4)' : 'none'
                            }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div 
                                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{
                                    background: selected
                                      ? 'linear-gradient(135deg, var(--wave-purple), rgba(162, 89, 250, 0.5))'
                                      : 'rgba(30, 30, 45, 0.8)',
                                    border: '1px solid rgba(162, 89, 250, 0.25)',
                                    padding: '2px'
                                  }}
                                >
                                  <div 
                                    className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                                    style={{ background: '#000' }}
                                  >
                                    {token.logoURI ? (
                                      <img
                                        src={token.logoURI}
                                        alt={token.symbol}
                                        className="w-full h-full object-contain"
                                        crossOrigin="anonymous"
                                        onError={(e) => {
                                          const parent = e.currentTarget.parentElement
                                          if (parent) {
                                            parent.innerHTML = `<span style="font-size:1rem;font-weight:900;color:var(--wave-purple);font-family:Orbitron,sans-serif">${token.symbol.charAt(0)}</span>`
                                          }
                                        }}
                                      />
                                    ) : (
                                      <span 
                                        className="text-base font-black"
                                        style={{ color: 'var(--wave-purple)', fontFamily: 'Orbitron, sans-serif' }}
                                      >
                                        {token.symbol.charAt(0)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span 
                                    className="font-black text-base truncate"
                                    style={{ 
                                      color: selected ? 'var(--wave-purple)' : 'var(--wave-text)',
                                      fontFamily: 'Orbitron, sans-serif',
                                      letterSpacing: '0.05em'
                                    }}
                                  >
                                    {token.symbol}
                                  </span>
                                  <div className="text-xs opacity-50 truncate" style={{ color: 'var(--wave-text)' }}>
                                    {token.name}
                                  </div>
                                </div>
                              </div>
                              {selected && (
                                <CheckIcon className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--wave-purple)' }} />
                              )}
                            </div>
                          </div>
                        )}
                      </Listbox.Option>
                    )
                  })}
                </>
              )}
            </div>
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}
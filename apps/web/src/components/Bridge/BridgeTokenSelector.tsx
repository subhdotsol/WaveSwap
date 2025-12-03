'use client'

import { useState, Fragment, useMemo, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Token } from '@/types/token'
import { TokenIcon } from '@/components/TokenIcon'
import { useThemeConfig, createGlassStyles } from '@/lib/theme'

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

interface BridgeTokenSelectorProps {
  selectedToken: Token | null
  onTokenChange: (token: Token) => void
  tokens: Token[]
  sourceChain: string
  targetChain: string
  disabled?: boolean
  balances?: Map<string, string>
}

export function BridgeTokenSelector({
  selectedToken,
  onTokenChange,
  tokens,
  sourceChain,
  targetChain,
  disabled = false,
  balances
}: BridgeTokenSelectorProps) {
  const theme = useThemeConfig()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter tokens based on bridge route
  const filteredTokens = useMemo(() => {
    // For bridge, we only show specific tokens based on the route
    if (sourceChain === 'starknet' && targetChain === 'solana') {
      // StarkNet → Solana: Show SOL + PUMP
      return tokens.filter(token => ['SOL', 'PUMP'].includes(token.symbol))
    } else if (sourceChain === 'zec' && targetChain === 'solana') {
      // Zcash → Solana: Only show ZEC
      return tokens.filter(token => token.symbol === 'ZEC')
    } else if (sourceChain === 'solana' && targetChain === 'starknet') {
      // Solana → StarkNet: Show SOL + PUMP (wrapped on StarkNet)
      return tokens.filter(token => ['SOL', 'PUMP'].includes(token.symbol))
    } else if (sourceChain === 'solana' && targetChain === 'zec') {
      // Solana → Zcash: Only show ZEC (wrapped on Solana)
      return tokens.filter(token => token.symbol === 'ZEC')
    }
    // Default: return all tokens
    return tokens
  }, [tokens, sourceChain, targetChain])

  // Filter tokens by search query
  const searchedTokens = useMemo(() => {
    if (!searchQuery) return filteredTokens

    const query = searchQuery.toLowerCase()
    return filteredTokens.filter(token =>
      token.symbol.toLowerCase().includes(query) ||
      token.name.toLowerCase().includes(query) ||
      token.address.toLowerCase().includes(query)
    )
  }, [filteredTokens, searchQuery])

  // User tokens (with balance)
  const userTokens = useMemo(() => {
    const user: Token[] = []
    tokens.forEach(token => {
      if (balances?.get(token.address) && parseFloat(balances.get(token.address)!) > 0) {
        user.push(token)
      }
    })
    return user
  }, [tokens, balances])

  // Format balance display
  const formatBalance = useCallback((balance: string, decimals: number): string => {
    try {
      const bal = parseFloat(balance) || 0
      const formatted = bal / Math.pow(10, decimals)

      if (formatted === 0) return '0'
      if (formatted < 0.001) return '<0.001'
      if (formatted < 0.01) return formatted.toFixed(4)
      if (formatted < 1) return formatted.toFixed(2)
      if (formatted >= 1000) return formatted.toLocaleString(undefined, { maximumFractionDigits: 2 })

      return formatted.toFixed(2)
    } catch {
      return '0'
    }
  }, [])

  const handleTokenSelect = useCallback((token: Token) => {
    onTokenChange(token)
    setIsOpen(false)
    setSearchQuery('')
  }, [onTokenChange])

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className={`
            w-full px-4 py-3 rounded-xl font-medium transition-all duration-200
            flex items-center justify-between gap-2
            ${disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
            }
          `}
          style={{
            background: `
              linear-gradient(135deg,
                ${theme.colors.surface}ee 0%,
                ${theme.colors.surfaceHover}cc 50%,
                ${theme.colors.surface}ee 100%
              )
            `,
            border: `1px solid ${theme.colors.border}`,
            color: disabled ? theme.colors.textMuted : theme.colors.textPrimary,
            backdropFilter: 'blur(16px) saturate(1.5)',
            boxShadow: `0 4px 12px ${theme.colors.shadow}, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
          }}
        >
          <div className="flex items-center gap-3">
            <TokenIcon
              symbol={selectedToken?.symbol || ''}
              mint={selectedToken?.address || ''}
              logoURI={selectedToken?.logoURI}
              size={24}
            />
            <div className="text-left">
              <div className="font-bold" style={{ color: disabled ? theme.colors.textMuted : theme.colors.textPrimary }}>
                {selectedToken?.symbol || 'Select Token'}
              </div>
              {selectedToken && (
                <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                  {selectedToken.name}
                  {balances?.get(selectedToken.address) && (
                    <span className="ml-2">
                      Balance: {formatBalance(balances.get(selectedToken.address)!, selectedToken.decimals)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <ChevronDownIcon
            className={`w-5 h-5 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
            style={{ color: theme.colors.textSecondary }}
          />
        </button>
      </div>

      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={() => setIsOpen(false)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          </Transition.Child>

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
              className="fixed inset-0 mx-auto my-4 max-w-md w-full max-h-[80vh] overflow-hidden rounded-2xl"
              style={{
                background: `
                  linear-gradient(135deg,
                    ${theme.colors.surface}ee 0%,
                    ${theme.colors.surfaceHover}cc 25%,
                    ${theme.colors.surface}ee 50%,
                    ${theme.colors.surfaceHover}cc 75%,
                    ${theme.colors.surface}ee 100%
                  )
                `,
                border: `1px solid ${theme.colors.primary}15`,
                backdropFilter: 'blur(24px) saturate(1.8)',
                boxShadow: `
                  0 25px 50px -12px ${theme.colors.shadowHeavy},
                  0 12px 25px -4px ${theme.colors.primary}08
                `
              }}
            >
              <div className="flex items-center justify-between p-6 border-b"
                   style={{ borderColor: theme.colors.border }}>
                <h3 className="text-lg font-bold" style={{ color: theme.colors.textPrimary }}>
                  Select Token
                  <span className="text-sm font-normal ml-2" style={{ color: theme.colors.textMuted }}>
                    {sourceChain} → {targetChain}
                  </span>
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg transition-all duration-200 hover:scale-[1.05]"
                  style={{
                    background: `${theme.colors.surface}60`,
                    border: `1px solid ${theme.colors.border}`
                  }}
                >
                  <XMarkIcon className="w-5 h-5" style={{ color: theme.colors.textSecondary }} />
                </button>
              </div>

              <div className="p-4">
                {/* Search Bar */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                    style={{ color: theme.colors.textMuted }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tokens..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-transparent"
                    style={{
                      background: `${theme.colors.surface}40`,
                      border: `1px solid ${theme.colors.border}`,
                      color: theme.colors.textPrimary,
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.border
                    }}
                  />
                </div>
              </div>

              {/* User Tokens Section */}
              {userTokens.length > 0 && (
                <div className="px-6 pb-4">
                  <div className="text-sm font-medium mb-3" style={{ color: theme.colors.textSecondary }}>
                    Your Tokens
                  </div>
                  <div className="space-y-2">
                    {userTokens
                      .filter(token => searchedTokens.includes(token))
                      .map((token) => (
                        <button
                          key={token.address}
                          onClick={() => handleTokenSelect(token)}
                          className={`w-full p-3 rounded-xl transition-all duration-200 flex items-center gap-3 hover:scale-[1.02] ${
                            selectedToken?.address === token.address
                              ? `ring-2 ring-opacity-50`
                              : ''
                          }`}
                          style={{
                            background: selectedToken?.address === token.address
                              ? `${theme.colors.primary}20`
                              : `${theme.colors.surface}40`,
                            border: `1px solid ${
                              selectedToken?.address === token.address
                                ? theme.colors.primary
                                : theme.colors.border
                            }`
                          }}
                        >
                          <TokenIcon
                            symbol={token.symbol}
                            mint={token.address}
                            logoURI={token.logoURI}
                            size={32}
                          />
                          <div className="flex-1 text-left">
                            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                              {token.symbol}
                            </div>
                            <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                              {token.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                              {formatBalance(balances?.get(token.address) || '0', token.decimals)}
                            </div>
                            <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                              {token.symbol}
                            </div>
                          </div>
                          {selectedToken?.address === token.address && (
                            <CheckCircleIcon className="w-5 h-5" style={{ color: theme.colors.primary }} />
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Available Tokens Section */}
              {searchedTokens.length > 0 && (
                <div className="px-6 pb-6 max-h-96 overflow-y-auto">
                  {userTokens.length > 0 && (
                    <div className="text-sm font-medium mb-3" style={{ color: theme.colors.textSecondary }}>
                      Available Tokens
                    </div>
                  )}
                  <div className="space-y-2">
                    {searchedTokens
                      .filter(token => !userTokens.includes(token))
                      .map((token) => (
                        <button
                          key={token.address}
                          onClick={() => handleTokenSelect(token)}
                          className={`w-full p-3 rounded-xl transition-all duration-200 flex items-center gap-3 hover:scale-[1.02] ${
                            selectedToken?.address === token.address
                              ? `ring-2 ring-opacity-50`
                              : ''
                          }`}
                          style={{
                            background: selectedToken?.address === token.address
                              ? `${theme.colors.primary}20`
                              : `${theme.colors.surface}40`,
                            border: `1px solid ${
                              selectedToken?.address === token.address
                                ? theme.colors.primary
                                : theme.colors.border
                            }`
                          }}
                        >
                          <TokenIcon
                            symbol={token.symbol}
                            mint={token.address}
                            logoURI={token.logoURI}
                            size={32}
                          />
                          <div className="flex-1 text-left">
                            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                              {token.symbol}
                            </div>
                            <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                              {token.name}
                            </div>
                          </div>
                          {balances?.get(token.address) && (
                            <div className="text-right">
                              <div className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                {formatBalance(balances.get(token.address)!, token.decimals)}
                              </div>
                              <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                                {token.symbol}
                              </div>
                            </div>
                          )}
                          {selectedToken?.address === token.address && (
                            <CheckCircleIcon className="w-5 h-5" style={{ color: theme.colors.primary }} />
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchedTokens.length === 0 && (
                <div className="px-6 pb-6 text-center py-8">
                  <div style={{ color: theme.colors.textMuted }}>
                    No tokens found
                  </div>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  )
}
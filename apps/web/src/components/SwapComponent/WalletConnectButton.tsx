'use client'

import {
  useWallet
} from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import {
  WalletIcon,
  ChevronDownIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect, useRef, useMemo } from 'react'

export function WalletConnectButton() {
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet()
  const { setVisible } = useWalletModal()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debug wallet modal state
  console.log('Wallet button render - mounted:', mounted, 'connected:', connected, 'connecting:', connecting)

  // Better hydration handling
  useEffect(() => {
    setMounted(true)

    // Optional: Try to restore wallet connection on mount
    const handleWalletConnect = () => {
      // This will be handled by the wallet adapter's internal state
    }

    // Small delay to ensure proper hydration
    const timeoutId = setTimeout(() => {
      handleWalletConnect()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatAddress = useMemo(() => {
    if (!publicKey) return ''
    const address = publicKey.toString()
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }, [publicKey])

  const getWalletIcon = () => {
    if (wallet?.adapter.icon) {
      return (
        <img
          src={wallet.adapter.icon}
          alt={wallet.adapter.name}
          className="w-5 h-5 rounded"
        />
      )
    }
    return <WalletIcon className="w-5 h-5" />
  }

  const handleConnect = () => {
    console.log('Connect button clicked')
    try {
      // Instead of using modal, try direct wallet connection or show simple dropdown
      if (wallet?.adapter) {
        // If there's already a selected wallet, try to connect directly
        wallet.adapter.connect().catch(console.error)
      } else {
        // Fallback to modal
        setVisible(true)
        console.log('Modal visibility set to true')
      }
    } catch (error) {
      console.error('Error in wallet connection:', error)
      // Fallback to modal
      setVisible(true)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setIsOpen(false)
  }

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString())
      // You could add a toast notification here
    }
  }

  if (!mounted) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-200 border-0 flex items-center justify-center min-w-[140px] h-[48px] opacity-80">
        <div className="animate-pulse bg-white/20 rounded h-4 w-16"></div>
      </div>
    )
  }

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="group relative font-medium py-3 px-6 rounded-xl transition-all duration-300 border-0 flex items-center justify-center gap-2 min-w-[140px] h-[48px] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(59, 130, 246, 0.8) 0%,
              rgba(147, 51, 234, 0.8) 50%,
              rgba(59, 130, 246, 0.8) 100%
            ),
            radial-gradient(circle at 30% 30%,
              rgba(59, 130, 246, 0.3) 0%,
              transparent 50%
            )
          `,
          border: '1px solid rgba(59, 130, 246, 0.3)',
          backdropFilter: 'blur(16px) saturate(1.8)',
          boxShadow: `
            0 8px 32px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 0 0 1px rgba(147, 51, 234, 0.1)
          `,
          fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 600,
          letterSpacing: '0.025em'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `
            linear-gradient(135deg,
              rgba(59, 130, 246, 0.9) 0%,
              rgba(147, 51, 234, 0.9) 50%,
              rgba(59, 130, 246, 0.9) 100%
            ),
            radial-gradient(circle at 30% 30%,
              rgba(59, 130, 246, 0.4) 0%,
              transparent 50%
            )
          `
          e.currentTarget.style.boxShadow = `
            0 12px 40px rgba(59, 130, 246, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 0 0 1px rgba(147, 51, 234, 0.2)
          `
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `
            linear-gradient(135deg,
              rgba(59, 130, 246, 0.8) 0%,
              rgba(147, 51, 234, 0.8) 50%,
              rgba(59, 130, 246, 0.8) 100%
            ),
            radial-gradient(circle at 30% 30%,
              rgba(59, 130, 246, 0.3) 0%,
              transparent 50%
            )
          `
          e.currentTarget.style.boxShadow = `
            0 8px 32px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 0 0 1px rgba(147, 51, 234, 0.1)
          `
        }}
      >
        {connecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            Connecting...
          </>
        ) : (
          <>
            <WalletIcon className="w-5 h-5" />
            Connect Wallet
          </>
        )}
      </button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group font-medium py-3 px-6 rounded-xl transition-all duration-300 border-0 flex items-center gap-3 min-w-[140px] h-[48px] overflow-hidden z-10"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(16, 185, 129, 0.8) 0%,
              rgba(20, 184, 166, 0.8) 50%,
              rgba(16, 185, 129, 0.8) 100%
            ),
            radial-gradient(circle at 30% 30%,
              rgba(16, 185, 129, 0.3) 0%,
              transparent 50%
            )
          `,
          border: '1px solid rgba(16, 185, 129, 0.3)',
          backdropFilter: 'blur(16px) saturate(1.8)',
          boxShadow: `
            0 8px 32px rgba(16, 185, 129, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 0 0 1px rgba(20, 184, 166, 0.1)
          `,
          fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 600,
          letterSpacing: '0.025em'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `
            linear-gradient(135deg,
              rgba(16, 185, 129, 0.9) 0%,
              rgba(20, 184, 166, 0.9) 50%,
              rgba(16, 185, 129, 0.9) 100%
            ),
            radial-gradient(circle at 30% 30%,
              rgba(16, 185, 129, 0.4) 0%,
              transparent 50%
            )
          `
          e.currentTarget.style.boxShadow = `
            0 12px 40px rgba(16, 185, 129, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 0 0 1px rgba(20, 184, 166, 0.2)
          `
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `
            linear-gradient(135deg,
              rgba(16, 185, 129, 0.8) 0%,
              rgba(20, 184, 166, 0.8) 50%,
              rgba(16, 185, 129, 0.8) 100%
            ),
            radial-gradient(circle at 30% 30%,
              rgba(16, 185, 129, 0.3) 0%,
              transparent 50%
            )
          `
          e.currentTarget.style.boxShadow = `
            0 8px 32px rgba(16, 185, 129, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 0 0 1px rgba(20, 184, 166, 0.1)
          `
        }}
      >
        {getWalletIcon()}
        <span className="font-medium">{formatAddress}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden"
          style={{
            background: `
              linear-gradient(135deg,
                rgba(30, 30, 45, 0.95) 0%,
                rgba(45, 45, 65, 0.9) 25%,
                rgba(30, 30, 45, 0.95) 50%,
                rgba(45, 45, 65, 0.9) 75%,
                rgba(30, 30, 45, 0.95) 100%
              ),
              radial-gradient(circle at 25% 25%,
                rgba(16, 185, 129, 0.05) 0%,
                transparent 50%
              )
            `,
            border: '1px solid rgba(16, 185, 129, 0.15)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            boxShadow: `
              0 20px 60px rgba(0, 0, 0, 0.4),
              0 8px 24px rgba(16, 185, 129, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2)
            `,
            zIndex: 50
          }}
        >
          {/* Noise grain overlay */}
          <div
            className="absolute inset-0 opacity-4 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='150' height='150' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3Cfilter%3E%3Crect width='150' height='150' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              filter: 'contrast(1.3) brightness(1.1)'
            }}
          />
          {/* Wallet Header */}
          <div className="relative z-10 p-4 border-b border-gray-700/50" style={{
            background: `
              linear-gradient(135deg,
                rgba(16, 185, 129, 0.1) 0%,
                rgba(20, 184, 166, 0.05) 50%,
                rgba(16, 185, 129, 0.1) 100%
              )
            `,
            backdropFilter: 'blur(12px) saturate(1.5)'
          }}>
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2" style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <CheckCircleIcon className="w-5 h-5 text-emerald-400" style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white" style={{
                  fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
                  fontWeight: 600,
                  letterSpacing: '0.025em'
                }}>Wallet Connected</p>
                <p className="text-xs text-gray-400" style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                }}>{wallet?.adapter.name || 'Unknown Wallet'}</p>
              </div>
              {getWalletIcon()}
            </div>
          </div>

          {/* Address Section */}
          <div className="relative z-10 p-4 border-b border-gray-700/50">
            <div className="rounded-xl p-3" style={{
              background: 'rgba(30, 30, 45, 0.6)',
              border: '1px solid rgba(156, 163, 175, 0.1)',
              backdropFilter: 'blur(8px) saturate(1.2)'
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1" style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    fontWeight: 500
                  }}>Your Address</p>
                  <p className="text-sm font-mono text-white" style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontWeight: 600,
                    letterSpacing: '0.025em'
                  }}>{formatAddress}</p>
                  <p className="text-xs text-gray-500 mt-1" style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: '0.7rem'
                  }}>{publicKey?.toString()}</p>
                </div>
                <button
                  onClick={copyAddress}
                  className="p-2 rounded-lg transition-all duration-300 hover:scale-105"
                  style={{
                    color: 'rgba(156, 163, 175, 0.8)',
                    background: 'rgba(156, 163, 175, 0.1)',
                    border: '1px solid rgba(156, 163, 175, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
                    e.currentTarget.style.background = 'rgba(156, 163, 175, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(156, 163, 175, 0.8)'
                    e.currentTarget.style.background = 'rgba(156, 163, 175, 0.1)'
                  }}
                  title="Copy address"
                >
                  <UserIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-2">
            <button
              onClick={() => window.open(`https://solscan.io/account/${publicKey?.toString()}`, '_blank')}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800/60 hover:text-white rounded-xl transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">View on Solscan</p>
                <p className="text-xs text-gray-500">Check transaction history</p>
              </div>
            </button>

            <div className="border-t border-gray-700/50 my-2"></div>

            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Disconnect Wallet</p>
                <p className="text-xs text-red-300/70">Sign out from this wallet</p>
              </div>
            </button>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-gray-800/40 border-t border-gray-700/50">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                Never share your private keys or seed phrase with anyone.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
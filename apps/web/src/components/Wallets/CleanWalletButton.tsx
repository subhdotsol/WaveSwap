'use client'

import { Wallet, ChevronDown, Check, Copy, LogOut, Settings } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@/contexts/WalletModalContext'
import { useState, useRef, useEffect } from 'react'
import { useThemeConfig, createGlassStyles, createButtonStyles } from '@/lib/theme'

export function CleanWalletButton() {
  const { publicKey, disconnect, connecting, wallet } = useWallet()
  const { openModal } = useWalletModal()
  const theme = useThemeConfig()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setShowDropdown(false)
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }

  const copyAddress = async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toString())
      } catch (error) {
        console.error('Failed to copy address:', error)
      }
    }
  }

  const getTruncatedAddress = () => {
    if (!publicKey) return ''
    const address = publicKey.toString()
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
    return undefined
  }, [showDropdown])

  const getButtonText = () => {
    if (connecting) return 'Connecting...'
    if (publicKey) {
      const address = publicKey.toString()
      return `${address.slice(0, 4)}...${address.slice(-4)}`
    }
    return 'Connect Wallet'
  }

  const handleDropdownClick = (action: () => void) => {
    action()
    setShowDropdown(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (publicKey) {
            setShowDropdown(!showDropdown)
          } else {
            openModal()
          }
        }}
      className="relative flex items-center gap-3 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] z-10 overflow-hidden"
      style={{
        background: publicKey
          ? `
            linear-gradient(135deg,
              ${theme.colors.success}20 0%,
              ${theme.colors.success}10 50%,
              ${theme.colors.success}20 100%
            ),
            radial-gradient(circle at 30% 30%,
              ${theme.colors.success}15 0%,
              transparent 50%
            )
          `
          : createGlassStyles(theme).background as string,
        border: publicKey
          ? `1px solid ${theme.colors.success}30`
          : `1px solid ${theme.colors.primary}10`,
        backdropFilter: 'blur(20px) saturate(1.8)',
        boxShadow: publicKey
          ? `0 8px 24px ${theme.colors.success}20, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
          : `0 8px 32px ${theme.colors.shadow}, inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px ${theme.colors.primary}05`,
        fontFamily: 'var(--font-helvetica)',
        fontWeight: 600,
        letterSpacing: '0.025em'
      }}
      onMouseEnter={(e) => {
        if (!publicKey) {
          e.currentTarget.style.background = `
            linear-gradient(135deg,
              rgba(33, 188, 255, 0.15) 0%,
              rgba(33, 188, 255, 0.08) 50%,
              rgba(33, 188, 255, 0.15) 100%
            ),
            radial-gradient(circle at 30% 30%,
              rgba(33, 188, 255, 0.1) 0%,
              transparent 50%
            )
          `
          e.currentTarget.style.borderColor = 'rgba(33, 188, 255, 0.3)'
          e.currentTarget.style.boxShadow = `
            0 12px 40px rgba(33, 188, 255, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          `
        } else {
          e.currentTarget.style.boxShadow = `
            0 12px 40px rgba(34, 197, 94, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.25)
          `
        }
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        if (!publicKey) {
          e.currentTarget.style.background = `
            linear-gradient(135deg,
              rgba(30, 30, 45, 0.6) 0%,
              rgba(45, 45, 65, 0.4) 50%,
              rgba(30, 30, 45, 0.6) 100%
            ),
            radial-gradient(circle at 50% 50%,
              rgba(33, 188, 255, 0.02) 0%,
              transparent 50%
            )
          `
          e.currentTarget.style.borderColor = 'rgba(33, 188, 255, 0.1)'
          e.currentTarget.style.boxShadow = `
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(33, 188, 255, 0.05)
          `
        } else {
          e.currentTarget.style.boxShadow = `
            0 8px 24px rgba(34, 197, 94, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)
          `
        }
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Noise grain overlay */}
      <div
        className="absolute inset-0 opacity-3 pointer-events-none rounded-xl"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3Cfilter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          filter: 'contrast(1.3) brightness(1.1)'
        }}
      />
      {/* Button Content */}
      <div className="relative z-10 flex items-center gap-3">
        {connecting ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : publicKey ? (
          <Check className="w-4 h-4" style={{
            color: 'rgba(34, 197, 94, 0.9)',
            filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.4))'
          }} />
        ) : (
          <Wallet className="w-4 h-4" style={{
            color: 'rgba(33, 188, 255, 0.9)',
            filter: 'drop-shadow(0 0 8px rgba(33, 188, 255, 0.4))'
          }} />
        )}

        <span style={{
          color: publicKey ? 'rgba(255, 255, 255, 0.95)' : 'rgba(156, 163, 175, 0.9)',
          textShadow: publicKey ? '0 0 10px rgba(34, 197, 94, 0.3)' : '0 0 10px rgba(33, 188, 255, 0.3)',
          fontFamily: 'var(--font-helvetica)'
        }}>
          {getButtonText()}
        </span>

        {!publicKey && (
          <ChevronDown
            className="w-3 h-3"
            style={{
              color: 'rgba(156, 163, 175, 0.8)',
              transition: 'all 0.3s ease'
            }}
          />
        )}
      </div>

      {/* Connected state glow effect */}
      {publicKey && (
        <div
          className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
            filter: 'blur(8px)'
          }}
        />
      )}
    </button>

    {/* Dropdown Menu */}
    {showDropdown && publicKey && (
      <div
        className="absolute top-full left-0 mt-2 w-64 rounded-xl z-50"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(30, 30, 45, 0.85) 0%,
              rgba(45, 45, 65, 0.8) 25%,
              rgba(30, 30, 45, 0.85) 50%,
              rgba(45, 45, 65, 0.8) 75%,
              rgba(30, 30, 45, 0.85) 100%
            ),
            radial-gradient(circle at 25% 25%,
              rgba(33, 188, 255, 0.05) 0%,
              transparent 50%
            )
          `,
          border: '1px solid rgba(33, 188, 255, 0.15)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          boxShadow: `
            0 20px 40px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(33, 188, 255, 0.05)
          `
        }}
      >
        {/* Wallet Address Section */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Connected
              </div>
              <div className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                {getTruncatedAddress()}
              </div>
            </div>
          </div>
        </div>

        {/* Dropdown Actions */}
        <div className="p-1">
          <button
            onClick={() => handleDropdownClick(copyAddress)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
            style={{
              fontFamily: 'var(--font-helvetica)',
              color: 'rgba(255, 255, 255, 0.8)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(33, 188, 255, 0.1)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
            }}
          >
            <Copy className="w-4 h-4" style={{ color: 'rgba(33, 188, 255, 0.8)' }} />
            <span className="text-sm font-medium">Copy Address</span>
          </button>

          <button
            onClick={() => handleDropdownClick(handleDisconnect)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
            style={{
              fontFamily: 'var(--font-helvetica)',
              color: 'rgba(255, 255, 255, 0.8)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
              e.currentTarget.style.color = 'rgba(239, 68, 68, 0.9)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
            }}
          >
            <LogOut className="w-4 h-4" style={{ color: 'rgba(239, 68, 68, 0.8)' }} />
            <span className="text-sm font-medium">Disconnect</span>
          </button>
        </div>

        {/* Noise grain overlay for dropdown */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-xl"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3Cfilter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            filter: 'contrast(1.3) brightness(1.1)'
          }}
        />
      </div>
    )}
    </div>
  )
}

export default CleanWalletButton
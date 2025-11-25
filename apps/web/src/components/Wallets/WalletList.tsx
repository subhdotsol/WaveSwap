'use client'

import React from 'react'
import { Star, Check, ExternalLink } from 'lucide-react'
import { useThemeConfig, createButtonStyles, createGlassStyles } from '@/lib/theme'

interface WalletListProps {
  wallets: any[]
  selectedWallet: string | null
  connecting: boolean
  onWalletConnect: (wallet: any) => void
  searchQuery: string
}

export function WalletList({ wallets, selectedWallet, connecting, onWalletConnect, searchQuery }: WalletListProps) {
  const theme = useThemeConfig()

  // Filter wallets based on search
  const filteredWallets = wallets.filter(wallet =>
    wallet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wallet.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (filteredWallets.length === 0) {
    return (
      <div className="text-center py-8">
        <p style={{ color: theme.colors.textMuted }}>No wallets found</p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
      {filteredWallets.map((wallet) => {
        const isInstalled = wallet.isInstalled
        const isPending = selectedWallet === wallet.adapterName && connecting
        const isRecommended = wallet.isRecommended

        return (
          <WalletButton
            key={`solana-${wallet.adapterName}`}
            wallet={wallet}
            isInstalled={isInstalled}
            isPending={isPending}
            isRecommended={isRecommended}
            isDisabled={!isInstalled || connecting || (selectedWallet !== null && selectedWallet !== wallet.adapterName)}
            onClick={() => onWalletConnect({
              wallet: wallet.wallet,
              adapterName: wallet.wallet.adapter.name,
              adapter: wallet.wallet.adapter
            })}
            theme={theme}
          />
        )
      })}
    </div>
  )
}

interface WalletButtonProps {
  wallet: any
  isInstalled: boolean
  isPending: boolean
  isRecommended: boolean
  isDisabled: boolean
  onClick: () => void
  theme: any
}

function WalletButton({ wallet, isInstalled, isPending, isRecommended, isDisabled, onClick, theme }: WalletButtonProps) {
  const buttonStyles = {
    ...createButtonStyles(theme, 'secondary', 'md'),
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '0.75rem',
    transition: `all ${theme.animations.duration} ${theme.animations.easing}`,
    transform: isDisabled ? 'none' : 'scale(1)',
    '&:hover:not(:disabled)': {
      transform: 'scale(1.01)',
    },
    '&:active:not(:disabled)': {
      transform: 'scale(0.99)',
    }
  }

  const recommendedStyles = {
    background: `
      linear-gradient(135deg,
        ${theme.colors.primary}20 0%,
        ${theme.colors.primary}10 50%,
        ${theme.colors.primary}20 100%
      ),
      radial-gradient(circle at 30% 30%,
        ${theme.colors.primary}15 0%,
        transparent 60%
      )
    `,
    border: `1px solid ${theme.colors.primary}30`,
    boxShadow: `
      0 12px 40px ${theme.colors.primary}20,
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      0 0 0 1px ${theme.colors.primary}10
    `
  }

  const defaultStyles = {
    background: `
      linear-gradient(135deg,
        ${theme.colors.surface} 0%,
        ${theme.colors.surfaceHover} 50%,
        ${theme.colors.surface} 100%
      ),
      radial-gradient(circle at 30% 30%,
        ${theme.colors.primary}05 0%,
        transparent 60%
      )
    `,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: `
      0 8px 32px ${theme.colors.shadow},
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 0 0 1px ${theme.colors.border}50
    `
  }

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...buttonStyles,
        ...(isRecommended ? recommendedStyles : defaultStyles),
        opacity: isDisabled ? 0.6 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-helvetica)'
      }}
      className="wallet-button"
    >
      {/* Wallet Icon */}
      <div className="relative flex-shrink-0">
        <div
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: isRecommended
              ? `linear-gradient(135deg, ${theme.colors.primary}10, ${theme.colors.primary}05)`
              : 'rgba(255, 255, 255, 0.05)',
            border: isRecommended
              ? `1px solid ${theme.colors.primary}20`
              : `1px solid ${theme.colors.border}`,
            backdropFilter: 'blur(10px)'
          }}
        >
          <img
            src={wallet.icon}
            alt={wallet.name}
            style={{
              width: '2rem',
              height: '2rem',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
            }}
            onError={(e) => {
              e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="8" fill="${wallet.color}"/>
                  <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="system-ui">
                    ${wallet.name.substring(0, 2).toUpperCase()}
                  </text>
                </svg>
              `)}`
            }}
          />
        </div>
        {isRecommended && (
          <div
            style={{
              position: 'absolute',
              top: '-0.25rem',
              right: '-0.25rem',
              width: '1.25rem',
              height: '1.25rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: `0 2px 8px ${theme.colors.primary}30`
            }}
          >
            <Star size={12} className="text-white fill-current" />
          </div>
        )}
      </div>

      {/* Wallet Info */}
      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: '0.875rem',
              letterSpacing: '0.025em',
              color: theme.colors.textPrimary,
              fontFamily: 'var(--font-helvetica)'
            }}
          >
            {wallet.name}
          </span>
          {!isInstalled && (
            <span
              style={{
                padding: '0.125rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                borderRadius: '9999px',
                border: `1px solid ${theme.colors.warning}30`,
                background: `${theme.colors.warning}10`,
                color: theme.colors.warning,
                fontFamily: 'var(--font-helvetica)'
              }}
            >
              Install
            </span>
          )}
          {isRecommended && (
            <span
              style={{
                padding: '0.125rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                borderRadius: '9999px',
                border: `1px solid ${theme.colors.primary}30`,
                background: `${theme.colors.primary}10`,
                color: theme.colors.primary,
                fontFamily: 'var(--font-helvetica)'
              }}
            >
              Recommended
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: '0.75rem',
            lineHeight: '1.5',
            color: theme.colors.textMuted,
            fontFamily: 'var(--font-helvetica)'
          }}
        >
          {wallet.description}
        </p>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
        {isPending ? (
          <div
            style={{
              width: '1.25rem',
              height: '1.25rem',
              borderRadius: '50%',
              border: `2px solid ${theme.colors.primary}30`,
              borderTopColor: theme.colors.primary,
              animation: 'spin 1s linear infinite'
            }}
          />
        ) : isInstalled ? (
          <div
            style={{
              width: '1.25rem',
              height: '1.25rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${theme.colors.success}20`,
              border: `1px solid ${theme.colors.success}30`
            }}
          >
            <Check size={12} style={{ color: theme.colors.success }} />
          </div>
        ) : (
          <div
            style={{
              width: '1.25rem',
              height: '1.25rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${theme.colors.primary}10`,
              border: `1px solid ${theme.colors.primary}20`
            }}
          >
            <ExternalLink size={12} style={{ color: theme.colors.primary }} />
          </div>
        )}
      </div>
    </button>
  )
}
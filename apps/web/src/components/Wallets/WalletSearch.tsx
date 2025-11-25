'use client'

import React from 'react'
import { Search } from 'lucide-react'
import { useThemeConfig, createInputStyles } from '@/lib/theme'

interface WalletSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
}

export function WalletSearch({ searchQuery, onSearchChange, placeholder = "Search wallets..." }: WalletSearchProps) {
  const theme = useThemeConfig()

  const inputStyles = {
    ...createInputStyles(theme),
    paddingLeft: '2.5rem', // Account for icon
    width: '100%',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-helvetica)'
  }

  return (
    <div style={{ position: 'relative' }}>
      <Search
        style={{
          position: 'absolute',
          left: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '1rem',
          height: '1rem',
          color: theme.colors.textMuted,
          zIndex: 1
        }}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={inputStyles}
        className="wallet-search-input"
      />
    </div>
  )
}
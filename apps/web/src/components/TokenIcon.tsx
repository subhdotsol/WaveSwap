'use client'

import { useState } from 'react'

interface TokenIconProps {
  symbol: string
  mint: string
  logoURI?: string
  size?: number
  className?: string
}

/**
 * Token icon with fallback loading strategy
 * 1. Try provided logoURI (from Jupiter API)
 * 2. Try Solana token-list CDN
 * 3. Try Trust Wallet assets
 * 4. Show first letter
 */
export function TokenIcon({ symbol, mint, logoURI, size = 40, className = '' }: TokenIconProps) {
  const [currentSource, setCurrentSource] = useState(0)
  const [showFallback, setShowFallback] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Create sources array in order of preference
  const sources = [
    logoURI,
    `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`,
    `https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/assets/mainnet/${mint}/logo.png`
  ].filter(Boolean)

  const handleError = () => {
    setImageError(true)
    if (currentSource < sources.length - 1) {
      setCurrentSource(currentSource + 1)
    } else {
      setShowFallback(true)
      setIsLoading(false)
    }
  }

  const handleLoad = () => {
    setImageError(false)
    setIsLoading(false)
  }

  // Fallback display
  if (showFallback || !sources[0] || imageError) {
    return (
      <div
        className={`rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20 ${className}`}
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, rgba(162, 89, 250, 0.1), rgba(59, 130, 246, 0.1))',
          border: '2px solid rgba(162, 89, 250, 0.3)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <span
          className="font-bold"
          style={{
            color: 'var(--wave-purple)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: `${size * 0.4}px`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {symbol.slice(0, 2)}
        </span>
      </div>
    )
  }

  // Main icon display
  return (
    <div
      className={`rounded-full flex items-center justify-center ${className} bg-gray-900/50`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(31, 41, 55, 0.9))',
        border: '2px solid rgba(162, 89, 250, 0.2)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden'
      }}
    >
      <img
        src={sources[currentSource]}
        alt={symbol}
        className="w-full h-full object-contain"
        style={{
          padding: `${size * 0.08}px`,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
        }}
        crossOrigin="anonymous"
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  )
}


// WaveSwap UI TokenIcon Component

import React from 'react'

interface TokenIconProps {
  symbol?: string
  logoURI?: string
  size?: number
  className?: string
}

export const TokenIcon: React.FC<TokenIconProps> = ({ symbol = 'Token', logoURI, size = 24, className = '' }) => {
  if (logoURI) {
    return (
      <img
        src={logoURI}
        alt={symbol}
        width={size}
        height={size}
        className={`rounded-full ${className}`}
      />
    )
  }

  // Default placeholder icon
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gray-300 text-gray-600 ${className}`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.5 }}>{symbol.slice(0, 1).toUpperCase()}</span>
    </div>
  )
}

export default TokenIcon

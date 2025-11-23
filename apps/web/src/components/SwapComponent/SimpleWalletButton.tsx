'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useState, useEffect } from 'react'

export function SimpleWalletButton() {
  const { connected, connecting } = useWallet()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Import styles dynamically to avoid hydration issues
    import('@solana/wallet-adapter-react-ui/styles.css' as any).catch(() => {
      console.warn('Could not load wallet adapter styles')
    })
  }, [])

  if (!mounted) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-200 border-0 flex items-center justify-center min-w-[140px] h-[48px] opacity-80">
        <div className="animate-pulse bg-white/20 rounded h-4 w-16"></div>
      </div>
    )
  }

  return (
    <div className="wallet-adapter-button-trigger">
      <WalletMultiButton
        className="group font-medium py-3 px-6 rounded-xl transition-all duration-300 border-0 flex items-center justify-center gap-2 min-w-[140px] h-[48px] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
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
      />
    </div>
  )
}
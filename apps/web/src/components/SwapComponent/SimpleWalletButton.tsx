'use client'

import { useState, useEffect } from 'react'
import { CleanWalletButton } from '@/components/Wallets/CleanWalletButton'

export function SimpleWalletButton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-200 border-0 flex items-center justify-center min-w-[140px] h-[48px] opacity-80">
        <div className="animate-pulse bg-white/20 rounded h-4 w-16"></div>
      </div>
    )
  }

  return (
    <div className="wallet-adapter-button-trigger">
      <CleanWalletButton />
    </div>
  )
}
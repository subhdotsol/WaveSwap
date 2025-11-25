'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useMultiChainWallet, ConnectedWallet } from '@/hooks/useMultiChainWallet'

interface WalletContextType {
  connectedWallets: ConnectedWallet[]
  isConnecting: boolean
  connectionError: string | null
  connectWallet: (walletInfo: any) => Promise<void>
  disconnectWallet: (walletInfo: any) => Promise<void>
  getWalletBalance: (walletId: string) => Promise<string | null>
  isWalletConnected: (walletId: string) => boolean
  getConnectedWalletByChain: (chain: string) => ConnectedWallet | undefined
  clearError: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const walletHook = useMultiChainWallet()

  return (
    <WalletContext.Provider value={walletHook}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

export default WalletProvider
'use client'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  CoinbaseWalletAdapter,
  TrustWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { useMemo, useEffect } from 'react'
import { config } from '@/lib/config'

// Component to handle dynamic style import
function WalletStyles() {
  useEffect(() => {
    // Dynamic import with type assertion to avoid TypeScript errors
    import('@solana/wallet-adapter-react-ui/styles.css' as any).catch(() => {
      // Ignore if styles can't be loaded
      console.warn('Could not load wallet adapter styles')
    })
  }, [])
  return null
}

export function CustomWalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet
  // Use Helius RPC from config
  const endpoint = useMemo(() => config.rpc.url, [])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TrustWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletStyles />
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
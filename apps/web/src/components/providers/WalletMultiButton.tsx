'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/Button'
import { Wallet } from 'lucide-react'

export function WalletMultiButton() {
  const { publicKey, connect, connecting, connected } = useWallet()

  const handleClick = async () => {
    if (connected) {
      // In a real app, you'd show a disconnect modal
      return
    }
    try {
      await connect()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const buttonText = () => {
    if (connecting) return 'Connecting...'
    if (connected && publicKey) {
      return `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    }
    return 'Connect Wallet'
  }

  return (
    <Button
      onClick={handleClick}
      disabled={connecting}
      variant={connected ? 'secondary' : 'primary'}
      leftIcon={<Wallet className="h-4 w-4" />}
      size="sm"
    >
      {buttonText()}
    </Button>
  )
}

export default WalletMultiButton
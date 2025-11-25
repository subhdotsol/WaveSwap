'use client'

import { SolanaWalletModal } from './SolanaWalletModal'
import { useWalletModal } from '@/contexts/WalletModalContext'

export function GlobalWalletModal() {
  const { isModalOpen, closeModal } = useWalletModal()

  return (
    <SolanaWalletModal
      isOpen={isModalOpen}
      onClose={closeModal}
    />
  )
}
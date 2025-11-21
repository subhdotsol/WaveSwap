'use client'

import {
  useWallet
} from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import {
  WalletIcon,
  ChevronDownIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect, useRef, useMemo } from 'react'

export function WalletConnectButton() {
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet()
  const { setVisible } = useWalletModal()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatAddress = useMemo(() => {
    if (!publicKey) return ''
    const address = publicKey.toString()
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }, [publicKey])

  const getWalletIcon = () => {
    if (wallet?.adapter.icon) {
      return (
        <img
          src={wallet.adapter.icon}
          alt={wallet.adapter.name}
          className="w-5 h-5 rounded"
        />
      )
    }
    return <WalletIcon className="w-5 h-5" />
  }

  const handleConnect = () => {
    setVisible(true)
  }

  const handleDisconnect = () => {
    disconnect()
    setIsOpen(false)
  }

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString())
      // You could add a toast notification here
    }
  }

  if (!mounted) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-200 border-0 flex items-center justify-center min-w-[140px] h-[48px]">
        <div className="animate-pulse bg-white/20 rounded h-4 w-16"></div>
      </div>
    )
  }

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-200 border-0 flex items-center justify-center gap-2 min-w-[140px] h-[48px] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105"
      >
        {connecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            Connecting...
          </>
        ) : (
          <>
            <WalletIcon className="w-5 h-5" />
            Connect Wallet
          </>
        )}
      </button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-200 border-0 flex items-center gap-3 min-w-[140px] h-[48px] hover:shadow-xl hover:scale-105"
      >
        {getWalletIcon()}
        <span className="font-medium">{formatAddress}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/60 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Wallet Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 rounded-full p-2">
                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Wallet Connected</p>
                <p className="text-xs text-gray-400">{wallet?.adapter.name || 'Unknown Wallet'}</p>
              </div>
              {getWalletIcon()}
            </div>
          </div>

          {/* Address Section */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="bg-gray-800/60 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Your Address</p>
                  <p className="text-sm font-mono text-white">{formatAddress}</p>
                  <p className="text-xs text-gray-500 mt-1">{publicKey?.toString()}</p>
                </div>
                <button
                  onClick={copyAddress}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
                  title="Copy address"
                >
                  <UserIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-2">
            <button
              onClick={() => window.open(`https://solscan.io/account/${publicKey?.toString()}`, '_blank')}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800/60 hover:text-white rounded-xl transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">View on Solscan</p>
                <p className="text-xs text-gray-500">Check transaction history</p>
              </div>
            </button>

            <div className="border-t border-gray-700/50 my-2"></div>

            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Disconnect Wallet</p>
                <p className="text-xs text-red-300/70">Sign out from this wallet</p>
              </div>
            </button>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-gray-800/40 border-t border-gray-700/50">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                Never share your private keys or seed phrase with anyone.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
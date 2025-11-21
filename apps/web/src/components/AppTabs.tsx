'use client'

import { useState, useEffect } from 'react'
import Tabs from './ui/Tabs'
import { SwapComponent } from './SwapComponent'
import { NetworkSelector } from './SwapComponent/NetworkSelector'
import { WalletConnectButton } from './SwapComponent/WalletConnectButton'
import Settings from './Settings'

// Import icons for each tab
import {
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface TabContentProps {
  tabId: string
  privacyMode: boolean
}

function TabContent({ tabId, privacyMode }: TabContentProps) {
  switch (tabId) {
    case 'swap':
      return (
        <div className="w-full flex justify-center">
          <SwapComponent privacyMode={privacyMode} />
        </div>
      )

    case 'bridge':
      return (
        <div className="max-w-md mx-auto">
          <div className="bg-gray-900/60 backdrop-blur-2xl rounded-3xl border border-gray-800/60 shadow-2xl p-8">
            <div className="text-center py-16">
              <ArrowsRightLeftIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Bridge Coming Soon</h3>
              <p className="text-gray-400">Cross-chain asset transfer functionality will be available in the next release.</p>
            </div>
          </div>
        </div>
      )

    case 'history':
      return (
        <div className="max-w-md mx-auto">
          <div className="bg-gray-900/60 backdrop-blur-2xl rounded-3xl border border-gray-800/60 shadow-2xl p-8">
            <div className="text-center py-16">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <ClockIcon className="h-16 w-16 text-gray-600" />
                  {privacyMode && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-gray-950 flex items-center justify-center">
                      <ShieldCheckIcon className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {privacyMode ? 'Private Transaction History' : 'Transaction History'}
              </h3>
              <p className="text-gray-400 text-sm mb-2">
                {privacyMode
                  ? 'Your confidential swap history will appear here once you start trading.'
                  : 'Your swap history will appear here once you start trading.'
                }
              </p>
              {privacyMode && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mt-2">
                  <ShieldCheckIcon className="h-3 w-3 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Amounts Hidden</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}

export function AppTabs() {
  const [activeTab, setActiveTab] = useState('swap')
  const [privacyMode, setPrivacyMode] = useState(true) // ON by default

  const tabs = [
    {
      id: 'swap',
      label: 'Swap',
      icon: <ArrowPathIcon className="h-4 w-4" />
    },
    {
      id: 'bridge',
      label: 'Bridge',
      icon: <ArrowsRightLeftIcon className="h-4 w-4" />
    },
    {
      id: 'history',
      label: 'History',
      icon: <ClockIcon className="h-4 w-4" />
    }
  ]

  // Apply theme changes based on privacy mode
  useEffect(() => {
    const root = document.documentElement
    if (privacyMode) {
      root.classList.add('privacy-mode')
    } else {
      root.classList.remove('privacy-mode')
    }
  }, [privacyMode])

  return (
    <div className="w-full">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-gray-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-950" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">WaveSwap</h1>
                <p className="text-xs text-gray-400">Private. Secure. Fast.</p>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              <NetworkSelector />
              <Settings
                privacyMode={privacyMode}
                onPrivacyModeChange={setPrivacyMode}
              />
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="w-full max-w-6xl mx-auto">
          <Tabs
            tabs={tabs}
            defaultTab="swap"
            onTabChange={setActiveTab}
            className="mb-8"
          />

          <TabContent tabId={activeTab} privacyMode={privacyMode} />
        </div>
      </main>

      </div>
  )
}

export default AppTabs
'use client'

import { useState, useRef, useEffect } from 'react'
import { Switch } from '@headlessui/react'
import { ChevronUpIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

interface SettingsProps {
  privacyMode: boolean
  onPrivacyModeChange: (enabled: boolean) => void
}

export function Settings({ privacyMode, onPrivacyModeChange }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-xl transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50 flex items-center gap-2"
        title="Settings"
      >
        <Cog6ToothIcon className="h-5 w-5" />
        <ChevronUpIcon
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50">
            <h2 className="text-lg font-semibold text-white">Settings</h2>
          </div>

          {/* Settings Content */}
          <div className="p-4 space-y-4">
            {/* Privacy Mode Setting */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">Privacy Mode</h3>
                    <p className="text-xs text-gray-400">Enhanced privacy for all transactions</p>
                  </div>
                </div>

                <Switch
                  checked={privacyMode}
                  onChange={(checked) => {
                    onPrivacyModeChange(checked)
                    setIsOpen(false) // Close dropdown after change
                  }}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  style={{
                    backgroundColor: privacyMode ? '#10b981' : '#374151'
                  }}
                >
                  <span className="sr-only">Enable privacy mode</span>
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${privacyMode ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </Switch>
              </div>
            </div>

            {/* Future Settings Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Preferences</h3>
              <div className="space-y-2 opacity-50">
                <div className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                  <span className="text-gray-400 text-xs">Coming Soon</span>
                  <span className="text-xs text-gray-500">More settings</span>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-gray-800/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs text-gray-300">
                    Privacy mode encrypts transaction amounts and routes to protect your trading activity from being tracked.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
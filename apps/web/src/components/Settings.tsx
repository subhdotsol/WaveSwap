'use client'

import { useState, useRef, useEffect } from 'react'
import { Switch } from '@headlessui/react'
import {
  ChevronUpIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  SparklesIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface SettingsProps {
  privacyMode: boolean
  onPrivacyModeChange: (enabled: boolean) => void
}

export function Settings({ privacyMode, onPrivacyModeChange }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [slippage, setSlippage] = useState('3')
  const [deadline, setDeadline] = useState('30')
  const [expertMode, setExpertMode] = useState(false)
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
        className="relative p-2.5 overflow-hidden rounded-xl transition-all duration-300 border-0 flex items-center gap-2 z-10"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(107, 114, 128, 0.8) 0%,
              rgba(75, 85, 99, 0.8) 50%,
              rgba(107, 114, 128, 0.8) 100%
            ),
            radial-gradient(circle at 30% 30%,
              rgba(162, 89, 250, 0.1) 0%,
              transparent 50%
            )
          `,
          border: '1px solid rgba(107, 114, 128, 0.3)',
          backdropFilter: 'blur(16px) saturate(1.8)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(162, 89, 250, 0.1)
          `
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `
            linear-gradient(135deg,
              rgba(107, 114, 128, 0.9) 0%,
              rgba(75, 85, 99, 0.9) 50%,
              rgba(107, 114, 128, 0.9) 100%
            ),
            radial-gradient(circle at 30% 30%,
              rgba(162, 89, 250, 0.2) 0%,
              transparent 50%
            )
          `
          e.currentTarget.style.boxShadow = `
            0 12px 40px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 0 0 1px rgba(162, 89, 250, 0.2)
          `
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `
            linear-gradient(135deg,
              rgba(107, 114, 128, 0.8) 0%,
              rgba(75, 85, 99, 0.8) 50%,
              rgba(107, 114, 128, 0.8) 100%
            ),
            radial-gradient(circle at 30% 30%,
              rgba(162, 89, 250, 0.1) 0%,
              transparent 50%
            )
          `
          e.currentTarget.style.boxShadow = `
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(162, 89, 250, 0.1)
          `
        }}
        title="Settings"
      >
        {/* Noise grain overlay */}
        <div
          className="absolute inset-0 opacity-4 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3Cfilter%3E%3Crect width='50' height='50' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            filter: 'contrast(1.3) brightness(1.1)'
          }}
        />

        <Cog6ToothIcon className="h-5 w-5 text-white/90 relative z-10" style={{ filter: 'drop-shadow(0 0 8px rgba(162, 89, 250, 0.3))' }} />
        <ChevronUpIcon
          className={`h-3 w-3 text-white/70 transition-transform duration-300 relative z-10 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-96 rounded-2xl overflow-hidden"
          style={{
            background: `
              linear-gradient(135deg,
                rgba(30, 30, 45, 0.95) 0%,
                rgba(45, 45, 65, 0.9) 25%,
                rgba(30, 30, 45, 0.95) 50%,
                rgba(45, 45, 65, 0.9) 75%,
                rgba(30, 30, 45, 0.95) 100%
              ),
              radial-gradient(circle at 25% 25%,
                rgba(162, 89, 250, 0.05) 0%,
                transparent 50%
              )
            `,
            border: '1px solid rgba(162, 89, 250, 0.15)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            boxShadow: `
              0 20px 60px rgba(0, 0, 0, 0.4),
              0 8px 24px rgba(162, 89, 250, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2)
            `,
            zIndex: 50
          }}
        >
          {/* Noise grain overlay */}
          <div
            className="absolute inset-0 opacity-4 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='150' height='150' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3Cfilter%3E%3Crect width='150' height='150' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              filter: 'contrast(1.3) brightness(1.1)'
            }}
          />

          {/* Header */}
          <div className="relative z-10 p-4 border-b border-gray-700/50" style={{
            background: `
              linear-gradient(135deg,
                rgba(162, 89, 250, 0.1) 0%,
                rgba(162, 89, 250, 0.05) 50%,
                rgba(162, 89, 250, 0.1) 100%
              )
            `,
            backdropFilter: 'blur(12px) saturate(1.5)'
          }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2" style={{
                background: 'rgba(162, 89, 250, 0.2)',
                border: '1px solid rgba(162, 89, 250, 0.3)'
              }}>
                <Cog6ToothIcon className="h-5 w-5 text-purple-400" style={{ filter: 'drop-shadow(0 0 8px rgba(162, 89, 250, 0.4))' }} />
              </div>
              <h2 className="text-lg font-semibold text-white" style={{
                fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 600,
                letterSpacing: '0.025em'
              }}>Settings</h2>
            </div>
          </div>

          {/* Settings Content */}
          <div className="relative z-10 p-4 space-y-6 max-h-96 overflow-y-auto">
            {/* Privacy & Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-medium text-emerald-400 uppercase tracking-wider" style={{
                  fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
                  letterSpacing: '0.05em'
                }}>Privacy & Security</h3>
              </div>

              {/* Privacy Mode */}
              <div className="flex items-center justify-between p-3 rounded-xl" style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.1)'
              }}>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2" style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <SparklesIcon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm" style={{
                      fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
                      fontWeight: 500
                    }}>Privacy Mode</h4>
                    <p className="text-xs text-gray-400">Enhanced privacy for all transactions</p>
                  </div>
                </div>

                <Switch
                  checked={privacyMode}
                  onChange={(checked) => {
                    onPrivacyModeChange(checked)
                  }}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent"
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

              {/* Expert Mode */}
              <div className="flex items-center justify-between p-3 rounded-xl" style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.1)'
              }}>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2" style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <ChartBarIcon className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">Expert Mode</h4>
                    <p className="text-xs text-gray-400">Advanced trading features</p>
                  </div>
                </div>

                <Switch
                  checked={expertMode}
                  onChange={setExpertMode}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-transparent"
                  style={{
                    backgroundColor: expertMode ? '#ef4444' : '#374151'
                  }}
                >
                  <span className="sr-only">Enable expert mode</span>
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${expertMode ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </Switch>
              </div>
            </div>

            {/* Trading Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <AdjustmentsHorizontalIcon className="h-4 w-4 text-blue-400" />
                <h3 className="text-xs font-medium text-blue-400 uppercase tracking-wider" style={{
                  fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
                  letterSpacing: '0.05em'
                }}>Trading Preferences</h3>
              </div>

              {/* Slippage */}
              <div className="p-3 rounded-xl" style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                <label className="block text-sm font-medium text-white mb-2" style={{
                  fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif"
                }}>Slippage Tolerance</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700 text-white text-sm"
                    style={{
                      border: '1px solid rgba(156, 163, 175, 0.2)',
                      background: 'rgba(30, 30, 45, 0.6)',
                      backdropFilter: 'blur(8px) saturate(1.2)',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                    min="0.1"
                    max="50"
                    step="0.1"
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Your transaction will revert if price changes unfavorably by more than this amount</p>
              </div>

              {/* Deadline */}
              <div className="p-3 rounded-xl" style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                <label className="block text-sm font-medium text-white mb-2" style={{
                  fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif"
                }}>Transaction Deadline</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700 text-white text-sm"
                    style={{
                      border: '1px solid rgba(156, 163, 175, 0.2)',
                      background: 'rgba(30, 30, 45, 0.6)',
                      backdropFilter: 'blur(8px) saturate(1.2)',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                    min="1"
                    max="60"
                    step="1"
                  />
                  <span className="text-sm text-gray-400">minutes</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Your transaction will revert if it's pending for more than this time</p>
              </div>
            </div>

            {/* Interface */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <BellIcon className="h-4 w-4 text-purple-400" />
                <h3 className="text-xs font-medium text-purple-400 uppercase tracking-wider" style={{
                  fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
                  letterSpacing: '0.05em'
                }}>Interface</h3>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between p-3 rounded-xl" style={{
                background: 'rgba(168, 85, 247, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.1)'
              }}>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2" style={{
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.3)'
                  }}>
                    <BellIcon className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">Notifications</h4>
                    <p className="text-xs text-gray-400">Transaction alerts and updates</p>
                  </div>
                </div>

                <Switch
                  checked={notifications}
                  onChange={setNotifications}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent"
                  style={{
                    backgroundColor: notifications ? '#a855f7' : '#374151'
                  }}
                >
                  <span className="sr-only">Enable notifications</span>
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </Switch>
              </div>
            </div>

            {/* Info Section */}
            <div className="p-3 rounded-xl" style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-300" style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                  }}>
                    Configure your trading preferences and privacy settings to optimize your WaveSwap experience.
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
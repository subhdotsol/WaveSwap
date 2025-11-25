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
import { useTheme } from '@/contexts/ThemeContext'
import { useThemeConfig, createGlassStyles } from '@/lib/theme'

export function Settings() {
  const { theme, setLightTheme, setDarkTheme, setOrcaTheme } = useTheme()
  const themeConfig = useThemeConfig()
  const [isOpen, setIsOpen] = useState(false)
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
          ...createGlassStyles(themeConfig),
          border: `1px solid ${themeConfig.colors.border}`,
          backdropFilter: 'blur(16px) saturate(1.8)',
          boxShadow: `
            0 8px 32px ${themeConfig.colors.shadow},
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px ${themeConfig.colors.primary}10
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
                rgba(33, 188, 255, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(circle at 75% 75%,
                rgba(16, 185, 129, 0.03) 0%,
                transparent 50%
              )
            `,
            border: '1px solid rgba(33, 188, 255, 0.15)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            boxShadow: `
              0 25px 70px rgba(0, 0, 0, 0.5),
              0 12px 32px rgba(33, 188, 255, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(33, 188, 255, 0.1)
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
                rgba(33, 188, 255, 0.1) 0%,
                rgba(33, 188, 255, 0.05) 50%,
                rgba(33, 188, 255, 0.1) 100%
              )
            `,
            backdropFilter: 'blur(12px) saturate(1.5)'
          }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2" style={{
                background: 'rgba(33, 188, 255, 0.2)',
                border: '1px solid rgba(33, 188, 255, 0.3)'
              }}>
                <Cog6ToothIcon className="h-5 w-5 text-blue-400" style={{ filter: 'drop-shadow(0 0 8px rgba(33, 188, 255, 0.4))' }} />
              </div>
              <h2 className="text-lg font-semibold text-white" style={{
                fontFamily: 'var(--font-helvetica)',
                fontWeight: 600,
                letterSpacing: '0.025em'
              }}>Settings</h2>
            </div>
          </div>

          {/* Settings Content */}
          <div className="relative z-10 p-4 space-y-6 max-h-96 overflow-y-auto">
            {/* Trading Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <AdjustmentsHorizontalIcon className="h-4 w-4 text-blue-400" />
                <h3 className="text-xs font-medium text-blue-400 uppercase tracking-wider" style={{
                  fontFamily: 'var(--font-helvetica)',
                  letterSpacing: '0.05em'
                }}>Trading Preferences</h3>
              </div>

              {/* Expert Mode */}
              <div className="flex items-center justify-between p-3 rounded-xl" style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2" style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <ChartBarIcon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">Expert Mode</h4>
                    <p className="text-xs text-gray-400">Advanced trading features</p>
                  </div>
                </div>

                <Switch
                  checked={expertMode}
                  onChange={setExpertMode}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
                  style={{
                    backgroundColor: expertMode ? 'rgba(59, 130, 246, 0.8)' : 'rgba(55, 65, 81, 0.8)'
                  }}
                >
                  <span className="sr-only">Enable expert mode</span>
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${expertMode ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </Switch>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <SunIcon className="h-4 w-4 text-yellow-400" />
                <h3 className="text-xs font-medium text-yellow-400 uppercase tracking-wider" style={{
                  fontFamily: 'var(--font-helvetica)',
                  letterSpacing: '0.05em'
                }}>Theme</h3>
              </div>

              {/* Theme Options */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={setLightTheme}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                    theme === 'light'
                      ? 'border-yellow-400/50'
                      : 'border-gray-600/50 hover:border-yellow-400/30'
                  }`}
                  style={{
                    background: theme === 'light'
                      ? 'rgba(251, 191, 36, 0.1)'
                      : 'rgba(55, 65, 81, 0.3)',
                    backdropFilter: 'blur(8px) saturate(1.2)'
                  }}
                >
                  <SunIcon className={`h-5 w-5 ${
                    theme === 'light' ? 'text-yellow-400' : 'text-gray-400'
                  }`} />
                  <span className={`text-xs font-medium ${
                    theme === 'light' ? 'text-yellow-400' : 'text-gray-400'
                  }`} style={{
                    fontFamily: 'var(--font-helvetica)'
                  }}>
                    Light
                  </span>
                  {theme === 'light' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
                  )}
                </button>

                <button
                  onClick={setDarkTheme}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'border-blue-400/50'
                      : 'border-gray-600/50 hover:border-blue-400/30'
                  }`}
                  style={{
                    background: theme === 'dark'
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'rgba(55, 65, 81, 0.3)',
                    backdropFilter: 'blur(8px) saturate(1.2)'
                  }}
                >
                  <MoonIcon className={`h-5 w-5 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                  <span className={`text-xs font-medium ${
                    theme === 'dark' ? 'text-blue-400' : 'text-gray-400'
                  }`} style={{
                    fontFamily: 'var(--font-helvetica)'
                  }}>
                    Dark
                  </span>
                  {theme === 'dark' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full" />
                  )}
                </button>

                <button
                  onClick={setOrcaTheme}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                    theme === 'orca'
                      ? 'border-gray-400/50'
                      : 'border-gray-600/50 hover:border-gray-400/30'
                  }`}
                  style={{
                    background: theme === 'orca'
                      ? 'rgba(156, 163, 175, 0.1)'
                      : 'rgba(55, 65, 81, 0.3)',
                    backdropFilter: 'blur(8px) saturate(1.2)'
                  }}
                >
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    theme === 'orca'
                      ? 'bg-gray-400 border-gray-400'
                      : 'border-gray-400'
                  }`} />
                  <span className={`text-xs font-medium ${
                    theme === 'orca' ? 'text-gray-400' : 'text-gray-400'
                  }`} style={{
                    fontFamily: 'var(--font-helvetica)'
                  }}>
                    Orca
                  </span>
                  {theme === 'orca' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                </button>
              </div>
            </div>

            {/* Slippage & Deadline */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <AdjustmentsHorizontalIcon className="h-4 w-4 text-blue-400" />
                <h3 className="text-xs font-medium text-blue-400 uppercase tracking-wider" style={{
                  fontFamily: 'var(--font-helvetica)',
                  letterSpacing: '0.05em'
                }}>Trading Preferences</h3>
              </div>

              {/* Slippage */}
              <div className="p-3 rounded-xl" style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                <label className="block text-sm font-medium text-white mb-2" style={{
                  fontFamily: 'var(--font-helvetica)'
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
                      fontFamily: 'var(--font-mono)'
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
                  fontFamily: 'var(--font-helvetica)'
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
                      fontFamily: 'var(--font-mono)'
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
                <BellIcon className="h-4 w-4 text-blue-400" />
                <h3 className="text-xs font-medium text-blue-400 uppercase tracking-wider" style={{
                  fontFamily: 'var(--font-helvetica)',
                  letterSpacing: '0.05em'
                }}>Interface</h3>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between p-3 rounded-xl" style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2" style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <BellIcon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">Notifications</h4>
                    <p className="text-xs text-gray-400">Transaction alerts and updates</p>
                  </div>
                </div>

                <Switch
                  checked={notifications}
                  onChange={setNotifications}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
                  style={{
                    backgroundColor: notifications ? 'var(--wave-azul)' : '#374151'
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
                    fontFamily: 'var(--font-helvetica)'
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
'use client'

import { useState } from 'react'

interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: TabItem[]
  defaultTab?: string
  onTabChange?: (tabId: string) => void
  className?: string
}

export function Tabs({ tabs, defaultTab, onTabChange, className = '' }: TabsProps) {
  const [selectedTab, setSelectedTab] = useState(defaultTab || tabs[0]?.id || '')

  const handleTabChange = (tabId: string) => {
    setSelectedTab(tabId)
    onTabChange?.(tabId)
  }

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        const currentIndex = tabs.findIndex(tab => tab.id === tabId)
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
        const prevTab = tabs[prevIndex]
        if (prevTab && !prevTab.disabled) {
          handleTabChange(prevTab.id)
        }
        break
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        const currentIdx = tabs.findIndex(tab => tab.id === tabId)
        const nextIdx = currentIdx < tabs.length - 1 ? currentIdx + 1 : 0
        const nextTab = tabs[nextIdx]
        if (nextTab && !nextTab.disabled) {
          handleTabChange(nextTab.id)
        }
        break
      case 'Home':
        e.preventDefault()
        const firstTab = tabs.find(tab => !tab.disabled)
        if (firstTab) {
          handleTabChange(firstTab.id)
        }
        break
      case 'End':
        e.preventDefault()
        const lastTab = [...tabs].reverse().find(tab => !tab.disabled)
        if (lastTab) {
          handleTabChange(lastTab.id)
        }
        break
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className="relative flex items-center justify-center p-1 rounded-2xl overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(30, 30, 45, 0.6) 0%,
              rgba(45, 45, 65, 0.4) 50%,
              rgba(30, 30, 45, 0.6) 100%
            ),
            radial-gradient(circle at 50% 50%,
              rgba(162, 89, 250, 0.02) 0%,
              transparent 50%
            )
          `,
          border: '1px solid rgba(162, 89, 250, 0.1)',
          backdropFilter: 'blur(20px) saturate(1.8)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(162, 89, 250, 0.05)
          `
        }}
        role="tablist"
        aria-orientation="horizontal"
      >
        {/* Noise grain overlay */}
        <div
          className="absolute inset-0 opacity-3 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3Cfilter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            filter: 'contrast(1.3) brightness(1.1)'
          }}
        />
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.id
          const isDisabled = tab.disabled

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`panel-${tab.id}`}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => !isDisabled && handleTabChange(tab.id)}
              onKeyDown={(e) => !isDisabled && handleKeyDown(e, tab.id)}
              className={`
                relative flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm z-10
                transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:ring-offset-2 focus:ring-offset-transparent
                hover:scale-[1.02] active:scale-[0.98]
              `}
              style={{
                background: isSelected
                  ? `
                    linear-gradient(135deg,
                      rgba(162, 89, 250, 0.2) 0%,
                      rgba(162, 89, 250, 0.1) 50%,
                      rgba(162, 89, 250, 0.2) 100%
                    ),
                    radial-gradient(circle at 30% 30%,
                      rgba(162, 89, 250, 0.15) 0%,
                      transparent 50%
                    )
                  `
                  : 'transparent',
                border: isSelected
                  ? '1px solid rgba(162, 89, 250, 0.3)'
                  : '1px solid transparent',
                backdropFilter: isSelected ? 'blur(12px) saturate(1.5)' : 'none',
                boxShadow: isSelected
                  ? `
                    0 8px 24px rgba(162, 89, 250, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                  `
                  : 'none',
                fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: isSelected ? 600 : 500,
                letterSpacing: '0.025em'
              }}
            >
              {tab.icon && (
                <span style={{
                  color: isSelected ? 'rgba(162, 89, 250, 0.9)' : 'rgba(156, 163, 175, 0.8)',
                  transition: 'all 0.3s ease',
                  filter: isSelected ? 'drop-shadow(0 0 8px rgba(162, 89, 250, 0.4))' : 'none'
                }}>
                  {tab.icon}
                </span>
              )}

              <span style={{
                color: isSelected ? 'rgba(255, 255, 255, 0.95)' : 'rgba(156, 163, 175, 0.9)',
                textShadow: isSelected ? '0 0 10px rgba(162, 89, 250, 0.3)' : 'none'
              }}>
                {tab.label}
              </span>

              {/* Selected indicator glow */}
              {isSelected && (
                <div
                  className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(162, 89, 250, 0.3) 0%, transparent 70%)',
                    filter: 'blur(8px)'
                  }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content panels */}
      <div className="mt-6">
        {tabs.map((tab) => (
          <div
            key={`panel-${tab.id}`}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={selectedTab !== tab.id}
            className="focus:outline-none"
          >
            {selectedTab === tab.id && (
              <div className="animate-fade-in">
                {/* Content will be rendered by the parent component */}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Tabs
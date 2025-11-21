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
        className="flex items-center justify-center p-1 bg-gray-800/40 rounded-2xl border border-gray-700/50"
        role="tablist"
        aria-orientation="horizontal"
      >
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
                relative flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 focus:ring-offset-gray-900
                ${isSelected
                  ? 'bg-gray-900 text-white border border-gray-600/50 shadow-lg'
                  : isDisabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                }
              `}
            >
              {tab.icon && (
                <span className={`
                  ${isSelected ? 'text-blue-400' : 'text-gray-500'}
                  transition-colors duration-200
                `}>
                  {tab.icon}
                </span>
              )}

              <span className={`
                ${isSelected ? 'font-semibold' : 'font-medium'}
                ${isSelected ? 'text-white' : ''}
              `}>
                {tab.label}
              </span>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-500 rounded-full" />
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
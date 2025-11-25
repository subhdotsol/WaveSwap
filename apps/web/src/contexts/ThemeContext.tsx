'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'orca'

interface ThemeContextType {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleLightDark: () => void
  toggleOrca: () => void
  setLightTheme: () => void
  setDarkTheme: () => void
  setOrcaTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark')

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('wave-theme') as ThemeMode
    if (savedTheme && ['light', 'dark', 'orca'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
  }, [])

  // Apply theme to document and save to localStorage
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
  }

  // Toggle between light and dark
  const toggleLightDark = () => {
    if (theme === 'orca') {
      setTheme('light')
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }
  }

  // Toggle orca mode (independent of light/dark)
  const toggleOrca = () => {
    setTheme(theme === 'orca' ? 'dark' : 'orca')
  }

  // Direct theme setters for specific themes
  const setLightTheme = () => setTheme('light')
  const setDarkTheme = () => setTheme('dark')
  const setOrcaTheme = () => setTheme('orca')

  // Set initial theme on mount
  useEffect(() => {
    // Apply dark theme by default
    const savedTheme = localStorage.getItem('wave-theme') as ThemeMode
    const initialTheme = savedTheme && ['light', 'dark', 'orca'].includes(savedTheme) ? savedTheme : 'dark'
    setThemeState(initialTheme)
  }, [])

  // Apply theme when state changes
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light-theme', 'dark-theme', 'orca-theme')
    root.classList.add(`${theme}-theme`)

    // Handle orca mode special case
    if (theme === 'orca') {
      root.classList.add('orca-mode')
    } else {
      root.classList.remove('orca-mode')
    }

    // Store theme preference
    localStorage.setItem('wave-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      toggleLightDark,
      toggleOrca,
      setLightTheme,
      setDarkTheme,
      setOrcaTheme
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
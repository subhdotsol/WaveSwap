'use client'

import { GlobeAltIcon } from '@heroicons/react/24/outline'
import { useThemeConfig, createButtonStyles, createGlassStyles } from '@/lib/theme'

export function NetworkSelector() {
  const theme = useThemeConfig()

  return (
    <button
      className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        ...createGlassStyles(theme),
        ...createButtonStyles(theme, 'secondary', 'sm'),
        fontFamily: 'var(--font-helvetica)',
        fontWeight: 500
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary
        e.currentTarget.style.background = `${theme.colors.primary}10`
        e.currentTarget.style.boxShadow = `0 8px 20px ${theme.colors.primary}15, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border
        e.currentTarget.style.background = createGlassStyles(theme).background as string
        e.currentTarget.style.boxShadow = `0 4px 12px ${theme.colors.shadow}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
      }}
    >
      <GlobeAltIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
      <span
        className="text-sm font-medium"
        style={{ color: theme.colors.textPrimary }}
      >
        devnet
      </span>
    </button>
  )
}
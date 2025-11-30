'use client'

import { useTheme } from '@/contexts/ThemeContext'

export interface ThemeColors {
  // Background colors
  background: string
  surface: string
  surfaceHover: string
  glass: string
  glassBorder: string

  // Text colors
  textPrimary: string
  textSecondary: string
  textMuted: string
  textInverse: string

  // Brand colors
  primary: string
  primaryHover: string
  secondary: string
  accent: string

  // Status colors
  success: string
  warning: string
  error: string
  info: string

  // Border and outline
  border: string
  borderLight: string
  outline: string
  outlineFocus: string

  // Shadow colors
  shadow: string
  shadowLight: string
  shadowHeavy: string

  // Special colors
  gradientStart: string
  gradientEnd: string
  overlay: string

  // Enhanced ghost theme properties (optional for other themes)
  primaryBorder?: string
  primaryBorderLight?: string
  purpleShadow?: string
  phantomGradient?: string
  phantomGlow?: string
}

export interface ThemeConfig {
  name: string
  colors: ThemeColors
  glassStyles: {
    backdrop: string
    blur: string
    border: string
    background: string
  }
  animations: {
    duration: string
    easing: string
  }
}

const lightTheme: ThemeConfig = {
  name: 'light',
  colors: {
    // Background colors
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceHover: '#f1f5f9',
    glass: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(33, 188, 255, 0.2)',

    // Text colors
    textPrimary: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#64748b',
    textInverse: '#ffffff',

    // Brand colors - WaveSwap Theme
    primary: '#264af5',
    primaryHover: '#1c3fd1', // Slightly darker hover
    secondary: '#10b981',
    accent: '#4a4aff', // Deep blue light

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',

    // Border and outline
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    outline: '#3b82f6',
    outlineFocus: '#2563eb',

    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    shadowHeavy: 'rgba(0, 0, 0, 0.25)',

    // Special colors - WaveSwap Theme
    gradientStart: '#264af5',
    gradientEnd: '#4a4aff', // Deep blue light
    overlay: 'rgba(0, 0, 0, 0.3)'
  },
  glassStyles: {
    backdrop: 'blur(20px) saturate(1.8)',
    blur: '20px',
    border: '1px solid rgba(33, 188, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.85)'
  },
  animations: {
    duration: '0.2s',
    easing: 'ease-out'
  }
}

const darkTheme: ThemeConfig = {
  name: 'dark',
  colors: {
    // Background colors
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    glass: 'rgba(30, 41, 59, 0.8)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',

    // Text colors
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    textInverse: '#1e293b',

    // Brand colors
    primary: '#264af5',
    primaryHover: '#1c3fd1', // Slightly darker hover
    secondary: '#10b981',
    accent: '#a855f7',

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',

    // Border and outline
    border: '#334155',
    borderLight: '#475569',
    outline: '#264af5',
    outlineFocus: '#1c3fd1',

    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(0, 0, 0, 0.25)',
    shadowHeavy: 'rgba(0, 0, 0, 0.75)',

    // Special colors
    gradientStart: '#264af5',
    gradientEnd: '#a855f7',
    overlay: 'rgba(0, 0, 0, 0.8)'
  },
  glassStyles: {
    backdrop: 'blur(24px) saturate(1.8)',
    blur: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(30, 41, 59, 0.8)'
  },
  animations: {
    duration: '0.2s',
    easing: 'ease-out'
  }
}

const stealthTheme: ThemeConfig = {
  name: 'stealth',
  colors: {
    // Background colors - stealth dark theme
    background: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceHover: '#2a2a2a',
    glass: 'rgba(26, 26, 26, 0.95)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',

    // Text colors - stealth theme in greyscale
    textPrimary: '#ffffff',
    textSecondary: '#e0e0e0',
    textMuted: '#808080', // Grey for stealth theme
    textInverse: '#0a0a0a',

    // Brand colors - Stealth Theme in greyscale
    primary: '#ffffff', // White
    primaryHover: '#f0f0f0', // Light grey hover
    secondary: '#666666', // Medium grey
    accent: '#999999', // Light grey

    // Status colors - stealth themed
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',

    // Border and outline - stealth theme in greyscale
    border: '#2a2a2a',
    borderLight: '#3a3a3a',
    outline: '#ffffff',
    outlineFocus: '#f0f0f0',

    // Shadow colors - stealth shadows
    shadow: 'rgba(0, 0, 0, 0.8)',
    shadowLight: 'rgba(0, 0, 0, 0.5)',
    shadowHeavy: 'rgba(0, 0, 0, 0.95)',

    // Special colors - Stealth Theme gradient in greyscale
    gradientStart: '#1a1a1a', // Dark grey
    gradientEnd: '#0a0a0a', // Very dark grey
    overlay: 'rgba(0, 0, 0, 0.9)'
  },
  glassStyles: {
    backdrop: 'blur(24px) saturate(1.8)',
    blur: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(26, 26, 26, 0.95)'
  },
  animations: {
    duration: '0.3s',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)' // Smooth stealth animation
  }
}

const ghostTheme: ThemeConfig = {
  name: 'ghost',
  colors: {
    // Background colors - Ghost Theme (Phantom-styled with purple accents)
    background: '#fffdf8', // Main background
    surface: '#ffffff',
    surfaceHover: '#f5f2ff', // Slight purple tint
    glass: 'rgba(255, 253, 248, 0.85)',
    glassBorder: 'rgba(171, 159, 242, 0.25)',

    // Text colors - Ghost Theme (dark foreground from provided colors)
    textPrimary: '#1c1c1c', // Dark text from provided
    textSecondary: '#3c315b', // From secondary colors
    textMuted: '#8d8c8a', // From greyscale
    textInverse: '#fffdf8',

    // Brand colors - Ghost Theme (enhanced Phantom-style)
    primary: '#ab9ff2', // Primary purple from provided
    primaryHover: '#9b8fe2', // Darker version
    secondary: '#ffd13f', // Phantom yellow from provided
    accent: '#e2dffe', // Light purple from provided

    // Enhanced Phantom palette
    success: '#2ec08b', // Green from provided
    warning: '#ff7243', // Orange from provided
    error: '#ff7243', // Using orange for error
    info: '#4a8712', // Green from provided

    // Border and outline - Ghost theme (enhanced with purple accents)
    border: '#d2d0cc', // From greyscale
    borderLight: '#e8e6e2', // From greyscale
    outline: '#ab9ff2', // Primary purple
    outlineFocus: '#9b8fe2',
    primaryBorder: 'rgba(171, 159, 242, 0.3)', // Enhanced purple border
    primaryBorderLight: 'rgba(171, 159, 242, 0.15)',

    // Shadow colors - Ghost theme with purple tint
    shadow: 'rgba(171, 159, 242, 0.12)', // Purple-tinted shadows
    shadowLight: 'rgba(171, 159, 242, 0.06)', // Light purple shadows
    shadowHeavy: 'rgba(171, 159, 242, 0.2)', // Heavy purple shadows
    purpleShadow: 'rgba(171, 159, 242, 0.25)', // Dedicated purple shadow

    // Special colors - Enhanced Ghost Theme gradients
    gradientStart: '#fffdf8',
    gradientEnd: '#e2dffe',
    overlay: 'rgba(171, 159, 242, 0.08)',

    // Phantom-style gradients
    phantomGradient: 'linear-gradient(135deg, rgba(171, 159, 242, 0.1) 0%, rgba(171, 159, 242, 0.05) 50%, rgba(171, 159, 242, 0.1) 100%)',
    phantomGlow: 'radial-gradient(ellipse at center, rgba(171, 159, 242, 0.15) 0%, transparent 70%)'
  },
  glassStyles: {
    backdrop: 'blur(24px) saturate(1.9)',
    blur: '24px',
    border: '1px solid rgba(171, 159, 242, 0.25)',
    background: 'rgba(255, 253, 248, 0.85)'
  },
  animations: {
    duration: '0.3s',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)' // Smooth Phantom-style animation
  }
}

export const themes: Record<string, ThemeConfig> = {
  light: lightTheme,
  dark: darkTheme,
  stealth: stealthTheme,
  ghost: ghostTheme
}

export function useThemeConfig() {
  const { theme } = useTheme()
  return themes[theme] || darkTheme
}

// Utility functions for common theme patterns
export function createGlassStyles(theme: ThemeConfig, additionalStyles: React.CSSProperties = {}) {
  return {
    background: theme.glassStyles.background,
    border: theme.glassStyles.border,
    backdropFilter: theme.glassStyles.backdrop,
    ...additionalStyles
  }
}

export function createButtonStyles(
  theme: ThemeConfig,
  variant: 'primary' | 'secondary' | 'ghost' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md'
) {
  const baseStyles: React.CSSProperties = {
    transition: `all ${theme.animations.duration} ${theme.animations.easing}`,
    fontWeight: 500,
    borderRadius: '0.75rem',
    cursor: 'pointer',
    outline: 'none',
    border: '1px solid transparent',
  }

  const sizeStyles = {
    sm: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    md: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
    lg: { padding: '1rem 2rem', fontSize: '1.125rem' }
  }

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.textInverse,
      '&:hover': {
        backgroundColor: theme.colors.primaryHover,
        transform: 'scale(1.05)'
      }
    },
    secondary: {
      backgroundColor: theme.colors.surface,
      color: theme.colors.textPrimary,
      borderColor: theme.colors.border,
      '&:hover': {
        backgroundColor: theme.colors.surfaceHover,
        transform: 'scale(1.05)'
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.textSecondary,
      '&:hover': {
        backgroundColor: theme.colors.surfaceHover,
        color: theme.colors.textPrimary
      }
    }
  }

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant]
  }
}

export function createModalStyles(theme: ThemeConfig) {
  return {
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      backgroundColor: theme.colors.overlay,
      backdropFilter: 'blur(8px)',
      zIndex: 9998
    },
    modal: {
      position: 'fixed' as const,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: '1rem',
      boxShadow: `0 25px 70px ${theme.colors.shadowHeavy}, 0 12px 32px ${theme.colors.primary}20`,
      backdropFilter: theme.glassStyles.backdrop,
      zIndex: 9999,
      maxHeight: '90vh',
      overflow: 'auto'
    }
  }
}

export function createInputStyles(theme: ThemeConfig) {
  return {
    backgroundColor: theme.colors.glass,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    color: theme.colors.textPrimary,
    fontSize: '0.875rem',
    transition: `all ${theme.animations.duration} ${theme.animations.easing}`,
    outline: 'none',
    '&:focus': {
      borderColor: theme.colors.outline,
      boxShadow: `0 0 0 3px ${theme.colors.outline}20`
    },
    '&::placeholder': {
      color: theme.colors.textMuted
    }
  }
}
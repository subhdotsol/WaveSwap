'use client'

import React, { useState } from 'react'
import { useThemeConfig } from '@/lib/theme'

interface CopyToClipboardProps {
  text: string
  className?: string
  children?: React.ReactNode
}

export function CopyToClipboard({ text, className = '', children }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false)
  const theme = useThemeConfig()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (children) {
    return (
      <button
        onClick={handleCopy}
        className={className}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
        style={{
          transition: `all ${theme.animations.duration} ${theme.animations.easing}`,
        }}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center justify-center p-1 rounded transition-all ${className}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      style={{
        backgroundColor: copied ? theme.colors.primary + '20' : 'transparent',
        color: copied ? theme.colors.primary : theme.colors.textMuted,
        transition: `all ${theme.animations.duration} ${theme.animations.easing}`,
      }}
      onMouseEnter={(e) => {
        if (!copied) {
          e.currentTarget.style.backgroundColor = theme.colors.surfaceHover + '40'
          e.currentTarget.style.color = theme.colors.textSecondary
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = theme.colors.textMuted
        }
      }}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transition: `all ${theme.animations.duration} ${theme.animations.easing}`,
        }}
      >
        {copied ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        )}
      </svg>
    </button>
  )
}
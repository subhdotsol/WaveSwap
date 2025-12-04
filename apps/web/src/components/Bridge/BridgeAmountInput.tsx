'use client'

import { useState, useCallback } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  MinusIcon,
  DivideIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useThemeConfig } from '@/lib/theme'
import { Token } from '@/types/token'
import { formatBalance } from '@/lib/token-formatting'

interface BridgeAmountInputProps {
  value: string
  onChange: (value: string) => void
  token: Token | null
  maxAmount?: string
  balance?: string
  decimals?: number
  placeholder?: string
  disabled?: boolean
  label?: string
  showBalance?: boolean
  quickActions?: boolean
}

export function BridgeAmountInput({
  value,
  onChange,
  token,
  maxAmount,
  balance,
  decimals = 9,
  placeholder = '0.00',
  disabled = false,
  label,
  showBalance = true,
  quickActions = true
}: BridgeAmountInputProps) {
  const theme = useThemeConfig()

  // Get max amount for input
  const getMaxAmount = useCallback((): string => {
    if (!balance || !decimals) return '0'

    const bal = parseFloat(balance) || 0
    return (bal / Math.pow(10, decimals)).toString()
  }, [balance, decimals])

  // Quick action handlers
  const handleMax = useCallback(() => {
    onChange(getMaxAmount())
  }, [onChange, getMaxAmount])

  const handleHalf = useCallback(() => {
    const max = getMaxAmount()
    const half = (parseFloat(max || '0') / 2).toString()
    onChange(half)
  }, [onChange, getMaxAmount])

  const handleQuarter = useCallback(() => {
    const max = getMaxAmount()
    const quarter = (parseFloat(max || '0') / 4).toString()
    onChange(quarter)
  }, [onChange, getMaxAmount])

  const handleDouble = useCallback(() => {
    const max = getMaxAmount()
    const current = parseFloat(value) || 0
    const maxVal = parseFloat(max) || 0

    if (current >= maxVal) {
      onChange(max)
    } else {
      const doubled = (current * 2).toString()
      onChange(Math.min(parseFloat(doubled), maxVal).toString())
    }
  }, [value, onChange, getMaxAmount])

  // Clear input
  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
            {label}
          </label>
          {showBalance && balance && (
            <div className="text-xs font-medium" style={{ color: theme.colors.textMuted }}>
              Balance: {formatBalance(balance, decimals)} {token?.symbol}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            // Only allow numbers and decimal point
            const value = e.target.value
            if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
              onChange(value)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-4 rounded-xl font-mono text-lg
            transition-all duration-200
            ${disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-opacity-80 focus:border-opacity-100'
            }
          `}
          style={{
            background: `${theme.colors.surface}60`,
            border: `2px solid ${
              disabled
                ? theme.colors.borderLight
                : theme.colors.border
            }`,
            color: disabled ? theme.colors.textMuted : theme.colors.textPrimary,
            outline: 'none',
            paddingRight: quickActions ? '140px' : '16px'
          }}
          onFocus={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = theme.colors.primary
              e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary}20`
            }
          }}
          onBlur={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = theme.colors.border
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        />

        {quickActions && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {/* Clear Button */}
            {value && (
              <button
                onClick={handleClear}
                disabled={disabled}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-[1.05]"
                style={{
                  background: `${theme.colors.surface}80`,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textMuted
                }}
                title="Clear"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            )}

            {/* Quick Actions */}
            <div className="flex items-center bg-black/10 rounded-lg p-1">
              {/* 25% Button */}
              <button
                onClick={handleQuarter}
                disabled={disabled || !balance}
                className="p-1.5 rounded hover:bg-black/20 transition-all duration-200"
                title="25%"
                style={{ color: theme.colors.textMuted }}
              >
                <div className="text-xs font-bold">¼</div>
              </button>

              {/* 50% Button */}
              <button
                onClick={handleHalf}
                disabled={disabled || !balance}
                className="p-1.5 rounded hover:bg-black/20 transition-all duration-200"
                title="50%"
                style={{ color: theme.colors.textMuted }}
              >
                <div className="text-xs font-bold">½</div>
              </button>

              {/* 2x Button */}
              <button
                onClick={handleDouble}
                disabled={disabled || !balance || !value}
                className="p-1.5 rounded hover:bg-black/20 transition-all duration-200"
                title="2x"
                style={{ color: theme.colors.textMuted }}
              >
                <div className="text-xs font-bold">2×</div>
              </button>

              {/* Max Button */}
              <button
                onClick={handleMax}
                disabled={disabled || !balance}
                className="p-1.5 rounded hover:bg-black/20 transition-all duration-200"
                title="Max"
                style={{ color: theme.colors.textMuted }}
              >
                <ArrowDownTrayIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input Validation Hint */}
      {maxAmount && parseFloat(value) > parseFloat(maxAmount) && (
        <div className="text-xs" style={{ color: theme.colors.warning }}>
          Amount exceeds available balance
        </div>
      )}
    </div>
  )
}
'use client'

import { forwardRef } from 'react'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, placeholder = "0.00", disabled = false, readOnly = false, className = "" }, ref) => {
    // Format the value for display
    const formatDisplayValue = (val: string) => {
      if (!val || val === '0' || val === '0.00') return ''

      // Parse the number and ensure proper formatting
      const num = parseFloat(val)
      if (isNaN(num)) return val

      // Split into integer and decimal parts
      const parts = val.split('.')
      const integerPart = parts[0] || '0'
      const decimalPart = parts[1] ? `.${parts[1]}` : ''

      return `${integerPart}${decimalPart}`
    }

    const displayValue = formatDisplayValue(value)

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`glass-input w-full h-16 px-4 text-3xl font-bold text-left disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          style={{
            fontFamily: 'Orbitron, sans-serif',
            color: 'var(--wave-text)',
            cursor: readOnly ? 'default' : 'text',
            letterSpacing: '0.05em'
          }}
        />
      </div>
    )
  }
)

AmountInput.displayName = 'AmountInput'

export { AmountInput }
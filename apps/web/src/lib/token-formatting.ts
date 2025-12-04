/**
 * Standardized token amount formatting utilities
 * Ensures consistent decimal display across all components
 */

/**
 * Format token amount with proper decimal precision
 * @param amount - The token amount as a string or number
 * @param decimals - Number of decimal places (default: 9 for Solana tokens)
 * @returns Formatted amount string
 */
export function formatTokenAmount(amount: string | number, decimals: number = 9): string {
  try {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num) || num === 0) return '0'

    // For very small amounts, show more precision
    if (num < 0.001) {
      return num.toFixed(Math.min(decimals, 8)).replace(/\.?0+$/, '')
    }

    // For normal amounts, use locale formatting
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    })
  } catch {
    return '0'
  }
}

/**
 * Format balance from raw units to human readable format
 * @param balance - Raw balance as string
 * @param decimals - Token decimals
 * @returns Formatted balance string
 */
export function formatBalance(balance: string, decimals: number): string {
  try {
    if (!balance) return '0'
    const bal = parseFloat(balance) || 0
    const formatted = bal / Math.pow(10, decimals)

    if (formatted === 0) return '0'
    if (formatted < 0.000001) return '<0.000001'
    if (formatted < 0.001) return formatted.toFixed(6)
    if (formatted < 0.01) return formatted.toFixed(4)
    if (formatted < 1) return formatted.toFixed(2)
    if (formatted >= 1000) return formatted.toLocaleString(undefined, { maximumFractionDigits: 2 })

    return formatted.toFixed(2)
  } catch {
    return '0'
  }
}

/**
 * Format price with appropriate precision
 * @param price - Price value
 * @param decimals - Decimal places to show
 * @returns Formatted price string
 */
export function formatPrice(price: number | string, decimals: number = 6): string {
  try {
    const num = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(num) || num === 0) return '0.00'

    return num.toFixed(decimals)
  } catch {
    return '0.00'
  }
}

/**
 * Format percentage change
 * @param value - Percentage value
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | string): string {
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0.00%'

    const formatted = num.toFixed(2)
    return `${num >= 0 ? '+' : ''}${formatted}%`
  } catch {
    return '0.00%'
  }
}
/**
 * Error Handling System for WaveSwap
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  NO_ROUTE = 'NO_ROUTE',
  WALLET = 'WALLET',
  INVALID_INPUT = 'INVALID_INPUT',
  PRICE_IMPACT = 'PRICE_IMPACT',
  SLIPPAGE = 'SLIPPAGE',
  TRANSACTION = 'TRANSACTION',
  UNKNOWN = 'UNKNOWN',
}

export interface WaveSwapError {
  type: ErrorType
  message: string
  details?: string
  canRetry: boolean
  action?: string
}

/**
 * Parse error and return structured error object
 */
export function parseError(error: unknown): WaveSwapError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('enotfound')) {
      return {
        type: ErrorType.NETWORK,
        message: 'Network connection error',
        details: 'Unable to connect to swap services. Check your internet connection.',
        canRetry: true,
        action: 'Retry'
      }
    }

    // No route errors
    if (message.includes('no route') || message.includes('no available routes')) {
      return {
        type: ErrorType.NO_ROUTE,
        message: 'No swap route available',
        details: 'Try a different token pair or smaller amount',
        canRetry: true,
        action: 'Try different pair'
      }
    }

    // Insufficient balance
    if (message.includes('insufficient') || message.includes('balance')) {
      return {
        type: ErrorType.INSUFFICIENT_BALANCE,
        message: 'Insufficient balance',
        details: 'You don\'t have enough tokens for this swap',
        canRetry: false,
        action: 'Check balance'
      }
    }

    // Wallet errors
    if (message.includes('wallet') || message.includes('not connected')) {
      return {
        type: ErrorType.WALLET,
        message: 'Wallet error',
        details: 'Please connect your wallet to continue',
        canRetry: true,
        action: 'Connect wallet'
      }
    }

    // Invalid input
    if (message.includes('invalid') || message.includes('amount')) {
      return {
        type: ErrorType.INVALID_INPUT,
        message: 'Invalid input',
        details: 'Please enter a valid amount',
        canRetry: false,
        action: 'Check input'
      }
    }

    // Price impact
    if (message.includes('price impact') || message.includes('slippage')) {
      return {
        type: ErrorType.PRICE_IMPACT,
        message: 'High price impact',
        details: 'This swap may result in unfavorable pricing',
        canRetry: true,
        action: 'Reduce amount'
      }
    }

    // Transaction errors
    if (message.includes('transaction') || message.includes('signature')) {
      return {
        type: ErrorType.TRANSACTION,
        message: 'Transaction failed',
        details: error.message,
        canRetry: true,
        action: 'Retry swap'
      }
    }

    // Unknown error
    return {
      type: ErrorType.UNKNOWN,
      message: 'Something went wrong',
      details: error.message,
      canRetry: true,
      action: 'Try again'
    }
  }

  return {
    type: ErrorType.UNKNOWN,
    message: 'Unknown error occurred',
    details: String(error),
    canRetry: true,
    action: 'Try again'
  }
}

/**
 * Get error display config
 */
export function getErrorDisplay(error: WaveSwapError): {
  color: string
  icon: string
  severity: 'low' | 'medium' | 'high'
} {
  switch (error.type) {
    case ErrorType.NETWORK:
      return { color: '#F59E0B', icon: '⚠️', severity: 'medium' }
    
    case ErrorType.INSUFFICIENT_BALANCE:
      return { color: '#EF4444', icon: '💰', severity: 'high' }
    
    case ErrorType.NO_ROUTE:
      return { color: '#F59E0B', icon: '🔄', severity: 'medium' }
    
    case ErrorType.WALLET:
      return { color: '#EF4444', icon: '👛', severity: 'high' }
    
    case ErrorType.INVALID_INPUT:
      return { color: '#F59E0B', icon: '⚠️', severity: 'low' }
    
    case ErrorType.PRICE_IMPACT:
      return { color: '#F59E0B', icon: '📊', severity: 'medium' }
    
    case ErrorType.TRANSACTION:
      return { color: '#EF4444', icon: '❌', severity: 'high' }
    
    default:
      return { color: '#EF4444', icon: '⚠️', severity: 'medium' }
  }
}


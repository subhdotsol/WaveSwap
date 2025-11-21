/**
 * Token Types and Interfaces for WaveSwap DEX
 *
 * This file defines all token-related interfaces and provides common token configurations.
 */

export interface Token {
  address: string
  chainId: number
  decimals: number
  name: string
  symbol: string
  logoURI: string
  tags: string[]
  isConfidentialSupported: boolean
  isNative: boolean
  addressable: boolean
  // Encifher privacy support
  encifherSupported?: boolean
  privacyProviders?: string[]
  minPrivateAmount?: string
}

export interface TokenWithBalance extends Token {
  balance: string
  balanceUsd?: number
  isBalanceLoading: boolean
}


export interface SwapContext {
  inputToken: Token | null
  outputToken: Token | null
  inputAmount: string
  outputAmount: string
  swapMode: SwapMode
  quote: SwapQuote | null
  balances: Map<string, string>
  isLoading: boolean
  error: string | null
  structuredError: any
  progress: SwapProgress | null
  availableTokens: Token[]
  setInputToken: (token: Token) => void
  setOutputToken: (token: Token) => void
  setInputAmount: (amount: string) => void
  setOutputAmount: (amount: string) => void
  setSwapMode: (mode: SwapMode) => void
  swap: () => Promise<void>
  getQuote: () => Promise<void>
  refreshBalances: () => Promise<void>
  clearQuote: () => void
  clearError: () => void
  cancelSwap: () => void
}

export interface SwapQuote {
  inputMint: string
  outputMint: string
  inputAmount: string
  outputAmount: string
  priceImpactPct: number
  routePlan?: any[]
  swapTransaction?: string
  setupTransaction?: string
  computeUnitLimit?: number
  computeUnitPriceMicroLamports?: number
  fee?: {
    amount: string
    mint: string
    pct: string
  }
}

export interface SwapProgress {
  status: SwapStatus
  message: string
  currentStep: number
  totalSteps: number
  txid?: string
  error?: string
}

export interface SwapExecution {
  quote: SwapQuote
  transaction: any
  wrappingTx?: any
  privacyMode: boolean
  status: SwapStatus
  error?: string
  orderId?: string
}

export enum SwapStatus {
  IDLE = 'idle',
  QUOTING = 'quoting',
  QUOTE_READY = 'quote_ready',
  BUILDING_TRANSACTION = 'building_transaction',
  TRANSACTION_READY = 'transaction_ready',
  WRAPPING = 'wrapping',
  UNWRAPPING = 'unwrapping',
  SWAPPING = 'swapping',
  CONFIRMING = 'confirming',
  SIGNING_TRANSACTION = 'signing_transaction',
  SENDING_TRANSACTION = 'sending_transaction',
  CONFIRMING_TRANSACTION = 'confirming_transaction',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum SwapMode {
  NORMAL = 'normal',
  PRIVATE = 'private'
}

/**
 * Encifher Order Status for tracking confidential transactions
 */
export enum EncifherOrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Common tokens with working Solana token list logo URLs
 */
export const COMMON_TOKENS: Token[] = [
  {
    address: 'So11111111111111111111111111111111111111112',
    chainId: 101,
    decimals: 9,
    name: 'Solana',
    symbol: 'SOL',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    tags: ['native', 'solana'],
    isConfidentialSupported: true,
    isNative: true,
    addressable: true,
    encifherSupported: true,
    privacyProviders: ['encifher', 'arcium'],
    minPrivateAmount: '0.001'
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    chainId: 101,
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    tags: ['stablecoin', 'usdc'],
    isConfidentialSupported: true,
    isNative: false,
    addressable: true,
    encifherSupported: true,
    privacyProviders: ['encifher', 'arcium'],
    minPrivateAmount: '1'
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    chainId: 101,
    decimals: 6,
    name: 'Tether USD',
    symbol: 'USDT',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
    tags: ['stablecoin', 'usdt'],
    isConfidentialSupported: true,
    isNative: false,
    addressable: true
  },
  {
    address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    chainId: 101,
    decimals: 9,
    name: 'Marinade Staked SOL',
    symbol: 'mSOL',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
    tags: ['defi', 'staking', 'msol'],
    isConfidentialSupported: true,
    isNative: false,
    addressable: true
  },
  {
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    chainId: 101,
    decimals: 6,
    name: 'Raydium',
    symbol: 'RAY',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
    tags: ['defi', 'dex', 'raydium'],
    isConfidentialSupported: false,
    isNative: false,
    addressable: true
  },
  {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    chainId: 101,
    decimals: 5,
    name: 'Bonk',
    symbol: 'BONK',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png',
    tags: ['meme', 'bonk'],
    isConfidentialSupported: false,
    isNative: false,
    addressable: true
  },
  {
    address: 'WormsgfugeESKtdMuFBCKUGGDYLSUcfvhoMsV9fqN3G',
    chainId: 101,
    decimals: 6,
    name: 'Wormhole',
    symbol: 'W',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/WormsgfugeESKtdMuFBCKUGGDYLSUcfvhoMsV9fqN3G/logo.png',
    tags: ['bridge', 'wormhole'],
    isConfidentialSupported: false,
    isNative: false,
    addressable: true
  },
  {
    address: 'jutoGL3C1tJKHbC9VwFhkLq2uf1q4AXaMGuqJrEy5XA',
    chainId: 101,
    decimals: 6,
    name: 'Jupiter',
    symbol: 'JUP',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/jutoGL3C1tJKHbC9VwFhkLq2uf1q4AXaMGuqJrEy5XA/logo.png',
    tags: ['defi', 'airdrop', 'jupiter'],
    isConfidentialSupported: false,
    isNative: false,
    addressable: true
  }
]

/**
 * Confidential tokens (wrapped tokens with privacy)
 */
export const CONFIDENTIAL_TOKENS: Token[] = [
  {
    address: 'cSo11111111111111111111111111111111111111112',
    chainId: 101,
    decimals: 9,
    name: 'Confidential SOL',
    symbol: 'cSOL',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    tags: ['confidential', 'wrapped'],
    isConfidentialSupported: true,
    isNative: false,
    addressable: false
  },
  {
    address: 'cEPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    chainId: 101,
    decimals: 6,
    name: 'Confidential USDC',
    symbol: 'cUSDC',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    tags: ['confidential', 'wrapped', 'stablecoin'],
    isConfidentialSupported: true,
    isNative: false,
    addressable: false
  },
  {
    address: 'cDezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    chainId: 101,
    decimals: 5,
    name: 'Confidential BONK',
    symbol: 'cBONK',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png',
    tags: ['confidential', 'wrapped', 'meme'],
    isConfidentialSupported: true,
    isNative: false,
    addressable: false
  }
]

/**
 * Get available tokens based on privacy mode
 */
export async function getAvailableTokens(privacyMode: boolean): Promise<Token[]> {
  let tokens: Token[]
  if (privacyMode) {
    // In privacy mode, show regular tokens that support confidential operations
    tokens = COMMON_TOKENS.filter(t => t.isConfidentialSupported)
  } else {
    tokens = COMMON_TOKENS
  }

  // Return tokens without any API enrichment for now
  return tokens
}



export interface SwapContextType {
  inputToken: Token | null
  outputToken: Token | null
  inputAmount: string
  outputAmount: string
  swapMode: SwapMode
  quote: SwapQuote | null
  balances: Map<string, string>
  isLoading: boolean
  error: string | null
  structuredError: WaveSwapError | null
  progress: SwapProgress | null
  availableTokens: Token[]
  setInputToken: (token: Token) => void
  setOutputToken: (token: Token) => void
  setInputAmount: (amount: string) => void
  setOutputAmount: (amount: string) => void
  setSwapMode: (mode: SwapMode) => void
  swap: () => Promise<void>
  getQuote: () => Promise<void>
  refreshBalances: () => Promise<void>
  clearQuote: () => void
  clearError: () => void
  cancelSwap: () => void
}

export interface WaveSwapError {
  code: string
  message: string
  details?: any
  action?: string
  recoverable: boolean
}
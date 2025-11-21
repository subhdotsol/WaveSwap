/**
 * Token Management using Jupiter Token API
 * API: https://hub.jup.ag/docs/token-api/
 */

import { Connection, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token'
import { Token } from '@/types/token'

const JUPITER_TOKEN_API = 'https://lite-api.jup.ag/tokens/v2'
const JUPITER_TOKEN_LIST_API = 'https://token.jup.ag/all'

export interface JupiterToken {
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string
  tags?: string[]
  daily_volume?: number
  freeze_authority?: string | null
  mint_authority?: string | null
}

/**
 * Fetch token icons from Jupiter API for common tokens
 */
// Simple cache for token icons to avoid repeated API calls
const tokenIconCache = new Map<string, string>()

// Pre-populate cache with common token icons to avoid API calls
const commonTokenIcons: Record<string, string> = {
  'So11111111111111111111111111111111111111112': 'https://img-cdn.jup.ag/tokens/SOL.svg',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'https://img-cdn.jup.ag/tokens/USDC.svg',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'https://img-cdn.jup.ag/tokens/USDT.svg',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'https://img-cdn.jup.ag/tokens/mSOL.svg',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'https://img-cdn.jup.ag/tokens/RAY.svg',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'https://img-cdn.jup.ag/tokens/BONK.svg',
  'WormsgfugeESKtdMuFBCKUGGDYLSUcfvhoMsV9fqN3G': 'https://img-cdn.jup.ag/tokens/W.svg',
  'jutoGL3C1tJKHbC9VwFhkLq2uf1q4AXaMGuqJrEy5XA': 'https://img-cdn.jup.ag/tokens/JUP.svg'
}

// Initialize cache with common token icons
Object.entries(commonTokenIcons).forEach(([address, icon]) => {
  tokenIconCache.set(address, icon)
})

export async function enrichTokenIcons(tokens: Token[]): Promise<Token[]> {
  console.log('🎨 Using hardcoded token icons, no API calls')

  // Simply return tokens as-is since they already have working logoURIs
  return tokens
}

/**
 * Fetch user's token accounts and balances
 */
export async function getUserTokens(
  connection: Connection,
  walletAddress: PublicKey
): Promise<Token[]> {
  try {
    // Get all token accounts owned by user
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletAddress,
      { programId: TOKEN_PROGRAM_ID }
    )

    const userTokens: Token[] = []

    // Always add SOL (native) - even with 0 balance for display
    const solBalance = await connection.getBalance(walletAddress)
    userTokens.push({
      address: 'So11111111111111111111111111111111111111112',
      chainId: 101,
      decimals: 9,
      name: 'Solana',
      symbol: 'SOL',
      logoURI: 'https://img-cdn.jup.ag/tokens/SOL.svg',
      tags: ['native'],
      isConfidentialSupported: true,
      isNative: true,
      addressable: true,
    })

      // Add common tokens even if balance is 0 so users can see them
    const defaultTokens = getDefaultTokens().filter(token =>
      token.address !== 'So11111111111111111111111111111111111111112'
    )

    // Start with default tokens (skip confidential tokens here)
    userTokens.push(...defaultTokens.filter(token => !token.address.startsWith('c')))

    // Update token info for tokens user actually has
    for (const { account } of tokenAccounts.value) {
      const parsedInfo = account.data.parsed.info
      const mint = parsedInfo.mint
      const balance = parsedInfo.tokenAmount.uiAmount || 0

      try {
        const tokenInfo = await fetchTokenInfo(mint)
        if (tokenInfo) {
          // Check if we already have this token in our list
          const existingIndex = userTokens.findIndex(t => t.address === mint)

          const tokenData = {
            address: mint,
            chainId: 101,
            decimals: tokenInfo.decimals,
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            logoURI: tokenInfo.logoURI || `https://img-cdn.jup.ag/tokens/${tokenInfo.symbol}.svg`,
            tags: tokenInfo.tags || [],
            isConfidentialSupported: ['SOL', 'USDC', 'USDT', 'mSOL', 'BONK', 'RAY', 'WIF'].includes(tokenInfo.symbol),
            isNative: false,
            addressable: true,
          }

          if (existingIndex >= 0) {
            // Update existing token
            userTokens[existingIndex] = { ...userTokens[existingIndex], ...tokenData }
          } else if (balance > 0) {
            // Add new token only if it has balance
            userTokens.push(tokenData)
          }
        }
      } catch (error) {
        console.log(`Skipping unknown token: ${mint}`)
      }
    }

    return userTokens
  } catch (error) {
    console.error('Error fetching user tokens:', error)
    // Return default tokens on error
    return getDefaultTokens()
  }
}

/**
 * Fetch token info from Jupiter Token API
 */
async function fetchTokenInfo(mint: string): Promise<JupiterToken | null> {
  try {
    const response = await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${mint}`)
    if (!response.ok) return null

    const data = await response.json()
    if (Array.isArray(data) && data.length > 0) {
      const token = data.find((t: any) => (t.address || t.mint) === mint) || data[0]
      return {
        address: token.address || token.mint,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoURI: token.logoURI || token.image || `https://img-cdn.jup.ag/tokens/${token.symbol}.svg`,
        tags: token.tags,
      }
    }
    return null
  } catch (error) {
    return null
  }
}

/**
 * Fetch all tradable tokens from Jupiter
 */
export async function getAllTradableTokens(): Promise<Token[]> {
  try {
    const response = await fetch(`${JUPITER_TOKEN_API}/tag?tag=verified`)
    if (!response.ok) {
      throw new Error('Failed to fetch tokens from Jupiter')
    }

    const data: JupiterToken[] = await response.json()
    
    return data.map(token => ({
      address: token.address,
      chainId: 101,
      decimals: token.decimals,
      name: token.name,
      symbol: token.symbol,
      logoURI: token.logoURI || '',
      tags: token.tags || [],
      isConfidentialSupported: ['SOL', 'USDC', 'USDT', 'mSOL', 'BONK'].includes(token.symbol),
      isNative: token.address === 'So11111111111111111111111111111111111111112',
      addressable: true,
    }))
  } catch (error) {
    console.error('Error fetching tradable tokens:', error)
    // Return default tokens if API fails
    return getDefaultTokens()
  }
}

/**
 * Get default token list (fallback)
 */
export function getDefaultTokens(): Token[] {
  return [
    {
      address: 'So11111111111111111111111111111111111111112',
      chainId: 101,
      decimals: 9,
      name: 'Solana',
      symbol: 'SOL',
      logoURI: 'https://img-cdn.jup.ag/tokens/SOL.svg',
      tags: ['native'],
      isConfidentialSupported: true,
      isNative: true,
      addressable: true,
    },
    {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      chainId: 101,
      decimals: 6,
      name: 'USD Coin',
      symbol: 'USDC',
      logoURI: 'https://img-cdn.jup.ag/tokens/USDC.svg',
      tags: ['stablecoin'],
      isConfidentialSupported: true,
      isNative: false,
      addressable: true,
    },
    {
      address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      chainId: 101,
      decimals: 6,
      name: 'Tether USD',
      symbol: 'USDT',
      logoURI: 'https://img-cdn.jup.ag/tokens/USDT.svg',
      tags: ['stablecoin'],
      isConfidentialSupported: true,
      isNative: false,
      addressable: true,
    },
    {
      address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
      chainId: 101,
      decimals: 9,
      name: 'Marinade Staked SOL',
      symbol: 'mSOL',
      logoURI: 'https://img-cdn.jup.ag/tokens/mSOL.svg',
      tags: ['defi', 'staking'],
      isConfidentialSupported: true,
      isNative: false,
      addressable: true,
    },
    {
      address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
      chainId: 101,
      decimals: 6,
      name: 'Raydium',
      symbol: 'RAY',
      logoURI: 'https://img-cdn.jup.ag/tokens/RAY.svg',
      tags: ['defi', 'dex'],
      isConfidentialSupported: false,
      isNative: false,
      addressable: true,
    },
    {
      address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      chainId: 101,
      decimals: 5,
      name: 'Bonk',
      symbol: 'BONK',
      logoURI: 'https://img-cdn.jup.ag/tokens/BONK.svg',
      tags: ['meme'],
      isConfidentialSupported: false,
      isNative: false,
      addressable: true,
    },
    {
      address: 'WormsgfugeESKtdMuFBCKUGGDYLSUcfvhoMsV9fqN3G',
      chainId: 101,
      decimals: 6,
      name: 'Wormhole',
      symbol: 'W',
      logoURI: 'https://img-cdn.jup.ag/tokens/W.svg',
      tags: ['bridge'],
      isConfidentialSupported: false,
      isNative: false,
      addressable: true,
    },
    {
      address: 'jutoGL3C1tJKHbC9VwFhkLq2uf1q4AXaMGuqJrEy5XA',
      chainId: 101,
      decimals: 6,
      name: 'Jupiter',
      symbol: 'JUP',
      logoURI: 'https://img-cdn.jup.ag/tokens/JUP.svg',
      tags: ['defi', 'airdrop'],
      isConfidentialSupported: false,
      isNative: false,
      addressable: true,
    },
  ]
}

/**
 * Get token balance for a specific mint
 */
export async function getTokenBalance(
  connection: Connection,
  walletAddress: PublicKey,
  mint: string
): Promise<string> {
  try {
    // Handle SOL balance
    if (mint === 'So11111111111111111111111111111111111111112') {
      const balance = await connection.getBalance(walletAddress)
      return balance.toString()
    }

    // Handle confidential tokens (they have different mint formats)
    if (mint.startsWith('c') || !isBase58(mint)) {
      console.log(`Skipping balance fetch for confidential/invalid mint: ${mint}`)
      return '0'
    }

    // Validate that mint is a valid public key before creating PublicKey
    try {
      const mintPubkey = new PublicKey(mint)
    } catch (pubkeyError) {
      console.log(`Invalid public key format for mint: ${mint}`)
      return '0'
    }

    // Handle SPL token balance using proper SPL token methods
    const mintPubkey = new PublicKey(mint)
    const tokenAccount = await getAssociatedTokenAddress(mintPubkey, walletAddress)

    try {
      const account = await getAccount(connection, tokenAccount)
      return account.amount.toString()
    } catch (accountError) {
      // Token account doesn't exist
      return '0'
    }
  } catch (error) {
    console.error(`Error fetching token balance for ${mint}:`, error)
    return '0'
  }
}

/**
 * Check if a string is valid base58 format
 */
function isBase58(str: string): boolean {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
  return base58Regex.test(str)
}


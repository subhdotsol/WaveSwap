/**
 * Hook for managing token list with Jupiter Token API integration
 * API Docs: https://hub.jup.ag/docs/token-api/
 */

import { useState, useEffect, useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Token } from '@/types/token'
import { getUserTokens, getDefaultTokens } from '@/lib/tokens'

const JUPITER_TOKEN_SEARCH_API = 'https://lite-api.jup.ag/tokens/v2/search'

export function useTokenList(walletAddress: PublicKey | null) {
  const { connection } = useConnection()
  const [allTokens, setAllTokens] = useState<Token[]>(getDefaultTokens())
  const [userTokens, setUserTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(false)

  // Load user's wallet tokens
  const loadUserTokens = useCallback(async () => {
    if (!walletAddress || !connection) {
      setUserTokens([])
      return
    }

    try {
      setLoading(true)
      const tokens = await getUserTokens(connection, walletAddress)
      setUserTokens(tokens)
      
      // Merge with default tokens
      const tokenMap = new Map<string, Token>()
      
      tokens.forEach(t => tokenMap.set(t.address, t))
      getDefaultTokens().forEach(t => {
        if (!tokenMap.has(t.address)) {
          tokenMap.set(t.address, t)
        }
      })
      
      setAllTokens(Array.from(tokenMap.values()))
    } catch (error) {
      console.error('Error loading user tokens:', error)
      setAllTokens(getDefaultTokens())
    } finally {
      setLoading(false)
    }
  }, [walletAddress, connection])

  // Search tokens from Jupiter API
  const searchTokens = useCallback(async (query: string): Promise<Token[]> => {
    if (!query || query.length < 2) {
      return allTokens
    }

    try {
      const response = await fetch(`${JUPITER_TOKEN_SEARCH_API}?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        return allTokens.filter(t => 
          t.symbol.toLowerCase().includes(query.toLowerCase()) ||
          t.name.toLowerCase().includes(query.toLowerCase())
        )
      }

      const data = await response.json()
      
      if (Array.isArray(data)) {
        return data.slice(0, 20).map((token: any) => ({
          address: token.address,
          chainId: 101,
          decimals: token.decimals,
          name: token.name,
          symbol: token.symbol,
          logoURI: token.logoURI || '',
          tags: token.tags || [],
          isConfidentialSupported: ['SOL', 'USDC', 'USDT', 'mSOL'].includes(token.symbol),
          isNative: token.address === 'So11111111111111111111111111111111111111112',
          addressable: true,
        }))
      }
    } catch (error) {
      console.error('Error searching tokens:', error)
    }

    return allTokens.filter(t => 
      t.symbol.toLowerCase().includes(query.toLowerCase()) ||
      t.name.toLowerCase().includes(query.toLowerCase())
    )
  }, [allTokens])

  useEffect(() => {
    loadUserTokens()
  }, [loadUserTokens])

  return {
    allTokens,
    userTokens,
    loading,
    searchTokens,
    refreshTokens: loadUserTokens,
  }
}


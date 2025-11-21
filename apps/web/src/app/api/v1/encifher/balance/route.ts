/**
 * Encifher Private Balance API Route
 *
 * Retrieves private balances for user tokens in Encifher private pools.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { EncifherClient, EncifherUtils } from '@/lib/encifher'

interface BalanceRequest {
  userPublicKey: string
  tokens: string[]
  signature: string
  messageHash: string
}

interface BalanceResponse {
  success: boolean
  balances?: Array<{
    token: string
    encryptedBalance: string
    isVisible: boolean
    lastUpdated: number
  }>
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<BalanceResponse>> {
  try {
    // Parse request body
    const body: BalanceRequest = await request.json()
    const { userPublicKey, tokens, signature, messageHash } = body

    // Validate required fields
    if (!userPublicKey || !tokens || !Array.isArray(tokens) || !signature || !messageHash) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userPublicKey, tokens, signature, messageHash'
      }, { status: 400 })
    }

    // Check if Encifher is configured
    if (!EncifherUtils.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Encifher SDK not configured'
      }, { status: 503 })
    }

    // Validate user public key
    try {
      new PublicKey(userPublicKey)
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid user public key'
      }, { status: 400 })
    }

    // Validate tokens array
    if (tokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Tokens array cannot be empty'
      }, { status: 400 })
    }

    // Validate token addresses
    for (const token of tokens) {
      try {
        new PublicKey(token)
      } catch {
        return NextResponse.json({
          success: false,
          error: `Invalid token address: ${token}`
        }, { status: 400 })
      }
    }

    // Initialize connection and Encifher client
    const heliusRpc = process.env.NEXT_PUBLIC_ENCIFHER_RPC_URL || 'https://api-mainnet.helius-rpc.com/v0/transactions/?api-key=5daea224-93bd-415d-ac58-9e5777656acf'
    const connection = new Connection(heliusRpc)
    const config = EncifherUtils.getConfig()!

    // Initialize Encifher client
    const encifher = EncifherUtils.createClient(connection, config)

    // Get private balances
    const balances = await encifher.getPrivateBalance(
      new PublicKey(userPublicKey),
      tokens
    )

    // Convert to response format
    const balanceArray = Array.from(balances.entries()).map(([tokenAddress, balance]) => ({
      token: tokenAddress,
      encryptedBalance: balance.encryptedBalance,
      isVisible: balance.isVisible,
      lastUpdated: balance.lastUpdated
    }))

    return NextResponse.json({
      success: true,
      balances: balanceArray
    })

  } catch (error) {
    console.error('Error in Encifher balance API:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid signature')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid signature for private balance query'
        }, { status: 400 })
      }

      if (error.message.includes('User not found')) {
        return NextResponse.json({
          success: false,
          error: 'User not found in private pool'
        }, { status: 404 })
      }

      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({
          success: false,
          error: 'Unauthorized to access private balances'
        }, { status: 401 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to get private balances'
    }, { status: 500 })
  }
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to get private balances.'
  }, { status: 405 })
}
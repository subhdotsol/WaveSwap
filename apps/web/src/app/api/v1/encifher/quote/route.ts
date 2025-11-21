/**
 * Encifher Private Swap Quote API Route
 *
 * Provides private swap quotes using Encifher SDK for privacy-enabled swaps.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { EncifherClient, EncifherUtils } from '@/lib/encifher'
import { Token } from '@/types/token'

interface QuoteRequest {
  inputMint: string
  outputMint: string
  amountIn: string
  userPublicKey: string
  slippageBps?: number
}

interface QuoteResponse {
  success: boolean
  quote?: {
    inputMint: string
    outputMint: string
    amountIn: string
    expectedOutAmount: string
    slippage: string
    route: string
    priceImpact?: string
    estimatedTime: string
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<QuoteResponse>> {
  try {
    // Parse request body
    const body: QuoteRequest = await request.json()
    const { inputMint, outputMint, amountIn, userPublicKey, slippageBps = 100 } = body

    // Validate required fields
    if (!inputMint || !outputMint || !amountIn || !userPublicKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: inputMint, outputMint, amountIn, userPublicKey'
      }, { status: 400 })
    }

    // Check if Encifher is configured
    if (!EncifherUtils.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Encifher SDK not configured'
      }, { status: 503 })
    }

    // Validate input amount
    const amount = parseFloat(amountIn)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid amount: must be a positive number'
      }, { status: 400 })
    }

    // Initialize connection and Encifher client
    const heliusRpc = process.env.NEXT_PUBLIC_ENCIFHER_RPC_URL || 'https://api-mainnet.helius-rpc.com/v0/transactions/?api-key=5daea224-93bd-415d-ac58-9e5777656acf'
    const connection = new Connection(heliusRpc)
    const config = EncifherUtils.getConfig()!

    // Initialize Encifher client
    const encifher = EncifherUtils.createClient(connection, config)

    // Check if tokens are supported by Encifher
    if (!encifher.isPrivacySupported(inputMint) || !encifher.isPrivacySupported(outputMint)) {
      return NextResponse.json({
        success: false,
        error: 'One or both tokens are not supported for private swaps'
      }, { status: 400 })
    }

    // Get private swap quote
    const quote = await encifher.getPrivateSwapQuote({
      inMint: inputMint,
      outMint: outputMint,
      amountIn: amountIn
    })

    return NextResponse.json({
      success: true,
      quote: {
        inputMint,
        outputMint,
        amountIn,
        expectedOutAmount: quote.expectedOutAmount,
        slippage: quote.slippage,
        route: quote.route,
        priceImpact: quote.priceImpact,
        estimatedTime: '1-3 minutes'
      }
    })

  } catch (error) {
    console.error('Error in Encifher quote API:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Insufficient liquidity')) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient liquidity for private swap'
        }, { status: 400 })
      }

      if (error.message.includes('Invalid token')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid token address'
        }, { status: 400 })
      }

      if (error.message.includes('Amount too small')) {
        return NextResponse.json({
          success: false,
          error: 'Amount too small for private transaction'
        }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to get private swap quote'
    }, { status: 500 })
  }
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to get private swap quotes.'
  }, { status: 405 })
}
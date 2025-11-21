/**
 * API Route for Swap Quotes
 *
 * Provides Jupiter API integration for getting swap quotes.
 * Acts as a proxy to Jupiter's quote API with additional validation
 * and privacy mode considerations.
 *
 * References:
 * - Jupiter Quote API: https://station.jup.ag/api/v6/quote
 * - Jupiter Documentation: https://hub.jup.ag/docs/swap-api/
 */

import { NextRequest, NextResponse } from 'next/server'
import { JupiterAPI } from '@/lib/jupiter'
import { Connection } from '@solana/web3.js'
import { config } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const inputMint = searchParams.get('inputMint')
    const outputMint = searchParams.get('outputMint')
    const amount = searchParams.get('amount')
    const slippageBps = searchParams.get('slippageBps')
    const userPublicKey = searchParams.get('userPublicKey')
    const privacyMode = searchParams.get('privacyMode') === 'true'

    // Validate required parameters
    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: inputMint, outputMint, amount' },
        { status: 400 }
      )
    }

    // Validate amount
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      )
    }

    // Initialize Jupiter API with configured RPC
    const connection = new Connection(config.rpc.url)
    const jupiterApi = new JupiterAPI(connection)

    // Build quote parameters
    const quoteParams = {
      inputMint,
      outputMint,
      amount,
      slippageBps: slippageBps ? parseInt(slippageBps) : 50,
      userPublicKey: userPublicKey || undefined,
      onlyDirectRoutes: false,
      asLegacyTransaction: false
    }

    console.log('[Jupiter Quote API] Requesting quote:', { quoteParams, privacyMode })

    // Get quote from Jupiter
    const quote = await jupiterApi.getQuote(quoteParams)
    
    console.log('[Jupiter Quote API] Quote received successfully:', {
      inputMint: quote.inputMint,
      outputMint: quote.outputMint,
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      priceImpact: quote.priceImpactPct,
      routeCount: quote.routePlan?.length || 0
    })

    // Add privacy mode information to response
    const enhancedQuote = {
      ...quote,
      privacyMode,
      privacySupported: true, // TODO: Check actual Arcium support for tokens
      routing: privacyMode ? 'confidential' : 'standard'
    }

    return NextResponse.json({
      success: true,
      quote: enhancedQuote,
      metadata: {
        requestedAt: new Date().toISOString(),
        privacyMode,
        apiVersion: 'v1'
      }
    })

  } catch (error) {
    console.error('Error in swap quote API:', error)

    // Handle different error types
    if (error instanceof Error) {
      // Check for specific Jupiter API errors
      if (error.message.includes('Insufficient liquidity')) {
        return NextResponse.json(
          { error: 'Insufficient liquidity for this swap route' },
          { status: 400 }
        )
      }

      if (error.message.includes('No routes found')) {
        return NextResponse.json(
          { error: 'No available routes for this token pair' },
          { status: 400 }
        )
      }

      if (error.message.includes('Invalid token')) {
        return NextResponse.json(
          { error: 'One or more tokens are invalid or not supported' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while getting quote',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Support POST requests for complex quote parameters
    const { inputMint, outputMint, amount, slippageBps, userPublicKey, privacyMode, ...extraParams } = body

    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: inputMint, outputMint, amount' },
        { status: 400 }
      )
    }

    // Validate amount
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      )
    }

    // Initialize Jupiter API with configured RPC
    const connection = new Connection(config.rpc.url)
    const jupiterApi = new JupiterAPI(connection)

    // Build quote parameters with extra options
    const quoteParams = {
      inputMint,
      outputMint,
      amount,
      slippageBps: slippageBps || 50,
      userPublicKey,
      onlyDirectRoutes: extraParams.onlyDirectRoutes || false,
      asLegacyTransaction: extraParams.asLegacyTransaction || false,
      feeAccount: extraParams.feeAccount,
      platformFeeBps: extraParams.platformFeeBps
    }

    console.log('Getting Jupiter quote (POST):', { quoteParams, privacyMode })

    // Get quote from Jupiter
    const quote = await jupiterApi.getQuote(quoteParams)

    // Add privacy mode information to response
    const enhancedQuote = {
      ...quote,
      privacyMode: privacyMode || false,
      privacySupported: true, // TODO: Check actual Arcium support for tokens
      routing: privacyMode ? 'confidential' : 'standard'
    }

    return NextResponse.json({
      success: true,
      quote: enhancedQuote,
      metadata: {
        requestedAt: new Date().toISOString(),
        privacyMode: privacyMode || false,
        apiVersion: 'v1',
        method: 'POST'
      }
    })

  } catch (error) {
    console.error('Error in swap quote API (POST):', error)

    return NextResponse.json(
      {
        error: 'Internal server error while getting quote',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}
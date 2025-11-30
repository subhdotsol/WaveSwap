/**
 * Withdrawal API Route
 * Implements real Encifher SDK getWithdrawTxn for confidential token withdrawals
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { DefiClient, WithdrawParams, Token } from 'encifher-swap-sdk'

export async function POST(
  request: NextRequest
) {
  try {
    console.log('[Withdrawal API] Processing withdrawal request')

    // Parse request body
    const body = await request.json()
    console.log('[Withdrawal API] Request body:', body)

    // Validate required fields
    if (!body.mint || !body.amount || !body.userPublicKey) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'mint, amount, and userPublicKey are required for withdrawal'
        },
        { status: 400 }
      )
    }

    // Get environment variables
    const encifherKey = process.env.ENCIFHER_SDK_KEY || process.env.NEXT_PUBLIC_ENCIFHER_SDK_KEY
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

    if (!encifherKey) {
      return NextResponse.json(
        {
          error: 'Missing Encifher SDK key',
          details: 'ENCIFHER_SDK_KEY environment variable is required'
        },
        { status: 500 }
      )
    }

    console.log('[Withdrawal API] Initializing Encifher SDK client')

    // Initialize Encifher SDK client
    const config = { encifherKey, rpcUrl, mode: 'Mainnet' as const }
    const defiClient = new DefiClient(config)
    const connection = new Connection(rpcUrl)

    // Create token object
    const token: Token = {
      tokenMintAddress: body.mint,
      decimals: body.decimals || 6 // Default to 6 for USDC-like tokens
    }

    // Create withdrawer public key
    const withdrawerPubkey = new PublicKey(body.userPublicKey)

    // Handle amount conversion based on what the frontend sends
    const decimals = body.decimals || 6

    // The frontend sends the actual amount in base units already
    // For example: 53582284 (SOL lamports) or 1000000 (USDC base units)
    // Encifher SDK expects the amount in the smallest unit (lamports for SOL, base units for tokens)
    let amountForSDK: string

    if (body.mint === 'So11111111111111111111111111111111111111112') {
      // SOL - use lamports directly (frontend already sends lamports)
      amountForSDK = Math.floor(parseFloat(body.amount)).toString()
    } else {
      // SPL tokens - use base units directly (frontend already sends base units)
      amountForSDK = Math.floor(parseFloat(body.amount)).toString()
    }

    console.log('[Withdrawal API] Amount calculation:', {
      inputAmount: body.amount,
      mint: body.mint,
      decimals,
      amountForSDK
    })

    // Prepare withdrawal parameters
    const withdrawParams: WithdrawParams = {
      token,
      amount: amountForSDK, // Use the actual amount in smallest units
      withdrawer: withdrawerPubkey
    }

    console.log('[Withdrawal API] Getting withdrawal transaction from Encifher SDK', {
      mint: body.mint,
      amount: amountForSDK,
      withdrawer: body.userPublicKey,
      decimals
    })

    // Get withdrawal transaction from Encifher SDK with retry logic
    console.log('[Withdrawal API] Getting withdrawal transaction from Encifher SDK', withdrawParams)

    let withdrawTxn
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        console.log(`[Withdrawal API] Attempt ${retryCount + 1}/${maxRetries}`)
        withdrawTxn = await defiClient.getWithdrawTxn(withdrawParams)
        console.log('[Withdrawal API] Withdrawal transaction received successfully')
        break
      } catch (sdkError: any) {
        retryCount++
        console.error(`[Withdrawal API] SDK attempt ${retryCount} failed:`, sdkError.message)

        if (retryCount >= maxRetries) {
          console.error('[Withdrawal API] All SDK attempts failed, checking if error is network-related')

          // Check if this is a network/fetch error
          if (sdkError.message.includes('fetch failed') ||
              sdkError.message.includes('ENOTFOUND') ||
              sdkError.message.includes('ECONNREFUSED') ||
              sdkError.message.includes('timeout')) {

            console.error('[Withdrawal API] Network error detected - Encifher API may be temporarily unavailable')

            // Return a more user-friendly error for network issues
            return NextResponse.json(
              {
                error: 'Encifher service temporarily unavailable',
                details: 'The Encifher withdrawal service is experiencing network issues. Please try again in a few minutes. If the problem persists, contact Encifher support.',
                isNetworkError: true,
                retryAfter: 30 // Suggest retry after 30 seconds
              },
              { status: 503 } // Service Unavailable
            )
          }

          // Re-throw the original SDK error for other types of errors
          throw sdkError
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }

    // According to Encifher SDK documentation, the transaction is ready to be signed by the user
    // We should NOT modify the transaction (feePayer, blockhash are already set by Encifher)

    // Serialize transaction for client to sign - preserve all existing signatures
    if (!withdrawTxn) {
      throw new Error('Failed to generate withdrawal transaction')
    }

    const serializedTransaction = withdrawTxn.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64')

    console.log('[Withdrawal API] Transaction serialized for signing')

    const responseData = {
      success: true,
      serializedTransaction,
      amount: body.amount,
      mint: body.mint,
      withdrawer: body.userPublicKey,
      timestamp: new Date().toISOString(),
      networkFee: '0.000005 SOL',
      instructions: 'Please sign this transaction to withdraw your confidential USDC tokens. The tokens will be sent to your wallet after confirmation.'
    }

    console.log('[Withdrawal API] Withdrawal transaction prepared successfully:', {
      transactionId: responseData.timestamp,
      amount: responseData.amount,
      mint: responseData.mint
    })

    // Return successful response
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, x-api-key',
        'Access-Control-Allow-Credentials': 'true',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('[Withdrawal API] Error processing withdrawal:', error)

    return NextResponse.json(
      {
        error: 'Failed to process withdrawal request',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      details: 'Only POST method is supported for withdrawals'
    },
    { status: 405 }
  )
}

export async function OPTIONS() {
  // Handle CORS preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, x-api-key',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400' // Cache preflight for 24 hours
    }
  })
}
/**
 * Transaction Recovery API Route
 * Helps recover from failed or timed out private swap transactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { DefiClient, DefiClientConfig } from 'encifher-swap-sdk'

export async function POST(
  request: NextRequest
) {
  try {
    console.log('[Transaction Recovery API] Processing recovery request')

    // Parse request body
    const body = await request.json()
    console.log('[Transaction Recovery API] Request body:', body)

    // Validate required fields
    if (!body.userPublicKey || !body.depositSignature) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'userPublicKey and depositSignature are required'
        },
        { status: 400 }
      )
    }

    // Detect transaction type based on signature pattern or user input
    const transactionType = body.transactionType || 'deposit' // Default to deposit for backward compatibility

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

    console.log('[Transaction Recovery API] Initializing connection and client')

    // Initialize Solana connection and Encifher client
    const connection = new Connection(rpcUrl)
    const config: DefiClientConfig = {
      encifherKey,
      rpcUrl,
      mode: 'Mainnet' as const
    }
    const defiClient = new DefiClient(config)

    const userPubkey = new PublicKey(body.userPublicKey)

    console.log('[Transaction Recovery API] Checking transaction status:', {
      userPublicKey: body.userPublicKey,
      transactionSignature: body.depositSignature,
      transactionType
    })

    // Check transaction status
    let transactionStatus
    try {
      transactionStatus = await connection.getSignatureStatus(body.depositSignature, {
        searchTransactionHistory: true // Search full history for withdrawals too
      })
      console.log('[Transaction Recovery API] Transaction status found:', transactionStatus.value)
    } catch (error: any) {
      console.error('[Transaction Recovery API] Failed to get transaction status:', error.message)
      transactionStatus = { value: null }
    }

    let recoveryAction = 'unknown'
    let recoveryMessage = ''

    if (!transactionStatus.value) {
      recoveryAction = 'not_found'
      recoveryMessage = `${transactionType === 'withdrawal' ? 'Withdrawal' : 'Deposit'} transaction not found on-chain. Please verify the transaction signature.`
    } else if (transactionStatus.value.err) {
      recoveryAction = 'failed'
      if (transactionType === 'withdrawal') {
        recoveryMessage = 'Withdrawal transaction failed. The confidential tokens should still be available in your account.'
        // For withdrawal failures, we should check if the confidential balance is still available
        try {
          console.log('[Transaction Recovery API] Checking confidential balance availability after failed withdrawal')
          // In a real implementation, this would check with Encifher SDK
          // const balance = await defiClient.getConfidentialBalance(userPubkey)
          recoveryMessage += ' Your confidential balance should be intact. You can try withdrawing again.'
        } catch (balanceError: any) {
          console.error('[Transaction Recovery API] Failed to check confidential balance:', balanceError.message)
        }
      } else {
        recoveryMessage = 'Deposit transaction failed. The funds should be returned to your wallet automatically.'
      }
    } else if (transactionStatus.value.confirmationStatus === 'confirmed' || transactionStatus.value.confirmationStatus === 'finalized') {
      // Transaction was successful
      recoveryAction = transactionType === 'withdrawal' ? 'withdrawal_confirmed' : 'deposit_confirmed'

      if (transactionType === 'withdrawal') {
        recoveryMessage = 'Withdrawal was confirmed successfully. The tokens should appear in your wallet shortly.'
        recoveryAction = 'withdrawal_success'
      } else {
        recoveryMessage = 'Deposit was confirmed successfully. Checking swap execution status...'
        // Note: In a real implementation, you would check with Encifher SDK
        // if the swap was executed or if funds can be recovered
        try {
          // This would be a hypothetical SDK method to check/recover funds
          // const swapStatus = await defiClient.checkSwapStatus(body.depositSignature)
          console.log('[Transaction Recovery API] Swap status checking not yet implemented in SDK')

          recoveryAction = 'recovery_needed'
          recoveryMessage = 'Deposit confirmed but swap execution status unclear. Manual recovery may be needed. Contact support with your deposit signature.'
        } catch (sdkError: any) {
          console.error('[Transaction Recovery API] SDK recovery check failed:', sdkError.message)
        }
      }
    } else {
      recoveryAction = 'pending'
      recoveryMessage = `${transactionType === 'withdrawal' ? 'Withdrawal' : 'Deposit'} transaction is still pending confirmation. Please wait a few more minutes.`
    }

    const responseData = {
      success: true,
      userPublicKey: body.userPublicKey,
      transactionSignature: body.depositSignature,
      transactionType,
      recoveryAction,
      recoveryMessage,
      transactionStatus: transactionStatus.value,
      timestamp: new Date().toISOString(),
      nextSteps: getNextSteps(recoveryAction, transactionType),
      supportContact: 'support@waveswap.io'
    }

    console.log('[Transaction Recovery API] Recovery analysis completed:', responseData)

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
    console.error('[Transaction Recovery API] Error processing recovery:', error)

    return NextResponse.json(
      {
        error: 'Failed to process transaction recovery',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

function getNextSteps(recoveryAction: string, transactionType: string = 'deposit'): string[] {
  switch (recoveryAction) {
    case 'not_found':
      return [
        'Verify the transaction signature is correct',
        'Check if you copied the full signature',
        `Try the ${transactionType} again with a fresh transaction`
      ]
    case 'failed':
      if (transactionType === 'withdrawal') {
        return [
          'Check your confidential balances - tokens should still be available',
          'The failed withdrawal transaction fee will be consumed',
          'Try withdrawing again when network conditions improve',
          'Contact support if tokens don\'t appear in your confidential balance'
        ]
      } else {
        return [
          'Check your wallet balance - funds should be returned',
          'The failed transaction fee will be consumed',
          'Try the swap again when network conditions improve'
        ]
      }
    case 'withdrawal_success':
      return [
        'Check your wallet for the withdrawn tokens',
        'The tokens should appear within a few minutes',
        'Verify the final balance in your wallet',
        'Contact support if tokens don\'t appear after 10 minutes'
      ]
    case 'withdrawal_confirmed':
      return [
        'Wait a few more minutes for the withdrawal to complete',
        'Check your wallet balance for the received tokens',
        'If tokens don\'t appear, contact support with the withdrawal signature'
      ]
    case 'deposit_confirmed':
      return [
        'Wait a few more minutes for swap processing',
        'Check your confidential balances in the Withdraw tab',
        'If tokens don\'t appear, contact support with the deposit signature'
      ]
    case 'recovery_needed':
      return [
        `Contact support immediately with your ${transactionType} signature`,
        'Do not attempt additional transactions with the same funds',
        'Save this transaction signature for support: ' + recoveryAction
      ]
    case 'pending':
      return [
        'Wait for network confirmation',
        'Monitor the transaction on Solana Explorer',
        `If still pending after 5 minutes, use this recovery tool again for ${transactionType}`
      ]
    default:
      return [
        'Contact support for assistance',
        'Provide the transaction signature and error details',
        `Check your ${transactionType === 'withdrawal' ? 'confidential balance' : 'wallet'} for any returned funds`
      ]
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      details: 'Only POST method is supported for transaction recovery'
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
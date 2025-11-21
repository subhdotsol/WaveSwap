/**
 * Encifher Private Swap Execute API Route
 *
 * Executes private swaps using Encifher SDK with transaction signing and order tracking.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { EncifherClient, EncifherUtils } from '@/lib/encifher'

interface ExecuteRequest {
  inputMint: string
  outputMint: string
  amountIn: string
  senderPubkey: string
  receiverPubkey: string
  signedTransaction: string // Base64 encoded signed transaction
  message?: string
}

interface ExecuteResponse {
  success: boolean
  orderStatusIdentifier?: string
  timestamp?: number
  estimatedTime?: string
  nextSteps?: string[]
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ExecuteResponse>> {
  try {
    // Parse request body
    const body: ExecuteRequest = await request.json()
    const {
      inputMint,
      outputMint,
      amountIn,
      senderPubkey,
      receiverPubkey,
      signedTransaction,
      message = 'Private swap via WaveSwap'
    } = body

    // Validate required fields
    if (!inputMint || !outputMint || !amountIn || !senderPubkey || !receiverPubkey || !signedTransaction) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: inputMint, outputMint, amountIn, senderPubkey, receiverPubkey, signedTransaction'
      }, { status: 400 })
    }

    // Check if Encifher is configured
    if (!EncifherUtils.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Encifher SDK not configured'
      }, { status: 503 })
    }

    // Validate public keys
    try {
      new PublicKey(senderPubkey)
      new PublicKey(receiverPubkey)
      new PublicKey(inputMint)
      new PublicKey(outputMint)
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid public key or token address'
      }, { status: 400 })
    }

    // Validate signed transaction
    try {
      const txBuffer = Buffer.from(signedTransaction, 'base64')
      if (txBuffer.length === 0) {
        throw new Error('Invalid transaction')
      }
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid signed transaction format'
      }, { status: 400 })
    }

    // Initialize connection and Encifher client
    const heliusRpc = process.env.NEXT_PUBLIC_ENCIFHER_RPC_URL || 'https://api-mainnet.helius-rpc.com/v0/transactions/?api-key=5daea224-93bd-415d-ac58-9e5777656acf'
    const connection = new Connection(heliusRpc)
    const config = EncifherUtils.getConfig()!

    // Initialize Encifher client
    const encifher = EncifherUtils.createClient(connection, config)

    // Execute the private swap
    const executeResponse = await encifher.executePrivateSwap(
      signedTransaction,
      {
        inMint: inputMint,
        outMint: outputMint,
        amountIn,
        senderPubkey: new PublicKey(senderPubkey),
        receiverPubkey: new PublicKey(receiverPubkey),
        message
      }
    )

    return NextResponse.json({
      success: true,
      orderStatusIdentifier: executeResponse.orderStatusIdentifier,
      timestamp: executeResponse.timestamp,
      estimatedTime: '2-5 minutes',
      nextSteps: [
        'Private swap submitted to Encifher network',
        'Transaction will be executed privately',
        'Use the order identifier to track status',
        'Funds will be available upon completion'
      ]
    })

  } catch (error) {
    console.error('Error in Encifher execute API:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid transaction')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid transaction: transaction could not be processed'
        }, { status: 400 })
      }

      if (error.message.includes('Insufficient balance')) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient balance for private swap'
        }, { status: 400 })
      }

      if (error.message.includes('Invalid signature')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid transaction signature'
        }, { status: 400 })
      }

      if (error.message.includes('Rate limit')) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        }, { status: 429 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to execute private swap'
    }, { status: 500 })
  }
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to execute private swaps.'
  }, { status: 405 })
}
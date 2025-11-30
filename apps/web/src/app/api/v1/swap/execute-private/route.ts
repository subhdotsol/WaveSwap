/**
 * Private Swap Execution API
 * Executes confidential swap transactions using Encifher SDK
 * Also saves transaction to database for history tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { DefiClient, SignedSwapParams, DefiClientConfig } from 'encifher-swap-sdk'
import { PrismaClient, SwapStatus } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest
) {
  try {
    console.log('[Private Swap Execute] Processing private swap execution request')

    // Parse request body
    const body = await request.json()
    console.log('[Private Swap Execute] Request body:', body)

    // Validate required fields
    if (!body.serializedTxn || !body.orderDetails) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'serializedTxn and orderDetails are required'
        },
        { status: 400 }
      )
    }

    // Save transaction to database for history tracking
    console.log('[Private Swap Execute] Saving transaction to database')
    try {
      const intentId = `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const userAddress = body.orderDetails.senderPubkey

      // Ensure user exists first
      await prisma.user.upsert({
        where: { address: userAddress },
        update: {},
        create: { address: userAddress }
      })

      const swap = await prisma.swap.create({
        data: {
          intentId,
          userAddress,
          inputToken: body.orderDetails.inMint,
          outputToken: body.orderDetails.outMint,
          inputAmount: BigInt(body.orderDetails.amountIn),
          feeBps: 50, // Default fee
          privacyMode: true, // Private swap
          slippageBps: 50, // Default slippage
          status: SwapStatus.ENCRYPTED_PENDING,
        },
      })

      // Create initial stage
      await prisma.swapStage.create({
        data: {
          swapId: swap.id,
          name: 'Private Swap Initiated',
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      console.log('[Private Swap Execute] Transaction saved to database with intentId:', intentId)
    } catch (dbError) {
      console.error('[Private Swap Execute] Failed to save transaction to database:', dbError)
      // Continue with execution even if database save fails
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

    console.log('[Private Swap Execute] Initializing Encifher SDK client')

    // Initialize Encifher SDK client
    const config: DefiClientConfig = {
      encifherKey,
      rpcUrl,
      mode: 'Mainnet' as const
    }
    const defiClient = new DefiClient(config)

    // Prepare execute swap parameters
    const swapParams: SignedSwapParams = {
      serializedTxn: body.serializedTxn,
      orderDetails: {
        inMint: body.orderDetails.inMint,
        outMint: body.orderDetails.outMint,
        amountIn: body.orderDetails.amountIn,
        senderPubkey: new PublicKey(body.orderDetails.senderPubkey),
        receiverPubkey: new PublicKey(body.orderDetails.receiverPubkey),
        message: body.orderDetails.message || `Private swap ${body.orderDetails.inMint} to ${body.orderDetails.outMint}`
      }
    }

    console.log('[Private Swap Execute] Executing private swap transaction', {
      inMint: swapParams.orderDetails.inMint,
      outMint: swapParams.orderDetails.outMint,
      amountIn: swapParams.orderDetails.amountIn,
      sender: swapParams.orderDetails.senderPubkey.toString(),
      receiver: swapParams.orderDetails.receiverPubkey.toString(),
      message: swapParams.orderDetails.message
    })

    // Execute swap transaction using Encifher SDK
    const executeResponse = await defiClient.executeSwapTxn(swapParams)

    console.log('[Private Swap Execute] Swap executed successfully:', {
      orderStatusIdentifier: executeResponse.orderStatusIdentifier
    })

    const responseData = {
      success: true,
      timestamp: new Date().toISOString(),
      ...executeResponse,
      message: `Private swap initiated! Order ID: ${String(executeResponse.orderStatusIdentifier).slice(0, 12)}...`
    }

    console.log('[Private Swap Execute] Execute swap response prepared successfully')

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
    console.error('[Private Swap Execute] Error executing private swap:', error)

    return NextResponse.json(
      {
        error: 'Failed to execute private swap',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      details: 'Only POST method is supported for private swap execution'
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
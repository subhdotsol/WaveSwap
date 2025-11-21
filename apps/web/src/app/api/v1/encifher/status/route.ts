/**
 * Encifher Order Status API Route
 *
 * Tracks the status of private swap orders submitted to Encifher network.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { EncifherClient, EncifherUtils } from '@/lib/encifher'

interface StatusRequest {
  orderStatusIdentifier: string
}

interface StatusResponse {
  success: boolean
  status?: {
    orderStatusIdentifier: string
    status: 'pending' | 'completed' | 'failed'
    timestamp?: number
    details?: any
    progress?: number
    estimatedTime?: string
    message?: string
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<StatusResponse>> {
  try {
    // Parse request body
    const body: StatusRequest = await request.json()
    const { orderStatusIdentifier } = body

    // Validate required fields
    if (!orderStatusIdentifier) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: orderStatusIdentifier'
      }, { status: 400 })
    }

    // Check if Encifher is configured
    if (!EncifherUtils.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Encifher SDK not configured'
      }, { status: 503 })
    }

    // Initialize connection and Encifher client
    const heliusRpc = process.env.NEXT_PUBLIC_ENCIFHER_RPC_URL || 'https://api-mainnet.helius-rpc.com/v0/transactions/?api-key=5daea224-93bd-415d-ac58-9e5777656acf'
    const connection = new Connection(heliusRpc)
    const config = EncifherUtils.getConfig()!

    // Initialize Encifher client
    const encifher = EncifherUtils.createClient(connection, config)

    // Get order status
    const orderStatus = await encifher.getOrderStatus(orderStatusIdentifier)

    // Calculate progress based on status
    let progress = 0
    let estimatedTime = ''
    let message = ''

    switch (orderStatus.status) {
      case 'pending':
        progress = 50 // In progress
        estimatedTime = '1-3 minutes remaining'
        message = 'Private transaction is being processed...'
        break
      case 'completed':
        progress = 100
        estimatedTime = 'Completed'
        message = 'Private transaction completed successfully!'
        break
      case 'failed':
        progress = 0
        estimatedTime = 'Failed'
        message = 'Private transaction failed. Please try again.'
        break
      default:
        progress = 25
        estimatedTime = 'Checking status...'
        message = 'Determining transaction status...'
    }

    return NextResponse.json({
      success: true,
      status: {
        orderStatusIdentifier: orderStatus.orderStatusIdentifier,
        status: orderStatus.status,
        timestamp: orderStatus.timestamp,
        details: orderStatus.details,
        progress,
        estimatedTime,
        message
      }
    })

  } catch (error) {
    console.error('Error in Encifher status API:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Order not found')) {
        return NextResponse.json({
          success: false,
          error: 'Order not found. Please check the order identifier.'
        }, { status: 404 })
      }

      if (error.message.includes('Invalid order identifier')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid order identifier format'
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
      error: 'Failed to get order status'
    }, { status: 500 })
  }
}

// Handle GET requests for polling (allow order identifier in query params)
export async function GET(request: NextRequest): Promise<NextResponse<StatusResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const orderStatusIdentifier = searchParams.get('orderStatusIdentifier')

    if (!orderStatusIdentifier) {
      return NextResponse.json({
        success: false,
        error: 'Missing orderStatusIdentifier query parameter'
      }, { status: 400 })
    }

    // Reuse the POST logic
    const body = { orderStatusIdentifier }
    const mockRequest = {
      json: async () => body
    } as NextRequest

    return await POST(mockRequest)

  } catch (error) {
    console.error('Error in Encifher status GET API:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get order status'
    }, { status: 500 })
  }
}
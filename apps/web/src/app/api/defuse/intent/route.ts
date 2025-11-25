import { NextRequest, NextResponse } from 'next/server'

// Near Intents solver relay endpoint
const SOLVER_RELAY_URL = 'https://solver-relay-v2.chaindefuser.com/rpc'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quoteId, recipient } = body

    if (!quoteId || !recipient) {
      return NextResponse.json(
        { error: 'Missing required parameters: quoteId, recipient' },
        { status: 400 }
      )
    }

    // Create intent request matching defuse protocol
    const intentRequest = {
      method: 'publishIntent',
      params: {
        quoteId,
        recipient,
        // Additional parameters that might be needed
        maxDeadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        minDeadline: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
      }
    }

    console.log('Making intent request:', JSON.stringify(intentRequest, null, 2))

    // Call Near Intents solver relay
    const response = await fetch(SOLVER_RELAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(intentRequest)
    })

    if (!response.ok) {
      throw new Error(`Solver relay error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Intent response:', JSON.stringify(data, null, 2))

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || 'Intent creation failed' },
        { status: 400 }
      )
    }

    // Return the intent data
    const result = data.result

    return NextResponse.json({
      intentId: result.intentId,
      status: result.status,
      intentHash: result.intentHash,
      quoteId: result.quoteId,
      // Additional fields
      createdAt: result.createdAt,
      expiresAt: result.expiresAt
    })

  } catch (error) {
    console.error('Intent API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get intent status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const intentId = searchParams.get('intentId')

    if (!intentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: intentId' },
        { status: 400 }
      )
    }

    // Get intent status request
    const statusRequest = {
      method: 'getIntentStatus',
      params: {
        intentId
      }
    }

    console.log('Making status request:', JSON.stringify(statusRequest, null, 2))

    // Call Near Intents solver relay
    const response = await fetch(SOLVER_RELAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusRequest)
    })

    if (!response.ok) {
      throw new Error(`Solver relay error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Status response:', JSON.stringify(data, null, 2))

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || 'Status check failed' },
        { status: 400 }
      )
    }

    // Return the status data
    const result = data.result

    return NextResponse.json({
      intentId: result.intentId,
      status: result.status, // "pending", "completed", "failed"
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      transactions: result.transactions || [],
      error: result.error
    })

  } catch (error) {
    console.error('Intent status API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
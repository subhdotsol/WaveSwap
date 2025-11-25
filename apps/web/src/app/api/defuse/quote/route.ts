import { NextRequest, NextResponse } from 'next/server'

// Near Intents solver relay endpoint
const SOLVER_RELAY_URL = 'https://solver-relay-v2.chaindefuser.com/rpc'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokenIn, tokenOut, amountIn, swapType } = body

    if (!tokenIn || !tokenOut || !amountIn || !swapType) {
      return NextResponse.json(
        { error: 'Missing required parameters: tokenIn, tokenOut, amountIn, swapType' },
        { status: 400 }
      )
    }

    // Create quote request matching defuse protocol
    const quoteRequest = {
      method: 'quote',
      params: {
        tokenIn,
        tokenOut,
        amountIn,
        swapType: swapType === 'EXACT_INPUT' ? 0 : 1 // 0 for EXACT_INPUT, 1 for EXACT_OUTPUT
      }
    }

    console.log('Making quote request:', JSON.stringify(quoteRequest, null, 2))

    // Call Near Intents solver relay
    const response = await fetch(SOLVER_RELAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quoteRequest)
    })

    if (!response.ok) {
      throw new Error(`Solver relay error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Quote response:', JSON.stringify(data, null, 2))

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || 'Quote request failed' },
        { status: 400 }
      )
    }

    // Transform response to match our interface
    const result = data.result

    // Calculate fee USD value (simplified - in real implementation would use current ETH price)
    const feeUsdValue = parseFloat(result.fee.amount) / Math.pow(10, 18) * 2000 // Assuming ETH = $2000

    return NextResponse.json({
      id: result.id,
      tokenIn: {
        defuseAssetId: result.tokenIn.defuseAssetId,
        symbol: result.tokenIn.symbol,
        decimals: result.tokenIn.decimals,
        amount: result.tokenIn.amount
      },
      tokenOut: {
        defuseAssetId: result.tokenOut.defuseAssetId,
        symbol: result.tokenOut.symbol,
        decimals: result.tokenOut.decimals,
        amount: result.tokenOut.amount
      },
      fee: {
        amount: result.fee.amount,
        usdValue: feeUsdValue
      },
      priceImpact: result.priceImpact ? parseFloat(result.priceImpact) * 100 : undefined
    })

  } catch (error) {
    console.error('Quote API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
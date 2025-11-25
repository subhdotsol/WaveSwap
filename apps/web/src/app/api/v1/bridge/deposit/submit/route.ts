import { NextRequest, NextResponse } from 'next/server'
import { nearIntentBridge } from '@/lib/nearIntentBridge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quoteId, txHash, txData } = body

    if (!quoteId || !txHash) {
      return NextResponse.json(
        { error: 'Quote ID and transaction hash are required' },
        { status: 400 }
      )
    }

    await nearIntentBridge.submitDepositTx(quoteId, txHash, txData)
    return NextResponse.json({ success: true, message: 'Deposit submitted successfully' })
  } catch (error) {
    console.error('Bridge deposit submit API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to submit deposit',
        code: 'DEPOSIT_ERROR'
      },
      { status: 500 }
    )
  }
}
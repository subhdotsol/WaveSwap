import { NextRequest, NextResponse } from 'next/server'
import { nearIntentBridge } from '@/lib/nearIntentBridge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quoteId = searchParams.get('quoteId')

    if (!quoteId) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      )
    }

    const status = await nearIntentBridge.getStatus(quoteId)
    return NextResponse.json(status)
  } catch (error) {
    console.error('Bridge status API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch transaction status',
        code: 'STATUS_ERROR'
      },
      { status: 500 }
    )
  }
}
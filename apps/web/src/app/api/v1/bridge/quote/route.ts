import { NextRequest, NextResponse } from 'next/server'
import { nearIntentBridge } from '@/lib/nearIntentBridge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const quote = await nearIntentBridge.getQuote(body)
    return NextResponse.json(quote)
  } catch (error) {
    console.error('Bridge quote API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate quote',
        code: 'QUOTE_ERROR'
      },
      { status: 500 }
    )
  }
}
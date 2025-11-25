import { NextRequest, NextResponse } from 'next/server'
import { nearIntentBridge } from '@/lib/nearIntentBridge'

export async function GET() {
  try {
    const tokens = await nearIntentBridge.getSupportedTokens()
    return NextResponse.json(tokens)
  } catch (error) {
    console.error('Bridge tokens API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supported tokens' },
      { status: 500 }
    )
  }
}
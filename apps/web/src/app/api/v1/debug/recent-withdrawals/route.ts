/**
 * Debug endpoint to check recent withdrawal activity
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug] Checking recent withdrawal activity')

    // Return some debug information
    return NextResponse.json({
      success: true,
      data: {
        message: "To debug withdrawals, check the following:",
        checks: [
          "1. Client-side logs for transaction signing",
          "2. Browser console for '[Confidential Withdrawal]' messages",
          "3. Solscan for withdrawal transaction signatures",
          "4. Server logs for POST /api/v1/withdraw requests",
          "5. Actual transaction execution on Solana blockchain"
        ],
        debugSteps: [
          "Open browser developer tools",
          "Attempt a withdrawal from the WITHDRAW tab",
          "Look for console messages starting with '[Confidential Withdrawal]'",
          "Check if transaction signature appears in logs",
          "Verify transaction on Solscan"
        ]
      }
    })

  } catch (error) {
    console.error('[Debug] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get debug info',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
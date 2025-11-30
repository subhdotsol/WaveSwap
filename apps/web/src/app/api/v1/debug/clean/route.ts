/**
 * Clean Debug API - Remove mock transactions
 * Removes all mock transactions from the database for clean testing
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('[Clean Debug] Removing mock transactions')

    // Remove transactions with mock intent IDs
    const deletedSwaps = await prisma.swap.deleteMany({
      where: {
        intentId: {
          startsWith: 'mock_intent_'
        }
      }
    })

    // Remove orphaned stages (stages where swapId doesn't exist in swaps table)
    const deletedStages = await prisma.swapStage.deleteMany({
      where: {
        NOT: {
          swapId: {
            in: await prisma.swap.findMany({
              select: { id: true }
            }).then(swaps => swaps.map(s => s.id))
          }
        }
      }
    })

    console.log(`[Clean Debug] Removed ${deletedSwaps.count} mock swaps and ${deletedStages.count} orphaned stages`)

    return NextResponse.json({
      success: true,
      data: {
        deletedSwaps: deletedSwaps.count,
        deletedStages: deletedStages.count,
        message: "Mock transactions cleaned successfully"
      }
    })

  } catch (error) {
    console.error('[Clean Debug] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clean mock transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
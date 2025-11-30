/**
 * Debug API - Check all swaps in database
 * Temporary endpoint for debugging transaction history issues
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug API] Getting all swaps from database')

    // Get all swaps without filtering
    const allSwaps = await prisma.swap.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        userAddress: true,
        inputToken: true,
        outputToken: true,
        inputAmount: true,
        outputAmount: true,
        status: true,
        privacyMode: true,
        createdAt: true,
        settledAt: true,
        intentId: true,
        error: true,
      },
    })

    // Get total count
    const totalCount = await prisma.swap.count()

    // Count unique user addresses
    const uniqueAddresses = await prisma.swap.findMany({
      select: {
        userAddress: true,
      },
      distinct: ['userAddress'],
    })

    console.log(`[Debug API] Found ${totalCount} total swaps for ${uniqueAddresses.length} unique users`)

    return NextResponse.json({
      success: true,
      data: {
        totalCount,
        uniqueUserAddresses: uniqueAddresses.map(u => u.userAddress),
        recentSwaps: allSwaps.map((swap: any) => ({
          id: swap.id,
          userAddress: swap.userAddress,
          inputToken: swap.inputToken,
          outputToken: swap.outputToken,
          inputAmount: swap.inputAmount.toString(),
          outputAmount: swap.outputAmount?.toString(),
          status: swap.status,
          privacyMode: swap.privacyMode,
          intentId: swap.intentId,
          createdAt: swap.createdAt.toISOString(),
          settledAt: swap.settledAt?.toISOString(),
          error: swap.error,
        })),
      },
    })

  } catch (error) {
    console.error('[Debug API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to debug swaps',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
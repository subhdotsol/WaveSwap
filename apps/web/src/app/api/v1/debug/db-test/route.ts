/**
 * Database Connection Test API
 * Test if Prisma can connect to the database
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('[DB Test] Testing database connection')

    // Test basic connection
    await prisma.$connect()
    console.log('[DB Test] Database connection successful')

    // Test count query
    const userCount = await prisma.user.count()
    const swapCount = await prisma.swap.count()
    const stageCount = await prisma.swapStage.count()

    console.log(`[DB Test] Found ${userCount} users, ${swapCount} swaps, ${stageCount} stages`)

    return NextResponse.json({
      success: true,
      data: {
        connection: 'OK',
        userCount,
        swapCount,
        stageCount,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[DB Test] Database error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : String(error)
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
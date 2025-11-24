import { NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'

export async function GET() {
  try {
    // Test basic Prisma connection
    const userCount = await prisma.user.count()
    const categoryCount = await prisma.category.count()

    return NextResponse.json({
      message: 'Prisma connection working',
      userCount,
      categoryCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Prisma test error:', error)
    return NextResponse.json(
      {
        error: 'Prisma connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
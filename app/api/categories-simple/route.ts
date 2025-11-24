import { NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'

export async function GET() {
  try {
    console.log('Categories API called')

    // Simple query without includes
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log('Categories found:', categories.length)

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
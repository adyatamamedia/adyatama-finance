import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'income' | 'expense' | null
    const userId = searchParams.get('userId')

    const where: any = {}
    if (type) where.type = type.toUpperCase()
    if (userId) where.userId = parseInt(userId)

    const categories = await prisma.category.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedCategories = categories.map(category => {
      const serialized = { ...category }
      Object.keys(serialized).forEach(key => {
        if (typeof serialized[key] === 'bigint') {
          serialized[key] = serialized[key].toString()
        }
      })
      if (serialized.user && typeof serialized.user.id === 'bigint') {
        serialized.user.id = serialized.user.id.toString()
      }
      return serialized
    })

    return NextResponse.json(serializedCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, userId } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    if (!['income', 'expense'].includes(type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Type must be income or expense' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        type: type.toUpperCase(),
        userId: userId ? parseInt(userId) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedCategory = { ...category }
    Object.keys(serializedCategory).forEach(key => {
      if (typeof serializedCategory[key] === 'bigint') {
        serializedCategory[key] = serializedCategory[key].toString()
      }
    })
    if (serializedCategory.user && typeof serializedCategory.user.id === 'bigint') {
      serializedCategory.user.id = serializedCategory.user.id.toString()
    }

    return NextResponse.json(serializedCategory, { status: 201 })
  } catch (error: any) {
    console.error('Error creating category:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
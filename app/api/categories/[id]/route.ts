import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const categoryId = parseInt(id)

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
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
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
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

    const category = await prisma.category.update({
      where: { id },
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

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Error updating category:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const category = await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting category:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
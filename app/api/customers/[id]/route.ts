import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          include: {
            _count: {
              select: {
                items: true,
                payments: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            invoices: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
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
    const { name, email, phone, address } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
      }
    })

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error updating customer:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update customer' },
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

    const customer = await prisma.customer.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting customer:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
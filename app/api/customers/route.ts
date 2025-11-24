import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ]
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              invoices: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.customer.count({ where })
    ])

    // Convert BigInt to string for JSON serialization
    const serializedCustomers = customers.map(customer => {
      const serialized = { ...customer }
      Object.keys(serialized).forEach(key => {
        if (typeof serialized[key] === 'bigint') {
          serialized[key] = serialized[key].toString()
        }
      })
      return serialized
    })

    return NextResponse.json({
      customers: serializedCustomers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, address } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedCustomer = { ...customer }
    Object.keys(serializedCustomer).forEach(key => {
      if (typeof serializedCustomer[key] === 'bigint') {
        serializedCustomer[key] = serializedCustomer[key].toString()
      }
    })

    return NextResponse.json(serializedCustomer, { status: 201 })
  } catch (error: any) {
    console.error('Error creating customer:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
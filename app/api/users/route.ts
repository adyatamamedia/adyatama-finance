import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
      ]
    }
    if (role) where.role = role.toUpperCase()

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              categories: true,
              transactions: true,
              invoices: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ])

    // Convert BigInt to string for JSON serialization
    const serializedUsers = users.map(user => {
      const serialized = { ...user }
      Object.keys(serialized).forEach(key => {
        if (typeof serialized[key] === 'bigint') {
          serialized[key] = serialized[key].toString()
        }
      })
      return serialized
    })

    return NextResponse.json({
      users: serializedUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, name, role = 'USER' } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'user'].includes(role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Role must be admin or user' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      )
    }

    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || null,
        role: role.toUpperCase(),
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedUser = { ...user }
    Object.keys(serializedUser).forEach(key => {
      if (typeof serializedUser[key] === 'bigint') {
        serializedUser[key] = serializedUser[key].toString()
      }
    })

    return NextResponse.json(serializedUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
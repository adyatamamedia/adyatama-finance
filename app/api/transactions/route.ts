import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'income' | 'expense' | null
    const categoryId = searchParams.get('categoryId')
    const userId = searchParams.get('userId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'date-desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}

    if (type) where.type = type.toUpperCase()
    if (categoryId) where.categoryId = parseInt(categoryId)
    if (userId) where.userId = parseInt(userId)
    if (month) {
      where.month = parseInt(month)
    }
    if (year) {
      where.year = parseInt(year)
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { reference: { contains: search } },
        { category: { name: { contains: search } } }
      ]
    }

    const [transactions, total, summary] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              type: true,
            }
          },
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              status: true,
            }
          },
          _count: {
            select: {
              attachments: true
            }
          }
        },
        orderBy: {
          transactionDate: sortBy === 'date-desc' ? 'desc' : 'asc'
        }
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: {
          ...(month && { month: parseInt(month) }),
          ...(year && { year: parseInt(year) })
        },
        _sum: {
          amount: true
        }
      })
    ])

    const summaryData = {
      totalIncome: summary.find(s => s.type === 'INCOME')?._sum.amount || 0,
      totalExpense: summary.find(s => s.type === 'EXPENSE')?._sum.amount || 0,
    }
    summaryData.net = Number(summaryData.totalIncome) - Number(summaryData.totalExpense)

    // Convert BigInt to string for JSON serialization
    const serializedTransactions = transactions.map(t => {
      const serialized = { ...t }
      // Convert all BigInt fields to strings
      Object.keys(serialized).forEach(key => {
        if (typeof serialized[key] === 'bigint') {
          serialized[key] = serialized[key].toString()
        }
      })
      // Convert nested BigInt fields
      if (serialized.user && typeof serialized.user.id === 'bigint') {
        serialized.user.id = serialized.user.id.toString()
      }
      if (serialized.category && typeof serialized.category.id === 'bigint') {
        serialized.category.id = serialized.category.id.toString()
      }
      if (serialized.invoice && typeof serialized.invoice.id === 'bigint') {
        serialized.invoice.id = serialized.invoice.id.toString()
      }
      return serialized
    })

    return NextResponse.json({
      transactions: serializedTransactions,
      summary: summaryData,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,
      transactionDate,
      description,
      categoryId,
      amount,
      reference,
      userId,
      invoiceId
    } = body

    if (!type || !transactionDate || !amount) {
      return NextResponse.json(
        { error: 'Type, transaction date, and amount are required' },
        { status: 400 }
      )
    }

    if (!['income', 'expense'].includes(type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Type must be income or expense' },
        { status: 400 }
      )
    }

    const date = new Date(transactionDate)
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid transaction date' },
        { status: 400 }
      )
    }

    const transaction = await prisma.transaction.create({
      data: {
        type: type.toUpperCase(),
        transactionDate: date,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        description: description || null,
        categoryId: categoryId ? BigInt(categoryId) : null,
        amount: parseFloat(amount),
        reference: reference || null,
        userId: userId ? parseInt(userId) : null,
        invoiceId: invoiceId ? (typeof invoiceId === 'string' ? BigInt(invoiceId) : invoiceId) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            status: true,
          }
        }
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedTransaction = { ...transaction }
    Object.keys(serializedTransaction).forEach(key => {
      if (typeof serializedTransaction[key] === 'bigint') {
        serializedTransaction[key] = serializedTransaction[key].toString()
      }
    })
    if (serializedTransaction.user && typeof serializedTransaction.user.id === 'bigint') {
      serializedTransaction.user.id = serializedTransaction.user.id.toString()
    }
    if (serializedTransaction.category && typeof serializedTransaction.category.id === 'bigint') {
      serializedTransaction.category.id = serializedTransaction.category.id.toString()
    }
    if (serializedTransaction.invoice && typeof serializedTransaction.invoice.id === 'bigint') {
      serializedTransaction.invoice.id = serializedTransaction.invoice.id.toString()
    }

    return NextResponse.json(serializedTransaction, { status: 201 })
  } catch (error: any) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error.message },
      { status: 500 }
    )
  }
}
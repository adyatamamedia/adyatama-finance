import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactions } = body

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid transactions data' },
        { status: 400 }
      )
    }

    const createdTransactions = []
    const errors = []

    // Process transactions in batches for better performance
    for (const transactionData of transactions) {
      try {
        const {
          type,
          description,
          amount,
          transactionDate,
          categoryId
        } = transactionData

        // Validate required fields
        if (!type || !amount || !transactionDate) {
          errors.push({
            data: transactionData,
            error: 'Missing required fields: type, amount, or transactionDate'
          })
          continue
        }

        // Validate type
        if (!['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
          errors.push({
            data: transactionData,
            error: 'Invalid transaction type. Must be INCOME or EXPENSE'
          })
          continue
        }

        // Validate amount
        const parsedAmount = parseFloat(amount)
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          errors.push({
            data: transactionData,
            error: 'Invalid amount. Must be a positive number'
          })
          continue
        }

        // Validate date
        const date = new Date(transactionDate)
        if (isNaN(date.getTime())) {
          errors.push({
            data: transactionData,
            error: 'Invalid transaction date'
          })
          continue
        }

        // Validate category if provided
        if (categoryId) {
          const category = await prisma.category.findUnique({
            where: { id: parseInt(categoryId) }
          })

          if (!category) {
            errors.push({
              data: transactionData,
              error: 'Invalid category ID'
            })
            continue
          }

          // Check if category type matches transaction type
          if (category.type.toUpperCase() !== type.toUpperCase()) {
            errors.push({
              data: transactionData,
              error: `Category type (${category.type}) does not match transaction type (${type})`
            })
            continue
          }
        }

        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            type: type.toUpperCase(),
            transactionDate: date,
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            description: description || null,
            categoryId: categoryId ? parseInt(categoryId) : null,
            amount: parsedAmount,
            userId: null, // Can be modified later if user authentication is added
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                type: true,
              }
            }
          }
        })

        createdTransactions.push({
          ...transaction,
          id: transaction.id.toString(),
        })
      } catch (error) {
        console.error('Error creating transaction:', error)
        errors.push({
          data: transactionData,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      count: createdTransactions.length,
      total: transactions.length,
      errors: errors.length > 0 ? errors : undefined,
      transactions: createdTransactions
    })

  } catch (error) {
    console.error('Batch import error:', error)
    return NextResponse.json(
      { error: 'Failed to process batch import', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
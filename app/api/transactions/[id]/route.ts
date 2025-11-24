import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = BigInt(resolvedParams.id)

    const transaction = await prisma.transaction.findUnique({
      where: { id },
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

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

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

    return NextResponse.json(serializedTransaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    console.log('PUT request params:', resolvedParams); // Debug logging
    console.log('Request URL:', request.url); // Additional debug logging

    // Primary method: get ID from params
    let idStr = resolvedParams?.id;

    // Fallback: extract ID from URL path if params.id is not available
    if (!idStr) {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/');
      idStr = pathSegments[pathSegments.length - 1]; // Last segment should be the ID
      console.log('Extracted ID from URL path:', idStr); // Additional debug
    }

    // Validate ID parameter before attempting BigInt conversion
    if (!idStr || idStr === '') {
      return NextResponse.json(
        {
          error: 'Transaction ID is required',
          params: resolvedParams,
          extractedId: idStr,
          url: request.url
        },
        { status: 400 }
      )
    }
    
    let id: bigint;
    try {
      id = BigInt(idStr);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid transaction ID format' },
        { status: 400 }
      )
    }
    
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

    const transaction = await prisma.transaction.update({
      where: { id },
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

    return NextResponse.json(serializedTransaction)
  } catch (error: any) {
    console.error('Error updating transaction:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    console.log('DELETE request params:', resolvedParams); // Debug logging
    console.log('Request URL:', request.url); // Additional debug logging

    // Validate ID parameter before attempting BigInt conversion
    if (!resolvedParams || typeof resolvedParams !== 'object' || !resolvedParams.id || resolvedParams.id === '' || typeof resolvedParams.id !== 'string') {
      return NextResponse.json(
        {
          error: 'Transaction ID is required',
          params: resolvedParams,
          hasParams: !!resolvedParams,
          hasId: !!(resolvedParams && resolvedParams.id),
          idType: typeof (resolvedParams && resolvedParams.id)
        },
        { status: 400 }
      )
    }

    let id: bigint;
    try {
      id = BigInt(resolvedParams.id);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid transaction ID format',
          details: error instanceof Error ? error.message : 'Unknown error during BigInt conversion'
        },
        { status: 400 }
      )
    }

    await prisma.transaction.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting transaction:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = BigInt(params.id)
    const body = await request.json()
    const {
      amount,
      paymentMethod = 'CASH',
      referenceNo,
      createdBy,
      createTransaction = true,
      categoryId
    } = body

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Payment amount is required and must be greater than 0' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        customer: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    if (invoice.status === 'DRAFT') {
      return NextResponse.json(
        { error: 'Cannot add payment to draft invoice' },
        { status: 400 }
      )
    }

    if (invoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot add payment to cancelled invoice' },
        { status: 400 }
      )
    }

    const totalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    const paymentAmount = parseFloat(amount)
    const newTotalPaid = totalPaid + paymentAmount

    if (newTotalPaid > Number(invoice.total)) {
      return NextResponse.json(
        { error: 'Payment amount exceeds invoice total' },
        { status: 400 }
      )
    }

    let newStatus = invoice.status
    if (Math.abs(newTotalPaid - Number(invoice.total)) < 0.01) {
      newStatus = 'PAID'
    } else if (newTotalPaid > 0) {
      newStatus = 'PARTIAL'
    }

    const [payment] = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.invoicePayment.create({
        data: {
          invoiceId,
          amount: paymentAmount,
          paymentMethod: paymentMethod.toUpperCase(),
          referenceNo: referenceNo || null,
          createdBy: createdBy ? parseInt(createdBy) : null,
          paymentDate: new Date(),
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

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: newStatus
        }
      })

      if (createTransaction && categoryId) {
        await tx.transaction.create({
          data: {
            type: 'INCOME',
            transactionDate: new Date(),
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            description: `Pembayaran Invoice ${invoice.invoiceNo}${invoice.customer ? ` - ${invoice.customer.name}` : ''}`,
            categoryId: parseInt(categoryId),
            amount: paymentAmount,
            reference: referenceNo || null,
            invoiceId,
            userId: createdBy ? parseInt(createdBy) : null,
          }
        })
      }

      return [newPayment]
    })

    return NextResponse.json({
      payment,
      status: newStatus,
      totalPaid: newTotalPaid,
      remaining: Number(invoice.total) - newTotalPaid
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error adding payment:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add payment' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = BigInt(params.id)

    const payments = await prisma.invoicePayment.findMany({
      where: { invoiceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
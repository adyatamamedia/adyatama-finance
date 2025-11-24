import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'
import { InvoiceStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = BigInt(idString)

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
          }
        },
        items: {
          orderBy: {
            id: 'asc'
          }
        },
        payments: {
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
        },
        transactions: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const totalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    const remaining = Number(invoice.total) - totalPaid

    const serializedInvoice = {
      ...invoice,
      id: invoice.id.toString(),
      customerId: invoice.customerId?.toString() || null,
      userId: invoice.userId?.toString() || null,
      issueDate: invoice.issueDate?.toISOString() || null,
      dueDate: invoice.dueDate?.toISOString() || null,
      subtotal: invoice.subtotal?.toString() || '0',
      discount: invoice.discount?.toString() || '0',
      tax: invoice.tax?.toString() || '0',
      total: invoice.total?.toString() || '0',
      customer: invoice.customer ? {
        ...invoice.customer,
        id: invoice.customer.id.toString()
      } : null,
      user: invoice.user ? {
        ...invoice.user,
        id: invoice.user.id.toString()
      } : null,
      items: invoice.items.map((item: any) => ({
        ...item,
        id: item.id.toString(),
        invoiceId: item.invoiceId?.toString() || null,
        quantity: item.quantity?.toString() || '0',
        unit_price: item.unitPrice?.toString() || '0',
        unitPrice: item.unitPrice?.toString() || '0',
        product_sku: item.productSku || null,
        productSku: item.productSku || null,
        discount: item.discount?.toString() || '0',
        subtotal: item.subtotal?.toString() || '0',
      })),
      payments: invoice.payments.map((payment: any) => ({
        ...payment,
        id: payment.id.toString(),
        invoiceId: payment.invoiceId?.toString() || null,
        userId: payment.userId?.toString() || null,
        amount: payment.amount?.toString() || '0',
        user: payment.user ? {
          ...payment.user,
          id: payment.user.id.toString()
        } : null
      })),
      transactions: invoice.transactions.map((transaction: any) => ({
        ...transaction,
        id: transaction.id.toString(),
        invoiceId: transaction.invoiceId?.toString() || null,
        categoryId: transaction.categoryId?.toString() || null,
        amount: transaction.amount?.toString() || '0',
        category: transaction.category ? {
          ...transaction.category,
          id: transaction.category.id.toString()
        } : null
      })),
      totalPaid,
      remaining
    }

    return NextResponse.json(serializedInvoice)
  } catch (error: any) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = BigInt(idString)
    const body = await request.json()
    const {
      customerId,
      issueDate,
      dueDate,
      status,
      discount,
      tax,
      currency,
      notes,
      items
    } = body

    console.log('PUT /api/invoices/[id] - Received data:', { id: idString, customerId, status, items: items?.length })

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { 
        items: true,
        payments: true,
        customer: true
      }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Store original status for comparison
    const originalStatus = existingInvoice.status

    if (existingInvoice.status === InvoiceStatus.PAID) {
      return NextResponse.json(
        { error: 'Cannot update paid invoice' },
        { status: 400 }
      )
    }

    let subtotal = 0
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.description || !item.quantity || !item.unitPrice) {
          return NextResponse.json(
            { error: 'All items must have description, quantity, and unit price' },
            { status: 400 }
          )
        }
      }

      subtotal = items.reduce((sum: number, item: any) => {
        const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice) - parseFloat(item.discount || 0)
        return sum + itemTotal
      }, 0)

      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id }
      })

      await prisma.invoiceItem.createMany({
        data: items.map((item: any) => ({
          invoiceId: id,
          description: item.description,
          productSku: item.productSku || null,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount || 0),
          subtotal: parseFloat(item.quantity) * parseFloat(item.unitPrice) - parseFloat(item.discount || 0)
        }))
      })
    } else {
      subtotal = Number(existingInvoice.items.reduce((sum, item) => sum + Number(item.subtotal), 0))
    }

    const discountAmount = parseFloat(discount || existingInvoice.discount)
    const taxAmount = parseFloat(tax || existingInvoice.tax)
    const total = subtotal - discountAmount + taxAmount

    // Check if status is changing to PAID
    const isChangingToPaid = status === InvoiceStatus.PAID && (originalStatus as InvoiceStatus) !== InvoiceStatus.PAID
    
    // Calculate remaining amount if changing to PAID
    let remainingAmount = 0
    if (isChangingToPaid) {
      const totalPaid = existingInvoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
      remainingAmount = total - totalPaid
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        customerId: customerId ? parseInt(customerId) : existingInvoice.customerId,
        issueDate: issueDate ? new Date(issueDate) : existingInvoice.issueDate,
        dueDate: dueDate ? new Date(dueDate) : existingInvoice.dueDate,
        status: status || existingInvoice.status,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
        currency: currency || existingInvoice.currency,
        notes: notes !== undefined ? notes : existingInvoice.notes,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
          }
        },
        items: true,
        _count: {
          select: {
            items: true,
            payments: true
          }
        }
      }
    })

    // If status changed to PAID and there's remaining amount, create payment and transaction
    if (isChangingToPaid && remainingAmount > 0) {
      console.log('Creating automatic payment and transaction for remaining amount:', remainingAmount)
      
      // Create payment record
      const payment = await prisma.invoicePayment.create({
        data: {
          invoiceId: id,
          amount: remainingAmount,
          paymentDate: new Date(),
          paymentMethod: 'CASH',
          referenceNo: `AUTO-${invoice.invoiceNo}`,
          createdBy: existingInvoice.userId || null
        }
      })

      // Get or create income category
      let incomeCategory = await prisma.category.findFirst({
        where: {
          type: 'INCOME',
          name: 'Pembayaran Invoice'
        }
      })

      if (!incomeCategory) {
        incomeCategory = await prisma.category.create({
          data: {
            name: 'Pembayaran Invoice',
            type: 'INCOME',
            userId: existingInvoice.userId || null
          }
        })
      }

      // Create income transaction
      const transactionDate = new Date()
      const transaction = await prisma.transaction.create({
        data: {
          type: 'INCOME',
          transactionDate: transactionDate,
          month: transactionDate.getMonth() + 1,
          year: transactionDate.getFullYear(),
          description: `Pembayaran Invoice ${invoice.invoiceNo}${existingInvoice.customer ? ` - ${existingInvoice.customer.name}` : ''}`,
          categoryId: incomeCategory.id,
          amount: remainingAmount,
          reference: invoice.invoiceNo,
          invoiceId: id,
          userId: existingInvoice.userId || null
        }
      })

      console.log('Created payment:', payment.id.toString(), 'and transaction:', transaction.id.toString())
    }

    // Serialize BigInt fields
    const rawInvoice: any = invoice
    const serializedInvoice = {
      ...rawInvoice,
      id: rawInvoice.id.toString(),
      customerId: rawInvoice.customerId?.toString() || null,
      userId: rawInvoice.userId?.toString() || null,
      issueDate: rawInvoice.issueDate?.toISOString() || null,
      dueDate: rawInvoice.dueDate?.toISOString() || null,
      subtotal: rawInvoice.subtotal?.toString() || '0',
      discount: rawInvoice.discount?.toString() || '0',
      tax: rawInvoice.tax?.toString() || '0',
      total: rawInvoice.total?.toString() || '0',
      customer: rawInvoice.customer ? {
        ...rawInvoice.customer,
        id: rawInvoice.customer.id.toString()
      } : null,
      user: rawInvoice.user ? {
        ...rawInvoice.user,
        id: rawInvoice.user.id.toString()
      } : null,
      items: rawInvoice.items.map((item: any) => ({
        ...item,
        id: item.id.toString(),
        invoiceId: item.invoiceId?.toString() || null,
        quantity: item.quantity?.toString() || '0',
        unit_price: item.unitPrice?.toString() || '0',
        unitPrice: item.unitPrice?.toString() || '0',
        discount: item.discount?.toString() || '0',
        subtotal: item.subtotal?.toString() || '0',
      }))
    }

    console.log('PUT /api/invoices/[id] - Successfully updated invoice:', serializedInvoice.id)

    return NextResponse.json(serializedInvoice)
  } catch (error: any) {
    console.error('Error updating invoice:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = BigInt(idString)

    // Get force parameter from query string
    const url = new URL(request.url)
    const force = url.searchParams.get('force') === 'true'

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: true,
        transactions: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice has payments or transactions
    const hasPayments = invoice.payments.length > 0
    const hasTransactions = invoice.transactions.length > 0

    if ((hasPayments || hasTransactions) && !force) {
      // Return detailed error message
      const details = []
      if (hasPayments) details.push(`${invoice.payments.length} pembayaran`)
      if (hasTransactions) details.push(`${invoice.transactions.length} transaksi`)
      
      return NextResponse.json(
        { 
          error: 'Cannot delete invoice with related data',
          message: `Invoice ini memiliki ${details.join(' dan ')}. Hapus data terkait terlebih dahulu atau gunakan force delete.`,
          hasPayments,
          hasTransactions,
          paymentsCount: invoice.payments.length,
          transactionsCount: invoice.transactions.length
        },
        { status: 400 }
      )
    }

    // If force delete, delete related data first
    if (force) {
      // Delete related transactions
      if (hasTransactions) {
        await prisma.transaction.deleteMany({
          where: { invoiceId: id }
        })
        console.log(`Deleted ${invoice.transactions.length} transactions for invoice ${idString}`)
      }

      // Delete related payments
      if (hasPayments) {
        await prisma.invoicePayment.deleteMany({
          where: { invoiceId: id }
        })
        console.log(`Deleted ${invoice.payments.length} payments for invoice ${idString}`)
      }
    }

    // Delete the invoice (items will be cascade deleted)
    await prisma.invoice.delete({
      where: { id }
    })

    console.log(`Successfully deleted invoice ${idString}`)

    return NextResponse.json({ 
      message: 'Invoice deleted successfully',
      deletedPayments: force ? invoice.payments.length : 0,
      deletedTransactions: force ? invoice.transactions.length : 0
    })
  } catch (error: any) {
    console.error('Error deleting invoice:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete invoice', details: error.message },
      { status: 500 }
    )
  }
}
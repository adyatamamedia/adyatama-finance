import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'
import { generateInvoiceNo } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const userId = searchParams.get('userId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const day = searchParams.get('day')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'date-desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) where.status = status.toUpperCase()
    if (customerId) where.customerId = parseInt(customerId)
    if (userId) where.userId = parseInt(userId)
    
    if (day && month && year) {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      where.issueDate = {
        gte: date,
        lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      }
    } else if (month) {
      const monthNum = parseInt(month);
      const yearNum = year ? parseInt(year) : new Date().getFullYear();
      const start = new Date(yearNum, monthNum - 1, 1);
      const end = new Date(yearNum, monthNum, 1);
      where.issueDate = { gte: start, lt: end };
    } else if (year) {
      const yearNum = parseInt(year);
      const start = new Date(yearNum, 0, 1);
      const end = new Date(yearNum + 1, 0, 1);
      where.issueDate = { gte: start, lt: end };
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { notes: { contains: search } }
      ]
    }

    // Determine sort order
    const orderBy: any = {}
    if (sortBy === 'date-asc') {
      orderBy.createdAt = 'asc'
    } else {
      orderBy.createdAt = 'desc'
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
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
          _count: {
            select: {
              items: true,
              payments: true,
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              paymentMethod: true,
            },
            orderBy: {
              paymentDate: 'desc'
            }
          }
        },
        orderBy
      }),
      prisma.invoice.count({ where })
    ])

    let summaryData = null;
    if (searchParams.get('summary') === 'true') {
      const [totalCount, paidCount] = await Promise.all([
        prisma.invoice.count({ where }),
        prisma.invoice.count({ where: { ...where, status: 'PAID' } })
      ]);
      summaryData = {
        total: totalCount,
        paid: paidCount,
        pending: totalCount - paidCount
      };
    }

    // Convert BigInt to string for JSON serialization
    const serializedInvoices = invoices.map(inv => ({
      ...inv,
      id: inv.id.toString(),
      customerId: inv.customerId?.toString() || null,
      userId: inv.userId?.toString() || null,
      issueDate: inv.issueDate?.toISOString() || null,
      dueDate: inv.dueDate?.toISOString() || null,
      subtotal: inv.subtotal?.toString() || '0',
      discount: inv.discount?.toString() || '0',
      tax: inv.tax?.toString() || '0',
      total: inv.total?.toString() || '0',
      customer: inv.customer ? {
        ...inv.customer,
        id: inv.customer.id.toString()
      } : null,
      user: inv.user ? {
        ...inv.user,
        id: inv.user.id.toString()
      } : null,
      payments: inv.payments ? inv.payments.map((p: any) => ({
        ...p,
        id: p.id.toString(),
        amount: p.amount?.toString() || '0',
        paymentDate: p.paymentDate?.toISOString() || null
      })) : []
    }))

    console.log('Sample invoice with payments:', serializedInvoices.find(i => i.payments?.length > 0))

    return NextResponse.json({
      invoices: serializedInvoices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      summary: summaryData
    })
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      userId,
      issueDate,
      dueDate,
      discount,
      tax,
      currency,
      notes,
      items
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      )
    }

    for (const item of items) {
      if (!item.description || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { error: 'All items must have description, quantity, and unit price' },
          { status: 400 }
        )
      }
    }

    const subtotal = items.reduce((sum: number, item: any) => {
      const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice) - parseFloat(item.discount || 0)
      return sum + itemTotal
    }, 0)

    const discountAmount = parseFloat(discount || 0)
    const taxAmount = parseFloat(tax || 0)
    const total = subtotal - discountAmount + taxAmount

    const invoiceData = {
      invoiceNo: generateInvoiceNo(),
      customerId: customerId ? parseInt(customerId) : null,
      userId: userId ? parseInt(userId) : null,
      status: 'DRAFT' as any,
      issueDate: issueDate ? new Date(issueDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      currency: currency || 'IDR',
      notes: notes || null,
      items: {
        create: items.map((item: any) => ({
          description: item.description,
          productSku: item.productSku || null,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount || 0),
          subtotal: parseFloat(item.quantity) * parseFloat(item.unitPrice) - parseFloat(item.discount || 0)
        }))
      }
    }

    const invoice = await prisma.invoice.create({
      data: invoiceData,
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

    // Serialize BigInt fields
    const rawInvoice: any = invoice
    const serializedInvoice = {
      ...rawInvoice,
      id: rawInvoice.id.toString(),
      customerId: rawInvoice.customerId?.toString() || null,
      userId: rawInvoice.userId?.toString() || null,
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
        product_sku: item.productSku || null,
        productSku: item.productSku || null,
        discount: item.discount?.toString() || '0',
        subtotal: item.subtotal?.toString() || '0',
      }))
    }

    return NextResponse.json(serializedInvoice, { status: 201 })
  } catch (error: any) {
    console.error('Error creating invoice:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Invoice number already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
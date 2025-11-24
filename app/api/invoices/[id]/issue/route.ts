import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = BigInt(params.id)
    const body = await request.json()
    const { issueDate, dueDate } = body

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    if (invoice.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft invoices can be issued' },
        { status: 400 }
      )
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'ISSUED',
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
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

    return NextResponse.json(updatedInvoice)
  } catch (error: any) {
    console.error('Error issuing invoice:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to issue invoice' },
      { status: 500 }
    )
  }
}
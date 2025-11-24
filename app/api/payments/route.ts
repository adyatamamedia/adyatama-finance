import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils';

// Ensure a "Pendapatan" (income) category exists and return its ID as string
async function getPendapatanCategoryId(): Promise<string> {
  const existing = await prisma.category.findFirst({
    where: { name: { equals: 'Pendapatan' } },
  });
  if (existing) return existing.id.toString();
  const created = await prisma.category.create({
    data: {
      name: 'Pendapatan',
      type: 'INCOME',
    },
  });
  return created.id.toString();
}

export async function POST(request: NextRequest) {
  try {
    const {
      invoiceId,
      amount,
      paymentMethod = 'CASH',
      paymentDate,
      referenceNo,
      notes,
    } = await request.json();

    if (!invoiceId || !amount) {
      return NextResponse.json({ error: 'Invoice ID and amount are required' }, { status: 400 });
    }

    const invoiceIdBig = BigInt(invoiceId);

    // Fetch invoice with existing payments
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceIdBig },
      include: { payments: true },
    });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Calculate new totals
    const totalPaidSoFar = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const newTotalPaid = totalPaidSoFar + Number(amount);
    const invoiceTotal = Number(invoice.total);
    let newStatus: string = invoice.status;
    if (newTotalPaid >= invoiceTotal) newStatus = 'PAID';
    else if (newTotalPaid > 0) newStatus = 'PARTIAL';

    // Create payment record
    const payment = await prisma.invoicePayment.create({
      data: {
        invoiceId: invoiceIdBig,
        amount: Number(amount),
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        referenceNo: referenceNo ?? null,
        createdBy: null, // TODO: attach authenticated user ID
      },
    });

    // Update invoice status
    await prisma.invoice.update({
      where: { id: invoiceIdBig },
      data: { status: newStatus as any },
    });

    // Create linked transaction (INCOME)
    const categoryId = await getPendapatanCategoryId();
    const transactionDescription = notes 
      ? `Pembayaran invoice #${invoice.invoiceNo} - ${notes}`
      : `Pembayaran invoice #${invoice.invoiceNo}`;

    const transaction = await prisma.transaction.create({
      data: {
        type: 'INCOME',
        description: transactionDescription,
        amount: Number(amount),
        transactionDate: paymentDate ? new Date(paymentDate) : new Date(),
        categoryId: BigInt(categoryId),
        reference: referenceNo ?? null,
        userId: null, // TODO: attach authenticated user ID
        invoiceId: invoiceIdBig,
      },
    });

    // Serialize IDs for JSON response
    const serializedPayment = {
      ...payment,
      id: payment.id.toString(),
      invoiceId: payment.invoiceId.toString(),
      amount: payment.amount.toString(),
      createdBy: payment.createdBy?.toString() || null,
    };
    const serializedTransaction = {
      ...transaction,
      id: transaction.id.toString(),
      invoiceId: transaction.invoiceId?.toString() || null,
      categoryId: transaction.categoryId?.toString() || null,
      amount: transaction.amount.toString(),
      userId: transaction.userId?.toString() || null,
    };

    return NextResponse.json(
      {
        payment: serializedPayment,
        newTransaction: serializedTransaction,
        newStatus,
        totalPaid: newTotalPaid,
        remaining: invoiceTotal - newTotalPaid,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment', details: error.message }, { status: 500 });
  }
}

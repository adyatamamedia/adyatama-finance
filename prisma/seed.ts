import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Administrator',
      role: 'ADMIN',
    },
  })

  const user = await prisma.user.upsert({
    where: { username: 'kasir' },
    create: {
      username: 'kasir',
      password: userPassword,
      name: 'Kasir Toko',
      role: 'USER',
    },
  })

  await prisma.setting.upsert({
    where: { key: 'store_name' },
    update: { value: 'ADYATAMA' },
    create: {
      key: 'store_name',
      value: 'ADYATAMA',
    },
  })

  await prisma.setting.upsert({
    where: { key: 'store_address' },
    update: { value: 'Jl. Contoh No. 123, Jakarta' },
    create: {
      key: 'store_address',
      value: 'Jl. Contoh No. 123, Jakarta',
    },
  })

  await prisma.setting.upsert({
    where: { key: 'store_phone' },
    update: { value: '021-12345678' },
    create: {
      key: 'store_phone',
      value: '021-12345678',
    },
  })

  await prisma.setting.upsert({
    where: { key: 'store_email' },
    update: { value: 'info@adyatama.com' },
    create: {
      key: 'store_email',
      value: 'info@adyatama.com',
    },
  })

  const incomeCategories = [
    { name: 'Penjualan Produk', type: 'INCOME' },
    { name: 'Penjualan Jasa', type: 'INCOME' },
    { name: 'Biaya Kirim', type: 'INCOME' },
    { name: 'Lainnya (Pemasukan)', type: 'INCOME' },
  ]

  const expenseCategories = [
    { name: 'Beli Bahan Baku', type: 'EXPENSE' },
    { name: 'Gaji Karyawan', type: 'EXPENSE' },
    { name: 'Sewa Toko', type: 'EXPENSE' },
    { name: 'Listrik & Air', type: 'EXPENSE' },
    { name: 'Internet & Telepon', type: 'EXPENSE' },
    { name: 'Marketing', type: 'EXPENSE' },
    { name: 'Transportasi', type: 'EXPENSE' },
    { name: 'Lainnya (Pengeluaran)', type: 'EXPENSE' },
  ]

  for (const category of [...incomeCategories, ...expenseCategories]) {
    await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: admin.id,
          name: category.name,
          type: category.type as any,
        },
      },
      create: {
        userId: admin.id,
        name: category.name,
        type: category.type as any,
      },
    })
  }

  const customers = [
    {
      name: 'PT. Pelanggan Setia',
      email: 'info@pelanggansetia.com',
      phone: '021-11111111',
      address: 'Jl. Bisnis No. 1, Jakarta Pusat',
    },
    {
      name: 'CV. Mitra Usaha',
      email: 'contact@mitrausaha.com',
      phone: '021-22222222',
      address: 'Jl. Usaha No. 2, Jakarta Selatan',
    },
    {
      name: 'UD. Sahabat Toko',
      email: 'ud.sahabat@gmail.com',
      phone: '021-33333333',
      address: 'Jl. Persahabatan No. 3, Jakarta Barat',
    },
  ]

  for (const customer of customers) {
    await prisma.customer.create({
      create: customer,
    })
  }

  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
  const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate())

  const sampleTransactions = [
    {
      description: 'Penjualan produk A',
      amount: 1500000,
      type: 'INCOME',
      transactionDate: today,
      categoryName: 'Penjualan Produk',
    },
    {
      description: 'Penjualan jasa instalasi',
      amount: 750000,
      type: 'INCOME',
      transactionDate: today,
      categoryName: 'Penjualan Jasa',
    },
    {
      description: 'Beli bahan baku',
      amount: 2000000,
      type: 'EXPENSE',
      transactionDate: lastMonth,
      categoryName: 'Beli Bahan Baku',
    },
    {
      description: 'Gaji karyawan bulan lalu',
      amount: 8500000,
      type: 'EXPENSE',
      transactionDate: lastMonth,
      categoryName: 'Gaji Karyawan',
    },
    {
      description: 'Bayar sewa toko',
      amount: 5000000,
      type: 'EXPENSE',
      transactionDate: twoMonthsAgo,
      categoryName: 'Sewa Toko',
    },
    {
      description: 'Penjualan produk B',
      amount: 2300000,
      type: 'INCOME',
      transactionDate: twoMonthsAgo,
      categoryName: 'Penjualan Produk',
    },
  ]

  for (const tx of sampleTransactions) {
    const category = await prisma.category.findFirst({
      where: {
        name: tx.categoryName,
        type: tx.type,
        userId: admin.id,
      },
    })

    if (category) {
      await prisma.transaction.create({
        data: {
          userId: admin.id,
          type: tx.type as any,
          transactionDate: tx.transactionDate,
          month: tx.transactionDate.getMonth() + 1,
          year: tx.transactionDate.getFullYear(),
          description: tx.description,
          categoryId: category.id,
          amount: tx.amount,
          reference: `TRX-${Date.now()}`,
        },
      })
    }
  }

  const customer = await prisma.customer.findFirst()
  const penjualanCategory = await prisma.category.findFirst({
    where: { name: 'Penjualan Produk', type: 'INCOME' },
  })

  if (customer && penjualanCategory) {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: `ADY-${new Date().getFullYear()}-0001`,
        customerId: customer.id,
        userId: admin.id,
        status: 'ISSUED',
        issueDate: today,
        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        subtotal: 3500000,
        discount: 100000,
        tax: 350000,
        total: 3750000,
        currency: 'IDR',
        notes: 'Pembayaran dapat dilakukan via transfer ke rekening BCA 123-456-789',
        items: {
          create: [
            {
              description: 'Produk Premium A',
              productSku: 'PRM-A001',
              quantity: 2,
              unitPrice: 1500000,
              discount: 100000,
              subtotal: 2900000,
            },
            {
              description: 'Aksesoris Tambahan',
              productSku: 'ACC-B002',
              quantity: 1,
              unitPrice: 700000,
              discount: 0,
              subtotal: 700000,
            },
          ],
        },
      },
    })

    await prisma.invoicePayment.create({
      data: {
        invoiceId: invoice.id,
        amount: 3750000,
        paymentMethod: 'TRANSFER',
        referenceNo: 'TRF-001',
        createdBy: admin.id,
        paymentDate: today,
      },
    })

    await prisma.transaction.create({
      data: {
        userId: admin.id,
        type: 'INCOME',
        transactionDate: today,
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        description: `Pembayaran Invoice ${invoice.invoiceNo} - ${customer.name}`,
        categoryId: penjualanCategory.id,
        amount: 3750000,
        reference: 'TRF-001',
        invoiceId: invoice.id,
      },
    })
  }

  console.log('Seed completed successfully!')
  console.log('Login credentials:')
  console.log('Admin: username=admin, password=admin123')
  console.log('Kasir: username=kasir, password=user123')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
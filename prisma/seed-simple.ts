import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Administrator',
      role: 'ADMIN',
    },
  })

  const user = await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {},
    create: {
      username: 'kasir',
      password: userPassword,
      name: 'Kasir Toko',
      role: 'USER',
    },
  })

  // Create settings
  await prisma.setting.upsert({
    where: { key: 'store_name' },
    update: { value: 'ADYATAMA' },
    create: {
      key: 'store_name',
      value: 'ADYATAMA',
      userId: admin.id,
    },
  })

  await prisma.setting.upsert({
    where: { key: 'store_address' },
    update: { value: 'Jl. Contoh No. 123, Jakarta' },
    create: {
      key: 'store_address',
      value: 'Jl. Contoh No. 123, Jakarta',
      userId: admin.id,
    },
  })

  await prisma.setting.upsert({
    where: { key: 'store_phone' },
    update: { value: '021-12345678' },
    create: {
      key: 'store_phone',
      value: '021-12345678',
      userId: admin.id,
    },
  })

  // Create categories
  await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Penjualan Produk',
      type: 'INCOME',
      userId: admin.id,
    },
  })

  await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Penjualan Jasa',
      type: 'INCOME',
      userId: admin.id,
    },
  })

  await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Beli Bahan Baku',
      type: 'EXPENSE',
      userId: admin.id,
    },
  })

  await prisma.category.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: 'Operasional Toko',
      type: 'EXPENSE',
      userId: admin.id,
    },
  })

  // Create customers (using create instead of upsert since email is not unique)
  const customers = [
    {
      name: 'PT. Pelanggan Setia',
      email: 'info@pelanggansetia.com',
      phone: '021-11111111',
      address: 'Jl. Bisnis No. 1, Jakarta Pusat',
    },
    {
      name: 'CV. Rekan Bisnis',
      email: 'contact@rekanbisnis.com',
      phone: '021-22222222',
      address: 'Jl. Usaha No. 2, Jakarta Utara',
    },
    {
      name: 'UD. Sahabat Toko',
      email: 'ud.sahabat@gmail.com',
      phone: '021-33333333',
      address: 'Jl. Persahabatan No. 3, Jakarta Barat',
    },
  ]

  for (const customerData of customers) {
    try {
      await prisma.customer.create({ data: customerData })
    } catch (error) {
      console.log('Customer might already exist:', customerData.name)
    }
  }

  console.log('Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
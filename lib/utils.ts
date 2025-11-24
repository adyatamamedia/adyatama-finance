import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export function formatCurrency(amount: number | string, currency = 'IDR') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(num)
}

export function generateInvoiceNo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ADY-${year}-${random}`
}

export function calculateInvoiceTotal(items: Array<{
  quantity: number
  unitPrice: number
  discount: number
}>): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice - item.discount
    return sum + itemTotal
  }, 0)

  return {
    subtotal,
    total: subtotal
  }
}

export function formatDate(date: Date | string, format = 'yyyy-MM-dd') {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return format
    .replace('yyyy', year.toString())
    .replace('MM', month)
    .replace('dd', day)
}
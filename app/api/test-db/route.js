// app/api/test-db/route.js
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// Helper function to convert BigInt to String
function convertBigIntToString(obj) {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return obj.toString()
  if (Array.isArray(obj)) return obj.map(convertBigIntToString)
  if (typeof obj === 'object') {
    const newObj = {}
    for (const key in obj) {
      newObj[key] = convertBigIntToString(obj[key])
    }
    return newObj
  }
  return obj
}

export async function GET() {
  try {
    // Test beberapa models yang ada
    const results = {}
    
    // Test User model
    try {
      const users = await prisma.user.findMany({
        take: 2,
        select: { id: true, username: true, name: true, role: true }
      })
      results.users = users
    } catch (e) {
      results.users_error = e.message
    }
    
    // Test Customer model
    try {
      const customers = await prisma.customer.findMany({
        take: 2,
        select: { id: true, name: true, email: true }
      })
      results.customers = customers
    } catch (e) {
      results.customers_error = e.message
    }
    
    // Test Invoice model
    try {
      const invoices = await prisma.invoice.findMany({
        take: 2,
        select: { 
          id: true, 
          invoiceNo: true, 
          status: true,
          total: true 
        }
      })
      results.invoices = invoices
    } catch (e) {
      results.invoices_error = e.message
    }

    // Convert BigInt to String sebelum return
    const convertedResults = convertBigIntToString(results)

    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully!',
      data: convertedResults
    })
    
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
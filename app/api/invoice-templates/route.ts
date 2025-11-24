import { NextRequest, NextResponse } from 'next/server'

// Template data type
interface InvoiceTemplate {
  id: string
  name: string
  description?: string
  header: {
    companyName: string
    address: string
    phone: string
    email: string
    logo?: string
  }
  footer?: {
    notes?: string
    terms?: string
  }
}

// Mock templates storage (in real app, this would be in database)
const defaultTemplates: InvoiceTemplate[] = [
  {
    id: 'standard',
    name: 'Template Standar',
    description: 'Template invoice standar Adyatama',
    header: {
      companyName: 'ADYATAMA',
      address: 'Jl. Contoh No. 1, Jakarta, Indonesia',
      phone: '(021) 1234-5678',
      email: 'info@adyatama.com'
    },
    footer: {
      notes: 'Terima kasih atas kepercayaan Anda',
      terms: 'Pembayaran harus diselesaikan dalam waktu 30 hari sejak tanggal terbit.'
    }
  },
  {
    id: 'professional',
    name: 'Template Profesional',
    description: 'Template invoice dengan tampilan profesional',
    header: {
      companyName: 'ADYATAMA PROFESSIONAL',
      address: 'Jl. Bisnis No. 123, Jakarta Selatan, 12345',
      phone: '(021) 9876-5432',
      email: 'professional@adyatama.com'
    },
    footer: {
      notes: 'Terima kasih telah memilih layanan kami',
      terms: 'Semua harga dalam Rupiah. Pembayaran jatuh tempo 14 hari setelah tanggal invoice.'
    }
  },
  {
    id: 'simple',
    name: 'Template Sederhana',
    description: 'Template invoice minimalis dan sederhana',
    header: {
      companyName: 'Adyatama',
      address: 'Jakarta, Indonesia',
      phone: '021-123456',
      email: 'hello@adyatama.com'
    },
    footer: {
      notes: 'Terima kasih',
      terms: 'Pembayaran dalam 7 hari.'
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      templates: defaultTemplates
    })
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      companyName,
      address,
      phone,
      email,
      notes,
      terms
    } = body

    if (!name || !companyName || !address || !phone || !email) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      )
    }

    // In real app, this would save to database
    const newTemplate: InvoiceTemplate = {
      id: `custom_${Date.now()}`,
      name,
      description,
      header: {
        companyName,
        address,
        phone,
        email
      },
      footer: {
        notes,
        terms
      }
    }

    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error: any) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    )
  }
}
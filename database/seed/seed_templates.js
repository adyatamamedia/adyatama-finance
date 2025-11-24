const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const templates = [
  {
    name: 'Template Standar',
    description: 'Template invoice standar dengan tampilan profesional',
    isDefault: true,
    isActive: true,
    companyName: 'ADYATAMA',
    companyAddress: 'Jl. Contoh No. 1, Jakarta, Indonesia',
    companyPhone: '(021) 1234-5678',
    companyEmail: 'info@adyatama.com',
    primaryColor: '#000000',
    accentColor: '#3b82f6',
    layoutStyle: 'modern',
    footerNotes: 'Terima kasih atas kepercayaan Anda',
    footerTerms: 'Pembayaran harus diselesaikan dalam waktu 30 hari sejak tanggal terbit.'
  },
  {
    name: 'Template Profesional',
    description: 'Template invoice dengan desain elegan untuk perusahaan profesional',
    isDefault: false,
    isActive: true,
    companyName: 'ADYATAMA PROFESSIONAL',
    companyAddress: 'Jl. Bisnis No. 123, Jakarta Selatan, 12345',
    companyPhone: '(021) 9876-5432',
    companyEmail: 'professional@adyatama.com',
    primaryColor: '#1f2937',
    accentColor: '#059669',
    layoutStyle: 'classic',
    footerNotes: 'Terima kasih telah memilih layanan kami',
    footerTerms: 'Semua harga dalam Rupiah. Pembayaran jatuh tempo 14 hari setelah tanggal invoice.'
  },
  {
    name: 'Template Minimalis',
    description: 'Template invoice dengan desain sederhana dan clean',
    isDefault: false,
    isActive: true,
    companyName: 'Adyatama',
    companyAddress: 'Jakarta, Indonesia',
    companyPhone: '021-123456',
    companyEmail: 'hello@adyatama.com',
    primaryColor: '#374151',
    accentColor: '#10b981',
    layoutStyle: 'minimal',
    footerNotes: 'Terima kasih',
    footerTerms: 'Pembayaran dalam 7 hari.'
  },
  {
    name: 'Template Kreatif',
    description: 'Template invoice dengan sentuhan kreatif untuk industri kreatif',
    isDefault: false,
    isActive: true,
    companyName: 'Adyatama Creative',
    companyAddress: 'Jl. Kreatif No. 45, Jakarta Barat',
    companyPhone: '(021) 555-0123',
    companyEmail: 'creative@adyatama.com',
    primaryColor: '#7c3aed',
    accentColor: '#f59e0b',
    layoutStyle: 'modern',
    footerNotes: 'Karya terbaik dimulai dari kerjasama yang baik',
    footerTerms: 'Pembayaran 50% di muka, 50% setelah proyek selesai.'
  },
  {
    name: 'Template Teknologi',
    description: 'Template invoice untuk perusahaan teknologi dan IT',
    isDefault: false,
    isActive: true,
    companyName: 'Adyatama Tech',
    companyAddress: 'Jl. Teknologi No. 88, Jakarta Pusat',
    companyPhone: '(021) 888-9999',
    companyEmail: 'tech@adyatama.com',
    primaryColor: '#0f172a',
    accentColor: '#06b6d4',
    layoutStyle: 'modern',
    footerNotes: 'Inovasi untuk masa depan',
    footerTerms: 'Pembayaran dapat dilakukan via transfer bank atau digital payment.'
  },
  {
    name: 'Template Konsultan',
    description: 'Template khusus untuk jasa konsultasi',
    isDefault: false,
    isActive: true,
    companyName: 'Adyatama Consulting',
    companyAddress: 'Jl. Konsultan No. 22, Jakarta Utara',
    companyPhone: '(021) 777-3333',
    companyEmail: 'consulting@adyatama.com',
    primaryColor: '#1e293b',
    accentColor: '#dc2626',
    layoutStyle: 'classic',
    footerNotes: 'Solusi terbaik untuk bisnis Anda',
    footerTerms: 'Pembayaran sesuai termin yang disepakati dalam kontrak.'
  }
]

async function seedTemplates() {
  try {
    console.log('🌱 Starting template seeding...')

    // Check if templates already exist
    const existingTemplates = await prisma.invoiceTemplate.count()
    if (existingTemplates > 0) {
      console.log('✅ Templates already exist. Skipping seeding.')
      return
    }

    console.log(`📝 Creating ${templates.length} invoice templates...`)

    for (const template of templates) {
      await prisma.invoiceTemplate.create({
        data: template
      })
      console.log(`✅ Created template: ${template.name}`)
    }

    console.log('🎉 Template seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding templates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedTemplates()
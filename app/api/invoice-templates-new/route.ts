import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const isDefault = searchParams.get('isDefault')
    const isActive = searchParams.get('isActive')
    const layoutStyle = searchParams.get('layoutStyle')
    const sortBy = searchParams.get('sortBy') || 'created_at_desc'

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { companyName: { contains: search } }
      ]
    }
    if (isDefault !== null && isDefault !== '') {
      where.isDefault = isDefault === 'true'
    }
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    if (layoutStyle && layoutStyle !== '' && typeof layoutStyle === 'string') {
      where.layoutStyle = layoutStyle.toUpperCase()
    }

    // Sorting
    let orderBy: any = [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]

    if (sortBy === 'name_asc') {
      orderBy = [{ name: 'asc' }]
    } else if (sortBy === 'name_desc') {
      orderBy = [{ name: 'desc' }]
    } else if (sortBy === 'created_at_asc') {
      orderBy = [{ createdAt: 'asc' }]
    } else if (sortBy === 'created_at_desc') {
      orderBy = [{ createdAt: 'desc' }]
    }

    const [templates, total] = await Promise.all([
      prisma.invoiceTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              usage: true
            }
          }
        }
      }),
      prisma.invoiceTemplate.count({ where })
    ])

    // Convert BigInt to string for JSON serialization
    const serializedTemplates = templates.map(template => {
      const serialized = {
        ...template,
        id: template.id.toString(),
        createdBy: template.createdBy?.toString() || null,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        usage_count: template._count.usage
      }

      // Map all BigInt fields to strings
      Object.keys(serialized).forEach(key => {
        if (typeof serialized[key] === 'bigint') {
          serialized[key] = serialized[key].toString()
        }
      })

      // Map fields to match frontend expectations
      return {
        ...serialized,
        is_default: template.isDefault,
        is_active: template.isActive,
        company_name: template.companyName,
        company_logo: template.companyLogo, // Ini sudah path bukan Base64
        company_address: template.companyAddress,
        company_phone: template.companyPhone,
        company_email: template.companyEmail,
        company_website: template.companyWebsite,
        tax_id: template.taxId,
        primary_color: template.primaryColor,
        secondary_color: template.secondaryColor,
        accent_color: template.accentColor,
        font_family: template.fontFamily,
        font_size_base: template.fontSizeBase,
        show_logo: template.showLogo,
        logo_position: template.logoPosition,
        show_company_details: template.showCompanyDetails,
        footer_notes: template.footerNotes,
        footer_terms: template.footerTerms,
        footer_payment_info: template.footerPaymentInfo,
        footer_bank_account: template.footerBankAccount,
        layout_style: template.layoutStyle,
        show_watermark: template.showWatermark,
        watermark_text: template.watermarkText,
        created_by: template.createdBy?.toString() || null
      }
    })

    return NextResponse.json({
      templates: serializedTemplates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching invoice templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice templates', details: error.message },
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
      company_name,
      company_logo,
      company_address,
      company_phone,
      company_email,
      company_website,
      tax_id,
      primary_color,
      secondary_color,
      accent_color,
      font_family,
      font_size_base,
      show_logo,
      logo_position,
      show_company_details,
      footer_notes,
      footer_terms,
      footer_payment_info,
      footer_bank_account,
      layout_style,
      show_watermark,
      watermark_text,
      is_default,
      created_by
    } = body

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
    }

    if (!company_name || typeof company_name !== 'string' || !company_name.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // If this is set as default, unset other default templates
    if (is_default) {
      await prisma.invoiceTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    const template = await prisma.invoiceTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        companyName: company_name.trim(),
        companyLogo: company_logo?.trim() || null,
        companyAddress: company_address?.trim() || null,
        companyPhone: company_phone?.trim() || null,
        companyEmail: company_email?.trim() || null,
        companyWebsite: company_website?.trim() || null,
        taxId: tax_id?.trim() || null,
        primaryColor: primary_color || '#000000',
        secondaryColor: secondary_color || '#666666',
        accentColor: accent_color || '#3b82f6',
        fontFamily: font_family || 'Arial, sans-serif',
        fontSizeBase: font_size_base || 12,
        showLogo: show_logo !== undefined ? show_logo : true,
        logoPosition: logo_position || 'left',
        showCompanyDetails: show_company_details !== undefined ? show_company_details : true,
        footerNotes: footer_notes?.trim() || null,
        footerTerms: footer_terms?.trim() || null,
        footerPaymentInfo: footer_payment_info?.trim() || null,
        footerBankAccount: footer_bank_account?.trim() || null,
        layoutStyle: layout_style || 'modern',
        showWatermark: show_watermark || false,
        watermarkText: watermark_text?.trim() || null,
        isDefault: is_default || false,
        createdBy: created_by ? BigInt(created_by) : null
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedTemplate = {
      ...template,
      id: template.id.toString(),
      createdBy: template.createdBy?.toString() || null,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      usage_count: 0,
      // Map fields to match frontend expectations
      is_default: template.isDefault,
      is_active: template.isActive,
      company_name: template.companyName,
      company_logo: template.companyLogo,
      company_address: template.companyAddress,
      company_phone: template.companyPhone,
      company_email: template.companyEmail,
      company_website: template.companyWebsite,
      tax_id: template.taxId,
      primary_color: template.primaryColor,
      secondary_color: template.secondaryColor,
      accent_color: template.accentColor,
      font_family: template.fontFamily,
      font_size_base: template.fontSizeBase,
      show_logo: template.showLogo,
      logo_position: template.logoPosition,
      show_company_details: template.showCompanyDetails,
      footer_notes: template.footerNotes,
      footer_terms: template.footerTerms,
      footer_payment_info: template.footerPaymentInfo,
      footer_bank_account: template.footerBankAccount,
      layout_style: template.layoutStyle,
      show_watermark: template.showWatermark,
      watermark_text: template.watermarkText,
      created_by: template.createdBy?.toString() || null
    }

    return NextResponse.json(serializedTemplate, { status: 201 })
  } catch (error: any) {
    console.error('Error creating invoice template:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Template name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create invoice template', details: error.message },
      { status: 500 }
    )
  }
}
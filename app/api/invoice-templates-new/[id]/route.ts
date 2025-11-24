import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = BigInt(resolvedParams.id)

    const template = await prisma.invoiceTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usage: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Convert BigInt to string for JSON serialization
    const serializedTemplate = {
      ...template,
      id: template.id.toString(),
      createdBy: template.createdBy?.toString() || null,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      usage_count: template._count.usage,
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

    return NextResponse.json(serializedTemplate)
  } catch (error) {
    console.error('Error fetching invoice template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice template' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = BigInt(resolvedParams.id)
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
      is_active
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
        where: {
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    const template = await prisma.invoiceTemplate.update({
      where: { id },
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
        isActive: is_active !== undefined ? is_active : true
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedTemplate = {
      ...template,
      id: template.id.toString(),
      createdBy: template.createdBy?.toString() || null,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
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
      created_by: template.createdBy?.toString() || null,
      usage_count: 0 // Would need to be calculated if needed
    }

    return NextResponse.json(serializedTemplate)
  } catch (error: any) {
    console.error('Error updating invoice template:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Template name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update invoice template', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = BigInt(resolvedParams.id)

    // Check if template is being used (optional - remove if table doesn't exist)
    try {
      const usageCount = await prisma.templateUsage.count({
        where: { templateId: id }
      })

      if (usageCount > 0) {
        return NextResponse.json(
          { error: 'Cannot delete template that is being used' },
          { status: 400 }
        )
      }
    } catch (err) {
      // If templateUsage table doesn't exist, continue with deletion
      console.log('templateUsage table not found, continuing with deletion')
    }

    // Prevent deletion of default template
    const template = await prisma.invoiceTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if (template.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default template' },
        { status: 400 }
      )
    }

    await prisma.invoiceTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting invoice template:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice template', details: error.message },
      { status: 500 }
    )
  }
}
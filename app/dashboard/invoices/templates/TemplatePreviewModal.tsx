'use client'

import { useState, useRef } from 'react'
import { formatCurrency } from '@/lib/utils'


// Helper function untuk format tanggal
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }
  return date.toLocaleDateString('id-ID', options)
}

interface TemplatePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  template: any
  sampleInvoice?: any
}

export default function TemplatePreviewModal({ isOpen, onClose, template, sampleInvoice: propSampleInvoice }: TemplatePreviewModalProps) {
  // Set initial scale based on viewport size
  const getInitialScale = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640 ? 0.4 : 0.8  // Smaller scale for mobile
    }
    return 0.8
  }
  
  const [scale, setScale] = useState(getInitialScale)
  const componentRef = useRef<HTMLDivElement>(null)

  // Use prop data if available, otherwise use default sample data
  const sampleInvoice = propSampleInvoice || {
    invoiceNo: 'INV-2024-001',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ISSUED',
    customer: {
      name: 'PT. Pelanggan Contoh',
      address: 'Jl. Pelanggan No. 123, Jakarta, Indonesia',
      email: 'info@pelanggan.com',
      phone: '(021) 9876-5432'
    },
    items: [
      {
        description: 'Jasa Konsultasi Bisnis',
        quantity: 1,
        unit_price: 5000000,
        discount: 0,
        subtotal: 5000000
      },
      {
        description: 'Development Website',
        quantity: 1,
        unit_price: 15000000,
        discount: 1000000,
        subtotal: 14000000
      },
      {
        description: 'Maintenance Support (3 Bulan)',
        quantity: 3,
        unit_price: 1500000,
        discount: 0,
        subtotal: 4500000
      }
    ],
    subtotal: 23500000,
    discount: 1000000,
    tax: 2350000,
    total: 24850000
  }

  const handleDownloadPDF = async () => {
    if (typeof window === 'undefined') return

    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = componentRef.current

      if (!element) {
        console.error('Preview element not found')
        return
      }

      const opt = {
        margin: 0,
        filename: `Invoice-${sampleInvoice.invoiceNo}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      }

      html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups for this website to enable printing')
      return
    }

    let layoutHTML = '';

    switch (template.layoutStyle) {
      case 'classic':
        layoutHTML = `
          <div class="bg-white" style="
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 40px;
            font-family: ${template.fontFamily || 'Arial, sans-serif'};
            font-size: ${template.fontSizeBase || 12}px;
            color: #333;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          ">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
              <div>
                ${template.showLogo && template.companyLogo ?
                  `<img src="${template.companyLogo}" alt="Company Logo" style="height: 60px; max-width: 200px; margin-bottom: 10px;">`
                  : ''}
                <h1 style="font-size: 24px; margin: 0; color: ${template.primaryColor};">${template.companyName}</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px;">${template.companyAddress}</p>
                <p style="margin: 2px 0; font-size: 14px;">${template.companyPhone} | ${template.companyEmail}</p>
              </div>
              <div style="text-align: right;">
                <h2 style="font-size: 36px; margin: 0; color: ${template.accentColor};">INVOICE</h2>
                <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">#${sampleInvoice.invoiceNo}</p>
                <p style="margin: 2px 0; font-size: 14px;">Tanggal: ${formatDate(sampleInvoice.issueDate)}</p>
                <p style="margin: 2px 0; font-size: 14px;">Jatuh Tempo: ${formatDate(sampleInvoice.dueDate)}</p>
              </div>
            </div>

            <!-- Customer & Invoice Details -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
              <div>
                <h3 style="font-size: 16px; margin: 0 0 10px 0; color: ${template.primaryColor};">Ditagihkan Kepada:</h3>
                <p style="font-size: 15px; font-weight: bold; margin: 0;">${sampleInvoice.customer.name}</p>
                <p style="margin: 2px 0; font-size: 14px;">${sampleInvoice.customer.address}</p>
                <p style="margin: 2px 0; font-size: 14px;">${sampleInvoice.customer.email}</p>
                <p style="margin: 2px 0; font-size: 14px;">${sampleInvoice.customer.phone}</p>
              </div>
              <div style="text-align: right;">
                <table style="font-size: 14px;">
                    <tr>
                      <td style="padding: 3px 10px; text-align: right; font-weight: bold;">Status:</td>
                      <td style="padding: 3px 0 3px 10px; text-align: right;">
                        <span style="
                          background-color: ${template.accentColor};
                          color: white;
                          padding: 2px 8px;
                          border-radius: 4px;
                          font-size: 11px;
                          font-weight: bold;
                          text-transform: uppercase;
                        ">${sampleInvoice.status}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 3px 10px; text-align: right; font-weight: bold;">Tanggal:</td>
                      <td style="padding: 3px 0 3px 10px; text-align: right;">${formatDate(sampleInvoice.issueDate)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 3px 10px; text-align: right; font-weight: bold;">Jatuh Tempo:</td>
                      <td style="padding: 3px 0 3px 10px; text-align: right;">${formatDate(sampleInvoice.dueDate)}</td>
                    </tr>
                  </table>
                </div>
              </div>

              <!-- Items Table -->
              <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse; border: 1px solid #000;">
                <thead>
                  <tr style="background-color: #f0f0f0; border-bottom: 2px solid #000;">
                    <th style="padding: 12px; text-align: left; border-right: 1px solid #000; font-weight: bold;">DESKRIPSI</th>
                    <th style="padding: 12px; text-align: center; border-right: 1px solid #000; width: 80px; font-weight: bold;">JML</th>
                    <th style="padding: 12px; text-align: right; border-right: 1px solid #000; width: 120px; font-weight: bold;">HARGA</th>
                    <th style="padding: 12px; text-align: right; border-right: 1px solid #000; width: 100px; font-weight: bold;">DISKON</th>
                    <th style="padding: 12px; text-align: right; width: 120px; font-weight: bold;">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  ${sampleInvoice.items.map((item: any) => `
                    <tr style="border-bottom: 1px solid #ccc;">
                      <td style="padding: 10px 12px; border-right: 1px solid #ccc;">${item.description}</td>
                      <td style="padding: 10px 12px; text-align: center; border-right: 1px solid #ccc;">${item.quantity}</td>
                      <td style="padding: 10px 12px; text-align: right; border-right: 1px solid #ccc;">${formatCurrency(item.unit_price)}</td>
                      <td style="padding: 10px 12px; text-align: right; border-right: 1px solid #ccc;">${item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
                      <td style="padding: 10px 12px; text-align: right;">${formatCurrency(item.subtotal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- Summary -->
              <div style="display: flex; justify-content: flex-end;">
                <table style="width: 350px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0; text-align: right; font-weight: bold;">Subtotal:</td>
                    <td style="padding: 5px 0 5px 20px; text-align: right;">${formatCurrency(sampleInvoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; text-align: right; font-weight: bold;">Diskon:</td>
                    <td style="padding: 5px 0 5px 20px; text-align: right;">-${formatCurrency(sampleInvoice.discount)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; text-align: right; font-weight: bold;">Pajak (10%):</td>
                    <td style="padding: 5px 0 5px 20px; text-align: right;">${formatCurrency(sampleInvoice.tax)}</td>
                  </tr>
                  <tr style="border-top: 2px solid #000;">
                    <td style="padding: 10px 0; text-align: right; font-size: 18px; font-weight: bold; color: ${template.accentColor};">TOTAL:</td>
                    <td style="padding: 10px 0 10px 20px; text-align: right; font-size: 18px; font-weight: bold; color: ${template.accentColor};">${formatCurrency(sampleInvoice.total)}</td>
                  </tr>
                </table>
              </div>

              <!-- Footer -->
              ${(template.footerNotes || template.footerTerms) ? `
                <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; font-style: italic;">
                  ${template.footerNotes ? `<p style="margin-bottom: 5px;">${template.footerNotes}</p>` : ''}
                  ${template.footerTerms ? `<p style="font-size: 11px;">${template.footerTerms}</p>` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        `;
        break;

      case 'minimal':
        layoutHTML = `
          <div class="bg-white" style="
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 50px;
            font-family: ${template.fontFamily || 'Arial, sans-serif'};
            font-size: ${template.fontSizeBase || 12}px;
            color: #444;
          ">
            <!-- Header -->
            <div style="margin-bottom: 60px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  ${template.showLogo && template.companyLogo ?
                    `<img src="${template.companyLogo}" alt="Company Logo" style="height: 50px; max-width: 150px; margin-bottom: 20px;">`
                    : ''}
                  <h1 style="
                    font-size: 24px;
                    font-weight: normal;
                    margin: 0 0 5px 0;
                    color: #000;
                    letter-spacing: 1px;
                  ">
                    ${template.companyName}
                  </h1>
                  <div style="font-size: 13px; color: #666;">
                    ${template.companyAddress ? `<p style="margin: 0;">${template.companyAddress}</p>` : ''}
                    <div style="margin-top: 5px;">
                      ${template.companyPhone ? `<span>${template.companyPhone}</span>` : ''}
                      ${template.companyEmail ? `<span style="margin-left: 10px;">${template.companyEmail}</span>` : ''}
                    </div>
                  </div>
                </div>

                <div style="text-align: right;">
                  <h2 style="
                    font-size: 42px;
                    font-weight: 300;
                    margin: 0 0 10px 0;
                    color: #ccc;
                    letter-spacing: 5px;
                  ">INVOICE</h2>
                  <div style="font-size: 14px;">
                    <p style="margin: 3px 0;"><span style="color: #999;">NO.</span> ${sampleInvoice.invoiceNo}</p>
                    <p style="margin: 3px 0;"><span style="color: #999;">DATE.</span> ${formatDate(sampleInvoice.issueDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bill To -->
            <div style="margin-bottom: 50px; padding-left: 20px; border-left: 2px solid ${template.primaryColor};">
              <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 5px;">Bill To</p>
              <h3 style="font-size: 18px; font-weight: normal; margin: 0 0 5px 0;">${sampleInvoice.customer.name}</h3>
              <div style="font-size: 14px; color: #666;">
                <p style="margin: 0;">${sampleInvoice.customer.address}</p>
                <p style="margin: 0;">${sampleInvoice.customer.email}</p>
              </div>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; margin-bottom: 40px; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #eee;">
                  <th style="padding: 15px 0; text-align: left; font-weight: normal; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">DESCRIPTION</th>
                  <th style="padding: 15px 0; text-align: center; font-weight: normal; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">QTY</th>
                  <th style="padding: 15px 0; text-align: right; font-weight: normal; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">PRICE</th>
                  <th style="padding: 15px 0; text-align: right; font-weight: normal; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">DISC</th>
                  <th style="padding: 15px 0; text-align: right; font-weight: normal; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${sampleInvoice.items.map((item: any) => `
                  <tr style="border-bottom: 1px solid #f9f9f9;">
                    <td style="padding: 15px 0;">${item.description}</td>
                    <td style="padding: 15px 0; text-align: center;">${item.quantity}</td>
                    <td style="padding: 15px 0; text-align: right;">${formatCurrency(item.unit_price)}</td>
                    <td style="padding: 15px 0; text-align: right; color: #999;">${item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
                    <td style="padding: 15px 0; text-align: right;">${formatCurrency(item.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Summary -->
            <div style="display: flex; justify-content: flex-end;">
              <div style="width: 300px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                  <span style="color: #999;">Subtotal</span>
                  <span>${formatCurrency(sampleInvoice.subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                  <span style="color: #999;">Discount</span>
                  <span>-${formatCurrency(sampleInvoice.discount)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px;">
                  <span style="color: #999;">Tax (10%)</span>
                  <span>${formatCurrency(sampleInvoice.tax)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 1px solid #eee; font-size: 20px;">
                  <span style="font-weight: normal;">Total</span>
                  <span style="font-weight: bold; color: ${template.accentColor};">${formatCurrency(sampleInvoice.total)}</span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            ${(template.footerNotes || template.footerTerms) ? `
              <div style="position: absolute; bottom: 50px; left: 50px; right: 50px; text-align: center; color: #999; font-size: 12px;">
                ${template.footerNotes ? `<p style="margin-bottom: 5px;">${template.footerNotes}</p>` : ''}
              </div>
            ` : ''}
          </div>
        `;
        break;

      case 'modern':
      default:
        layoutHTML = `
          <div class="bg-white shadow-lg" style="
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background-color: #ffffff;
            font-family: ${template.fontFamily || 'Arial, sans-serif'};
            font-size: ${template.fontSizeBase || 12}px;
            color: #333;
          ">
            <!-- Header Background -->
            <div style="
              background-color: ${template.primaryColor};
              height: 15px;
              width: 100%;
            "></div>

            <div style="padding: 40px;">
              <!-- Header -->
              <div style="display: flex; justify-content: space-between; margin-bottom: 50px;">
                <div>
                  ${template.showLogo && template.companyLogo ?
                    `<img src="${template.companyLogo}" alt="Company Logo" style="height: 60px; max-width: 200px; margin-bottom: 15px;">`
                    : ''}
                  <h1 style="
                    font-size: 28px;
                    font-weight: 800;
                    margin: 0;
                    color: ${template.primaryColor};
                  ">
                    ${template.companyName}
                  </h1>
                  <div style="margin-top: 10px; font-size: 14px; color: #555;">
                    ${template.companyAddress ? `<p style="margin: 2px 0;">${template.companyAddress}</p>` : ''}
                    <div style="margin-top: 5px;">
                      ${template.companyPhone ? `<span>${template.companyPhone}</span>` : ''}
                      ${template.companyEmail ? `<span style="margin-left: 10px;">${template.companyEmail}</span>` : ''}
                    </div>
                    ${template.companyWebsite ? `<p style="margin: 5px 0 0 0; color: ${template.accentColor};">${template.companyWebsite}</p>` : ''}
                  </div>
                </div>

                <div style="text-align: right;">
                  <div style="
                    background-color: ${template.accentColor}15;
                    padding: 15px 25px;
                    border-radius: 8px;
                    display: inline-block;
                    text-align: right;
                  ">
                    <h2 style="
                      font-size: 24px;
                      font-weight: bold;
                      margin: 0 0 5px 0;
                      color: ${template.accentColor};
                    ">INVOICE</h2>
                    <p style="margin: 0; font-weight: bold; font-size: 16px;">#${sampleInvoice.invoiceNo}</p>
                    <div style="margin-top: 10px; font-size: 13px;">
                      <p style="margin: 2px 0;">Issued: ${formatDate(sampleInvoice.issueDate)}</p>
                      <p style="margin: 2px 0;">Due: ${formatDate(sampleInvoice.dueDate)}</p>
                    </div>
                    <div style="margin-top: 8px;">
                      <span style="
                        background-color: ${template.accentColor};
                        color: white;
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: bold;
                        text-transform: uppercase;
                      ">${sampleInvoice.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bill To -->
              <div style="margin-bottom: 40px; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${template.primaryColor};">
                <h3 style="font-size: 14px; text-transform: uppercase; color: #888; margin: 0 0 10px 0; font-weight: bold;">Bill To:</h3>
                <p style="font-size: 18px; font-weight: bold; margin: 0 0 5px 0; color: #333;">${sampleInvoice.customer.name}</p>
                <div style="font-size: 14px; color: #555;">
                  <p style="margin: 0;">${sampleInvoice.customer.address}</p>
                  <p style="margin: 0;">${sampleInvoice.customer.email}</p>
                  <p style="margin: 0;">${sampleInvoice.customer.phone}</p>
                </div>
              </div>

              <!-- Items Table -->
              <table style="width: 100%; margin-bottom: 30px; border-collapse: separate; border-spacing: 0;">
                <thead>
                  <tr style="background-color: ${template.primaryColor}; color: white;">
                    <th style="padding: 12px 15px; text-align: left; border-radius: 6px 0 0 6px;">Deskripsi</th>
                    <th style="padding: 12px 15px; text-align: center;">Qty</th>
                    <th style="padding: 12px 15px; text-align: right;">Harga</th>
                    <th style="padding: 12px 15px; text-align: right;">Diskon</th>
                    <th style="padding: 12px 15px; text-align: right; border-radius: 0 6px 6px 0;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${sampleInvoice.items.map((item: any, index: number) => `
                    <tr style="background-color: ${index % 2 === 0 ? '#fff' : '#f9f9f9'};">
                      <td style="padding: 12px 15px; border-bottom: 1px solid #eee;">${item.description}</td>
                      <td style="padding: 12px 15px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                      <td style="padding: 12px 15px; text-align: right; border-bottom: 1px solid #eee;">${formatCurrency(item.unit_price)}</td>
                      <td style="padding: 12px 15px; text-align: right; border-bottom: 1px solid #eee;">${item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
                      <td style="padding: 12px 15px; text-align: right; font-weight: bold; border-bottom: 1px solid #eee;">${formatCurrency(item.subtotal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- Summary -->
              <div style="display: flex; justify-content: flex-end;">
                <div style="width: 300px; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
                    <span style="color: #666;">Subtotal:</span>
                    <span style="font-weight: bold;">${formatCurrency(sampleInvoice.subtotal)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
                    <span style="color: #666;">Diskon:</span>
                    <span style="color: #e53e3e;">-${formatCurrency(sampleInvoice.discount)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px;">
                    <span style="color: #666;">Pajak (10%):</span>
                    <span>${formatCurrency(sampleInvoice.tax)}</span>
                  </div>
                  <div style="
                    display: flex;
                    justify-content: space-between;
                    padding-top: 15px;
                    border-top: 2px solid ${template.accentColor};
                    font-size: 18px;
                    font-weight: bold;
                    color: ${template.accentColor};
                  ">
                    <span>Total:</span>
                    <span>${formatCurrency(sampleInvoice.total)}</span>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              ${(template.footerNotes || template.footerTerms) ? `
                <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee;">
                  ${template.footerNotes ? `<p style="font-size: 14px; color: #444; margin-bottom: 10px;">${template.footerNotes}</p>` : ''}
                  ${template.footerTerms ? `<p style="font-size: 12px; color: #888;">${template.footerTerms}</p>` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        `;
        break;
    }

    // Write the content to the new window with proper styling
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice-${sampleInvoice.invoiceNo}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              font-family: ${template.fontFamily || 'Arial, sans-serif'};
              font-size: ${template.fontSizeBase || 12}px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          ${layoutHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    // Wait for the content to load before printing
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  if (!isOpen) return null

  // Modern Layout - Clean, contemporary design with bold accents
  const renderModernTemplate = () => (
    <div
      className="bg-white shadow-lg"
      style={{
        fontFamily: template.fontFamily || 'Arial, sans-serif',
        fontSize: `${template.fontSizeBase || 12}px`
      }}
    >
      {/* Header Background */}
      <div style={{ backgroundColor: template.primaryColor, height: '15px', width: '100%' }}></div>

      <div className="p-10">
        {/* Header */}
        <div className="flex justify-between mb-12">
          <div>
            {template.showLogo && template.companyLogo && (
              <img
                src={template.companyLogo}
                alt="Company Logo"
                className="h-16 w-auto max-w-xs mb-4"
              />
            )}
            <div>
              <h1
                className="text-3xl font-extrabold mb-2"
                style={{ color: template.primaryColor }}
              >
                {template.companyName}
              </h1>
              <div className="text-sm text-gray-600 mt-2">
                {template.companyAddress && (
                  <p className="mb-1">{template.companyAddress}</p>
                )}
                <div className="flex gap-4">
                  {template.companyPhone && <span>{template.companyPhone}</span>}
                  {template.companyEmail && <span>{template.companyEmail}</span>}
                </div>
                {template.companyWebsite && (
                  <p className="mt-1" style={{ color: template.accentColor }}>{template.companyWebsite}</p>
                )}
                {template.taxId && (
                  <p className="text-xs text-gray-500 mt-1">NPWP: {template.taxId}</p>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div 
              className="inline-block text-right p-4 rounded-lg"
              style={{ backgroundColor: `${template.accentColor}15` }}
            >
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: template.accentColor }}
              >
                INVOICE
              </div>
              <p className="font-bold text-lg mb-2">#{sampleInvoice.invoiceNo}</p>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-600">Issued:</span> <span className="font-medium">{formatDate(sampleInvoice.issueDate)}</span></p>
                <p><span className="text-gray-600">Due:</span> <span className="font-medium">{formatDate(sampleInvoice.dueDate)}</span></p>
              </div>
              <div className="mt-2">
                <span
                  className="inline-flex px-3 py-1 text-xs font-bold rounded uppercase"
                  style={{
                    backgroundColor: template.accentColor,
                    color: 'white'
                  }}
                >
                  {sampleInvoice.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div 
          className="mb-10 p-6 rounded-lg border-l-4"
          style={{ 
            backgroundColor: '#f8f9fa',
            borderColor: template.primaryColor 
          }}
        >
          <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Bill To:</h3>
          <p className="text-lg font-bold text-gray-800 mb-1">{sampleInvoice.customer.name}</p>
          <div className="text-sm text-gray-600">
            <p>{sampleInvoice.customer.address}</p>
            <p>{sampleInvoice.customer.email}</p>
            <p>{sampleInvoice.customer.phone}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 border-separate border-spacing-0">
          <thead>
            <tr style={{ backgroundColor: template.primaryColor, color: 'white' }}>
              <th className="text-left p-3 rounded-tl-md">Deskripsi</th>
              <th className="text-center p-3">Qty</th>
              <th className="text-right p-3">Harga</th>
              <th className="text-right p-3">Diskon</th>
              <th className="text-right p-3 rounded-tr-md">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sampleInvoice.items.map((item: any, index: number) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                <td className="p-3 border-b border-gray-100">{item.description}</td>
                <td className="p-3 text-center border-b border-gray-100">{item.quantity}</td>
                <td className="p-3 text-right border-b border-gray-100">{formatCurrency(item.unit_price)}</td>
                <td className="p-3 text-right border-b border-gray-100">{item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
                <td className="p-3 text-right font-bold border-b border-gray-100">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end">
          <div className="w-80 p-6 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-bold">{formatCurrency(sampleInvoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Diskon:</span>
              <span className="text-red-600">-{formatCurrency(sampleInvoice.discount)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-600">Pajak (10%):</span>
              <span>{formatCurrency(sampleInvoice.tax)}</span>
            </div>
            <div
              className="flex justify-between text-lg font-bold pt-4 border-t-2"
              style={{ 
                borderColor: template.accentColor,
                color: template.accentColor 
              }}
            >
              <span>Total:</span>
              <span>{formatCurrency(sampleInvoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        {(template.footerNotes || template.footerTerms) && (
          <div className="mt-12 pt-6 border-t border-gray-100">
            {template.footerNotes && (
              <p className="text-sm text-gray-800 mb-2">{template.footerNotes}</p>
            )}
            {template.footerTerms && (
              <p className="text-xs text-gray-500">{template.footerTerms}</p>
            )}
          </div>
        )}

        {/* Watermark */}
        {template.showWatermark && template.watermarkText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.1 }}>
            <div
              className="text-6xl font-bold transform rotate-45"
              style={{ color: template.primaryColor }}
            >
              {template.watermarkText}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Classic Layout - Traditional, formal design with serif fonts and classic structure
  const renderClassicTemplate = () => (
    <div
      className="bg-white"
      style={{
        fontFamily: template.fontFamily || "'Times New Roman', serif",
        fontSize: `${template.fontSizeBase || 12}px`,
        padding: '40px'
      }}
    >
      <div 
        className="h-full p-8"
        style={{ 
          border: `4px double ${template.primaryColor}`,
          minHeight: '280mm'
        }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-6 mb-8" style={{ borderColor: template.primaryColor }}>
          {template.showLogo && template.companyLogo && (
            <img
              src={template.companyLogo}
              alt="Company Logo"
              className="h-20 mx-auto mb-4"
            />
          )}
          <h1
            className="text-4xl font-bold mb-2 uppercase tracking-wider"
            style={{ color: template.primaryColor }}
          >
            {template.companyName}
          </h1>
          <div className="text-sm space-y-1">
            {template.companyAddress && <p>{template.companyAddress}</p>}
            <div className="flex justify-center gap-6">
              {template.companyPhone && <span>Telp: {template.companyPhone}</span>}
              {template.companyEmail && <span>Email: {template.companyEmail}</span>}
            </div>
            {template.taxId && <p>NPWP: {template.taxId}</p>}
          </div>
        </div>

        {/* Invoice Title & Details */}
        <div className="flex justify-between items-end mb-10">
          <div className="text-left">
            <h3 className="font-bold underline mb-2" style={{ color: template.primaryColor }}>KEPADA:</h3>
            <div className="text-sm leading-relaxed">
              <p className="font-bold">{sampleInvoice.customer.name}</p>
              <p>{sampleInvoice.customer.address}</p>
              <p>{sampleInvoice.customer.email}</p>
              <p>{sampleInvoice.customer.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: template.accentColor }}
            >
              INVOICE
            </h2>
            <table className="text-sm ml-auto">
              <tbody>
                <tr>
                  <td className="font-bold pr-4 text-right">No. Invoice:</td>
                  <td className="text-right">{sampleInvoice.invoiceNo}</td>
                </tr>
                <tr>
                  <td className="font-bold pr-4 text-right">Tanggal:</td>
                  <td className="text-right">{formatDate(sampleInvoice.issueDate)}</td>
                </tr>
                <tr>
                  <td className="font-bold pr-4 text-right">Jatuh Tempo:</td>
                  <td className="text-right">{formatDate(sampleInvoice.dueDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 border border-black">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="text-left p-3 border-r border-black font-bold">DESKRIPSI</th>
              <th className="text-center p-3 border-r border-black font-bold w-20">JML</th>
              <th className="text-right p-3 border-r border-black font-bold w-32">HARGA</th>
              <th className="text-right p-3 border-r border-black font-bold w-24">DISKON</th>
              <th className="text-right p-3 font-bold w-32">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {sampleInvoice.items.map((item: any, index: number) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="p-3 border-r border-gray-300">{item.description}</td>
                <td className="p-3 text-center border-r border-gray-300">{item.quantity}</td>
                <td className="p-3 text-right border-r border-gray-300">{formatCurrency(item.unit_price)}</td>
                <td className="p-3 text-right border-r border-gray-300">{item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
                <td className="p-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end">
          <table className="w-80">
            <tbody>
              <tr>
                <td className="py-1 text-right font-bold pr-4">Subtotal:</td>
                <td className="py-1 text-right">{formatCurrency(sampleInvoice.subtotal)}</td>
              </tr>
              <tr>
                <td className="py-1 text-right font-bold pr-4">Diskon:</td>
                <td className="py-1 text-right">-{formatCurrency(sampleInvoice.discount)}</td>
              </tr>
              <tr>
                <td className="py-1 text-right font-bold pr-4">Pajak (10%):</td>
                <td className="py-1 text-right">{formatCurrency(sampleInvoice.tax)}</td>
              </tr>
              <tr className="border-t-2 border-black">
                <td className="py-2 text-right font-bold text-lg pr-4" style={{ color: template.accentColor }}>TOTAL:</td>
                <td className="py-2 text-right font-bold text-lg" style={{ color: template.accentColor }}>{formatCurrency(sampleInvoice.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {(template.footerNotes || template.footerTerms) && (
          <div className="mt-16 pt-6 border-t border-gray-300 text-center italic">
            <div className="text-sm">
              {template.footerNotes && <p className="mb-2">{template.footerNotes}</p>}
              {template.footerTerms && <p className="text-xs">{template.footerTerms}</p>}
            </div>
          </div>
        )}

        {/* Watermark */}
        {template.showWatermark && template.watermarkText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.05 }}>
            <div
              className="text-6xl font-bold transform -rotate-45"
              style={{ color: template.primaryColor }}
            >
              {template.watermarkText}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Minimal Layout - Ultra-simple, clean design with maximum white space
  const renderMinimalTemplate = () => (
    <div
      className="bg-white"
      style={{
        fontFamily: template.fontFamily || 'Arial, sans-serif',
        fontSize: `${template.fontSizeBase || 12}px`,
        padding: '50px'
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="flex justify-between items-start">
            <div>
              {template.showLogo && template.companyLogo && (
                <img
                  src={template.companyLogo}
                  alt="Company Logo"
                  className="h-12 w-auto mb-6"
                />
              )}
              <h1
                className="text-2xl font-normal mb-1 tracking-wide"
                style={{ color: 'black' }}
              >
                {template.companyName}
              </h1>
              <div className="text-sm text-gray-500">
                {template.companyAddress && <p className="mb-1">{template.companyAddress}</p>}
                <div className="flex gap-4">
                  {template.companyPhone && <span>{template.companyPhone}</span>}
                  {template.companyEmail && <span>{template.companyEmail}</span>}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div
                className="text-4xl font-light mb-4 tracking-[0.2em] text-gray-300"
              >
                INVOICE
              </div>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-400 uppercase text-xs tracking-wider mr-2">No.</span> <span className="font-medium">{sampleInvoice.invoiceNo}</span></p>
                <p><span className="text-gray-400 uppercase text-xs tracking-wider mr-2">Date</span> <span className="font-medium">{formatDate(sampleInvoice.issueDate)}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-12 pl-6 border-l-2" style={{ borderColor: template.primaryColor }}>
          <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-2">Bill To</h3>
          <div className="text-sm space-y-1">
            <p className="font-normal text-lg mb-1">{sampleInvoice.customer.name}</p>
            <p className="text-gray-600">{sampleInvoice.customer.address}</p>
            <p className="text-gray-600">{sampleInvoice.customer.email}</p>
            <p className="text-gray-600">{sampleInvoice.customer.phone}</p>
          </div>
        </div>

        {/* Items Table - Minimal borders */}
        <table className="w-full mb-12">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs pb-4 font-normal text-gray-400 uppercase tracking-widest">Description</th>
              <th className="text-center text-xs pb-4 font-normal text-gray-400 uppercase tracking-widest w-20">Qty</th>
              <th className="text-right text-xs pb-4 font-normal text-gray-400 uppercase tracking-widest w-32">Price</th>
              <th className="text-right text-xs pb-4 font-normal text-gray-400 uppercase tracking-widest w-24">Disc</th>
              <th className="text-right text-xs pb-4 font-normal text-gray-400 uppercase tracking-widest w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {sampleInvoice.items.map((item: any, index: number) => (
              <tr key={index} className="border-b border-gray-50">
                <td className="py-4 text-sm">{item.description}</td>
                <td className="py-4 text-center text-sm text-gray-600">{item.quantity}</td>
                <td className="py-4 text-right text-sm text-gray-600">{formatCurrency(item.unit_price)}</td>
                <td className="py-4 text-right text-sm text-gray-400">{item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
                <td className="py-4 text-right font-medium text-sm">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary - Minimal styling */}
        <div className="flex justify-end">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span>{formatCurrency(sampleInvoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Discount</span>
              <span>-{formatCurrency(sampleInvoice.discount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tax (10%)</span>
              <span>{formatCurrency(sampleInvoice.tax)}</span>
            </div>
            <div
              className="flex justify-between text-xl font-light pt-4 border-t border-gray-100 mt-4"
            >
              <span className="text-gray-800">Total</span>
              <span style={{ color: template.accentColor, fontWeight: 'bold' }}>{formatCurrency(sampleInvoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        {(template.footerNotes || template.footerTerms) && (
          <div className="mt-20 pt-6 border-t border-gray-100 text-center">
            <div className="text-xs text-gray-400">
              {template.footerNotes && <p className="mb-1">{template.footerNotes}</p>}
              {template.footerTerms && <p>{template.footerTerms}</p>}
            </div>
          </div>
        )}

        {/* Watermark */}
        {template.showWatermark && template.watermarkText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.02 }}>
            <div
              className="text-6xl font-bold"
              style={{ color: template.primaryColor }}
            >
              {template.watermarkText}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderTemplate = () => {
    switch (template.layoutStyle) {
      case 'classic':
        return renderClassicTemplate();
      case 'minimal':
        return renderMinimalTemplate();
      case 'modern':
      default:
        return renderModernTemplate();
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-w-6xl bg-white sm:rounded-lg shadow-xl flex flex-col sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 flex-shrink-0">
          <h2 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
            Preview: {template.name}
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Zoom Controls - Mobile */}
            <div className="flex items-center gap-1 sm:hidden flex-1">
              <button
                type="button"
                className="flex-1 inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm px-2 py-1.5 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                onClick={() => setScale(prev => Math.max(0.3, prev - 0.1))}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xs text-gray-600 whitespace-nowrap">{Math.round(scale * 100)}%</span>
              <button
                type="button"
                className="flex-1 inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm px-2 py-1.5 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                onClick={() => setScale(prev => Math.min(1.5, prev + 0.1))}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Action Buttons */}
            <button
              type="button"
              className="inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-xs sm:text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handlePrint}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Print</span>
            </button>
            
            <div className="inline-block">
             <button
              type="button"
              className="inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-2 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-xs sm:text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={handleDownloadPDF}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">PDF</span>
            </button>
            </div>

            <button
              onClick={onClose}
              className="inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm px-2 sm:px-4 py-1.5 sm:py-2 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-2 sm:p-4 md:p-8">
          <div ref={componentRef} className="max-w-[210mm] mx-auto bg-white shadow-lg transition-transform origin-top" style={{ transform: `scale(${scale})` }}>
            {renderTemplate()}
          </div>
        </div>

        {/* Zoom Controls - Desktop */}
        <div className="hidden sm:flex items-center justify-center gap-3 px-6 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 shadow-sm px-3 py-1.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            onClick={() => setScale(prev => Math.max(0.3, prev - 0.1))}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
            </svg>
            Zoom Out
          </button>
          <span className="text-sm text-gray-600 font-medium min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 shadow-sm px-3 py-1.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            onClick={() => setScale(prev => Math.min(1.5, prev + 0.1))}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Zoom In
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 shadow-sm px-3 py-1.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            onClick={() => setScale(0.8)}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
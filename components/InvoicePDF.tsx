'use client'

import { formatCurrency } from '@/lib/utils'

interface InvoicePDFProps {
  template: any
  invoice: any
}

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

export default function InvoicePDF({ template, invoice }: InvoicePDFProps) {
  // A4 dimensions in pixels at 96 DPI (approximate)
  const a4Width = 794 // 210mm
  const a4Height = 1123 // 297mm

  // Determine layout style - default to modern
  const layoutStyle = template?.layoutStyle || 'modern'

  // Base container style
  const baseContainerStyle: React.CSSProperties = {
    width: `${a4Width}px`,
    minHeight: `${a4Height}px`,
    margin: '0 auto',
    backgroundColor: '#ffffff',
    fontFamily: template?.fontFamily || 'Arial, sans-serif',
    fontSize: `${template?.fontSizeBase || 12}px`,
    color: '#000000',
    position: 'relative',
    overflow: 'hidden'
  }

  // Layout-specific container styles
  const containerStyle: React.CSSProperties = {
    ...baseContainerStyle,
    ...(layoutStyle === 'classic' && {
      fontFamily: template?.fontFamily || "'Times New Roman', serif",
      fontSize: `${template?.fontSizeBase || 12}px`,
    }),
    ...(layoutStyle === 'minimal' && {
      fontFamily: template?.fontFamily || 'Arial, sans-serif',
      fontSize: `${template?.fontSizeBase || 12}px`,
    })
  }

  // Layout-specific styles
  const getHeaderStyle = () => {
    switch (layoutStyle) {
      case 'classic':
        return {
          borderTop: `2px solid ${template?.primaryColor || '#000000'}`,
          borderBottom: `2px solid ${template?.primaryColor || '#000000'}`,
          padding: '30px 50px',
          backgroundColor: '#ffffff',
          textAlign: 'center' as const
        }
      case 'minimal':
        return {
          padding: '40px 60px 20px 60px',
          backgroundColor: '#ffffff'
        }
      default: // modern
        return {
          borderBottom: `2px solid ${template?.primaryColor || '#000000'}`,
          padding: '40px 60px 20px 60px',
          backgroundColor: '#ffffff'
        }
    }
  }

  const getBodyStyle = () => {
    switch (layoutStyle) {
      case 'classic':
        return {
          padding: '40px 50px',
          minHeight: '600px'
        }
      case 'minimal':
        return {
          padding: '30px 60px',
          minHeight: '600px'
        }
      default: // modern
        return {
          padding: '40px 60px',
          minHeight: '600px'
        }
    }
  }

  const getFooterStyle = () => {
    switch (layoutStyle) {
      case 'classic':
        return {
          borderTop: `2px solid ${template?.primaryColor || '#000000'}`,
          padding: '25px 50px',
          backgroundColor: '#ffffff',
          textAlign: 'center' as const,
          fontSize: '12px'
        }
      case 'minimal':
        return {
          borderTop: `1px solid #e5e7eb`,
          padding: '20px 60px',
          backgroundColor: '#ffffff',
          fontSize: '11px'
        }
      default: // modern
        return {
          borderTop: `1px solid ${template?.primaryColor || '#000000'}`,
          padding: '20px 60px',
          backgroundColor: '#f9f9f9',
          marginTop: 'auto'
        }
    }
  }

  const watermarkStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    // Different opacity for each layout
    transform: layoutStyle === 'classic'
      ? 'translate(-50%, -50%)'
      : 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: layoutStyle === 'classic' ? '60px' : '72px',
    color: `${template?.primaryColor || '#000000'}${layoutStyle === 'minimal' ? '05' : layoutStyle === 'classic' ? '05' : '20'}`,
    fontWeight: 'bold',
    zIndex: 1,
    pointerEvents: 'none'
  }

  // Render header based on layout
  const renderHeader = () => {
    const headerStyle = getHeaderStyle()

    if (layoutStyle === 'classic') {
      return (
        <div style={headerStyle}>
          {/* Logo in center for classic layout */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            {template?.showLogo && template?.companyLogo && (
              <img
                src={template.companyLogo}
                alt="Company Logo"
                style={{ height: '60px', maxWidth: '200px', objectFit: 'contain' }}
              />
            )}
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            color: template?.primaryColor || '#000000',
            fontFamily: template?.fontFamily || "'Times New Roman', serif",
          }}>
            {template?.companyName || 'Company Name'}
          </h1>

          {template?.showCompanyDetails && (
            <div style={{
              fontSize: '14px',
              color: '#666666',
              lineHeight: '1.5',
              textAlign: 'center' as const
            }}>
              {template?.companyAddress && (
                <div style={{ marginBottom: '5px' }}>{template.companyAddress}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {template?.companyPhone && <div>{template.companyPhone}</div>}
                {template?.companyEmail && <div>{template.companyEmail}</div>}
              </div>
              {template?.companyWebsite && (
                <div style={{ marginTop: '5px' }}>
                  <a href={template.companyWebsite} style={{ color: template?.accentColor || '#3b82f6' }}>
                    {template.companyWebsite}
                  </a>
                </div>
              )}
              {template?.taxId && (
                <div style={{ fontSize: '12px', marginTop: '5px' }}>NPWP: {template.taxId}</div>
              )}
            </div>
          )}

          {/* Invoice title for classic layout */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: template?.accentColor || '#3b82f6',
            fontFamily: template?.fontFamily || "'Times New Roman', serif",
            borderBottom: `2px solid ${template?.accentColor || '#3b82f6'}`
          }}>
            INVOICE
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            marginTop: '15px',
            fontSize: '14px'
          }}>
            <div><strong>No:</strong> {invoice?.invoiceNo || 'INV-001'}</div>
            <div><strong>Tanggal:</strong> {formatDate(invoice?.issueDate || new Date().toISOString())}</div>
            <div><strong>Jatuh Tempo:</strong> {formatDate(invoice?.dueDate || new Date().toISOString())}</div>
          </div>
        </div>
      )
    }

    if (layoutStyle === 'minimal') {
      return (
        <div style={headerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                {template?.showLogo && template?.companyLogo && (
                  <img
                    src={template.companyLogo}
                    alt="Company Logo"
                    style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }}
                  />
                )}
                <div>
                  <h1 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    margin: '0 0 5px 0',
                    color: template?.primaryColor || '#000000'
                  }}>
                    {template?.companyName || 'Company Name'}
                  </h1>
                </div>
              </div>

              {template?.showCompanyDetails && (
                <div style={{ fontSize: '12px', color: '#666666', lineHeight: '1.4' }}>
                  {template?.companyAddress && (
                    <div style={{ marginBottom: '3px' }}>{template.companyAddress}</div>
                  )}
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {template?.companyPhone && <div>{template.companyPhone}</div>}
                    {template?.companyEmail && <div>{template.companyEmail}</div>}
                  </div>
                  {template?.companyWebsite && (
                    <div style={{ marginTop: '3px' }}>
                      {template.companyWebsite}
                    </div>
                  )}
                  {template?.taxId && (
                    <div style={{ fontSize: '11px', marginTop: '3px' }}>NPWP: {template.taxId}</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', minWidth: '180px' }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: template?.accentColor || '#3b82f6',
                marginBottom: '10px'
              }}>
                INVOICE
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <div><strong>No:</strong> {invoice?.invoiceNo || 'INV-001'}</div>
                <div><strong>Tanggal:</strong> {formatDate(invoice?.issueDate || new Date().toISOString())}</div>
                <div><strong>Jatuh Tempo:</strong> {formatDate(invoice?.dueDate || new Date().toISOString())}</div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Default modern layout
    return (
      <div style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
              {template?.showLogo && template?.companyLogo && (
                <img
                  src={template.companyLogo}
                  alt="Company Logo"
                  style={{ height: '60px', maxWidth: '200px', objectFit: 'contain' }}
                />
              )}
              <div>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0',
                  color: template?.primaryColor || '#000000'
                }}>
                  {template?.companyName || 'Company Name'}
                </h1>
              </div>
            </div>

            {template?.showCompanyDetails && (
              <div style={{ fontSize: '14px', color: '#666666', lineHeight: '1.5' }}>
                {template?.companyAddress && (
                  <div style={{ marginBottom: '5px' }}>{template.companyAddress}</div>
                )}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {template?.companyPhone && <div>{template.companyPhone}</div>}
                  {template?.companyEmail && <div>{template.companyEmail}</div>}
                </div>
                {template?.companyWebsite && (
                  <div style={{ marginTop: '5px' }}>
                    <a href={template.companyWebsite} style={{ color: template?.accentColor || '#3b82f6' }}>
                      {template.companyWebsite}
                    </a>
                  </div>
                )}
                {template?.taxId && (
                  <div style={{ fontSize: '12px', marginTop: '5px' }}>NPWP: {template.taxId}</div>
                )}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', minWidth: '200px' }}>
            <div style={{
              backgroundColor: `${template?.accentColor || '#3b82f6'}15`,
              padding: '15px',
              borderRadius: '8px',
              border: `1px solid ${template?.accentColor || '#3b82f6'}30`
            }}>
              <div style={{ fontSize: '14px', color: '#666666', marginBottom: '8px' }}>INVOICE</div>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: template?.primaryColor || '#000000',
                marginBottom: '5px'
              }}>
                {invoice?.invoiceNo || 'INV-001'}
              </div>
              <div style={{ fontSize: '12px', color: '#666666' }}>
                Status: <span style={{
                  backgroundColor: invoice?.status === 'PAID' ? '#10b981' : invoice?.status === 'ISSUED' ? '#f59e0b' : '#6b7280',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px'
                }}>
                  {invoice?.status || 'DRAFT'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCustomerInfo = () => {
    if (layoutStyle === 'classic') {
      return (
        <div style={{ marginBottom: '30px', textAlign: 'center' as const }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '15px',
            color: template?.primaryColor || '#000000',
            fontFamily: template?.fontFamily || "'Times New Roman', serif",
            borderBottom: `2px solid ${template?.accentColor || '#3b82f6'}`,
            paddingBottom: '5px',
            display: 'inline-block',
            textAlign: 'center' as const
          }}>
            Kepada:
          </h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6', display: 'inline-block', textAlign: 'left' as const }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              {invoice?.customer?.name || 'Customer Name'}
            </div>
            {invoice?.customer?.address && (
              <div style={{ marginBottom: '5px' }}>{invoice.customer.address}</div>
            )}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {invoice?.customer?.email && <div>{invoice.customer.email}</div>}
              {invoice?.customer?.phone && <div>{invoice.customer.phone}</div>}
            </div>
          </div>
        </div>
      )
    }

    if (layoutStyle === 'minimal') {
      return (
        <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '10px',
              color: template?.primaryColor || '#000000',
              borderBottom: layoutStyle !== 'minimal' ? `2px solid ${template?.accentColor || '#3b82f6'}` : '1px solid #e5e7eb',
              paddingBottom: '5px'
            }}>
              Bill To:
            </h3>
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
                {invoice?.customer?.name || 'Customer Name'}
              </div>
              {invoice?.customer?.address && (
                <div style={{ marginBottom: '3px' }}>{invoice.customer.address}</div>
              )}
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {invoice?.customer?.email && <div>{invoice.customer.email}</div>}
                {invoice?.customer?.phone && <div>{invoice.customer.phone}</div>}
              </div>
            </div>
          </div>

          <div style={{ minWidth: '200px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '10px',
              color: template?.primaryColor || '#000000',
              borderBottom: layoutStyle !== 'minimal' ? `2px solid ${template?.accentColor || '#3b82f6'}` : '1px solid #e5e7eb',
              paddingBottom: '5px'
            }}>
              Invoice Details:
            </h3>
            <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666666' }}>Issue Date:</span>
                <span>{formatDate(invoice?.issueDate || new Date().toISOString())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666666' }}>Due Date:</span>
                <span>{formatDate(invoice?.dueDate || new Date().toISOString())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666666' }}>Currency:</span>
                <span>{invoice?.currency || 'IDR'}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Default modern layout
    return (
      <div style={{ display: 'flex', gap: '40px', marginBottom: '40px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '15px',
            color: template?.primaryColor || '#000000',
            borderBottom: `2px solid ${template?.accentColor || '#3b82f6'}`,
            paddingBottom: '5px'
          }}>
            Bill To:
          </h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              {invoice?.customer?.name || 'Customer Name'}
            </div>
            {invoice?.customer?.address && (
              <div style={{ marginBottom: '5px' }}>{invoice.customer.address}</div>
            )}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {invoice?.customer?.email && <div>{invoice.customer.email}</div>}
              {invoice?.customer?.phone && <div>{invoice.customer.phone}</div>}
            </div>
          </div>
        </div>

        <div style={{ minWidth: '250px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '15px',
            color: template?.primaryColor || '#000000',
            borderBottom: `2px solid ${template?.accentColor || '#3b82f6'}`,
            paddingBottom: '5px'
          }}>
            Invoice Details:
          </h3>
          <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666666' }}>Issue Date:</span>
              <span>{formatDate(invoice?.issueDate || new Date().toISOString())}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666666' }}>Due Date:</span>
              <span>{formatDate(invoice?.dueDate || new Date().toISOString())}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666666' }}>Currency:</span>
              <span>{invoice?.currency || 'IDR'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderItemsTable = () => {
    if (layoutStyle === 'classic') {
      return (
        <div style={{ marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', fontFamily: template?.fontFamily || "'Times New Roman', serif" }}>
            <thead>
              <tr style={{
                borderBottom: `2px solid ${template?.primaryColor || '#000000'}`
              }}>
                <th style={{
                  padding: '10px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  color: template?.primaryColor || '#000000',
                  fontFamily: template?.fontFamily || "'Times New Roman', serif"
                }}>
                  Description
                </th>
                <th style={{
                  padding: '10px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: template?.primaryColor || '#000000',
                  width: '80px',
                  fontFamily: template?.fontFamily || "'Times New Roman', serif"
                }}>
                  Qty
                </th>
                <th style={{
                  padding: '10px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: template?.primaryColor || '#000000',
                  width: '120px',
                  fontFamily: template?.fontFamily || "'Times New Roman', serif"
                }}>
                  Unit Price
                </th>
                <th style={{
                  padding: '10px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: template?.primaryColor || '#000000',
                  width: '100px',
                  fontFamily: template?.fontFamily || "'Times New Roman', serif"
                }}>
                  Discount
                </th>
                <th style={{
                  padding: '10px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: template?.primaryColor || '#000000',
                  width: '120px',
                  fontFamily: template?.fontFamily || "'Times New Roman', serif"
                }}>
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice?.items?.map((item: any, index: number) => (
                <tr key={index} style={{
                  borderBottom: index === invoice.items.length - 1 ? 'none' : '1px solid #e5e7eb'
                }}>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: '500', marginBottom: '2px', fontFamily: template?.fontFamily || "'Times New Roman', serif" }}>
                      {item.description}
                    </div>
                    {item.productSku && (
                      <div style={{ fontSize: '12px', color: '#666666', fontFamily: template?.fontFamily || "'Times New Roman', serif" }}>
                        SKU: {item.productSku}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', verticalAlign: 'top' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'top' }}>
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'top' }}>
                    {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top' }}>
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (layoutStyle === 'minimal') {
      return (
        <div style={{ marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{
                  padding: '8px 0',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  color: template?.primaryColor || '#000000',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '5px'
                }}>
                  Description
                </th>
                <th style={{
                  padding: '8px 0',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: template?.primaryColor || '#000000',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  width: '60px',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '5px'
                }}>
                  Qty
                </th>
                <th style={{
                  padding: '8px 0',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: template?.primaryColor || '#000000',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  width: '100px',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '5px'
                }}>
                  Unit Price
                </th>
                <th style={{
                  padding: '8px 0',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: template?.primaryColor || '#000000',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  width: '80px',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '5px'
                }}>
                  Discount
                </th>
                <th style={{
                  padding: '8px 0',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: template?.primaryColor || '#000000',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  width: '100px',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '5px'
                }}>
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice?.items?.map((item: any, index: number) => (
                <tr key={index} style={{
                  borderBottom: index === invoice.items.length - 1 ? 'none' : '1px solid #f0f0f0'
                }}>
                  <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: '1px' }}>
                      {item.description}
                    </div>
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'center', verticalAlign: 'top' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right', verticalAlign: 'top' }}>
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right', verticalAlign: 'top' }}>
                    {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top' }}>
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    // Default modern layout
    return (
      <div style={{ marginBottom: '40px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{
              backgroundColor: `${template?.accentColor || '#3b82f6'}10`,
              borderBottom: `2px solid ${template?.accentColor || '#3b82f6'}`
            }}>
              <th style={{
                padding: '15px',
                textAlign: 'left',
                fontWeight: 'bold',
                color: template?.primaryColor || '#000000'
              }}>
                Description
              </th>
              <th style={{
                padding: '15px',
                textAlign: 'center',
                fontWeight: 'bold',
                color: template?.primaryColor || '#000000',
                width: '80px'
              }}>
                Qty
              </th>
              <th style={{
                padding: '15px',
                textAlign: 'right',
                fontWeight: 'bold',
                color: template?.primaryColor || '#000000',
                width: '120px'
              }}>
                Unit Price
              </th>
              <th style={{
                padding: '15px',
                textAlign: 'right',
                fontWeight: 'bold',
                color: template?.primaryColor || '#000000',
                width: '100px'
              }}>
                Discount
              </th>
              <th style={{
                padding: '15px',
                textAlign: 'right',
                fontWeight: 'bold',
                color: template?.primaryColor || '#000000',
                width: '120px'
              }}>
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice?.items?.map((item: any, index: number) => (
              <tr key={index} style={{
                borderBottom: index === invoice.items.length - 1 ? 'none' : '1px solid #e5e7eb',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
              }}>
                <td style={{ padding: '15px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: '500', marginBottom: '3px' }}>
                    {item.description}
                  </div>
                  {item.productSku && (
                    <div style={{ fontSize: '12px', color: '#666666' }}>
                      SKU: {item.productSku}
                    </div>
                  )}
                </td>
                <td style={{ padding: '15px', textAlign: 'center', verticalAlign: 'top' }}>
                  {item.quantity}
                </td>
                <td style={{ padding: '15px', textAlign: 'right', verticalAlign: 'top' }}>
                  {formatCurrency(item.unitPrice)}
                </td>
                <td style={{ padding: '15px', textAlign: 'right', verticalAlign: 'top' }}>
                  {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                </td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top' }}>
                  {formatCurrency(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderTotals = () => {
    if (layoutStyle === 'classic') {
      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
          <div style={{ minWidth: '250px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontFamily: template?.fontFamily || "'Times New Roman', serif" }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice?.subtotal || 0)}</span>
              </div>
              {invoice?.discount && invoice.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontFamily: template?.fontFamily || "'Times New Roman', serif" }}>
                  <span>Diskon:</span>
                  <span style={{ color: '#ef4444' }}>-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              {invoice?.tax && invoice.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontFamily: template?.fontFamily || "'Times New Roman', serif" }}>
                  <span>Tax (11%):</span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: `2px solid ${template?.primaryColor || '#000000'}`,
                fontSize: '18px',
                fontWeight: 'bold',
                fontFamily: template?.fontFamily || "'Times New Roman', serif"
              }}>
                <span>Total:</span>
                <span style={{ color: template?.accentColor || '#3b82f6' }}>
                  {formatCurrency(invoice?.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (layoutStyle === 'minimal') {
      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
          <div style={{ minWidth: '220px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
                <span style={{ color: '#666666' }}>Subtotal:</span>
                <span>{formatCurrency(invoice?.subtotal || 0)}</span>
              </div>
              {invoice?.discount && invoice.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
                  <span style={{ color: '#666666' }}>Diskon:</span>
                  <span style={{ color: '#ef4444' }}>-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              {invoice?.tax && invoice.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
                  <span style={{ color: '#666666' }}>Tax (11%):</span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid #e5e7eb',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                <span style={{ color: template?.primaryColor || '#000000' }}>Total:</span>
                <span style={{ color: template?.accentColor || '#3b82f6' }}>
                  {formatCurrency(invoice?.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Default modern layout
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <div style={{ minWidth: '300px' }}>
          <div style={{
            backgroundColor: '#f9fafb',
            border: `1px solid ${template?.accentColor || '#3b82f6'}30`,
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
              <span style={{ color: '#666666' }}>Subtotal:</span>
              <span>{formatCurrency(invoice?.subtotal || 0)}</span>
            </div>
            {invoice?.discount && invoice.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: '#666666' }}>Discount:</span>
                <span style={{ color: '#ef4444' }}>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {invoice?.tax && invoice.tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: '#666666' }}>Tax (PPN 11%):</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '15px',
              borderTop: `2px solid ${template?.accentColor || '#3b82f6'}`,
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              <span style={{ color: template?.primaryColor || '#000000' }}>Total:</span>
              <span style={{ color: template?.accentColor || '#3b82f6' }}>
                {formatCurrency(invoice?.total || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderFooter = () => {
    const footerStyle = getFooterStyle()

    if (layoutStyle === 'classic') {
      return (
        <div style={footerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, textAlign: 'left' }}>
              {template?.footerNotes && (
                <div style={{ marginBottom: '10px', fontSize: '12px', lineHeight: '1.4' }}>
                  <strong>Catatan:</strong> {template.footerNotes}
                </div>
              )}
              {template?.footerTerms && (
                <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                  <strong>Syarat & Ketentuan:</strong> {template.footerTerms}
                </div>
              )}
              {template?.footerPaymentInfo && (
                <div style={{ marginTop: '10px', fontSize: '11px', lineHeight: '1.4' }}>
                  <strong>Informasi Pembayaran:</strong> {template.footerPaymentInfo}
                </div>
              )}
              {template?.footerBankAccount && (
                <div style={{ marginTop: '5px', fontSize: '11px', lineHeight: '1.4' }}>
                  <strong>Rekening Bank:</strong> {template.footerBankAccount}
                </div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#999999', marginTop: '20px' }}>
            <div>Generated by ADYATAMA Finance System</div>
            <div>{formatDate(new Date().toISOString())}</div>
          </div>
        </div>
      )
    }

    if (layoutStyle === 'minimal') {
      return (
        <div style={footerStyle}>
          <div style={{ textAlign: 'center' }}>
            {template?.footerNotes && (
              <div style={{ marginBottom: '8px', fontSize: '10px', color: '#666666' }}>
                {template.footerNotes}
              </div>
            )}
            {template?.footerTerms && (
              <div style={{ fontSize: '9px', color: '#666666', lineHeight: '1.4' }}>
                {template.footerTerms}
              </div>
            )}
            {template?.footerPaymentInfo && (
              <div style={{ marginTop: '8px', fontSize: '9px', color: '#666666' }}>
                {template.footerPaymentInfo}
              </div>
            )}
            {template?.footerBankAccount && (
              <div style={{ marginTop: '5px', fontSize: '9px', color: '#666666' }}>
                {template.footerBankAccount}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#999999', marginTop: '15px' }}>
            <div>Generated by ADYATAMA Finance System</div>
            <div>{formatDate(new Date().toISOString())}</div>
          </div>
        </div>
      )
    }

    // Default modern layout
    return (
      <div style={footerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {template?.footerNotes && (
              <div style={{ marginBottom: '15px', fontSize: '12px', color: '#666666' }}>
                <strong>Catatan:</strong> {template.footerNotes}
              </div>
            )}
            {template?.footerTerms && (
              <div style={{ fontSize: '11px', color: '#666666', lineHeight: '1.5' }}>
                <strong>Syarat & Ketentuan:</strong> {template.footerTerms}
              </div>
            )}
            {template?.footerPaymentInfo && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#666666' }}>
                <strong>Informasi Pembayaran:</strong> {template.footerPaymentInfo}
              </div>
            )}
            {template?.footerBankAccount && (
              <div style={{ marginTop: '5px', fontSize: '11px', color: '#666666' }}>
                <strong>Rekening Bank:</strong> {template.footerBankAccount}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: '10px', color: '#999999' }}>
            <div>Generated by ADYATAMA Finance System</div>
            <div>{formatDate(new Date().toISOString())}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Watermark */}
      {template?.showWatermark && template?.watermarkText && (
        <div style={watermarkStyle}>
          {template.watermarkText}
        </div>
      )}

      {/* Header */}
      {renderHeader()}

      {/* Body */}
      <div style={getBodyStyle()}>
        {renderCustomerInfo()}
        {renderItemsTable()}
        {renderTotals()}

        {invoice?.notes && (
          <div style={{
            marginTop: layoutStyle === 'minimal' ? '20px' : layoutStyle === 'classic' ? '25px' : '30px',
            padding: layoutStyle === 'minimal' ? '10px' : layoutStyle === 'classic' ? '12px' : '15px',
            backgroundColor: layoutStyle === 'minimal' ? 'transparent' : layoutStyle === 'classic' ? '#f9f9f9' : '#f9fafb',
            borderRadius: layoutStyle === 'minimal' ? '0' : '8px',
            fontSize: layoutStyle === 'minimal' ? '11px' : layoutStyle === 'classic' ? '12px' : '13px',
            color: '#666666',
            border: layoutStyle === 'minimal' ? 'none' : layoutStyle === 'classic' ? '1px solid #e5e7eb' : '1px solid #e5e7eb'
          }}>
            <strong>{layoutStyle === 'classic' ? 'Catatan Tambahan:' : 'Catatan Tambahan:'}</strong>
            <div style={{ marginTop: '5px', lineHeight: layoutStyle === 'minimal' ? '1.4' : '1.5' }}>
              {invoice.notes}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {renderFooter()}
    </div>
  )
}
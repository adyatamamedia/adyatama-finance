'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import TemplatePreviewModal from '../templates/TemplatePreviewModal'

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

/** Types */
interface InvoiceItem {
  id?: string
  description: string
  product_sku?: string
  quantity: number
  unit_price: number
  discount: number
  subtotal: number
}

interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
}

interface InvoiceTemplate {
  id: string
  name: string
  description?: string
  is_default: boolean
  is_active: boolean
  company_name: string
  company_logo?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  company_website?: string
  tax_id?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  font_size_base: number
  show_logo: boolean
  logo_position: 'left' | 'center' | 'right'
  show_company_details: boolean
  footer_notes?: string
  footer_terms?: string
  footer_payment_info?: string
  footer_bank_account?: string
  layout_style: 'modern' | 'classic' | 'minimal'
  show_watermark: boolean
  watermark_text?: string
  created_by?: string
  created_at: string
  updated_at: string
  usage_count: number
}

/** Main Create Invoice Page Component */
export default function EditInvoicePage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discount: '0',
    tax: '0',
    notes: '',
    currency: 'IDR',
    status: 'DRAFT' as 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'CANCELLED' | 'OVERDUE'
  })

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', product_sku: '', quantity: 1, unit_price: 0, discount: 0, subtotal: 0 }
  ])

  // Sidebar states
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  // Fetch data
  useEffect(() => {
    fetchCustomers()
    fetchTemplates()
    
    // Check if we're editing an existing invoice
    const urlParams = new URLSearchParams(window.location.search)
    const invoiceId = urlParams.get('id')
    if (invoiceId) {
      setEditingInvoiceId(invoiceId)
      setIsEditMode(true)
      fetchInvoiceData(invoiceId)
    }
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const data = await response.json()
      setCustomers(Array.isArray(data.customers) ? data.customers : [])
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError('Gagal memuat data pelanggan')
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/invoice-templates-new?isActive=true')
      if (!response.ok) throw new Error('Failed to fetch templates')
      const data = await response.json()
      const templateList = Array.isArray(data.templates) ? data.templates : []

      setTemplates(templateList)
      if (templateList.length > 0) {
        setSelectedTemplate(templateList[0])
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
      // fallback default template
      const defaultTemplate: InvoiceTemplate = {
        id: 'default',
        name: 'Template Standar',
        description: 'Template invoice standar Adyatama',
        is_default: true,
        is_active: true,
        company_name: 'ADYATAMA',
        company_logo: undefined,
        company_address: 'Jl. Contoh No. 1, Jakarta, Indonesia',
        company_phone: '(021) 1234-5678',
        company_email: 'info@adyatama.com',
        company_website: undefined,
        tax_id: undefined,
        primary_color: '#000000',
        secondary_color: '#666666',
        accent_color: '#3b82f6',
        font_family: 'Arial, sans-serif',
        font_size_base: 12,
        show_logo: true,
        logo_position: 'left',
        show_company_details: true,
        footer_notes: 'Terima kasih atas kepercayaan Anda',
        footer_terms: 'Pembayaran harus diselesaikan dalam waktu 30 hari sejak tanggal terbit.',
        footer_payment_info: undefined,
        footer_bank_account: undefined,
        layout_style: 'modern',
        show_watermark: false,
        watermark_text: undefined,
        created_by: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0
      }
      setTemplates([defaultTemplate])
      setSelectedTemplate(defaultTemplate)
    }
  }

  const fetchInvoiceData = async (invoiceId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (!response.ok) throw new Error('Failed to fetch invoice')
      const invoice = await response.json()
      
      // Load invoice data into form
      setSelectedCustomerId(invoice.customerId || '')
      setFormData({
        issueDate: invoice.issueDate ? invoice.issueDate.split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        discount: invoice.discount || '0',
        tax: invoice.tax || '0',
        notes: invoice.notes || '',
        currency: invoice.currency || 'IDR',
        status: invoice.status || 'DRAFT'
      })
      
      // Load items
      if (invoice.items && invoice.items.length > 0) {
        setItems(invoice.items.map((item: any) => ({
          id: item.id,
          description: item.description || '',
          product_sku: item.product_sku || '',
          quantity: parseFloat(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          discount: parseFloat(item.discount) || 0,
          subtotal: parseFloat(item.subtotal) || 0,
        })))
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching invoice:', err)
      setError('Gagal memuat data invoice')
      setLoading(false)
    }
  }

  // Calculate totals
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.subtotal || (item.quantity * item.unit_price - item.discount)), 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discountAmount = parseFloat(formData.discount) || 0
    const taxAmount = parseFloat(formData.tax) || 0
    return subtotal - discountAmount + taxAmount
  }

  // Update item subtotal when quantity, unit price, or discount changes
  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    const item = { ...newItems[index] }

    if (field === 'quantity' || field === 'unit_price' || field === 'discount') {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
      // @ts-ignore
      item[field] = numValue
      item.subtotal = (item.quantity || 0) * (item.unit_price || 0) - (item.discount || 0)
    } else {
      // @ts-ignore
      item[field] = value
    }

    newItems[index] = item
    setItems(newItems)
  }

  // Add new item
  const addItem = () => {
    setItems([...items, { description: '', product_sku: '', quantity: 1, unit_price: 0, discount: 0, subtotal: 0 }])
  }

  // Remove item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  // Customer management
  const handleCreateCustomer = async () => {
    try {
      setLoading(true)
      setError('')

      if (!customerFormData.name.trim()) {
        throw new Error('Nama pelanggan wajib diisi')
      }

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerFormData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal membuat pelanggan')
      }

      const newCustomer = await response.json()
      setCustomers([...customers, newCustomer])
      setSelectedCustomerId(newCustomer.id.toString())
      setCustomerFormData({ name: '', email: '', phone: '', address: '' })
      setShowCustomerForm(false)
      setEditingCustomer(null)
      setSuccess('Pelanggan berhasil ditambahkan!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah pelanggan')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCustomer = async () => {
    try {
      setLoading(true)
      setError('')

      if (!editingCustomer?.id || !customerFormData.name.trim()) {
        throw new Error('Nama pelanggan wajib diisi')
      }

      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerFormData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal mengupdate pelanggan')
      }

      const updatedCustomer = await response.json()
      setCustomers(customers.map(c => c.id === editingCustomer.id ? updatedCustomer : c))
      setCustomerFormData({ name: '', email: '', phone: '', address: '' })
      setShowCustomerForm(false)
      setEditingCustomer(null)
      setSuccess('Pelanggan berhasil diperbarui!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengupdate pelanggan')
    } finally {
      setLoading(false)
    }
  }

  // Submit invoice (create or update)
  const handleSubmitInvoice = async () => {
    try {
      setIsCreating(true)
      setError('')

      if (!selectedCustomerId) {
        setError('Pelanggan wajib dipilih')
        setIsCreating(false)
        return
      }
      if (!formData.issueDate) {
        setError('Tanggal terbit wajib diisi')
        setIsCreating(false)
        return
      }
      if (!formData.dueDate) {
        setError('Tanggal jatuh tempo wajib diisi')
        setIsCreating(false)
        return
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item.description.trim()) {
          setError(`Item ${i + 1}: Deskripsi wajib diisi`)
          setIsCreating(false)
          return
        }
        if (item.quantity <= 0) {
          setError(`Item ${i + 1}: Quantity harus lebih dari 0`)
          setIsCreating(false)
          return
        }
        if (item.unit_price <= 0) {
          setError(`Item ${i + 1}: Harga satuan harus lebih dari 0`)
          setIsCreating(false)
          return
        }
      }

      const subtotal = calculateSubtotal()
      const total = calculateTotal()

      const payload: any = {
        customerId: parseInt(selectedCustomerId),
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        status: formData.status,
        discount: parseFloat(formData.discount) || 0,
        tax: parseFloat(formData.tax) || 0,
        subtotal,
        total,
        currency: formData.currency,
        notes: formData.notes || null,
        items: items.map(item => ({
          description: item.description,
          productSku: item.product_sku || null,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: item.discount,
          subtotal: item.subtotal
        }))
      }

      const method = isEditMode ? 'PUT' : 'POST'
      const url = isEditMode ? `/api/invoices/${editingInvoiceId}` : '/api/invoices'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Gagal ${isEditMode ? 'mengupdate' : 'membuat'} invoice`)
      }

      const invoice = await response.json()
      setSuccess(`Invoice ${invoice.invoiceNo || invoice.id} berhasil ${isEditMode ? 'diupdate' : 'dibuat'}!`)
      setIsCreating(false)

      // Redirect back to invoice list
      setTimeout(() => {
        window.location.href = '/dashboard/invoices'
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Gagal ${isEditMode ? 'mengupdate' : 'membuat'} invoice`)
      setIsCreating(false)
    }
  }

  // Save customer form
  const saveCustomer = () => {
    if (editingCustomer) {
      handleUpdateCustomer()
    } else {
      handleCreateCustomer()
    }
  }

  // Edit customer
  const editCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setCustomerFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || ''
    })
    setShowCustomerForm(true)
  }

  // Delete customer
  const deleteCustomer = async (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal menghapus pelanggan')
      }

      setCustomers(customers.filter(c => c.id.toString() !== customerId))

      if (selectedCustomerId === customerId) {
        setSelectedCustomerId('')
      }

      setSuccess('Pelanggan berhasil dihapus!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pelanggan')
    } finally {
      setLoading(false)
    }
  }

  // Advanced invoice actions
  const saveAsDraft = async () => {
    try {
      if (!selectedCustomerId) {
        setError('Pilih pelanggan terlebih dahulu')
        return
      }

      setLoading(true)
      setError('')

      const payload: any = {
        customerId: parseInt(selectedCustomerId),
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        status: 'DRAFT',
        discount: parseFloat(formData.discount) || 0,
        tax: parseFloat(formData.tax) || 0,
        subtotal: calculateSubtotal(),
        total: calculateTotal(),
        currency: formData.currency,
        notes: formData.notes || null,
        items: items.filter(item => item.description.trim()).map(item => ({
          description: item.description,
          productSku: item.product_sku || null,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: item.discount,
          subtotal: item.subtotal
        }))
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal menyimpan draft')
      }

      setSuccess('Invoice berhasil disimpan sebagai draft!')
      setTimeout(() => {
        window.location.href = '/dashboard/invoices'
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan draft')
    } finally {
      setLoading(false)
    }
  }

  const clearForm = () => {
    setSelectedCustomerId('')
    setItems([{ description: '', product_sku: '', quantity: 1, unit_price: 0, discount: 0, subtotal: 0 }])
    setFormData({
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discount: '0',
      tax: '0',
      notes: '',
      currency: 'IDR',
      status: 'DRAFT'
    })
    setSuccess('Form berhasil dibersihkan!')
    setTimeout(() => setSuccess(''), 2000)
  }

  // Load invoice for editing/duplication
  const loadInvoiceData = (invoiceData: any) => {
    try {
      if (invoiceData.customerId) {
        setSelectedCustomerId(invoiceData.customerId.toString())
      }

      setFormData({
        issueDate: invoiceData.issueDate ? new Date(invoiceData.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        discount: invoiceData.discount?.toString() || '0',
        tax: invoiceData.tax?.toString() || '0',
        notes: invoiceData.notes || '',
        currency: invoiceData.currency || 'IDR',
        status: 'DRAFT'
      })

      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        const loadedItems = invoiceData.items.map((item: any) => ({
          description: item.description,
          product_sku: item.product_sku || '',
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unitPrice || item.unit_price) || 0,
          discount: parseFloat(item.discount) || 0,
          subtotal: parseFloat(item.subtotal) || 0
        }))
        setItems(loadedItems.length > 0 ? loadedItems : [{ description: '', product_sku: '', quantity: 1, unit_price: 0, discount: 0, subtotal: 0 }])
      }

      setSuccess('Data invoice berhasil dimuat!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      console.error('Error loading invoice data:', err)
      setError('Gagal memuat data invoice')
    }
  }

  // Status functions
  const getStatusDescription = (status: string) => {
    const statusDescriptions: { [key: string]: string } = {
      'DRAFT': 'Invoice masih dalam tahap persiapan dan belum dikirim ke pelanggan.',
      'ISSUED': 'Invoice telah dikirim ke pelanggan dan menunggu pembayaran.',
      'PARTIAL': 'Sebagian dari total invoice telah dibayar.',
      'PAID': 'Invoice telah lunas dibayar sepenuhnya.',
      'CANCELLED': 'Invoice dibatalkan dan tidak lagi berlaku.',
      'OVERDUE': 'Invoice telah melewati tanggal jatuh tempo belum dibayar.'
    }
    return statusDescriptions[status] || 'Status tidak diketahui.'
  }

  const handleStatusChange = (newStatus: string) => {
    switch (newStatus) {
      case 'ISSUED':
        if (!formData.issueDate) {
          setFormData(prev => ({ ...prev, issueDate: new Date().toISOString().split('T')[0] }))
        }
        setFormData(prev => ({ ...prev, notes: prev.notes ? `${prev.notes}\n[Invoice diterbitkan pada ${formatDate(new Date().toISOString())}]` : `[Invoice diterbitkan pada ${formatDate(new Date().toISOString())}]` }))
        break
      case 'PAID':
        setFormData(prev => ({ ...prev, notes: prev.notes ? `${prev.notes}\n[Invoice lunas pada ${formatDate(new Date().toISOString())}]` : `[Invoice lunas pada ${formatDate(new Date().toISOString())}]` }))
        break
      case 'CANCELLED':
        setFormData(prev => ({ ...prev, notes: prev.notes ? `${prev.notes}\n[Invoice dibatalkan pada ${formatDate(new Date().toISOString())}]` : `[Invoice dibatalkan pada ${formatDate(new Date().toISOString())}]` }))
        break
      case 'OVERDUE':
        if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
          setFormData(prev => ({ ...prev, notes: prev.notes ? `${prev.notes}\n[Invoice jatuh tempo pada ${formatDate(prev.dueDate)}]` : `[Invoice jatuh tempo pada ${formatDate(prev.dueDate)}]` }))
        }
        break
    }
  }

  const getPaymentSchedule = () => {
    if (!formData.issueDate || !formData.dueDate) return null

    const issue = new Date(formData.issueDate)
    const due = new Date(formData.dueDate)
    const today = new Date()

    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) {
      return {
        status: 'overdue',
        days: Math.abs(daysUntilDue),
        message: `Terlambat ${Math.abs(daysUntilDue)} hari`
      }
    } else if (daysUntilDue <= 3) {
      return {
        status: 'due-soon',
        days: daysUntilDue,
        message: `${daysUntilDue} hari lagi`
      }
    } else {
      return {
        status: 'on-time',
        days: daysUntilDue,
        message: `${daysUntilDue} hari lagi`
      }
    }
  }

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'ISSUED': 'bg-blue-100 text-blue-800',
      'PARTIAL': 'bg-yellow-100 text-yellow-800',
      'PAID': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'OVERDUE': 'bg-red-100 text-red-800'
    }
    return statusClasses[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      'DRAFT': 'Draft',
      'ISSUED': 'Diterbitkan',
      'PARTIAL': 'Sebagian',
      'PAID': 'Lunas',
      'CANCELLED': 'Dibatalkan',
      'OVERDUE': 'Jatuh Tempo'
    }
    return statusLabels[status] || status
  }

  // Create consistent preview invoice object
  const getPreviewInvoice = () => {
    return {
      invoiceNo: 'PREVIEW-001',
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      status: formData.status,
      customer: customers.find(c => c.id.toString() === selectedCustomerId) || {
        name: 'Nama Pelanggan',
        address: 'Alamat Pelanggan',
        email: 'email@pelanggan.com',
        phone: '0812-3456-7890'
      },
      items: items.filter(item => item.description.trim()).map(i => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount,
        subtotal: i.subtotal || (i.quantity * i.unit_price - i.discount)
      })),
      subtotal: calculateSubtotal(),
      discount: parseFloat(formData.discount) || 0,
      tax: parseFloat(formData.tax) || 0,
      total: calculateTotal()
    }
  }

  // Render function for preview (updated to match new designs)
  const renderInvoicePreview = () => {
    if (!selectedTemplate) return <div className="text-sm text-gray-500 p-4 text-center">Pilih template untuk melihat preview</div>

    const previewInvoice = getPreviewInvoice()

    // Classic Layout Preview
    if (selectedTemplate.layout_style === 'classic') {
      return (
        <div 
          className="bg-white p-6 shadow-sm"
          style={{ 
            fontFamily: selectedTemplate.font_family || "'Times New Roman', serif",
            border: `4px double ${selectedTemplate.primary_color}`
          }}
        >
          <div className="text-center mb-6 border-b-2 border-black pb-4" style={{ borderColor: selectedTemplate.primary_color }}>
            {selectedTemplate.show_logo && selectedTemplate.company_logo && (
              <img src={selectedTemplate.company_logo} alt="logo" className="h-16 mx-auto mb-2" />
            )}
            <div className="text-xl font-bold uppercase tracking-wider" style={{ color: selectedTemplate.primary_color }}>
              {selectedTemplate.company_name}
            </div>
            {selectedTemplate.company_address && <div className="text-xs text-gray-600 mt-1">{selectedTemplate.company_address}</div>}
          </div>

          <div className="flex justify-between items-end mb-6">
            <div className="text-left">
              <div className="font-bold underline text-xs mb-1" style={{ color: selectedTemplate.primary_color }}>KEPADA:</div>
              <div className="text-xs">
                <div className="font-bold">{previewInvoice.customer.name}</div>
                <div>{previewInvoice.customer.address}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold mb-2" style={{ color: selectedTemplate.accent_color }}>INVOICE</div>
              <div className="text-xs">
                <div>No: {previewInvoice.invoiceNo}</div>
                <div>Tgl: {formatDate(previewInvoice.issueDate)}</div>
              </div>
            </div>
          </div>

          <table className="w-full text-xs mb-4 border border-black">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="text-left p-2 border-r border-black">DESKRIPSI</th>
                <th className="text-center p-2 border-r border-black">QTY</th>
                <th className="text-right p-2 border-r border-black">HARGA</th>
                <th className="text-right p-2">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {previewInvoice.items.map((it, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300">{it.description}</td>
                  <td className="p-2 text-center border-r border-gray-300">{it.quantity}</td>
                  <td className="p-2 text-right border-r border-gray-300">{formatCurrency(it.unit_price)}</td>
                  <td className="p-2 text-right">{formatCurrency(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right text-xs">
            <div className="font-bold text-sm" style={{ color: selectedTemplate.accent_color }}>
              TOTAL: {formatCurrency(previewInvoice.total)}
            </div>
          </div>
        </div>
      )
    }

    // Minimal Layout Preview
    if (selectedTemplate.layout_style === 'minimal') {
      return (
        <div 
          className="bg-white p-6 shadow-sm"
          style={{ fontFamily: selectedTemplate.font_family || 'Arial, sans-serif' }}
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              {selectedTemplate.show_logo && selectedTemplate.company_logo && (
                <img src={selectedTemplate.company_logo} alt="logo" className="h-10 mb-4" />
              )}
              <div className="text-lg font-normal tracking-wide" style={{ color: 'black' }}>
                {selectedTemplate.company_name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-light tracking-[0.2em] text-gray-300 mb-2">INVOICE</div>
              <div className="text-xs text-gray-500">#{previewInvoice.invoiceNo}</div>
            </div>
          </div>

          <div className="mb-8 pl-4 border-l-2" style={{ borderColor: selectedTemplate.primary_color }}>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Bill To</div>
            <div className="text-sm font-normal">{previewInvoice.customer.name}</div>
            <div className="text-xs text-gray-500">{previewInvoice.customer.address}</div>
          </div>

          <table className="w-full text-xs mb-6">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 font-normal text-gray-400 uppercase tracking-widest">Desc</th>
                <th className="text-center pb-2 font-normal text-gray-400 uppercase tracking-widest">Qty</th>
                <th className="text-right pb-2 font-normal text-gray-400 uppercase tracking-widest">Price</th>
                <th className="text-right pb-2 font-normal text-gray-400 uppercase tracking-widest">Total</th>
              </tr>
            </thead>
            <tbody>
              {previewInvoice.items.map((it, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-3">{it.description}</td>
                  <td className="py-3 text-center text-gray-500">{it.quantity}</td>
                  <td className="py-3 text-right text-gray-500">{formatCurrency(it.unit_price)}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end border-t border-gray-100 pt-4">
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: selectedTemplate.accent_color }}>
                {formatCurrency(previewInvoice.total)}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Modern Layout Preview (Default)
    return (
      <div 
        className="bg-white shadow-sm overflow-hidden"
        style={{ fontFamily: selectedTemplate.font_family || 'Arial, sans-serif' }}
      >
        {/* Top Bar */}
        <div style={{ backgroundColor: selectedTemplate.primary_color, height: '8px' }} />

        <div className="p-6">
          <div className="flex justify-between mb-6">
            <div>
              {selectedTemplate.show_logo && selectedTemplate.company_logo && (
                <img src={selectedTemplate.company_logo} alt="logo" className="h-12 mb-2" />
              )}
              <div className="font-bold text-lg" style={{ color: selectedTemplate.primary_color }}>
                {selectedTemplate.company_name}
              </div>
            </div>
            <div className="text-right">
              <div 
                className="inline-block px-3 py-1 rounded mb-2"
                style={{ backgroundColor: `${selectedTemplate.accent_color}15` }}
              >
                <div className="font-bold text-sm" style={{ color: selectedTemplate.accent_color }}>INVOICE</div>
              </div>
              <div className="text-xs font-bold">#{previewInvoice.invoiceNo}</div>
            </div>
          </div>

          <div className="mb-6 bg-gray-50 p-3 rounded border-l-4" style={{ borderColor: selectedTemplate.primary_color }}>
            <div className="text-xs font-bold text-gray-500 uppercase mb-1">Bill To:</div>
            <div className="font-bold text-sm">{previewInvoice.customer.name}</div>
            <div className="text-xs text-gray-600">{previewInvoice.customer.address}</div>
          </div>

          <table className="w-full text-xs mb-4">
            <thead>
              <tr style={{ backgroundColor: selectedTemplate.primary_color, color: 'white' }}>
                <th className="text-left p-2 rounded-tl">Deskripsi</th>
                <th className="text-center p-2">Qty</th>
                <th className="text-right p-2">Harga</th>
                <th className="text-right p-2 rounded-tr">Total</th>
              </tr>
            </thead>
            <tbody>
              {previewInvoice.items.map((it, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2 border-b border-gray-100">{it.description}</td>
                  <td className="p-2 text-center border-b border-gray-100">{it.quantity}</td>
                  <td className="p-2 text-right border-b border-gray-100">{formatCurrency(it.unit_price)}</td>
                  <td className="p-2 text-right font-bold border-b border-gray-100">{formatCurrency(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-48 bg-gray-50 p-3 rounded">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatCurrency(previewInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t" style={{ borderColor: selectedTemplate.accent_color, color: selectedTemplate.accent_color }}>
                <span>Total:</span>
                <span>{formatCurrency(previewInvoice.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar (Desktop Only) */}
      <div className="hidden lg:flex w-80 bg-white shadow-lg flex-col h-full z-10 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{isEditMode ? 'Edit Invoice' : 'Buat Invoice'}</h2>
            <button
              onClick={() => window.location.href = '/dashboard/invoices'}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Template Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Template Invoice</h3>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find(t => t.id === e.target.value)
                setSelectedTemplate(template || null)
              }}
              className="form-input text-sm"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <a
              href="/dashboard/invoices/templates"
              className="btn btn-secondary text-sm w-full inline-flex items-center justify-center"
            >
              Kelola Template
            </a>
          </div>

          {/* Customer Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Pelanggan</h3>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="form-input text-sm"
            >
              <option value="">-- Pilih Pelanggan --</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingCustomer(null)
                  setCustomerFormData({ name: '', email: '', phone: '', address: '' })
                  setShowCustomerForm(true)
                }}
                className="btn btn-primary text-sm flex-1"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Tambah
              </button>
              <button
                onClick={() => {
                  if (selectedCustomerId) {
                    const customer = customers.find(c => c.id.toString() === selectedCustomerId)
                    if (customer) editCustomer(customer)
                  }
                }}
                disabled={!selectedCustomerId}
                className="btn btn-secondary text-sm flex-1"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </div>
          </div>



          {/* Status Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Status Invoice</h3>
            <select
              value={formData.status}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, status: e.target.value as any }))
                handleStatusChange(e.target.value)
              }}
              className="form-input text-sm"
            >
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Diterbitkan</option>
              <option value="PARTIAL">Sebagian</option>
              <option value="PAID">Lunas</option>
              <option value="CANCELLED">Dibatalkan</option>
              <option value="OVERDUE">Jatuh Tempo</option>
            </select>
            <div className="text-xs text-gray-500">
              {getStatusDescription(formData.status)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowPreviewModal(true)}
                disabled={!selectedTemplate}
                className="btn btn-outline flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
              <button
                onClick={() => setShowPreviewModal(true)}
                disabled={!selectedTemplate}
                className="btn btn-outline flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
            <button
              onClick={handleSubmitInvoice}
              disabled={isCreating || !selectedCustomerId}
              className="btn btn-primary w-full cursor-pointer disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditMode ? 'Mengupdate...' : 'Membuat...'}
                </div>
              ) : (
                isEditMode ? 'Update Invoice' : 'Buat Invoice'
              )}
            </button>
            <button
              onClick={saveAsDraft}
              disabled={loading || !selectedCustomerId}
              className="btn btn-secondary w-full cursor-pointer disabled:cursor-not-allowed"
            >
              Simpan Draft
            </button>
            <button
              onClick={clearForm}
              className="btn btn-outline w-full cursor-pointer"
            >
              Bersihkan Form
            </button>
          </div>

          {(error || success) && (
            <div className={`p-3 rounded-lg text-sm ${error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
              {error || success}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Invoice Form and Preview */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/dashboard/invoices'}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{isEditMode ? 'Edit Invoice' : 'Buat Invoice'}</h1>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-sm text-gray-500">Template:</span>
            <span className="text-sm font-medium text-gray-900">
              {selectedTemplate ? selectedTemplate.name : 'Memuat...'}
            </span>
          </div>
          <div className="lg:hidden">
             <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(formData.status)}`}>
                {getStatusLabel(formData.status)}
             </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Invoice Form */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6">
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Mobile Only Controls */}
              <div className="lg:hidden space-y-6">
                {/* Customer Selection Mobile */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Pelanggan</h3>
                  <div className="space-y-3">
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="form-input text-sm w-full"
                    >
                      <option value="">-- Pilih Pelanggan --</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCustomer(null)
                          setCustomerFormData({ name: '', email: '', phone: '', address: '' })
                          setShowCustomerForm(true)
                        }}
                        className="btn btn-primary text-sm flex-1 py-2"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Baru
                      </button>
                      <button
                        onClick={() => {
                          if (selectedCustomerId) {
                            const customer = customers.find(c => c.id.toString() === selectedCustomerId)
                            if (customer) editCustomer(customer)
                          }
                        }}
                        disabled={!selectedCustomerId}
                        className="btn btn-secondary text-sm flex-1 py-2"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                {/* Template & Status Mobile */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Template</h3>
                      <div className="flex gap-2">
                        <select
                          value={selectedTemplate?.id || ''}
                          onChange={(e) => {
                            const template = templates.find(t => t.id === e.target.value)
                            setSelectedTemplate(template || null)
                          }}
                          className="form-input text-sm w-full"
                        >
                          {templates.map(template => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setShowPreviewModal(true)}
                          disabled={!selectedTemplate}
                          className="btn btn-outline px-3 flex items-center justify-center"
                          title="Preview Template"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                      <select
                        value={formData.status}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, status: e.target.value as any }))
                          handleStatusChange(e.target.value)
                        }}
                        className="form-input text-sm w-full"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="ISSUED">Diterbitkan</option>
                        <option value="PARTIAL">Sebagian</option>
                        <option value="PAID">Lunas</option>
                        <option value="CANCELLED">Dibatalkan</option>
                        <option value="OVERDUE">Jatuh Tempo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              {/* Invoice Details */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Detail Invoice</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Terbit</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Jatuh Tempo</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mata Uang</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="form-input w-full"
                    >
                      <option value="IDR">IDR (Indonesian Rupiah)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </select>
                  </div>
                  <div className="hidden lg:block">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(formData.status)}`}>
                        {getStatusLabel(formData.status)}
                      </span>
                      {getPaymentSchedule() && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({getPaymentSchedule()?.message})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Item Invoice</h2>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn btn-secondary text-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="bg-gray-50 sm:bg-white p-3 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-gray-200 grid grid-cols-12 gap-3 sm:gap-2 items-end sm:border-b sm:border-gray-100 sm:pb-4 sm:mb-4 sm:last:border-0 sm:last:pb-0 sm:last:mb-0">
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="form-input text-sm w-full"
                          placeholder="Nama item/jasa"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="form-input text-sm w-full"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Harga</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                          className="form-input text-sm w-full"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Diskon</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', e.target.value)}
                          className="form-input text-sm w-full"
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-1 flex justify-end sm:block">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                          className="btn btn-outline text-red-500 border-red-200 hover:bg-red-50 w-full sm:w-auto text-sm flex items-center justify-center px-2 py-2 sm:px-0 sm:py-2"
                        >
                          <span className="sm:hidden mr-2">Hapus Item</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="col-span-12 mt-1 sm:mt-0">
                        <div className="flex justify-between sm:justify-end text-sm text-gray-600 font-medium">
                          <span className="sm:hidden">Subtotal:</span>
                          <span>{formatCurrency(item.subtotal || (item.quantity * item.unit_price - item.discount))}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-end">
                  <div className="w-full max-w-md space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Diskon</label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                            <span className="text-gray-500 sm:text-sm">Rp</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                            className="block w-32 rounded-md border-gray-300 pl-8 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-red-600">-{formatCurrency(parseFloat(formData.discount) || 0)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Pajak</label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                            <span className="text-gray-500 sm:text-sm">Rp</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={formData.tax}
                            onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                            className="block w-32 rounded-md border-gray-300 pl-8 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(parseFloat(formData.tax) || 0)}</span>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-gray-200">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-blue-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Catatan</h2>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="form-input w-full"
                  placeholder="Catatan tambahan untuk invoice ini..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Footer */}
        <div className="lg:hidden bg-white border-t border-gray-200 p-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={saveAsDraft}
              disabled={loading || !selectedCustomerId}
              className="btn btn-outline w-full text-sm py-2.5"
            >
              Draft
            </button>
            <button
              onClick={handleSubmitInvoice}
              disabled={isCreating || !selectedCustomerId}
              className="btn btn-primary w-full text-sm py-2.5"
            >
              {isCreating ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
              </h3>
              <button
                onClick={() => {
                  setShowCustomerForm(false)
                  setEditingCustomer(null)
                  setCustomerFormData({ name: '', email: '', phone: '', address: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); saveCustomer() }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                <input
                  type="text"
                  value={customerFormData.name}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                  className="form-input w-full"
                  placeholder="Nama pelanggan"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customerFormData.email}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                  className="form-input w-full"
                  placeholder="Email (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                <input
                  type="tel"
                  value={customerFormData.phone}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                  className="form-input w-full"
                  placeholder="Telepon (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea
                  value={customerFormData.address}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                  className="form-input w-full"
                  rows={3}
                  placeholder="Alamat lengkap (opsional)"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1"
                >
                  {loading ? 'Menyimpan...' : (editingCustomer ? 'Update' : 'Tambah')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerForm(false)
                    setEditingCustomer(null)
                    setCustomerFormData({ name: '', email: '', phone: '', address: '' })
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Template Preview Modal */}
      {selectedTemplate && (
        <TemplatePreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          template={selectedTemplate}
          sampleInvoice={getPreviewInvoice()}
        />
      )}
    </div>
  )
}

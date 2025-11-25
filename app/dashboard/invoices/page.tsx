'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import TemplatePreviewModal from './templates/TemplatePreviewModal'

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
interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface InvoiceItem {
  id?: string;
  description: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference_no?: string;
  note?: string;
}

interface Invoice {
  id: string
  invoiceNo: string
  customer?: Customer | null
  status: 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'CANCELLED'
  issueDate: string
  dueDate: string
  total: string | number
  items?: InvoiceItem[]
  subtotal?: number
  discount?: number
  tax?: number
  notes?: string
  payments?: Payment[]
}

/** Main Page Component */
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  })
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalInvoices, setTotalInvoices] = useState(0)
  const [limit, setLimit] = useState(10) // invoices per page
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc'>('date-desc') // sorting

  // Filter states
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    customerId: '',
    status: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [success, setSuccess] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'E_WALLET' | 'CHECK',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNo: '',
    notes: ''
  })

  // Export filter states
  const [exportFilter, setExportFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    type: 'monthly' as 'monthly' | 'yearly' | 'all'
  })

  // Stable fetch function
  const fetchInvoices = useCallback(async (page = 1, currentFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortBy
      })

      // Add filters to URL
      if (currentFilters.search) {
        params.append('search', currentFilters.search)
      }
      if (currentFilters.month) {
        params.append('month', currentFilters.month)
      }
      if (currentFilters.year) {
        params.append('year', currentFilters.year)
      }
      if (currentFilters.customerId) {
        params.append('customerId', currentFilters.customerId)
      }
      if (currentFilters.status) {
        params.append('status', currentFilters.status)
      }

      const response = await fetch(`/api/invoices?${params.toString()}`)
      if (!response.ok) {
        let errText = `HTTP ${response.status}`
        try {
          const json = await response.json()
          errText = json.error || JSON.stringify(json)
        } catch {
          const text = await response.text().catch(() => '')
          if (text) errText = text
        }
        throw new Error(`Failed to fetch invoices: ${errText}`)
      }
      const data = await response.json()
      setInvoices(Array.isArray(data.invoices) ? data.invoices : [])
      setTotalPages(data.pagination?.pages || 1)
      setTotalInvoices(data.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching invoices')
    } finally {
      setLoading(false)
    }
  }, [limit, sortBy])

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(prev => {
        if (prev.search === searchQuery) return prev;
        return { ...prev, search: searchQuery };
      });
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    // fetch when currentPage or filters change
    fetchInvoices(currentPage, filters)
  }, [currentPage, filters, fetchInvoices])

  // fetch customers once
  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data.customers) ? data.customers : []))
      .catch(() => setCustomers([]))
  }, [])

  const handleEdit = (invoice: Invoice) => {
    if (!invoice?.id) {
      console.error('Cannot edit invoice with missing ID:', invoice)
      setShowErrorModal({ show: true, message: 'Tidak dapat mengedit invoice: ID hilang' })
      return
    }
    setEditingInvoice(invoice)
    setShowFormModal(true)
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null)

  const handlePrint = async (invoice: Invoice) => {
    if (!invoice?.id) {
      console.error('Cannot print invoice with missing ID:', invoice)
      setShowErrorModal({ show: true, message: 'Tidak dapat mencetak invoice: ID hilang' })
      return
    }

    try {
      // Fetch full invoice details including items
      const response = await fetch(`/api/invoices/${invoice.id}`)
      if (!response.ok) throw new Error('Failed to fetch invoice details')
      const data = await response.json()
      
      // Fetch active template
      const templateResponse = await fetch('/api/invoice-templates-new?isActive=true')
      if (templateResponse.ok) {
        const templateData = await templateResponse.json()
        const templates = templateData.templates || []
        const defaultTemplate = templates.find((t: any) => t.is_default) || templates[0]
        
        if (defaultTemplate) {
          const normalizedTemplate = {
            ...defaultTemplate,
            layoutStyle: defaultTemplate.layout_style,
            primaryColor: defaultTemplate.primary_color,
            secondaryColor: defaultTemplate.secondary_color,
            accentColor: defaultTemplate.accent_color,
            fontFamily: defaultTemplate.font_family,
            fontSizeBase: defaultTemplate.font_size_base,
            companyName: defaultTemplate.company_name,
            companyAddress: defaultTemplate.company_address,
            companyLogo: defaultTemplate.company_logo,
            showLogo: defaultTemplate.show_logo,
          }
          setSelectedTemplate(normalizedTemplate)
        }
      }

      // Parse numeric fields to ensure they are numbers for the preview
      const parsedData = {
        ...data,
        subtotal: parseFloat(data.subtotal) || 0,
        total: parseFloat(data.total) || 0,
        tax: parseFloat(data.tax) || 0,
        discount: parseFloat(data.discount) || 0,
        items: data.items.map((item: any) => ({
          ...item,
          quantity: parseFloat(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          discount: parseFloat(item.discount) || 0,
          subtotal: parseFloat(item.subtotal) || 0,
        }))
      }

      setSelectedInvoice(parsedData)
      setShowPrintModal(true)
    } catch (err) {
      console.error('Error preparing print:', err)
      setShowErrorModal({ show: true, message: 'Gagal memuat preview invoice' })
    }
  }

  const handleDelete = (invoice: Invoice) => {
    setDeletingInvoice(invoice)
    setShowDeleteModal(true)
  }

  const confirmDelete = async (forceDelete = false) => {
    if (!deletingInvoice) return

    try {
      const url = forceDelete 
        ? `/api/invoices/${deletingInvoice.id}?force=true`
        : `/api/invoices/${deletingInvoice.id}`
        
      const response = await fetch(url, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if it's a related data error
        if (response.status === 400 && data.hasPayments !== undefined) {
          // Show confirmation dialog for force delete
          const details = []
          if (data.hasPayments) details.push(`${data.paymentsCount} pembayaran`)
          if (data.hasTransactions) details.push(`${data.transactionsCount} transaksi`)
          
          const confirmMessage = `Invoice ini memiliki ${details.join(' dan ')}.\n\nApakah Anda yakin ingin menghapus invoice beserta semua data terkait?\n\nPeringatan: Tindakan ini tidak dapat dibatalkan!`
          
          if (window.confirm(confirmMessage)) {
            // Retry with force delete
            return confirmDelete(true)
          } else {
            setShowDeleteModal(false)
            setDeletingInvoice(null)
            return
          }
        }
        
        throw new Error(data.message || data.error || 'Failed to delete invoice')
      }

      const successMsg = forceDelete && (data.deletedPayments > 0 || data.deletedTransactions > 0)
        ? `Invoice berhasil dihapus beserta ${data.deletedPayments} pembayaran dan ${data.deletedTransactions} transaksi`
        : 'Invoice berhasil dihapus'
        
      setSuccess(successMsg)
      setTimeout(() => setSuccess(''), 3000)
      fetchInvoices(currentPage, filters)
      setShowDeleteModal(false)
      setDeletingInvoice(null)
    } catch (err) {
      console.error('Error deleting invoice:', err)
      setShowErrorModal({ 
        show: true, 
        message: err instanceof Error ? err.message : 'Gagal menghapus invoice' 
      })
      setShowDeleteModal(false)
      setDeletingInvoice(null)
    }
  }

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filter changes
  }

  // Handle limit change
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setCurrentPage(1) // Reset to first page when limit changes
  }

  // Handle sort change
  const handleSortChange = (newSortBy: 'date-desc' | 'date-asc') => {
    setSortBy(newSortBy)
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      month: '',
      year: '',
      customerId: '',
      status: '',
      search: ''
    })
    setSearchQuery('')
    setCurrentPage(1)
  }

  // Check if any filters are active
  const hasActiveFilters = Boolean(filters.month || filters.year || filters.customerId || filters.status || filters.search)

  // Handle Payment
  const handlePayment = (invoice: Invoice) => {
    setPaymentInvoice(invoice)
    const totalPaid = invoice.payments?.reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0) || 0
    const remaining = (typeof invoice.total === 'string' ? parseFloat(invoice.total) : invoice.total) - totalPaid
    setPaymentForm({
      amount: remaining.toString(),
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNo: '',
      notes: ''
    })
    setShowPaymentModal(true)
  }

  // Submit Payment
  const handleSubmitPayment = async () => {
    try {
      if (!paymentInvoice || !paymentForm.amount) {
        setError('Jumlah pembayaran wajib diisi')
        return
      }

      setLoading(true)
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: paymentInvoice.id,
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          paymentDate: paymentForm.paymentDate,
          referenceNo: paymentForm.referenceNo || null,
          notes: paymentForm.notes || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal menyimpan pembayaran')
      }

      const result = await response.json()
      setSuccess(`Pembayaran berhasil disimpan! Status: ${result.newStatus}`)
      setShowPaymentModal(false)
      setPaymentInvoice(null)
      setPaymentForm({
        amount: '',
        paymentMethod: 'CASH',
        paymentDate: new Date().toISOString().split('T')[0],
        referenceNo: '',
        notes: ''
      })
      
      // Refresh invoices list
      fetchInvoices(currentPage, filters)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pembayaran')
    } finally {
      setLoading(false)
    }
  }

  // Fetch invoices for export with filters
  const fetchInvoicesForExport = async () => {
    try {
      const params = new URLSearchParams({
        limit: '10000' // Large limit for export
      })

      // Apply display filters OR export-specific filters
      if (exportFilter.type === 'monthly') {
        params.append('month', exportFilter.month.toString())
        params.append('year', exportFilter.year.toString())
      } else if (exportFilter.type === 'yearly') {
        params.append('year', exportFilter.year.toString())
      } else {
        // Use current display filters when exporting all data
        if (filters.month) params.append('month', filters.month)
        if (filters.year) params.append('year', filters.year)
        if (filters.customerId) params.append('customerId', filters.customerId)
        if (filters.status) params.append('status', filters.status)
        if (filters.search) params.append('search', filters.search)
      }

      const response = await fetch(`/api/invoices?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch invoices for export')

      const data = await response.json()
      return Array.isArray(data.invoices) ? data.invoices : []
    } catch (err) {
      console.error('Error fetching invoices for export:', err)
      return []
    }
  }

  // Utility: escape CSV cell (double quotes inside)
  const csvEscape = (v: string) => {
    const s = String(v ?? '')
    return `"${s.replace(/"/g, '""')}"`
  }

  // Function to format data for export
  const formatInvoicesForExport = (data: Invoice[]) => {
    return data.map((i: Invoice, index: number) => {
      const totalNum = typeof i.total === 'string' ? parseFloat(i.total) : (typeof i.total === 'number' ? i.total : 0)
      return {
        no: index + 1,
        nomorInvoice: i.invoiceNo || '-',
        pelanggan: i.customer?.name || '-',
        tanggalTerbit: formatDate(i.issueDate),
        tanggalJatuhTempo: formatDate(i.dueDate),
        status: getStatusText(i.status),
        total: formatCurrency(totalNum),
        totalAngka: totalNum
      }
    })
  }

  // Export functions with filters
  const exportToCSV = async () => {
    const exportData = await fetchInvoicesForExport()
    const formattedData = formatInvoicesForExport(exportData)
    if (formattedData.length === 0) {
      setShowErrorModal({ show: true, message: 'Tidak ada data untuk diekspor' })
      return
    }

    const headers = ['No.', 'Nomor Invoice', 'Pelanggan', 'Tanggal Terbit', 'Tanggal Jatuh Tempo', 'Status', 'Total']
    const rows = [
      headers.join(','),
      ...formattedData.map(row => [
        csvEscape(row.no.toString()),
        csvEscape(row.nomorInvoice),
        csvEscape(row.pelanggan),
        csvEscape(row.tanggalTerbit),
        csvEscape(row.tanggalJatuhTempo),
        csvEscape(row.status),
        csvEscape(row.total)
      ].join(','))
    ]

    // prepend BOM for Excel-friendly UTF-8
    const csvContent = '\uFEFF' + rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    // Generate filename based on filter
    const date = new Date()
    let filename = 'invoice_'
    if (exportFilter.type === 'monthly') {
      filename += `${date.getFullYear()}_${String(exportFilter.month).padStart(2, '0')}`
    } else if (exportFilter.type === 'yearly') {
      filename += `${date.getFullYear()}`
    } else {
      filename += date.toISOString().split('T')[0]
    }
    filename += '.csv'

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToExcel = async () => {
    const exportData = await fetchInvoicesForExport()
    const formattedData = formatInvoicesForExport(exportData)
    if (formattedData.length === 0) {
      setShowErrorModal({ show: true, message: 'Tidak ada data untuk diekspor' })
      return
    }

    let htmlContent = '<table border="1"><thead><tr>'
    htmlContent += '<th>No.</th><th>Nomor Invoice</th><th>Pelanggan</th><th>Tanggal Terbit</th><th>Tanggal Jatuh Tempo</th><th>Status</th><th>Total</th>'
    htmlContent += '</tr></thead><tbody>'
    formattedData.forEach(row => {
      htmlContent += `<tr><td>${row.no}</td><td>${row.nomorInvoice}</td><td>${row.pelanggan}</td><td>${row.tanggalTerbit}</td><td>${row.tanggalJatuhTempo}</td><td>${row.status}</td><td>${row.total}</td></tr>`
    })
    htmlContent += '</tbody></table>'

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    // Generate filename based on filter
    const date = new Date()
    let filename = 'invoice_'
    if (exportFilter.type === 'monthly') {
      filename += `${date.getFullYear()}_${String(exportFilter.month).padStart(2, '0')}`
    } else if (exportFilter.type === 'yearly') {
      filename += `${date.getFullYear()}`
    } else {
      filename += date.toISOString().split('T')[0]
    }
    filename += '.xls'

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = async () => {
    const exportData = await fetchInvoicesForExport()
    const formattedData = formatInvoicesForExport(exportData)
    if (formattedData.length === 0) {
      setShowErrorModal({ show: true, message: 'Tidak ada data untuk diekspor' })
      return
    }

    const totalAmount = exportData
      .reduce((sum: number, i: Invoice) => sum + (typeof i.total === 'string' ? parseFloat(i.total) : (typeof i.total === 'number' ? i.total : 0)), 0)

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      setShowErrorModal({ show: true, message: 'Harap izinkan popup untuk mengekspor ke PDF' })
      return
    }

    // Generate report title based on filter
    let reportTitle = 'Laporan Invoice'
    let periodText = ''
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

    if (exportFilter.type === 'monthly') {
      reportTitle = 'Laporan Invoice Bulanan'
      periodText = `Periode: ${monthNames[exportFilter.month - 1]} ${exportFilter.year}`
    } else if (exportFilter.type === 'yearly') {
      reportTitle = 'Laporan Invoice Tahunan'
      periodText = `Periode: Tahun ${exportFilter.year}`
    } else {
      periodText = `Semua Data`
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { text-align: center; margin-bottom: 20px; }
          .summary { margin: 20px 0; }
          .summary p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
          <p>${periodText}</p>
        </div>

        <div class="summary">
          <h3>Ringkasan</h3>
          <p>Total Invoice: ${formattedData.length}</p>
          <p>Total Nilai: ${formatCurrency(totalAmount)}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Nomor Invoice</th>
              <th>Pelanggan</th>
              <th>Tanggal Terbit</th>
              <th>Tanggal Jatuh Tempo</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${formattedData.map(row => `
              <tr>
                <td>${row.no}</td>
                <td>${row.nomorInvoice}</td>
                <td>${row.pelanggan}</td>
                <td>${row.tanggalTerbit}</td>
                <td>${row.tanggalJatuhTempo}</td>
                <td>${row.status}</td>
                <td>${row.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer" style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>Laporan ini dicetak otomatis dari Sistem Keuangan Adyatama Finance</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading invoices...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      </div>
    )
  }

  // 1. Piutang (Total Invoice Value) - Sum of 'total' from ALL invoices (excluding CANCELLED if desired, usually kept for record but let's exclude CANCELLED to be safe or keep all based on request. Request says "TOTAL seluruh nilai dari INVOICE")
  // Let's assume we exclude CANCELLED for accurate financial picture, or include all. "TOTAL seluruh nilai dari INVOICE" implies all issued.
  // Let's exclude CANCELLED to avoid inflated numbers.
  const totalInvoiceValue = (invoices || [])
    .filter(inv => inv.status !== 'CANCELLED')
    .reduce((sum, inv) => sum + (typeof inv.total === 'string' ? parseFloat(inv.total) : (typeof inv.total === 'number' ? inv.total : 0)), 0)

  // 2. Total Dibayar - Sum of all payments across all invoices
  const paidTotal = (invoices || [])
    .reduce((sum, inv) => {
      const invoicePayments = inv.payments?.reduce((pSum, p) => 
        pSum + (typeof p.amount === 'string' ? parseFloat(p.amount) : (typeof p.amount === 'number' ? p.amount : 0)), 0) || 0
      return sum + invoicePayments
    }, 0)

  // 3. Sisa Piutang - Total Invoice Value - Total Paid
  const remainingTotal = totalInvoiceValue - paidTotal > 0 ? totalInvoiceValue - paidTotal : 0

  return (
    <div className="space-y-4">
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Sukses! </strong>
          <span className="block sm:inline">{success}</span>
        </div>
      )}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Invoice</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-yellow-600 text-xs sm:text-sm font-medium">Piutang</div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-yellow-700">{formatCurrency(totalInvoiceValue)}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-red-600 text-xs sm:text-sm font-medium">Sisa Piutang</div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-red-700">{formatCurrency(remainingTotal)}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-green-600 text-xs sm:text-sm font-medium">Total Dibayar</div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-green-700">{formatCurrency(paidTotal)}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-blue-600 text-xs sm:text-sm font-medium">Total Invoice</div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-blue-700">{invoices.length}</div>
          </div>
        </div>


        {/* Mobile Controls */}
        <div className="lg:hidden space-y-3">
          {/* Search Bar - Full Width */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari invoice..."
              className="form-input w-full pl-10 pr-4 py-2.5 text-sm"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>

          {/* 3 Main Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex flex-col items-center justify-center p-2.5 rounded-lg border transition-colors ${
                hasActiveFilters 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              <span className="text-xs font-medium">Filter</span>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>

            <a
              href="/dashboard/invoices/create"
              className="flex flex-col items-center justify-center p-2.5 rounded-lg border bg-blue-600 border-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-medium">Buat</span>
            </a>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg border bg-white border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium">Export</span>
            </button>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden lg:flex flex-wrap items-center gap-2">
          {/* Search Bar */}
          <div className="flex-1 lg:max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari invoice (nomor, pelanggan)..."
                className="form-input w-full pl-10 pr-4 py-2"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 border-l pl-2 border-gray-300">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn flex items-center gap-2 ${hasActiveFilters ? 'btn-primary' : 'btn-secondary'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              <span>Filter</span>
              {hasActiveFilters && (
                <span className="bg-white text-blue-600 text-xs px-2 py-1 rounded-full">Aktif</span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-secondary flex items-center gap-2"
                title="Hapus semua filter"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 lg:ml-auto">
            <a
              href="/dashboard/invoices/create"
              className="btn btn-primary flex items-center gap-2 inline-flex"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah</span>
            </a>

            <button
              onClick={() => setShowExportModal(true)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold mb-4">Filter Invoice</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Filter Bulan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="form-input text-sm"
              >
                <option value="">Semua Bulan</option>
                <option value="1">Januari</option>
                <option value="2">Februari</option>
                <option value="3">Maret</option>
                <option value="4">April</option>
                <option value="5">Mei</option>
                <option value="6">Juni</option>
                <option value="7">Juli</option>
                <option value="8">Agustus</option>
                <option value="9">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </div>

            {/* Filter Tahun */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="form-input text-sm"
              >
                <option value="">Semua Tahun</option>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i
                  return <option key={year} value={year}>{year}</option>
                })}
              </select>
            </div>

            {/* Filter Pelanggan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pelanggan</label>
              <select
                value={filters.customerId}
                onChange={(e) => handleFilterChange('customerId', e.target.value)}
                className="form-input text-sm"
              >
                <option value="">Semua Pelanggan</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-input text-sm"
              >
                <option value="">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="ISSUED">Diterbitkan</option>
                <option value="PARTIAL">Sebagian</option>
                <option value="PAID">Lunas</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>
            </div>

            {/* Filter Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={clearFilters}
                className="btn btn-secondary text-sm flex-1"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="btn btn-primary text-sm flex-1"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-4">
        {/* Mobile Layout - Simple & Compact */}
        <div className="flex items-center justify-between gap-3 sm:hidden text-xs">
          {/* Show entries */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Show:</span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(parseInt(e.target.value))}
              className="form-input text-xs px-2 py-1 w-16 border-gray-300 bg-white rounded"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as 'date-desc' | 'date-asc')}
              className="form-input text-xs px-2 py-1 border-gray-300 bg-white rounded"
            >
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
            </select>
          </div>
        </div>

        {/* Desktop/Tablet Layout */}
        <div className="hidden sm:flex justify-between items-center">
          {/* Show entries dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Tampilkan</label>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(parseInt(e.target.value))}
              className="form-input text-sm w-20"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <label className="text-sm text-gray-700">entries</label>
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Urutkan:</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as 'date-desc' | 'date-asc')}
              className="form-input text-sm"
            >
              <option value="date-desc">Tanggal Terbaru</option>
              <option value="date-asc">Tanggal Terlama</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelanggan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jatuh Tempo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dibayar</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sisa</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="text-sm font-medium text-gray-900 mb-1">Belum ada invoice</div>
                      <div className="text-xs text-gray-500 mb-4">Tambah invoice pertama Anda untuk memulai</div>
                      <a
                        href="/dashboard/invoices/create"
                        className="btn btn-primary inline-flex items-center gap-2 mx-auto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Invoice
                      </a>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice, index) => {
                  const totalNum = typeof invoice.total === 'string' ? parseFloat(invoice.total) : (typeof invoice.total === 'number' ? invoice.total : 0)
                  const rowNumber = (currentPage - 1) * limit + index + 1
                  return (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{rowNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.customer?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.issueDate ? formatDate(invoice.issueDate) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(totalNum)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                        {formatCurrency(invoice.payments?.reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0) || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 text-right">
                        {formatCurrency(totalNum - (invoice.payments?.reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0) || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => window.location.href = `/dashboard/invoices/edit?id=${invoice.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-yellow-100 text-yellow-600 hover:bg-yellow-200 hover:text-yellow-700 transition-colors duration-200 mr-2"
                          title="Edit Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePrint(invoice)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-purple-100 text-purple-600 hover:bg-purple-200 hover:text-purple-700 transition-colors duration-200 mr-2"
                          title="Lihat Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(invoice)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-colors duration-200 mr-2"
                          title="Hapus Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handlePayment(invoice)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700 transition-colors duration-200"
                            title="Bayar Invoice"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {invoices.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-sm font-medium text-gray-900 mb-1">Belum ada invoice</div>
              <div className="text-xs text-gray-500 mb-4">Tambah invoice pertama Anda untuk memulai</div>
              <a
                href="/dashboard/invoices/create"
                className="btn btn-primary inline-flex items-center gap-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Tambah Invoice
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {invoices.map((invoice, index) => {
                const totalNum = typeof invoice.total === 'string' ? parseFloat(invoice.total) : (typeof invoice.total === 'number' ? invoice.total : 0)
                const rowNumber = (currentPage - 1) * limit + index + 1
                return (
                  <div key={invoice.id} className="bg-white hover:bg-gray-50 transition-colors">
                    <div className="px-3 py-2.5">
                      {/* Header Row - Invoice Number, Status, and Total */}
                      <div className="flex items-start justify-between mb-2">
                        {/* Left: Number and Invoice No */}
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-gray-500 rounded-full flex-shrink-0">
                              {rowNumber}
                            </span>
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${getStatusColor(invoice.status)}`}>
                              {getStatusText(invoice.status)}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-gray-900 truncate">
                            {invoice.invoiceNo}
                          </div>
                        </div>

                        {/* Right: Total */}
                        <div className="flex flex-col items-end flex-shrink-0">
                          <div className="text-base font-bold text-gray-900">
                            {formatCurrency(totalNum)}
                          </div>
                        </div>
                      </div>

                      {/* Customer Name */}
                      <div className="text-xs text-gray-600 mb-2 truncate">
                        <span className="font-medium">👤</span> {invoice.customer?.name || 'Tanpa pelanggan'}
                      </div>

                      {/* Payment Info */}
                      <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                        {/* Paid Amount */}
                        {invoice.payments && invoice.payments.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-green-600">✓</span>
                            <span className="text-gray-600">Dibayar:</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(invoice.payments.reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0))}
                            </span>
                          </div>
                        )}
                        {/* Remaining Amount */}
                        {(() => {
                          const paid = invoice.payments?.reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0) || 0
                          const remaining = totalNum - paid
                          if (remaining > 0) {
                            return (
                              <div className="flex items-center gap-1">
                                <span className="text-red-600">⚠</span>
                                <span className="text-gray-600">Sisa:</span>
                                <span className="font-semibold text-red-600">
                                  {formatCurrency(remaining)}
                                </span>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-2 mb-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{invoice.issueDate ? formatDate(invoice.issueDate) : '-'}</span>
                        </div>
                        {invoice.dueDate && (
                          <div className="flex items-center gap-1">
                            <span className="text-red-600">📅</span>
                            <span className="truncate">{formatDate(invoice.dueDate)}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => window.location.href = `/dashboard/invoices/edit?id=${invoice.id}`}
                          className="inline-flex items-center justify-center p-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded hover:bg-yellow-100 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePrint(invoice)}
                          className="inline-flex items-center justify-center p-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                          title="Preview"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(invoice)}
                          className="inline-flex items-center justify-center p-1.5 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
                          title="Hapus"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handlePayment(invoice)}
                            className="inline-flex items-center justify-center p-1.5 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
                            title="Bayar"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white border-t border-gray-200">
            {/* Mobile Pagination */}
            <div className="lg:hidden px-4 py-3">
              <div className="flex flex-col gap-3">
                {/* Info Text */}
                <div className="text-center text-xs text-gray-600">
                  Menampilkan <span className="font-medium">{(currentPage - 1) * limit + 1}</span>-<span className="font-medium">{Math.min(currentPage * limit, totalInvoices)}</span> dari <span className="font-medium">{totalInvoices}</span> data
                </div>

                {/* Page Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Sebelumnya</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg min-w-[80px] text-center">
                      {currentPage}/{totalPages}
                    </span>
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <span>Selanjutnya</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Pagination */}
            <div className="hidden lg:block px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(currentPage * limit, totalInvoices)}</span> of <span className="font-medium">{totalInvoices}</span> results
                </div>

                <div className="flex items-center gap-3">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  {/* Page Info */}
                  <div className="flex items-center gap-2">
                    <span className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200 rounded-md min-w-[100px] text-center">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form Tambah/Edit Invoice */}
      {showFormModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-auto p-4 sm:p-5 border shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingInvoice ? 'Edit Invoice' : 'Buat Invoice Baru'}
              </h3>
              <button
                onClick={() => {
                  setShowFormModal(false)
                  setEditingInvoice(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <InvoiceForm
              onSuccess={() => {
                setShowFormModal(false)
                setEditingInvoice(null)
                setCurrentPage(1)
                fetchInvoices(1, filters)
                if (editingInvoice) {
                  setSuccess('Invoice berhasil diperbarui!')
                } else {
                  setSuccess('Invoice berhasil ditambahkan!')
                }
                setTimeout(() => setSuccess(''), 3000)
              }}
              onCancel={() => {
                setShowFormModal(false)
                setEditingInvoice(null)
              }}
              editingInvoice={editingInvoice}
              customers={customers}
            />
          </div>
        </div>
      )}

      {/* Modal Export */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xs max-h-[90vh] overflow-auto p-5 border shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Export Invoice</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Laporan</label>
                <select
                  value={exportFilter.type}
                  onChange={(e) => setExportFilter({ ...exportFilter, type: e.target.value as 'monthly' | 'yearly' | 'all' })}
                  className="form-input w-full"
                >
                  <option value="all">Semua Data</option>
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
              </div>

              {(exportFilter.type === 'monthly' || exportFilter.type === 'yearly') && (
                <div className="grid grid-cols-2 gap-3">
                  {exportFilter.type === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                      <select
                        value={exportFilter.month}
                        onChange={(e) => setExportFilter({ ...exportFilter, month: parseInt(e.target.value) })}
                        className="form-input w-full"
                      >
                        <option value={1}>Januari</option>
                        <option value={2}>Februari</option>
                        <option value={3}>Maret</option>
                        <option value={4}>April</option>
                        <option value={5}>Mei</option>
                        <option value={6}>Juni</option>
                        <option value={7}>Juli</option>
                        <option value={8}>Agustus</option>
                        <option value={9}>September</option>
                        <option value={10}>Oktober</option>
                        <option value={11}>November</option>
                        <option value={12}>Desember</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                    <select
                      value={exportFilter.year}
                      onChange={(e) => setExportFilter({ ...exportFilter, year: parseInt(e.target.value) })}
                      className="form-input w-full"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i
                        return <option key={year} value={year}>{year}</option>
                      })}
                    </select>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Format Export:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      exportToPDF()
                      setShowExportModal(false)
                    }}
                    className="px-3 py-2 bg-red-50 text-red-700 text-sm rounded hover:bg-red-100 transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => {
                      exportToExcel()
                      setShowExportModal(false)
                    }}
                    className="px-3 py-2 bg-green-50 text-green-700 text-sm rounded hover:bg-green-100 transition-colors"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => {
                      exportToCSV()
                      setShowExportModal(false)
                    }}
                    className="px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100 transition-colors"
                  >
                    CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Error */}
      {showErrorModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xs max-h-[90vh] overflow-auto p-5 border shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Error</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">{showErrorModal.message}</p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowErrorModal({ show: false, message: '' })}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 w-full"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Bayar Invoice - {paymentInvoice.invoiceNo}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Invoice Summary */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Total Invoice:</span>
                  <span className="font-medium">{formatCurrency(typeof paymentInvoice.total === 'string' ? parseFloat(paymentInvoice.total) : paymentInvoice.total)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Sudah Dibayar:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(paymentInvoice.payments?.reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0) || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                  <span>Sisa:</span>
                  <span className="text-red-600">
                    {formatCurrency(
                      (typeof paymentInvoice.total === 'string' ? parseFloat(paymentInvoice.total) : paymentInvoice.total) -
                      (paymentInvoice.payments?.reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0) || 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Pembayaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="form-input w-full"
                  placeholder="0"
                  step="0.01"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                  className="form-input w-full"
                >
                  <option value="CASH">Tunai</option>
                  <option value="BANK_TRANSFER">Transfer Bank</option>
                  <option value="CREDIT_CARD">Kartu Kredit</option>
                  <option value="E_WALLET">E-Wallet</option>
                  <option value="CHECK">Cek</option>
                </select>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Bayar
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="form-input w-full"
                />
              </div>

              {/* Reference No */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Referensi
                </label>
                <input
                  type="text"
                  value={paymentForm.referenceNo}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                  className="form-input w-full"
                  placeholder="Opsional"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="form-input w-full"
                  rows={2}
                  placeholder="Opsional"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPaymentInvoice(null)
                }}
                className="btn btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={loading || !paymentForm.amount}
                className="btn btn-primary flex-1"
              >
                {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}




      {/* Template Preview Modal for Printing */}
      {selectedTemplate && selectedInvoice && (
        <TemplatePreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          template={selectedTemplate}
          sampleInvoice={selectedInvoice}
        />
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowDeleteModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Hapus Invoice
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Apakah Anda yakin ingin menghapus invoice <b>{deletingInvoice.invoiceNo}</b>? Tindakan ini tidak dapat dibatalkan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => confirmDelete()}
                >
                  Hapus
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'DRAFT': return 'bg-gray-100 text-gray-800'
    case 'ISSUED': return 'bg-blue-100 text-blue-800'
    case 'PARTIAL': return 'bg-yellow-100 text-yellow-800'
    case 'PAID': return 'bg-green-100 text-green-800'
    case 'CANCELLED': return 'red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'DRAFT': return 'Draft'
    case 'ISSUED': return 'Diterbitkan'
    case 'PARTIAL': return 'Sebagian'
    case 'PAID': return 'Lunas'
    case 'CANCELLED': return 'Dibatalkan'
    default: return status
  }
}


/* ------------------
   InvoiceForm with Items Management
   ------------------ */

type InvoiceFormProps = {
  editingInvoice?: Invoice | null
  customers: Customer[]
  onSuccess?: (data?: Invoice) => void
  onCancel?: () => void
}

interface InvoiceFormValues {
  customerId: string
  issueDate: string
  dueDate: string
  discount: string
  tax: string
  notes: string
  currency: string
}

interface InvoiceItem {
  id?: string
  description: string
  product_sku?: string
  quantity: number
  unit_price: number
  discount: number
  subtotal: number
}

function InvoiceForm({ editingInvoice = null, customers = [], onSuccess, onCancel }: InvoiceFormProps) {
  const isEdit = !!editingInvoice
  const [formData, setFormData] = useState<InvoiceFormValues>({
    customerId: editingInvoice?.customer?.id?.toString() || '',
    issueDate: editingInvoice?.issueDate ? editingInvoice.issueDate.slice(0, 10) : new Date().toISOString().split('T')[0],
    dueDate: editingInvoice?.dueDate ? editingInvoice.dueDate.slice(0, 10) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discount: '0',
    tax: '0',
    notes: '',
    currency: 'IDR'
  })

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', product_sku: '', quantity: 1, unit_price: 0, discount: 0, subtotal: 0 }
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Calculate totals
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0)
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
      item[field] = numValue
      item.subtotal = (item.quantity * item.unit_price) - item.discount
    } else {
      (item as any)[field] = value
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!formData.customerId) return setError('Pelanggan wajib dipilih')
    if (!formData.issueDate) return setError('Tanggal terbit wajib diisi')
    if (!formData.dueDate) return setError('Tanggal jatuh tempo wajib diisi')

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.description.trim()) return setError(`Item ${i + 1}: Deskripsi wajib diisi`)
      if (item.quantity <= 0) return setError(`Item ${i + 1}: Quantity harus lebih dari 0`)
      if (item.unit_price <= 0) return setError(`Item ${i + 1}: Harga satuan harus lebih dari 0`)
    }

    const subtotal = calculateSubtotal()
    const total = calculateTotal()

    const payload: any = {
      customerId: parseInt(formData.customerId),
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      discount: parseFloat(formData.discount) || 0,
      tax: parseFloat(formData.tax) || 0,
      subtotal,
      total,
      currency: formData.currency,
      notes: formData.notes || null,
      items: items.map(item => ({
        description: item.description,
        product_sku: item.product_sku || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        subtotal: item.subtotal
      }))
    }

    // If editing, include id and use PUT; otherwise POST
    const method = isEdit ? 'PUT' : 'POST'
    const url = isEdit ? `/api/invoices/${editingInvoice!.id}` : '/api/invoices'

    // include id in body in case backend expects it
    if (isEdit) payload.id = editingInvoice!.id

    try {
      setLoading(true)
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        const msg = data?.error || data?.message || `HTTP ${res.status}`
        throw new Error(msg)
      }

      // success
      if (onSuccess) onSuccess(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Invoice</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pelanggan</label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="form-input w-full"
            >
              <option value="">-- Pilih Pelanggan --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Terbit</label>
            <input
              type="date"
              name="issueDate"
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Jatuh Tempo</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="form-input w-full"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="form-input w-full"
            rows={3}
            placeholder="Catatan invoice (opsional)"
          />
        </div>
      </div>

      {/* Invoice Items */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Item Invoice</h3>
          <button
            type="button"
            onClick={addItem}
            className="btn btn-primary text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="form-input w-full"
                    placeholder="Nama item atau jasa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={item.product_sku || ''}
                    onChange={(e) => updateItem(index, 'product_sku', e.target.value)}
                    className="form-input w-full"
                    placeholder="Kode produk (opsional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="form-input w-full"
                    min="0.001"
                    step="0.001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Satuan</label>
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                    className="form-input w-full"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diskon</label>
                  <input
                    type="number"
                    value={item.discount}
                    onChange={(e) => updateItem(index, 'discount', e.target.value)}
                    className="form-input w-full"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="flex items-end">
                  <div className="text-sm font-medium text-gray-900">
                    Subtotal: {formatCurrency(item.subtotal)}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                      title="Hapus item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium">{formatCurrency(calculateSubtotal() || 0)}</span>
              </div>

              <div className="flex justify-between">
                <label className="text-sm text-gray-600">Diskon:</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="form-input text-sm w-24 text-right"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex justify-between">
                <label className="text-sm text-gray-600">Pajak:</label>
                <input
                  type="number"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                  className="form-input text-sm w-24 text-right"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="md:text-right">
            <div className="text-sm text-gray-600 mb-2">Total:</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(calculateTotal())}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? (isEdit ? 'Menyimpan...' : 'Membuat...') : (isEdit ? 'Simpan Perubahan' : 'Buat Invoice')}
        </button>
        <button type="button" onClick={() => { if (onCancel) onCancel() }} className="btn btn-secondary">
          Batal
        </button>
      </div>
    </form>
  )
}
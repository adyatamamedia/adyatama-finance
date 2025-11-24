'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import TemplateEditorModal from './TemplateEditorModal'
import TemplatePreviewModal from './TemplatePreviewModal'

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

/** Main Template Management Page */
export default function InvoiceTemplatesPage() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit, setLimit] = useState(10) // templates per page
  const [showFilters, setShowFilters] = useState(false)
  const [totalTemplates, setTotalTemplates] = useState(0)

  // Additional filter states for the duplicate filter section
  const [filterLayout, setFilterLayout] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Enhanced filter states
  const [filters, setFilters] = useState({
    isDefault: '',
    isActive: '',
    layoutStyle: '',
    sortBy: 'created_at_desc'
  })

  // Fetch templates
  useEffect(() => {
    fetchTemplates()
  }, [currentPage, limit, searchQuery, filters, filterLayout, filterStatus])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString()
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      // Apply enhanced filters with priority given to the main filters state
      // Only apply the additional filters (filterLayout, filterStatus) if the main filters are not set
      if (filters.isDefault) {
        params.append('isDefault', filters.isDefault)
      }

      if (filters.isActive) {
        params.append('isActive', filters.isActive)
      } else if (filterStatus !== 'all') {
        // Only apply additional status filter if main filter is not set
        params.append('isActive', filterStatus === 'active' ? 'true' : 'false')
      }

      if (filters.layoutStyle) {
        params.append('layoutStyle', filters.layoutStyle)
      } else if (filterLayout !== 'all') {
        // Only apply additional layout filter if main filter is not set
        params.append('layoutStyle', filterLayout)
      }

      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy)
      }

      // Debugging: log the URL being called and parameters
      const url = `/api/invoice-templates-new?${params.toString()}`
      console.log('Fetching templates from URL:', url)
      console.log('Parameters being sent:', Object.fromEntries(params.entries()))

      const response = await fetch(url)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        console.error('Status:', response.status, 'Status Text:', response.statusText)
        throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText}. Details: ${errorText}`)
      }

      const data = await response.json()
      setTemplates(data.templates || [])
      setTotalPages(data.pagination?.pages || 1)
      setTotalTemplates(data.pagination?.total || 0)
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError('Gagal memuat template invoice')
    } finally {
      setLoading(false)
    }
  }

  // Filter handlers for main filters
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    // Clear the additional filters when main filters are used to avoid conflicts
    if (key === 'isActive' && value !== '') {
      setFilterStatus('all')
    }
    if (key === 'layoutStyle' && value !== '') {
      setFilterLayout('all')
    }
    setCurrentPage(1) // Reset to first page when filter changes
  }

  // Handle changes to additional filters (need to clear corresponding main filters)
  const handleAdditionalFilterChange = (filterType: string, value: string) => {
    if (filterType === 'layout') {
      setFilterLayout(value);
      // Clear the main layout filter if additional filter is set
      if (value !== 'all') {
        setFilters(prev => ({ ...prev, layoutStyle: '' }));
      }
    } else if (filterType === 'status') {
      setFilterStatus(value);
      // Clear the main status filter if additional filter is set
      if (value !== 'all') {
        setFilters(prev => ({ ...prev, isActive: '' }));
      }
    }
    setCurrentPage(1); // Reset to first page when filter changes
  }

  const clearFilters = () => {
    setFilters({
      isDefault: '',
      isActive: '',
      layoutStyle: '',
      sortBy: 'created_at_desc'
    })
    // Also clear the additional filters
    setFilterLayout('all')
    setFilterStatus('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'created_at_desc') ||
                          (filterStatus !== 'all' || filterLayout !== 'all')

  // Create thumbnail component for template preview with layout-specific styling
  const createTemplateThumbnail = (template: InvoiceTemplate) => {
    // Modern Layout Thumbnail
    if (template.layout_style === 'modern') {
      return (
        <div
          className="h-40 bg-white rounded-lg border-2 border-gray-200 p-3 relative overflow-hidden"
          style={{
            borderColor: template.primary_color + '30',
            fontFamily: template.font_family || 'Arial, sans-serif',
            fontSize: `${template.font_size_base || 12}px`
          }}
        >
          {/* Header with modern styling */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              {template.show_logo && template.company_logo ? (
                <img
                  src={template.company_logo}
                  alt="Logo"
                  className="h-5 object-contain mb-1"
                />
              ) : (
                <div
                  className="text-xs font-bold truncate"
                  style={{ color: template.primary_color }}
                >
                  {template.company_name || 'Company Name'}
                </div>
              )}
            </div>
            <div
              className="text-xs font-bold px-2 py-1 rounded"
              style={{
                backgroundColor: template.accent_color + '20',
                color: template.accent_color
              }}
            >
              INVOICE
            </div>
          </div>

          {/* Modern-style details */}
          <div className="space-y-1 mb-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">No:</span>
              <span className="font-medium">INV-001</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Date:</span>
              <span>Today</span>
            </div>
          </div>

          {/* Modern-style items preview */}
          <div className="mt-2 border-t pt-2">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span className="truncate">Service Item</span>
                <span>Rp 1.000.000</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t" style={{ borderTopColor: template.accent_color + '30' }}>
                <span>Total:</span>
                <span style={{ color: template.accent_color }}>Rp 1.000.000</span>
              </div>
            </div>
          </div>

          {/* Watermark if enabled */}
          {template.show_watermark && template.watermark_text && (
            <div
              className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"
              style={{ color: template.primary_color }}
            >
              <div className="text-lg font-bold transform rotate-45">
                {template.watermark_text}
              </div>
            </div>
          )}
        </div>
      )
    }

    // Classic Layout Thumbnail
    if (template.layout_style === 'classic') {
      return (
        <div
          className="h-40 bg-white rounded-lg border-2 border-gray-200 p-3 relative overflow-hidden"
          style={{
            borderColor: template.primary_color + '30',
            fontFamily: template.font_family || "'Times New Roman', serif",
            fontSize: `${template.font_size_base || 12}px`
          }}
        >
          {/* Header with classic styling */}
          <div className="text-center mb-2 border-b pb-2">
            {template.show_logo && template.company_logo ? (
              <img
                src={template.company_logo}
                alt="Logo"
                className="h-4 mx-auto object-contain mb-1"
              />
            ) : (
              <div
                className="text-xs font-bold"
                style={{ color: template.primary_color }}
              >
                {template.company_name || 'Company Name'}
              </div>
            )}
          </div>

          {/* Classic-style invoice title */}
          <div className="text-center mb-2">
            <div
              className="text-xs font-bold"
              style={{ color: template.accent_color }}
            >
              INVOICE
            </div>
          </div>

          {/* Classic-style details */}
          <div className="space-y-1 mb-2 text-center">
            <div className="text-xs">
              <span className="text-gray-500">No: </span>
              <span>INV-001</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500">Date: </span>
              <span>Today</span>
            </div>
          </div>

          {/* Classic-style items preview */}
          <div className="mt-2">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span className="truncate">Service Item</span>
                <span>Rp 1.000.000</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t" style={{ borderTopColor: '#ddd' }}>
                <span>Total:</span>
                <span style={{ color: template.accent_color }}>Rp 1.000.000</span>
              </div>
            </div>
          </div>

          {/* Watermark if enabled */}
          {template.show_watermark && template.watermark_text && (
            <div
              className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"
              style={{ color: template.primary_color }}
            >
              <div className="text-lg font-bold">
                {template.watermark_text}
              </div>
            </div>
          )}
        </div>
      )
    }

    // Minimal Layout Thumbnail (default)
    return (
      <div
        className="h-40 bg-white rounded-lg border border-gray-200 p-4 relative overflow-hidden"
        style={{
          fontFamily: template.font_family || 'Arial, sans-serif',
          fontSize: `${template.font_size_base || 12}px`
        }}
      >
        {/* Minimal header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {template.show_logo && template.company_logo ? (
              <img
                src={template.company_logo}
                alt="Logo"
                className="h-4 object-contain mb-1"
              />
            ) : (
              <div
                className="text-xs font-bold truncate"
                style={{ color: template.primary_color }}
              >
                {template.company_name || 'Company Name'}
              </div>
            )}
          </div>
          <div
            className="text-xs font-bold"
            style={{ color: template.accent_color }}
          >
            INVOICE
          </div>
        </div>

        {/* Minimal details */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">No:</span>
            <span>INV-001</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Date:</span>
            <span>Today</span>
          </div>
        </div>

        {/* Minimal items preview */}
        <div>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span className="truncate">Service Item</span>
              <span>Rp 1.000.000</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-2 border-t-0">
              <span>Total:</span>
              <span style={{ color: template.accent_color }}>Rp 1.000.000</span>
            </div>
          </div>
        </div>

        {/* Watermark if enabled */}
        {template.show_watermark && template.watermark_text && (
          <div
            className="absolute inset-0 flex items-center justify-center opacity-2 pointer-events-none"
            style={{ color: template.primary_color }}
          >
            <div className="text-lg font-bold">
              {template.watermark_text}
            </div>
          </div>
        )}
      </div>
    )
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) {
      return
    }

    try {
      setError('')

      const response = await fetch(`/api/invoice-templates-new/${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal menghapus template')
      }

      setTemplates(templates.filter(t => t.id !== templateId))
      setSuccess('Template berhasil dihapus!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus template')
    }
  }

  const handleSetDefault = async (templateId: string) => {
    try {
      setError('')

      const template = templates.find(t => t.id === templateId)
      if (!template) return

      const response = await fetch(`/api/invoice-templates-new/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          company_name: template.company_name,
          is_default: true,
          is_active: template.is_active
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal mengubah template default')
      }

      // Update local state
      setTemplates(templates.map(t => ({
        ...t,
        is_default: t.id === templateId
      })))

      setSuccess('Template default berhasil diubah!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah template default')
    }
  }

  const getLayoutIcon = (layoutStyle: string) => {
    switch (layoutStyle) {
      case 'modern':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'classic':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <path d="M17 21v-8H7v8M7 3v5h8" />
          </svg>
        )
      case 'minimal':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        )
      default:
        return null
    }
  }

  const getLayoutLabel = (layoutStyle: string) => {
    switch (layoutStyle) {
      case 'modern': return 'Modern'
      case 'classic': return 'Klasik'
      case 'minimal': return 'Minimalis'
      default: return layoutStyle
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kelola Template Invoice</h1>
        <p className="text-sm text-gray-600">Kelola dan kustomisasi template invoice untuk bisnis Anda</p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {/* Search Bar - Full width on mobile, takes remaining space on desktop */}
          <div className="flex-1 lg:max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari template (nama, deskripsi, perusahaan)..."
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
              <span className="hidden sm:inline">Filter</span>
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
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Template Baru
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 mt-4">
            <h3 className="text-lg font-semibold mb-4">Filter Template</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Filter Default */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Default</label>
                <select
                  value={filters.isDefault}
                  onChange={(e) => handleFilterChange('isDefault', e.target.value)}
                  className="form-input text-sm"
                >
                  <option value="">Semua</option>
                  <option value="true">Default</option>
                  <option value="false">Non-Default</option>
                </select>
              </div>

              {/* Filter Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.isActive}
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  className="form-input text-sm"
                >
                  <option value="">Semua Status</option>
                  <option value="true">Aktif</option>
                  <option value="false">Non-aktif</option>
                </select>
              </div>

              {/* Filter Layout Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gaya Layout</label>
                <select
                  value={filters.layoutStyle}
                  onChange={(e) => handleFilterChange('layoutStyle', e.target.value)}
                  className="form-input text-sm"
                >
                  <option value="">Semua Gaya</option>
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>

              {/* Filter Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urutkan</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="form-input text-sm"
                >
                  <option value="created_at_desc">Terbaru</option>
                  <option value="created_at_asc">Terlama</option>
                  <option value="name_asc">Nama (A-Z)</option>
                  <option value="name_desc">Nama (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">{success}</div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Result Count */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          <span>{templates.length} template ditemukan</span>
          {(searchQuery || filterLayout !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={clearFilters}
              className="ml-4 text-blue-600 hover:text-blue-800 text-sm"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

          {/* Templates Count */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {searchQuery || hasActiveFilters ? (
            <span>Menampilkan {templates.length} dari {totalTemplates} template</span>
          ) : (
            <span>Total {totalTemplates} template</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="form-input py-1 text-sm w-auto"
          >
            <option value={10}>10</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
          <span>per page</span>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Templates Grid */}
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || hasActiveFilters ? 'Tidak ada template yang cocok' : 'Belum ada template'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || hasActiveFilters
                  ? 'Coba ubah filter atau kata kunci pencarian Anda'
                  : 'Mulai dengan membuat template invoice pertama Anda'
                }
              </p>
              {!(searchQuery || hasActiveFilters) && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  Buat Template Baru
                </button>
              )}
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group">

                {/* Template Thumbnail */}
                <div className="p-4">
                  {createTemplateThumbnail(template)}
                </div>

                {/* Template Info */}
                <div className="px-4 pb-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">{template.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        {getLayoutIcon(template.layout_style)}
                        <span>{getLayoutLabel(template.layout_style)}</span>
                      </div>
                      <span>•</span>
                      <span>{template.usage_count} penggunaan</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${template.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-xs text-gray-600">
                      {template.is_active ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowPreviewModal(true)
                      }}
                      className="btn btn-outline text-xs flex items-center justify-center gap-1 hover:bg-blue-50 hover:border-blue-300"
                      title="Preview Template"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Preview
                    </button>

                    <button
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowEditModal(true)
                      }}
                      className="btn btn-outline text-xs flex items-center justify-center gap-1 hover:bg-green-50 hover:border-green-300"
                      title="Edit Template"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>

                    {!template.is_default ? (
                      <button
                        onClick={() => handleSetDefault(template.id)}
                        className="btn btn-outline text-xs flex items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300"
                        title="Jadikan Default"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Default
                      </button>
                    ) : (
                      <div className="btn bg-gray-100 text-gray-400 text-xs flex items-center justify-center gap-1 cursor-not-allowed">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        Default
                      </div>
                    )}

                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="btn btn-outline text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 flex items-center justify-center gap-1"
                      title="Hapus Template"
                      disabled={template.is_default}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </>
    )}  {/* <-- <-- DI SINI saya tambahkan penutup ekspresi ternary: )} */}

      {/* Create/Edit Template Modal */}
      {(showCreateModal || showEditModal) && (
        <TemplateEditorModal
          key={selectedTemplate?.id || 'new'}
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false)
            setShowEditModal(false)
            setSelectedTemplate(null)
          }}
          template={selectedTemplate}
          onSuccess={(template) => {
            fetchTemplates()
            setSuccess(showCreateModal ? 'Template berhasil dibuat!' : 'Template berhasil diperbarui!')
            setTimeout(() => setSuccess(''), 3000)
            setShowCreateModal(false)
            setShowEditModal(false)
            setSelectedTemplate(null)
          }}
          onError={(error) => setError(error)}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <TemplatePreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false)
            setSelectedTemplate(null)
          }}
          template={selectedTemplate}
        />
      )}
    </div>
  )
}

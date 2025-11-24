'use client'

import { useState, useEffect } from 'react'

interface TemplateEditorModalProps {
  isOpen: boolean
  onClose: () => void
  template?: any
  onSuccess: (template: any) => void
  onError: (error: string) => void
}

interface TemplateFormData {
  // Basic Info
  name: string
  description: string
  is_default: boolean
  is_active: boolean

  // Company Info
  company_name: string
  company_logo: string
  company_address: string
  company_phone: string
  company_email: string
  company_website: string
  tax_id: string

  // Colors & Typography
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  font_size_base: number

  // Layout Settings
  show_logo: boolean
  logo_position: 'left' | 'center' | 'right'
  show_company_details: boolean
  layout_style: 'modern' | 'classic' | 'minimal'
  show_watermark: boolean
  watermark_text: string

  // Footer Settings
  footer_notes: string
  footer_terms: string
  footer_payment_info: string
  footer_bank_account: string
}

export default function TemplateEditorModal({ isOpen, onClose, template, onSuccess, onError }: TemplateEditorModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'company' | 'design' | 'footer'>('basic')
  const [formData, setFormData] = useState<TemplateFormData>({
    // Basic Info
    name: '',
    description: '',
    is_default: false,
    is_active: true,

    // Company Info
    company_name: '',
    company_logo: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    tax_id: '',

    // Colors & Typography
    primary_color: '#000000',
    secondary_color: '#666666',
    accent_color: '#3b82f6',
    font_family: 'Arial, sans-serif',
    font_size_base: 12,

    // Layout Settings
    show_logo: true,
    logo_position: 'left',
    show_company_details: true,
    layout_style: 'modern',
    show_watermark: false,
    watermark_text: '',

    // Footer Settings
    footer_notes: '',
    footer_terms: '',
    footer_payment_info: '',
    footer_bank_account: ''
  })

  // Initialize form with template data if editing
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name ?? '',
        description: template.description ?? '',
        is_default: template.is_default ?? template.isDefault ?? false,
        is_active: template.is_active ?? template.isActive ?? true,
        company_name: template.company_name ?? template.companyName ?? '',
        company_logo: template.company_logo ?? template.companyLogo ?? '',
        company_address: template.company_address ?? template.companyAddress ?? '',
        company_phone: template.company_phone ?? template.companyPhone ?? '',
        company_email: template.company_email ?? template.companyEmail ?? '',
        company_website: template.company_website ?? template.companyWebsite ?? '',
        tax_id: template.tax_id ?? template.taxId ?? '',
        primary_color: template.primary_color ?? template.primaryColor ?? '#000000',
        secondary_color: template.secondary_color ?? template.secondaryColor ?? '#666666',
        accent_color: template.accent_color ?? template.accentColor ?? '#3b82f6',
        font_family: template.font_family ?? template.fontFamily ?? 'Arial, sans-serif',
        font_size_base: template.font_size_base ?? template.fontSizeBase ?? 12,
        show_logo: template.show_logo ?? template.showLogo ?? true,
        logo_position: template.logo_position ?? template.logoPosition ?? 'left',
        show_company_details: template.show_company_details ?? template.showCompanyDetails ?? true,
        layout_style: template.layout_style ?? template.layoutStyle ?? 'modern',
        show_watermark: template.show_watermark ?? template.showWatermark ?? false,
        watermark_text: template.watermark_text ?? template.watermarkText ?? '',
        footer_notes: template.footer_notes ?? template.footerNotes ?? '',
        footer_terms: template.footer_terms ?? template.footerTerms ?? '',
        footer_payment_info: template.footer_payment_info ?? template.footerPaymentInfo ?? '',
        footer_bank_account: template.footer_bank_account ?? template.footerBankAccount ?? ''
      })
    }
  }, [template?.id]) // Use template.id for dependency to prevent re-renders

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.name || !formData.name.trim()) {
        throw new Error('Nama template wajib diisi')
      }
      if (!formData.company_name || !formData.company_name.trim()) {
        throw new Error('Nama perusahaan wajib diisi')
      }

      const url = template ? `/api/invoice-templates-new/${template.id}` : '/api/invoice-templates-new'
      const method = template ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal menyimpan template')
      }

      const savedTemplate = await response.json()
      onSuccess(savedTemplate)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Gagal menyimpan template')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validasi file
      const maxSize = 5 * 1024 * 1024 // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

      if (file.size > maxSize) {
        onError('File size too large. Maximum size is 5MB')
        return
      }

      if (!allowedTypes.includes(file.type)) {
        onError('Invalid file type. Allowed types: JPEG, PNG, GIF, WebP')
        return
      }

      try {
        // Upload file ke API
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'logos')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const uploadResult = await response.json()
        setFormData(prev => ({ ...prev, company_logo: uploadResult.path }))

      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to upload logo')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {template ? 'Edit Template Invoice' : 'Template Invoice Baru'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(['basic', 'company', 'design', 'footer'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-6 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'basic' && 'Informasi Dasar'}
                  {tab === 'company' && 'Info Perusahaan'}
                  {tab === 'design' && 'Desain & Layout'}
                  {tab === 'footer' && 'Footer & Lainnya'}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 space-y-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Template *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-input w-full"
                      placeholder="Template Standar"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gaya Layout</label>
                    <select
                      value={formData.layout_style || 'modern'}
                      onChange={(e) => setFormData({ ...formData, layout_style: e.target.value as any })}
                      className="form-input w-full"
                    >
                      <option value="modern">Modern</option>
                      <option value="classic">Klasik</option>
                      <option value="minimal">Minimalis</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-input w-full"
                    rows={3}
                    placeholder="Deskripsi template invoice"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="form-checkbox mr-2"
                    />
                    <span className="text-sm text-gray-700">Jadikan template default</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="form-checkbox mr-2"
                    />
                    <span className="text-sm text-gray-700">Template aktif</span>
                  </label>
                </div>
              </>
            )}

            {/* Company Info Tab */}
            {activeTab === 'company' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan *</label>
                  <input
                    type="text"
                    value={formData.company_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    className="form-input w-full"
                    placeholder="PT. Contoh"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo Perusahaan</label>
                  <div className="space-y-2">
                    {formData.company_logo && (
                      <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                        <img
                          src={formData.company_logo}
                          alt="Logo"
                          className="h-12 w-auto"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, company_logo: '' })}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          Hapus Logo
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="form-input w-full"
                    />
                    <p className="text-xs text-gray-500">Format: JPG, PNG, GIF, WebP. Maksimal 5MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                    <textarea
                      value={formData.company_address || ''}
                      onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                      className="form-input w-full"
                      rows={3}
                      placeholder="Jl. Contoh No. 1, Jakarta"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                      <input
                        type="tel"
                        value={formData.company_phone || ''}
                        onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                        className="form-input w-full"
                        placeholder="(021) 1234-5678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.company_email || ''}
                        onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                        className="form-input w-full"
                        placeholder="info@contoh.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={formData.company_website || ''}
                      onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                      className="form-input w-full"
                      placeholder="https://www.contoh.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NPWP</label>
                    <input
                      type="text"
                      value={formData.tax_id || ''}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      className="form-input w-full"
                      placeholder="XX.XXX.XXX.X-XXX.XXX"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Design & Layout Tab */}
            {activeTab === 'design' && (
              <>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Warna Template</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warna Utama</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.primary_color || '#000000'}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="h-10 w-20 border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={formData.primary_color || '#000000'}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="form-input flex-1"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warna Sekunder</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.secondary_color || '#666666'}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="h-10 w-20 border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={formData.secondary_color || '#666666'}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="form-input flex-1"
                          placeholder="#666666"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warna Aksen</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.accent_color || '#3b82f6'}
                          onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                          className="h-10 w-20 border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={formData.accent_color || '#3b82f6'}
                          onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                          className="form-input flex-1"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tipografi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                      <select
                        value={formData.font_family || 'Arial, sans-serif'}
                        onChange={(e) => setFormData({ ...formData, font_family: e.target.value })}
                        className="form-input w-full"
                      >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Helvetica, sans-serif">Helvetica</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran Font Dasar (px)</label>
                      <input
                        type="number"
                        value={formData.font_size_base || 12}
                        onChange={(e) => setFormData({ ...formData, font_size_base: parseInt(e.target.value) || 12 })}
                        className="form-input w-full"
                        min="8"
                        max="20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Layout</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.show_logo}
                          onChange={(e) => setFormData({ ...formData, show_logo: e.target.checked })}
                          className="form-checkbox mr-2"
                        />
                        <span className="text-sm text-gray-700">Tampilkan logo</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.show_company_details}
                          onChange={(e) => setFormData({ ...formData, show_company_details: e.target.checked })}
                          className="form-checkbox mr-2"
                        />
                        <span className="text-sm text-gray-700">Tampilkan detail perusahaan</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.show_watermark}
                          onChange={(e) => setFormData({ ...formData, show_watermark: e.target.checked })}
                          className="form-checkbox mr-2"
                        />
                        <span className="text-sm text-gray-700">Tampilkan watermark</span>
                      </label>
                    </div>

                    {formData.show_logo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Posisi Logo</label>
                        <select
                          value={formData.logo_position || 'left'}
                          onChange={(e) => setFormData({ ...formData, logo_position: e.target.value as any })}
                          className="form-input w-full"
                        >
                          <option value="left">Kiri</option>
                          <option value="center">Tengah</option>
                          <option value="right">Kanan</option>
                        </select>
                      </div>
                    )}

                    {formData.show_watermark && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teks Watermark</label>
                        <input
                          type="text"
                          value={formData.watermark_text || ''}
                          onChange={(e) => setFormData({ ...formData, watermark_text: e.target.value })}
                          className="form-input w-full"
                          placeholder="DRAFT, CONFIDENTIAL, dll."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Footer & Lainnya Tab */}
            {activeTab === 'footer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Footer</label>
                  <textarea
                    value={formData.footer_notes || ''}
                    onChange={(e) => setFormData({ ...formData, footer_notes: e.target.value })}
                    className="form-input w-full"
                    rows={3}
                    placeholder="Terima kasih atas kepercayaan Anda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Syarat & Ketentuan</label>
                  <textarea
                    value={formData.footer_terms || ''}
                    onChange={(e) => setFormData({ ...formData, footer_terms: e.target.value })}
                    className="form-input w-full"
                    rows={3}
                    placeholder="Pembayaran harus diselesaikan dalam waktu 30 hari sejak tanggal terbit."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Informasi Pembayaran</label>
                  <textarea
                    value={formData.footer_payment_info || ''}
                    onChange={(e) => setFormData({ ...formData, footer_payment_info: e.target.value })}
                    className="form-input w-full"
                    rows={3}
                    placeholder="Transfer Bank: BCA - 123-456-7890 a.n. PT Contoh"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rekening Bank</label>
                  <textarea
                    value={formData.footer_bank_account || ''}
                    onChange={(e) => setFormData({ ...formData, footer_bank_account: e.target.value })}
                    className="form-input w-full"
                    rows={2}
                    placeholder="BCA - 123-456-7890 - PT Contoh"
                  />
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Menyimpan...' : (template ? 'Perbarui Template' : 'Simpan Template')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
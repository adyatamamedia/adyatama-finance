'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Setting {
  key: string
  value: string
}

interface StoreSettings {
  store_name?: string
  store_address?: string
  store_phone?: string
  store_email?: string
  store_logo?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<StoreSettings>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()

      // Data is already an object from the API
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // Save each setting individually
      const promises = Object.entries(settings).map(([key, value]) => {
        return fetch('/api/settings', {
          method: 'POST', // API uses POST for upsert
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key, value: value || '' }),
        })
      })

      await Promise.all(promises)

      alert('Pengaturan berhasil disimpan!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (key: keyof StoreSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleExport = () => {
    window.open('/api/transactions/export?format=excel', '_blank')
  }

  const handleImport = () => {
    router.push('/dashboard/transactions')
  }

  const handleBackup = () => {
    alert('Fitur backup database belum tersedia. Silakan hubungi administrator sistem.')
  }

  const handleRestore = () => {
    alert('Fitur restore database belum tersedia. Silakan hubungi administrator sistem.')
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading settings...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pengaturan</h1>
        <p className="text-gray-600">Kelola informasi dan pengaturan toko Anda</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Information */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Informasi Toko</h3>
                <p className="text-sm text-gray-600">Data dasar identitas toko Anda</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Toko *
                  </label>
                  <input
                    type="text"
                    value={settings.store_name || ''}
                    onChange={(e) => handleInputChange('store_name', e.target.value)}
                    className="form-input"
                    placeholder="Nama toko Anda"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="text"
                    value={settings.store_logo || ''}
                    onChange={(e) => handleInputChange('store_logo', e.target.value)}
                    className="form-input"
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">Masukkan URL gambar logo toko Anda</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Toko
                  </label>
                  <textarea
                    value={settings.store_address || ''}
                    onChange={(e) => handleInputChange('store_address', e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Alamat lengkap toko"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telepon
                    </label>
                    <input
                      type="tel"
                      value={settings.store_phone || ''}
                      onChange={(e) => handleInputChange('store_phone', e.target.value)}
                      className="form-input"
                      placeholder="021-12345678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.store_email || ''}
                      onChange={(e) => handleInputChange('store_email', e.target.value)}
                      className="form-input"
                      placeholder="info@tokoanda.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Application Settings */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Pengaturan Aplikasi</h3>
                <p className="text-sm text-gray-600">Konfigurasi aplikasi ADYATAMA Finance</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Notifikasi Email</h4>
                      <p className="text-sm text-gray-500">Terima notifikasi transaksi via email</p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200"
                    >
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Backup Otomatis</h4>
                      <p className="text-sm text-gray-500">Backup data otomatis setiap hari</p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200"
                    >
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Fitur dalam Pengembangan</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Beberapa fitur pengaturan aplikasi masih dalam tahap pengembangan dan akan segera tersedia.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>
        </div>

        <div>
          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Informasi Sistem</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Versi Aplikasi</h4>
                <p className="text-sm text-gray-600">v0.1.0</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Environment</h4>
                <p className="text-sm text-gray-600">Development</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Database</h4>
                <p className="text-sm text-gray-600">MySQL</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Framework</h4>
                <p className="text-sm text-gray-600">Next.js 16</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Aksi Cepat</h3>
            </div>
            <div className="p-6 space-y-3">
              <button
                type="button"
                onClick={handleExport}
                className="w-full btn btn-secondary text-left justify-start"
              >
                📥 Export Data Transaksi
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="w-full btn btn-secondary text-left justify-start"
              >
                📤 Import Data Transaksi
              </button>
              <button
                type="button"
                onClick={handleBackup}
                className="w-full btn btn-secondary text-left justify-start"
              >
                💾 Backup Database
              </button>
              <button
                type="button"
                onClick={handleRestore}
                className="w-full btn btn-secondary text-left justify-start"
              >
                🔄 Restore Database
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
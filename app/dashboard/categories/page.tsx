'use client'

import { useState, useEffect } from 'react'


interface Category {
  id: string
  userId?: string | null
  name: string
  type: 'INCOME' | 'EXPENSE'
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
  } | null
  _count?: {
    transactions: number
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const filteredCategories = (categories || []).filter(cat =>
    filter === 'ALL' || cat.type === filter
  )

  const incomeCategories = (categories || []).filter(cat => cat.type === 'INCOME')
  const expenseCategories = (categories || []).filter(cat => cat.type === 'EXPENSE')

  if (loading) {
    return (
      <>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading categories...</div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>

        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      </>
    )
  }

  return (


    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kategori</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary w-full sm:w-auto"
        >
          {showForm ? 'Tutup Form' : 'Tambah Kategori'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="text-green-600 text-xs sm:text-sm font-medium">Pemasukan</div>
          <div className="text-xl sm:text-2xl font-bold text-green-700">{incomeCategories.length}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="text-red-600 text-xs sm:text-sm font-medium">Pengeluaran</div>
          <div className="text-xl sm:text-2xl font-bold text-red-700">{expenseCategories.length}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="btn-group flex-1">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-l-md ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Semua ({categories.length})
          </button>
          <button
            onClick={() => setFilter('INCOME')}
            className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-t border-b border-r ${
              filter === 'INCOME'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="hidden sm:inline">Pemasukan</span>
            <span className="sm:hidden">In</span> ({incomeCategories.length})
          </button>
          <button
            onClick={() => setFilter('EXPENSE')}
            className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-r-md border-t border-b border-r ${
              filter === 'EXPENSE'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="hidden sm:inline">Pengeluaran</span>
            <span className="sm:hidden">Out</span> ({expenseCategories.length})
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Tambah Kategori Baru</h3>
          <CategoryForm onSuccess={() => {
            setShowForm(false)
            fetchCategories()
          }} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filter === 'ALL' || filter === 'INCOME' ? (
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <h3 className="text-lg font-semibold text-green-800">Kategori Pemasukan</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {incomeCategories.length === 0 ? (
                <div className="px-6 py-4 text-center text-gray-500">
                  Belum ada kategori pemasukan
                </div>
              ) : (
                incomeCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onUpdate={() => fetchCategories()}
                  />
                ))
              )}
            </div>
          </div>
        ) : null}

        {filter === 'ALL' || filter === 'EXPENSE' ? (
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-800">Kategori Pengeluaran</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {expenseCategories.length === 0 ? (
                <div className="px-6 py-4 text-center text-gray-500">
                  Belum ada kategori pengeluaran
                </div>
              ) : (
                expenseCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onUpdate={() => fetchCategories()}
                  />
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CategoryItem({
  category,
  onUpdate
}: {
  category: Category
  onUpdate: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: category.name,
    type: category.type
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update category')
      }

      setIsEditing(false)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }

      onUpdate()
    } catch (err) {
      alert('Gagal menghapus kategori: ' + (err instanceof Error ? err.message : 'An error occurred'))
    }
  }

  if (isEditing) {
    return (
      <div className="px-6 py-4">
        <form onSubmit={handleUpdate} className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          <div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input text-sm"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary text-sm"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
      <div>
        <div className="text-sm font-medium text-gray-900">{category.name}</div>
        <div className="text-xs text-gray-500">
          {category._count?.transactions || 0} transaksi • Dibuat {new Date(category.createdAt).toLocaleDateString('id-ID')}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          category.type === 'INCOME'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {category.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
        </span>
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 transition-colors duration-200 cursor-pointer"
          title="Edit Kategori"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-colors duration-200 cursor-pointer"
          title="Hapus Kategori"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function CategoryForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'INCOME' as 'INCOME' | 'EXPENSE'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create category')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Kategori *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="form-input"
            placeholder="Contoh: Penjualan Produk"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jenis Kategori *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
            className="form-input"
            required
          >
            <option value="INCOME">Pemasukan</option>
            <option value="EXPENSE">Pengeluaran</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onSuccess}
          className="btn btn-secondary"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  )
}
'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  name?: string
  role: 'ADMIN' | 'USER'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data.users || data) // Handle both formats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading users...</div>
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

  const adminCount = (users || []).filter(user => user.role === 'ADMIN').length
  const activeCount = (users || []).filter(user => user.isActive).length

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pengguna</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-600 text-sm font-medium">Total Pengguna</div>
            <div className="text-2xl font-bold text-blue-700">{users.length}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-purple-600 text-sm font-medium">Admin</div>
            <div className="text-2xl font-bold text-purple-700">{adminCount}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-600 text-sm font-medium">Aktif</div>
            <div className="text-2xl font-bold text-green-700">{activeCount}</div>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary mb-4"
        >
          {showForm ? 'Tutup Form' : 'Tambah Pengguna'}
        </button>

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Tambah Pengguna Baru</h3>
            <UserForm onSuccess={() => {
              setShowForm(false)
              fetchUsers()
            }} />
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal Dibuat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Belum ada pengguna
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'ADMIN' ? 'Administrator' : 'Pengguna'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`mr-3 ${user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {user.isActive ? 'Non-aktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Reset Password
                    </button>
                    {user.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UserForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'USER' as 'ADMIN' | 'USER'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          role: formData.role
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      alert('Pengguna berhasil dibuat!')
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
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="form-input"
            placeholder="username"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="form-input"
            placeholder="Nama lengkap"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="form-input"
            placeholder="Minimal 6 karakter"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Konfirmasi Password *
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="form-input"
            placeholder="Ulangi password"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' })}
            className="form-input"
            required
          >
            <option value="USER">Pengguna</option>
            <option value="ADMIN">Administrator</option>
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
          {loading ? 'Menyimpan...' : 'Buat Pengguna'}
        </button>
      </div>
    </form>
  )
}

function handleToggleStatus(user: User) {
  const action = user.isActive ? 'menon-aktifkan' : 'mengaktifkan'
  if (confirm(`Apakah Anda yakin ingin ${action} pengguna "${user.username}"?`)) {
    fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isActive: !user.isActive
      })
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to update user status')
      window.location.reload()
    })
    .catch(error => {
      alert('Gagal mengupdate status pengguna: ' + error.message)
    })
  }
}

function handleResetPassword(user: User) {
  const newPassword = prompt(`Masukkan password baru untuk pengguna "${user.username}":`)
  if (newPassword && newPassword.length >= 6) {
    fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: newPassword
      })
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to reset password')
      alert('Password berhasil direset!')
    })
    .catch(error => {
      alert('Gagal mereset password: ' + error.message)
    })
  } else if (newPassword) {
    alert('Password minimal 6 karakter!')
  }
}

function handleDelete(user: User) {
  if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.username}"?`)) {
    fetch(`/api/users/${user.id}`, {
      method: 'DELETE'
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to delete user')
      window.location.reload()
    })
    .catch(error => {
      alert('Gagal menghapus pengguna: ' + error.message)
    })
  }
}
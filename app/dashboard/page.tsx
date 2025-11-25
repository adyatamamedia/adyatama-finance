'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'

interface DashboardStats {
  totalIncome: number
  totalExpense: number
  netAmount: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
}

interface RecentTransaction {
  id: string
  type: string
  description: string
  amount: number
  transactionDate: string
  category: {
    name: string
  }
}

interface RecentInvoice {
  id: string
  invoiceNo: string
  customer: {
    name: string
  }
  total: number
  status: string
  createdAt: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'month' | 'year' | 'day'>('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [displayPeriod, setDisplayPeriod] = useState('Semua Waktu')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (
    type: 'all' | 'month' | 'year' | 'day' = 'all',
    dateStr = '',
    month = 0,
    year = 0
  ) => {
    try {
      setLoading(true)
      let queryParams = ''
      let periodText = 'Semua Waktu'

      if (type === 'day') {
        const d = new Date(dateStr)
        const dDay = d.getDate()
        const dMonth = d.getMonth() + 1
        const dYear = d.getFullYear()
        queryParams = `?day=${dDay}&month=${dMonth}&year=${dYear}`
        periodText = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      } else if (type === 'month') {
        queryParams = `?month=${month}&year=${year}`
        periodText = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      } else if (type === 'year') {
        queryParams = `?year=${year}`
        periodText = `Tahun ${year}`
      }

      setDisplayPeriod(periodText)

      const [summaryRes, transactionsRes, invoicesRes] = await Promise.all([
        fetch(`/api/transactions${queryParams}`, { cache: 'no-store' }),
        fetch('/api/transactions?limit=5', { cache: 'no-store' }),
        fetch(`/api/invoices${queryParams}${queryParams ? '&' : '?'}limit=5&summary=true`, { cache: 'no-store' })
      ])

      const summaryData = await summaryRes.json()
      const transactionsData = await transactionsRes.json()
      const invoicesData = await invoicesRes.json()

      setStats({
        totalIncome: Number(summaryData.summary?.totalIncome || 0),
        totalExpense: Number(summaryData.summary?.totalExpense || 0),
        netAmount: Number(summaryData.summary?.net || 0),
        totalInvoices: invoicesData.summary?.total || 0,
        paidInvoices: invoicesData.summary?.paid || 0,
        pendingInvoices: invoicesData.summary?.pending || 0,
      })

      setRecentTransactions(transactionsData.transactions || [])
      setRecentInvoices(invoicesData.invoices || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { text: string; className: string } } = {
      DRAFT: { text: 'Draft', className: 'badge-secondary' },
      ISSUED: { text: 'Issued', className: 'badge-primary' },
      PARTIAL: { text: 'Partial', className: 'badge-warning' },
      PAID: { text: 'Paid', className: 'badge-success' },
      CANCELLED: { text: 'Cancelled', className: 'badge-danger' },
    }

    const config = statusConfig[status] || { text: status, className: 'badge-secondary' }
    return <span className={`badge ${config.className}`}>{config.text}</span>
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="spinner-border w-8 h-8 mx-auto"></div>
        <p className="mt-2 text-gray-500">Memuat data dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-sm text-gray-500">Ringkasan keuangan dan aktivitas terbaru</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">
              Periode: <span className="font-medium text-gray-900">{displayPeriod}</span>
            </p>
          </div>
          <button
            onClick={() => setShowFilterModal(true)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Filter Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Filter Dashboard</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-gray-500">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tampilkan Berdasarkan</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">Semua Waktu</option>
                  <option value="day">Harian</option>
                  <option value="month">Bulanan</option>
                  <option value="year">Tahunan</option>
                </select>
              </div>

              {filterType === 'day' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Tanggal</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              {filterType === 'month' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>
                          {new Date(2000, m - 1).toLocaleDateString('id-ID', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                    <input
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {filterType === 'year' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    fetchDashboardData(filterType, selectedDate, selectedMonth, selectedYear)
                    setShowFilterModal(false)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-gray-500 mb-1">Total Pemasukan</p>
              <h4 className="text-green-600 text-xl font-semibold mb-0">
                {stats ? formatCurrency(stats.totalIncome) : 'Rp 0'}
              </h4>
            </div>
            <div className="text-green-600 text-2xl">
              📈
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-gray-500 mb-1">Total Pengeluaran</p>
              <h4 className="text-red-600 text-xl font-semibold mb-0">
                {stats ? formatCurrency(stats.totalExpense) : 'Rp 0'}
              </h4>
            </div>
            <div className="text-red-600 text-2xl">
              📉
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-gray-500 mb-1">Netto</p>
              <h4 className={`text-xl font-semibold mb-0 ${stats && stats.netAmount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {stats ? formatCurrency(stats.netAmount) : 'Rp 0'}
              </h4>
            </div>
            <div className={`text-2xl ${stats && stats.netAmount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              💰
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-gray-500 mb-1">Total Invoice</p>
              <h4 className="text-blue-600 text-xl font-semibold mb-0">
                {stats ? stats.totalInvoices : 0}
              </h4>
              <p className="text-gray-500 text-sm">
                {stats ? stats.paidInvoices + ' lunas' : ''}
              </p>
            </div>
            <div className="text-blue-600 text-2xl">
              🧾
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Transaksi Terbaru</h3>
            </div>
            <div className="card-body">
              {recentTransactions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Deskripsi</th>
                        <th>Kategori</th>
                        <th className="text-end">Jumlah</th>
                        <th>Tipe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="text-sm">
                            {new Date(transaction.transactionDate).toLocaleDateString('id-ID')}
                          </td>
                          <td>{transaction.description || '-'}</td>
                          <td>{transaction.category?.name || '-'}</td>
                          <td className={`text-end text-sm font-medium ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </td>
                          <td>
                            <span className={`badge ${transaction.type === 'INCOME' ? 'badge-success' : 'badge-danger'}`}>
                              {transaction.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500">Belum ada transaksi</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Invoice Terbaru</h3>
            </div>
            <div className="card-body">
              {recentInvoices.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>No. Invoice</th>
                        <th>Pelanggan</th>
                        <th className="text-end">Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="text-sm">
                            {invoice.invoiceNo}
                          </td>
                          <td className="text-sm">
                            {invoice.customer?.name || '-'}
                          </td>
                          <td className="text-end text-sm font-medium">
                            {formatCurrency(invoice.total)}
                          </td>
                          <td>
                            {getStatusBadge(invoice.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500">Belum ada invoice</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
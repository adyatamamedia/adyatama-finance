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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      const [summaryRes, transactionsRes, invoicesRes] = await Promise.all([
        fetch(`/api/transactions?month=${currentMonth}&year=${currentYear}`),
        fetch('/api/transactions?limit=5'),
        fetch('/api/invoices?limit=5')
      ])

      const summaryData = await summaryRes.json()
      const transactionsData = await transactionsRes.json()
      const invoicesData = await invoicesRes.json()

      setStats({
        totalIncome: Number(summaryData.summary?.totalIncome || 0),
        totalExpense: Number(summaryData.summary?.totalExpense || 0),
        netAmount: Number(summaryData.summary?.net || 0),
        totalInvoices: invoicesData.invoices?.length || 0,
        paidInvoices: invoicesData.invoices?.filter((inv: any) => inv.status === 'PAID').length || 0,
        pendingInvoices: invoicesData.invoices?.filter((inv: any) => inv.status !== 'PAID').length || 0,
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
    <div className="px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-sm text-gray-500">Ringkasan keuangan dan aktivitas terbaru</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-gray-500">
            Periode: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
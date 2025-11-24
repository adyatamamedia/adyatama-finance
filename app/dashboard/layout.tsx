'use client'

import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [sidebarShow, setSidebarShow] = useState(false)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
    } else {
      setUser(JSON.parse(userData))
    }
  }, [router])

  // Open invoice dropdown if current path is under invoices
  useEffect(() => {
    if (pathname.startsWith('/dashboard/invoices')) {
      setIsInvoiceOpen(true)
    }
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const toggleSidebar = () => {
    setSidebarShow(!sidebarShow)
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  if (!user) {
    return null
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-900 text-gray-300">
      <div className="p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Menu Utama
        </div>
        <nav className="space-y-1">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
              isActive('/dashboard') 
                ? 'bg-indigo-600 text-white' 
                : 'hover:bg-gray-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </Link>

          {/* Transaksi */}
          <Link
            href="/dashboard/transactions"
            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
              isActive('/dashboard/transactions') 
                ? 'bg-indigo-600 text-white' 
                : 'hover:bg-gray-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Transaksi
          </Link>

          {/* Invoice Dropdown */}
          <div>
            <button
              onClick={() => setIsInvoiceOpen(!isInvoiceOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                pathname.startsWith('/dashboard/invoices') || pathname.startsWith('/dashboard/customers')
                  ? 'text-white bg-gray-800' 
                  : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice
              </div>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isInvoiceOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isInvoiceOpen && (
              <div className="mt-1 pl-11 space-y-1">
                <Link
                  href="/dashboard/invoices"
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive('/dashboard/invoices') 
                      ? 'text-indigo-400 font-medium' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Daftar Invoice
                </Link>
                <Link
                  href="/dashboard/invoices/create"
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive('/dashboard/invoices/create') 
                      ? 'text-indigo-400 font-medium' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Buat Invoice
                </Link>
                <Link
                  href="/dashboard/customers"
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive('/dashboard/customers') 
                      ? 'text-indigo-400 font-medium' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Pelanggan
                </Link>
              </div>
            )}
          </div>

          {/* Admin Menu */}
          {user.role === 'ADMIN' && (
            <>
              <div className="pt-4 pb-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin
                </div>
              </div>

              <Link
                href="/dashboard/categories"
                className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                  isActive('/dashboard/categories') 
                    ? 'bg-indigo-600 text-white' 
                    : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Kategori
              </Link>

              <Link
                href="/dashboard/users"
                className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                  isActive('/dashboard/users') 
                    ? 'bg-indigo-600 text-white' 
                    : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Pengguna
              </Link>

              <Link
                href="/dashboard/settings"
                className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                  isActive('/dashboard/settings') 
                    ? 'bg-indigo-600 text-white' 
                    : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Pengaturan
              </Link>
            </>
          )}
        </nav>
      </div>
      
      {/* Footer Sidebar */}
      <div className="mt-auto p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          &copy; 2025 Adyatama Finance
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        toggleSidebar={toggleSidebar} 
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-[60] md:hidden ${sidebarShow ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${sidebarShow ? 'opacity-50' : 'opacity-0'}`}
          onClick={() => setSidebarShow(false)}
        ></div>
        
        {/* Sidebar Panel */}
        <aside 
          className={`absolute inset-y-0 left-0 w-64 bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarShow ? 'translate-x-0' : '-translate-x-full'}`}
        >
           <SidebarContent />
        </aside>
      </div>
    </div>
  )
}
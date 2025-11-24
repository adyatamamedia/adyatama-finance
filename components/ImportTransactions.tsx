'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import * as Papa from 'papaparse'

/**
 * ImportTransactions.tsx
 * - Menampilkan preview 5 baris pertama
 * - Jika ditemukan kategori yang tidak ada, tampilkan sebagai "Unknown" dan minta konfirmasi:
 *    [Buat kategori & import] / [Lewati pembuatan & import tetap] / [Batal]
 *
 * NOTE:
 * - Endpoint createCategoryAPI diasumsikan POST /api/categories { name, type } -> { id, name, type }
 * - Sesuaikan bila backend berbeda (auth header, path, payload)
 */

interface ImportTransaction {
  type: 'INCOME' | 'EXPENSE'
  description: string
  amount: number
  transactionDate: string
  categoryId?: number | null
}

interface Category {
  id: number
  name: string
  type: string // 'INCOME'|'EXPENSE' atau lokal 'Pemasukan'/'Pengeluaran'
}

interface ImportTransactionsProps {
  onSuccess: () => void
  categories: Category[]
}

type DraftTransaction = {
  type: 'INCOME' | 'EXPENSE'
  description: string
  amount: number
  transactionDate: string
  rawKategori?: string
  categoryId?: number | null
}

export default function ImportTransactions({ onSuccess, categories }: ImportTransactionsProps) {
  const [importType, setImportType] = useState<'excel' | 'csv'>('excel')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewData, setPreviewData] = useState<ImportTransaction[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileSelected, setFileSelected] = useState(false)

  // Drafts sementara (disiapkan setelah parsing, sebelum finalize)
  const [pendingDrafts, setPendingDrafts] = useState<DraftTransaction[] | null>(null)

  // Daftar kategori yang hilang (unique)
  const [missingCategories, setMissingCategories] = useState<{ name: string; type: string }[]>([])

  // Menandakan user sudah konfirmasi create categories (dipakai internal)
  const [creatingCategories, setCreatingCategories] = useState(false)

  // Local lookup map (lowercase name -> id)
  const categoryNameToId = new Map<string, number>()
  categories.forEach(cat => {
    categoryNameToId.set(cat.name.toString().trim().toLowerCase(), cat.id)
  })

  // ================= HELPERS =================

  const parseAmount = (raw: any): number => {
    if (raw == null || raw === '') return 0
    let s = String(raw).trim()
    const parenthesis = /^\((.*)\)$/.exec(s)
    if (parenthesis) s = '-' + parenthesis[1]
    s = s.replace(/[^\d\.-]/g, '')
    if (!s || s === '.' || s === '-') return 0
    const n = parseFloat(s)
    return isNaN(n) ? 0 : n
  }

  const parseDateToISO = (rawDate: any): string | null => {
    if (rawDate == null || rawDate === '') return null
    if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      return rawDate.toISOString().split('T')[0]
    }
    const s = String(rawDate).trim()
    if (!isNaN(Number(s)) && Number(s) > 30) {
      const serial = Number(s)
      const excelEpoch = new Date(Date.UTC(1899, 11, 30))
      const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000)
      return date.toISOString().split('T')[0]
    }
    const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s)
    if (mdy) {
      let [, mm, dd, yy] = mdy
      if (yy.length === 2) yy = '20' + yy
      return `${yy.padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
    }
    const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
    if (dmy) {
      const [, dd, mm, yyyy] = dmy
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
    }
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
    if (ymd) {
      const [, yyyy, mm, dd] = ymd
      return `${yyyy}-${mm}-${dd}`
    }
    const dt = new Date(s)
    if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0]
    return null
  }

  const mapType = (jenisRaw: string | undefined, amountSigned: number) => {
    const s = (jenisRaw || '').toString().toLowerCase()
    if (s.includes('pemasukan') || s.includes('income')) return 'INCOME'
    if (s.includes('pengeluaran') || s.includes('expense')) return 'EXPENSE'
    return amountSigned < 0 ? 'EXPENSE' : 'INCOME'
  }

  const findCategoryIdLocal = (categoryName: string | undefined): number | null => {
    if (!categoryName) return null
    const key = categoryName.toString().trim().toLowerCase()
    if (categoryNameToId.has(key)) return categoryNameToId.get(key) || null
    // partial match
    for (const [k, id] of categoryNameToId.entries()) {
      if (k.includes(key) || key.includes(k)) return id
    }
    return null
  }

  // API create category (sesuaikan jika backend beda)
  const createCategoryAPI = async (name: string, type: string) => {
    try {
      const payload = { name: name.trim(), type: (type || 'INCOME').toString().toUpperCase() }
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const txt = await res.text()
        console.warn('createCategoryAPI failed:', txt)
        return null
      }
      const data = await res.json()
      return data // expect { id, name, type }
    } catch (err) {
      console.error('createCategoryAPI error', err)
      return null
    }
  }

  const createMissingCategoriesAPI = async (missing: { name: string; type: string }[]) => {
    if (!missing || missing.length === 0) return new Map<string, number>()
    // dedupe
    const uniq = new Map<string, { name: string; type: string }>()
    missing.forEach(m => {
      const key = m.name.toString().trim().toLowerCase()
      if (!uniq.has(key)) uniq.set(key, m)
    })
    const promises = Array.from(uniq.values()).map(async m => {
      const created = await createCategoryAPI(m.name, m.type)
      if (created && created.id) {
        const key = created.name.toString().trim().toLowerCase()
        categoryNameToId.set(key, created.id)
        return { key, id: created.id }
      }
      return null
    })
    const results = await Promise.all(promises)
    const map = new Map<string, number>()
    results.forEach(r => { if (r) map.set(r.key, r.id) })
    return map
  }

  // ================= END HELPERS =================

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
    setFileSelected(true)
    setError('')
    setShowPreview(false)
    setPreviewData([])
    setPendingDrafts(null)
    setMissingCategories([])
    setSuccess('')
  }

  const processFullImport = async (transactions: ImportTransaction[]) => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      console.log('Starting batch import of', transactions.length, 'transactions')

      const response = await fetch('/api/transactions/import/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      })

      const data = await response.json()
      console.log('Batch import response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Gagal import transaksi')
      }

      if (data.errors && data.errors.length > 0) {
        console.warn('Beberapa transaksi gagal:', data.errors)
        setError(`${data.count} transaksi berhasil, ${data.errors.length} gagal. Cek console untuk detail.`)
      } else {
        setSuccess(`Berhasil import ${data.count} transaksi!`)
      }

      setUploadedFile(null)
      setFileSelected(false)
      setShowPreview(false)
      setPreviewData([])
      setPendingDrafts(null)
      setMissingCategories([])
      onSuccess()
    } catch (err) {
      console.error('Import error:', err)
      setError(err instanceof Error ? err.message : 'Kesalahan saat import')
    } finally {
      setLoading(false)
    }
  }

  // finalize drafts into transactions, optionally create missing categories first (if createMissing = true)
  const finalizeAndImportWithCreateOption = async (drafts: DraftTransaction[], createMissing: boolean) => {
    setLoading(true)
    try {
      if (createMissing && missingCategories.length > 0) {
        setCreatingCategories(true)
        // create
        await createMissingCategoriesAPI(missingCategories)
        setCreatingCategories(false)
      }

      // finalize categoryId using updated local lookup
      const finalTransactions: ImportTransaction[] = drafts.map(d => {
        let categoryId: number | null = null
        if (d.rawKategori) {
          categoryId = findCategoryIdLocal(d.rawKategori)
        }
        return {
          type: d.type,
          description: d.description,
          amount: d.amount,
          transactionDate: d.transactionDate,
          categoryId
        }
      })

      setPreviewData(finalTransactions.slice(0, 5))
      setShowPreview(true)
      // call import
      await processFullImport(finalTransactions)
    } catch (err) {
      console.error('finalize/import error', err)
      setError(err instanceof Error ? err.message : 'Kesalahan saat menyiapkan import')
      setLoading(false)
      setCreatingCategories(false)
    }
  }

  const handleImport = () => {
    if (!uploadedFile || !fileSelected) {
      setError('Silakan pilih file terlebih dahulu')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setPreviewData([])
    setShowPreview(false)
    setPendingDrafts(null)
    setMissingCategories([])

    const onParsingDone = (drafts: DraftTransaction[]) => {
      // detect missing categories from drafts
      const missingMap = new Map<string, string>() // nameLower -> originalName
      drafts.forEach(d => {
        const raw = d.rawKategori ?? ''
        if (raw && raw !== '-') {
          const key = raw.toString().trim().toLowerCase()
          if (!categoryNameToId.has(key)) {
            missingMap.set(key, raw.toString().trim())
          }
        }
      })

      const missingArr: { name: string; type: string }[] = Array.from(missingMap.values()).map(n => ({ name: n, type: 'INCOME' })) // type placeholder; we'll derive per-draft if needed
      // set per-draft type for missing categories more accurately
      // build map name->type using drafts (if multiple, prefer INCOME/EXPENSE derived)
      const nameToType = new Map<string, string>()
      drafts.forEach(d => {
        if (d.rawKategori) {
          const key = d.rawKategori.toString().trim().toLowerCase()
          if (missingMap.has(key)) {
            // if any draft with this category has type EXPENSE, mark as EXPENSE; otherwise INCOME
            const prev = nameToType.get(key)
            if (!prev) nameToType.set(key, d.type)
            else if (prev !== 'EXPENSE' && d.type === 'EXPENSE') nameToType.set(key, 'EXPENSE')
          }
        }
      })
      // apply types
      const missingArrTyped = Array.from(missingMap.entries()).map(([key, orig]) => ({ name: orig, type: nameToType.get(key) ?? 'INCOME' }))

      setPendingDrafts(drafts)
      setMissingCategories(missingArrTyped)

      // If no missing categories -> finalize import directly
      if (missingArrTyped.length === 0) {
        // directly finalize and import without creating categories
        finalizeAndImportWithCreateOption(drafts, false)
      } else {
        // Show UI for confirmation: user must choose action (create / skip / cancel)
        setLoading(false)
        setShowPreview(true)
        // Also show a preview with unknown categories marked (we'll build preview now)
        const preview: ImportTransaction[] = drafts.slice(0, 5).map(d => ({
          type: d.type,
          description: d.description,
          amount: d.amount,
          transactionDate: d.transactionDate,
          categoryId: findCategoryIdLocal(d.rawKategori) ?? null
        }))
        setPreviewData(preview)
        // Now wait for user interaction (confirm create, skip, or cancel)
      }
    }

    // parse file depending on type
    if (importType === 'excel') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'array' })
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            setError('Tidak ditemukan sheet pada file Excel')
            setLoading(false)
            return
          }
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          let jsonData
          try {
            jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '', dateNF: 'yyyy-mm-dd' })
          } catch (parseError) {
            console.error('Excel parsing error:', parseError)
            setError('Gagal parsing Excel. Periksa format file.')
            setLoading(false)
            return
          }
          if (!jsonData || jsonData.length === 0) {
            setError('Tidak ada data di file Excel.')
            setLoading(false)
            return
          }

          const drafts: DraftTransaction[] = jsonData.map((row: any, index: number) => {
            const cleanRow = Object.keys(row).reduce((acc, key) => {
              acc[key.toString().toLowerCase()] = row[key] != null ? row[key].toString().trim() : ''
              return acc
            }, {} as Record<string, string>)

            const rawTanggal = cleanRow['tanggal'] ?? cleanRow['date'] ?? cleanRow['tgl'] ?? ''
            const rawDeskripsi = cleanRow['deskripsi'] ?? cleanRow['description'] ?? cleanRow['keterangan'] ?? ''
            const rawKategori = cleanRow['kategori'] ?? cleanRow['category'] ?? ''
            const rawJenis = cleanRow['jenis'] ?? cleanRow['type'] ?? ''
            const rawJumlah = cleanRow['jumlah'] ?? cleanRow['amount'] ?? cleanRow['nominal'] ?? ''

            const amountSigned = parseAmount(rawJumlah)
            const amount = Math.abs(amountSigned)
            const transactionDate = parseDateToISO(rawTanggal) ?? new Date().toISOString().split('T')[0]
            const type = mapType(rawJenis, amountSigned)

            const draft: DraftTransaction = {
              type,
              description: rawDeskripsi && rawDeskripsi !== '-' ? rawDeskripsi : `Import ${index + 1}`,
              amount,
              transactionDate,
              rawKategori: rawKategori && rawKategori !== '-' ? rawKategori : undefined,
            }
            return draft
          })

          onParsingDone(drafts)
        } catch (err) {
          console.error('Excel processing error:', err)
          setError('Excel processing error')
          setLoading(false)
        }
      }
      reader.readAsArrayBuffer(uploadedFile)
    } else {
      // CSV
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string
          if (!data || data.trim().length === 0) {
            setError('File CSV kosong')
            setLoading(false)
            return
          }
          Papa.parse(data, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (!results.data || results.data.length === 0) {
                setError('Tidak ada data di CSV.')
                setLoading(false)
                return
              }
              const drafts: DraftTransaction[] = results.data.map((row: any, index: number) => {
                const cleanRow = Object.keys(row).reduce((acc, key) => {
                  acc[key.toString().toLowerCase()] = row[key] != null ? row[key].toString().trim() : ''
                  return acc
                }, {} as Record<string, string>)

                const rawTanggal = cleanRow['tanggal'] ?? cleanRow['date'] ?? ''
                const rawDeskripsi = cleanRow['deskripsi'] ?? cleanRow['description'] ?? ''
                const rawKategori = cleanRow['kategori'] ?? cleanRow['category'] ?? ''
                const rawJenis = cleanRow['jenis'] ?? cleanRow['type'] ?? ''
                const rawJumlah = cleanRow['jumlah'] ?? cleanRow['amount'] ?? cleanRow['nominal'] ?? ''

                const amountSigned = parseAmount(rawJumlah)
                const amount = Math.abs(amountSigned)
                const transactionDate = parseDateToISO(rawTanggal) ?? new Date().toISOString().split('T')[0]
                const type = mapType(rawJenis, amountSigned)

                const draft: DraftTransaction = {
                  type,
                  description: rawDeskripsi && rawDeskripsi !== '-' ? rawDeskripsi : `Import ${index + 1}`,
                  amount,
                  transactionDate,
                  rawKategori: rawKategori && rawKategori !== '-' ? rawKategori : undefined,
                }
                return draft
              })

              onParsingDone(drafts)
            },
            error: (err: unknown) => {
              console.error('CSV parsing error', err)
              setError('CSV parsing error')
              setLoading(false)
            }
          })
        } catch (err) {
          console.error('CSV processing error', err)
          setError('CSV processing error')
          setLoading(false)
        }
      }
      reader.readAsText(uploadedFile)
    }
  }

  // UI handlers for missing category confirmation
  const handleCreateAndImport = async () => {
    if (!pendingDrafts) return
    setLoading(true)
    try {
      await finalizeAndImportWithCreateOption(pendingDrafts, true)
    } catch (err) {
      console.error(err)
      setError('Gagal membuat kategori / mengimpor')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipCreateAndImport = async () => {
    if (!pendingDrafts) return
    setLoading(true)
    try {
      await finalizeAndImportWithCreateOption(pendingDrafts, false)
    } catch (err) {
      console.error(err)
      setError('Gagal mengimpor (skip create)')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelImport = () => {
    setPendingDrafts(null)
    setMissingCategories([])
    setShowPreview(false)
    setLoading(false)
    setError('')
    setSuccess('')
  }

  // ============ RENDER ============

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Import Transaksi</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Jenis Import</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input type="radio" value="excel" checked={importType === 'excel'} onChange={(e) => setImportType(e.target.value as 'excel')} className="mr-2" />
              Excel (.xlsx, .xls)
            </label>
            <label className="flex items-center">
              <input type="radio" value="csv" checked={importType === 'csv'} onChange={(e) => setImportType(e.target.value as 'csv')} className="mr-2" />
              CSV (.csv)
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload File {importType === 'excel' ? 'Excel' : 'CSV'}</label>
          <input type="file"
            accept={importType === 'excel' ? '.xlsx,.xls' : '.csv'}
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div className="mb-4">
          <button onClick={handleImport} disabled={!fileSelected || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Processing...' : 'Parse & Prepare Import'}
          </button>
        </div>

        {error && (<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"><div className="text-red-800 text-sm">{error}</div></div>)}
        {success && (<div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md"><div className="text-green-800 text-sm">{success}</div></div>)}

        {/* If missing categories detected: show confirmation panel */}
        {missingCategories.length > 0 && pendingDrafts && (
          <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
            <h4 className="font-semibold mb-2">Kategori Tidak Ditemukan</h4>
            <p className="text-sm mb-2">File mengandung kategori yang belum ada di sistem. Pilih tindakan:</p>

            <div className="mb-3">
              <ul className="list-disc pl-6 text-sm">
                {missingCategories.map((m, idx) => (
                  <li key={idx}><strong>{m.name}</strong> — dideteksi sebagai <em>{m.type}</em></li>
                ))}
              </ul>
            </div>

            <div className="flex space-x-2">
              <button onClick={handleCreateAndImport} disabled={creatingCategories || loading}
                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50">
                {creatingCategories ? 'Membuat kategori...' : 'Buat kategori & Import'}
              </button>

              <button onClick={handleSkipCreateAndImport} disabled={loading}
                className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                Lewati pembuatan & Import tetap
              </button>

              <button onClick={handleCancelImport} disabled={loading}
                className="bg-gray-200 text-gray-800 px-3 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50">
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {showPreview && previewData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-2">Preview (5 transaksi pertama):</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((transaction, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.transactionDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.amount.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {/* show category name if found, otherwise "Unknown" */}
                        {transaction.categoryId ? categories.find(c => c.id === transaction.categoryId)?.name : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

```markdown
# 🧭 PROJECT PLAN: ADYATAMA FINANCE APP
> Sistem Pencatatan Keuangan & Invoice Toko **ADYATAMA**
> Tech Stack: Next.js (App Router) + MySQL + Prisma + Bootstrap 5 / TailwindCSS + ExcelJS + Puppeteer

---

## 🏁 TUJUAN
Membangun aplikasi web internal untuk toko ADYATAMA yang berfungsi mencatat:
- **Pemasukan dan Pengeluaran (Cashflow)**
- **Pembuatan Invoice (Tagihan Pelanggan)**
- **Pencatatan Pembayaran Invoice**
- **Import & Export data ke Excel**
- **Export laporan ke PDF**

Aplikasi harus ringan, mobile-friendly, dan mudah digunakan staf toko tanpa background IT.

---

## ⚙️ TEKNOLOGI
| Layer | Teknologi |
|--------|------------|
| Frontend | Next.js (App Router) + TailwindCSS / Bootstrap 5 |
| Backend | API Routes Next.js + Prisma ORM |
| Database | MySQL (InnoDB, utf8mb4) |
| Authentication | NextAuth (Credentials) |
| File Handling | ExcelJS, Formidable, Puppeteer |
| Deployment | Vercel / Railway + MySQL Cloud |

---

## 🧱 STRUKTUR DATABASE (MySQL)

### Tabel Utama
| Tabel | Fungsi |
|--------|---------|
| `users` | Data pengguna sistem (admin, kasir) |
| `categories` | Kategori pemasukan/pengeluaran |
| `transactions` | Catatan kas masuk & keluar |
| `customers` | Data pelanggan untuk invoice |
| `invoices` | Header invoice |
| `invoice_items` | Detail barang/jasa di invoice |
| `invoice_payments` | Riwayat pembayaran invoice |
| `settings` | Konfigurasi toko (nama, alamat, logo) |

### Relasi Kunci
```

users ─┬──< categories
├──< transactions >── invoices >──< invoice_items
│                          │
│                          ├──< invoice_payments
│                          └──< customers
└──< settings

```

---

## 💰 FLOW BISNIS

### 1. Transaksi Manual
1. User menambah catatan **pemasukan** atau **pengeluaran**
2. Data tersimpan di tabel `transactions`
3. Dapat difilter per tanggal, bulan, kategori, dan diekspor Excel/PDF

### 2. Invoice (Penjualan)
1. User membuat **invoice draft** (isi customer, item, harga)
2. User menekan **Issue Invoice** → sistem generate `invoice_no` (`ADY-2025-0001`)
3. Invoice bisa di-export ke **PDF** dan dikirim ke pelanggan

### 3. Pembayaran
1. Saat pembayaran diterima:
   - Tambah record di `invoice_payments`
   - Buat otomatis **transactions (income)** dengan `invoice_id`
   - Update status invoice (`partial` / `paid`)

### 4. Import / Export
- Import file Excel berisi transaksi (preview → commit)
- Export laporan bulanan/tahunan ke Excel & PDF
- Export invoice PDF (template branding ADYATAMA)

---

## 🧩 FITUR MVP

| Modul | Fitur |
|--------|-------|
| Dashboard | Ringkasan total pemasukan, pengeluaran, net |
| Categories | CRUD kategori income/expense |
| Transactions | CRUD transaksi, filter, export/import Excel/PDF |
| Customers | CRUD pelanggan |
| Invoices | Create, Issue, Record Payment, Export PDF |
| Settings | Ganti nama toko, alamat, logo |
| Auth | Login user & role admin/user |

---

## 🗂️ STRUKTUR FOLDER (Next.js)

```

/app
├─ /api
│   ├─ /categories
│   ├─ /customers
│   ├─ /transactions
│   ├─ /invoices
│   └─ /settings
├─ /dashboard
├─ /transactions
│   ├─ /import
│   └─ /[id]
├─ /invoices
│   └─ /[id]
└─ /settings
/prisma
├─ schema.prisma
└─ seed.ts
/public
├─ logo.png
└─ templates/

```

---

## 🔐 AUTENTIKASI
- Gunakan **NextAuth Credentials Provider**
- `users` memiliki field: username, password hash, role
- Session menyimpan `id`, `name`, `role`
- Protect halaman via middleware: admin-only (kategori, settings), user-level (transaksi, invoice)

---

## 🧾 API ENDPOINTS

### Transactions
| Method | Endpoint | Fungsi |
|---------|-----------|--------|
| GET | `/api/transactions` | Daftar transaksi (filter: type, month, year) |
| POST | `/api/transactions` | Tambah transaksi baru |
| PUT | `/api/transactions/[id]` | Edit transaksi |
| DELETE | `/api/transactions/[id]` | Hapus transaksi |
| POST | `/api/transactions/import` | Import Excel (preview/commit) |
| GET | `/api/transactions/export` | Export Excel/PDF |

### Invoices
| Method | Endpoint | Fungsi |
|---------|-----------|--------|
| GET | `/api/invoices` | Daftar invoice |
| POST | `/api/invoices` | Buat invoice draft |
| POST | `/api/invoices/[id]/issue` | Issue invoice |
| POST | `/api/invoices/[id]/payments` | Tambah pembayaran |
| GET | `/api/invoices/[id]/pdf` | Export PDF invoice |

### Customers
| Method | Endpoint | Fungsi |
|---------|-----------|--------|
| GET | `/api/customers` | Daftar pelanggan |
| POST | `/api/customers` | Tambah pelanggan baru |

### Categories
| Method | Endpoint | Fungsi |
|---------|-----------|--------|
| GET | `/api/categories` | Daftar kategori |
| POST | `/api/categories` | Tambah kategori |

---

## 📦 FITUR IMPORT & EXPORT

### Import Excel
- Template kolom:  
  `type, transaction_date, category, description, amount, reference`
- Mode: `preview` (validasi) / `commit` (insert DB)
- Opsi: `autoCreateCategory`, `skipErrors`

### Export Excel
- Format sheet `summary` dan `transactions`
- Header: “ADYATAMA - Laporan Transaksi”
- Filter per bulan/tahun, jenis transaksi

### Export PDF
- Menggunakan Puppeteer → HTML template laporan
- Format:
  - Header: logo ADYATAMA, periode laporan
  - Ringkasan total (income, expense, net)
  - Tabel transaksi / invoice
  - Footer: tanggal cetak & halaman

---

## 🧮 PERHITUNGAN OTOMATIS

### Invoice
```

subtotal = Σ(item.quantity * item.unit_price)
total = subtotal - discount + tax

```

### Payment Integration
```

paid_total = Σ(invoice_payments.amount)
status:
if paid_total >= total → "paid"
if paid_total > 0 < total → "partial"

```

### Transaction Derived Fields
```

month = MONTH(transaction_date)
year  = YEAR(transaction_date)

```

---

## 🧠 BUSINESS RULES
- Tidak bisa ubah invoice setelah status = `paid`
- Penghapusan customer tidak menghapus invoice
- Semua uang gunakan DECIMAL(15,2)
- Semua foreign key: `ON DELETE SET NULL`
- Nama toko & branding diambil dari `settings.store_name`

---

## 🧾 PDF TEMPLATE HEADER (contoh)
```

ADYATAMA
Laporan Transaksi Bulan November 2025
Dibuat: {{current_date}}

```

---

## 🚀 SPRINT PLAN

### Sprint 0 — Setup
- [ ] Setup Next.js, Prisma, DB, env, seed

### Sprint 1 — API Core
- [ ] CRUD Categories, Customers, Transactions
- [ ] CRUD Invoices + Items + Payments
- [ ] Validation + Computation logic

### Sprint 2 — Frontend UI
- [ ] Dashboard, Transactions list/form/import
- [ ] Invoices list/form/payment modal
- [ ] Customers & Categories CRUD

### Sprint 3 — Import/Export
- [ ] Import Excel preview/commit
- [ ] Export Excel + PDF

### Sprint 4 — Auth & Roles
- [ ] Login page
- [ ] Role-based access

### Sprint 5 — Deployment
- [ ] Dockerfile + CI/CD
- [ ] Deploy ke Vercel/Railway

---

## ✅ DELIVERABLE FINAL
- `prisma/schema.prisma`
- Next.js app (App Router) dengan API & UI lengkap
- Template Excel & PDF
- Seed data (admin, kategori, pelanggan contoh)
- Dokumentasi README + sample `.env`

---

## 💡 CATATAN TAMBAHAN
- Semua export menyertakan branding **ADYATAMA**
- Backup otomatis (mysqldump) bisa dijalankan via cron job
- Sistem harus siap untuk scale → multi-user (role admin/user)
- Dashboard harus menampilkan:
  - Total pemasukan bulan ini
  - Total pengeluaran bulan ini
  - Net profit
  - 5 transaksi terakhir
  - 5 invoice terbaru

---

## 🧱 NEXT TASK (Untuk AI Agent)
1. **Generate Prisma schema & seed file** sesuai struktur DB di atas  
2. **Generate Next.js API Routes** sesuai daftar endpoint  
3. **Generate Frontend Pages (App Router)** sesuai rencana sprint  
4. **Generate Import/Export modules (Excel & PDF)**  
5. **Integrate Auth (NextAuth)**  
6. **Build + Test + Deploy**

---

## ✍️ AUTHOR
**ADYATAMA**
Website Development & Finance System — © 2025

```

---

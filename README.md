# ADYATAMA Finance

Sistem pencatatan keuangan dan invoice untuk toko **ADYATAMA** dengan teknologi Next.js, MySQL, dan Bootstrap 5.

## 🚀 Fitur Utama

- **💰 Manajemen Transaksi**: Pencatatan pemasukan dan pengeluaran dengan kategori
- **🧾 Sistem Invoice**: Buat invoice, kirim ke pelanggan, dan catat pembayaran
- **👥 Manajemen Pelanggan**: Database pelanggan untuk keperluan invoice
- **📊 Dashboard**: Ringkasan keuangan real-time dan statistik
- **📁 Kategori**: Organisasi transaksi dengan kategori income/expense
- **📱 Responsive Design**: Mobile-friendly dengan Bootstrap 5
- **🔐 Authentication**: Sistem login dengan role-based access
- **⚙️ Settings**: Konfigurasi informasi toko

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + Bootstrap 5
- **Backend**: API Routes Next.js + Prisma ORM
- **Database**: MySQL (InnoDB)
- **Authentication**: Custom auth dengan bcrypt
- **UI/UX**: Bootstrap 5 + Custom CSS

## 📋 Prerequisites

Sebelum memulai, pastikan Anda telah menginstall:

- Node.js (v18+)
- MySQL/MariaDB
- Git

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd adyatama-finance
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

1. Buat database baru di MySQL:
```sql
CREATE DATABASE adyatama_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Copy file environment:
```bash
cp .env.example .env.local
```

3. Edit `.env.local` dan sesuaikan database connection:
```env
DATABASE_URL="mysql://username:password@localhost:3306/adyatama_finance"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
APP_NAME="ADYATAMA Finance"
APP_URL="http://localhost:3000"
```

### 4. Database Setup

Ada 3 cara untuk setup database:

#### Opsi 1: Menggunakan Migration (Direkomendasikan)
```bash
npm run db:migrate
```

#### Opsi 2: Menggunakan Prisma Push
```bash
npm run db:generate
npm run db:push
```

#### Opsi 3: Menggunakan File SQL Asli
```bash
mysql -u root -p adyatama_finance < DATABASE.sql
npm run db:generate
```

### 5. Seed Data (Opsional)

Untuk data demo, jalankan seed:

```bash
npm run db:seed
```

*Catatan: Jika menggunakan migration opsi 1, seed data sudah termasuk dalam migration 002.*

**Login credentials untuk demo:**
- Admin: username `admin`, password `admin123`
- Kasir: username `kasir`, password `user123`

### 6. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000)

## 📁 Struktur Proyek

```
adyatama-finance/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── categories/    # CRUD kategori
│   │   ├── customers/     # CRUD pelanggan
│   │   ├── transactions/  # CRUD transaksi
│   │   ├── invoices/      # CRUD invoice
│   │   ├── settings/      # Konfigurasi toko
│   │   └── users/         # Manajemen user
│   ├── dashboard/         # Dashboard page
│   ├── transactions/      # Transaksi page
│   ├── invoices/          # Invoice page
│   ├── customers/         # Pelanggan page
│   └── settings/          # Settings page
├── components/            # React components
├── lib/                   # Helper functions & utils
├── prisma/               # Database schema & seed
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## 🎯 Cara Penggunaan

### Login
1. Buka `http://localhost:3000`
2. Login dengan credentials yang tersedia
3. Setelah login, Anda akan diarahkan ke dashboard

### Menambah Transaksi
1. Menu: Dashboard → Transaksi
2. Klik "Tambah Transaksi"
3. Isi form: jenis, tanggal, kategori, jumlah, deskripsi
4. Simpan

### Membuat Invoice
1. Menu: Dashboard → Invoice
2. Klik "Buat Invoice Baru"
3. Pilih pelanggan, tambah items
4. Set harga dan quantity
5. Save sebagai draft atau "Issue" untuk generate nomor invoice

### Mencatat Pembayaran Invoice
1. Buka detail invoice
2. Klik "Tambah Pembayaran"
3. Masukkan jumlah dan metode pembayaran
4. Sistem akan otomatis update status invoice

## 🔧 Available Scripts

- `npm run dev` - Jalankan development server
- `npm run build` - Build untuk production
- `npm run start` - Jalankan production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema ke database
- `npm run db:migrate` - Jalankan database migrations dari DATABASE.sql
- `npm run db:seed` - Jalankan seed data
- `npm run db:studio` - Buka Prisma Studio

## 📊 Database Schema

Aplikasi menggunakan tabel-tabel berikut:

- `users` - Data pengguna sistem
- `categories` - Kategori transaksi (income/expense)
- `transactions` - Catatan transaksi keuangan
- `customers` - Data pelanggan
- `invoices` - Header invoice
- `invoice_items` - Detail items invoice
- `invoice_payments` - Riwayat pembayaran invoice
- `settings` - Konfigurasi toko

## 🔒 Security Notes

- Password di-hash dengan bcrypt
- Input validation di API routes
- SQL injection prevention via Prisma ORM
- Environment variables untuk sensitive data

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

## 📝 License

© 2025 ADYATAMA. All rights reserved.

## 🗄️ Database Migration

Untuk informasi lengkap tentang database migration dari `DATABASE.sql`, lihat:
[DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md)

## 🆘 Support

Jika mengalami masalah atau ada pertanyaan:
- Cek console error di browser
- Pastikan database connection benar
- Verify environment variables
- Pastikan MySQL service berjalan
- Lihat [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) untuk troubleshooting database

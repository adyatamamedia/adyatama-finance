# Invoice Deletion with Force Delete

## Deskripsi
Sistem penghapusan invoice yang lebih pintar dengan kemampuan untuk menangani invoice yang memiliki data terkait (payments dan transactions).

## Fitur

### 1. **Smart Delete**
Ketika mencoba menghapus invoice:
- Sistem akan mengecek apakah invoice memiliki payments atau transactions
- Jika ada, sistem akan memberikan pesan error yang detail
- User akan ditanya apakah ingin melakukan force delete

### 2. **Force Delete**
Jika user mengkonfirmasi force delete:
- Semua transactions terkait akan dihapus
- Semua payments terkait akan dihapus
- Invoice dan items-nya akan dihapus
- User mendapat konfirmasi berapa data yang dihapus

## Cara Kerja

### Backend (API)

**Endpoint:** `DELETE /api/invoices/[id]`

**Query Parameter:**
- `force=true` - Untuk melakukan force delete

**Response jika ada data terkait (tanpa force):**
```json
{
  "error": "Cannot delete invoice with related data",
  "message": "Invoice ini memiliki 1 pembayaran dan 1 transaksi. Hapus data terkait terlebih dahulu atau gunakan force delete.",
  "hasPayments": true,
  "hasTransactions": true,
  "paymentsCount": 1,
  "transactionsCount": 1
}
```

**Response sukses dengan force delete:**
```json
{
  "message": "Invoice deleted successfully",
  "deletedPayments": 1,
  "deletedTransactions": 1
}
```

### Frontend

**Flow:**
1. User klik tombol "Hapus" pada invoice
2. Modal konfirmasi muncul
3. User klik "Hapus" di modal
4. Sistem coba delete invoice
5. Jika ada data terkait:
   - Muncul konfirmasi kedua dengan detail data yang akan dihapus
   - User bisa pilih "OK" (force delete) atau "Cancel"
6. Jika user pilih OK:
   - Request dikirim ulang dengan `?force=true`
   - Semua data terkait dihapus
   - Success message ditampilkan dengan detail

## Contoh Penggunaan

### Skenario 1: Invoice tanpa data terkait
```
User: Hapus invoice INV-001
System: Invoice berhasil dihapus
```

### Skenario 2: Invoice dengan pembayaran
```
User: Hapus invoice INV-002
System: Invoice ini memiliki 1 pembayaran.
        Apakah Anda yakin ingin menghapus invoice beserta semua data terkait?
        Peringatan: Tindakan ini tidak dapat dibatalkan!
User: OK
System: Invoice berhasil dihapus beserta 1 pembayaran dan 0 transaksi
```

### Skenario 3: Invoice LUNAS (dengan auto-payment)
```
User: Hapus invoice INV-003 (status PAID)
System: Invoice ini memiliki 1 pembayaran dan 1 transaksi.
        Apakah Anda yakin ingin menghapus invoice beserta semua data terkait?
        Peringatan: Tindakan ini tidak dapat dibatalkan!
User: OK
System: Invoice berhasil dihapus beserta 1 pembayaran dan 1 transaksi
```

## Keamanan

- ✅ Konfirmasi ganda untuk force delete
- ✅ Pesan warning yang jelas
- ✅ Detail informasi tentang data yang akan dihapus
- ✅ Logging di server untuk audit trail
- ✅ Transaction-safe (menggunakan Prisma)

## File yang Dimodifikasi

1. **`app/api/invoices/[id]/route.ts`**
   - Menambahkan parameter `force` untuk force delete
   - Menambahkan pengecekan dan penghapusan data terkait
   - Menambahkan response yang lebih detail

2. **`app/dashboard/invoices/page.tsx`**
   - Mengupdate fungsi `confirmDelete` untuk handle force delete
   - Menambahkan konfirmasi kedua untuk force delete
   - Menampilkan pesan sukses yang lebih detail

## Catatan Penting

⚠️ **Force delete akan menghapus:**
- Invoice items (cascade delete otomatis)
- Invoice payments (manual delete)
- Transactions yang ter-link ke invoice (manual delete)

⚠️ **Tidak bisa menghapus invoice yang sudah PAID tanpa force delete**
- Ini untuk mencegah kehilangan data pembayaran dan transaksi
- User harus explicitly confirm untuk menghapus data terkait

## Testing

### Test Case 1: Delete invoice tanpa data terkait
- Buat invoice baru (status DRAFT)
- Hapus invoice
- Expected: Terhapus langsung tanpa konfirmasi tambahan

### Test Case 2: Delete invoice dengan payment manual
- Buat invoice
- Tambahkan payment manual
- Coba hapus invoice
- Expected: Muncul konfirmasi force delete
- Confirm: Invoice, payment terhapus

### Test Case 3: Delete invoice LUNAS (auto-payment)
- Buat invoice
- Ubah status ke PAID (auto-payment & transaction dibuat)
- Coba hapus invoice
- Expected: Muncul konfirmasi force delete dengan info 1 payment + 1 transaction
- Confirm: Semua data terhapus

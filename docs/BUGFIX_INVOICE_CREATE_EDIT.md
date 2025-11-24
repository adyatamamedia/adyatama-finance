# Bug Fixes - Invoice Create/Edit Page

## Tanggal: 2025-11-24

### Bug #1: Tombol "Buat Invoice" Tidak Berfungsi

**Masalah:**
Ketika validasi gagal (misalnya pelanggan belum dipilih), tombol "Buat Invoice" tetap dalam status loading dan tidak bisa diklik lagi.

**Penyebab:**
Fungsi `handleSubmitInvoice` menggunakan `return setError(...)` untuk validasi, yang menyebabkan:
- `setIsCreating(true)` sudah dipanggil
- Validasi gagal dan return
- `setIsCreating(false)` tidak pernah dipanggil
- Tombol tetap disabled karena `isCreating` masih `true`

**Solusi:**
Mengubah semua validasi untuk memanggil `setIsCreating(false)` sebelum return:

```typescript
// Sebelum (SALAH)
if (!selectedCustomerId) return setError('Pelanggan wajib dipilih')

// Sesudah (BENAR)
if (!selectedCustomerId) {
  setError('Pelanggan wajib dipilih')
  setIsCreating(false)
  return
}
```

**File yang Diperbaiki:**
- `app/dashboard/invoices/create/page.tsx`
- `app/dashboard/invoices/edit/page.tsx`

**Baris yang Diubah:**
- Validasi `selectedCustomerId` (baris ~348)
- Validasi `issueDate` (baris ~350)
- Validasi `dueDate` (baris ~352)
- Validasi items loop (baris ~354-356)

---

### Bug #2: Step Input Harga Terlalu Kecil (0.01)

**Masalah:**
Input harga dan diskon menggunakan `step="0.01"`, yang berarti:
- Tombol arrow up/down menambah/kurangi 0.01 (1 sen)
- Tidak praktis untuk input harga dalam rupiah
- User harus klik berkali-kali untuk menambah harga

**Solusi:**
Mengubah `step` dari `0.01` menjadi `1`:

```typescript
// Sebelum
<input
  type="number"
  step="0.01"
  ...
/>

// Sesudah
<input
  type="number"
  step="1"
  ...
/>
```

**File yang Diperbaiki:**
- `app/dashboard/invoices/create/page.tsx`
- `app/dashboard/invoices/edit/page.tsx`

**Input yang Diubah:**
1. **Input Harga (unit_price)** - baris ~1186
   - Step: 0.01 → 1
   - Sekarang tombol arrow menambah/kurangi Rp 1

2. **Input Diskon (discount)** - baris ~1197
   - Step: 0.01 → 1
   - Sekarang tombol arrow menambah/kurangi Rp 1

---

## Testing

### Test Bug #1: Tombol Buat Invoice
1. ✅ Buka halaman Create Invoice
2. ✅ Klik "Buat Invoice" tanpa memilih pelanggan
3. ✅ Expected: Muncul error "Pelanggan wajib dipilih"
4. ✅ Expected: Tombol kembali aktif (tidak loading)
5. ✅ Pilih pelanggan dan isi form
6. ✅ Klik "Buat Invoice" lagi
7. ✅ Expected: Invoice berhasil dibuat

### Test Bug #2: Step Input Harga
1. ✅ Buka halaman Create Invoice
2. ✅ Tambah item baru
3. ✅ Klik arrow up pada input "Harga"
4. ✅ Expected: Harga bertambah 1 (bukan 0.01)
5. ✅ Klik arrow down pada input "Harga"
6. ✅ Expected: Harga berkurang 1 (bukan 0.01)
7. ✅ Test yang sama untuk input "Diskon"

---

## Catatan

### Input Decimal Masih Bisa Digunakan
Meskipun `step="1"`, user masih bisa:
- ✅ Mengetik angka decimal manual (contoh: 1500000.50)
- ✅ Copy-paste angka decimal
- ✅ Menggunakan kalkulator untuk input decimal

Yang berubah hanya:
- ❌ Tombol arrow up/down hanya menambah/kurangi 1 (bukan 0.01)

### Rekomendasi untuk Future
Jika ingin input yang lebih user-friendly:
1. Gunakan input dengan format currency (Rp 1.500.000)
2. Tambahkan shortcut untuk ribuan (K), jutaan (M), milyaran (B)
3. Tambahkan calculator popup untuk perhitungan cepat

---

## Impact

**Positif:**
- ✅ Tombol "Buat Invoice" sekarang selalu responsif
- ✅ Input harga lebih praktis dengan arrow keys
- ✅ User experience lebih baik
- ✅ Mengurangi frustrasi user

**Tidak Ada Impact Negatif:**
- ✅ Tidak mengubah cara penyimpanan data
- ✅ Tidak mengubah validasi
- ✅ Backward compatible dengan data yang ada

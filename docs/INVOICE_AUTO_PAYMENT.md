# Invoice Auto-Payment Feature

## Deskripsi
Ketika status invoice diubah menjadi LUNAS (PAID), sistem akan otomatis:
1. Menghitung sisa tagihan (total invoice - total pembayaran yang sudah ada)
2. Membuat record pembayaran untuk sisa tagihan tersebut
3. Membuat transaksi pemasukan (income) sebesar sisa tagihan

## Implementasi

### API Endpoint: PUT /api/invoices/[id]

Ketika invoice di-update dengan status PAID:

```typescript
// 1. Cek apakah status berubah menjadi PAID
const isChangingToPaid = status === 'PAID' && existingInvoice.status !== 'PAID'

// 2. Hitung sisa tagihan
if (isChangingToPaid) {
  const totalPaid = existingInvoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  remainingAmount = total - totalPaid
}

// 3. Buat payment record otomatis
if (isChangingToPaid && remainingAmount > 0) {
  // Buat payment
  await prisma.invoicePayment.create({
    data: {
      invoiceId: id,
      amount: remainingAmount,
      paymentDate: new Date(),
      paymentMethod: 'CASH',
      referenceNo: `AUTO-${invoice.invoiceNo}`,
      createdBy: existingInvoice.userId || null
    }
  })

  // Buat transaksi income
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      transactionDate: new Date(),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      description: `Pembayaran Invoice ${invoice.invoiceNo} - ${customer.name}`,
      categoryId: incomeCategory.id,
      amount: remainingAmount,
      reference: invoice.invoiceNo,
      invoiceId: id,
      userId: existingInvoice.userId || null
    }
  })
}
```

## Cara Penggunaan

1. Buka halaman Edit Invoice
2. Ubah status invoice menjadi "LUNAS" (PAID)
3. Klik tombol "Simpan" atau "Update Invoice"
4. Sistem akan otomatis:
   - Menghitung sisa tagihan
   - Membuat payment record
   - Membuat transaksi income
   - Sisa tagihan menjadi 0

## Catatan Penting

- Fitur ini hanya berjalan ketika status **berubah** dari status lain menjadi PAID
- Jika invoice sudah PAID sebelumnya, tidak akan membuat payment/transaksi duplikat
- Payment method default adalah CASH dengan reference number AUTO-{InvoiceNo}
- Kategori transaksi yang digunakan adalah "Pembayaran Invoice" (dibuat otomatis jika belum ada)
- Transaksi akan ter-link ke invoice melalui field `invoiceId`

## Testing

### Skenario 1: Invoice Tanpa Pembayaran
1. Buat invoice baru dengan total Rp 1.000.000
2. Ubah status menjadi PAID
3. Hasil: Payment Rp 1.000.000 dan transaksi income Rp 1.000.000 dibuat otomatis

### Skenario 2: Invoice dengan Pembayaran Parsial
1. Buat invoice dengan total Rp 1.000.000
2. Tambahkan pembayaran Rp 400.000
3. Ubah status menjadi PAID
4. Hasil: Payment Rp 600.000 (sisa) dan transaksi income Rp 600.000 dibuat otomatis

### Skenario 3: Invoice Sudah Lunas
1. Invoice dengan total Rp 1.000.000
2. Sudah ada pembayaran total Rp 1.000.000
3. Ubah status menjadi PAID
4. Hasil: Tidak ada payment/transaksi baru dibuat (remainingAmount = 0)

## File yang Dimodifikasi

- `app/api/invoices/[id]/route.ts` - Endpoint PUT untuk update invoice

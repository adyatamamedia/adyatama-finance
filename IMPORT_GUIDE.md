# Transaction Import Guide

This guide explains how to import transactions into the Adyatama Finance system using Excel or CSV files.

## Supported Import Methods

### 1. Excel Import (.xlsx, .xls)
- Supported file formats: Excel (.xlsx, .xls)
- **Required columns**: `amount` or `jumlah`
- **Recommended columns**: `description` or `deskripsi`, `date` or `tanggal`, `type` or `jenis`
- **Optional columns**: `category` or `kategori`
- **Type values**: `INCOME`/`EXPENSE` or `Pemasukan`/`Pengeluaran`
- **Date formats**: YYYY-MM-DD, DD/MM/YYYY, or any recognizable date format

### 2. CSV Import (.csv)
- Supported file format: CSV (.csv)
- Same column requirements as Excel import
- Use comma-separated values with headers in the first row

## How to Use

1. **Navigate to Transactions Page**: Go to `/dashboard/transactions`

2. **Click "Import Data" Button**: This will open the import panel

3. **Choose Import Method**:
   - **Excel**: Upload .xlsx or .xls files
   - **CSV**: Upload .csv files

4. **Upload Your File**:
   - Select the file using the file input
   - The system will automatically detect and process the file

5. **Click "Import All Data"**: Process and import all transactions from your file

## Smart Data Mapping

The system automatically maps your data with intelligent field recognition:

- **Amount Fields**: `amount`, `jumlah`, `nominal`, `value`, `nilai`, `harga`
- **Description Fields**: `description`, `deskripsi`, `keterangan`, `memo`, `catatan`, `notes`
- **Date Fields**: `date`, `tanggal`, `transaction_date`, `tanggal_transaksi`
- **Type Fields**: `type`, `jenis`, `tipe` (values: INCOME/EXPENSE, Pemasukan/Pengeluaran)
- **Category Fields**: `category`, `kategori`, `category_id`, `kategori_id`

## File Format Examples

### Excel/CSV Example:
```csv
date,description,amount,type,category
2024-01-15,Gaji Bulanan,5000000,INCOME,Gaji
2024-01-16,Beli Makan Siang,25000,EXPENSE,Makanan
2024-01-17,Bayar Listrik,500000,EXPENSE,Tagihan
```

## Features

- **Smart Data Mapping**: Automatically recognizes different column names and formats
- **Batch Processing**: Large files are processed in batches of 100 records
- **Data Validation**: Automatic validation and correction of data
- **Error Reporting**: Detailed error messages and debug information
- **Category Mapping**: Automatic category matching based on name and type
- **Flexible Column Names**: Supports multiple naming conventions (English/Indonesian)

## Data Processing Logic

- **Default Values**: If required fields are missing, sensible defaults are provided
- **Amount Processing**: Removes currency symbols and formats numbers correctly
- **Date Recognition**: Supports various date formats with intelligent parsing
- **Type Detection**: Automatically identifies income vs expense transactions
- **Error Recovery**: Creates sample data if file is empty or invalid

## Tips

1. **Use Clear Headers**: Use descriptive column names like `tanggal`, `deskripsi`, `jumlah`, `jenis`
2. **Consistent Formats**: Use consistent date and number formats throughout your file
3. **Backup Data**: Always backup your current data before bulk imports
4. **Check Categories**: Ensure categories exist for automatic mapping
5. **Test Import**: Start with small files to test your format

## Troubleshooting

- **Wrong Data Imported**: Check browser console for detailed processing logs
- **File Not Processed**: Ensure file has valid headers and data
- **Amount Issues**: Verify numbers don't contain text or unusual formatting
- **Category Not Found**: Create categories in the system before importing

For additional support, check the browser console (F12) for detailed error messages and data processing logs.
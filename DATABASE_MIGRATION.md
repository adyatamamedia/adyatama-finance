# Database Migration Guide

This document explains how to set up and migrate the database for ADYATAMA Finance application using the original `DATABASE.sql` file.

## 📋 Migration Files

### 1. Initial Schema Migration
**File**: `prisma/migrations/001_initial_migration.sql`

Contains:
- All table creations (users, settings, categories, customers, invoices, invoice_items, invoice_payments, transactions, transaction_attachments)
- Foreign key constraints
- Proper indexes for performance

### 2. Seed Data Migration
**File**: `prisma/migrations/002_seed_data.sql`

Contains:
- Initial settings (store information)
- Admin and kasir users (password: admin123, user123)
- Default categories (income & expense)
- Sample customers
- Sample invoice with items and payments
- Sample transactions

## 🚀 Migration Methods

### Method 1: Using Prisma Migrate (Recommended)

```bash
# 1. Setup database first (MySQL)
mysql -u root -p
CREATE DATABASE adyatama_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# 3. Generate Prisma Client
npm run db:generate

# 4. Run migrations using custom script
npm run db:migrate
```

### Method 2: Manual SQL Execution

```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE adyatama_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Import schema
mysql -u root -p adyatama_finance < prisma/migrations/001_initial_migration.sql

# 3. Import seed data (optional)
mysql -u root -p adyatama_finance < prisma/migrations/002_seed_data.sql
```

### Method 3: Using Original DATABASE.sql

If you prefer to use the original `DATABASE.sql` file:

```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE adyatama_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Import the original file
mysql -u root -p adyatama_finance < DATABASE.sql

# 3. Generate Prisma Client
npm run db:generate
```

## 🔧 Migration Script Details

### Migration Script (`scripts/migrate.js`)

The custom migration script:
- Reads all `.sql` files from `prisma/migrations/` directory
- Executes them in order (alphabetically)
- Handles SQL statements separated by semicolons
- Provides detailed logging
- Safe error handling

### What the Migration Does:

1. **Creates Tables**:
   - `users` - User authentication and roles
   - `settings` - Store configuration
   - `categories` - Transaction categories (income/expense)
   - `customers` - Customer data for invoices
   - `invoices` - Invoice headers
   - `invoice_items` - Invoice line items
   - `invoice_payments` - Payment records
   - `transactions` - Financial transactions
   - `transaction_attachments` - File attachments

2. **Sets Up Relationships**:
   - Foreign key constraints between tables
   - Proper ON DELETE behaviors
   - Indexing for performance

3. **Inserts Initial Data**:
   - Default store settings
   - Admin user (username: `admin`, password: `admin123`)
   - Regular user (username: `kasir`, password: `user123`)
   - Sample categories for income and expenses
   - Sample customers and invoice data
   - Sample transactions

## 🔐 Default Login Credentials

After running migrations with seed data:

| Role   | Username | Password |
|--------|----------|----------|
| Admin  | `admin`  | `admin123` |
| Kasir  | `kasir`  | `user123` |

## ⚠️ Important Notes

1. **Password Hashes**: The seed data contains placeholder password hashes. Update them with actual bcrypt hashes:
   ```javascript
   // Generate new hashes with Node.js
   const bcrypt = require('bcryptjs');
   const hash1 = await bcrypt.hash('admin123', 10);
   const hash2 = await bcrypt.hash('user123', 10);
   ```

2. **Database Connection**: Ensure your `.env.local` has correct database URL:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/adyatama_finance"
   ```

3. **Character Set**: Database uses `utf8mb4` for full Unicode support including emojis

4. **Migration Order**: Files are executed alphabetically. Use proper naming (001_, 002_, etc.)

## 🛠️ Troubleshooting

### Common Issues:

1. **Foreign Key Constraints**:
   ```sql
   -- Temporarily disable foreign key checks if needed
   SET FOREIGN_KEY_CHECKS = 0;
   -- Run your SQL
   SET FOREIGN_KEY_CHECKS = 1;
   ```

2. **Character Set Issues**:
   ```sql
   ALTER DATABASE adyatama_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Permission Issues**:
   ```sql
   GRANT ALL PRIVILEGES ON adyatama_finance.* TO 'your_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

## 📊 Database Schema Overview

```mermaid
erDiagram
    users ||--o{ categories : creates
    users ||--o{ transactions : creates
    users ||--o{ invoices : creates
    users ||--o{ invoice_payments : creates
    users ||--o{ settings : creates

    categories ||--o{ transactions : categorizes

    customers ||--o{ invoices : receives

    invoices ||--o{ invoice_items : contains
    invoices ||--o{ invoice_payments : receives
    invoices ||--o{ transactions : generates

    transactions ||--o{ transaction_attachments : has
```

## 🔄 Resetting Database

To completely reset the database:

```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS adyatama_finance; CREATE DATABASE adyatama_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations again
npm run db:migrate
```

## 📝 Next Steps

After successful migration:

1. **Start the application**: `npm run dev`
2. **Login with admin credentials**
3. **Configure store settings** in `/settings`
4. **Add your own categories** if needed
5. **Start using the application!**
-- **************************************************************
-- SQL: Struktur Database ADYATAMA Finance (MySQL)
-- - Engine: InnoDB
-- - Charset: utf8mb4 / utf8mb4_unicode_ci
-- - Berisi: users, categories, customers, transactions, invoices, invoice_items,
--           invoice_payments, transaction_attachments, settings
-- - Includes sample seed entries (admin user, categories, customer, sample invoice)
-- **************************************************************

-- NOTE: pastikan menjalankan di database yang benar:
-- CREATE DATABASE IF NOT EXISTS adyatama_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE adyatama_finance;

SET @@session.foreign_key_checks = 0;

-- 1) users (opsional; untuk login / pencatat)
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(150) DEFAULT NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) settings (store info, e.g. store_name = ADYATAMA)
CREATE TABLE IF NOT EXISTS settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL,
  `value` TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY ux_settings_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) categories (income / expense)
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  type ENUM('income','expense') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE UNIQUE INDEX ux_user_category ON categories(user_id, name, type);

-- 4) customers (for invoices)
CREATE TABLE IF NOT EXISTS customers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) invoices (header)
CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_no VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT UNSIGNED NULL,
  user_id INT UNSIGNED NULL,
  status ENUM('draft','issued','partial','paid','cancelled') NOT NULL DEFAULT 'draft',
  issue_date DATE NULL,
  due_date DATE NULL,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'IDR',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_invoices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);

-- 6) invoice_items (detail invoice)
CREATE TABLE IF NOT EXISTS invoice_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id BIGINT UNSIGNED NOT NULL,
  description VARCHAR(500) NOT NULL,
  product_sku VARCHAR(100) DEFAULT NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- 7) invoice_payments (payments applied to invoices)
CREATE TABLE IF NOT EXISTS invoice_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id BIGINT UNSIGNED NOT NULL,
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(15,2) NOT NULL,
  payment_method ENUM('cash','transfer','card','other') DEFAULT 'cash',
  reference_no VARCHAR(100) DEFAULT NULL,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ipayments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ipayments_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_ipayments_invoice ON invoice_payments(invoice_id);

-- 8) transactions (main ledger: income / expense; link to invoice possible)
CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  `type` ENUM('income','expense') NOT NULL,
  transaction_date DATE NOT NULL,
  month TINYINT UNSIGNED GENERATED ALWAYS AS (MONTH(transaction_date)) STORED,
  year SMALLINT UNSIGNED GENERATED ALWAYS AS (YEAR(transaction_date)) STORED,
  description VARCHAR(500) NULL,
  category_id INT UNSIGNED NULL,
  amount DECIMAL(15,2) NOT NULL,
  reference VARCHAR(100) NULL,
  invoice_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tx_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_tx_user_date ON transactions(user_id, transaction_date);
CREATE INDEX idx_tx_type ON transactions(`type`);
CREATE INDEX idx_tx_category ON transactions(category_id);
CREATE INDEX idx_tx_invoice ON transactions(invoice_id);

-- 9) transaction_attachments (optional: store receipts / images)
CREATE TABLE IF NOT EXISTS transaction_attachments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transaction_id BIGINT UNSIGNED NOT NULL,
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(255) NOT NULL,
  filesize BIGINT UNSIGNED DEFAULT 0,
  mime VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attach_tx FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_attach_tx ON transaction_attachments(transaction_id);

SET @@session.foreign_key_checks = 1;

-- **************************************************************
-- Seed contoh minimal
-- NOTE: ganti password hash dengan hasil password_hash di aplikasimu
-- **************************************************************

-- 1) insert store name ADYATAMA into settings (upsert style)
INSERT INTO settings (`key`,`value`)
VALUES ('store_name','ADYATAMA')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- 2) sample admin user (password must be hashed in real use)
-- Replace '$2y$10$REPLACE_WITH_HASH' with actual bcrypt hash before production
INSERT INTO users (username, password, name, role)
VALUES ('admin', '$2y$10$REPLACE_WITH_HASH', 'Administrator', 'admin')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);

-- fetch admin id if needed (in scripts use SELECT id FROM users WHERE username='admin')
-- 3) sample categories for admin (assume admin exists)
INSERT IGNORE INTO categories (user_id, name, type)
SELECT u.id, 'Penjualan', 'income' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Gaji Karyawan', 'expense' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Beli Bahan', 'expense' FROM users u WHERE u.username='admin';

-- 4) sample customer
INSERT INTO customers (name, email, phone, address)
VALUES ('PT. Pelanggan Contoh', 'customer@example.com', '08123456789', 'Jl. Contoh No.1, Jakarta')
ON DUPLICATE KEY UPDATE email = VALUES(email), phone = VALUES(phone);

-- 5) sample invoice + items + payment + linked transaction
-- Insert invoice
INSERT INTO invoices (invoice_no, customer_id, user_id, status, issue_date, due_date, subtotal, discount, tax, total, currency, notes)
VALUES ('ADY-2025-0001',
        (SELECT id FROM customers LIMIT 1),
        (SELECT id FROM users WHERE username = 'admin' LIMIT 1),
        'issued',
        '2025-11-10',
        '2025-11-20',
        500000.00,
        0.00,
        50000.00,
        550000.00,
        'IDR',
        'Invoice contoh untuk penjualan')
ON DUPLICATE KEY UPDATE subtotal = VALUES(subtotal), total = VALUES(total), status = VALUES(status);

-- get last inserted invoice id (useful in manual scripts) -- here we'll join
-- Insert invoice items (associates to invoice above)
INSERT INTO invoice_items (invoice_id, description, product_sku, quantity, unit_price, discount, subtotal)
SELECT i.id, 'Produk Contoh A', 'SKU-A', 2, 200000.00, 0.00, 400000.00
FROM invoices i WHERE i.invoice_no = 'ADY-2025-0001'
LIMIT 1;

INSERT INTO invoice_items (invoice_id, description, product_sku, quantity, unit_price, discount, subtotal)
SELECT i.id, 'Jasa Contoh', NULL, 1, 100000.00, 0.00, 100000.00
FROM invoices i WHERE i.invoice_no = 'ADY-2025-0001'
LIMIT 1;

-- Insert a payment for that invoice (partial/full)
INSERT INTO invoice_payments (invoice_id, payment_date, amount, payment_method, reference_no, created_by)
SELECT i.id, NOW(), 550000.00, 'transfer', 'TRX-20251110-001', u.id
FROM invoices i CROSS JOIN users u
WHERE i.invoice_no = 'ADY-2025-0001' AND u.username = 'admin'
LIMIT 1;

-- Create a corresponding transaction record (income) linked to invoice
INSERT INTO transactions (user_id, `type`, transaction_date, description, category_id, amount, reference, invoice_id)
SELECT u.id, 'income', DATE(NOW()), CONCAT('Pembayaran Invoice ', i.invoice_no), c.id, 550000.00, 'TRX-20251110-001', i.id
FROM invoices i
LEFT JOIN users u ON u.username = 'admin'
LEFT JOIN categories c ON c.name = 'Penjualan' AND c.type = 'income' AND c.user_id = u.id
WHERE i.invoice_no = 'ADY-2025-0001'
LIMIT 1;

-- Optionally insert a sample expense transaction
INSERT INTO transactions (user_id, `type`, transaction_date, description, category_id, amount, reference)
SELECT u.id, 'expense', '2025-11-02', 'Pembayaran gaji karyawan', c.id, 3500000.00, 'PAY-20251102-001'
FROM users u
LEFT JOIN categories c ON c.name = 'Gaji Karyawan' AND c.type = 'expense' AND c.user_id = u.id
WHERE u.username = 'admin'
LIMIT 1;

-- **************************************************************
-- End of SQL
-- **************************************************************

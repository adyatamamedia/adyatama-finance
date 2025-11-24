-- Insert Settings
INSERT INTO `settings` (`key`, `value`) VALUES ('store_name', 'ADYATAMA') ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
INSERT INTO `settings` (`key`, `value`) VALUES ('store_address', 'Jl. Contoh No. 123, Jakarta') ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
INSERT INTO `settings` (`key`, `value`) VALUES ('store_phone', '021-12345678') ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
INSERT INTO `settings` (`key`, `value`) VALUES ('store_email', 'info@adyatama.com') ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- Insert Admin User (password: admin123)
INSERT INTO `users` (`username`, `password`, `name`, `role`) VALUES
('admin', '$2b$10$YourHashedPasswordHere', 'Administrator', 'ADMIN')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `role` = VALUES(`role`);

-- Insert Regular User (password: user123)
INSERT INTO `users` (`username`, `password`, `name`, `role`) VALUES
('kasir', '$2b$10$YourHashedPasswordHere2', 'Kasir Toko', 'USER')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `role` = VALUES(`role`);

-- Insert Categories for Admin User
INSERT IGNORE INTO `categories` (`user_id`, `name`, `type`)
SELECT u.id, 'Penjualan Produk', 'INCOME' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Penjualan Jasa', 'INCOME' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Biaya Kirim', 'INCOME' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Lainnya (Pemasukan)', 'INCOME' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Beli Bahan Baku', 'EXPENSE' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Gaji Karyawan', 'EXPENSE' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Sewa Toko', 'EXPENSE' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Listrik & Air', 'EXPENSE' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Internet & Telepon', 'EXPENSE' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Marketing', 'EXPENSE' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Transportasi', 'EXPENSE' FROM users u WHERE u.username='admin'
UNION ALL
SELECT u.id, 'Lainnya (Pengeluaran)', 'EXPENSE' FROM users u WHERE u.username='admin';

-- Insert Sample Customers
INSERT INTO `customers` (`name`, `email`, `phone`, `address`) VALUES
('PT. Pelanggan Setia', 'info@pelanggansetia.com', '021-11111111', 'Jl. Bisnis No. 1, Jakarta Pusat'),
('CV. Mitra Usaha', 'contact@mitrausaha.com', '021-22222222', 'Jl. Usaha No. 2, Jakarta Selatan'),
('UD. Sahabat Toko', 'ud.sahabat@gmail.com', '021-33333333', 'Jl. Persahabatan No. 3, Jakarta Barat')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`), `phone` = VALUES(`phone`), `address` = VALUES(`address`);

-- Insert Sample Invoice with Items and Payment
SET @customer_id = (SELECT id FROM customers LIMIT 1);
SET @user_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1);
SET @invoice_no = CONCAT('ADY-', YEAR(NOW()), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));

-- Insert Invoice Header
INSERT INTO `invoices` (`invoice_no`, `customer_id`, `user_id`, `status`, `issue_date`, `due_date`, `subtotal`, `discount`, `tax`, `total`, `currency`, `notes`) VALUES
(@invoice_no, @customer_id, @user_id, 'ISSUED', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 5000000.00, 100000.00, 500000.00, 5400000.00, 'IDR', 'Pembayaran dapat dilakukan via transfer ke rekening BCA 123-456-789')
ON DUPLICATE KEY UPDATE `subtotal` = VALUES(`subtotal`), `total` = VALUES(`total`);

-- Get Invoice ID
SET @invoice_id = (SELECT id FROM invoices WHERE invoice_no = @invoice_no LIMIT 1);

-- Insert Invoice Items
INSERT INTO `invoice_items` (`invoice_id`, `description`, `product_sku`, `quantity`, `unit_price`, `discount`, `subtotal`) VALUES
(@invoice_id, 'Produk Premium A', 'PRM-A001', 2, 2000000.00, 100000.00, 3900000.00),
(@invoice_id, 'Jasa Konsultasi', NULL, 1, 1200000.00, 0.00, 1200000.00),
(@invoice_id, 'Aksesoris Tambahan', 'ACC-B002', 1, 200000.00, 100000.00, 100000.00);

-- Insert Invoice Payment
INSERT INTO `invoice_payments` (`invoice_id`, `payment_date`, `amount`, `payment_method`, `reference_no`, `created_by`) VALUES
(@invoice_id, NOW(), 5400000.00, 'TRANSFER', 'TRF-20251112-001', @user_id);

-- Insert corresponding Transaction Record
SET @category_id = (SELECT c.id FROM categories c WHERE c.name = 'Penjualan Produk' AND c.type = 'INCOME' AND c.user_id = @user_id LIMIT 1);
INSERT INTO `transactions` (`user_id`, `type`, `transaction_date`, `month`, `year`, `description`, `category_id`, `amount`, `reference`, `invoice_id`) VALUES
(@user_id, 'INCOME', CURDATE(), MONTH(CURDATE()), YEAR(CURDATE()), CONCAT('Pembayaran Invoice ', @invoice_no, ' - PT. Pelanggan Setia'), @category_id, 5400000.00, 'TRF-20251112-001', @invoice_id);

-- Insert Sample Expense Transactions
SET @expense_category_id_1 = (SELECT c.id FROM categories c WHERE c.name = 'Gaji Karyawan' AND c.type = 'EXPENSE' AND c.user_id = @user_id LIMIT 1);
SET @expense_category_id_2 = (SELECT c.id FROM categories c WHERE c.name = 'Sewa Toko' AND c.type = 'EXPENSE' AND c.user_id = @user_id LIMIT 1);
SET @expense_category_id_3 = (SELECT c.id FROM categories c WHERE c.name = 'Beli Bahan Baku' AND c.type = 'EXPENSE' AND c.user_id = @user_id LIMIT 1);

INSERT INTO `transactions` (`user_id`, `type`, `transaction_date`, `month`, `year`, `description`, `category_id`, `amount`, `reference`) VALUES
(@user_id, 'EXPENSE', DATE_SUB(CURDATE(), INTERVAL 5 DAY), MONTH(DATE_SUB(CURDATE(), INTERVAL 5 DAY)), YEAR(DATE_SUB(CURDATE(), INTERVAL 5 DAY)), 'Gaji karyawan bulan ini', @expense_category_id_1, 8500000.00, 'PAY-20251107-001'),
(@user_id, 'EXPENSE', DATE_SUB(CURDATE(), INTERVAL 10 DAY), MONTH(DATE_SUB(CURDATE(), INTERVAL 10 DAY)), YEAR(DATE_SUB(CURDATE(), INTERVAL 10 DAY)), 'Pembayaran sewa toko', @expense_category_id_2, 5000000.00, 'PAY-20251102-001'),
(@user_id, 'EXPENSE', DATE_SUB(CURDATE(), INTERVAL 15 DAY), MONTH(DATE_SUB(CURDATE(), INTERVAL 15 DAY)), YEAR(DATE_SUB(CURDATE(), INTERVAL 15 DAY)), 'Pembelian bahan baku', @expense_category_id_3, 3200000.00, 'PUR-20251028-001');

-- Update the password hashes with actual bcrypt hashes
-- Note: Replace these hashes with actual bcrypt hashes generated in your application
UPDATE `users` SET `password` = '$2b$10$rOzJqQDQrQcQGQGQGQGQGOCGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQ' WHERE `username` = 'admin';
UPDATE `users` SET `password` = '$2b$10$sOzJqQDQrQcQGQGQGQGQGOCGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQ' WHERE `username` = 'kasir';
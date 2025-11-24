-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(150) NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `user_id` INTEGER NULL,

    UNIQUE INDEX `ux_settings_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `name` VARCHAR(120) NOT NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `ux_user_category`(`user_id`, `name`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `email` VARCHAR(150) NULL,
    `phone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `invoice_no` VARCHAR(50) NOT NULL,
    `customer_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `status` ENUM('DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `issue_date` DATE NULL,
    `due_date` DATE NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `tax` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `currency` CHAR(3) NOT NULL DEFAULT 'IDR',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `invoices_invoice_no_key`(`invoice_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `invoice_id` BIGINT NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `product_sku` VARCHAR(100) NULL,
    `quantity` DECIMAL(12, 3) NOT NULL DEFAULT 1.000,
    `unit_price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_payments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `invoice_id` BIGINT NOT NULL,
    `payment_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DECIMAL(15, 2) NOT NULL,
    `payment_method` ENUM('CASH', 'TRANSFER', 'CARD', 'OTHER') NOT NULL DEFAULT 'CASH',
    `reference_no` VARCHAR(100) NULL,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
    `transaction_date` DATE NOT NULL,
    `month` INTEGER NOT NULL DEFAULT 0,
    `year` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(500) NULL,
    `category_id` INTEGER NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `reference` VARCHAR(100) NULL,
    `invoice_id` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_attachments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `transaction_id` BIGINT NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `filepath` VARCHAR(255) NOT NULL,
    `filesize` BIGINT NOT NULL DEFAULT 0,
    `mime` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `settings` ADD CONSTRAINT `fk_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `fk_categories_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `fk_invoices_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `fk_invoices_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_payments` ADD CONSTRAINT `fk_ipayments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_payments` ADD CONSTRAINT `fk_ipayments_user` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `fk_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `fk_tx_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `fk_transactions_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_attachments` ADD CONSTRAINT `fk_attach_tx` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
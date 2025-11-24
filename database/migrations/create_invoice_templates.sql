-- Create table for custom invoice templates
CREATE TABLE IF NOT EXISTS invoice_templates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,

  -- Template Information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  company_logo VARCHAR(500), -- URL to logo image
  company_address TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  company_website VARCHAR(255),

  -- Tax Information
  tax_id VARCHAR(100), -- NPWP atau nomor pajak lainnya

  -- Template Settings
  primary_color VARCHAR(7) DEFAULT '#000000', -- Hex color
  secondary_color VARCHAR(7) DEFAULT '#666666', -- Hex color
  accent_color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color
  font_family VARCHAR(100) DEFAULT 'Arial, sans-serif',
  font_size_base INT DEFAULT 12,

  -- Header Settings
  show_logo BOOLEAN DEFAULT TRUE,
  logo_position ENUM('left', 'center', 'right') DEFAULT 'left',
  show_company_details BOOLEAN DEFAULT TRUE,

  -- Footer Settings
  footer_notes TEXT,
  footer_terms TEXT,
  footer_payment_info TEXT,
  footer_bank_account TEXT,

  -- Layout Settings
  layout_style ENUM('modern', 'classic', 'minimal') DEFAULT 'modern',
  show_watermark BOOLEAN DEFAULT FALSE,
  watermark_text VARCHAR(255),

  -- Metadata
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign Keys
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  -- Indexes
  INDEX idx_template_active (is_active),
  INDEX idx_template_default (is_default),
  INDEX idx_template_created_by (created_by)
);

-- Insert default templates
INSERT INTO invoice_templates (name, description, is_default, company_name, company_address, company_phone, company_email, primary_color, accent_color, layout_style, footer_notes, footer_terms) VALUES
('Template Standar', 'Template invoice standar dengan tampilan profesional', TRUE, 'ADYATAMA', 'Jl. Contoh No. 1, Jakarta, Indonesia', '(021) 1234-5678', 'info@adyatama.com', '#000000', '#3b82f6', 'modern', 'Terima kasih atas kepercayaan Anda', 'Pembayaran harus diselesaikan dalam waktu 30 hari sejak tanggal terbit.'),

('Template Profesional', 'Template invoice dengan desain elegan untuk perusahaan profesional', FALSE, 'ADYATAMA PROFESSIONAL', 'Jl. Bisnis No. 123, Jakarta Selatan, 12345', '(021) 9876-5432', 'professional@adyatama.com', '#1f2937', '#059669', 'classic', 'Terima kasih telah memilih layanan kami', 'Semua harga dalam Rupiah. Pembayaran jatuh tempo 14 hari setelah tanggal invoice.'),

('Template Minimalis', 'Template invoice dengan desain sederhana dan clean', FALSE, 'Adyatama', 'Jakarta, Indonesia', '021-123456', 'hello@adyatama.com', '#374151', '#10b981', 'minimal', 'Terima kasih', 'Pembayaran dalam 7 hari.'),

('Template Kreatif', 'Template invoice dengan sentuhan kreatif untuk industri kreatif', FALSE, 'Adyatama Creative', 'Jl. Kreatif No. 45, Jakarta Barat', '(021) 555-0123', 'creative@adyatama.com', '#7c3aed', '#f59e0b', 'modern', 'Karya terbaik dimulai dari kerjasama yang baik', 'Pembayaran 50% di muka, 50% setelah proyek selesai.'),

('Template Teknologi', 'Template invoice untuk perusahaan teknologi dan IT', FALSE, 'Adyatama Tech', 'Jl. Teknologi No. 88, Jakarta Pusat', '(021) 888-9999', 'tech@adyatama.com', '#0f172a', '#06b6d4', 'modern', 'Inovasi untuk masa depan', 'Pembayaran dapat dilakukan via transfer bank atau digital payment.'),

('Template Konsultan', 'Template khusus untuk jasa konsultasi', FALSE, 'Adyatama Consulting', 'Jl. Konsultan No. 22, Jakarta Utara', '(021) 777-3333', 'consulting@adyatama.com', '#1e293b', '#dc2626', 'classic', 'Solusi terbaik untuk bisnis Anda', 'Pembayaran sesuai termin yang disepakati dalam kontrak.');

-- Create table for template usage statistics (optional, untuk tracking)
CREATE TABLE IF NOT EXISTS template_usage (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT NOT NULL,
  invoice_id BIGINT NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (template_id) REFERENCES invoice_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,

  INDEX idx_template_usage_template (template_id),
  INDEX idx_template_usage_date (used_at)
);
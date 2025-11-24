-- Insert default invoice templates
INSERT INTO invoice_templates (
  name,
  description,
  is_default,
  is_active,
  company_name,
  company_address,
  company_phone,
  company_email,
  primary_color,
  accent_color,
  layout_style,
  footer_notes,
  footer_terms,
  created_at,
  updated_at
) VALUES
('Template Standar', 'Template invoice standar dengan tampilan profesional', TRUE, TRUE, 'ADYATAMA', 'Jl. Contoh No. 1, Jakarta, Indonesia', '(021) 1234-5678', 'info@adyatama.com', '#000000', '#3b82f6', 'modern', 'Terima kasih atas kepercayaan Anda', 'Pembayaran harus diselesaikan dalam waktu 30 hari sejak tanggal terbit.', NOW(), NOW()),

('Template Profesional', 'Template invoice dengan desain elegan untuk perusahaan profesional', FALSE, TRUE, 'ADYATAMA PROFESSIONAL', 'Jl. Bisnis No. 123, Jakarta Selatan, 12345', '(021) 9876-5432', 'professional@adyatama.com', '#1f2937', '#059669', 'classic', 'Terima kasih telah memilih layanan kami', 'Semua harga dalam Rupiah. Pembayaran jatuh tempo 14 hari setelah tanggal invoice.', NOW(), NOW()),

('Template Minimalis', 'Template invoice dengan desain sederhana dan clean', FALSE, TRUE, 'Adyatama', 'Jakarta, Indonesia', '021-123456', 'hello@adyatama.com', '#374151', '#10b981', 'minimal', 'Terima kasih', 'Pembayaran dalam 7 hari.', NOW(), NOW()),

('Template Kreatif', 'Template invoice dengan sentuhan kreatif untuk industri kreatif', FALSE, TRUE, 'Adyatama Creative', 'Jl. Kreatif No. 45, Jakarta Barat', '(021) 555-0123', 'creative@adyatama.com', '#7c3aed', '#f59e0b', 'modern', 'Karya terbaik dimulai dari kerjasama yang baik', 'Pembayaran 50% di muka, 50% setelah proyek selesai.', NOW(), NOW()),

('Template Teknologi', 'Template invoice untuk perusahaan teknologi dan IT', FALSE, TRUE, 'Adyatama Tech', 'Jl. Teknologi No. 88, Jakarta Pusat', '(021) 888-9999', 'tech@adyatama.com', '#0f172a', '#06b6d4', 'modern', 'Inovasi untuk masa depan', 'Pembayaran dapat dilakukan via transfer bank atau digital payment.', NOW(), NOW()),

('Template Konsultan', 'Template khusus untuk jasa konsultasi', FALSE, TRUE, 'Adyatama Consulting', 'Jl. Konsultan No. 22, Jakarta Utara', '(021) 777-3333', 'consulting@adyatama.com', '#1e293b', '#dc2626', 'classic', 'Solusi terbaik untuk bisnis Anda', 'Pembayaran sesuai termin yang disepakati dalam kontrak.', NOW(), NOW());
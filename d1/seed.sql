-- Data Awal Seed untuk Cloudflare D1 WACRM Pro

-- Users
INSERT OR REPLACE INTO users (id, username, password, name, role, email) VALUES
('u1', 'admin', 'admin123', 'Super Admin', 'admin', 'admin@crm.local'),
('u2', 'sales', 'sales123', 'Rian Sales', 'sales', 'rian@crm.local'),
('u3', 'cs', 'cs123', 'Dewi CS', 'sales', 'dewi@crm.local'),
('u4', 'support', 'support123', 'Fajar Support', 'sales', 'fajar@crm.local');

-- Accounts (3 WhatsApp Slots)
INSERT OR REPLACE INTO accounts (id, name, phone, color, role, assigned_agent, assigned_username, status) VALUES
('account_1', 'WA 1 - CS & Layanan Utama', '6282164871945', '#10B981', 'Layanan Pelanggan & Informasi', 'Dewi CS', 'cs', 'connected'),
('account_2', 'WA 2 - Sales & Akuisisi', '', '#3B82F6', 'Penjualan & Penawaran Prospek', 'Rian Sales', 'sales', 'disconnected'),
('account_3', 'WA 3 - Aftersales & Tagihan', '', '#F59E0B', 'Dukungan Teknis & Penagihan', 'Fajar Support', 'support', 'disconnected');

-- Pipeline Stages
INSERT OR REPLACE INTO pipeline_stages (id, title, color, sort_order) VALUES
('lead', 'Lead Masuk', '#94A3B8', 1),
('contacted', 'Dihubungi / Follow Up', '#3B82F6', 2),
('qualified', 'Kualifikasi Kebutuhan', '#8B5CF6', 3),
('negotiation', 'Penawaran & Negosiasi', '#F59E0B', 4),
('won', 'Closing / Deal', '#10B981', 5),
('lost', 'Tidak Tertarik / Batal', '#EF4444', 6);

-- Quick Replies
INSERT OR REPLACE INTO quick_replies (id, shortcut, title, content) VALUES
('qr1', '/salam', 'Salam Pembuka Ramah', 'Halo Kak! Terima kasih sudah menghubungi kami. Ada yang bisa kami bantu seputar kebutuhan bisnis Anda hari ini? 😊'),
('qr2', '/rek', 'Informasi Rekening Bank', 'Pembayaran resmi dapat ditransfer melalui:\n💳 Bank BCA: 8870-123-456 a.n PT Bisnis Solusi Digital\nMohon sertakan bukti transfer setelah melakukan transaksi ya Kak. Terima kasih!'),
('qr3', '/jamkerja', 'Jam Operasional Kantor', 'Jam operasional layanan kami:\nSenin - Jumat: 08.30 - 17.00 WIB\nSabtu: 09.00 - 14.00 WIB\nPesan di luar jam kerja akan kami respon segera pada jam kerja berikutnya 🙏'),
('qr4', '/katalog', 'Pricelist & Brosur', 'Berikut tautan brosur dan pricelist paket lengkap kami:\n👉 https://example.com/pricelist-2026\nSilakan dipelajari terlebih dahulu, kami siap bantu jelaskan detailnya.');

-- Kontak Awal yang Bersih (Tito Agustika dengan LID mapping terhubung)
INSERT OR REPLACE INTO contacts (id, name, phone, lid, company, email, tags, assigned_agent, account_id, stage, deal_value, created_at, notes) VALUES
('c_778b9261', 'TITO AGUSTIKA', '6287898586605', '4510437093482', 'PT KAKODETA ID', 'pedansaresahku@gmail.com', '["Lead Baru"]', 'Rian Sales', 'account_1', 'lead', 0, '2026-09-07T07:49:20.744Z', '[]'),
('c_b3cb9292', 'Kontak 1945', '6282164871945', NULL, '-', '', '["Lead Baru"]', 'Dewi CS', 'account_1', 'lead', 0, '2026-09-07T07:49:55.393Z', '[]');

-- Pesan Riwayat
INSERT OR REPLACE INTO messages (id, contact_id, account_id, from_me, sender_name, text, timestamp, status) VALUES
('m_944f8111-d', 'c_778b9261', 'account_1', 1, 'Agen CRM', 'halo pak', '2026-09-07T07:50:11.899Z', 'sent'),
('m_f2587fa4-9', 'c_778b9261', 'account_1', 0, 'ADG/Supplier Alat Listrik', '[Media/Sticker]', '2026-09-07T07:50:14.000Z', 'read'),
('m_c9a13572-1', 'c_778b9261', 'account_1', 0, 'ADG/Supplier Alat Listrik', 'Ya cal', '2026-09-07T07:53:47.000Z', 'read'),
('m_03697a95-b', 'c_778b9261', 'account_1', 1, 'Agen CRM', '/rek', '2026-09-07T08:50:21.622Z', 'sent'),
('m_4faa6f4e-6', 'c_778b9261', 'account_1', 0, 'ADG/Supplier Alat Listrik', '[Media/Sticker]', '2026-09-07T08:50:23.000Z', 'delivered');

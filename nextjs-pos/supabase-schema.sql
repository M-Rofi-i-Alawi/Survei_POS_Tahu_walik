-- =============================================
-- SUPABASE SCHEMA untuk POS Tahu Walik
-- Jalankan SQL ini di Supabase SQL Editor
-- =============================================

-- 1. Tabel Users (Owner & Admin)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Di produksi gunakan hash, ini untuk demo
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Produk
CREATE TABLE IF NOT EXISTS produk (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 1000,
  stok_harian INTEGER NOT NULL DEFAULT 0,
  stok_terjual INTEGER NOT NULL DEFAULT 0,
  image TEXT DEFAULT '🥟',
  photo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel Transaksi
CREATE TABLE IF NOT EXISTS transaksi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_name TEXT NOT NULL DEFAULT 'Umum',
  total INTEGER NOT NULL DEFAULT 0,
  method TEXT NOT NULL CHECK (method IN ('tunai', 'qris')),
  status TEXT NOT NULL DEFAULT 'lunas' CHECK (status IN ('lunas', 'pending')),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel Detail Transaksi
CREATE TABLE IF NOT EXISTS detail_transaksi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transaksi(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES produk(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL
);

-- 5. Tabel Pengeluaran
CREATE TABLE IF NOT EXISTS pengeluaran (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabel Konfigurasi QRIS
CREATE TABLE IF NOT EXISTS qris_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_data TEXT DEFAULT '',
  account_name TEXT DEFAULT 'Cemil.in - Ishaq'
);

-- 7. Tabel Konfigurasi Toko
CREATE TABLE IF NOT EXISTS store_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT DEFAULT 'Cemil.in',
  address TEXT DEFAULT 'Jl. Siliwangi Gg Guntur 1 Cianjur, Jawa Barat',
  phone TEXT DEFAULT '0812-0000-0000',
  owner_name TEXT DEFAULT 'Ishaq Abdul Zafar'
);

-- 8. Tabel Notifikasi
CREATE TABLE IF NOT EXISTS notifikasi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('stok_habis', 'info', 'success')),
  message TEXT NOT NULL,
  product_id UUID REFERENCES produk(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- SEED DATA (Data Awal)
-- =============================================

-- Default Users
INSERT INTO users (name, email, password, role) VALUES
  ('Ishaq Abdul Zafar', 'ishaq@cemil.in', 'owner123', 'owner'),
  ('Rofi', 'rofi@cemil.in', 'admin123', 'admin'),
  ('Adit', 'adit@cemil.in', 'admin123', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Default Product
INSERT INTO produk (name, price, stok_harian, stok_terjual, image)
SELECT 'Tahu Walik', 1000, 30, 0, '🥟'
WHERE NOT EXISTS (SELECT 1 FROM produk WHERE name = 'Tahu Walik');

-- Default Store Config
INSERT INTO store_config (name, address, phone, owner_name)
SELECT 'Cemil.in', 'Jl. Siliwangi Gg Guntur 1 Cianjur, Jawa Barat', '0812-0000-0000', 'Ishaq Abdul Zafar'
WHERE NOT EXISTS (SELECT 1 FROM store_config);

-- Default QRIS Config
INSERT INTO qris_config (image_data, account_name)
SELECT '', 'Cemil.in - Ishaq'
WHERE NOT EXISTS (SELECT 1 FROM qris_config);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
-- Disable RLS for simplicity (gunakan API key + server-side auth)
-- Di produksi, aktifkan RLS dengan policies yang tepat

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengeluaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE qris_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifikasi ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated/anon users (for demo)
-- In production, replace with proper role-based policies
CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON produk FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON transaksi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON detail_transaksi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON pengeluaran FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON qris_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON store_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON notifikasi FOR ALL USING (true) WITH CHECK (true);

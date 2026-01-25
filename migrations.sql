-- Migration: Add new columns for multi-step form fields

-- 1. Riwayat Partisipasi (Sudah Pernah / Belum Pernah)
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS participation_history TEXT;

-- 2. Ukuran Vest (M, L, XL)
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS vest_size TEXT;

-- 3. Username Instagram (Wajib @...)
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS instagram_username TEXT;

-- 4. URL Bukti Follow TikTok
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS tiktok_proof_url TEXT;

-- 5. URL Bukti Follow Instagram
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS instagram_proof_url TEXT;

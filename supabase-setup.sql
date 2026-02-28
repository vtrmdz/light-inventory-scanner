-- ============================================================
-- Parts Vault — Supabase Setup
-- ============================================================
-- Run this ONCE in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. Create the parts table
CREATE TABLE IF NOT EXISTS parts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode     TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  notes       TEXT,
  location    TEXT,
  photos      TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Create a UNIQUE index on barcode for fast lookups and upsert safety
CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_barcode_unique ON parts(barcode);

-- 3. General index for search queries
CREATE INDEX IF NOT EXISTS idx_parts_updated ON parts(updated_at DESC);

-- 4. Enable Row Level Security (required by Supabase)
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

-- 5. Allow all operations via the anon key
--    For production, replace this with proper auth policies.
CREATE POLICY "anon_full_access" ON parts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('part-photos', 'part-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies — allow public read + anonymous upload
CREATE POLICY "Public photo read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'part-photos');

CREATE POLICY "Allow photo upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'part-photos');

CREATE POLICY "Allow photo delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'part-photos');

-- ============================================================
-- Done! Your Supabase project is ready for Parts Vault.
-- ============================================================

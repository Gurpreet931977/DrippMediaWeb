-- =========================================================
-- Dripp Media - Shared Quotes & Package Proposals Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- =========================================================

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.shared_quotes (
    id TEXT PRIMARY KEY,
    password TEXT,
    quote_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.shared_quotes ENABLE ROW LEVEL SECURITY;

-- 3. Clean up existing policies before recreating
DROP POLICY IF EXISTS "Allow public read shared_quotes" ON public.shared_quotes;
DROP POLICY IF EXISTS "Allow public insert shared_quotes" ON public.shared_quotes;
DROP POLICY IF EXISTS "Allow public update shared_quotes" ON public.shared_quotes;

-- 4. Allow reading proposals by anyone with the link
CREATE POLICY "Allow public read shared_quotes"
ON public.shared_quotes
FOR SELECT
TO anon, authenticated
USING (true);

-- 5. Allow creating proposals from studio/admin
CREATE POLICY "Allow public insert shared_quotes"
ON public.shared_quotes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 6. Allow updating proposals with digital signatures
CREATE POLICY "Allow public update shared_quotes"
ON public.shared_quotes
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 7. Performance Index
CREATE INDEX IF NOT EXISTS idx_shared_quotes_created_at ON public.shared_quotes (created_at DESC);

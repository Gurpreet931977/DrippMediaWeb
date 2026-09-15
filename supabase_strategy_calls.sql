-- =========================================================
-- Dripp Media - Strategy Calls & Studio Intake Table Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- =========================================================

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.strategy_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    slot TEXT NOT NULL,
    call_channel TEXT DEFAULT 'Direct Phone Call',
    scope TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    source TEXT DEFAULT 'website_modal',
    status TEXT DEFAULT 'pending'
);

-- 2. If table already exists, safely add new columns
ALTER TABLE public.strategy_calls ADD COLUMN IF NOT EXISTS call_channel TEXT DEFAULT 'Direct Phone Call';
ALTER TABLE public.strategy_calls ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT '';

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.strategy_calls ENABLE ROW LEVEL SECURITY;

-- 4. Clean up existing policies before recreating (prevents 'policy already exists' errors)
DROP POLICY IF EXISTS "Allow public insert to strategy_calls" ON public.strategy_calls;
DROP POLICY IF EXISTS "Allow authenticated read strategy_calls" ON public.strategy_calls;
DROP POLICY IF EXISTS "Allow authenticated update strategy_calls" ON public.strategy_calls;

-- 5. Allow anonymous website visitors to submit bookings
CREATE POLICY "Allow public insert to strategy_calls"
ON public.strategy_calls
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 6. Allow authenticated studio team to view and manage bookings
CREATE POLICY "Allow authenticated read strategy_calls"
ON public.strategy_calls
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated update strategy_calls"
ON public.strategy_calls
FOR UPDATE
TO authenticated
USING (true);

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_strategy_calls_created_at ON public.strategy_calls (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_calls_status ON public.strategy_calls (status);

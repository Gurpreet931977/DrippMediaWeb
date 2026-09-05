-- SQL Schema for Dripp Media Strategy Call Bookings
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor) to enable cloud storage with public inserts

CREATE TABLE IF NOT EXISTS public.strategy_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    slot TEXT NOT NULL,
    notes TEXT DEFAULT '',
    source TEXT DEFAULT 'website_modal',
    status TEXT DEFAULT 'pending'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.strategy_calls ENABLE ROW LEVEL SECURITY;

-- Allow anonymous visitors to submit bookings via website
CREATE POLICY "Allow public insert to strategy_calls"
ON public.strategy_calls
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users / service role to view and manage bookings
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

-- =========================================================
-- Dripp Media - Web Portfolio Schema Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- =========================================================

-- 1. Create portfolio_web table
CREATE TABLE IF NOT EXISTS public.portfolio_web (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tagline TEXT DEFAULT '',
    category TEXT DEFAULT 'Enterprise Digital Platform',
    badge TEXT DEFAULT 'Production',
    "desc" TEXT DEFAULT '',
    url TEXT NOT NULL,
    display_url TEXT DEFAULT '',
    image_url TEXT DEFAULT '/images/web-portfolio/bharatup.jpg',
    video_url TEXT DEFAULT '',
    color TEXT DEFAULT '#ebd73f',
    stats JSONB DEFAULT '[]'::jsonb,
    pillars JSONB DEFAULT '[]'::jsonb,
    tech_stack JSONB DEFAULT '[]'::jsonb,
    case_study_challenge TEXT DEFAULT '',
    case_study_solution TEXT DEFAULT '',
    is_visible BOOLEAN DEFAULT true,
    sort_order BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.portfolio_web ENABLE ROW LEVEL SECURITY;

-- 3. Clean up existing policies before recreating
DROP POLICY IF EXISTS "Allow public read portfolio_web" ON public.portfolio_web;
DROP POLICY IF EXISTS "Allow public insert portfolio_web" ON public.portfolio_web;
DROP POLICY IF EXISTS "Allow public update portfolio_web" ON public.portfolio_web;
DROP POLICY IF EXISTS "Allow public delete portfolio_web" ON public.portfolio_web;

-- 4. Allow public read access (for website visitors and studio)
CREATE POLICY "Allow public read portfolio_web"
ON public.portfolio_web
FOR SELECT
TO anon, authenticated
USING (true);

-- 5. Allow inserting web builds from studio
CREATE POLICY "Allow public insert portfolio_web"
ON public.portfolio_web
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 6. Allow updating web builds (edits, re-order, visibility)
CREATE POLICY "Allow public update portfolio_web"
ON public.portfolio_web
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 7. Allow deleting web builds from studio
CREATE POLICY "Allow public delete portfolio_web"
ON public.portfolio_web
FOR DELETE
TO anon, authenticated
USING (true);

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_web_sort_order ON public.portfolio_web (sort_order DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_web_is_visible ON public.portfolio_web (is_visible);

-- 9. Seed with existing initial 4 websites (if table is newly created)
INSERT INTO public.portfolio_web (
    id, title, tagline, category, badge, "desc", url, display_url, 
    image_url, color, stats, tech_stack, case_study_challenge, case_study_solution, is_visible, sort_order
) VALUES 
(
    'bharatup',
    'BharatUp',
    'A Home for Businesses Building What Comes Next',
    'Enterprise Digital Platform',
    'Business Tech',
    'A high-performance digital presence engineered for business growth, high concurrency, and seamless client engagement.',
    'https://www.bharatup.online/',
    'bharatup.online',
    '/images/web-portfolio/bharatup.jpg',
    '#3b82f6',
    '[{"label":"Page Load Time","value":"0.40s"},{"label":"SEO Score","value":"100%"},{"label":"Conversion Growth","value":"+280%"}]'::jsonb,
    '["Next.js 14","TypeScript","Tailwind CSS","Supabase","PostgreSQL","Framer Motion"]'::jsonb,
    'Building a modern, credible online presence for growing businesses that loads instantly and stands out from standard templates.',
    'We designed a custom, fast website with smooth animations, high-converting layouts, and effortless mobile browsing.',
    true,
    100
),
(
    'pinaka',
    'Pinaka Care Clinic',
    'Skin, Laser & Dermatology Clinic in South Bopal, Ahmedabad',
    'Healthcare & Clinical Web',
    'Healthcare',
    'A modern medical clinic website built to help patients easily discover treatments, view doctor profiles, and book appointments online.',
    'https://www.pinakacareclinic.com/',
    'pinakacareclinic.com',
    '/images/web-portfolio/pinakacare.jpg',
    '#10b981',
    '[{"label":"Page Load Time","value":"0.28s"},{"label":"SEO Score","value":"100%"},{"label":"Conversion Growth","value":"+340%"}]'::jsonb,
    '["Next.js","React 18","Tailwind CSS","Framer Motion","Cloudflare Edge"]'::jsonb,
    'Traditional clinic websites are often cluttered and confusing, making it difficult for patients to quickly book an appointment.',
    'We built a soothing, high-trust website where patients can explore treatments and book a doctor consultation in just a few taps.',
    true,
    90
),
(
    'goatsociety',
    'Goat Society',
    'Authentic Decanted Fragrances & Lifestyle E-Commerce',
    'Luxury Fragrance & Commerce',
    'Luxury E-Com',
    'An online fragrance store featuring authentic luxury perfumes, easy size selection, and smooth mobile checkout.',
    'https://goatsociety.in/',
    'goatsociety.in',
    '/images/web-portfolio/goatsociety.jpg',
    '#f59e0b',
    '[{"label":"Page Load Time","value":"0.35s"},{"label":"SEO Score","value":"100%"},{"label":"Conversion Growth","value":"+220%"}]'::jsonb,
    '["Next.js","Tailwind CSS","Framer Motion","E-Commerce Core","Cloudflare CDN"]'::jsonb,
    'Showcasing luxury perfumes with clear bottle size options without slowing down the shopping experience on phones.',
    'We designed an elegant storefront with crisp product photos, 1-tap size pickers, and a fast, friction-free checkout.',
    true,
    80
),
(
    'rasmlai',
    'Rasmlai AI',
    'A Safe Space to Express Every Emotion • AI Companion for Wellness',
    'AI Companion & Product Web',
    'AI Application',
    'A private, voice-first AI companion website designed to help people express feelings, talk through ideas, and feel supported.',
    'https://rasmlai.vercel.app/',
    'rasmlai.vercel.app',
    '/images/web-portfolio/rasmlai.jpg',
    '#8b5cf6',
    '[{"label":"Page Load Time","value":"0.32s"},{"label":"SEO Score","value":"100%"},{"label":"Conversion Growth","value":"+310%"}]'::jsonb,
    '["Next.js 15","React 19","OpenAI API","Vercel AI SDK","Tailwind CSS"]'::jsonb,
    'Creating a warm, peaceful space where anyone feels safe and comfortable talking with an AI companion.',
    'We built a minimalist, soothing interface with natural voice prompts, fluid transitions, and zero complicated setup steps.',
    true,
    70
)
ON CONFLICT (id) DO NOTHING;

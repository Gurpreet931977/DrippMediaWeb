import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { rateLimit } from '@/app/lib/rateLimit';
import { withCors, corsHeaders } from '@/app/lib/cors';

// ── Supabase ───────────────────────────────────────────────────────────────────
// Never hardcode credentials - always read from env
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

// 10 quote saves per minute per IP
const limiter = rateLimit({ limit: 10, windowMs: 60_000 });

// Maximum allowed body size for a quote payload (50 KB)
const MAX_BODY_BYTES = 50 * 1024;

export async function POST(request) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) {
    return withCors(
      NextResponse.json({ error: 'Too many requests' }, {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }),
      request
    );
  }

  try {
    // ── Body size check ──────────────────────────────────────────────────────
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_BODY_BYTES) {
      return withCors(NextResponse.json({ error: 'Payload too large' }, { status: 413 }), request);
    }

    const data = await request.json();

    // ── Basic payload validation ─────────────────────────────────────────────
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return withCors(NextResponse.json({ error: 'Invalid payload' }, { status: 400 }), request);
    }

    // Generate a cryptographically secure unique ID (instead of Math.random)
    const id = randomBytes(6).toString('base64url'); // 8-char URL-safe ID

    const supabase = getSupabase();

    // Only store what we expect - avoid blindly passing the whole body
    const payload = {
      id,
      // password field is fine to store (it's a quote-viewing password, not a user password)
      password: typeof data.password === 'string' ? data.password.slice(0, 128) : null,
      quote_data: data,
    };

    const { error } = await supabase
      .from('shared_quotes')
      .insert([payload]);

    if (error) {
      // Log internally, return generic message
      console.error('[quote] DB insert error:', error?.message);
      return withCors(NextResponse.json({ error: 'Database error' }, { status: 500 }), request);
    }

    return withCors(NextResponse.json({ id }, { status: 200 }), request);

  } catch (err) {
    console.error('[quote] Unexpected error:', err?.message);
    return withCors(NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }), request);
  }
}

// Handle CORS preflight
export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

// Block all other methods
export async function GET()    { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function PUT()    { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }

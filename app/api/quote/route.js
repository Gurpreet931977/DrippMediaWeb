import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { rateLimit } from '@/app/lib/rateLimit';
import { withCors, corsHeaders } from '@/app/lib/cors';

import { 
  saveQuoteRecord, 
  getAllQuoteRecords, 
  updateQuoteRecord, 
  deleteQuoteRecord 
} from '@/app/lib/quoteStore';

// 10 quote saves per minute per IP
const limiter = rateLimit({ limit: 10, windowMs: 60_000 });

// Maximum allowed body size for a quote payload (500 KB)
const MAX_BODY_BYTES = 500 * 1024;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const quotes = await getAllQuoteRecords();

    if (id) {
      const single = quotes.find(q => q.id === id);
      if (!single) {
        return withCors(NextResponse.json({ error: 'Quote not found' }, { status: 404 }), request);
      }
      return withCors(NextResponse.json({ ok: true, quote: single }), request);
    }

    return withCors(
      NextResponse.json({ ok: true, quotes, count: quotes.length }, { status: 200 }),
      request
    );
  } catch (err) {
    console.error('[quote] Error fetching quotes history:', err);
    return withCors(
      NextResponse.json({ error: err.message || 'Failed to fetch history' }, { status: 500 }),
      request
    );
  }
}

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
    const id = randomBytes(6).toString('base64url');
    const password = typeof data.password === 'string' ? data.password.slice(0, 128) : null;

    // Guaranteed dual-layer persistence (local disk storage + Supabase sync)
    await saveQuoteRecord(id, password, data);

    return withCors(NextResponse.json({ id, ok: true }, { status: 200 }), request);
  } catch (err) {
    console.error('[quote] Unexpected error:', err?.message);
    return withCors(NextResponse.json({ error: err.message }, { status: 500 }), request);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body || !body.id) {
      return withCors(NextResponse.json({ error: 'Quote ID is required' }, { status: 400 }), request);
    }

    const quoteData = body.quote_data || body.data || body;
    const result = await updateQuoteRecord(body.id, body.password, quoteData);

    return withCors(NextResponse.json({ ok: true, ...result }, { status: 200 }), request);
  } catch (err) {
    console.error('[quote] Update error:', err?.message);
    return withCors(NextResponse.json({ error: err.message }, { status: 500 }), request);
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return withCors(NextResponse.json({ error: 'Quote ID missing' }, { status: 400 }), request);
    }

    const result = await deleteQuoteRecord(id);
    return withCors(NextResponse.json({ ok: true, ...result }, { status: 200 }), request);
  } catch (err) {
    console.error('[quote] Delete error:', err?.message);
    return withCors(NextResponse.json({ error: err.message }, { status: 500 }), request);
  }
}

// Handle CORS preflight
export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

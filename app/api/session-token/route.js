/**
 * /api/session-token
 * Issues a signed HMAC token for a game session.
 * The token binds the user's email to the session start timestamp.
 * This is called by the client at game start and must be presented
 * back to /api/submit-score when saving a score.
 */

import { createHmac } from 'crypto';
import { rateLimit } from '@/app/lib/rateLimit';
import { withCors, corsHeaders } from '@/app/lib/cors';

// ── Config ─────────────────────────────────────────────────────────────────────
const HMAC_SECRET = process.env.SCORE_HMAC_SECRET;

if (!HMAC_SECRET) {
  // Fail loudly at startup — never run with a missing secret
  console.error('[session-token] CRITICAL: SCORE_HMAC_SECRET env var is not set. Score integrity is compromised.');
}

function signSessionToken(email, sessionStart) {
  if (!HMAC_SECRET) throw new Error('SCORE_HMAC_SECRET is not configured');
  return createHmac('sha256', HMAC_SECRET)
    .update(`${email}:${sessionStart}`)
    .digest('hex');
}

// 10 token requests per minute per IP — generous enough for game restarts
const limiter = rateLimit({ limit: 10, windowMs: 60_000 });

// ── POST /api/session-token ─────────────────────────────────────────────────────

export async function POST(request) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) {
    return withCors(
      Response.json({ error: 'Too many requests' }, {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }),
      request
    );
  }

  if (!HMAC_SECRET) {
    return withCors(Response.json({ error: 'Server misconfigured' }, { status: 500 }), request);
  }

  try {
    const body = await request.json();
    const { email, sessionStart } = body;

    if (!email || !sessionStart) {
      return withCors(Response.json({ error: 'Missing fields' }, { status: 400 }), request);
    }

    if (typeof email !== 'string' || email.length > 254) {
      return withCors(Response.json({ error: 'Invalid email' }, { status: 400 }), request);
    }

    const sessionTs = parseInt(sessionStart, 10);
    if (isNaN(sessionTs)) {
      return withCors(Response.json({ error: 'Invalid sessionStart' }, { status: 400 }), request);
    }

    // Don't issue tokens for sessions that are already old
    const age = Date.now() - sessionTs;
    if (age > 30000 || age < -5000) {
      return withCors(Response.json({ error: 'Session timestamp out of range' }, { status: 400 }), request);
    }

    const token = signSessionToken(email, sessionTs);
    return withCors(Response.json({ token }), request);
  } catch (err) {
    console.error('[session-token] Unexpected error:', err?.message);
    return withCors(Response.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}

// Handle CORS preflight
export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

// Block all other methods
export async function GET()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function PUT()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }

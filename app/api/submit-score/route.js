/**
 * /api/submit-score
 * Secure server-side score submission endpoint.
 *
 * Security layers:
 *  1. CORS restriction — only drippmedia.com may call this endpoint
 *  2. Rate limiting — max 5 submissions per minute per IP
 *  3. HMAC-SHA256 session token verification – score and server secret are used
 *     to generate a token at session start; that same token must arrive with submission
 *  4. Session age check — token must be fresh (max 2 hours)
 *  5. Server-side sanity caps – score checked against a hard physics maximum
 *  6. Hit-count plausibility – score checked against number of reported catches
 *  7. All Supabase writes happen here (server) – anon key cannot write scores directly
 */

import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';
import { rateLimit } from '@/app/lib/rateLimit';
import { withCors, corsHeaders } from '@/app/lib/cors';
import { verifyAuthToken, extractBearerToken } from '@/app/lib/authToken';
import { signScoreCommit } from '@/app/api/session-token/route';
import { sendHighScoreEmail } from '@/app/lib/email';

// ── Config ─────────────────────────────────────────────────────────────────────
// Score plausibility caps — must match the commit-stage caps in /api/session-token.
// These are the SECOND line of defence; /api/session-token already rejects
// commits for implausible scores, so only a coordinated attack on both endpoints
// simultaneously (or a bug in session-token) would reach these checks.
//
// Dripp Drop: avg ~5 pts/catch at peak, 15 pts/sec server cap.
// Absolute ceiling 50,000 — top legit players currently reach ~23k.
const MAX_PLAUSIBLE_SCORE   = 50000; // matches /api/session-token absolute cap
const MIN_PTS_PER_CATCH     = 0.8;
const MAX_PTS_PER_CATCH     = 70;   // white drops give 69 pts (keep high enough)
const MIN_CATCHES_FOR_NONZERO = 1;

// 5 score submissions per minute per IP
const limiter = rateLimit({ limit: 5, windowMs: 60_000 });

// ── Supabase (server-side, uses service role key) ──────────────────────────────
function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

// ── HMAC helpers ───────────────────────────────────────────────────────────────
const HMAC_SECRET = process.env.SCORE_HMAC_SECRET;

if (!HMAC_SECRET) {
  console.error('[submit-score] CRITICAL: SCORE_HMAC_SECRET env var is not set.');
}

export function signSessionToken(email, sessionStart) {
  if (!HMAC_SECRET) throw new Error('SCORE_HMAC_SECRET is not configured');
  return createHmac('sha256', HMAC_SECRET)
    .update(`${email}:${sessionStart}`)
    .digest('hex');
}

function verifyToken(email, sessionStart, token) {
  if (!HMAC_SECRET) return false;
  const expected = signSessionToken(email, sessionStart);
  // Constant-time comparison to prevent timing attacks
  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(token, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ── POST /api/submit-score ─────────────────────────────────────────────────────

export async function POST(request) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) {
    return withCors(
      Response.json({ error: 'Too many score submissions. Slow down.' }, {
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
    const { email, score, hitCount, sessionStart, token, scoreCommit } = body;

    // ── 0. Identity verification (new) ──────────────────────────────────────
    // The caller must present a valid dripp_auth_token proving they own the email.
    const rawAuthToken = extractBearerToken(request);
    const authResult   = verifyAuthToken(rawAuthToken);
    if (!authResult.ok) {
      console.warn(`[submit-score] Auth token rejected — reason=${authResult.reason} email=${email}`);
      return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }), request);
    }
    // Email in the auth token must match the email in the submission
    if (!email || authResult.email.toLowerCase() !== email.toLowerCase().trim()) {
      console.warn(`[submit-score] Email mismatch — token=${authResult.email} request=${email}`);
      return withCors(Response.json({ error: 'Unauthorized' }, { status: 403 }), request);
    }

    // ── 1. Input presence check ──────────────────────────────────────────────
    if (!email || score === undefined || hitCount === undefined || !sessionStart || !token || !scoreCommit) {
      return withCors(Response.json({ error: 'Missing required fields' }, { status: 400 }), request);
    }

    // ── 2. Type guards ───────────────────────────────────────────────────────
    const scoreNum    = parseInt(score, 10);
    const hitCountNum = parseInt(hitCount, 10);
    const sessionTs   = parseInt(sessionStart, 10);

    if (isNaN(scoreNum) || isNaN(hitCountNum) || isNaN(sessionTs)) {
      return withCors(Response.json({ error: 'Invalid numeric fields' }, { status: 400 }), request);
    }

    if (typeof token !== 'string' || token.length !== 64) {
      return withCors(Response.json({ error: 'Invalid token format' }, { status: 403 }), request);
    }

    if (typeof scoreCommit !== 'string' || scoreCommit.length !== 64) {
      return withCors(Response.json({ error: 'Invalid scoreCommit format' }, { status: 403 }), request);
    }

    // ── 3. HMAC token verification ───────────────────────────────────────────
    if (!verifyToken(email, sessionTs, token)) {
      // Log without revealing which part failed
      console.warn(`[submit-score] Invalid token — email=${email} score=${scoreNum}`);
      return withCors(Response.json({ error: 'Invalid session token' }, { status: 403 }), request);
    }

    // ── 3.5. Score-commit HMAC verification ─────────────────────────────────
    // The scoreCommit token must be an HMAC of email:sessionStart:score:commit
    // issued by /api/session-token in score-commit mode. This proves the server
    // itself blessed this exact score for this exact session — not just any score.
    try {
      const expectedCommit = signScoreCommit(email.toLowerCase().trim(), sessionTs, scoreNum);
      const a = Buffer.from(expectedCommit, 'hex');
      const b = Buffer.from(scoreCommit, 'hex');
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        console.warn(`[submit-score] scoreCommit mismatch — email=${email} score=${scoreNum}`);
        return withCors(Response.json({ error: 'Score commit verification failed' }, { status: 403 }), request);
      }
    } catch {
      console.warn(`[submit-score] scoreCommit verification threw — email=${email}`);
      return withCors(Response.json({ error: 'Score commit verification failed' }, { status: 403 }), request);
    }

    // ── 4. Session age check (token must be fresh, max 2 hours) ─────────────
    const sessionAgeMs = Date.now() - sessionTs;
    if (sessionAgeMs > 2 * 60 * 60 * 1000 || sessionAgeMs < 0) {
      return withCors(Response.json({ error: 'Session token expired' }, { status: 403 }), request);
    }

    // ── 5. Score sanity caps ─────────────────────────────────────────────────
    if (scoreNum < 0 || scoreNum > MAX_PLAUSIBLE_SCORE) {
      console.warn(`[submit-score] Score out of range — email=${email} score=${scoreNum}`);
      return withCors(Response.json({ error: 'Score out of plausible range' }, { status: 400 }), request);
    }

    // ── 5.5 Time-based plausibility check ───────────────────────────────────
    // A drop cannot be caught faster than once per 100ms on any device
    // (100ms = 10 catches/sec — already superhuman for Dripp Drop).
    // We use this as a hard floor to reject impossible hit rates.
    const MIN_MS_PER_HIT = 100;
    const minRequiredTime = hitCountNum * MIN_MS_PER_HIT;
    if (sessionAgeMs < minRequiredTime) {
      console.warn(
        `[submit-score] Impossibly fast score — email=${email}` +
        ` hits=${hitCountNum} time=${sessionAgeMs}ms required=${minRequiredTime}ms` +
        ` score=${scoreNum} (POSSIBLE API MANIPULATION)`
      );
      return withCors(Response.json({ error: 'Score not plausible for session duration' }, { status: 400 }), request);
    }

    // ── 6. Hit-count plausibility check ─────────────────────────────────────
    if (scoreNum > 0) {
      if (hitCountNum < MIN_CATCHES_FOR_NONZERO) {
        console.warn(`[submit-score] Too few catches — email=${email} score=${scoreNum}`);
        return withCors(Response.json({ error: 'Score not plausible for hit count' }, { status: 400 }), request);
      }
      const avgPts = scoreNum / hitCountNum;
      
      // Dynamic max points per catch based on law of large numbers
      const dynamicMaxPts = hitCountNum < 10 ? MAX_PTS_PER_CATCH : 12;

      if (avgPts < MIN_PTS_PER_CATCH || avgPts > dynamicMaxPts) {
        console.warn(`[submit-score] Bad avg pts/catch (${avgPts.toFixed(1)}) — email=${email}`);
        return withCors(Response.json({ error: 'Score not plausible for hit count' }, { status: 400 }), request);
      }
    }

    // ── 7. Only update if it's genuinely a new high score ───────────────────
    const supabase = getServerSupabase();
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('highscore')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('[submit-score] Fetch error:', fetchError?.message);
      return withCors(Response.json({ error: 'Database error' }, { status: 500 }), request);
    }
    
    if (!userData) {
      console.warn(`[submit-score] User not found in DB — email=${email}`);
      return withCors(Response.json({ error: 'User not found' }, { status: 404 }), request);
    }

    const currentHigh = userData.highscore || 0;

    if (scoreNum <= currentHigh) {
      return withCors(Response.json({ ok: true, updated: false, highscore: currentHigh }), request);
    }

    // ── 8. Commit new high score ─────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from('users')
      .update({ highscore: scoreNum })
      .eq('email', email);

    if (updateError) {
      console.error('[submit-score] Update error:', updateError?.message);
      return withCors(Response.json({ error: 'Failed to save score' }, { status: 500 }), request);
    }

    // Send high score email asynchronously
    sendHighScoreEmail(email, scoreNum).catch((err) => {
      console.error('[submit-score] High score email background task failed:', err);
    });

    console.log(`[submit-score] New high score — email=${email} score=${scoreNum} prev=${currentHigh}`);
    return withCors(Response.json({ ok: true, updated: true, highscore: scoreNum }), request);

  } catch (err) {
    console.error('[submit-score] Unexpected error:', err?.message);
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

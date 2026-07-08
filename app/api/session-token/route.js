/**
 * /api/session-token
 * Issues a signed HMAC token for a game session.
 * The token binds the user's email to the session start timestamp.
 * This is called by the client at game start and must be presented
 * back to /api/submit-score when saving a score.
 *
 * Security layers:
 *  1. Rate limiting — 10 requests/min per IP
 *  2. Auth token verification — caller must present a valid dripp_auth_token
 *     issued by /api/auth/login or /api/auth/signup; the email in the token
 *     must match the email in the request body (prevents submitting under
 *     someone else's account)
 *  3. Session age check — sessionStart must be fresh (within 30 s)
 *  4. Score-rate plausibility — in commit mode, the finalScore must be
 *     achievable within the elapsed session time at the game's max drop rate
 *  5. One-time session registry — each session token (email+sessionStart pair)
 *     can only ever produce ONE scoreCommit. Stored in Supabase game_sessions.
 *     This closes the "waiting exploit" where an attacker gets a token and
 *     waits proportionally long to claim an inflated score — they only get
 *     one shot, so it's never worth it.
 *
 * ATTACK VECTORS BLOCKED:
 *  A. Instant fake score  — blocked by rate cap (score must fit elapsed time)
 *  B. Waiting exploit     — blocked by one-time-use registry (one commit per session)
 *  C. Replay attack       — blocked by scoreCommit HMAC binding email+session+score
 *  D. Cross-account abuse — blocked by auth token email ownership check
 */

import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/app/lib/rateLimit';
import { withCors, corsHeaders } from '@/app/lib/cors';
import { verifyAuthToken, extractBearerToken } from '@/app/lib/authToken';

// ── Config ─────────────────────────────────────────────────────────────────────
const HMAC_SECRET = process.env.SCORE_HMAC_SECRET;

if (!HMAC_SECRET) {
  console.error('[session-token] CRITICAL: SCORE_HMAC_SECRET env var is not set. Score integrity is compromised.');
}

/** Signs the session identity token (email + session start) */
export function signSessionToken(email, sessionStart) {
  if (!HMAC_SECRET) throw new Error('SCORE_HMAC_SECRET is not configured');
  return createHmac('sha256', HMAC_SECRET)
    .update(`${email}:${sessionStart}`)
    .digest('hex');
}

/**
 * Signs a score-commit token that binds a specific score to a session.
 * This is generated server-side at submission and prevents replay attacks
 * where a real session token is submitted with a fabricated score.
 */
export function signScoreCommit(email, sessionStart, score) {
  if (!HMAC_SECRET) throw new Error('SCORE_HMAC_SECRET is not configured');
  return createHmac('sha256', HMAC_SECRET)
    .update(`${email}:${sessionStart}:${score}:commit`)
    .digest('hex');
}

// ── Supabase (server-side) ─────────────────────────────────────────────────────
function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// 10 token requests per minute per IP — generous enough for game restarts
const limiter = rateLimit({ limit: 10, windowMs: 60_000 });

// ── Score plausibility constants ───────────────────────────────────────────────
// Dripp Drop: ~80% normal (+1), ~15% red (+5), ~5% white (+69).
// Peak catch rate ~8–12 drops/sec at high intensity; generous server cap = 25 pts/sec.
// This cap means legitimate players scoring at peak intensity are never blocked,
// while an attacker must wait session_score / 25 seconds before committing —
// and even then they only get ONE commit per session (registry check below).
const MAX_SCORE_ABSOLUTE    = 50000; // realistic ceiling for a long session
const MAX_SCORE_RATE_PER_SEC = 25;   // pts/sec — covers burst white-drop streaks

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

  // ── Auth token verification ─────────────────────────────────────────────────
  const rawAuthToken = extractBearerToken(request);
  const authResult   = verifyAuthToken(rawAuthToken);

  if (!authResult.ok) {
    console.warn(`[session-token] Auth token rejected — reason=${authResult.reason}`);
    return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }), request);
  }

  try {
    const body = await request.json();
    const { email, sessionStart, finalScore } = body;

    if (!email || !sessionStart) {
      return withCors(Response.json({ error: 'Missing fields' }, { status: 400 }), request);
    }

    if (typeof email !== 'string' || email.length > 254) {
      return withCors(Response.json({ error: 'Invalid email' }, { status: 400 }), request);
    }

    // ── Email ownership check ─────────────────────────────────────────────────
    if (authResult.email.toLowerCase() !== email.toLowerCase().trim()) {
      console.warn(`[session-token] Email mismatch — token=${authResult.email} request=${email}`);
      return withCors(Response.json({ error: 'Unauthorized' }, { status: 403 }), request);
    }

    const sessionTs   = parseInt(sessionStart, 10);
    const normalEmail = email.toLowerCase().trim();

    if (isNaN(sessionTs)) {
      return withCors(Response.json({ error: 'Invalid sessionStart' }, { status: 400 }), request);
    }

    // ── Score-commit mode ─────────────────────────────────────────────────────
    if (finalScore !== undefined) {
      const scoreNum = parseInt(finalScore, 10);
      if (isNaN(scoreNum) || scoreNum < 0) {
        return withCors(Response.json({ error: 'Invalid finalScore' }, { status: 400 }), request);
      }

      // Session can be up to 2 hours old for commit
      const commitAge = Date.now() - sessionTs;
      if (commitAge > 2 * 60 * 60 * 1000 || commitAge < 0) {
        return withCors(Response.json({ error: 'Session expired for commit' }, { status: 403 }), request);
      }

      // ── Layer A: Score-rate plausibility ──────────────────────────────────
      // Reject scores that are impossible to achieve within the elapsed time.
      // This blocks the "instant commit" attack even before the DB check.
      const maxByRate   = Math.floor((commitAge / 1000) * MAX_SCORE_RATE_PER_SEC);
      const maxPlausible = Math.min(MAX_SCORE_ABSOLUTE, maxByRate);

      if (scoreNum > maxPlausible) {
        console.warn(
          `[session-token] Score-commit rejected (rate cap) — score=${scoreNum}` +
          ` max=${maxPlausible} sessionAge=${Math.round(commitAge/1000)}s email=${normalEmail}`
        );
        return withCors(
          Response.json({ error: 'Score not plausible for session duration' }, { status: 400 }),
          request
        );
      }

      // ── Verify the session HMAC token ─────────────────────────────────────
      const expectedToken = signSessionToken(normalEmail, sessionTs);
      const { sessionToken } = body;
      if (!sessionToken || typeof sessionToken !== 'string' || sessionToken.length !== 64) {
        return withCors(Response.json({ error: 'Missing or invalid session token for commit' }, { status: 400 }), request);
      }
      try {
        const { timingSafeEqual } = await import('crypto');
        const a = Buffer.from(expectedToken, 'hex');
        const b = Buffer.from(sessionToken, 'hex');
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          console.warn(`[session-token] Score-commit session token mismatch — email=${normalEmail}`);
          return withCors(Response.json({ error: 'Invalid session token for commit' }, { status: 403 }), request);
        }
      } catch {
        return withCors(Response.json({ error: 'Invalid session token for commit' }, { status: 403 }), request);
      }

      // ── Layer B: One-time session registry (closes the waiting exploit) ───
      // Each (email, session_start) pair can only ever produce ONE scoreCommit.
      // This means: even if the attacker waits hours to pass the rate cap,
      // they only get one shot per session. A new session always resets the
      // clock, so the waiting exploit is never repeatable at scale.
      const supabase = getServerSupabase();
      if (supabase) {
        try {
          // Atomically mark this session as committed.
          // The WHERE clause (committed = FALSE) ensures this is a no-op if
          // the session was already committed — preventing double-commits.
          const { data: updated, error: updateErr } = await supabase
            .from('game_sessions')
            .update({ committed: true, committed_at: Date.now(), score: scoreNum })
            .eq('email', normalEmail)
            .eq('session_start', sessionTs)
            .eq('committed', false)
            .select('email');

          if (updateErr) {
            // DB error — log but don't block legitimate players
            console.error('[session-token] Session registry update error:', updateErr.message);
          } else if (!updated || updated.length === 0) {
            // Either: session was never registered (token not from our server),
            // or it was already committed (replay/double-submit attempt).
            console.warn(
              `[session-token] Score-commit rejected (one-time-use) — ` +
              `session already committed or not registered — email=${normalEmail} sessionStart=${sessionTs}`
            );
            return withCors(
              Response.json({ error: 'Session already used or invalid' }, { status: 403 }),
              request
            );
          }
        } catch (dbErr) {
          // If registry is unavailable, fall through (don't block legit players)
          console.error('[session-token] Session registry unreachable:', dbErr?.message);
        }
      }

      const scoreCommit = signScoreCommit(normalEmail, sessionTs, scoreNum);
      console.log(`[session-token] Score-commit issued — email=${normalEmail} score=${scoreNum} sessionAge=${Math.round(commitAge/1000)}s`);
      return withCors(Response.json({ scoreCommit }), request);
    }

    // ── Session-start mode ────────────────────────────────────────────────────
    // Don't issue tokens for sessions that are already old.
    const age = Date.now() - sessionTs;
    if (age > 30000 || age < -5000) {
      return withCors(Response.json({ error: 'Session timestamp out of range' }, { status: 400 }), request);
    }

    // ── Register the new session in the DB (best-effort) ─────────────────────
    // This inserts a record so we can enforce one-time-use at commit time.
    // ON CONFLICT DO NOTHING means if the same session_start is re-sent
    // (e.g. page refresh within 30s), we silently ignore the duplicate.
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { error: insertErr } = await supabase
          .from('game_sessions')
          .upsert(
            { email: normalEmail, session_start: sessionTs, issued_at: Date.now(), committed: false },
            { onConflict: 'email,session_start', ignoreDuplicates: true }
          );
        if (insertErr) {
          console.error('[session-token] Session registry insert error:', insertErr.message);
          // Non-fatal — token is still issued; commit will just skip the registry check
        }
      } catch (dbErr) {
        console.error('[session-token] Session registry unreachable on start:', dbErr?.message);
      }
    }

    const token = signSessionToken(normalEmail, sessionTs);
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

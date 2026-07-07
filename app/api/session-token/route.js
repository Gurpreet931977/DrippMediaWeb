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
 *
 * IMPORTANT: The token signs email:sessionStart. At submission, /api/submit-score
 * independently validates this token AND applies server-side score plausibility caps.
 * A score-commit HMAC (signed over email:sessionStart:score) must also be sent to
 * prevent replay attacks where a real token is paired with a fake score.
 */

import { createHmac } from 'crypto';
import { rateLimit } from '@/app/lib/rateLimit';
import { withCors, corsHeaders } from '@/app/lib/cors';
import { verifyAuthToken, extractBearerToken } from '@/app/lib/authToken';

// ── Config ─────────────────────────────────────────────────────────────────────
const HMAC_SECRET = process.env.SCORE_HMAC_SECRET;

if (!HMAC_SECRET) {
  // Fail loudly at startup — never run with a missing secret
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

  // ── Auth token verification ─────────────────────────────────────────────────
  // The caller must present a valid dripp_auth_token issued at login/signup.
  // This proves they actually authenticated — they can't just guess an email.
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
    // The email in the auth token must match the email in the request.
    // This prevents a logged-in user from obtaining tokens for other accounts.
    if (authResult.email.toLowerCase() !== email.toLowerCase().trim()) {
      console.warn(`[session-token] Email mismatch — token=${authResult.email} request=${email}`);
      return withCors(Response.json({ error: 'Unauthorized' }, { status: 403 }), request);
    }

    const sessionTs = parseInt(sessionStart, 10);
    if (isNaN(sessionTs)) {
      return withCors(Response.json({ error: 'Invalid sessionStart' }, { status: 400 }), request);
    }

    // ── Score-commit mode ─────────────────────────────────────────────────────
    // When finalScore is provided, the session is already underway (no freshness check
    // needed — session can be up to 2 hours old). Issue a score-commit token instead.
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
      const normalEmail = email.toLowerCase().trim();
      // Verify the session token was previously issued for this session
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
      const scoreCommit = signScoreCommit(normalEmail, sessionTs, scoreNum);
      console.log(`[session-token] Score-commit issued — email=${normalEmail} score=${scoreNum}`);
      return withCors(Response.json({ scoreCommit }), request);
    }

    // ── Session-start mode ────────────────────────────────────────────────────
    // Don't issue tokens for sessions that are already old
    const age = Date.now() - sessionTs;
    if (age > 30000 || age < -5000) {
      return withCors(Response.json({ error: 'Session timestamp out of range' }, { status: 400 }), request);
    }

    const token = signSessionToken(email.toLowerCase().trim(), sessionTs);
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


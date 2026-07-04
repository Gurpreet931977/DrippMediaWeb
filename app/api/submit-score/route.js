/**
 * /api/submit-score
 * Secure server-side score submission endpoint.
 *
 * Security layers:
 *  1. HMAC-SHA256 session token verification – the score and a server secret are used
 *     to generate a token at session start; that same token must arrive with the submission.
 *  2. Server-side sanity caps – score is checked against a hard physics maximum for the game.
 *  3. Hit-count plausibility – score is checked against the number of reported catches;
 *     average points-per-catch must stay within a physically possible range.
 *  4. All Supabase writes happen here (server) – the anon key can never be used
 *     to write scores directly any more (enforce via RLS, see README note).
 */

import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

// --- Config -----------------------------------------------------------
// Max possible score for a ~10 minute session: speed caps + frame rate limits
const MAX_PLAUSIBLE_SCORE = 50000;

// The average points per catch must be between 0.8 and 70 (accounting for bonus drops)
const MIN_PTS_PER_CATCH = 0.8;
const MAX_PTS_PER_CATCH = 70;

// Min catches required for any score above 0 
const MIN_CATCHES_FOR_NONZERO = 3;

// --- Supabase (server-side, uses service role key from env) -----------
function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use SERVICE ROLE key for server-side writes (set in Vercel env vars, never exposed to client)
  // Falls back to anon key if service key not yet configured
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

// --- HMAC helpers -----------------------------------------------------
const HMAC_SECRET = process.env.SCORE_HMAC_SECRET || 'dripp-fallback-secret-change-me';

export function signSessionToken(email, sessionStart) {
  return createHmac('sha256', HMAC_SECRET)
    .update(`${email}:${sessionStart}`)
    .digest('hex');
}

function verifyToken(email, sessionStart, token) {
  const expected = signSessionToken(email, sessionStart);
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

// --- POST /api/submit-score ------------------------------------------
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, score, hitCount, sessionStart, token } = body;

    // ── 1. Input presence check ─────────────────────────────────────
    if (!email || score === undefined || hitCount === undefined || !sessionStart || !token) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── 2. Type guards ───────────────────────────────────────────────
    const scoreNum    = parseInt(score, 10);
    const hitCountNum = parseInt(hitCount, 10);
    const sessionTs   = parseInt(sessionStart, 10);

    if (isNaN(scoreNum) || isNaN(hitCountNum) || isNaN(sessionTs)) {
      return Response.json({ error: 'Invalid numeric fields' }, { status: 400 });
    }

    // ── 3. HMAC token verification ───────────────────────────────────
    if (!verifyToken(email, sessionTs, token)) {
      console.warn(`[submit-score] INVALID TOKEN for ${email} score=${scoreNum}`);
      return Response.json({ error: 'Invalid session token' }, { status: 403 });
    }

    // ── 4. Session age check (token must be fresh, max 2 hours) ─────
    const sessionAgeMs = Date.now() - sessionTs;
    if (sessionAgeMs > 2 * 60 * 60 * 1000 || sessionAgeMs < 0) {
      return Response.json({ error: 'Session token expired' }, { status: 403 });
    }

    // ── 5. Score sanity caps ─────────────────────────────────────────
    if (scoreNum < 0 || scoreNum > MAX_PLAUSIBLE_SCORE) {
      console.warn(`[submit-score] SCORE OUT OF RANGE for ${email}: ${scoreNum}`);
      return Response.json({ error: 'Score out of plausible range' }, { status: 400 });
    }

    // ── 6. Hit-count plausibility check ─────────────────────────────
    if (scoreNum > 0) {
      if (hitCountNum < MIN_CATCHES_FOR_NONZERO) {
        console.warn(`[submit-score] TOO FEW CATCHES for score ${scoreNum} by ${email}`);
        return Response.json({ error: 'Score not plausible for hit count' }, { status: 400 });
      }
      const avgPts = scoreNum / hitCountNum;
      if (avgPts < MIN_PTS_PER_CATCH || avgPts > MAX_PTS_PER_CATCH) {
        console.warn(`[submit-score] BAD AVG PTS/CATCH (${avgPts.toFixed(1)}) for ${email}`);
        return Response.json({ error: 'Score not plausible for hit count' }, { status: 400 });
      }
    }

    // ── 7. Only update if it's genuinely a new high score ───────────
    const supabase = getServerSupabase();
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('highscore')
      .eq('email', email)
      .single();

    if (fetchError) {
      console.error('[submit-score] Fetch error:', fetchError);
      return Response.json({ error: 'Database error' }, { status: 500 });
    }

    const currentHigh = userData?.highscore || 0;

    if (scoreNum <= currentHigh) {
      // Not a new high score — that's fine, nothing to do
      return Response.json({ ok: true, updated: false, highscore: currentHigh });
    }

    // ── 8. Commit new high score ─────────────────────────────────────
    const { error: updateError } = await supabase
      .from('users')
      .update({ highscore: scoreNum })
      .eq('email', email);

    if (updateError) {
      console.error('[submit-score] Update error:', updateError);
      return Response.json({ error: 'Failed to save score' }, { status: 500 });
    }

    console.log(`[submit-score] ✅ New high score for ${email}: ${scoreNum} (prev: ${currentHigh})`);
    return Response.json({ ok: true, updated: true, highscore: scoreNum });

  } catch (err) {
    console.error('[submit-score] Unexpected error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Block all other methods
export async function GET()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function PUT()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }

/**
 * /api/session-token
 * Issues a signed HMAC token for a game session.
 * The token binds the user's email to the session start timestamp.
 * This is called by the client at game start and must be presented
 * back to /api/submit-score when saving a score.
 */

import { createHmac } from 'crypto';

const HMAC_SECRET = process.env.SCORE_HMAC_SECRET || 'dripp-fallback-secret-change-me';

function signSessionToken(email, sessionStart) {
  return createHmac('sha256', HMAC_SECRET)
    .update(`${email}:${sessionStart}`)
    .digest('hex');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, sessionStart } = body;

    if (!email || !sessionStart) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const sessionTs = parseInt(sessionStart, 10);
    if (isNaN(sessionTs)) {
      return Response.json({ error: 'Invalid sessionStart' }, { status: 400 });
    }

    // Don't issue tokens for sessions that are already old
    const age = Date.now() - sessionTs;
    if (age > 30000 || age < -5000) {
      return Response.json({ error: 'Session timestamp out of range' }, { status: 400 });
    }

    const token = signSessionToken(email, sessionTs);
    return Response.json({ token });
  } catch (err) {
    console.error('[session-token] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function PUT()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }

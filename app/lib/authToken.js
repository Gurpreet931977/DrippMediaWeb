/**
 * authToken.js
 * Issues and verifies a signed HMAC identity token for custom-auth users.
 *
 * The token is issued by /api/auth/login and /api/auth/signup on the server,
 * stored by the client as `dripp_auth_token` in localStorage, and then
 * presented in the Authorization header on calls to:
 *   - /api/session-token
 *   - /api/submit-score
 *
 * This ensures that only someone who actually logged in (and received a valid
 * token from the server) can request a game session token or submit a score
 * under a given email.  No one can forge the token without knowing the server
 * secret (AUTH_SESSION_SECRET).
 *
 * Token format (opaque to client):  base64url( email:issuedAt:hmac )
 * Validity window: AUTH_TOKEN_MAX_AGE_MS (default 24 hours)
 */

import { createHmac, timingSafeEqual } from 'crypto';

const AUTH_SECRET     = process.env.AUTH_SESSION_SECRET;
const MAX_AGE_MS      = 24 * 60 * 60 * 1000; // 24 hours

if (!AUTH_SECRET && typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  console.error(
    '[authToken] CRITICAL: AUTH_SESSION_SECRET env var is not set. ' +
    'Score submission and session token endpoints will reject all requests.'
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function _hmac(email, issuedAt) {
  if (!AUTH_SECRET) throw new Error('AUTH_SESSION_SECRET is not configured');
  return createHmac('sha256', AUTH_SECRET)
    .update(`dripp-auth:${email}:${issuedAt}`)
    .digest('hex');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * issueAuthToken(email)
 * Call on the server after a successful login or signup.
 * Returns an opaque string safe to store in localStorage.
 */
export function issueAuthToken(email) {
  const issuedAt = Date.now();
  const hmac     = _hmac(email, issuedAt);
  const payload  = `${email}:${issuedAt}:${hmac}`;
  return Buffer.from(payload).toString('base64url');
}

/**
 * verifyAuthToken(token)
 * Call on the server before trusting any email from a client request.
 *
 * Returns { ok: true, email } on success.
 * Returns { ok: false, reason } on failure (expired / tampered / missing).
 */
export function verifyAuthToken(token) {
  if (!AUTH_SECRET)   return { ok: false, reason: 'server_misconfigured' };
  if (!token)         return { ok: false, reason: 'missing_token' };

  let payload;
  try {
    payload = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    return { ok: false, reason: 'invalid_token' };
  }

  // Format: email:issuedAt:hmac  (email may contain colons, so split from the right)
  const lastColon       = payload.lastIndexOf(':');
  const secondLastColon = payload.lastIndexOf(':', lastColon - 1);
  if (lastColon === -1 || secondLastColon === -1) {
    return { ok: false, reason: 'invalid_token' };
  }

  const email    = payload.slice(0, secondLastColon);
  const issuedAt = parseInt(payload.slice(secondLastColon + 1, lastColon), 10);
  const received = payload.slice(lastColon + 1);

  if (!email || isNaN(issuedAt)) {
    return { ok: false, reason: 'invalid_token' };
  }

  // Age check
  const age = Date.now() - issuedAt;
  if (age > MAX_AGE_MS || age < -30_000) {
    return { ok: false, reason: 'token_expired' };
  }

  // Constant-time HMAC comparison
  let expected;
  try {
    expected = _hmac(email, issuedAt);
  } catch {
    return { ok: false, reason: 'server_misconfigured' };
  }

  try {
    const a = Buffer.from(received,  'hex');
    const b = Buffer.from(expected,  'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'invalid_token' };
    }
  } catch {
    return { ok: false, reason: 'invalid_token' };
  }

  return { ok: true, email };
}

/**
 * extractBearerToken(request)
 * Pulls the raw token string from the Authorization: Bearer <token> header.
 * Returns null if the header is absent or malformed.
 */
export function extractBearerToken(request) {
  const header = request.headers.get('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

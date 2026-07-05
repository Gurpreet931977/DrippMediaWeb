/**
 * /api/admin/verify
 *
 * Server-side admin session verification.
 * Replaces the client-side localStorage-based auth bypass in admin-panel/layout.jsx.
 *
 * POST { email, token }
 *  - token: a value the client presents (from their dripp_user localStorage or Supabase session)
 *  - The server checks the email against ADMIN_EMAILS env var (server-side, never exposed)
 *  - On success: sets a signed HttpOnly admin_session cookie and returns { ok: true }
 *  - On failure: returns 403
 *
 * GET (with cookie)
 *  - Verifies the existing admin_session cookie
 *  - Returns { ok: true } if valid, 401 if not
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { rateLimit } from '@/app/lib/rateLimit';

const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET;
const ADMIN_EMAILS_RAW = process.env.ADMIN_EMAILS || '';
const COOKIE_NAME = 'dripp_admin_session';
const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

// Rate limit: 10 verify attempts per 15 minutes per IP
const limiter = rateLimit({ limit: 10, windowMs: 15 * 60_000 });

// ── Helpers ────────────────────────────────────────────────────────────────────

function getAdminEmails() {
  return ADMIN_EMAILS_RAW.split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);
}

function signSession(email) {
  if (!ADMIN_SECRET) throw new Error('ADMIN_SESSION_SECRET is not configured');
  return createHmac('sha256', ADMIN_SECRET)
    .update(`admin:${email}:${Math.floor(Date.now() / (SESSION_MAX_AGE * 1000))}`)
    .digest('hex');
}

function verifyCookie(cookieValue) {
  if (!cookieValue || !ADMIN_SECRET) return null;
  try {
    // Cookie format: email|hmac
    const lastPipe = cookieValue.lastIndexOf('|');
    if (lastPipe === -1) return null;
    const email = cookieValue.slice(0, lastPipe);
    const receivedHmac = cookieValue.slice(lastPipe + 1);
    const expectedHmac = signSession(email);

    // Constant-time comparison
    const a = Buffer.from(receivedHmac, 'hex');
    const b = Buffer.from(expectedHmac, 'hex');
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;

    if (!getAdminEmails().includes(email.toLowerCase())) return null;
    return email;
  } catch {
    return null;
  }
}

function buildCookieHeader(email) {
  const hmac = signSession(email);
  const value = `${email}|${hmac}`;
  const flags = [
    `${COOKIE_NAME}=${value}`,
    `Max-Age=${SESSION_MAX_AGE}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
  ];
  // Only add Secure in production — localhost doesn't have HTTPS
  if (process.env.NODE_ENV === 'production') flags.push('Secure');
  return flags.join('; ');
}

// ── GET — verify existing session ──────────────────────────────────────────────

export async function GET(request) {
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) {
    return Response.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const cookieValue = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  const email = verifyCookie(cookieValue);
  if (!email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({ ok: true, email });
}

// ── POST — issue a new admin session ──────────────────────────────────────────

export async function POST(request) {
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) {
    return Response.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }

  if (!ADMIN_SECRET) {
    console.error('[admin/verify] ADMIN_SESSION_SECRET env var not set');
    return Response.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  let email;
  try {
    const body = await request.json();
    email = body?.email?.toLowerCase?.()?.trim?.();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!email) {
    return Response.json({ error: 'Missing email' }, { status: 400 });
  }

  const adminEmails = getAdminEmails();
  if (!adminEmails.includes(email)) {
    // Return same message as a non-admin to avoid email enumeration
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const setCookie = buildCookieHeader(email);
  return Response.json({ ok: true }, {
    status: 200,
    headers: { 'Set-Cookie': setCookie },
  });
}

export async function PUT()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }

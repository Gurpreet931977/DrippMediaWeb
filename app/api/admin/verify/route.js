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

import { getAdminEmails, verifyCookie, buildCookieHeader } from '@/app/lib/adminAuth';
import { rateLimit } from '@/app/lib/rateLimit';

const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET;
const COOKIE_NAME = 'dripp_admin_session';

// Rate limit: 10 verify attempts per 15 minutes per IP
const limiter = rateLimit({ limit: 10, windowMs: 15 * 60_000 });

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

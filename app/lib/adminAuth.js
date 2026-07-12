import { createHmac, timingSafeEqual } from 'crypto';

const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET;
const ADMIN_EMAILS_RAW = process.env.ADMIN_EMAILS || '';
const COOKIE_NAME = 'dripp_admin_session';
const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

export function getAdminEmails() {
  return ADMIN_EMAILS_RAW.split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);
}

export function signSession(email, expiresAt) {
  if (!ADMIN_SECRET) throw new Error('ADMIN_SESSION_SECRET is not configured');
  return createHmac('sha256', ADMIN_SECRET)
    .update(`admin:${email}:${expiresAt}`)
    .digest('hex');
}

export function verifyCookie(cookieValue) {
  if (!cookieValue || !ADMIN_SECRET) return null;
  try {
    const parts = cookieValue.split('|');
    if (parts.length !== 3) return null;
    const [email, expiresAtStr, receivedHmac] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return null;
    }

    const expectedHmac = signSession(email, expiresAt);

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

export function buildCookieHeader(email) {
  const expiresAt = Date.now() + (SESSION_MAX_AGE * 1000);
  const hmac = signSession(email, expiresAt);
  const value = `${email}|${expiresAt}|${hmac}`;
  const flags = [
    `${COOKIE_NAME}=${value}`,
    `Max-Age=${SESSION_MAX_AGE}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
  ];
  if (process.env.NODE_ENV === 'production') flags.push('Secure');
  return flags.join('; ');
}

export function verifyAdminRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieValue = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  return verifyCookie(cookieValue);
}

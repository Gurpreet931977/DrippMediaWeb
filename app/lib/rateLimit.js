/**
 * rateLimit.js
 * In-memory sliding-window rate limiter for Next.js API routes.
 *
 * Usage:
 *   import { rateLimit } from '@/app/lib/rateLimit';
 *
 *   const limiter = rateLimit({ limit: 5, windowMs: 60_000 }); // 5 req/min
 *
 *   export async function POST(request) {
 *     const { ok, retryAfter } = limiter.check(request);
 *     if (!ok) return Response.json({ error: 'Too many requests' }, {
 *       status: 429,
 *       headers: { 'Retry-After': String(retryAfter) }
 *     });
 *     // ... handler logic
 *   }
 *
 * Notes:
 *  - Uses the client's real IP (via x-forwarded-for or x-real-ip).
 *  - The store is module-level so it persists across requests within the same
 *    serverless function instance; resets on cold-start (acceptable trade-off
 *    vs. adding Redis just for rate limiting on a low-traffic site).
 *  - GC runs automatically after each check to keep memory bounded.
 */

/** @type {Map<string, number[]>} — IP → sorted array of request timestamps */
const store = new Map();

/**
 * @param {{ limit: number, windowMs: number }} options
 * @returns {{ check: (request: Request) => { ok: boolean, retryAfter: number } }}
 */
export function rateLimit({ limit = 10, windowMs = 60_000 } = {}) {
  return {
    /**
     * @param {Request} request
     * @returns {{ ok: boolean, retryAfter: number, ip: string }}
     */
    check(request) {
      const ip = getClientIp(request);
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get or init the bucket for this IP
      let timestamps = store.get(ip) || [];

      // Drop entries outside the current window (sliding)
      timestamps = timestamps.filter((t) => t > windowStart);

      if (timestamps.length >= limit) {
        // Oldest request in the window — that's when the slot frees up
        const oldest = timestamps[0];
        const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
        store.set(ip, timestamps);
        return { ok: false, retryAfter: Math.max(retryAfter, 1), ip };
      }

      timestamps.push(now);
      store.set(ip, timestamps);

      // Periodic GC — clean up IPs with no recent requests
      if (Math.random() < 0.02) {
        for (const [key, ts] of store.entries()) {
          if (!ts.some((t) => t > windowStart)) store.delete(key);
        }
      }

      return { ok: true, retryAfter: 0, ip };
    },
  };
}

/**
 * Extract the real client IP from Next.js request headers.
 * Vercel sets x-forwarded-for; falls back to x-real-ip then 'unknown'.
 */
function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return 'unknown';
}

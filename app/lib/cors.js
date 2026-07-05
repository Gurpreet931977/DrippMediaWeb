/**
 * cors.js
 * CORS helper for Next.js API Route Handlers.
 *
 * Usage (in any route.js):
 *   import { withCors, corsHeaders } from '@/app/lib/cors';
 *
 *   // Add headers to an existing Response:
 *   return withCors(Response.json({ ok: true }), request);
 *
 *   // Handle OPTIONS preflight:
 *   export async function OPTIONS(request) {
 *     return new Response(null, { status: 204, headers: corsHeaders(request) });
 *   }
 */

const ALLOWED_ORIGINS =
  process.env.NODE_ENV === 'production'
    ? ['https://drippmedia.com', 'https://www.drippmedia.com']
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
      ];

/**
 * Returns the appropriate CORS headers for a given request.
 * If the origin is not in the allowlist, no Access-Control-Allow-Origin is set
 * (which causes the browser to block the request — correct behaviour).
 *
 * @param {Request} request
 * @returns {Record<string, string>}
 */
export function corsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

/**
 * Wraps an existing Response with the correct CORS headers.
 *
 * @param {Response} response
 * @param {Request} request
 * @returns {Response}
 */
export function withCors(response, request) {
  const headers = corsHeaders(request);
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(headers)) {
    newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

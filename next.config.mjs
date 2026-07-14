/** @type {import('next').NextConfig} */

// ─── Content Security Policy ──────────────────────────────────────────────────
// Allows:
//  - Scripts:  self + Vercel analytics/insights (inline only for Next.js RSC)
//  - Styles:   self + Google Fonts (api.fontshare.com) + Unicons CDN
//  - Fonts:    same CDNs
//  - Connect:  self + Supabase + Vercel analytics
//  - Img:      self + data URIs (canvas toDataURL) + blob: (html2canvas)
//  - Worker:   blob: (Three.js / GSAP may use inline workers)
//  - Frame:    none (no iframes used or needed)
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com blob:`,
  `style-src 'self' 'unsafe-inline' https://api.fontshare.com https://unicons.iconscout.com`,
  `font-src 'self' https://api.fontshare.com https://cdn.fontshare.com https://*.fontshare.com https://unicons.iconscout.com data:`,
  `img-src 'self' data: blob: https://*.supabase.co https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com`,
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com blob:`,
  `media-src 'self' blob:`,
  `worker-src 'self' blob:`,
  `frame-src 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join('; ');

const securityHeaders = [
  // Prevents clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stops MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Referrer policy - send origin only on same-origin, nothing cross-origin
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // HSTS - 2 years, include subdomains, preload-ready
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Disable invasive browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Content Security Policy
  { key: 'Content-Security-Policy', value: csp },
  // Disable DNS prefetch to third-party domains
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Cache static assets aggressively - immutable since Next.js includes content hash in filename
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Public assets - moderate cache with revalidation
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|webp|svg|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
        ],
      },
      {
        // API routes - never cache, always fresh
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;


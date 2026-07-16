export default function sitemap() {
  const baseUrl = 'https://www.drippmedia.com';

  // Use a static recent date for cache stability — update when content changes
  const lastModified = new Date('2026-07-16');

  return [
    // ── Homepage ───────────────────────────────────────────────────────────────
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },

    // ── Web Development Portfolio ──────────────────────────────────────────────
    {
      url: `${baseUrl}/web-portfolio`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },

    // ── Video Portfolio ────────────────────────────────────────────────────────
    {
      url: `${baseUrl}/video-portfolio`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/video-portfolio/long-form`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/video-portfolio/short-form`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // ── Graphic Design & Photography Portfolio ─────────────────────────────────
    {
      url: `${baseUrl}/graphic-portfolio`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },

    // ── Orlo AI ────────────────────────────────────────────────────────────────
    {
      url: `${baseUrl}/orloai`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // ── Get a Quote ────────────────────────────────────────────────────────────
    {
      url: `${baseUrl}/quote`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}

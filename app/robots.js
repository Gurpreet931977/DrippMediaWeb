export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin-panel/', '/api/', '/invoice/'],
    },
    sitemap: 'https://drippmedia.com/sitemap.xml',
  }
}

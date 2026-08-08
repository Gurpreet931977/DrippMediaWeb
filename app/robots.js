export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dripp-studio/', '/api/', '/invoice/'],
      }
    ],
    sitemap: 'https://www.drippmedia.com/sitemap.xml',
    host: 'https://www.drippmedia.com',
  }
}

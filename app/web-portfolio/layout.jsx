// Server Component — exports metadata for /web-portfolio
export const metadata = {
  title: 'Web Development Portfolio | Dripp Media',
  description: 'Explore Dripp Media\'s web development portfolio — custom websites, e-commerce stores, SaaS platforms, Next.js apps, and interactive digital experiences built for global brands.',
  keywords: [
    'web development portfolio', 'website portfolio', 'web design portfolio',
    'custom website development', 'Next.js portfolio', 'React JS projects',
    'e-commerce website portfolio', 'Shopify development portfolio',
    'SaaS website design', 'startup website examples', 'web app portfolio',
    'best web development agency portfolio', 'interactive website design',
    '3D website portfolio', 'UI UX web design portfolio', 'full stack web development',
    'web development agency India', 'web design agency portfolio',
    'Dripp Media web development', 'Dripp Media website portfolio',
  ],
  alternates: {
    canonical: 'https://www.drippmedia.com/web-portfolio',
  },
  openGraph: {
    title: 'Web Development Portfolio | Dripp Media',
    description: 'See the websites and web applications Dripp Media has built — from sleek startup sites to complex e-commerce and SaaS platforms.',
    url: 'https://www.drippmedia.com/web-portfolio',
    siteName: 'Dripp Media',
    type: 'website',
    images: [
      {
        url: 'https://www.drippmedia.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Dripp Media Web Development Portfolio',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Development Portfolio | Dripp Media',
    description: 'Custom websites, e-commerce stores, SaaS platforms, and web apps built by Dripp Media.',
    images: ['https://www.drippmedia.com/twitter-image.png'],
  },
};

// Structured Data for Web Portfolio
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.drippmedia.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Web Development Portfolio",
      "item": "https://www.drippmedia.com/web-portfolio"
    }
  ]
};

const webServiceSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://www.drippmedia.com/web-portfolio",
  "name": "Web Development Portfolio — Dripp Media",
  "description": "Portfolio of custom websites, web applications, e-commerce stores, and SaaS platforms built by Dripp Media.",
  "url": "https://www.drippmedia.com/web-portfolio",
  "breadcrumb": { "@id": "https://www.drippmedia.com/web-portfolio#breadcrumb" },
  "about": {
    "@type": "Service",
    "name": "Web Development",
    "provider": {
      "@type": "Organization",
      "name": "Dripp Media",
      "url": "https://www.drippmedia.com"
    }
  },
  "inLanguage": "en-US"
};

export default function WebPortfolioLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webServiceSchema) }}
      />
      {children}
    </>
  );
}

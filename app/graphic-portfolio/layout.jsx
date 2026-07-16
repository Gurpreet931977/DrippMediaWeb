// Server Component — exports metadata for /graphic-portfolio
export const metadata = {
  title: 'Graphic Design & Branding Portfolio | Dripp Media',
  description: 'Browse Dripp Media\'s graphic design portfolio — logo design, brand identity, motion graphics, UI/UX design, poster design, packaging, and complete visual branding for global clients.',
  keywords: [
    'graphic design portfolio', 'logo design portfolio', 'brand identity portfolio',
    'branding portfolio', 'motion graphics portfolio', 'UI UX design portfolio',
    'poster design examples', 'packaging design portfolio', 'visual identity portfolio',
    'graphic design agency India', 'logo design agency India', 'brand design examples',
    'rebranding portfolio', 'typography design', 'illustration portfolio',
    'pitch deck design', 'infographic design', 'brand guidelines portfolio',
    'Dripp Media graphic design', 'Dripp Media branding portfolio',
    'best graphic design agency India', 'creative agency branding portfolio',
    'photography portfolio', 'commercial photography portfolio', 'brand photography',
    'product photography portfolio', 'event photography portfolio',
  ],
  alternates: {
    canonical: 'https://www.drippmedia.com/graphic-portfolio',
  },
  openGraph: {
    title: 'Graphic Design & Branding Portfolio | Dripp Media',
    description: 'See Dripp Media\'s creative work — logos, brand identities, motion graphics, UI/UX, photography, and more for brands worldwide.',
    url: 'https://www.drippmedia.com/graphic-portfolio',
    siteName: 'Dripp Media',
    type: 'website',
    images: [
      {
        url: 'https://www.drippmedia.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Dripp Media Graphic Design & Branding Portfolio',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Graphic Design & Branding Portfolio | Dripp Media',
    description: 'Logos, brand identities, motion graphics, UI/UX design, photography — creative work by Dripp Media.',
    images: ['https://www.drippmedia.com/twitter-image.png'],
  },
};

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
      "name": "Graphic Design Portfolio",
      "item": "https://www.drippmedia.com/graphic-portfolio"
    }
  ]
};

const graphicCollectionSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://www.drippmedia.com/graphic-portfolio",
  "name": "Graphic Design & Branding Portfolio — Dripp Media",
  "description": "Portfolio of logo design, brand identity, motion graphics, UI/UX design, photography, and creative visual work by Dripp Media.",
  "url": "https://www.drippmedia.com/graphic-portfolio",
  "inLanguage": "en-US",
  "about": {
    "@type": "Service",
    "name": "Graphic Design, Photography & Branding",
    "provider": {
      "@type": "Organization",
      "name": "Dripp Media",
      "url": "https://www.drippmedia.com"
    }
  }
};

export default function GraphicPortfolioLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graphicCollectionSchema) }}
      />
      {children}
    </>
  );
}

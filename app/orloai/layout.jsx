// Server Component — exports metadata for /orloai
export const metadata = {
  title: 'Orlo AI — Creative AI Assistant by Dripp Media',
  description: 'Meet Orlo AI — Dripp Media\'s intelligent creative assistant. Get instant answers about web development, video editing, graphic design, photography, social media, and Dripp Media\'s services.',
  keywords: [
    'Orlo AI', 'Dripp Media AI', 'creative AI assistant', 'AI for creative agency',
    'AI web development assistant', 'AI design assistant', 'Dripp Media Orlo',
    'creative agency AI tool', 'AI assistant for brands',
  ],
  alternates: {
    canonical: 'https://www.drippmedia.com/orloai',
  },
  openGraph: {
    title: 'Orlo AI — Creative AI Assistant by Dripp Media',
    description: 'Dripp Media\'s AI assistant Orlo — your intelligent guide to creative agency services, web development, video editing, and more.',
    url: 'https://www.drippmedia.com/orloai',
    siteName: 'Dripp Media',
    type: 'website',
    images: [
      {
        url: 'https://www.drippmedia.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Orlo AI by Dripp Media',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orlo AI — Creative AI Assistant by Dripp Media',
    description: 'Ask Orlo anything about Dripp Media\'s creative services.',
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
      "name": "Orlo AI",
      "item": "https://www.drippmedia.com/orloai"
    }
  ]
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Orlo AI",
  "alternateName": "Orlo",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://www.drippmedia.com/orloai",
  "description": "Orlo is Dripp Media's AI-powered creative assistant that helps users explore services, get instant answers, and connect with the agency.",
  "author": {
    "@type": "Organization",
    "name": "Dripp Media",
    "url": "https://www.drippmedia.com"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export default function OrloAILayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      {children}
    </>
  );
}

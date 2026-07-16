// Server Component — exports metadata for /video-portfolio
export const metadata = {
  title: 'Video Editing & Production Portfolio | Dripp Media',
  description: 'Watch Dripp Media\'s video editing and production portfolio — YouTube long-form, Instagram reels, brand films, commercial ads, cinematic videography, and social media content for global brands.',
  keywords: [
    'video editing portfolio', 'video production portfolio', 'video editing agency portfolio',
    'YouTube video editing examples', 'Instagram reel editing portfolio',
    'short form video portfolio', 'long form video portfolio',
    'brand video production', 'commercial video portfolio', 'cinematic videography portfolio',
    'video editing services India', 'social media video examples',
    'reel editing agency', 'video editor for hire', 'video post production portfolio',
    'color grading examples', 'motion graphics portfolio',
    'Dripp Media video editing', 'Dripp Media video portfolio',
    'best video editing agency India', 'hire video editor India',
  ],
  alternates: {
    canonical: 'https://www.drippmedia.com/video-portfolio',
  },
  openGraph: {
    title: 'Video Editing & Production Portfolio | Dripp Media',
    description: 'Explore Dripp Media\'s video work — reels, brand films, YouTube content, commercials, and cinematic productions for brands worldwide.',
    url: 'https://www.drippmedia.com/video-portfolio',
    siteName: 'Dripp Media',
    type: 'website',
    images: [
      {
        url: 'https://www.drippmedia.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Dripp Media Video Editing & Production Portfolio',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video Editing & Production Portfolio | Dripp Media',
    description: 'Reels, brand films, YouTube content, commercials — professional video editing by Dripp Media.',
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
      "name": "Video Portfolio",
      "item": "https://www.drippmedia.com/video-portfolio"
    }
  ]
};

const videoCollectionSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://www.drippmedia.com/video-portfolio",
  "name": "Video Editing & Production Portfolio — Dripp Media",
  "description": "Portfolio of video editing, production, reels, and commercial video work by Dripp Media.",
  "url": "https://www.drippmedia.com/video-portfolio",
  "inLanguage": "en-US",
  "about": {
    "@type": "Service",
    "name": "Video Editing & Videography",
    "provider": {
      "@type": "Organization",
      "name": "Dripp Media",
      "url": "https://www.drippmedia.com"
    }
  }
};

export default function VideoPortfolioLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoCollectionSchema) }}
      />
      {children}
    </>
  );
}

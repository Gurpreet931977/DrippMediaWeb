// Server Component — exports metadata for /video-portfolio/short-form
export const metadata = {
  title: 'Short-Form & Reel Editing Portfolio | Dripp Media',
  description: 'Dripp Media\'s short-form video editing portfolio — Instagram reels, YouTube Shorts, TikTok videos, viral social media content, and promotional clips for brands worldwide.',
  keywords: [
    'short form video editing', 'Instagram reel editing portfolio', 'reel editor portfolio',
    'YouTube Shorts editing', 'TikTok video editing', 'viral reel editing agency',
    'social media video editing', 'promotional video editing', 'short form content agency',
    'reel editing services India', 'hire reel editor', 'Instagram video editor',
    'Dripp Media reel editing', 'short form video agency India',
  ],
  alternates: {
    canonical: 'https://www.drippmedia.com/video-portfolio/short-form',
  },
  openGraph: {
    title: 'Short-Form & Reel Editing Portfolio | Dripp Media',
    description: 'Instagram reels, YouTube Shorts, TikTok videos, and viral social media content — short-form video editing by Dripp Media.',
    url: 'https://www.drippmedia.com/video-portfolio/short-form',
    siteName: 'Dripp Media',
    type: 'website',
    images: [{ url: 'https://www.drippmedia.com/opengraph-image.png', width: 1200, height: 630, alt: 'Dripp Media Short-Form Video Portfolio' }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.drippmedia.com" },
    { "@type": "ListItem", "position": 2, "name": "Video Portfolio", "item": "https://www.drippmedia.com/video-portfolio" },
    { "@type": "ListItem", "position": 3, "name": "Short-Form", "item": "https://www.drippmedia.com/video-portfolio/short-form" }
  ]
};

export default function ShortFormLayout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}

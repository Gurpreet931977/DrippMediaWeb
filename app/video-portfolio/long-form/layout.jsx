// Server Component — exports metadata for /video-portfolio/long-form
export const metadata = {
  title: 'Long-Form Video Editing Portfolio | Dripp Media',
  description: 'Dripp Media\'s long-form video editing portfolio — YouTube videos, brand documentaries, corporate films, podcast video editing, and cinematic long-form content for global brands.',
  keywords: [
    'long form video editing', 'YouTube video editing portfolio', 'long form video portfolio',
    'brand documentary editing', 'corporate video editing', 'podcast video editing',
    'YouTube video editor for hire', 'long form content editing agency',
    'cinematic video editing', 'video post production long form',
    'Dripp Media long form video', 'video editing agency India',
  ],
  alternates: {
    canonical: 'https://www.drippmedia.com/video-portfolio/long-form',
  },
  openGraph: {
    title: 'Long-Form Video Editing Portfolio | Dripp Media',
    description: 'YouTube videos, brand documentaries, corporate films, and cinematic long-form content — edited by Dripp Media.',
    url: 'https://www.drippmedia.com/video-portfolio/long-form',
    siteName: 'Dripp Media',
    type: 'website',
    images: [{ url: 'https://www.drippmedia.com/opengraph-image.png', width: 1200, height: 630, alt: 'Dripp Media Long-Form Video Portfolio' }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.drippmedia.com" },
    { "@type": "ListItem", "position": 2, "name": "Video Portfolio", "item": "https://www.drippmedia.com/video-portfolio" },
    { "@type": "ListItem", "position": 3, "name": "Long-Form", "item": "https://www.drippmedia.com/video-portfolio/long-form" }
  ]
};

export default function LongFormLayout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}

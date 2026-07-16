import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  metadataBase: new URL('https://www.drippmedia.com'),
  title: {
    default: 'Dripp Media | Creative & Digital Branding Agency',
    template: '%s | Dripp Media'
  },
  description: 'Dripp Media is a global creative & digital branding agency offering web development, video editing, videography, photography, social media management, and graphic design. Serving clients worldwide from India.',
  keywords: [
    // ── Brand Name Variants (all spellings) ──────────────────────────────────
    'Dripp Media', 'drip media', 'dripmedia', 'drippmedia', 'drippmedia.com',
    'drip media agency', 'Dripp Agency', 'The Dripp Agency', 'dripp',
    'drippmedia agency', 'drip media india', 'DripMedia', 'DrippMedia',

    // ── Core Service: Web Development ─────────────────────────────────────────
    'web development agency', 'website development company', 'custom website development',
    'web design agency', 'web development India', 'best web development company',
    'Next.js development agency', 'React JS development company', 'full stack development agency',
    'e-commerce website development', 'Shopify development agency', 'SaaS website design',
    'startup website development', 'corporate website design', 'high conversion landing pages',
    'custom web application development', 'mobile responsive web design', 'UI UX web design',
    'WordPress development agency', 'Webflow development', 'headless CMS development',
    'interactive website design', '3D website development', 'WebGL website',
    'web development for small business', 'web development for startups', 'web agency near me',
    'affordable web development', 'premium website development', 'bespoke web development',

    // ── Core Service: Video Editing ───────────────────────────────────────────
    'video editing agency', 'professional video editing', 'video editing services',
    'YouTube video editing', 'Instagram reel editing', 'short form video editing',
    'long form video editing', 'viral reel editing', 'social media video editing',
    'brand video editing', 'cinematic video editing', 'motion graphics video',
    'podcast video editing', 'product video editing', 'promotional video editing',
    'video post production services', 'color grading services', 'video editing outsourcing',
    'hire video editor online', 'remote video editing team', 'video editor for hire',

    // ── Core Service: Videography ─────────────────────────────────────────────
    'videography services', 'commercial videography', 'brand videography',
    'corporate video production', 'product videography', 'event videography',
    'wedding videography', 'music video production', 'ad film production',
    'documentary video production', 'cinematic videography', 'drone videography',
    'video production company', 'video production agency India', 'corporate filmmaker',

    // ── Core Service: Photography ─────────────────────────────────────────────
    'photography services', 'commercial photography', 'brand photography',
    'product photography', 'event photography', 'corporate photography',
    'e-commerce product photography', 'lifestyle photography', 'portrait photography',
    'food photography agency', 'real estate photography', 'fashion photography',
    'professional photographer hire', 'photographer for brand', 'photography agency India',

    // ── Core Service: Social Media Management ────────────────────────────────
    'social media management agency', 'social media marketing agency',
    'Instagram management agency', 'social media content creation',
    'social media strategy agency', 'Facebook page management',
    'LinkedIn social media management', 'social media growth agency',
    'social media manager for hire', 'brand social media management',
    'social media marketing India', 'social media agency for startups',
    'influencer marketing agency', 'content marketing agency',
    'community management services', 'social media advertising agency',

    // ── Core Service: Graphic Design ──────────────────────────────────────────
    'graphic design agency', 'graphic design services', 'logo design agency',
    'brand identity design', 'branding agency', 'creative agency',
    'poster design agency', 'packaging design', 'motion graphic design',
    'UI UX design agency', 'print design services', 'typography design',
    'illustration services', 'infographic design', 'pitch deck design',
    'rebranding agency', 'visual identity design', 'brand guidelines design',

    // ── Premium & Luxury Positioning ─────────────────────────────────────────
    'premium creative agency', 'luxury digital agency', 'luxury branding agency',
    'boutique creative agency', 'high-end digital agency', 'award winning creative agency',
    'top rated digital agency', 'best creative agency in India',

    // ── High-Intent Buyer Searches ────────────────────────────────────────────
    'hire web developer India', 'hire video editor India', 'hire graphic designer India',
    'hire photographer India', 'hire social media manager', 'outsource creative services India',
    'creative agency for brands', 'digital agency for startups', 'agency for D2C brands',
    'agency for ecommerce brands', 'agency for tech startups', 'agency for real estate',
    'agency for hospitality', 'agency for fashion brands', 'agency for restaurants',

    // ── Geo: Dehradun (HQ) ────────────────────────────────────────────────────
    'creative agency Dehradun', 'web development Dehradun', 'digital marketing Dehradun',
    'best agency Dehradun', 'video production Dehradun', 'photographer Dehradun',
    'graphic designer Dehradun', 'social media agency Dehradun', 'branding Dehradun',

    // ── Geo: Delhi NCR ────────────────────────────────────────────────────────
    'web development Delhi', 'creative agency Delhi', 'digital marketing Delhi NCR',
    'branding agency Delhi', 'video production Delhi', 'graphic design Delhi',
    'photography agency Delhi', 'social media management Delhi',

    // ── Geo: Mumbai ───────────────────────────────────────────────────────────
    'digital marketing Mumbai', 'creative agency Mumbai', 'web development Mumbai',
    'branding agency Mumbai', 'video production Mumbai', 'photography Mumbai',
    'graphic design agency Mumbai', 'social media agency Mumbai',

    // ── Geo: Bangalore ────────────────────────────────────────────────────────
    'branding agency Bangalore', 'web development Bangalore', 'creative agency Bengaluru',
    'digital marketing Bangalore', 'graphic design Bangalore', 'video editing Bangalore',

    // ── Geo: Other Indian Cities ──────────────────────────────────────────────
    'creative agency Jaipur', 'web development Pune', 'creative agency Hyderabad',
    'digital marketing Chennai', 'digital agency Ahmedabad', 'creative agency Kolkata',
    'web development Chandigarh', 'branding agency Lucknow',

    // ── Geo: Global — US & Canada ─────────────────────────────────────────────
    'web development agency USA', 'creative agency NYC', 'digital marketing San Francisco',
    'video production Los Angeles', 'web design Austin', 'branding agency Miami',
    'digital marketing Chicago', 'web development Toronto', 'creative agency Vancouver',

    // ── Geo: Global — UK & Europe ─────────────────────────────────────────────
    'digital marketing London', 'creative agency Manchester', 'web development Berlin',
    'branding agency Amsterdam', 'digital agency Paris', 'creative studio Dublin',

    // ── Geo: Global — Middle East & Asia ─────────────────────────────────────
    'creative agency Dubai', 'web development Abu Dhabi', 'branding agency Riyadh',
    'digital marketing Doha', 'creative agency Singapore', 'web development agency Australia',
    'creative agency Melbourne', 'digital marketing Sydney',

    // ── Offshore / Outsourcing ────────────────────────────────────────────────
    'offshore creative agency India', 'outsource web development India',
    'outsource video editing India', 'outsource graphic design India',
    'offshore digital agency', 'hire remote creative team India',
    'best Indian agency for international clients',
  ],
  authors: [{ name: 'Dripp Media', url: 'https://www.drippmedia.com' }],
  creator: 'Dripp Media',
  publisher: 'Dripp Media',
  openGraph: {
    title: 'Dripp Media | Creative & Digital Branding Agency',
    description: 'Dripp Media is a global creative & digital branding agency offering web development, video editing, videography, photography, social media management, and graphic design.',
    url: 'https://www.drippmedia.com',
    siteName: 'Dripp Media',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.drippmedia.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Dripp Media - Creative & Digital Branding Agency',
      }
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dripp Media | Creative & Digital Branding Agency',
    description: 'Web development, video editing, videography, photography, social media management & graphic design — all under one roof. Global creative agency.',
    creator: '@drippmedia_',
    site: '@drippmedia_',
    images: ['https://www.drippmedia.com/twitter-image.png'],
  },
  alternates: {
    canonical: 'https://www.drippmedia.com',
    languages: {
      'en': 'https://www.drippmedia.com',
      'x-default': 'https://www.drippmedia.com',
    },
  },
  applicationName: 'Dripp Media',
  category: 'Creative Agency, Digital Branding, Web Development',
  classification: 'Business',
  referrer: 'origin-when-cross-origin',
  other: {
    'geo.region': 'IN-UK',
    'geo.placename': 'Dehradun, Uttarakhand, India',
    'geo.position': '30.3165;78.0322',
    'ICBM': '30.3165, 78.0322',
    'rating': 'general',
    'revisit-after': '7 days',
    'language': 'English',
    'target': 'all',
    'HandheldFriendly': 'True',
    'MobileOptimized': '320',
  },
};

// ─── Structured Data ─────────────────────────────────────────────────────────

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "ProfessionalService"],
  "@id": "https://www.drippmedia.com/#organization",
  "name": "Dripp Media",
  "alternateName": ["Drip Media", "DrippMedia", "Dripmedia", "drippmedia", "DripMedia"],
  "url": "https://www.drippmedia.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://www.drippmedia.com/icon.png",
    "width": 512,
    "height": 512
  },
  "image": "https://www.drippmedia.com/opengraph-image.png",
  "description": "Dripp Media (also known as Drip Media or DrippMedia) is a premium global creative & digital branding agency offering web development, video editing, videography, photography, social media management, and graphic design.",
  "foundingDate": "2023",
  "priceRange": "$$",
  "telephone": "+91-78189-95147",
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+91-78189-95147",
      "contactType": "customer service",
      "availableLanguage": ["English", "Hindi"],
      "areaServed": "Worldwide"
    },
    {
      "@type": "ContactPoint",
      "telephone": "+91-78189-95147",
      "contactType": "sales",
      "availableLanguage": ["English", "Hindi"],
      "areaServed": "Worldwide"
    }
  ],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Dehradun",
    "addressRegion": "Uttarakhand",
    "postalCode": "248001",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 30.3165,
    "longitude": 78.0322
  },
  "sameAs": [
    "https://www.instagram.com/drippmedia_",
    "https://drippmedia.com"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Dripp Media Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Web Development",
          "description": "Custom website development, e-commerce, Next.js, React, SaaS, and web applications."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Video Editing",
          "description": "Professional video editing for YouTube, Instagram reels, brand videos, and commercial content."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Videography",
          "description": "Commercial, corporate, product, and event videography with cinematic production quality."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Photography",
          "description": "Brand, product, event, corporate, and commercial photography services."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Social Media Management",
          "description": "Full-service social media management, content creation, strategy, and growth for brands."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Graphic Design",
          "description": "Logo design, brand identity, motion graphics, UI/UX design, poster, and packaging design."
        }
      }
    ]
  },
  "areaServed": [
    { "@type": "Country", "name": "India" },
    { "@type": "Country", "name": "United States" },
    { "@type": "Country", "name": "United Kingdom" },
    { "@type": "Country", "name": "United Arab Emirates" },
    { "@type": "Country", "name": "Australia" },
    { "@type": "Country", "name": "Canada" },
    { "@type": "Country", "name": "Germany" },
    { "@type": "Country", "name": "Singapore" },
    { "@type": "Country", "name": "Saudi Arabia" },
    { "@type": "Country", "name": "Netherlands" },
    { "@type": "AdministrativeArea", "name": "Dehradun, Uttarakhand" },
    { "@type": "AdministrativeArea", "name": "Delhi NCR" },
    { "@type": "AdministrativeArea", "name": "Mumbai" },
    { "@type": "AdministrativeArea", "name": "Bangalore" }
  ],
  "knowsAbout": [
    "Web Development", "Video Editing", "Videography", "Photography",
    "Social Media Management", "Graphic Design", "Brand Identity",
    "UI/UX Design", "Motion Graphics", "Digital Branding", "Performance Marketing"
  ]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.drippmedia.com/#website",
  "name": "Dripp Media",
  "alternateName": ["Drip Media", "DrippMedia", "Dripmedia", "DripMedia"],
  "url": "https://www.drippmedia.com",
  "description": "Dripp Media — global creative & digital branding agency.",
  "inLanguage": "en-US",
  "publisher": { "@id": "https://www.drippmedia.com/#organization" },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.drippmedia.com/?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

const servicesSchema = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Web Development",
    "alternateName": ["website development", "web design", "custom web development"],
    "provider": { "@id": "https://www.drippmedia.com/#organization" },
    "description": "Dripp Media builds premium custom websites, web applications, e-commerce stores (Shopify, WooCommerce), SaaS platforms, and interactive digital experiences using Next.js and React.",
    "url": "https://www.drippmedia.com/web-portfolio",
    "serviceType": "Web Development",
    "areaServed": "Worldwide",
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": "https://www.drippmedia.com/quote"
    },
    "keywords": "web development, website design, Next.js, React, e-commerce, Shopify, SaaS, full stack"
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Video Editing",
    "alternateName": ["video post production", "video editing services"],
    "provider": { "@id": "https://www.drippmedia.com/#organization" },
    "description": "Professional video editing services including YouTube long-form, Instagram short-form reels, brand films, commercial ads, color grading, and motion graphics for brands worldwide.",
    "url": "https://www.drippmedia.com/video-portfolio",
    "serviceType": "Video Editing",
    "areaServed": "Worldwide",
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": "https://www.drippmedia.com/quote"
    },
    "keywords": "video editing, YouTube video editor, Instagram reel editing, short form video, long form video, brand video, commercial video"
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Videography",
    "alternateName": ["video production", "commercial videography"],
    "provider": { "@id": "https://www.drippmedia.com/#organization" },
    "description": "Cinematic videography services: corporate video production, brand films, product videos, event coverage, music videos, and ad film production.",
    "url": "https://www.drippmedia.com/video-portfolio",
    "serviceType": "Videography",
    "areaServed": "Worldwide",
    "keywords": "videography, video production, commercial videography, corporate video, event videography, ad film production"
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Photography",
    "alternateName": ["commercial photography", "brand photography"],
    "provider": { "@id": "https://www.drippmedia.com/#organization" },
    "description": "Professional photography services including brand photography, product photography, e-commerce photography, event photography, corporate headshots, and lifestyle photography.",
    "url": "https://www.drippmedia.com/graphic-portfolio",
    "serviceType": "Photography",
    "areaServed": "Worldwide",
    "keywords": "photography, brand photography, product photography, event photography, commercial photography, e-commerce photography"
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Social Media Management",
    "alternateName": ["social media marketing", "social media agency"],
    "provider": { "@id": "https://www.drippmedia.com/#organization" },
    "description": "End-to-end social media management: content creation, scheduling, community management, paid campaigns, growth strategy, and analytics for Instagram, LinkedIn, Facebook, and more.",
    "url": "https://www.drippmedia.com",
    "serviceType": "Social Media Management",
    "areaServed": "Worldwide",
    "keywords": "social media management, Instagram management, social media marketing, content creation, social media strategy, community management"
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Graphic Design",
    "alternateName": ["brand identity design", "logo design", "branding"],
    "provider": { "@id": "https://www.drippmedia.com/#organization" },
    "description": "Creative graphic design services: logo design, brand identity systems, motion graphics, UI/UX design, poster design, packaging design, and complete rebranding solutions.",
    "url": "https://www.drippmedia.com/graphic-portfolio",
    "serviceType": "Graphic Design",
    "areaServed": "Worldwide",
    "keywords": "graphic design, logo design, brand identity, motion graphics, UI UX design, poster design, packaging design, rebranding"
  }
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Dripp Media?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dripp Media (also searched as Drip Media, DrippMedia, or DripMedia) is a premium global creative & digital branding agency based in Dehradun, India. We offer web development, video editing, videography, photography, social media management, and graphic design for brands worldwide."
      }
    },
    {
      "@type": "Question",
      "name": "Is Dripp Media the same as Drip Media?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Dripp Media, Drip Media, DrippMedia, and DripMedia all refer to the same agency — Dripp Media at www.drippmedia.com. The correct spelling is Dripp (with two P's)."
      }
    },
    {
      "@type": "Question",
      "name": "What web development services does Dripp Media offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dripp Media builds custom websites, e-commerce stores, SaaS platforms, web applications, and interactive digital experiences using Next.js, React, Shopify, and Webflow. We serve startups, enterprises, and global brands."
      }
    },
    {
      "@type": "Question",
      "name": "Does Dripp Media offer video editing services?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Dripp Media offers professional video editing for YouTube, Instagram reels, brand films, commercial ads, short-form and long-form content, including color grading and motion graphics."
      }
    },
    {
      "@type": "Question",
      "name": "Does Dripp Media provide photography and videography services?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Dripp Media provides cinematic videography and professional photography for brands, products, events, corporate clients, and commercial shoots."
      }
    },
    {
      "@type": "Question",
      "name": "Can Dripp Media manage my social media?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Dripp Media offers full social media management including content creation, scheduling, community management, paid advertising, growth strategy, and performance analytics for Instagram, LinkedIn, Facebook, and more."
      }
    },
    {
      "@type": "Question",
      "name": "What graphic design services does Dripp Media offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dripp Media offers logo design, brand identity design, motion graphics, UI/UX design, poster design, packaging design, pitch deck design, and complete rebranding services."
      }
    },
    {
      "@type": "Question",
      "name": "Does Dripp Media work with international clients?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Dripp Media serves clients globally including in the USA, UK, UAE, Australia, Canada, Singapore, and across Europe — in addition to clients across all major Indian cities."
      }
    },
    {
      "@type": "Question",
      "name": "Where is Dripp Media located?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dripp Media is headquartered in Dehradun, Uttarakhand, India, and serves clients worldwide remotely."
      }
    },
    {
      "@type": "Question",
      "name": "How can I hire Dripp Media?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can reach Dripp Media at www.drippmedia.com/quote to get a custom quote for web development, video editing, photography, social media management, or graphic design services."
      }
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ── Organization Schema ──────────────────────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* ── WebSite Schema (Sitelinks Search + brand anchoring) ──────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* ── Service Schemas (one per service) ────────────────────────── */}
        {servicesSchema.map((service, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }}
          />
        ))}
        {/* ── FAQ Schema (rich results + knowledge panel) ──────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        {/* ── Fonts ─────────────────────────────────────────────────────── */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=panchang@200,300,400,500,600,700,800&f[]=clash-display@200,300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
        {/* ── Unicons ───────────────────────────────────────────────────── */}
        <link rel="preconnect" href="https://unicons.iconscout.com" />
        <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

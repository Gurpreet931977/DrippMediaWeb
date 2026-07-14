import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  metadataBase: new URL('https://drippmedia.com'),
  title: {
    default: 'Dripp Media | Digital Branding & Creative Agency',
    template: '%s | Dripp Media'
  },
  description: 'Dripp Media is a digital branding and creative agency specializing in immersive digital experiences, web development, and video production.',
  keywords: [
    // Core Brand Identifiers
    'Dripp Media', 'drip media', 'dripmedia', 'drippmedia.com', 'Dripp Agency', 'The Dripp Agency',
    
    // Premium & Luxury Services (High-End Clientele)
    'premium website development', 'premium video editing', 'premium creative agency', 
    'luxury digital agency', 'luxury brand marketing', 'high-end web design', 
    'premium motion graphics', 'boutique digital agency', 'bespoke web development',
    'premium UI UX design', 'elite video production', 'high-end digital marketing',
    
    // High-Ticket Web Development & Tech (Core USP)
    'website development', 'custom web app development', 'e-commerce website development', 'Shopify experts India',
    'Next.js developers', 'React JS agency', 'startup website development', 'SaaS landing page design',
    'high conversion web design', 'interactive 3D websites', 'WebGL developers', 'mobile app development',
    'frontend development agency', 'backend web development', 'full stack development company', 'custom CMS development',
    'Webflow development agency', 'WordPress development services', 'headless commerce development',
    'enterprise web application development', 'B2B corporate website design', 'real estate website development',
    'hospitality website design', 'portfolio website development', 'fintech web development', 'edtech website developers',
    'fast SEO optimized websites', 'progressive web apps PWA', 'custom API integration', 'web portal development',
    
    // Video Production & Editing Services (High Demand)
    'video editing', 'youtube video editing', 'instagram reel editing', 'viral reel editing',
    'commercial video production', 'ad film makers', 'corporate event shoots', 'brand documentary production',
    'cinematic event coverage', 'music video directors', 'product videography', 'podcast editing services',
    'videoshoots', 'events coverage', 'event photography', 'commercial videography', 'social media reels',
    
    // Design, UI/UX & Branding
    'brand identity design', 'logo design agency', 'premium branding agency', 'luxury digital agency',
    'UI/UX design for startups', 'motion designing services', '3D product animation', 'graphic designing',
    'poster designing', 'packaging design agency', 'rebranding services', 'typography design',
    
    // Performance Marketing & Growth (Sales Driving)
    'performance marketing agency', 'ROI driven digital marketing', 'lead generation services',
    'D2C brand growth agency', 'Facebook ads management', 'Google ads expert agency', 'SEO services',
    'social media management', 'influencer marketing agency', 'B2B digital marketing',
    
    // Industry-Specific Niche Keywords
    'real estate digital marketing', 'fashion brand videography', 'tech startup branding',
    'hospitality marketing agency', 'restaurant social media management', 'e-commerce growth agency',
    
    // High-Intent Search Phrases (What clients actually type into Google)
    'best creative agency', 'best website agency', 'top digital agency', 'award winning web design',
    'hire video editor for youtube', 'hire UI UX designer', 'best marketing agency for startups',
    'creative studio near me', 'best web development company', 'top video production company',
    'hire top web developers', 'best web design agency near me', 'award-winning digital agency',
    'top rated website designers', 'affordable web development agency', 'custom software development company',
    'top B2B marketing agency', 'hire professional video editors', 'best creative agency for startups',
    'top ecommerce development agency', 'web design services for small business', 'top notch digital branding',
    'hire dedicated developers offshore', 'find the best creative agency', 'award winning video production',
    
    // Geo-Targeted: Dehradun (HQ/Focus)
    'creative agency Dehradun', 'web development Dehradun', 'digital marketing Dehradun', 
    'best agency in Dehradun', 'web design Dehradun', 'video production Dehradun', 'SEO Dehradun',
    'event photographer Dehradun', 'ad shoot Dehradun',
    
    // Geo-Targeted: Delhi / NCR
    'web development Delhi', 'creative agency Delhi', 'digital marketing Delhi NCR', 
    'branding agency Delhi', 'top web design Delhi', 'video production Delhi', 'best digital agency New Delhi',
    'corporate filmmaker Delhi', 'ecommerce photography Delhi',
    
    // Geo-Targeted: Mumbai
    'digital marketing Mumbai', 'creative agency Mumbai', 'web development Mumbai', 
    'branding agency Mumbai', 'top creative studio Mumbai', 'video production Mumbai',
    'ad film production Mumbai', 'influencer marketing Mumbai',
    
    // Geo-Targeted: Bangalore / Bengaluru
    'branding agency Bangalore', 'web development Bangalore', 'creative agency Bengaluru', 
    'UI/UX design Bangalore', 'digital marketing Bangalore', 'top tech agency Bangalore',
    'startup branding Bangalore',
    
    // Geo-Targeted: Jaipur & Others
    'creative agency Jaipur', 'digital marketing Jaipur', 'web development Jaipur', 
    'branding Jaipur', 'web design Jaipur', 'web development Pune', 'creative agency Hyderabad', 
    'digital marketing Chennai', 'digital agency Ahmedabad', 
    
    // National / Global & Offshore Outsourcing (High Ticket)
    'top agency India', 'best creative agency in India', 'best web development company India', 
    'Indian digital marketing agency', 'creative agency for USA clients', 'offshore web development India',
    'hire remote web developers India', 'outsource video editing India', 'offshore digital marketing agency',
    'best agency for international clients', 'web development outsourcing to India', 'hire UI UX designer offshore',
    'creative agency Dubai', 'web development agency USA', 'digital marketing agency UK', 'branding agency Australia',
    'remote video editing team', 'offshore 3D design studio', 'B2B offshore agency India', 'top Indian agency for global clients',
    
    // Emerging/High-Budget Global Markets (Low Competition, High Ticket)
    'outsource web development Scandinavia', 'creative agency Norway', 'branding agency Sweden', 'digital marketing Denmark',
    'enterprise web development Germany', 'Swiss offshore digital agency', 'video production outsourcing DACH',
    'creative agency Singapore', 'web development Singapore offshore', 'digital agency Netherlands',
    'branding agency Saudi Arabia', 'digital transformation agency Qatar', 'Middle east digital marketing outsourcing',
    'offshore digital agency New Zealand',
    
    // US & Canada (1st, 2nd & Tech-Hub Cities)
    'web development New York', 'creative agency NYC', 'digital marketing San Francisco', 'startup branding Silicon Valley',
    'video production Los Angeles', 'web design Austin', 'tech agency Seattle', 'branding agency Miami',
    'digital marketing Chicago', 'creative studio Denver', 'app development Atlanta', 'marketing agency Dallas',
    'web development Toronto', 'creative agency Vancouver', 'branding studio Montreal', 'digital agency Calgary',
    
    // UK & Europe (1st & 2nd Tier)
    'digital marketing London', 'creative agency Manchester', 'web development Birmingham', 'video production Edinburgh',
    'branding agency Bristol', 'tech agency Dublin', 'web design Berlin', 'digital marketing Munich', 
    'startup branding Frankfurt', 'creative agency Hamburg', 'web development Amsterdam', 'creative studio Paris',
    
    // Australia & APAC
    'web development Sydney', 'creative agency Melbourne', 'digital marketing Brisbane', 'branding agency Perth',
    'video production Auckland', 'digital agency Wellington',
    
    // Middle East (Specific Hubs)
    'creative agency Dubai', 'web development Abu Dhabi', 'branding agency Riyadh', 'digital marketing Doha',
    'video production Jeddah', 'tech agency Manama Bahrain'
  ],
  authors: [{ name: 'Dripp Media' }],
  creator: 'Dripp Media',
  publisher: 'Dripp Media',
  openGraph: {
    title: 'Dripp Media | Digital Branding & Creative Agency',
    description: 'Dripp Media is a digital branding and creative agency specializing in immersive digital experiences, web development, and video production.',
    url: 'https://drippmedia.com',
    siteName: 'Dripp Media',
    locale: 'en_US',
    type: 'website',
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
    title: 'Dripp Media | Digital Branding & Creative Agency',
    description: 'Digital branding and creative agency specializing in immersive digital experiences, web development, video production, and cutting-edge design.',
    creator: '@drippmedia_',
  },
  alternates: {
    canonical: 'https://drippmedia.com',
  },
  applicationName: 'Dripp Media',
  category: 'technology',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data for SEO (Prevents Google Autocorrecting to Dreammedia) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Dripp Media",
              "alternateName": ["Drip Media", "DrippMedia", "Dripmedia"],
              "url": "https://drippmedia.com",
              "logo": "https://drippmedia.com/favicon.ico",
              "description": "Dripp Media is a premium digital branding and creative agency specializing in immersive digital experiences, web development, video production, and cutting-edge design.",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-78189-95147",
                "contactType": "customer service"
              },
              "sameAs": [
                "https://www.instagram.com/drippmedia_"
              ],
              "knowsAbout": ["Digital Branding", "Creative Agency", "Web Development", "Video Production", "Interactive Design"],
              "areaServed": [
                { "@type": "City", "name": "Dehradun" },
                { "@type": "City", "name": "Delhi" },
                { "@type": "City", "name": "Mumbai" },
                { "@type": "City", "name": "Bangalore" },
                { "@type": "City", "name": "Jaipur" },
                { "@type": "Country", "name": "India" },
                { "@type": "Country", "name": "United States" },
                { "@type": "Country", "name": "United Kingdom" },
                { "@type": "Country", "name": "United Arab Emirates" },
                { "@type": "Country", "name": "Australia" },
                { "@type": "Country", "name": "Canada" },
                { "@type": "Country", "name": "Germany" },
                { "@type": "Country", "name": "Switzerland" },
                { "@type": "Country", "name": "Singapore" },
                { "@type": "Country", "name": "Saudi Arabia" },
                { "@type": "Country", "name": "Qatar" },
                { "@type": "Country", "name": "Norway" },
                { "@type": "Country", "name": "Sweden" },
                { "@type": "Country", "name": "Denmark" },
                { "@type": "Country", "name": "Netherlands" },
                { "@type": "Country", "name": "New Zealand" }
              ]
            })
          }}
        />
        {/* Fonts */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=panchang@200,300,400,500,600,700,800&f[]=clash-display@200,300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
        {/* Unicons */}
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

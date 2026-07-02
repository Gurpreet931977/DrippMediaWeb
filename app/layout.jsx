import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  metadataBase: new URL('https://drippmedia.com'),
  title: {
    default: 'Dripp Media | Creative Agency',
    template: '%s | Dripp Media'
  },
  description: 'Dripp Media is a creative agency specializing in immersive digital experiences, web development, video production, and cutting-edge design. We transform ideas into interactive realities.',
  keywords: ['Dripp Media', 'drip media', 'dripmedia', 'creative agency', 'digital agency', 'web development', 'video production', 'interactive portfolio', 'design agency', 'marketing', 'branding'],
  authors: [{ name: 'Dripp Media' }],
  creator: 'Dripp Media',
  publisher: 'Dripp Media',
  openGraph: {
    title: 'Dripp Media | Creative Agency',
    description: 'Dripp Media is a creative agency specializing in immersive digital experiences, web development, and video production.',
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
    title: 'Dripp Media | Creative Agency',
    description: 'Immersive digital experiences, web development, video production, and cutting-edge design by Dripp Media.',
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
        {/* Fonts */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=panchang@200,300,400,500,600,700,800&f[]=clash-display@200,300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
        {/* Unicons */}
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

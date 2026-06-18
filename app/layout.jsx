import './globals.css';

export const metadata = {
  title: 'Dripp Media | Surreal Agency',
  description: 'Dripp Media Interactive Portfolio',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=panchang@200,300,400,500,600,700,800&f[]=clash-display@200,300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
        {/* Unicons */}
        <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

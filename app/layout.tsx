import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://avara.lk';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Avara Real Estate | Buy, Rent & Book Properties in Sri Lanka',
    template: '%s | Avara Real Estate Sri Lanka',
  },
  description: 'Find your dream property in Sri Lanka. Browse houses, apartments, villas, and land for sale and rent in Colombo, Kandy, Galle, and across Sri Lanka. Trusted by 15,000+ customers.',
  keywords: [
    'property Sri Lanka',
    'houses for sale Sri Lanka',
    'apartments for rent Colombo',
    'land for sale Sri Lanka',
    'real estate Sri Lanka',
    'buy house Colombo',
    'rent apartment Kandy',
    'villa Galle',
    'property booking Sri Lanka',
    'Avara real estate',
    'Sri Lanka property portal',
    'houses in Negombo',
    'luxury villas Sri Lanka',
  ],
  authors: [{ name: 'Avara Real Estate', url: BASE_URL }],
  creator: 'Avara Real Estate',
  publisher: 'Avara Real Estate',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_LK',
    url: BASE_URL,
    siteName: 'Avara Real Estate',
    title: 'Avara Real Estate | Buy, Rent & Book Properties in Sri Lanka',
    description: 'Sri Lanka\'s premier property platform. Find houses, apartments, villas, and land for sale and rent across Colombo, Kandy, Galle, and more.',
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Avara Real Estate - Find Your Dream Property in Sri Lanka',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Avara Real Estate | Properties in Sri Lanka',
    description: 'Find houses, apartments, villas for sale and rent in Sri Lanka.',
    images: [`${BASE_URL}/og-image.jpg`],
    creator: '@avara_lk',
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
  alternates: {
    canonical: BASE_URL,
  },
  category: 'real estate',
  other: {
    'geo.region': 'LK',
    'geo.placename': 'Sri Lanka',
    'geo.position': '7.8731;80.7718',
    'ICBM': '7.8731, 80.7718',
    'distribution': 'Sri Lanka',
    'coverage': 'Sri Lanka',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Geo meta tags for Sri Lankan market */}
        <meta name="geo.region" content="LK" />
        <meta name="geo.placename" content="Sri Lanka" />
        <meta name="geo.position" content="7.8731;80.7718" />
        <meta name="ICBM" content="7.8731, 80.7718" />

        {/* Preconnect to external services */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}


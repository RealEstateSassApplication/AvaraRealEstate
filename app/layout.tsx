import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { OrganizationSchema } from '@/components/seo/JsonLd';

const inter = Inter({ subsets: ['latin'] });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://avara.lk';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Avara | Discover Property & Places in Sri Lanka',
    template: '%s | Avara',
  },
  description: 'Discover homes, rooms, apartments, land and short stays in Sri Lanka. Browse listings and connect with property owners.',
  authors: [{ name: 'Avara', url: BASE_URL }],
  creator: 'Avara',
  publisher: 'Avara',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_LK',
    url: BASE_URL,
    siteName: 'Avara',
    title: 'Avara | Discover Property & Places in Sri Lanka',
    description: 'Find property for rent or sale in Sri Lanka and connect with owners.',
    images: [
      {
        url: `${BASE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Avara — Property, places and perspective',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Avara | Properties in Sri Lanka',
    description: 'Find houses, apartments, villas for sale and rent in Sri Lanka.',
    images: [`${BASE_URL}/opengraph-image`],
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
  category: 'real estate',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-LK">

      <body className={inter.className}><OrganizationSchema name="Avara" url={BASE_URL} description="A Sri Lankan property discovery marketplace for homes, rooms, apartments, land and short stays."/>{children}</body>
    </html>
  );
}


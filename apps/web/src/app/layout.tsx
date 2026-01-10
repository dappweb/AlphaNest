import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { InstallPrompt, OfflineIndicator } from '@/components/pwa/install-prompt';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://alphanest-web.pages.dev'),
  title: {
    default: 'AlphaNest - Cross-Chain Meme Asset Platform',
    template: '%s | AlphaNest',
  },
  description:
    'The premier cross-chain Meme asset issuance and traffic aggregation platform. Curated launches, reputation-based Dev scoring, and Rug insurance.',
  keywords: [
    'DeFi',
    'Meme coins',
    'Cross-chain',
    'Web3',
    'Crypto',
    'Launchpad',
    'DEX',
    'Solana',
    'Base',
    'Ethereum',
    'AlphaGuard',
    'Insurance',
  ],
  authors: [{ name: 'AlphaNest Team' }],
  creator: 'AlphaNest',
  publisher: 'AlphaNest',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AlphaNest',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'AlphaNest - Cross-Chain Meme Asset Platform',
    description:
      'The premier cross-chain Meme asset issuance and traffic aggregation platform.',
    type: 'website',
    url: 'https://alphanest.pages.dev',
    siteName: 'AlphaNest',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AlphaNest Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlphaNest - Cross-Chain Meme Asset Platform',
    description:
      'The premier cross-chain Meme asset issuance and traffic aggregation platform.',
    images: ['/og-image.png'],
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col">
              <Header />
              <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
          </div>
          <InstallPrompt />
          <OfflineIndicator />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';
import { PageTransition } from '@/components/layout/page-transition';
import { PWAComponents } from '@/components/pwa/pwa-wrapper';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-geist-sans',
  display: 'swap', // 优化字体加载
  preload: true,
});

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://app.popcow.xyz'),
  title: {
    default: 'PopCow - The Smartest Cow in Crypto 🐄',
    template: '%s | PopCow Platform',
  },
  description:
    'Follow PopCow, the smartest cow in crypto! Discover Alpha projects, avoid Rug Pulls, and trade safely with PopCow\'s intelligence and CowGuard insurance.',
  keywords: [
    'PopCow',
    'Crypto Cow',
    'Alpha Hunter',
    'Meme coins',
    'Rug Pull detector',
    'DeFi',
    'Cross-chain',
    'Web3',
    'Crypto',
    'Solana',
    'Base',
    'Ethereum',
    'CowGuard',
    'Insurance',
    'Smart Trading',
  ],
  authors: [{ name: 'PopCow Team' }],
  creator: 'PopCow',
  publisher: 'PopCow Platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PopCow Platform',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'PopCow - The Smartest Cow in Crypto 🐄',
    description:
      'Follow PopCow for Alpha discoveries, Rug Pull protection, and safe Meme coin trading.',
    type: 'website',
    url: 'https://app.popcow.xyz',
    siteName: 'PopCow Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PopCow - The Smartest Cow in Crypto',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PopCow - The Smartest Cow in Crypto 🐄',
    description:
      'Follow PopCow for Alpha discoveries, Rug Pull protection, and safe Meme coin trading.',
    images: ['/og-image.png'],
    creator: '@popcowxyz',
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
        {/* DNS 预解析 */}
        <link rel="dns-prefetch" href="https://alphanest-api.dappweb.workers.dev" />
        <link rel="dns-prefetch" href="https://api.dexscreener.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* 预连接关键资源 */}
        <link rel="preconnect" href="https://alphanest-api.dappweb.workers.dev" crossOrigin="anonymous" />
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
              <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
                <PageTransition>{children}</PageTransition>
              </main>
              <Footer className="hidden md:block" />
            </div>
          </div>
          <MobileNav />
          <PWAComponents />
        </Providers>
      </body>
    </html>
  );
}

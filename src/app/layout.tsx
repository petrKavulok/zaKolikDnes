import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import andrejko from '@/assets/andrejko.png';
import alca from '@/assets/alca.png';
import './globals.css';

export const metadata: Metadata = {
  title: 'Za kolik dnes?',
  description: 'Aktuální maximální ceny benzínu Natural 95 a nafty z Cenového věstníku MF ČR.',
  openGraph: {
    title: 'Za kolik dnes?',
    description: 'Aktuální maximální ceny benzínu Natural 95 a nafty z Cenového věstníku MF ČR.',
    images: [{ url: '/og-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Za kolik dnes?',
    description: 'Aktuální maximální ceny benzínu Natural 95 a nafty z Cenového věstníku MF ČR.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/android-icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon-57x57.png', sizes: '57x57' },
      { url: '/apple-icon-60x60.png', sizes: '60x60' },
      { url: '/apple-icon-72x72.png', sizes: '72x72' },
      { url: '/apple-icon-76x76.png', sizes: '76x76' },
      { url: '/apple-icon-114x114.png', sizes: '114x114' },
      { url: '/apple-icon-120x120.png', sizes: '120x120' },
      { url: '/apple-icon-144x144.png', sizes: '144x144' },
      { url: '/apple-icon-152x152.png', sizes: '152x152' },
      { url: '/apple-icon-180x180.png', sizes: '180x180' },
    ],
    other: [{ rel: 'apple-touch-icon-precomposed', url: '/apple-icon-precomposed.png' }],
  },
  other: {
    'msapplication-TileColor': '#0b1020',
    'msapplication-TileImage': '/ms-icon-144x144.png',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <div className="floaters" aria-hidden="true">
          <img src={andrejko.src} alt="" />
          <img src={alca.src} alt="" />
          <img src={andrejko.src} alt="" />
          <img src={alca.src} alt="" />
          <img src={andrejko.src} alt="" />
          <img src={alca.src} alt="" />
          <img src={andrejko.src} alt="" />
          <img src={alca.src} alt="" />
          <img src={andrejko.src} alt="" />
          <img src={alca.src} alt="" />
        </div>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

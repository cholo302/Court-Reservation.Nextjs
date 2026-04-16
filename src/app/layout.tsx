import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  title: {
    default: 'OLOPSC Court Reservation - Book Sports Courts Online',
    template: '%s | OLOPSC Court Reservation',
  },
  description: 'Book sports courts at Our Lady of Perpetual Succor College. Reserve Basketball, Badminton, Volleyball, and Ping Pong courts online with instant confirmation and QR code entry.',
  keywords: [
    'OLOPSC', 'court reservation', 'sports booking', 'basketball court',
    'badminton court', 'volleyball court', 'ping pong', 'Our Lady of Perpetual Succor College',
    'court booking', 'sports facility', 'online reservation',
  ],
  authors: [{ name: 'OLOPSC Court Reservation' }],
  openGraph: {
    title: 'OLOPSC Court Reservation - Book Sports Courts Online',
    description: 'Reserve Basketball, Badminton, Volleyball, and Ping Pong courts at Our Lady of Perpetual Succor College. Instant confirmation with QR code entry.',
    url: 'https://courtreserve.site',
    siteName: 'OLOPSC Court Reservation',
    locale: 'en_PH',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'OLOPSC Court Reservation',
    description: 'Book sports courts online at OLOPSC. Basketball, Badminton, Volleyball, Ping Pong and more.',
  },
  metadataBase: new URL('https://courtreserve.site'),
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={`${inter.variable} font-sans bg-gray-50 min-h-screen antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import Script from 'next/script'
import { ClerkProvider } from '@clerk/nextjs'
import { AppQueryClientProvider } from '@/providers/query-client-provider'
import { SearchStoreProvider } from '@/providers/search-store-provider'
import './globals.css'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-5BFQVFST'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'JackCity – Hoteles y estadías para perros',
    template: '%s | JackCity',
  },
  description: 'Encuentra hoteles y estadías confiables para tu perro con JackCity. Compara opciones, revisa servicios y reserva el lugar ideal para tu peque.',
  applicationName: 'JackCity',
  keywords: ['JackCity', 'hotel para perros', 'estadía para perros', 'guardería canina', 'mascotas', 'viajes con perros'],
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: appUrl,
    siteName: 'JackCity',
    title: 'JackCity – Hoteles y estadías para perros',
    description: 'Encuentra hoteles y estadías confiables para tu perro con JackCity. Compara opciones, revisa servicios y reserva el lugar ideal para tu peque.',
    images: [
      {
        url: '/images/hero-bg.jpg',
        width: 1695,
        height: 794,
        alt: 'JackCity - hoteles y estadías para perros',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JackCity – Hoteles y estadías para perros',
    description: 'Encuentra hoteles y estadías confiables para tu perro con JackCity. Compara opciones, revisa servicios y reserva el lugar ideal para tu peque.',
    images: ['/images/hero-bg.jpg'],
  },
  icons: {
    icon: [
      { url: '/images/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="es" className="bg-background">
        <head>
          {/* Google Tag Manager */}
          <Script
            id="gtm-base"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
          {/* End Google Tag Manager */}
        </head>
        <body className="font-sans antialiased">
          {/* Google Tag Manager (noscript) */}
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
          {/* End Google Tag Manager (noscript) */}
          <AppQueryClientProvider>
            <SearchStoreProvider>
              {children}
            </SearchStoreProvider>
          </AppQueryClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

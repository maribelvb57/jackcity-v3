import type { Metadata } from 'next'
import Script from 'next/script'
import { ClerkProvider } from '@clerk/nextjs'
import { AppQueryClientProvider } from '@/providers/query-client-provider'
import { SearchStoreProvider } from '@/providers/search-store-provider'
import { TRACKING_ENABLED } from '@/lib/env'
import './globals.css'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
// El ID del contenedor de GTM no es secreto: viaja en el HTML de cada página.
const gtmId = 'GTM-5BFQVFST'

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
    // 1200x630 es el formato que esperan Facebook, WhatsApp y LinkedIn. Las
    // medidas deben coincidir con el archivo real: si no, algunos scrapers
    // reservan el espacio con el ratio equivocado y deforman la tarjeta.
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'JackCity - hoteles y estadías para perros',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JackCity – Hoteles y estadías para perros',
    description: 'Encuentra hoteles y estadías confiables para tu perro con JackCity. Compara opciones, revisa servicios y reserva el lugar ideal para tu peque.',
    images: ['/images/og-image.jpg'],
  },
  // Todos los iconos viven en public/images/icons/. Las rutas son absolutas
  // desde la raíz del sitio, que es lo que public/ expone.
  icons: {
    icon: [
      { url: '/images/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/images/icons/icon-light-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/images/icons/apple-icon.png',
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
          {TRACKING_ENABLED && (
            <>
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
            {/* Meta Pixel Code */}
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1580954520164893');
fbq('track', 'PageView');`,
              }}
            />
            {/* End Meta Pixel Code */}
            </>
          )}
        </head>
        <body className="font-sans antialiased">
          {TRACKING_ENABLED && (
            <>
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
            {/* Meta Pixel Code (noscript) */}
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src="https://www.facebook.com/tr?id=1580954520164893&ev=PageView&noscript=1"
                alt=""
              />
            </noscript>
            {/* End Meta Pixel Code (noscript) */}
            </>
          )}
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

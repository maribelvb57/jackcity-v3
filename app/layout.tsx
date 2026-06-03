import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { AppQueryClientProvider } from '@/providers/query-client-provider'
import { SearchStoreProvider } from '@/providers/search-store-provider'
import './globals.css'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
      { url: '/icon.svg', type: 'image/svg+xml' },
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
        <body className="font-sans antialiased">
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

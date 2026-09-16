import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Optimización de imágenes de Next (Vercel la resuelve de forma nativa):
    // convierte a WebP/AVIF y sirve el tamaño que pide cada pantalla.
    // Todo host externo que pase por next/image debe declararse acá.
    //
    // El default de Next es solo WebP. Al declarar AVIF primero, los browsers
    // que lo soportan reciben ~11% menos peso; el resto cae a WebP y luego a
    // JPEG por content negotiation, sin markup extra.
    formats: ["image/avif", "image/webp"],
    // Default de Next + 1697. Sin ese candidato intermedio el srcSet salta de
    // 1200 a 1920: el hero (1697px de ancho real) se capa en 1200w y en una
    // pantalla Retina termina sirviéndose a 1x, que es lo que se veía borroso.
    deviceSizes: [640, 750, 828, 1080, 1200, 1697, 1920, 2048, 3840],
    // Next 16 solo permite las calidades declaradas acá (default: [75]); una
    // quality fuera de la lista se ignora en silencio. 85 la usa el hero.
    qualities: [75, 85],
    remotePatterns: [
      // Fotos de los hoteles.
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Datos de ejemplo del panel de hotelero.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // No exponer source maps al browser
  hideSourceMaps: true,

  // Subir source maps más completos (incluye código de librerías)
  widenClientFileUpload: true,

  // Silenciar logs de Sentry en builds de producción
  silent: process.env.NODE_ENV === "production",

  // Desactivar telemetría del SDK de Sentry
  telemetry: false,
})

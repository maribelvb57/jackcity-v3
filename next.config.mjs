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

import type { MetadataRoute } from "next"
import { HOTEL_STATIC_PAGES } from "@/lib/hotel-static-pages"
import { COMUNA_PAGES } from "@/lib/comuna-pages"
import { APP_URL as appUrl } from "@/lib/site-url"

// Páginas públicas sin parámetros. Quedan fuera a propósito: el área de hotelero
// (/hotel/*), las vistas de reserva y confirmación, /mi-cuenta, /mis-reservas y
// las páginas internas de prueba.
const STATIC_PATHS = [
  "/",
  "/legal/terminos-y-condiciones",
  "/legal/privacidad-y-datos",
  "/legal/politica-de-reservas",
  "/legal/politica-de-cancelacion",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const comunaPages = COMUNA_PAGES.map(({ slug }) => ({
    url: `${appUrl}/hoteles-para-perros/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const hotelPages = HOTEL_STATIC_PAGES.map(({ comuna, keyName }) => ({
    url: `${appUrl}/hoteles-para-perros/${comuna}/${keyName}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${appUrl}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.3,
    })),
    ...comunaPages,
    ...hotelPages,
  ]
}

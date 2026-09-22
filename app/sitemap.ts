import type { MetadataRoute } from "next"
import { HOTEL_STATIC_PAGES } from "@/lib/hotel-static-pages"
import { COMUNA_PAGES } from "@/lib/comuna-pages"
import { APP_URL as appUrl } from "@/lib/site-url"

// Páginas públicas sin parámetros. Quedan fuera a propósito: el área de hotelero
// (/hotel/*), las vistas de reserva y confirmación, /mi-cuenta, /mis-reservas y
// las páginas internas de prueba.
const STATIC_PATHS = [
  "/",
  "/blog",
  "/legal/terminos-y-condiciones",
  "/legal/privacidad-y-datos",
  "/legal/politica-de-reservas",
  "/legal/politica-de-cancelacion",
]

// Landing de ciudad con ruta propia (no sale de COMUNA_PAGES): es la página
// principal de Santiago y agrupa a las seis landings de comuna.
const SANTIAGO_PATH = "/hoteles-para-perros-santiago"

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
    {
      url: `${appUrl}${SANTIAGO_PATH}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    ...comunaPages,
    ...hotelPages,
  ]
}

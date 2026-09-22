import type { MetadataRoute } from "next"
import { HOTEL_STATIC_PAGES } from "@/lib/hotel-static-pages"
import { COMUNA_PAGES } from "@/lib/comuna-pages"
import { getBlogPosts } from "@/lib/blog-posts"
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
// principal de Santiago y agrupa a las seis landings de comuna. La ruta no
// lleva la palabra "santiago"; las fichas por uuid cuelgan de ella.
const SANTIAGO_PATH = "/hotel-para-perros"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Los artículos salen del feed de Soro, que es donde viven. lastModified usa
  // su fecha de publicación: el feed no expone una fecha de última edición por
  // artículo, así que es el dato real disponible.
  const posts = await getBlogPosts()
  const blogPosts = posts.map((post) => ({
    url: `${appUrl}/blog/${post.slug}`,
    ...(post.publishedAt && { lastModified: new Date(post.publishedAt) }),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

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
    ...blogPosts,
  ]
}

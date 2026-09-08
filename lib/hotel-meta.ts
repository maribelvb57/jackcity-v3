import type { Metadata } from "next"
import type { HotelPage } from "@/lib/api/hotel-page"

// Largo máximo del meta description; Google recorta alrededor de los 160 caracteres.
const META_DESCRIPTION_MAX = 160

/** Primer tramo de la descripción del hotel, en una línea y sin cortar palabras. */
export function buildHotelMetaDescription(hotel: HotelPage): string {
  const fallback = hotel.commune
    ? `${hotel.name}, hotel para perros en ${hotel.commune}. Revisa fotos, servicios y condiciones en JackCity.`
    : `${hotel.name}, hotel para perros. Revisa fotos, servicios y condiciones en JackCity.`

  const raw = hotel.description?.replace(/\s+/g, " ").trim()
  if (!raw) return fallback
  if (raw.length <= META_DESCRIPTION_MAX) return raw

  const cut = raw.slice(0, META_DESCRIPTION_MAX)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

// Fotos de portada fijas, por keyName: las imágenes de cards-3-2 del repo se
// usan como preview al compartir el link, en vez de la primera foto de galería
// que entrega el API. Cubre los seis hoteles de HOTEL_STATIC_PAGES; cualquier
// keyName fuera de esta lista sigue usando la portada del API.
const COVER_OVERRIDES: Record<string, string> = {
  peluditos: "/images/hotels/cards-3-2/peluditos.jpg",
  "la-guarderia-de-bruno": "/images/hotels/cards-3-2/bruno.jpg",
  "hotel-canino-mantra": "/images/hotels/cards-3-2/mantra.jpg",
  "hotel-campestre": "/images/hotels/cards-3-2/campestre.jpg",
  "perry-lodge": "/images/hotels/cards-3-2/perry.jpg",
  "el-patio-guarderia": "/images/hotels/cards-3-2/patio.jpg",
}

/** Metadata de una ficha pública de hotel. canonicalPath va relativo a metadataBase. */
export function buildHotelMetadata(hotel: HotelPage, canonicalPath: string): Metadata {
  const description = buildHotelMetaDescription(hotel)
  // El keyName es el último segmento del canonical: /hoteles-para-perros/{comuna}/{keyName}.
  const keyName = canonicalPath.split("/").pop() ?? ""
  // La galería ya viene ordenada por sortOrder: la primera foto es la portada.
  const cover = COVER_OVERRIDES[keyName] ?? hotel.photos[0]?.url

  return {
    title: hotel.name,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      url: canonicalPath,
      title: hotel.name,
      description,
      ...(cover && { images: [{ url: cover, alt: hotel.name }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: hotel.name,
      description,
      ...(cover && { images: [cover] }),
    },
  }
}

/** Metadata del caso "hotel no encontrado": sin indexar. */
export const HOTEL_NOT_FOUND_METADATA: Metadata = {
  title: "Hotel no encontrado",
  robots: { index: false, follow: false },
}

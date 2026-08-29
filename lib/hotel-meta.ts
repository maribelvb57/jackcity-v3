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

/** Metadata de una ficha pública de hotel. canonicalPath va relativo a metadataBase. */
export function buildHotelMetadata(hotel: HotelPage, canonicalPath: string): Metadata {
  const description = buildHotelMetaDescription(hotel)
  // La galería ya viene ordenada por sortOrder: la primera foto es la portada.
  const cover = hotel.photos[0]?.url

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

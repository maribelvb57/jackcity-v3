import { API_BASE } from "@/lib/api/config"
import type { CancellationPolicy } from "@/lib/api/hotels"

export type HotelPageBenefit = {
  name: string
}

export type HotelPagePolicy = {
  description: string
}

// Foto de la galería del hotel. El orden de exhibición lo manda sortOrder,
// no la posición en el array (ver fetchHotelPage).
export type HotelPagePhoto = {
  url: string
  caption: string | null
  sortOrder: number
}

// Ficha pública del hotel: sin precios ni transporte, no depende de una búsqueda.
export type HotelPage = {
  name: string
  addressStreet: string | null
  commune: string | null
  communeCode: string | null
  avgRating: number | null
  reviewsCount: number | null
  reviewText: string | null
  reviewUserName: string | null
  description: string | null
  checkinTime: string | null
  checkoutTime: string | null
  cancellationPolicy: CancellationPolicy | null
  policies: HotelPagePolicy[]
  benefits: HotelPageBenefit[]
  photos: HotelPagePhoto[]
}

// Cada cuántos segundos se revalida la ficha en el servidor. La página es
// pública y cambia poco, así que se sirve cacheada y se refresca en background.
export const HOTEL_PAGE_REVALIDATE_SECONDS = 300

/**
 * Ficha pública del hotel, resuelta en el servidor.
 *
 * El endpoint es permitAll: no lleva Authorization ni headers de tracking (esos
 * viven en el browser). Devuelve null si el hotel no existe, para que la página
 * responda 404 en vez de un error.
 */
export async function fetchHotelPage(hotelId: string): Promise<HotelPage | null> {
  return requestHotelPage(`/api/hotels/${encodeURIComponent(hotelId)}/page`)
}

/**
 * Misma ficha que fetchHotelPage, pero buscando por la key del hotel (el slug
 * final de las URLs estáticas, ej. "hotel-campestre"). El response es idéntico.
 */
export async function fetchHotelPageByKey(keyName: string): Promise<HotelPage | null> {
  return requestHotelPage(`/api/hotels/by-key/${encodeURIComponent(keyName)}/page`)
}

async function requestHotelPage(path: string): Promise<HotelPage | null> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: HOTEL_PAGE_REVALIDATE_SECONDS },
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)

  const data = (await res.json()) as { hotel: HotelPage }

  // Las fotos se ordenan acá por sortOrder para que la galería no dependa del
  // orden en que vengan en el array.
  const photos = [...(data.hotel.photos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  return { ...data.hotel, photos }
}

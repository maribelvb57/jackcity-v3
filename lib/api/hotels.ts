import { API_BASE } from "./config"
import type { ApiFetch } from "@/lib/api/types"

export type PetSize = "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE"

export type HotelMainBenefit = {
  name: string
}

export type HotelBenefit = {
  code: string
  name: string
}

export type HotelPricing = {
  bookingPrice: number | null
  transportPrice: number
  totalPrice: number | null
}

export type HotelTransport = {
  provider: "HOTEL" | "JACKCITY"
  startDateSlots: string[] | null
  endDateSlots: string[] | null
}

export type CancellationPolicy = "CANCELLATION_POLICY_STRICT" | "CANCELLATION_POLICY_FLEXIBLE"

export const CANCELLATION_POLICY_STRICT: CancellationPolicy = "CANCELLATION_POLICY_STRICT"
export const CANCELLATION_POLICY_FLEXIBLE: CancellationPolicy = "CANCELLATION_POLICY_FLEXIBLE"

export type Hotel = {
  id: string
  name: string
  mainPhotoUrl: string | null
  description: string | null
  addressStreet: string | null
  commune: string | null
  communeCode: string | null
  region: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  email: string | null
  avgRating: number | null
  recommendedByJack: boolean
  reviewsCount: number | null
  petSizes: string[]
  mainBenefits: HotelMainBenefit[]
  benefits: HotelBenefit[]
  pricing: HotelPricing | null
  transport: HotelTransport | null
  cancellationPolicy: CancellationPolicy | null
}

export const PET_SIZE_MAP: Record<string, PetSize> = {
  "Pequeño": "SMALL",
  "Mediano": "MEDIUM",
  "Grande": "LARGE",
  "Extra Grande": "EXTRA_LARGE",
}

export const PET_SIZE_LABEL: Record<PetSize, string> = {
  SMALL: "Pequeño",
  MEDIUM: "Mediano",
  LARGE: "Grande",
  EXTRA_LARGE: "Extra Grande",
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

// Mapa de filtros del sidebar: cada código trae los hotel.id que tienen esa
// propiedad activada dentro de esta búsqueda. Se tipa abierto porque el API
// puede mandar códigos que el front todavía no muestra (ver ACCOMMODATION_FILTERS).
export type SearchFilterMap = Record<string, string[]>

export type SearchResult = {
  searchId: string
  hotels: Hotel[]
  filters: SearchFilterMap
}

// Mascota para la búsqueda (shape del contrato /api/hotels/search):
// id = petId cuando lo conocemos (usuario logueado con mascota guardada), null si no.
// breed = code de la raza (null si no se especificó). size = enum de tamaño.
export type SearchPet = {
  id: string | null
  breed: string | null
  size: PetSize
}

export async function searchHotels(params: {
  city: string
  pets: SearchPet[]
  startDate: Date
  endDate: Date
  needTransport: boolean
  transportCommune?: string
  apiFetch: ApiFetch
}): Promise<SearchResult> {
  const body = {
    city: params.city,
    pets: params.pets.map((p) => ({ id: p.id ?? null, breed: p.breed ?? null, size: p.size })),
    checkinDate: formatDate(params.startDate),
    checkoutDate: formatDate(params.endDate),
    needsTransport: params.needTransport,
    ...(params.needTransport && params.transportCommune && { transportCommune: params.transportCommune }),
  }

  return params.apiFetch("/api/hotels/search", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

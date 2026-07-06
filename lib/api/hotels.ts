import { API_BASE } from "./config"
import { getTrackingHeaders } from "@/lib/tracking"

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

export type SearchResult = {
  searchId: string
  hotels: Hotel[]
}

export async function searchHotels(params: {
  city: string
  mascotas: { tamano: string }[]
  startDate: Date
  endDate: Date
  needTransport: boolean
  transportCommune?: string
  token?: string | null
}): Promise<SearchResult> {
  const body = {
    city: params.city,
    pets: params.mascotas.map((m) => ({ size: PET_SIZE_MAP[m.tamano] ?? "SMALL" })),
    checkinDate: formatDate(params.startDate),
    checkoutDate: formatDate(params.endDate),
    needsTransport: params.needTransport,
    ...(params.needTransport && params.transportCommune && { transportCommune: params.transportCommune }),
  }

  const res = await fetch(`${API_BASE}/api/hotels/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTrackingHeaders(),
      ...(params.token && { "Authorization": `Bearer ${params.token}` }),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`)
  }

  return res.json()
}

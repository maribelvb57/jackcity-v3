export type PetSize = "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE"

export type HotelBenefit = {
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
  region: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  email: string | null
  avgRating: number | null
  reviewsCount: number | null
  petSizes: string[]
  mainBenefits: HotelBenefit[]
  pricing: HotelPricing | null
  transport: HotelTransport | null
}

const PET_SIZE_MAP: Record<string, PetSize> = {
  "Pequeño": "SMALL",
  "Mediano": "MEDIUM",
  "Grande": "LARGE",
  "Extra Grande": "EXTRA_LARGE",
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

const API_BASE = "http://localhost:8080"

export async function searchHotels(params: {
  city: string
  mascotas: { tamano: string }[]
  startDate: Date
  endDate: Date
  needTransport: boolean
}): Promise<Hotel[]> {
  const body = {
    city: params.city,
    pets: params.mascotas.map((m) => ({ size: PET_SIZE_MAP[m.tamano] ?? "SMALL" })),
    startDate: formatDate(params.startDate),
    endDate: formatDate(params.endDate),
    needTransport: params.needTransport,
    ...(params.needTransport && { communeCode: "SMI" }),
  }

  const res = await fetch(`${API_BASE}/api/hotels/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`)
  }

  return res.json()
}

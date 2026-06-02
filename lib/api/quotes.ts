import type { PetPayload } from "./hotel-detail"

const API_BASE = "http://localhost:8080"

export type QuoteHotel = {
  id: string
  name: string
  addressStreet: string
  commune: string
  mainPhotoUrl: string | null
  checkinTime: string | null
  checkoutTime: string | null
  policies: { description: string; confirmationRequired: boolean }[]
}

export type Quote = {
  quoteId: string
  hotel: QuoteHotel
  pricing: {
    bookingPrice: number
    transportPrice: number
    totalPrice: number
  }
  transport: {
    departureSlots: string[]
    returnSlots: string[]
  }
  pets: PetPayload[]
  checkinDate: string
  checkoutDate: string
  needsTransport: boolean
  transportCommune: string | null
}

export async function createQuote(params: {
  hotelId: string
  city: string
  pets: PetPayload[]
  checkinDate: string
  checkoutDate: string
  needsTransport: boolean
  transportBy?: string
  transportCommune?: string
  searchId: string
  listIndex: number
}): Promise<Quote> {
  const body: Record<string, unknown> = {
    hotelId: params.hotelId,
    city: params.city,
    checkinDate: params.checkinDate,
    checkoutDate: params.checkoutDate,
    needsTransport: params.needsTransport,
    ...(params.transportBy && { transportBy: params.transportBy }),
    ...(params.needsTransport && params.transportCommune && { transportCommune: params.transportCommune }),
    searchId: params.searchId,
    listIndex: params.listIndex,
    pets: params.pets,
  }

  const res = await fetch(`${API_BASE}/api/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Create quote failed: ${res.status}`)
  return res.json()
}

export async function getQuote(quoteId: string): Promise<Quote> {
  const res = await fetch(`${API_BASE}/api/quotes/${quoteId}`)
  if (!res.ok) throw new Error(`Get quote failed: ${res.status}`)
  return res.json()
}
